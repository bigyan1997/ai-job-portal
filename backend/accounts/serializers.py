from rest_framework import serializers
from django.contrib.auth import get_user_model

# Get the custom user model (CustomUser) defined in your settings
User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for displaying user profile information.
    Includes a calculated field for the number of saved jobs.
    """
    saved_jobs_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'is_employer', 'is_job_seeker', 'saved_jobs_count']
        read_only_fields = ['id', 'email'] # Prevent users from changing their email via this serializer

    def get_saved_jobs_count(self, obj):
        """Calculates the total jobs saved by the user."""
        return obj.saved_jobs.count()


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for handling new user registration.
    Ensures passwords are handled securely and roles are assigned.
    """
    # Write-only ensures the password is never returned in an API response
    password = serializers.CharField(
        write_only=True, 
        min_length=8,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        # Username is excluded as we use email for authentication
        fields = ['email', 'password', 'is_employer', 'is_job_seeker']

    def validate(self, data):
        """
        Custom validation to ensure a user selects exactly one role.
        """
        is_employer = data.get('is_employer', False)
        is_job_seeker = data.get('is_job_seeker', False)

        if is_employer and is_job_seeker:
            raise serializers.ValidationError("A user cannot be both an Employer and a Job Seeker.")
        
        if not is_employer and not is_job_seeker:
            raise serializers.ValidationError("Please select a role: Employer or Job Seeker.")
            
        return data

    def create(self, validated_data):
        """
        Overrides the create method to use Django's create_user helper,
        which handles password hashing automatically.
        """
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            is_employer=validated_data.get('is_employer', False),
            is_job_seeker=validated_data.get('is_job_seeker', False)
        )
        return user