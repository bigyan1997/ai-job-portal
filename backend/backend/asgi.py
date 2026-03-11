import os
import django
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

# Set the settings module before initializing anything else
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Initialize Django for async mode
django.setup()

# Import local routing and middleware after django.setup()
from backend.middleware import TokenAuthMiddleware
import jobs.routing

"""
Main ASGI application configuration.
This router handles two types of protocols:
1. Standard HTTP: Used for the REST API and Admin.
2. WebSockets: Used for real-time AI Match notifications and Job updates.
"""
application = ProtocolTypeRouter({
    # Standard Django HTTP handling
    "http": get_asgi_application(),
    
    # WebSocket handling with a custom authentication pipeline
    "websocket": TokenAuthMiddleware(
        AuthMiddlewareStack(
            URLRouter(
                jobs.routing.websocket_urlpatterns
            )
        )
    ),
})