import PyPDF2
import io
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def extract_text_from_pdf(pdf_file):
    """
    Extracts and cleans text from an uploaded PDF resume.
    
    Args:
        pdf_file: The file object from the Django FileField.
        
    Returns:
        str: The extracted text or an empty string if extraction fails.
    """
    try:
        # Create a PDF reader object from the file stream
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        extracted_text = []
        
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                extracted_text.append(page_text)
        
        # Join pages and clean up excessive whitespace/newlines
        full_text = " ".join(extracted_text)
        cleaned_text = re.sub(r'\s+', ' ', full_text).strip()
        
        return cleaned_text
    except Exception as e:
        # Log the error for debugging on your Ubuntu server
        print(f"CRITICAL: Failed to parse PDF resume: {e}")
        return ""

def get_match_score(job_description, resume_text):
    """
    Calculates the AI Match Score using TF-IDF Vectorization 
    and Cosine Similarity.
    
    Args:
        job_description (str): The text from the Job model.
        resume_text (str): The text extracted from the PDF.
        
    Returns:
        int: A percentage score from 0 to 100.
    """
    # Defensive check: if either text is missing, a match is impossible
    if not resume_text or not job_description:
        return 0
    
    try:
        # Prepare the documents for the vectorizer
        documents = [job_description, resume_text]
        
        # Initialize TfidfVectorizer:
        # - Removes 'english' stop words to focus on keywords (e.g., 'Django', 'React')
        # - Converts everything to lowercase automatically
        vectorizer = TfidfVectorizer(stop_words='english')
        
        # Transform the text into numerical vectors
        tfidf_matrix = vectorizer.fit_transform(documents)
        
        # Calculate Cosine Similarity between the Job (index 0) and Resume (index 1)
        # Result is a value between 0 and 1
        similarity_matrix = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
        
        # Convert to a whole number percentage
        score = int(similarity_matrix[0][0] * 100)
        
        return score
    except ValueError:
        # This can happen if the resume or job description contains only stop words
        return 0
    except Exception as e:
        print(f"ERROR: AI Score calculation failed: {e}")
        return 0