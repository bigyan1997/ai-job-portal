from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

class CustomUserAdmin(UserAdmin):
    """
    Custom admin interface for the CustomUser model.
    
    This class overrides the default Django UserAdmin to support email-based 
    authentication and specific roles (Job Seeker and Employer) for the 
    AI Job Seeker portal.
    """
    
    model = CustomUser
    
    # Fields to display in the user list view
    list_display = (
        'email', 
        'first_name', 
        'last_name', 
        'is_job_seeker', 
        'is_employer', 
        'is_staff', 
        'is_active'
    )
    
    # Sidebar filters to quickly segment users by role or status
    list_filter = (
        'is_job_seeker', 
        'is_employer', 
        'is_staff', 
        'is_active'
    )
    
    # Search functionality targeting the email and name fields
    search_fields = ('email', 'first_name', 'last_name')
    
    # Default sorting order (alphabetical by email)
    ordering = ('email',)

    # Main edit page layout
    # Removed 'username' to prevent errors with email-based auth
    fieldsets = (
        (None, {
            'fields': ('email', 'password')
        }),
        ('Personal Info', {
            'fields': ('first_name', 'last_name')
        }),
        ('Portal Roles', {
            'description': 'Designate whether this user is a candidate or a recruiter.',
            'fields': ('is_job_seeker', 'is_employer')
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Important Dates', {
            'fields': ('last_login', 'date_joined')
        }),
    )

    # Layout for the 'Add User' form
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password', 'is_job_seeker', 'is_employer'),
        }),
    )

# Register the model with the customized admin class
admin.site.register(CustomUser, CustomUserAdmin)
