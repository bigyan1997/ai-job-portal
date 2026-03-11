import React from "react";

/**
 * Final step in the registration process.
 * Maps directly to the 'is_employer' and 'is_job_seeker' boolean fields
 * in the CustomUser Django model.
 */
const RoleSelection = ({ onSelect }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-sm mx-auto p-2">
      <div className="text-center">
        <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl shadow-inner">
          ✨
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Choose Your Path
        </h2>
        <p className="text-slate-500 text-sm mt-2 font-medium">
          How will you be using the AI Portal today?
        </p>
      </div>

      <div className="grid gap-4">
        {/* Job Seeker Selection */}
        <button
          onClick={() => onSelect("is_job_seeker")}
          className="group relative flex items-center justify-between w-full p-6 bg-white border-2 border-slate-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300 text-left active:scale-[0.98] shadow-sm hover:shadow-md"
        >
          <div className="flex-1 pr-4">
            <p className="font-black text-slate-900 group-hover:text-blue-700 transition-colors uppercase tracking-wide text-xs mb-1">
              Job Seeker
            </p>
            <p className="text-sm text-slate-500 leading-snug font-medium">
              Find opportunities and get matched by AI.
            </p>
          </div>
          <span className="text-3xl filter grayscale group-hover:grayscale-0 transition-all duration-300">
            🚀
          </span>
        </button>

        {/* Employer Selection */}
        <button
          onClick={() => onSelect("is_employer")}
          className="group relative flex items-center justify-between w-full p-6 bg-white border-2 border-slate-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300 text-left active:scale-[0.98] shadow-sm hover:shadow-md"
        >
          <div className="flex-1 pr-4">
            <p className="font-black text-slate-900 group-hover:text-blue-700 transition-colors uppercase tracking-wide text-xs mb-1">
              Employer
            </p>
            <p className="text-sm text-slate-500 leading-snug font-medium">
              Post roles and review AI-ranked candidates.
            </p>
          </div>
          <span className="text-3xl filter grayscale group-hover:grayscale-0 transition-all duration-300">
            💼
          </span>
        </button>
      </div>

      <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] pt-4">
        You can change this in settings later
      </p>
    </div>
  );
};

export default RoleSelection;
