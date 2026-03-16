import json
from channels.generic.websocket import AsyncWebsocketConsumer

class NotificationConsumer(AsyncWebsocketConsumer):
    """
    Real-Time Notification Consumer
    Identifies users via WebSocket scope and manages group-based messaging.
    """

    async def connect(self):
        """
        Invoked on initial handshake. Validates user via TokenAuthMiddleware 
        and joins a private messaging group.
        """
        self.user = self.scope.get("user")

        if self.user and self.user.is_authenticated:
            # unique group per user: user_1, user_2, etc.
            self.group_name = f"user_{self.user.id}"
            
            # Join the specific channel group
            await self.channel_layer.group_add(
                self.group_name, 
                self.channel_name
            )
            
            await self.accept()
            # Info log for backend monitoring
            print(f"✅ WS CONNECTED: {self.user.email} (ID: {self.user.id})")
        else:
            # Strict security: close if user is not verified
            print("❌ WS REJECTED: Authentication Required")
            await self.close()

    async def disconnect(self, close_code):
        """
        Cleanup: Discards the channel from the group to prevent memory leaks 
        and ghost messaging.
        """
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name, 
                self.channel_name
            )
            print(f"🔌 WS DISCONNECTED: User {self.user.id}")

    async def send_notification(self, event):
        """
        Outgoing handler: Receives events from the channel layer 
        and pushes JSON data to the React frontend.
        """
        # Logic: Extract job_id from various event structures to ensure UI compatibility
        job_id = event.get("job_id") or event.get("data", {}).get("job_id")

        # Payload sent to frontend (useNotifications.js hook)
        await self.send(text_data=json.dumps({
            "id": event.get("id"),
            "message": event.get("message"),
            "notification_type": event.get("notification_type", "general"),
            "job_id": job_id, 
        }))
        
        print(f"📡 WS PUSHED -> User {self.user.id}: {event.get('message')}")