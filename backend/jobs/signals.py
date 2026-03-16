import logging
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Application, Notification

logger = logging.getLogger(__name__)

@receiver(pre_save, sender=Application)
def create_status_notification(sender, instance, **kwargs):
    """
    Status Tracker:
    Detects when an employer changes a candidate's status (e.g., Shortlisted).
    Creates a database Notification for the Seeker.
    """
    if instance.id:
        try:
            # Grab existing record to compare status
            old_instance = Application.objects.get(pk=instance.pk)
            if old_instance.status != instance.status:
                Notification.objects.create(
                    user=instance.seeker,
                    application=instance,
                    message=f"Update: Your application for '{instance.job.title}' is now '{instance.get_status_display()}'."
                )
        except Application.DoesNotExist:
            pass


@receiver(post_save, sender=Notification)
def push_notification_to_websocket(sender, instance, created, **kwargs):
    """
    The Postman (Real-Time Bridge):
    Pushes ANY new database Notification directly to the user's browser via WebSockets.
    """
    if created:
        channel_layer = get_channel_layer()
        
        # Determine the target Job ID for the frontend modal navigation
        # Useful for both Seekers (status updates) and Employers (new applicants)
        target_job_id = None
        if instance.application and instance.application.job:
            target_job_id = instance.application.job.id

        try:
            async_to_sync(channel_layer.group_send)(
                f"user_{instance.user.id}", 
                {
                    "type": "send_notification", 
                    "id": instance.id,
                    "message": instance.message,
                    "job_id": target_job_id,
                    "notification_type": "status_update" if "Update" in instance.message else "general"
                }
            )
            # Log for debugging - useful for monitoring Redis health
            print(f"📡 WebSocket Signal Sent -> User {instance.user.id}: {instance.message}")
        except Exception as e:
            logger.error(f"Failed to send WebSocket notification: {str(e)}")