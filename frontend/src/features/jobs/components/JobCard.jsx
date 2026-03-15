import { useState } from "react";
import JobModal from "./JobModal";

const JobCard = ({ job, token, onSaveToggle, onRefresh }) => {
  const [showApplyModal, setShowApplyModal] = useState(false);

  const formattedDate = new Date(job.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-200 hover:shadow-lg transition-all duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex-1">
          {/* TITLE CLICK TRIGGER */}
          <h3
            onClick={() => setShowApplyModal(true)}
            className="text-xl font-bold text-slate-900 cursor-pointer hover:text-blue-600 transition-colors inline-block"
          >
            {job.title}
          </h3>
          <p className="text-blue-600 font-semibold flex items-center gap-1 mt-1">
            🏢 {job.company_name}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className="bg-emerald-50 text-emerald-700 text-xs font-black px-4 py-1.5 rounded-full border border-emerald-100 uppercase">
            {job.salary_range || "Competitive"}
          </span>
          {job.has_applied && job.ai_analysis?.score > 0 && (
            <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase">
              {job.ai_analysis.score}% Match
            </span>
          )}
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-slate-50 flex justify-between items-center gap-6">
        <div className="flex gap-4 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
          <span>📍 {job.location}</span>
          <span>📅 {formattedDate}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onSaveToggle}
            className={`p-2.5 rounded-xl border transition-all ${job.is_saved ? "bg-rose-50 border-rose-100 text-rose-500" : "bg-white border-slate-200 text-slate-400"}`}
          >
            {job.is_saved ? "❤️" : "🤍"}
          </button>

          {job.has_applied ? (
            <button
              onClick={() => setShowApplyModal(true)} // Still allow opening the modal to see analysis
              className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-8 py-2.5 rounded-xl font-bold border border-emerald-100 text-xs uppercase hover:bg-emerald-100 transition-all"
            >
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Applied
            </button>
          ) : (
            <button
              onClick={() => setShowApplyModal(true)}
              className="bg-slate-900 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg active:scale-95"
            >
              Apply Now
            </button>
          )}
        </div>
      </div>

      {showApplyModal && (
        <JobModal
          jobId={job.id}
          token={token}
          onClose={() => setShowApplyModal(false)}
          onApplySuccess={onRefresh}
        />
      )}
    </div>
  );
};

export default JobCard;
