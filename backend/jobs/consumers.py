import json
from channels.generic.websocket import AsyncWebsocketConsumer

class NotificationConsumer(AsyncWebsocketConsumer):
    """
    Handles real-time notifications for individual users.
    Used for alerting job seekers of match scores or employers of new applications.
    """
    async def connect(self):
        # The user is attached to the scope by your TokenAuthMiddleware
        self.user = self.scope.get("user")

        if self.user and self.user.is_authenticated:
            # Create a unique group name for this specific user
            self.group_name = f"user_{self.user.id}"
            
            # Join the user-specific group
            await self.channel_layer.group_add(
                self.group_name, 
                self.channel_name
            )
            
            await self.accept()
            print(f"✅ WebSocket connected: User {self.user.email} (ID: {self.user.id})")
        else:
            # Reject the connection if the token was invalid
            print("❌ WebSocket rejected: Unauthenticated")
            await self.close()

    async def disconnect(self, close_code):
        """
        Cleans up by removing the user from the group when the socket closes.
        """
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name, 
                self.channel_name
            )
            print(f"🔌 WebSocket disconnected: User {self.user.id}")

    async def send_notification(self, event):
        """
        Final bridge that pushes the message to the user's browser.
        Handles both flat and nested data structures.
        """
        # 1. Try to get job_id from top level, then from nested 'data'
        job_id = event.get("job_id")
        if not job_id:
            job_id = event.get("data", {}).get("job_id")

        # 2. Package everything for React
        await self.send(text_data=json.dumps({
            "id": event.get("id"), # Real DB ID to prevent 404s
            "message": event.get("message"),
            "notification_type": event.get("notification_type", "general"),
            "job_id": job_id, # This is what React needs to open the modal
        }))
        print(f"📡 WS Sent to {self.user.id}: {event.get('message')} | Job ID: {job_id}")