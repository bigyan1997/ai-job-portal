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
    # --- JOB MANAGEMENT ---
    # Public feed of all jobs (GET) or Employer creating a job (POST)
    path('', JobListCreateView.as_view(), name='job-list'),
    
    # Detailed view, update, or deletion of a specific job
    path('<int:pk>/', JobDetailView.as_view(), name='job-detail'),

    # --- EMPLOYER ACTIONS ---
    # List of jobs posted by the currently logged-in employer
    path('my-jobs/', MyJobsListView.as_view(), name='my-jobs'),
    
    # View all candidates who applied for a specific job
    path('<int:job_id>/applications/', JobApplicationsListView.as_view(), name='job-applications'),
    
    # Employer action to change application status (Shortlisted, Rejected, etc.)
    path('applications/<int:pk>/status/', UpdateApplicationStatusView.as_view(), name='update-status'),

    # --- JOB SEEKER ACTIONS ---
    # Submit a new application with a resume
    path('apply/', ApplyJobView.as_view(), name='apply-job'),
    
    # List of all jobs the current seeker has applied for
    path('my-applications/', MyApplicationsListView.as_view(), name='my-applications'),
    
    # Bookmark or un-bookmark a job
    path('<int:pk>/save/', ToggleSaveJobView.as_view(), name='toggle-save-job'),
    
    # List of all bookmarked jobs
    path('saved/', MySavedJobsListView.as_view(), name='my-saved-jobs'),

    # --- NOTIFICATIONS ---
    # Real-time alert history for the logged-in user
    path('notifications/', NotificationListView.as_view(), name='notifications'),
    
    # Mark a notification as read or delete it
    path('notifications/<int:pk>/', NotificationDetailView.as_view(), name='notification-delete'),
    
    # This handles general detail/delete
    path('notifications/<int:pk>/', NotificationDetailView.as_view(), name='notification-detail'),

    # ADD THIS: Specific endpoint for marking as read
    path('notifications/<int:pk>/read/', NotificationDetailView.as_view(), name='notification-read'),

    # Withdraw an application (Seeker action)
    path('applications/withdraw/<int:job_id>/', WithdrawApplicationView.as_view(), name='withdraw-application'),

    path('<int:job_id>/withdrawal-history/', JobWithdrawalHistoryView.as_view(), name='job-withdrawal-history'),

    path('optimize-resume/', OptimizeResumeView.as_view(), name='optimize-resume'),

    path('analyze-resume/', AnalyzeResumeView.as_view(), name='analyze-resume'),

    path('generate-cover-letter/', GenerateCoverLetterView.as_view(), name='generate-cover-letter'),

    path('all-withdrawals/', GlobalWithdrawalHistoryView.as_view(), name='global-withdrawal-history'),

]