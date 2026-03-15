import { useState, useEffect } from "react";
import { jobService } from "../../jobs/services/jobService";
import toast from "react-hot-toast";
import WithdrawalHistoryModal from "./WithdrawalHistoryModal";

const ApplicantListModal = ({ jobId, jobTitle, token, onClose }) => {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  // --- STATE FOR WITHDRAWAL HISTORY ---
  const [showHistory, setShowHistory] = useState(false);

  // --- STATS CALCULATION ---
  const stats = {
    total: applicants.length,
    highMatch: applicants.filter((a) => (a.ai_analysis?.score || 0) >= 75)
      .length,
    shortlisted: applicants.filter((a) => a.status === "shortlisted").length,
    avgScore: applicants.length
      ? Math.round(
          applicants.reduce((acc, a) => acc + (a.ai_analysis?.score || 0), 0) /
            applicants.length,
        )
      : 0,
  };

  useEffect(() => {
    const fetchApplicants = async () => {
      setLoading(true);
      try {
        const res = await jobService.fetchApplicants(token, jobId);
        setApplicants(res.data);
      } catch (err) {
        toast.error("Could not load applicants.");
      } finally {
        setLoading(false);
      }
    };
    if (jobId && token) fetchApplicants();
  }, [jobId, token]);

  // --- BULK SELECTION LOGIC ---
  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleBulkStatusChange = async (newStatus) => {
    const count = selectedIds.length;
    const loadingToast = toast.loading(`Updating ${count} candidates...`);

    try {
      await Promise.all(
        selectedIds.map((id) =>
          jobService.updateApplicationStatus(token, id, newStatus),
        ),
      );

      setApplicants((prev) =>
        prev.map((app) =>
          selectedIds.includes(app.id) ? { ...app, status: newStatus } : app,
        ),
      );

      setSelectedIds([]);
      toast.success(`Successfully ${newStatus} ${count} candidates.`, {
        id: loadingToast,
      });
    } catch (err) {
      toast.error("Bulk update failed.", { id: loadingToast });
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await jobService.updateApplicationStatus(token, appId, newStatus);
      setApplicants((prev) =>
        prev.map((app) =>
          app.id === appId ? { ...app, status: newStatus } : app,
        ),
      );
      toast.success(`Updated to ${newStatus}`);
    } catch (err) {
      toast.error("Update failed.");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div
        className="bg-white rounded-[3rem] w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* --- HEADER & STATS --- */}
        <div className="p-10 border-b bg-slate-50 space-y-6 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                Hiring Pipeline
              </h3>
              <p className="text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                {jobTitle || "Management Console"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* WITHDRAWAL HISTORY TRIGGER */}
              <button
                onClick={() => setShowHistory(true)}
                className="px-6 py-3 bg-white border border-slate-200 text-slate-500 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all shadow-sm flex items-center gap-2"
              >
                🕒 Withdrawal History
              </button>

              <button
                onClick={onClose}
                className="w-12 h-12 flex items-center justify-center hover:bg-white rounded-full text-slate-400 shadow-sm transition-all"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Active"
              value={stats.total}
              variant="slate"
            />
            <StatCard
              label="High Match"
              value={stats.highMatch}
              variant="emerald"
            />
            <StatCard
              label="Shortlisted"
              value={stats.shortlisted}
              variant="blue"
            />
            <StatCard
              label="Avg Score"
              value={`${stats.avgScore}%`}
              variant="amber"
            />
          </div>

          {/* BULK ACTION BAR */}
          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl animate-in slide-in-from-top-2">
              <p className="text-white text-[10px] font-black uppercase tracking-widest px-4">
                {selectedIds.length} Candidates Selected
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkStatusChange("shortlisted")}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase hover:bg-emerald-600"
                >
                  Shortlist All
                </button>
                <button
                  onClick={() => handleBulkStatusChange("rejected")}
                  className="px-4 py-2 bg-rose-500 text-white rounded-xl text-[9px] font-black uppercase hover:bg-rose-600"
                >
                  Reject All
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="px-4 py-2 text-slate-400 text-[9px] font-black uppercase hover:text-white"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar flex flex-col lg:flex-row gap-8 bg-white">
          <div
            className={`${selectedApp ? "lg:w-1/2" : "w-full"} space-y-4 transition-all duration-500`}
          >
            {loading ? (
              <LoadingState />
            ) : applicants.length > 0 ? (
              applicants.map((app) => (
                <ApplicantCard
                  key={app.id}
                  app={app}
                  isSelected={selectedApp?.id === app.id}
                  isBulkSelected={selectedIds.includes(app.id)}
                  onToggleSelect={() => toggleSelect(app.id)}
                  onSelect={() => setSelectedApp(app)}
                  onStatusChange={handleStatusChange}
                />
              ))
            ) : (
              <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/50">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  No active candidates in the pipeline.
                </p>
              </div>
            )}
          </div>

          {/* DETAIL PANEL */}
          {selectedApp && (
            <div className="lg:w-1/2 bg-slate-50 rounded-[3rem] p-8 border border-slate-100 animate-in slide-in-from-right-4 overflow-y-auto custom-scrollbar sticky top-0 h-fit">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest text-blue-600">
                    Candidate Profile
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">
                    {selectedApp.seeker_email}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-900"
                >
                  Close Detail
                </button>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 mb-6">
                <p className="text-[14px] leading-7 text-slate-800 whitespace-pre-wrap font-serif italic">
                  "{selectedApp.cover_letter || "No cover letter provided."}"
                </p>
              </div>
              <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                <p className="text-[10px] font-black text-emerald-700 uppercase mb-3 tracking-widest">
                  AI Matching Insights
                </p>
                <ul className="text-[11px] text-emerald-900 font-bold space-y-2">
                  {selectedApp.ai_analysis?.matching?.map((m, i) => (
                    <li key={i} className="flex gap-2">
                      <span>•</span> {m}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- EXTERNAL MODAL LAYER --- */}
      {showHistory && (
        <WithdrawalHistoryModal
          jobId={jobId}
          jobTitle={jobTitle}
          token={token}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
};

// --- SUB-COMPONENT: STAT CARD ---
const StatCard = ({ label, value, variant }) => {
  const styles = {
    slate: "bg-white border-slate-200 text-slate-900",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
    blue: "bg-blue-50 border-blue-100 text-blue-700",
    amber: "bg-amber-50 border-amber-100 text-amber-700",
  };
  return (
    <div className={`p-6 rounded-[2.5rem] border ${styles[variant]} shadow-sm`}>
      <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">
        {label}
      </p>
      <p className="text-2xl font-black">{value}</p>
    </div>
  );
};

// --- SUB-COMPONENT: APPLICANT CARD ---
const ApplicantCard = ({
  app,
  onStatusChange,
  isSelected,
  onSelect,
  isBulkSelected,
  onToggleSelect,
}) => {
  const displayScore = app.ai_analysis?.score ?? app.match_score ?? 0;

  return (
    <div
      onClick={onSelect}
      className={`relative p-6 border rounded-[2.5rem] transition-all cursor-pointer flex items-center gap-4 ${
        isSelected
          ? "bg-white border-blue-500 shadow-xl ring-4 ring-blue-500/5"
          : "bg-slate-50 border-slate-100 hover:bg-white hover:border-slate-200"
      }`}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect();
        }}
        className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all flex-shrink-0 ${
          isBulkSelected
            ? "bg-blue-600 border-blue-600 shadow-lg shadow-blue-200"
            : "bg-white border-slate-200"
        }`}
      >
        {isBulkSelected && (
          <span className="text-white text-[10px] font-black">✓</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <p className="font-black text-slate-900 text-sm truncate uppercase tracking-tight">
            {app.seeker_email.split("@")[0]}
          </p>
          <span
            className={`text-[8px] font-black px-2 py-0.5 rounded-full ${displayScore > 70 ? "bg-emerald-500" : "bg-blue-500"} text-white uppercase`}
          >
            {displayScore}%
          </span>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={app.status}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onStatusChange(app.id, e.target.value)}
            className="text-[9px] uppercase font-black px-3 py-1.5 rounded-xl border bg-white outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="pending">Pending</option>
            <option value="viewed">Under Review</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="rejected">Rejected</option>
          </select>
          <a
            href={app.resume}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
          >
            Open CV 📄
          </a>
        </div>
      </div>
    </div>
  );
};

const LoadingState = () => (
  <div className="flex flex-col items-center py-24 w-full bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-100">
    <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mb-4"></div>
    <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em]">
      Syncing Pipeline...
    </p>
  </div>
);

export default ApplicantListModal;
