from datetime import datetime, timedelta, timezone
from bson import ObjectId
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.hashers import make_password

from core.db import (
    get_users_col, 
    get_submissions_col, 
    get_settings_col, 
    get_audit_logs_col,
    log_audit_event
)
from core.permissions import IsMongoAdmin
from core.deadline_policy import get_current_business_date, get_deadline_config
from core.views_auth import get_client_ip

class AdminDashboardStatsView(APIView):
    """
    Returns administrative dashboard summary metrics, 7-day trend data,
    department statistics, and recent activity.
    """
    permission_classes = [IsMongoAdmin]

    def get(self, request):
        users_col = get_users_col()
        submissions_col = get_submissions_col()

        # Only regular users are expected to submit daily log sheets
        regular_users_query = {'role': 'user', 'is_active': True}
        total_regular_users = users_col.count_documents(regular_users_query)

        now = datetime.now()
        today_date = get_current_business_date(now)

        # Today's submissions
        today_subs = list(submissions_col.find({'business_date': today_date, 'is_active': True}))
        submitted_user_ids = {sub['user_id'] for sub in today_subs}
        submitted_count = len(submitted_user_ids)
        
        on_time_today = sum(1 for sub in today_subs if sub.get('status') == 'ON_TIME')
        late_today = sum(1 for sub in today_subs if sub.get('status') == 'LATE')
        missing_today = max(0, total_regular_users - submitted_count)

        compliance_rate_today = (
            round((on_time_today / total_regular_users * 100), 1)
            if total_regular_users > 0 else 0.0
        )

        # 7-day submission trends
        trends_7d = []
        for i in range(6, -1, -1):
            day_dt = now - timedelta(days=i)
            day_str = day_dt.strftime('%Y-%m-%d')
            day_label = day_dt.strftime('%a %b %d')

            day_subs = list(submissions_col.find({'business_date': day_str, 'is_active': True}))
            day_submitted_ids = {s['user_id'] for s in day_subs}
            day_on_time = sum(1 for s in day_subs if s.get('status') == 'ON_TIME')
            day_late = sum(1 for s in day_subs if s.get('status') == 'LATE')
            day_missing = max(0, total_regular_users - len(day_submitted_ids))

            trends_7d.append({
                'date': day_str,
                'label': day_label,
                'on_time': day_on_time,
                'late': day_late,
                'missing': day_missing,
                'total_submitted': len(day_submitted_ids)
            })

        # Department Breakdown
        departments = users_col.distinct('department', regular_users_query)
        dept_stats = []
        for dept in departments:
            if not dept:
                continue
            dept_users = list(users_col.find({'department': dept, 'role': 'user', 'is_active': True}))
            dept_user_count = len(dept_users)
            dept_user_ids = [str(u['_id']) for u in dept_users]
            
            dept_today_subs = submissions_col.count_documents({
                'user_id': {'$in': dept_user_ids},
                'business_date': today_date,
                'is_active': True
            })
            dept_stats.append({
                'department': dept,
                'total_users': dept_user_count,
                'submitted_today': dept_today_subs,
                'completion_pct': round((dept_today_subs / dept_user_count * 100), 1) if dept_user_count > 0 else 0
            })

        # Recent 10 submissions across all users
        recent_cursor = submissions_col.find({'is_active': True}).sort('upload_timestamp', -1).limit(10)
        recent_submissions = []
        for doc in recent_cursor:
            recent_submissions.append({
                'id': str(doc['_id']),
                'user_name': doc.get('user_name'),
                'user_email': doc.get('user_email'),
                'department': doc.get('department'),
                'business_date': doc.get('business_date'),
                'original_filename': doc.get('original_filename'),
                'file_format': doc.get('file_format'),
                'file_size': doc.get('file_size'),
                'upload_timestamp': doc.get('upload_timestamp'),
                'status': doc.get('status'),
                'version': doc.get('version', 1)
            })

        return Response({
            'today_summary': {
                'business_date': today_date,
                'total_users': total_regular_users,
                'submitted_today': submitted_count,
                'on_time_today': on_time_today,
                'late_today': late_today,
                'missing_today': missing_today,
                'compliance_rate': compliance_rate_today
            },
            'trends_7d': trends_7d,
            'department_breakdown': dept_stats,
            'recent_submissions': recent_submissions
        })

class AdminAllSubmissionsView(APIView):
    """
    Searchable, filterable list of all submissions across the enterprise.
    """
    permission_classes = [IsMongoAdmin]

    def get(self, request):
        submissions_col = get_submissions_col()
        query = {'is_active': True}

        # Filter by date or date range
        date_single = request.GET.get('date')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')

        if date_single:
            query['business_date'] = date_single
        elif start_date or end_date:
            date_filter = {}
            if start_date:
                date_filter['$gte'] = start_date
            if end_date:
                date_filter['$lte'] = end_date
            query['business_date'] = date_filter

        # Filter by status
        status_filter = request.GET.get('status')
        if status_filter and status_filter.upper() in ['ON_TIME', 'LATE']:
            query['status'] = status_filter.upper()

        # Filter by department
        dept_filter = request.GET.get('department')
        if dept_filter:
            query['department'] = dept_filter

        # Search by user name, email, or filename
        search = request.GET.get('search', '').strip()
        if search:
            query['$or'] = [
                {'user_name': {'$regex': search, '$options': 'i'}},
                {'user_email': {'$regex': search, '$options': 'i'}},
                {'original_filename': {'$regex': search, '$options': 'i'}},
                {'notes': {'$regex': search, '$options': 'i'}}
            ]

        cursor = submissions_col.find(query).sort('business_date', -1)
        items = []
        for doc in cursor:
            items.append({
                'id': str(doc['_id']),
                'user_id': doc.get('user_id'),
                'user_name': doc.get('user_name'),
                'user_email': doc.get('user_email'),
                'department': doc.get('department'),
                'employee_id': doc.get('employee_id', ''),
                'business_date': doc.get('business_date'),
                'original_filename': doc.get('original_filename'),
                'file_format': doc.get('file_format'),
                'file_size': doc.get('file_size'),
                'upload_timestamp': doc.get('upload_timestamp'),
                'status': doc.get('status'),
                'version': doc.get('version', 1),
                'notes': doc.get('notes', ''),
                'history': doc.get('history', [])
            })

        return Response({
            'count': len(items),
            'results': items
        })

class AdminUsersListView(APIView):
    """
    List, create, and manage registered users.
    """
    permission_classes = [IsMongoAdmin]

    def get(self, request):
        users_col = get_users_col()
        submissions_col = get_submissions_col()

        cursor = users_col.find().sort('created_at', -1)
        users_list = []
        for u in cursor:
            uid = str(u['_id'])
            # User submission compliance counts
            total_subs = submissions_col.count_documents({'user_id': uid, 'is_active': True})
            on_time = submissions_col.count_documents({'user_id': uid, 'status': 'ON_TIME', 'is_active': True})
            late = submissions_col.count_documents({'user_id': uid, 'status': 'LATE', 'is_active': True})

            last_sub = submissions_col.find_one(
                {'user_id': uid, 'is_active': True},
                sort=[('business_date', -1)]
            )

            users_list.append({
                'id': uid,
                'email': u.get('email'),
                'username': u.get('username'),
                'full_name': u.get('full_name'),
                'role': u.get('role', 'user'),
                'department': u.get('department', 'General'),
                'employee_id': u.get('employee_id', ''),
                'is_active': u.get('is_active', True),
                'created_at': u.get('created_at', ''),
                'total_submissions': total_subs,
                'on_time_submissions': on_time,
                'late_submissions': late,
                'compliance_rate': round((on_time / total_subs * 100), 1) if total_subs > 0 else 100.0,
                'last_submission_date': last_sub.get('business_date') if last_sub else 'Never'
            })

        return Response({'results': users_list})

    def post(self, request):
        users_col = get_users_col()
        data = request.data

        email = data.get('email', '').strip().lower()
        username = data.get('username', '').strip().lower()
        password = data.get('password', '').strip()
        full_name = data.get('full_name', '').strip()
        role = data.get('role', 'user').strip().lower()
        department = data.get('department', 'Engineering').strip()
        employee_id = data.get('employee_id', '').strip()

        if not email or not username or not password or not full_name:
            return Response(
                {'detail': 'Email, username, password, and full name are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if role not in ['user', 'admin']:
            return Response({'detail': 'Invalid role specified.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check existing email or username
        if users_col.find_one({'email': email}):
            return Response({'detail': f'A user with email {email} already exists.'}, status=status.HTTP_400_BAD_REQUEST)
        if users_col.find_one({'username': username}):
            return Response({'detail': f'A user with username {username} already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        now_iso = datetime.now(timezone.utc).isoformat()
        new_user = {
            'email': email,
            'username': username,
            'password_hash': make_password(password),
            'full_name': full_name,
            'role': role,
            'department': department,
            'employee_id': employee_id,
            'is_active': True,
            'created_at': now_iso,
            'updated_at': now_iso
        }

        res = users_col.insert_one(new_user)
        log_audit_event(
            request.user.id, request.user.email, 'USER_CREATED',
            {'created_user_id': str(res.inserted_id), 'email': email, 'role': role},
            get_client_ip(request)
        )

        return Response({
            'message': f"User '{full_name}' created successfully.",
            'user': {
                'id': str(res.inserted_id),
                'email': email,
                'username': username,
                'full_name': full_name,
                'role': role,
                'department': department,
                'employee_id': employee_id,
                'is_active': True
            }
        }, status=status.HTTP_201_CREATED)

class AdminToggleUserStatusView(APIView):
    """Enable or disable user account."""
    permission_classes = [IsMongoAdmin]

    def patch(self, request, user_id):
        users_col = get_users_col()
        try:
            oid = ObjectId(user_id)
            user_doc = users_col.find_one({'_id': oid})
        except Exception:
            user_doc = users_col.find_one({'_id': user_id})

        if not user_doc:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        if str(user_doc['_id']) == request.user.id:
            return Response({'detail': 'You cannot deactivate your own administrative account.'}, status=status.HTTP_400_BAD_REQUEST)

        new_status = not user_doc.get('is_active', True)
        users_col.update_one({'_id': user_doc['_id']}, {'$set': {'is_active': new_status}})

        log_audit_event(
            request.user.id, request.user.email, 'USER_STATUS_TOGGLED',
            {'target_user_id': str(user_doc['_id']), 'new_active_status': new_status},
            get_client_ip(request)
        )

        return Response({
            'message': f"User account has been {'activated' if new_status else 'deactivated'}.",
            'is_active': new_status
        })

class AdminSystemSettingsView(APIView):
    """
    Retrieve and update global system settings (daily deadline, max file size, file extensions).
    """
    permission_classes = [IsMongoAdmin]

    def get(self, request):
        settings_col = get_settings_col()
        cfg = settings_col.find_one({'key': 'global_config'}) or {}
        return Response({
            'daily_deadline': cfg.get('daily_deadline', '17:00'),
            'allow_replacement_before_deadline': cfg.get('allow_replacement_before_deadline', True),
            'max_file_size_mb': cfg.get('max_file_size_mb', 10),
            'allowed_extensions': cfg.get('allowed_extensions', ['pdf', 'doc', 'docx', 'txt']),
            'company_name': cfg.get('company_name', 'Log Pro Enterprise'),
            'updated_at': cfg.get('updated_at', ''),
            'updated_by': cfg.get('updated_by', '')
        })

    def put(self, request):
        settings_col = get_settings_col()
        data = request.data

        updates = {}
        if 'daily_deadline' in data:
            # validate HH:MM
            val = str(data['daily_deadline']).strip()
            parts = val.split(':')
            if len(parts) >= 2 and 0 <= int(parts[0]) <= 23 and 0 <= int(parts[1]) <= 59:
                updates['daily_deadline'] = f"{int(parts[0]):02d}:{int(parts[1]):02d}"
            else:
                return Response({'detail': 'Invalid deadline format. Use HH:MM.'}, status=status.HTTP_400_BAD_REQUEST)

        if 'allow_replacement_before_deadline' in data:
            updates['allow_replacement_before_deadline'] = bool(data['allow_replacement_before_deadline'])

        if 'max_file_size_mb' in data:
            val = int(data['max_file_size_mb'])
            if 1 <= val <= 100:
                updates['max_file_size_mb'] = val
            else:
                return Response({'detail': 'Max file size must be between 1 MB and 100 MB.'}, status=status.HTTP_400_BAD_REQUEST)

        if 'company_name' in data:
            updates['company_name'] = str(data['company_name']).strip()

        updates['updated_at'] = datetime.now(timezone.utc).isoformat()
        updates['updated_by'] = request.user.email

        settings_col.update_one({'key': 'global_config'}, {'$set': updates}, upsert=True)
        log_audit_event(
            request.user.id, request.user.email, 'SETTINGS_UPDATED',
            {'changes': updates},
            get_client_ip(request)
        )

        return Response({
            'message': 'System settings updated successfully.',
            'settings': updates
        })
