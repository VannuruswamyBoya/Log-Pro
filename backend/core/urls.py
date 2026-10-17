from django.urls import path
from core.views_auth import LoginView, RefreshTokenView, ProfileView, LogoutView
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

urlpatterns = [
    # Authentication endpoints
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/refresh/', RefreshTokenView.as_view(), name='auth-refresh'),
    path('auth/profile/', ProfileView.as_view(), name='auth-profile'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),

    # User submission endpoints
    path('submissions/status/today/', TodayStatusView.as_view(), name='submission-today-status'),
    path('submissions/upload/', UploadSubmissionView.as_view(), name='submission-upload'),
    path('submissions/my-history/', UserSubmissionHistoryView.as_view(), name='submission-my-history'),
    path('submissions/<str:submission_id>/download/', DownloadSubmissionFileView.as_view(), name='submission-download'),

    # Admin endpoints
    path('admin/dashboard/', AdminDashboardStatsView.as_view(), name='admin-dashboard'),
    path('admin/submissions/', AdminAllSubmissionsView.as_view(), name='admin-submissions'),
    path('admin/users/', AdminUsersListView.as_view(), name='admin-users'),
    path('admin/users/<str:user_id>/toggle-status/', AdminToggleUserStatusView.as_view(), name='admin-toggle-user-status'),
    path('admin/settings/', AdminSystemSettingsView.as_view(), name='admin-settings'),

    # Report endpoints
    path('reports/weekly/', WeeklyReportSummaryView.as_view(), name='reports-weekly'),
    path('reports/export/csv/', ExportReportCSVView.as_view(), name='reports-export-csv'),
    path('reports/export/excel/', ExportReportExcelView.as_view(), name='reports-export-excel'),
    path('reports/export/pdf/', ExportReportPDFView.as_view(), name='reports-export-pdf'),
]
