from django.db import models
from django.conf import settings
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

# Internal project imports
from .utils import extract_text_from_pdf, get_match_score

class Job(models.Model):
    """
    Represents a job vacancy posted by an Employer.
    """
    employer = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='jobs'
    )
    title = models.CharField(max_length=255)
    company_name = models.CharField(max_length=255)
    description = models.TextField()
    location = models.CharField(max_length=100)
    salary_range = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} at {self.company_name}"


class SavedJob(models.Model):
    """
    Intersection model allowing Job Seekers to bookmark jobs for later.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="saved_jobs"
    )
    job = models.ForeignKey(
        Job, 
        on_delete=models.CASCADE, 
        related_name="saved_by_users"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'job')


class Application(models.Model):
    """
    Represents a candidate's application for a specific job.
    Stores the AI Match Score and the uploaded resume.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('shortlisted', 'Shortlisted'),
        ('rejected', 'Rejected'),
        ('hired', 'Hired'),
    ]
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="applications")
    seeker = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="my_applications"
    )
    resume = models.FileField(upload_to='resumes/')
    cover_letter = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    match_score = models.IntegerField(default=0)
    applied_on = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('job', 'seeker')

    def __str__(self):
        return f"{self.seeker.email} -> {self.job.title}"


class Notification(models.Model):
    """
    Logs alerts for users (e.g., Application updates or new matches).
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="notifications"
    )
    application = models.ForeignKey(Application, on_delete=models.CASCADE, null=True, blank=True)
    message = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

# --- SIGNALS & AI LOGIC ---

@receiver(pre_save, sender=Application)
def create_status_notification(sender, instance, **kwargs):
    """
    Detects changes in application status and creates a database notification.
    """
    if instance.id:
        try:
            old_instance = Application.objects.get(pk=instance.pk)
            if old_instance.status != instance.status:
                Notification.objects.create(
                    user=instance.seeker,
                    application=instance,
                    message=f"Your application for '{instance.job.title}' is now '{instance.get_status_display()}'."
                )
        except Application.DoesNotExist:
            pass

@receiver(post_save, sender=Notification)
def push_notification_to_websocket(sender, instance, created, **kwargs):
    if created:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{instance.user.id}", 
            {
                "type": "send_notification", 
                "notification_type": "STATUS_UPDATE",
                "message": instance.message,
                "id": instance.id,  # <-- ADD THIS LINE
                "job_id": instance.application.job.id if instance.application else None
            }
        )

@receiver(post_save, sender=Application)
def trigger_ai_matching(sender, instance, created, **kwargs):
    """
    Background logic to process resumes via PyPDF2 and Scikit-Learn
    whenever a new application is submitted.
    """
    if created and instance.resume:
        # Use .update() to avoid re-triggering save signals
        try:
            resume_text = extract_text_from_pdf(instance.resume.open())
            score = get_match_score(instance.job.description, resume_text)
            
            Application.objects.filter(pk=instance.pk).update(match_score=score)
            
            # Send immediate WebSocket feedback about the match score
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"user_{instance.seeker.id}",
                {
                    "type": "send_notification",
                    "notification_type": "AI_SCORE_CALCULATED",
                    "message": f"AI Match Score for {instance.job.title}: {score}%"
                }
            )
        except Exception as e:
            print(f"Error in AI Calculation: {e}")