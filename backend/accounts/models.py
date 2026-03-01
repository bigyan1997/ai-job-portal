from django.contrib.auth.models import AbstractUser
from .managers import CustomUserManager
from django.db import models

class CustomUser(AbstractUser):
    # Removing username for login and using email instead
    username = None;
    email = models.EmailField(unique=True)

    # User Roles
    is_job_seeker = models.BooleanField(default=True)
    is_employer = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = [] 

    objects = CustomUserManager()

    def __str__(self):
        return self.email

