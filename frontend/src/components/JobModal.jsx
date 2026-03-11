import { useState, useEffect, useRef } from "react";
import axios from "axios";

const JobModal = ({ jobId, token, onClose }) => {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reference for the hidden file input
  const fileInputRef = useRef(null);

  const API_BASE = "http://127.0.0.1:8000/api/jobs";

  useEffect(() => {
    const fetchJob = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${API_BASE}/${jobId}/`, {
          headers: { Authorization: `Token ${token}` },
        });
        setJob(res.data);
      } catch (err) {
        console.error("Error fetching job details:", err);
        setError("Could not load job details.");
      } finally {
        setLoading(false);
      }
    };

    if (jobId && token) fetchJob();
  }, [jobId, token]);

  // --- NEW: Handle the actual File Upload ---
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type for Bina's resume
    if (file.type !== "application/pdf") {
      alert("Please upload your resume in PDF format.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("job", jobId);

    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE}/apply/`, formData, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // Update local state with the new AI Match data from PostgreSQL
      setJob((prev) => ({
        ...prev,
        ai_analysis: response.data.ai_analysis,
      }));

      alert("Application successful! Our AI is now analyzing your match.");
    } catch (err) {
      console.error("Upload failed:", err);
      alert(err.response?.data?.error || "Failed to submit application.");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    // Triggers the hidden file input picker
    fileInputRef.current.click();
  };

  const handleWithdraw = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to withdraw? You will need to re-apply to be considered.",
      )
    )
      return;

    try {
      await axios.delete(`${API_BASE}/applications/withdraw/${id}/`, {
        headers: { Authorization: `Token ${token}` },
      });

      setJob((prev) => ({ ...prev, ai_analysis: null }));
      alert("Application withdrawn.");
    } catch (err) {
      console.error("Withdrawal error:", err);
      alert("Could not withdraw. Check backend terminal.");
    }
  };

  if (!jobId) return null;

  const aiData = job?.ai_analysis || {};
  const score = aiData.score || 0;
  const matchedWords = aiData.matching || [];
  const missingWords = aiData.missing || [];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md transition-all"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in zoom-in duration-300 border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HIDDEN FILE INPUT */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".pdf"
          onChange={handleFileUpload}
        />

        {loading ? (
          <div className="p-32 text-center">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="mt-8 text-slate-400 font-black uppercase tracking-[0.3em] text-[9px]">
              Processing Data
            </p>
          </div>
        ) : (
          <>
            <div className="relative p-10 bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>

              <div className="relative z-10 flex justify-between items-start">
                <div className="flex-1 pr-8">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-[9px] font-black uppercase tracking-widest border border-blue-500/30">
                      Active Listing
                    </span>
                  </div>
                  <h3 className="text-3xl font-black tracking-tight leading-tight mb-2">
                    {job?.title}
                  </h3>
                  <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
                    <span className="text-blue-400 font-bold">
                      {job?.company_name}
                    </span>
                    <span className="opacity-30">•</span>
                    <span>{job?.location}</span>
                  </div>
                </div>

                <div className="flex flex-col items-center p-4 bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 min-w-[110px]">
                  <div
                    className={`text-4xl font-black ${score > 70 ? "text-emerald-400" : "text-blue-400"}`}
                  >
                    {score}
                    <span className="text-lg opacity-60">%</span>
                  </div>
                  <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] mt-1">
                    Verified Match
                  </p>
                </div>
              </div>
            </div>

            <div className="p-10 max-h-[50vh] overflow-y-auto space-y-8 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Proposed Salary
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {job?.salary_range || "Market Rate"}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Competition
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {job?.applicant_count || 0} Applicants
                  </p>
                </div>
              </div>

              <div className="group relative p-8 rounded-[2.5rem] bg-white border-2 border-slate-50 shadow-sm hover:shadow-md transition-all">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  Skill Match Integrity
                </h4>
                <div className="space-y-6">
                  <div>
                    <p className="text-[9px] font-bold text-emerald-500 uppercase mb-3 flex items-center gap-2">
                      Words Matched
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {matchedWords.length > 0 ? (
                        matchedWords.map((word, i) => (
                          <span
                            key={i}
                            className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black uppercase border border-emerald-100/50 shadow-sm"
                          >
                            {word}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">
                          No direct matches found yet.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Position Description
                </h4>
                <div className="text-slate-600 leading-relaxed text-[15px] font-medium selection:bg-blue-100 whitespace-pre-line">
                  {job?.description}
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="px-3 py-1 bg-slate-200/50 rounded-lg border border-slate-200">
                  <p className="text-[9px] text-slate-600 font-black uppercase tracking-tighter">
                    REF #{job?.id}
                  </p>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {job?.created_at_human}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {job?.ai_analysis ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-5 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-black uppercase tracking-widest text-[9px] border border-emerald-100">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Application Active
                    </div>
                    <button
                      onClick={() => handleWithdraw(job.id)}
                      className="px-4 py-3 text-rose-400 hover:text-rose-600 font-black uppercase tracking-widest text-[9px] transition-colors"
                    >
                      Withdraw
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleApply}
                    className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-200 transition-all active:scale-95"
                  >
                    Apply Now
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-6 py-4 text-slate-400 hover:text-slate-900 font-black uppercase tracking-widest text-[10px]"
                >
                  Close
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default JobModal;
