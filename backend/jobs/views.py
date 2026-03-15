from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from google import genai
from google.genai import types
from google.genai.types import GenerateContentConfig
import pdfplumber
import json
from django.conf import settings
import re
from datetime import date

from .models import Job, SavedJob, Application, Notification, WithdrawalLog
from .serializers import JobSerializer, ApplicationSerializer, NotificationSerializer, WithdrawalLogSerializer
import io
from pypdf import PdfReader

def get_clean_pdf_text(resume_file):
    """
    Robustly extracts text from a PDF file.
    Falls back to pypdf if pdfplumber hits a metadata/font error.
    """
    text = ""
    try:
        # Strategy A: pdfplumber (Better for structured data)
        with pdfplumber.open(resume_file) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""
    except Exception as e:
        print(f"pdfplumber failed (likely FontBBox error): {e}")
        # Strategy B: pypdf (Ignores metadata errors, just grabs raw text)
        resume_file.seek(0) # Reset file pointer to the start
        try:
            reader = PdfReader(resume_file)
            for page in reader.pages:
                text += page.extract_text() or ""
        except Exception as fallback_e:
            print(f"All PDF parsing strategies failed: {fallback_e}")
            return None
            
    return text.strip()

# --- JOB VIEWS (PUBLIC & EMPLOYER) ---

class JobListCreateView(generics.ListCreateAPIView):
    """
    GET: Public feed of all active jobs.
    POST: Authenticated Employers create new job listings.
    """
    queryset = Job.objects.filter(is_active=True).order_by('-created_at')
    serializer_class = JobSerializer
    
    def perform_create(self, serializer):
        # Tie the job to the currently logged-in employer
        serializer.save(employer=self.request.user)

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]


class MyJobsListView(generics.ListAPIView):
    """
    Returns only the jobs posted by the logged-in employer.
    Supports searching by title or location via query parameters.
    """
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Job.objects.filter(employer=self.request.user)
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(location__icontains=search)
            )
        return queryset.order_by('-created_at')


class JobDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Handles viewing, updating, and deleting individual jobs.
    Security: Anyone can view, but only the owner can update/delete.
    """
    queryset = Job.objects.all()
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        # For destructive actions, restrict the queryset to the user's own jobs
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return Job.objects.filter(employer=self.request.user)
        return Job.objects.all()

# --- JOB SEEKER ACTIONS ---

class ToggleSaveJobView(APIView):
    """
    POST: Bookmarks or un-bookmarks a job for the current seeker.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            job = Job.objects.get(pk=pk)
            # Toggle logic: If exists, delete; if not, create.
            saved_job, created = SavedJob.objects.get_or_create(user=request.user, job=job)
            
            if not created:
                saved_job.delete()
                return Response({"status": "unposted"}, status=status.HTTP_200_OK)
            
            return Response({"status": "saved"}, status=status.HTTP_201_CREATED)
        except Job.DoesNotExist:
            return Response({"error": "Job not found"}, status=status.HTTP_404_NOT_FOUND)


class MySavedJobsListView(generics.ListAPIView):
    """Returns the list of jobs bookmarked by the seeker."""
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Job.objects.filter(saved_by_users__user=self.request.user).order_by('-created_at')


client = genai.Client(api_key=settings.GEMINI_API_KEY)

class ApplyJobView(APIView):
    """
    Handles job applications without using brackets in AI prompts.
    Always performs honest AI resume analysis.
    Optionally generates a cover letter based on toggle.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def post(self, request):
        job_id = request.data.get("job")
        resume_file = request.FILES.get("resume")
        # Boolean check for AI generation
        generate_cover_letter = str(request.data.get("generate_cover_letter")).lower() == 'true'
        manual_cover_letter = request.data.get("cover_letter", "")

        if not job_id or not resume_file:
            return Response({"error": "Missing job ID or resume file."}, status=400)

        try:
            job = Job.objects.get(id=job_id)
            resume_text = get_clean_pdf_text(resume_file)
            
            if not resume_text:
                return Response({"error": "PDF is unreadable or empty."}, status=400)

            # --- PART A: HONEST SCORING (Resume Only) ---
            # Instruction: No brackets allowed in the prompt output
            prompt_analysis = f"""
            Analyze the following resume against the job description.
            Resume text: {resume_text[:4000]}
            Job description: {job.description[:2000]}

            Return a JSON object only. 
            Do not use brackets or placeholders in the text values.
            Structure:
            {{
                "score": 0 to 100,
                "matching": ["skill name", "qualification"],
                "missing": ["required skill"]
            }}
            """
            response_analysis = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt_analysis,
                config=types.GenerateContentConfig(response_mime_type="application/json")
            )
            
            try:
                raw_json = response_analysis.text.strip()
                if raw_json.startswith("```"):
                    raw_json = re.sub(r'^```json\s*|```$', '', raw_json, flags=re.MULTILINE)
                ai_analysis = json.loads(raw_json)
            except:
                ai_analysis = {"score": 0, "matching": [], "missing": []}

            # --- PART B: CONDITIONAL COVER LETTER ---
            final_cover_letter = manual_cover_letter
            if generate_cover_letter:
                today = date.today().strftime('%B %d, %Y')
                prompt_cover = f"""
                Write a professional cover letter for the position of {job.title} at {job.company_name}.
                Date to use: {today}
                Resume data: {resume_text[:3000]}
                Job description: {job.description[:2000]}

                Instructions:
                Do not use brackets or empty placeholders like [Name] or [Date].
                Use the candidate name and details found in the resume.
                If a company address is not in the description, omit the address line entirely.
                Return only the plain text of the letter.
                """
                response_cover = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt_cover
                )
                final_cover_letter = response_cover.text.strip()

            # --- SAVE APPLICATION ---
            resume_file.seek(0)
            application, created = Application.objects.update_or_create(
                seeker=request.user,
                job=job,
                defaults={
                    "resume": resume_file,
                    "match_score": ai_analysis.get("score", 0),
                    "ai_analysis": ai_analysis,
                    "cover_letter": final_cover_letter
                }
            )

            return Response({
                "message": "Application submitted successfully",
                "ai_analysis": ai_analysis,
                "cover_letter": final_cover_letter,
                "has_applied": True
            }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=500)
    
class MyApplicationsListView(generics.ListAPIView):
    """Returns all applications submitted by the logged-in seeker."""
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Application.objects.filter(seeker=self.request.user).order_by('-applied_on')

# --- EMPLOYER DASHBOARD LOGIC ---

class JobApplicationsListView(generics.ListAPIView):
    """
    Lists all candidates for a specific job.
    Sorted by match_score DESC to show AI-recommended candidates first.
    """
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        job_id = self.kwargs['job_id']
        
        # 1. Grab the applications for this job
        queryset = Application.objects.filter(
            job_id=job_id, 
            job__employer=self.request.user
        )

        # 2. TRIGGER THE TRACKER: Mark all 'pending' as 'viewed'
        # This moves the Seeker's timeline to "Under Review"
        queryset.filter(status='pending').update(status='viewed')

        return queryset.order_by('-match_score')


class UpdateApplicationStatusView(generics.UpdateAPIView):
    """Allows employers to move candidates through the hiring pipeline."""
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Application.objects.filter(job__employer=self.request.user)

# --- NOTIFICATIONS ---

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')
    
    def post(self, request, *args, **kwargs):
        # Filter for unread notifications for the specific user
        unread_qs = Notification.objects.filter(user=request.user, is_read=False)
        count = unread_qs.count()
        
        # Perform the bulk update
        unread_qs.update(is_read=True)
        
        return Response({
            "message": f"Success: {count} notifications marked as read.",
            "unread_count": 0
        }, status=status.HTTP_200_OK)
    def delete(self, request, *args, **kwargs):
        deleted_count, _ = Notification.objects.filter(user=request.user).delete()
        return Response(
            {"message": f"Deleted {deleted_count} notifications"}, 
            status=status.HTTP_204_NO_CONTENT
        )

class NotificationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Handles operations on a single notification:
    - GET: View details
    - PATCH: Mark as read (is_read=True)
    - DELETE: Remove the notification
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Ensure users can only interact with their own notifications
        return Notification.objects.filter(user=self.request.user)


class WithdrawApplicationView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser]

    def delete(self, request, job_id):
        application = Application.objects.filter(
            seeker=request.user, 
            job_id=job_id
        ).select_related('job', 'job__employer').first()
        
        if not application:
            return Response({"error": "Application not found"}, status=status.HTTP_404_NOT_FOUND)

        reason = request.data.get('reason', 'No reason provided')
        
        # Get seeker details
        seeker_name = f"{request.user.first_name} {request.user.last_name}".strip() or "Unknown Name"
        seeker_email = request.user.email # Capture the email here

        try:
            # Create the permanent log entry
            WithdrawalLog.objects.create(
                job=application.job,
                seeker_name=seeker_name,
                seeker_email=seeker_email, # Save to DB
                reason=reason
            )

            # Notify Employer (Professional touch)
            Notification.objects.create(
                user=application.job.employer,
                message=f"Candidate {seeker_name} ({seeker_email}) withdrew from '{application.job.title}'. Reason: {reason}"
            )

            application.delete()
            return Response({"message": "Application withdrawn successfully"}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
class OptimizeResumeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        job_id = request.data.get('job_id')
        missing_skills = request.data.get('missing_skills', [])

        if not job_id or not missing_skills:
            return Response({"error": "Missing data"}, status=400)

        try:
            job = Job.objects.get(id=job_id)
            
            # Specialized Prompt for Resume Writing
            prompt = f"""
            Act as a Professional Resume Writer.
            JOB TITLE: {job.title}
            MISSING SKILLS TO INTEGRATE: {", ".join(missing_skills)}

            TASK:
            Rewrite a 'Professional Skills & Core Competencies' section for a resume that naturally incorporates the missing skills listed above. 
            
            GUIDELINES:
            1. Use strong action verbs (e.g., 'Spearheaded', 'Optimized', 'Implemented').
            2. Write in a professional, concise bullet-point format.
            3. Ensure the tone matches a high-end corporate resume.
            4. Do not include introductory text; return ONLY the bullet points.
            5. Integrate both technical and soft skills naturally.
            6. Ensure ATS-friendly keyword integration.
            7. Avoid first-person pronouns.
            8. Keep each bullet between 8 to 16 words.
            9. Use varied action verbs and maintain parallel sentence structure.
            10. Focus on measurable business impact where possible.
            11. Limit the output to 8 to 12 bullet points.
            12. Avoid generic or filler language.
            13. Ensure competencies align with the target role and industry.
            """

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )

            return Response({
                "optimized_text": response.text.strip()
            }, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

class JobWithdrawalHistoryView(generics.ListAPIView):
    """
    Returns a list of all candidates who withdrew from a specific job.
    Accessible only by the employer who posted the job.
    """
    serializer_class = WithdrawalLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        job_id = self.kwargs['job_id']
        # Security check: Ensure the job belongs to the requesting employer
        return WithdrawalLog.objects.filter(
            job_id=job_id, 
            job__employer=self.request.user
        ).order_by('-withdrawn_at')
        
class AnalyzeResumeView(APIView):
    """
    PREVIEW ONLY: Returns Gemini analysis without saving to the Database.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        job_id = request.data.get('job')
        resume_file = request.FILES.get('resume')

        if not job_id or not resume_file:
            return Response({"error": "Missing job or resume"}, status=400)

        try:
            job = Job.objects.get(id=job_id)
            
            # 1. Robust Extraction
            resume_text = get_clean_pdf_text(resume_file)
            if not resume_text:
                return Response({"error": "PDF is unreadable. Please try a different format."}, status=400)

            # 2. Gemini Call (Using 2.5 Flash for speed in preview)
            prompt = f"""
            Analyze this resume for the job: {job.title}.
            Job Description: {job.description}
            Resume: {resume_text}

            Return JSON format: 
            {{
                "score": 0-100,
                "matching": ["skill1", "skill2"],
                "missing": ["skill3", "skill4"]
            }}
            """
            
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json")
            )

            # 3. Parse JSON safely
            try:
                ai_data = json.loads(response.text)
            except:
                # Fallback if Gemini adds extra text
                match = re.search(r"\{.*\}", response.text, re.DOTALL)
                ai_data = json.loads(match.group()) if match else {}

            if not ai_data:
                return Response({"error": "AI analysis failed"}, status=500)

            return Response({
                "ai_analysis": ai_data,
                "score": ai_data.get("score", 0),
                "raw_resume_text": resume_text
            }, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)
        
class GenerateCoverLetterView(APIView):
    """
    Dedicated view for generating a letter without any brackets.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (JSONParser, MultiPartParser, FormParser) 

    def post(self, request):
        job_id = request.data.get('job_id')
        resume_text = request.data.get('resume_text')

        if not job_id or not resume_text:
            return Response({"error": "Missing data"}, status=400)

        try:
            job = Job.objects.get(id=job_id)
            today = date.today().strftime('%B %d, %Y')
            
            prompt = f"""
            Act as a Professional Career Coach.
            Write a professional cover letter for {job.title} at {job.company_name}.
            Current date: {today}
            
            Resume: {resume_text}
            Description: {job.description}
            
            Strict Rule: Do not use any brackets such as [ ] or placeholders. 
            If information is missing, write the letter so it remains professional without needing those details.
            Return only the letter text.
            """

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )

            return Response({
                "cover_letter": response.text.strip()
            }, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)
        
class GlobalWithdrawalHistoryView(generics.ListAPIView):
    serializer_class = WithdrawalLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
    # This checks: "Give me logs where the job's employer is the current user"
        return WithdrawalLog.objects.filter(
            job__employer=self.request.user
        ).order_by('-withdrawn_at')