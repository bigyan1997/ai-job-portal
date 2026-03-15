from django.apps import AppConfig

class JobsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField' # Added for standard ID handling
    name = 'jobs'

    def ready(self):
        # This imports your signals when the app starts
        import jobs.signals