from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Job, SavedJob, Application, Notification
from .serializers import JobSerializer, ApplicationSerializer, NotificationSerializer


# --- JOB VIEWS (PUBLIC & EMPLOYER) ---

class JobListCreateView(generics.ListCreateAPIView):
    """
    GET: Public feed of all active jobs.
    POST: Authenticated Employers create new job listings.
    """
    queryset = Job.objects.filter(is_active=True).order_by('-created_at')
    serializer_class = JobSerializer
    
    def perform_create(self, serializer):
        # Tie the job to the currently logged-in employer
        serializer.save(employer=self.request.user)

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]


class MyJobsListView(generics.ListAPIView):
    """
    Returns only the jobs posted by the logged-in employer.
    Supports searching by title or location via query parameters.
    """
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Job.objects.filter(employer=self.request.user)
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(location__icontains=search)
            )
        return queryset.order_by('-created_at')


class JobDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Handles viewing, updating, and deleting individual jobs.
    Security: Anyone can view, but only the owner can update/delete.
    """
    queryset = Job.objects.all()
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        # For destructive actions, restrict the queryset to the user's own jobs
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return Job.objects.filter(employer=self.request.user)
        return Job.objects.all()

# --- JOB SEEKER ACTIONS ---

class ToggleSaveJobView(APIView):
    """
    POST: Bookmarks or un-bookmarks a job for the current seeker.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            job = Job.objects.get(pk=pk)
            # Toggle logic: If exists, delete; if not, create.
            saved_job, created = SavedJob.objects.get_or_create(user=request.user, job=job)
            
            if not created:
                saved_job.delete()
                return Response({"status": "unposted"}, status=status.HTTP_200_OK)
            
            return Response({"status": "saved"}, status=status.HTTP_201_CREATED)
        except Job.DoesNotExist:
            return Response({"error": "Job not found"}, status=status.HTTP_404_NOT_FOUND)


class MySavedJobsListView(generics.ListAPIView):
    """Returns the list of jobs bookmarked by the seeker."""
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Job.objects.filter(saved_by_users__user=self.request.user).order_by('-created_at')


class ApplyJobView(generics.CreateAPIView):
    """
    Handles resume submission. 
    Triggers the AI Match logic automatically via signals in models.py.
    """
    queryset = Application.objects.all()
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser) # Supports PDF file upload

    def perform_create(self, serializer):
        serializer.save(seeker=self.request.user)


class MyApplicationsListView(generics.ListAPIView):
    """Returns all applications submitted by the logged-in seeker."""
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Application.objects.filter(seeker=self.request.user).order_by('-applied_on')

# --- EMPLOYER DASHBOARD LOGIC ---

class JobApplicationsListView(generics.ListAPIView):
    """
    Lists all candidates for a specific job.
    Sorted by match_score DESC to show AI-recommended candidates first.
    """
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        job_id = self.kwargs['job_id']
        return Application.objects.filter(
            job_id=job_id, 
            job__employer=self.request.user
        ).order_by('-match_score')


class UpdateApplicationStatusView(generics.UpdateAPIView):
    """Allows employers to move candidates through the hiring pipeline."""
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Application.objects.filter(job__employer=self.request.user)

# --- NOTIFICATIONS ---

class NotificationListView(generics.ListAPIView):
    """Fetch, Mark-as-read, or Clear all notifications."""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')
    
    def post(self, request, *args, **kwargs):
        # Bulk mark as read for the notification bell badge cleanup
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"message": "Notifications marked as read"}, status=status.HTTP_200_OK)
    
    def delete(self, request):
        Notification.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class NotificationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Handles operations on a single notification:
    - GET: View details
    - PATCH: Mark as read (is_read=True)
    - DELETE: Remove the notification
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Ensure users can only interact with their own notifications
        return Notification.objects.filter(user=self.request.user)


class WithdrawApplicationView(APIView):
    def delete(self, request, job_id):
        # Look for the application for User ID 8 (Bina) or 9 (Bigyan)
        application = Application.objects.filter(seeker=request.user, job_id=job_id).first()
        
        if application:
            application.delete()
            return Response({"message": "Deleted"}, status=status.HTTP_204_NO_CONTENT)
        
        return Response({"error": "Not Found"}, status=status.HTTP_404_NOT_FOUND)