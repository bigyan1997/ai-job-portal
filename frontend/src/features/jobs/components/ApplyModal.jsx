import { useState } from "react";
import { jobService } from "../services/jobService";

const ApplyModal = ({ job, token, onClose, onSuccess }) => {
  const [resume, setResume] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fileName, setFileName] = useState("No file selected");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
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

    const formData = new FormData();
    formData.append("job", job.id);
    formData.append("resume", resume);
    formData.append("cover_letter", coverLetter);

    try {
      // Use the centralized jobService
      await jobService.applyWithResume(token, formData);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Full Error Response:", err.response?.data);

      // IMPROVED ERROR HANDLING
      let errorMessage = "An error occurred while submitting.";
      const data = err.response?.data;

      if (data) {
        if (data.non_field_errors) errorMessage = data.non_field_errors[0];
        else if (data.error) errorMessage = data.error;
        else if (data.detail) errorMessage = data.detail;
      }

      alert(`Application Status: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">
          Apply Now
        </h3>
        <p className="text-slate-500 mb-8 text-sm font-medium">
          Role: <span className="text-blue-600">{job.title}</span> at{" "}
          {job.company_name}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3">
              Resume (PDF format)
            </label>
            <div className="relative border-2 border-dashed border-slate-100 rounded-2xl p-6 hover:border-blue-400 transition-all bg-slate-50 group">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                required
              />
              <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-xl shadow-sm text-xl group-hover:scale-110 transition-transform">
                  📄
                </div>
                <span className="text-sm font-bold text-slate-600 truncate">
                  {fileName}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">
              Cover Letter / Intro
            </label>
            <textarea
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl h-32 text-sm font-bold text-slate-700 focus:bg-white focus:border-blue-600 outline-none transition-all resize-none"
              placeholder="Highlight your experience..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all disabled:bg-slate-200"
            >
              {submitting ? "Uploading..." : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyModal;
