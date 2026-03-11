from django.contrib.auth import get_user_model
from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.authtoken.models import Token

# Social Auth Imports
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView

# Local project imports
from .serializers import UserSerializer, RegisterSerializer

# Get the custom user model (CustomUser) defined in your project
User = get_user_model()

class GoogleLogin(SocialLoginView):
    """
    Endpoint for Google OAuth2 authentication.
    The callback URL must match the one configured in Google Cloud Console
    and your React frontend (Vite defaults to localhost:5173).
    """
    adapter_class = GoogleOAuth2Adapter
    callback_url = "http://localhost:5173"
    client_class = OAuth2Client


class RegisterView(generics.CreateAPIView):
    """
    Handles new user registration.
    Automatically generates an Authentication Token so the user is 
    logged in immediately upon successful signup.
    """
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate or retrieve the token for the new user
        token, _ = Token.objects.get_or_create(user=user)
        
        return Response({
            "token": token.key,
            "user_id": user.pk,
            "email": user.email,
            "is_employer": user.is_employer,
            "is_job_seeker": user.is_job_seeker
        }, status=status.HTTP_201_CREATED)


class UserProfileUpdateView(generics.UpdateAPIView):
    """
    Allows authenticated users to update their own profile details.
    Restricts access to the currently logged-in user via token.
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # Maps the 'request.user' provided by the TokenAuthentication 
        # directly to the object being updated.
        return self.request.user