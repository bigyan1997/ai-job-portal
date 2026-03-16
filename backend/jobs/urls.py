from django.urls import path
from .views import (
    JobListCreateView, 
    MyApplicationsListView, 
    MyJobsListView, 
    JobDetailView, 
    ToggleSaveJobView, 
    MySavedJobsListView, 
    ApplyJobView, 
    JobApplicationsListView, 
    UpdateApplicationStatusView, 
    NotificationListView, 
    NotificationDetailView,
    WithdrawApplicationView,
    OptimizeResumeView,
    AnalyzeResumeView,
    GenerateCoverLetterView,
    JobWithdrawalHistoryView,
    GlobalWithdrawalHistoryView
)

urlpatterns = [
    # Job list and create
    path('', JobListCreateView.as_view(), name='job-list'),

    # Employer dashboard
    path('my-jobs/', MyJobsListView.as_view(), name='my-jobs'),
    path('<int:job_id>/applications/', JobApplicationsListView.as_view(), name='job-applications'),
    path('applications/<int:pk>/status/', UpdateApplicationStatusView.as_view(), name='update-status'),
    path('<int:job_id>/withdrawal-history/', JobWithdrawalHistoryView.as_view(), name='job-withdrawal-history'),
    path('all-withdrawals/', GlobalWithdrawalHistoryView.as_view(), name='global-withdrawal-history'),

    # Job seeker actions
    path('apply/', ApplyJobView.as_view(), name='apply-job'),
    path('my-applications/', MyApplicationsListView.as_view(), name='my-applications'),
    path('<int:pk>/save/', ToggleSaveJobView.as_view(), name='toggle-save-job'),
    path('saved/', MySavedJobsListView.as_view(), name='my-saved-jobs'),
    path('applications/withdraw/<int:job_id>/', WithdrawApplicationView.as_view(), name='withdraw-application'),

    # AI tools
    path('analyze-resume/', AnalyzeResumeView.as_view(), name='analyze-resume'),
    path('optimize-resume/', OptimizeResumeView.as_view(), name='optimize-resume'),
    path('generate-cover-letter/', GenerateCoverLetterView.as_view(), name='generate-cover-letter'),

    # Notifications
    path('notifications/', NotificationListView.as_view(), name='notifications'),
    path('notifications/<int:pk>/', NotificationDetailView.as_view(), name='notification-detail'),
    path('notifications/<int:pk>/read/', NotificationDetailView.as_view(), name='notification-read'),

    # Keep this LAST
    path('<int:pk>/', JobDetailView.as_view(), name='job-detail'),

]