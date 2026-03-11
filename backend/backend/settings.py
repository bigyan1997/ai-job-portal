import os
from pathlib import Path
from dotenv import load_dotenv

# Initialize environment variables from .env file
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# --- SECURITY SETTINGS ---
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-default-key-for-dev')
DEBUG = True 
ALLOWED_HOSTS = []

# --- CORE APPLICATIONS ---
INSTALLED_APPS = [
    "daphne",  # Required at top for WebSockets
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites', 

    # API & Authentication
    'rest_framework',
    'rest_framework.authtoken', 
    'dj_rest_auth',
    'corsheaders',

    # Authentication (Social & Local)
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',

    # Project Specific Apps
    'accounts',
    'jobs',
    "channels",
]

SITE_ID = 1

# --- MIDDLEWARE ---
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware', 
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'allauth.account.middleware.AccountMiddleware',
]

ROOT_URLCONF = 'backend.urls'

# --- MISSING TEMPLATE CONFIGURATION (FIXES admin.E403) ---
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')], # Optional path for custom HTML
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# --- DATABASE CONFIGURATION ---
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'ai_job_portal_db',
        'USER': 'postgres',
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# --- AUTHENTICATION CONFIGURATION ---
AUTH_USER_MODEL = 'accounts.CustomUser'

# Use the modern 'allauth' syntax to silence terminal warnings
ACCOUNT_LOGIN_METHODS = {'email'}

# This replaces the old ACCOUNT_EMAIL_REQUIRED and ACCOUNT_USERNAME_REQUIRED
ACCOUNT_SIGNUP_FIELDS = ['email*', 'password1*', 'password2*']

# Keep these as they are for your CustomUser model
ACCOUNT_USER_MODEL_USERNAME_FIELD = None
ACCOUNT_EMAIL_VERIFICATION = 'none'
# DRF Settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
}

REST_AUTH = {
    'USE_JWT': False, 
    'USER_DETAILS_SERIALIZER': 'accounts.serializers.UserSerializer',
}

# --- CROSS-ORIGIN RESOURCE SHARING (CORS) ---
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
CORS_ALLOW_CREDENTIALS = True

SECURE_CROSS_ORIGIN_OPENER_POLICY = 'same-origin-allow-popups'

# --- ASYNC & CHANNELS (WebSockets) ---
ASGI_APPLICATION = "backend.asgi.application"

# Assumes Redis is running on your Ubuntu machine (sudo service redis-server start)
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [("127.0.0.1", 6379)],
        },
    },
}

# --- MEDIA & STATIC FILES ---
STATIC_URL = 'static/'
MEDIA_URL = 'media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')