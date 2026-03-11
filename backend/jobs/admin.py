from django.contrib import admin
from .models import Job, Application

@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    """
    Admin configuration for Job postings.
    Organizes job data to help staff manage listings efficiently.
    """
    # Core fields shown in the list table
    list_display = (
        'title', 
        'company_name', 
        'employer', 
        'location', 
        'created_at'
    )
    
    # Sidebar filters to drill down into specific job categories or timing
    list_filter = ('location', 'created_at')
    
    # Text search functionality
    search_fields = ('title', 'company_name', 'description')
    
    # Ensures the timestamp cannot be manually altered
    readonly_fields = ('created_at',)
    
    # Optimization: Prevents N+1 queries by pre-fetching the employer relationship
    list_select_related = ('employer',)


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    """
    Admin configuration for Job Applications.
    Provides visibility into who is applying for which jobs.
    """
    list_display = (
        'job', 
        'seeker_email', 
        'applied_on', 
        'status', 
        'resume'
    )
    
    # Filter applications by their current status (e.g., Pending, Interviewed)
    list_filter = ('status', 'applied_on', 'job')
    
    # Search by job title or seeker's email (using __ to traverse relationships)
    search_fields = ('job__title', 'seeker__email')

    # Optimization: Pre-fetching related objects
    list_select_related = ('job', 'seeker')

    @admin.display(description='Applicant Email')
    def seeker_email(self, obj):
        """
        Custom column to display the seeker's email address 
        from the related CustomUser model.
        """
        return obj.seeker.email