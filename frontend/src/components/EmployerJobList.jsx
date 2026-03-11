import { useState, useEffect } from "react";
import axios from "axios";
import ApplicantListModal from "./ApplicantListModal";

/**
 * Dashboard component for Employers to manage their job postings.
 * Supports inline editing, deletion, and viewing AI-ranked applicants.
 */
const EmployerJobList = ({ token }) => {
  const [myJobs, setMyJobs] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE = "http://127.0.0.1:8000/api/jobs";

  useEffect(() => {
    if (token) fetchMyJobs();
  }, [token]);

  const fetchMyJobs = async () => {
    try {
      const res = await axios.get(`${API_BASE}/my-jobs/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setMyJobs(res.data);
    } catch (err) {
      console.error("Error fetching jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (job) => {
    setEditingId(job.id);
    setEditData({
      title: job.title,
      location: job.location,
      description: job.description,
    });
  };

  const handleSave = async (id) => {
    try {
      const res = await axios.patch(`${API_BASE}/${id}/`, editData, {
        headers: { Authorization: `Token ${token}` },
      });
      // Update the local list with the newly returned job data
      setMyJobs(myJobs.map((job) => (job.id === id ? res.data : job)));
      setEditingId(null);
    } catch (err) {
      alert("Update failed! Please check your inputs.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this job posting?")) {
      try {
        await axios.delete(`${API_BASE}/${id}/`, {
          headers: { Authorization: `Token ${token}` },
        });
        setMyJobs(myJobs.filter((job) => job.id !== id));
      } catch (err) {
        alert("Delete failed!");
      }
    }
  };

  return (
    <div className="mt-10 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header section */}
      <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-slate-800">
            Your Active Postings
          </h3>
          <p className="text-sm text-slate-500">
            Manage your listings and review applicants
          </p>
        </div>
        <span className="bg-white px-3 py-1 rounded-full border border-slate-200 text-sm font-semibold text-slate-600">
          {myJobs.length} Jobs
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {loading ? (
          <div className="p-20 text-center text-slate-400">
            Loading your postings...
          </div>
        ) : myJobs.length > 0 ? (
          myJobs.map((job) => (
            <div
              key={job.id}
              className="p-6 hover:bg-slate-50/80 transition-all"
            >
              {editingId === job.id ? (
                /* --- INLINE EDIT MODE --- */
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      className="border border-slate-200 p-3 rounded-xl w-full text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Job Title"
                      value={editData.title}
                      onChange={(e) =>
                        setEditData({ ...editData, title: e.target.value })
                      }
                    />
                    <input
                      className="border border-slate-200 p-3 rounded-xl w-full text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Location"
                      value={editData.location}
                      onChange={(e) =>
                        setEditData({ ...editData, location: e.target.value })
                      }
                    />
                  </div>
                  <textarea
                    className="border border-slate-200 p-3 rounded-xl w-full text-sm h-24 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    placeholder="Job Description"
                    value={editData.description}
                    onChange={(e) =>
                      setEditData({ ...editData, description: e.target.value })
                    }
                  />
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 text-slate-500 text-sm font-bold hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSave(job.id)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-shadow shadow-sm"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                /* --- STANDARD VIEW MODE --- */
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-1">
                      <h4 className="font-bold text-slate-900 text-lg">
                        {job.title}
                      </h4>
                      <span className="bg-blue-100 text-blue-700 text-[10px] uppercase tracking-widest font-black px-2 py-1 rounded-md border border-blue-200">
                        {job.applicant_count || 0} Applicants
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      📍 {job.location}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-6">
                    <button
                      onClick={() => setSelectedJobId(job.id)}
                      className="bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                    >
                      View Applicants
                    </button>

                    <button
                      onClick={() => startEdit(job)}
                      className="text-slate-500 hover:text-slate-800 text-sm font-semibold transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(job.id)}
                      className="text-red-400 hover:text-red-600 text-sm font-semibold transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="p-20 text-center">
            <p className="text-slate-400">You haven't posted any jobs yet.</p>
          </div>
        )}
      </div>

      {/* Applicant Review Modal */}
      {selectedJobId && (
        <ApplicantListModal
          jobId={selectedJobId}
          token={token}
          onClose={() => setSelectedJobId(null)}
        />
      )}
    </div>
  );
};

export default EmployerJobList;
