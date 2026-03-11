import { useState } from "react";
import axios from "axios";

/**
 * Modal for Job Seekers to apply for a specific job.
 * Handles PDF uploads and triggers the backend AI Match Score signal.
 */
const ApplyModal = ({ job, token, onClose, onSuccess }) => {
  const [resume, setResume] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fileName, setFileName] = useState("No file selected");

  // Base API URL
  const API_BASE = "http://127.0.0.1:8000/api/jobs/apply/";

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Basic validation to ensure it's a PDF
      if (file.type !== "application/pdf") {
        alert("Please upload a PDF file.");
        return;
      }
      setResume(file);
      setFileName(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resume) return alert("Please upload your resume.");

    setSubmitting(true);

    // Using FormData to package the file and text data together
    const formData = new FormData();
    formData.append("job", job.id);
    formData.append("resume", resume);
    formData.append("cover_letter", coverLetter);

    try {
      await axios.post(API_BASE, formData, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      onSuccess(); // Triggers parent component to refresh application list
      onClose();
    } catch (err) {
      console.error("Application error:", err.response?.data);
      const errorMessage = err.response?.data?.non_field_errors
        ? err.response.data.non_field_errors[0]
        : "You have already applied for this position.";
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-slate-100">
        <h3 className="text-2xl font-bold text-slate-900 mb-1">Apply Now</h3>
        <p className="text-slate-500 mb-8 text-sm">
          Submit your resume for{" "}
          <span className="font-semibold text-slate-700">{job.title}</span> at{" "}
          {job.company_name}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Custom File Upload Styling */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">
              Resume (PDF format)
            </label>
            <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-4 hover:border-blue-400 transition-colors bg-slate-50">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                required
              />
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                  📄
                </div>
                <span className="text-sm text-slate-600 truncate">
                  {fileName}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Introduction / Cover Letter
            </label>
            <textarea
              className="w-full p-4 border border-slate-200 rounded-xl h-36 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
              placeholder="Highlight your skills in Django, React, or PostgreSQL..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
            />
          </div>

          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-50 text-slate-600 p-3 rounded-xl font-bold hover:bg-slate-200 transition-colors border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-700 disabled:bg-slate-300 transition-all shadow-lg shadow-blue-200"
            >
              {submitting ? "Uploading..." : "Send Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyModal;
