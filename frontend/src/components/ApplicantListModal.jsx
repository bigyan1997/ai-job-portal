import { useState, useEffect } from "react";
import axios from "axios";

/**
 * Modal component for Employers to view and manage applicants.
 * Features AI Match score badges and status management.
 */
const ApplicantListModal = ({ jobId, token, onClose }) => {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Base API URL - easily updated for production
  const API_BASE = "http://127.0.0.1:8000/api/jobs";

  useEffect(() => {
    const fetchApplicants = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${API_BASE}/${jobId}/applications/`, {
          headers: { Authorization: `Token ${token}` },
        });
        // The backend sorts these by match_score DESC via the view queryset
        setApplicants(res.data);
      } catch (err) {
        setError("Could not load applicants. Please try again.");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (jobId && token) fetchApplicants();
  }, [jobId, token]);

  /**
   * Updates application status and provides instant UI feedback.
   */
  const handleStatusChange = async (appId, newStatus) => {
    try {
      await axios.patch(
        `${API_BASE}/applications/${appId}/status/`,
        { status: newStatus },
        { headers: { Authorization: `Token ${token}` } },
      );

      // Update local state so the UI changes immediately
      setApplicants((prev) =>
        prev.map((app) =>
          app.id === appId ? { ...app, status: newStatus } : app,
        ),
      );
    } catch (err) {
      alert("Failed to update status. Please check your connection.");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-100">
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Applicants</h3>
            <p className="text-slate-500 text-sm">
              Ranked by AI match relevance
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Conditional Content: Loading, Error, or List */}
        {loading ? (
          <div className="flex flex-col items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-slate-500">Analyzing candidates...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">{error}</div>
        ) : applicants.length > 0 ? (
          <div className="space-y-4">
            {applicants.map((app) => (
              <div
                key={app.id}
                className="p-5 border border-slate-100 rounded-2xl bg-slate-50 hover:shadow-sm transition-all"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <p className="font-bold text-slate-900">
                        {app.seeker_email}
                      </p>

                      {/* AI Score Badge - Dynamically colored */}
                      <span
                        className={`text-[10px] font-black px-2 py-1 rounded text-white ${
                          app.match_score > 75 ? "bg-green-500" : "bg-blue-500"
                        }`}
                      >
                        {app.match_score}% MATCH
                      </span>

                      {app.match_score >= 85 && (
                        <span className="text-[9px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                          ✨ TOP MATCH
                        </span>
                      )}
                    </div>

                    {/* Status Dropdown */}
                    <div className="flex items-center gap-3">
                      <select
                        value={app.status}
                        onChange={(e) =>
                          handleStatusChange(app.id, e.target.value)
                        }
                        className={`text-[10px] uppercase font-bold px-2 py-1 rounded border outline-none cursor-pointer ${
                          app.status === "shortlisted"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : app.status === "rejected"
                              ? "bg-red-100 text-red-700 border-red-200"
                              : "bg-white text-slate-600 border-slate-200"
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="rejected">Rejected</option>
                        <option value="hired">Hired</option>
                      </select>

                      <p className="text-[10px] text-slate-400 font-medium">
                        Applied: {new Date(app.applied_on).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Resume Link */}
                  <a
                    href={app.resume}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto text-center bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
                  >
                    📄 View Resume
                  </a>
                </div>

                {/* Optional Cover Letter Section */}
                {app.cover_letter && (
                  <div className="mt-4 text-sm text-slate-600 bg-white p-3 rounded-xl border border-slate-100 italic">
                    "{app.cover_letter}"
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400">No applicants yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicantListModal;
