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
        # Send the data to the React frontend including the real DB id
        await self.send(text_data=json.dumps({
            "type": event.get("notification_type", "general"),
            "message": event.get("message"),
            "id": event.get("id"), # <-- ADD THIS LINE
            "job_id": event.get("data", {}).get("job_id") # Adjust based on your structure
        }))