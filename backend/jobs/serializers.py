import io
import re
import spacy
from rest_framework import serializers
from .models import Job, SavedJob, Application, Notification
from PyPDF2 import PdfReader

try:
    nlp = spacy.load("en_core_web_sm")
except:
    nlp = None

class JobSerializer(serializers.ModelSerializer):
    employer_email = serializers.ReadOnlyField(source='employer.email')
    is_saved = serializers.SerializerMethodField()
    applicant_count = serializers.SerializerMethodField()
    ai_analysis = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = [
            'id', 'employer_email', 'title', 'company_name', 
            'description', 'location', 'salary_range', 
            'created_at', 'is_saved', 'applicant_count',
            'ai_analysis'
        ]

    def get_ai_analysis(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return {"score": 0, "matching": [], "missing": []}

        # 1. Fetch the application record from the database for the current user
        application = obj.applications.filter(seeker=request.user).first()
        
        if application:
            # 2. Return the EXACT value stored in the database 'match_score' field
            # We also include matching/missing if you want to store those in the DB later.
            return {
                "score": application.match_score, 
                "matching": ["Nursing", "Aged Care", "Disability"], # You can make these dynamic or static
                "missing": []
            }
        
        # Fallback if no application exists
        return {"score": 0, "matching": [], "missing": []}

    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.saved_by_users.filter(user=request.user).exists()
        return False

    def get_applicant_count(self, obj):
        return obj.applications.count()

class ApplicationSerializer(serializers.ModelSerializer):
    """
    Serializer for job applications.
    Displays seeker info and the AI-calculated match score.
    """
    seeker_email = serializers.ReadOnlyField(source='seeker.email')
    job_title = serializers.ReadOnlyField(source='job.title')
    
    # Note: Using 'applied_on' from your model to match the DB field
    applied_on = serializers.ReadOnlyField()

    class Meta:
        model = Application
        fields = [
            'id', 'job', 'seeker_email', 'job_title', 
            'resume', 'cover_letter', 'status', 
            'applied_on', 'match_score'
        ]
        read_only_fields = ['seeker', 'match_score']


class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer for user notifications.
    Provides human-readable timestamps for a better user experience.
    """
    created_at_human = serializers.SerializerMethodField()
    job_id = serializers.ReadOnlyField(source='application.job.id')

    class Meta:
        model = Notification
        fields = [
            'id', 'message', 'is_read', 'created_at', 
            'created_at_human', 'job_id'
        ]

    def get_created_at_human(self, obj):
        """
        Formats date to a readable string like 'Mar 06, 05:23 PM'.
        """
        return obj.created_at.strftime("%b %d, %I:%M %p")