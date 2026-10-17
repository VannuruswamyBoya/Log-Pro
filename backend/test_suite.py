import os
import sys
import io
import time
import json
from datetime import datetime, timezone

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'logpro_backend.settings')
import django
django.setup()

from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import exceptions

from core.db import get_users_col, get_submissions_col, get_settings_col
from core.authentication import generate_tokens, MongoUser
from core.deadline_policy import get_countdown_info, evaluate_submission_status
from core.file_validator import validate_uploaded_file

# Import views
from core.views_auth import LoginView, RefreshTokenView, ProfileView
from core.views_submission import (
    TodayStatusView, 
    UploadSubmissionView, 
    UserSubmissionHistoryView,
    DownloadSubmissionFileView
)
from core.views_admin import (
    AdminDashboardStatsView,
    AdminAllSubmissionsView,
    AdminUsersListView,
    AdminToggleUserStatusView,
    AdminSystemSettingsView
)
from core.views_reports import (
    WeeklyReportSummaryView,
    ExportReportCSVView,
    ExportReportExcelView,
    ExportReportPDFView
)

class TestRunner:
    def __init__(self):
        self.rf = APIRequestFactory()
        self.passed = 0
        self.failed = 0
        self.tests = []
        self.users_col = get_users_col()
        self.submissions_col = get_submissions_col()
        self.settings_col = get_settings_col()

        # Load test users
        self.admin_user_doc = self.users_col.find_one({'email': 'admin@logpro.com'})
        self.user_doc = self.users_col.find_one({'email': 'john.doe@company.com'})
        self.user2_doc = self.users_col.find_one({'email': 'sarah.jenkins@company.com'})

        if not self.admin_user_doc or not self.user_doc:
            print("ERROR: Admin or test user not found. Run seed_data.py first!")
            sys.exit(1)

        self.admin_tokens = generate_tokens(self.admin_user_doc)
        self.user_tokens = generate_tokens(self.user_doc)
        self.user2_tokens = generate_tokens(self.user2_doc)
        self.admin_user = MongoUser(self.admin_user_doc)
        self.regular_user = MongoUser(self.user_doc)
        self.user2 = MongoUser(self.user2_doc)

    def run_test(self, test_id, name, test_func):
        t0 = time.time()
        try:
            test_func()
            elapsed = round((time.time() - t0) * 1000, 2)
            self.passed += 1
            print(f"  \033[92m[PASS]\033[0m {test_id}: {name} ({elapsed} ms)")
            self.tests.append({'id': test_id, 'name': name, 'status': 'PASS', 'elapsed': elapsed})
        except Exception as e:
            elapsed = round((time.time() - t0) * 1000, 2)
            self.failed += 1
            print(f"  \033[91m[FAIL]\033[0m {test_id}: {name} ({elapsed} ms) -> Error: {e}")
            self.tests.append({'id': test_id, 'name': name, 'status': 'FAIL', 'elapsed': elapsed, 'error': str(e)})

    # ==================== SUITE 1: AUTHENTICATION & RBAC ====================

    def test_tc01_login_admin_success(self):
        req = self.rf.post('/api/auth/login/', data={'identifier': 'admin@logpro.com', 'password': 'AdminPassword123!', 'portal': 'admin'}, format='json')
        res = LoginView.as_view()(req)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        assert 'access' in res.data and 'refresh' in res.data, "Missing JWT tokens"
        assert res.data['user']['role'] == 'admin', "User role mismatch"

    def test_tc02_login_user_success(self):
        req = self.rf.post('/api/auth/login/', data={'identifier': 'john.doe@company.com', 'password': 'UserPassword123!', 'portal': 'user'}, format='json')
        res = LoginView.as_view()(req)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        assert res.data['user']['role'] == 'user', "User role mismatch"

    def test_tc03_login_invalid_password(self):
        req = self.rf.post('/api/auth/login/', data={'identifier': 'john.doe@company.com', 'password': 'WrongPassword!', 'portal': 'user'}, format='json')
        res = LoginView.as_view()(req)
        assert res.status_code == 401, f"Expected 401 Unauthorized, got {res.status_code}"

    def test_tc04_portal_role_enforcement(self):
        # A normal employee should be rejected from the admin portal
        req = self.rf.post('/api/auth/login/', data={'identifier': 'john.doe@company.com', 'password': 'UserPassword123!', 'portal': 'admin'}, format='json')
        res = LoginView.as_view()(req)
        assert res.status_code == 403, f"Expected 403 Forbidden for non-admin on admin portal, got {res.status_code}"

    def test_tc05_token_refresh(self):
        refresh_token = self.user_tokens['refresh']
        req = self.rf.post('/api/auth/refresh/', data={'refresh': refresh_token}, format='json')
        res = RefreshTokenView.as_view()(req)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        assert 'access' in res.data, "New access token missing"

    def test_tc06_profile_get_and_update(self):
        req = self.rf.get('/api/auth/profile/', HTTP_AUTHORIZATION=f"Bearer {self.user_tokens['access']}")
        force_authenticate(req, user=self.regular_user)
        res = ProfileView.as_view()(req)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        assert res.data['email'] == 'john.doe@company.com'

        # Update full name
        req_put = self.rf.put('/api/auth/profile/', data={'full_name': 'John Doe Updated', 'department': 'Engineering'}, format='json', HTTP_AUTHORIZATION=f"Bearer {self.user_tokens['access']}")
        force_authenticate(req_put, user=self.regular_user)
        res_put = ProfileView.as_view()(req_put)
        assert res_put.status_code == 200, f"Expected 200 on update, got {res_put.status_code}"
        assert res_put.data['user']['full_name'] == 'John Doe Updated'

        # Revert back to original
        req_revert = self.rf.put('/api/auth/profile/', data={'full_name': 'John Doe', 'department': 'Engineering'}, format='json', HTTP_AUTHORIZATION=f"Bearer {self.user_tokens['access']}")
        force_authenticate(req_revert, user=self.regular_user)
        ProfileView.as_view()(req_revert)

    # ==================== SUITE 2: SUBMISSIONS & POLICIES ====================

    def test_tc07_countdown_and_status(self):
        req = self.rf.get('/api/submissions/status/today/', HTTP_AUTHORIZATION=f"Bearer {self.user_tokens['access']}")
        force_authenticate(req, user=self.regular_user)
        res = TodayStatusView.as_view()(req)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        assert 'countdown' in res.data, "Missing countdown timer data"
        assert 'summary' in res.data, "Missing summary statistics"
        assert res.data['countdown']['hours'] >= 0, "Invalid hours count"

    def test_tc08_file_validator_invalid_ext(self):
        bad_file = SimpleUploadedFile("malware.exe", b"MZexecutabledata", content_type="application/x-dosexec")
        try:
            validate_uploaded_file(bad_file)
            assert False, "Should have thrown ValidationError for .exe file"
        except exceptions.ValidationError as e:
            assert "not permitted" in str(e).lower()

    def test_tc09_file_validator_magic_bytes(self):
        # A file named .pdf but containing plain corrupted/fake text instead of %PDF- header
        fake_pdf = SimpleUploadedFile("fake.pdf", b"This is not a real PDF file header", content_type="application/pdf")
        try:
            validate_uploaded_file(fake_pdf)
            assert False, "Should have detected magic signature mismatch"
        except exceptions.ValidationError as e:
            assert "mismatch" in str(e).lower()

    def test_tc10_upload_log_sheet(self):
        # Clean today's record for john.doe if any exists so upload starts fresh
        today_str = datetime.now().strftime('%Y-%m-%d')
        self.submissions_col.delete_many({'user_id': self.regular_user.id, 'business_date': today_str})

        sample_txt = SimpleUploadedFile("daily_activity.txt", b"Task completed: Built DRF API and configured MongoDB Atlas connection.\nHours logged: 8 hours.", content_type="text/plain")
        req = self.rf.post('/api/submissions/upload/', data={'file': sample_txt, 'notes': 'Test upload note'}, format='multipart', HTTP_AUTHORIZATION=f"Bearer {self.user_tokens['access']}")
        force_authenticate(req, user=self.regular_user)
        res = UploadSubmissionView.as_view()(req)
        assert res.status_code == 201, f"Expected 201 Created, got {res.status_code}"
        assert res.data['version'] == 1, "Initial version should be 1"

    def test_tc11_file_replacement_audit(self):
        # Uploading second file on same date should replace and bump version to 2
        sample_txt_v2 = SimpleUploadedFile("daily_activity_revised.txt", b"Revised Task: Finalized unit test suite and verified endpoints.\nHours logged: 8 hours.", content_type="text/plain")
        req = self.rf.post('/api/submissions/upload/', data={'file': sample_txt_v2, 'notes': 'Revised version note'}, format='multipart', HTTP_AUTHORIZATION=f"Bearer {self.user_tokens['access']}")
        force_authenticate(req, user=self.regular_user)
        res = UploadSubmissionView.as_view()(req)
        assert res.status_code == 200, f"Expected 200 on replacement, got {res.status_code}"
        assert res.data['version'] == 2, f"Expected version 2, got {res.data.get('version')}"

        # Verify previous version archived in database history
        today_str = datetime.now().strftime('%Y-%m-%d')
        doc = self.submissions_col.find_one({'user_id': self.regular_user.id, 'business_date': today_str})
        assert doc is not None
        assert len(doc.get('history', [])) == 1, "Expected 1 archived history entry"
        assert doc['history'][0]['version'] == 1, "Archived version should be v1"

    def test_tc12_download_permission(self):
        today_str = datetime.now().strftime('%Y-%m-%d')
        doc = self.submissions_col.find_one({'user_id': self.regular_user.id, 'business_date': today_str})
        assert doc is not None, "Submission record missing"
        sub_id = str(doc['_id'])

        # 1. Owner download -> SUCCESS
        req_owner = self.rf.get(f'/api/submissions/{sub_id}/download/', HTTP_AUTHORIZATION=f"Bearer {self.user_tokens['access']}")
        force_authenticate(req_owner, user=self.regular_user)
        res_owner = DownloadSubmissionFileView.as_view()(req_owner, submission_id=sub_id)
        assert res_owner.status_code == 200, f"Expected 200 for owner, got {res_owner.status_code}"

        # 2. Unauthorized other user download -> 403 Forbidden
        req_other = self.rf.get(f'/api/submissions/{sub_id}/download/', HTTP_AUTHORIZATION=f"Bearer {self.user2_tokens['access']}")
        force_authenticate(req_other, user=self.user2)
        res_other = DownloadSubmissionFileView.as_view()(req_other, submission_id=sub_id)
        assert res_other.status_code == 403, f"Expected 403 Forbidden for unauthorized user, got {res_other.status_code}"

        # 3. Admin download -> 200 Success
        req_admin = self.rf.get(f'/api/submissions/{sub_id}/download/', HTTP_AUTHORIZATION=f"Bearer {self.admin_tokens['access']}")
        force_authenticate(req_admin, user=self.admin_user)
        res_admin = DownloadSubmissionFileView.as_view()(req_admin, submission_id=sub_id)
        assert res_admin.status_code == 200, f"Expected 200 for admin, got {res_admin.status_code}"

    # ==================== SUITE 3: ADMINISTRATION & ANALYTICS ====================

    def test_tc13_admin_dashboard_metrics(self):
        req = self.rf.get('/api/admin/dashboard/', HTTP_AUTHORIZATION=f"Bearer {self.admin_tokens['access']}")
        force_authenticate(req, user=self.admin_user)
        res = AdminDashboardStatsView.as_view()(req)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        assert 'today_summary' in res.data, "Missing today_summary"
        assert 'trends_7d' in res.data, "Missing trends_7d"
        assert 'department_breakdown' in res.data, "Missing department_breakdown"
        assert len(res.data['trends_7d']) == 7, "Expected 7 days in trend chart"

    def test_tc14_admin_all_submissions(self):
        req = self.rf.get('/api/admin/submissions/?status=ON_TIME', HTTP_AUTHORIZATION=f"Bearer {self.admin_tokens['access']}")
        force_authenticate(req, user=self.admin_user)
        res = AdminAllSubmissionsView.as_view()(req)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        assert 'results' in res.data, "Missing results list"
        assert res.data['count'] >= 1, "Expected submissions in database"

    def test_tc15_admin_create_user(self):
        temp_email = f"test.user.{int(time.time())}@company.com"
        new_user_payload = {
            'full_name': 'Test Engineer',
            'email': temp_email,
            'username': f"testuser_{int(time.time())}",
            'password': 'TempPassword123!',
            'department': 'Quality Assurance',
            'employee_id': 'QA-9999',
            'role': 'user'
        }
        req = self.rf.post('/api/admin/users/', data=new_user_payload, format='json', HTTP_AUTHORIZATION=f"Bearer {self.admin_tokens['access']}")
        force_authenticate(req, user=self.admin_user)
        res = AdminUsersListView.as_view()(req)
        assert res.status_code == 201, f"Expected 201 Created, got {res.status_code}"
        assert res.data['user']['email'] == temp_email

        # Clean up temp user
        self.users_col.delete_one({'email': temp_email})

    def test_tc16_admin_toggle_user_status(self):
        user_id = str(self.user2_doc['_id'])
        req = self.rf.patch(f'/api/admin/users/{user_id}/toggle-status/', HTTP_AUTHORIZATION=f"Bearer {self.admin_tokens['access']}")
        force_authenticate(req, user=self.admin_user)
        res = AdminToggleUserStatusView.as_view()(req, user_id=user_id)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"

        # Toggle back to original active
        req2 = self.rf.patch(f'/api/admin/users/{user_id}/toggle-status/', HTTP_AUTHORIZATION=f"Bearer {self.admin_tokens['access']}")
        force_authenticate(req2, user=self.admin_user)
        res2 = AdminToggleUserStatusView.as_view()(req2, user_id=user_id)
        assert res2.status_code == 200
        assert res2.data['is_active'] == True

    def test_tc17_admin_settings_update(self):
        req_get = self.rf.get('/api/admin/settings/', HTTP_AUTHORIZATION=f"Bearer {self.admin_tokens['access']}")
        force_authenticate(req_get, user=self.admin_user)
        res_get = AdminSystemSettingsView.as_view()(req_get)
        assert res_get.status_code == 200, f"Expected 200, got {res_get.status_code}"

        # Update deadline setting
        req_put = self.rf.put('/api/admin/settings/', data={'daily_deadline': '17:30', 'allow_replacement_before_deadline': True}, format='json', HTTP_AUTHORIZATION=f"Bearer {self.admin_tokens['access']}")
        force_authenticate(req_put, user=self.admin_user)
        res_put = AdminSystemSettingsView.as_view()(req_put)
        assert res_put.status_code == 200, f"Expected 200 on settings update, got {res_put.status_code}"

        # Revert back to 17:00
        req_rev = self.rf.put('/api/admin/settings/', data={'daily_deadline': '17:00'}, format='json', HTTP_AUTHORIZATION=f"Bearer {self.admin_tokens['access']}")
        force_authenticate(req_rev, user=self.admin_user)
        AdminSystemSettingsView.as_view()(req_rev)

    # ==================== SUITE 4: REPORTS & EXPORTS ====================

    def test_tc18_weekly_report_summary(self):
        req = self.rf.get('/api/reports/weekly/', HTTP_AUTHORIZATION=f"Bearer {self.admin_tokens['access']}")
        force_authenticate(req, user=self.admin_user)
        res = WeeklyReportSummaryView.as_view()(req)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        assert 'kpis' in res.data, "Missing kpis object"
        assert 'user_breakdown' in res.data, "Missing user_breakdown"

    def test_tc19_export_csv(self):
        req = self.rf.get('/api/reports/export/csv/', HTTP_AUTHORIZATION=f"Bearer {self.admin_tokens['access']}")
        force_authenticate(req, user=self.admin_user)
        res = ExportReportCSVView.as_view()(req)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        assert res.headers['Content-Type'] == 'text/csv'
        assert b'Submission ID' in res.content
        assert b'Business Date' in res.content

    def test_tc20_export_excel(self):
        req = self.rf.get('/api/reports/export/excel/', HTTP_AUTHORIZATION=f"Bearer {self.admin_tokens['access']}")
        force_authenticate(req, user=self.admin_user)
        res = ExportReportExcelView.as_view()(req)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        assert 'spreadsheetml' in res.headers['Content-Type']
        # Valid xlsx zip archive starts with PK\x03\x04
        assert res.content.startswith(b'PK\x03\x04'), "Not a valid Excel XLSX binary stream"

    def test_tc21_export_pdf(self):
        req = self.rf.get('/api/reports/export/pdf/', HTTP_AUTHORIZATION=f"Bearer {self.admin_tokens['access']}")
        force_authenticate(req, user=self.admin_user)
        res = ExportReportPDFView.as_view()(req)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        assert res.headers['Content-Type'] == 'application/pdf'
        # Valid PDF starts with %PDF-
        assert res.content.startswith(b'%PDF-'), "Not a valid PDF binary stream"

    def execute_all(self):
        print("\n=================================================================")
        print("  LOG PRO ENTERPRISE - AUTOMATED TEST SUITE EXECUTION")
        print(f"  Target: MongoDB Atlas ({self.settings_col.database.name})")
        print(f"  Timestamp: {datetime.now(timezone.utc).isoformat()}")
        print("=================================================================\n")

        print("--- SUITE 1: AUTHENTICATION & RBAC SECURITY ---")
        self.run_test("TC-01", "Admin Login with Valid Credentials", self.test_tc01_login_admin_success)
        self.run_test("TC-02", "Employee Login with Valid Credentials", self.test_tc02_login_user_success)
        self.run_test("TC-03", "Reject Login with Invalid Password (401)", self.test_tc03_login_invalid_password)
        self.run_test("TC-04", "Enforce Portal Role Separation (403 for User on Admin Portal)", self.test_tc04_portal_role_enforcement)
        self.run_test("TC-05", "JWT Refresh Token Endpoint", self.test_tc05_token_refresh)
        self.run_test("TC-06", "Get and Update User Profile", self.test_tc06_profile_get_and_update)

        print("\n--- SUITE 2: SUBMISSIONS & DEADLINE POLICIES ---")
        self.run_test("TC-07", "Live Countdown Timer Data & Status Query", self.test_tc07_countdown_and_status)
        self.run_test("TC-08", "Reject Invalid File Extension (.exe)", self.test_tc08_file_validator_invalid_ext)
        self.run_test("TC-09", "Detect Mismatched Binary Magic Bytes", self.test_tc09_file_validator_magic_bytes)
        self.run_test("TC-10", "Upload Daily Log Sheet (v1 Created)", self.test_tc10_upload_log_sheet)
        self.run_test("TC-11", "Replace Log Sheet with Audit Trail (v2 + v1 Archived)", self.test_tc11_file_replacement_audit)
        self.run_test("TC-12", "Secure Download Authorization Check (Owner/Admin allowed, Others 403)", self.test_tc12_download_permission)

        print("\n--- SUITE 3: ADMINISTRATION & ANALYTICS ---")
        self.run_test("TC-13", "Admin Dashboard KPI & 7-Day Trends Analytics", self.test_tc13_admin_dashboard_metrics)
        self.run_test("TC-14", "Admin All Submissions Query & Filter", self.test_tc14_admin_all_submissions)
        self.run_test("TC-15", "Admin Provision New Employee Account", self.test_tc15_admin_create_user)
        self.run_test("TC-16", "Admin Toggle User Status (Deactivate & Activate)", self.test_tc16_admin_toggle_user_status)
        self.run_test("TC-17", "Admin System Settings Configuration", self.test_tc17_admin_settings_update)

        print("\n--- SUITE 4: REPORTS & MULTI-FORMAT EXPORTS ---")
        self.run_test("TC-18", "Weekly Compliance Report JSON Summary", self.test_tc18_weekly_report_summary)
        self.run_test("TC-19", "Export Report to CSV Stream", self.test_tc19_export_csv)
        self.run_test("TC-20", "Export Styled Excel Workbook (.xlsx) with OpenPyXL", self.test_tc20_export_excel)
        self.run_test("TC-21", "Export Executive PDF Document with ReportLab", self.test_tc21_export_pdf)

        print("\n=================================================================")
        print(f"  TEST RESULTS: {self.passed} PASSED | {self.failed} FAILED | TOTAL: {self.passed + self.failed}")
        print("=================================================================\n")
        return self.failed == 0

if __name__ == '__main__':
    runner = TestRunner()
    success = runner.execute_all()
    sys.exit(0 if success else 1)
