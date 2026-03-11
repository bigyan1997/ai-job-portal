import { useState } from "react";
import ApplyModal from "./ApplyModal";

/**
 * Individual Job Card component for the Seeker feed.
 * Displays job highlights and manages the 'Save' and 'Apply' actions.
 */
const JobCard = ({ job, token, onSaveToggle }) => {
  const [showApplyModal, setShowApplyModal] = useState(false);

  // Helper to format the date into a readable string
  const formattedDate = new Date(job.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-200 hover:shadow-lg hover:shadow-slate-100 transition-all duration-300 mb-6 group">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex-1">
          {/* Job Title & Company */}
          <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
            {job.title}
          </h3>
          <p className="text-blue-600 font-semibold flex items-center gap-1">
            🏢 {job.company_name}
          </p>
        </div>

        {/* Salary Badge */}
        <span className="bg-emerald-50 text-emerald-700 text-xs font-black px-4 py-1.5 rounded-full border border-emerald-100 uppercase tracking-wide">
          {job.salary_range || "Competitive"}
        </span>
      </div>

      {/* Description Snippet */}
      <div className="mt-4 text-slate-600 text-sm leading-relaxed line-clamp-2 italic">
        "{job.description}"
      </div>

      {/* Meta Information & Actions */}
      <div className="mt-8 pt-4 border-t border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-4 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded">
            📍 {job.location}
          </span>
          <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded">
            📅 {formattedDate}
          </span>
          <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded text-blue-500">
            👥 {job.applicant_count || 0} Applicants
          </span>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Save Toggle */}
          <button
            onClick={onSaveToggle}
            className={`flex-1 md:flex-none p-2.5 rounded-xl border transition-all active:scale-95 ${
              job.is_saved
                ? "bg-rose-50 border-rose-100 text-rose-500"
                : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:border-slate-300"
            }`}
            aria-label={job.is_saved ? "Unsave Job" : "Save Job"}
          >
            {job.is_saved ? "❤️" : "🤍"}
          </button>

          {/* Apply Action */}
          <button
            onClick={() => setShowApplyModal(true)}
            className="flex-[3] md:flex-none bg-slate-900 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-slate-200 active:scale-95"
          >
            Apply Now
          </button>
        </div>
      </div>

      {/* Application Modal Overlay */}
      {showApplyModal && (
        <ApplyModal
          job={job}
          token={token}
          onClose={() => setShowApplyModal(false)}
          onSuccess={() => {
            // Success logic is handled by the ApplyModal,
            // but we could add a local success state here if needed.
          }}
        />
      )}
    </div>
  );
};

export default JobCard;
