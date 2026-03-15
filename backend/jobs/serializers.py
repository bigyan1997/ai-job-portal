import io
import re
import spacy
from rest_framework import serializers
from .models import Job, SavedJob, Application, Notification, WithdrawalLog
from PyPDF2 import PdfReader

try:
    nlp = spacy.load("en_core_web_sm")
except:
    nlp = None

class JobSerializer(serializers.ModelSerializer):
    employer_email = serializers.ReadOnlyField(source='employer.email')
    is_saved = serializers.SerializerMethodField()
    has_applied = serializers.SerializerMethodField()
    applicant_count = serializers.SerializerMethodField()
    ai_analysis = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = [
            'id', 'employer_email', 'title', 'company_name', 
            'description', 'location', 'salary_range', 
            'created_at', 'is_saved', 'has_applied',
            'applicant_count', 'ai_analysis'
        ]

    def get_has_applied(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.applications.filter(seeker=request.user).exists()
        return False

    def get_ai_analysis(self, obj):
        """
        Retrieves the real Gemini analysis stored in the Application model.
        """
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return {"score": 0, "matching": [], "missing": []}

        # Find the application for the current user
        application = obj.applications.filter(seeker=request.user).first()
        
        if application and application.ai_analysis:
            # Return the real JSON stored in the database
            return application.ai_analysis
        
        # Default fallback if no application or analysis exists
        return {"score": 0, "matching": [], "missing": []}

    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.saved_by_users.filter(user=request.user).exists()
        return False

    def get_applicant_count(self, obj):
        return obj.applications.count()

class ApplicationSerializer(serializers.ModelSerializer):
    seeker_email = serializers.ReadOnlyField(source='seeker.email')
    job_title = serializers.ReadOnlyField(source='job.title')
    applied_on = serializers.ReadOnlyField()

    class Meta:
        model = Application
        fields = [
            'id', 'job', 'seeker_email', 'job_title', 
            'resume', 'cover_letter', 'status', 
            'applied_on', 'match_score', 'ai_analysis' # <-- ADDED ai_analysis HERE
        ]
        read_only_fields = ['seeker', 'match_score', 'ai_analysis']


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

class WithdrawalLogSerializer(serializers.ModelSerializer):
    # This pulls the title of the job directly into the log entry
    job_title = serializers.ReadOnlyField(source='job.title')
    withdrawn_at = serializers.DateTimeField(format="%d %b %Y, %I:%M %p", read_only=True)

    class Meta:
        model = WithdrawalLog
        fields = ['id', 'job_title', 'seeker_name', 'seeker_email', 'reason', 'withdrawn_at']

