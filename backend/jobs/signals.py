from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Application, Notification

@receiver(pre_save, sender=Application)
def create_status_notification(sender, instance, **kwargs):
    """Notifies seeker if Employer changes status (Shortlisted/Rejected)."""
    if instance.id:
        try:
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
    """The Postman: Pushes ANY new DB Notification to the browser via WebSockets."""
    if created:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{instance.user.id}", 
            {
                "type": "send_notification", 
                "message": instance.message,
                "id": instance.id,
                "job_id": instance.application.job.id if instance.application else None
            }
        )