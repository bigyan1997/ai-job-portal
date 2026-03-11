from django.urls import re_path
from . import consumers

"""
WebSocket URL Configuration for the Jobs App.

This routing table works similarly to Django's standard urls.py but 
specifically for WebSocket (ws:// or wss://) connections.
"""

websocket_urlpatterns = [
    # Endpoint for real-time AI Match notifications and application updates.
    # The regex r'ws/notifications/?$' allows for an optional trailing slash,
    # preventing connection failures from the frontend.
    re_path(r'ws/notifications/?$', consumers.NotificationConsumer.as_asgi()),
]