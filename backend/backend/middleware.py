from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework.authtoken.models import Token
from urllib.parse import parse_qs

# Fetch the CustomUser model defined in your project
User = get_user_model()

@database_sync_to_async
def get_user_from_token(token_key):
    """
    Retrieves a user from the database based on a Token key.
    
    Args:
        token_key (str): The authentication token passed via WebSocket handshake.
        
    Returns:
        User: The authenticated CustomUser instance or AnonymousUser if invalid.
    """
    try:
        # Queries the DRF Token model
        token = Token.objects.select_related('user').get(key=token_key)
        return token.user
    except (Token.DoesNotExist, Exception):
        # Gracefully fall back to an AnonymousUser if the token is invalid or expired
        return AnonymousUser()

class TokenAuthMiddleware:
    """
    Custom middleware for Django Channels to authenticate WebSocket connections.
    
    This middleware extracts a token from the WebSocket URL query parameters
    (e.g., ws://localhost:8000/ws/notifications/?token=<your_token>) and
    attaches the authenticated user to the 'scope'.
    """
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        """
        Processes the connection scope during the initial handshake.
        """
        # Parse the query string from the scope (e.g., b'token=abc123xyz')
        query_string = scope.get("query_string", b"").decode()
        query_params = parse_qs(query_string)
        
        # Extract the token key, defaulting to None if missing
        token_key = query_params.get("token", [None])[0]

        if token_key:
            # Attach the user to the scope so they are accessible in the Consumer
            scope["user"] = await get_user_from_token(token_key)
        else:
            # Ensure an AnonymousUser is present if no token is provided
            scope["user"] = AnonymousUser()

        # Pass the scope to the next middleware or consumer in the stack
        return await self.inner(scope, receive, send)