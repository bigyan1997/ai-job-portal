import { useState, useEffect } from "react";
import axios from "axios";

/**
 * Candidate view for tracking job applications and AI Match scores.
 * Uses real-time status styling and a progress-bar visualization for AI scores.
 */
const MyApplications = ({ token }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Base API URL for consistency across your React app
  const API_BASE = "http://127.0.0.1:8000/api/jobs/my-applications/";

  useEffect(() => {
    const fetchMyApps = async () => {
      try {
        const res = await axios.get(API_BASE, {
          headers: { Authorization: `Token ${token}` },
        });
        setApplications(res.data);
      } catch (err) {
        console.error("Error fetching my applications:", err);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchMyApps();
  }, [token]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">
            My Applications
          </h3>
          <p className="text-slate-500 font-medium">
            Track your AI-ranked candidacy status
          </p>
        </div>
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-xs font-bold border border-blue-100">
          {applications.length} Total Applications
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 animate-pulse">
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
            Loading pipeline...
          </p>
        </div>
      ) : applications.length > 0 ? (
        <div className="grid gap-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:justify-between md:items-center gap-6 group"
            >
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 text-xl group-hover:text-blue-600 transition-colors">
                  {app.job_title}
                </h4>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">
                  Applied on:{" "}
                  {new Date(app.applied_on).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>

                {/* AI MATCH SCORE VISUALIZATION */}
                <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl inline-flex">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">
                      AI Relevance Score
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-[1500ms] ease-out ${
                            app.match_score > 75
                              ? "bg-green-500"
                              : app.match_score > 45
                                ? "bg-amber-400"
                                : "bg-rose-400"
                          }`}
                          style={{ width: `${app.match_score || 0}%` }}
                        ></div>
                      </div>
                      <span
                        className={`text-sm font-black ${
                          app.match_score > 75
                            ? "text-green-600"
                            : app.match_score > 45
                              ? "text-amber-600"
                              : "text-rose-600"
                        }`}
                      >
                        {app.match_score || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* APPLICATION STATUS BADGE */}
              <div className="flex items-center">
                <span
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm ${
                    app.status === "shortlisted"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : app.status === "rejected"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-white text-slate-600 border-slate-200"
                  }`}
                >
                  {app.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <div className="text-4xl mb-4">📝</div>
          <p className="text-slate-500 font-bold text-lg">
            Your application list is empty.
          </p>
          <p className="text-slate-400 text-sm mt-1">
            Start applying to jobs to see your AI Match scores here!
          </p>
        </div>
      )}
    </div>
  );
};

export default MyApplications;
