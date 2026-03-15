import { useState, useEffect } from "react";
import { jobService } from "../services/jobService";
import toast from "react-hot-toast";

/**
 * MyApplications: The Seeker's Command Center.
 * Features: Smart Pipeline, Live Activity Tracking, and Professional Withdrawal with Feedback.
 */
const MyApplications = ({ token }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    const fetchMyApps = async () => {
      try {
        const res = await jobService.fetchMyApplications(token);
        setApplications(res.data);
      } catch (err) {
        console.error("Error fetching applications:", err);
        toast.error("Could not sync your trackers.");
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchMyApps();
  }, [token]);

  const handleWithdrawSuccess = (deletedId) => {
    setApplications((prev) => prev.filter((app) => app.id !== deletedId));
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-12 px-4 animate-in fade-in duration-700">
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-4xl font-black text-slate-900 tracking-tight">
            Smart Tracker
          </h3>
          <p className="text-slate-500 font-medium mt-1">
            Real-time pipeline of your professional candidacy
          </p>
        </div>
        <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">
          {applications.length} Active Trackers
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : applications.length > 0 ? (
        <div className="grid gap-6">
          {applications.map((app) => (
            <ApplicationTrackerCard
              key={app.id}
              app={app}
              onOpenDetails={() => setSelectedApp(app)}
            />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}

      {/* --- MODAL LAYER --- */}
      {selectedApp && (
        <ApplicationDetailModal
          app={selectedApp}
          token={token}
          onClose={() => setSelectedApp(null)}
          onWithdrawSuccess={handleWithdrawSuccess}
        />
      )}
    </div>
  );
};

/* --- SUB-COMPONENT: DETAIL MODAL WITH FEEDBACK WITHDRAWAL --- */
const ApplicationDetailModal = ({ app, token, onClose, onWithdrawSuccess }) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reason, setReason] = useState("Accepted another offer");

  const handleWithdraw = async () => {
    // Try to find the ID in app.job_id, app.job.id, or just app.job
    const targetJobId = app.job_id || (app.job && app.job.id) || app.job;

    if (!targetJobId) {
      console.error("DEBUG: Application object structure:", app);
      return toast.error("Critical Error: Job ID not found.");
    }

    setIsDeleting(true);
    try {
      // Use targetJobId instead of app.job_id
      await jobService.withdrawApplication(token, targetJobId, reason);
      onWithdrawSuccess(app.id);
      toast.success("Application withdrawn. Feedback sent.");
      onClose();
    } catch (err) {
      toast.error("Withdrawal failed.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h4 className="text-xl font-black">{app.job_title}</h4>
            <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">
              {app.company_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors text-xl"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-10 overflow-y-auto custom-scrollbar space-y-8 flex-1">
          <div className="space-y-4">
            <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
              Submitted Cover Letter
            </h5>
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 text-[14px] leading-7 text-slate-800 font-serif whitespace-pre-wrap italic">
              {app.cover_letter || "No cover letter was included."}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
              <p className="text-[9px] font-black text-emerald-600 uppercase mb-3">
                AI Matching Strengths
              </p>
              <ul className="text-xs text-emerald-900 font-bold space-y-2">
                {app.ai_analysis?.matching?.map((m, i) => (
                  <li key={i}>• {m}</li>
                ))}
              </ul>
            </div>
            <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100">
              <p className="text-[9px] font-black text-rose-600 uppercase mb-3">
                Identified Gaps
              </p>
              <ul className="text-xs text-rose-900 font-bold space-y-2">
                {app.ai_analysis?.missing?.map((m, i) => (
                  <li key={i}>• {m}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Modal Footer: Action Hub */}
        <div className="p-8 bg-slate-50 border-t">
          {!isConfirming ? (
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center w-full">
              <a
                href={app.resume}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest text-center shadow-lg hover:bg-blue-600 transition-all"
              >
                View Submitted Resume 📄
              </a>
              <button
                onClick={() => setIsConfirming(true)}
                className="w-full sm:w-auto px-8 py-4 bg-white text-rose-500 border border-rose-100 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-50 transition-all"
              >
                Withdraw Application
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-in slide-in-from-bottom-2">
              <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block">
                  Reason for Withdrawal
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-4 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 outline-none"
                >
                  <option value="Accepted another offer">
                    Accepted another offer
                  </option>
                  <option value="Salary expectations not met">
                    Salary expectations not met
                  </option>
                  <option value="No longer interested in the role">
                    No longer interested
                  </option>
                  <option value="Personal reasons">Personal reasons</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleWithdraw}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-[10px] hover:bg-rose-700 shadow-lg shadow-rose-200"
                >
                  {isDeleting ? "Processing..." : "Confirm & Send Feedback"}
                </button>
                <button
                  onClick={() => setIsConfirming(false)}
                  className="px-6 py-4 bg-slate-200 text-slate-600 rounded-2xl font-black uppercase text-[10px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* --- SUB-COMPONENT: TRACKER CARD --- */
const ApplicationTrackerCard = ({ app, onOpenDetails }) => {
  const {
    status,
    applied_on,
    updated_at,
    ai_analysis,
    job_title,
    company_name,
  } = app;

  const lastActivity = new Date(updated_at || applied_on).toLocaleString(
    "en-AU",
    {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  const steps = ["Submitted", "Under Review", "Decision"];
  let currentStep = 0;
  if (["viewed", "shortlisted", "rejected"].includes(status)) currentStep = 1;
  if (["shortlisted", "rejected", "hired"].includes(status)) currentStep = 2;

  const displayScore = ai_analysis?.score ?? app.match_score ?? 0;

  const needsFollowUp = () => {
    const diff = Math.ceil(
      (new Date() - new Date(applied_on)) / (1000 * 60 * 60 * 24),
    );
    return diff > 7 && (status === "pending" || status === "viewed");
  };

  return (
    <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 group">
      <div className="flex flex-col lg:flex-row justify-between gap-10">
        <div className="flex-1">
          <div className="mb-6">
            <h4 className="font-black text-slate-900 text-2xl group-hover:text-blue-600 transition-colors">
              {job_title}
            </h4>
            <p className="text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
              {company_name}
            </p>
          </div>

          <div className="inline-flex flex-col bg-slate-50 p-5 rounded-[2.5rem] border border-slate-100">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
              AI Relevance
            </span>
            <div className="flex items-center gap-4">
              <div className="w-32 bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${displayScore > 75 ? "bg-emerald-500" : "bg-blue-500"}`}
                  style={{ width: `${displayScore}%` }}
                ></div>
              </div>
              <span className="text-sm font-black text-slate-900">
                {displayScore}%
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <div className="relative flex justify-between items-center px-4">
            <div className="absolute top-4 left-0 w-full h-0.5 bg-slate-100 -z-0"></div>
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="relative z-10 flex flex-col items-center gap-3"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${
                    idx <= currentStep
                      ? "bg-blue-600 border-white text-white shadow-lg scale-110"
                      : "bg-white border-slate-100 text-slate-300"
                  }`}
                >
                  {idx < currentStep ? (
                    "✓"
                  ) : (
                    <span className="text-[11px] font-black">{idx + 1}</span>
                  )}
                </div>
                <p
                  className={`text-[10px] font-black uppercase tracking-tighter ${idx <= currentStep ? "text-slate-900" : "text-slate-300"}`}
                >
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- ACTIVITY LOG & ACTION --- */}
      <div className="mt-8 pt-8 border-t border-slate-50 flex flex-wrap items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                status === "viewed"
                  ? "bg-blue-500"
                  : status === "shortlisted"
                    ? "bg-emerald-500"
                    : "bg-slate-300"
              }`}
            ></span>
            <p className="text-[11px] font-black uppercase text-slate-900 tracking-widest">
              Last Activity: {lastActivity}
            </p>
          </div>
          <p className="text-[10px] text-slate-400 font-bold ml-4 lowercase">
            {status === "viewed"
              ? "Employer is currently reviewing your profile"
              : status === "shortlisted"
                ? "You have been moved to the shortlist"
                : "Application received and queued for review"}
          </p>
        </div>

        <button
          onClick={onOpenDetails}
          className="px-6 py-3 bg-slate-50 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm"
        >
          Submission Details
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${
              status === "shortlisted"
                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                : status === "rejected"
                  ? "bg-rose-50 text-rose-600 border-rose-100"
                  : "bg-slate-50 text-slate-500 border-slate-100"
            }`}
          >
            Current Status: {status}
          </span>
          {needsFollowUp() && (
            <div className="bg-amber-50 text-amber-600 text-[9px] font-black px-4 py-2 rounded-full animate-pulse border border-amber-100">
              💡 Suggest Follow-up
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* --- LOADING & EMPTY STATES --- */
const LoadingState = () => (
  <div className="flex flex-col items-center py-20 bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-100 w-full animate-pulse">
    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
    <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">
      Syncing Timeline...
    </p>
  </div>
);

const EmptyState = () => (
  <div className="text-center py-28 bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-100">
    <div className="text-6xl mb-6 opacity-40">🚀</div>
    <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
      Tracker Inactive
    </h4>
    <p className="text-slate-500 mt-3 max-w-xs mx-auto text-sm font-medium">
      Apply to jobs to start tracking your candidacy status.
    </p>
  </div>
);

export default MyApplications;
