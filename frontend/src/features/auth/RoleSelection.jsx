import React from "react";
import { authService } from "./authService";

const RoleSelection = ({ token, onSelectionComplete }) => {
  const handleRoleSelect = async (role) => {
    try {
      // Mapping the button click to your Django boolean fields
      const roleData = {
        is_job_seeker: role === "seeker",
        is_employer: role === "employer",
      };

      // Call the service to update the user in the backend
      await authService.updateRole(token, roleData);

      // Notify the parent (App.jsx) that we are done
      onSelectionComplete(role);
    } catch (err) {
      console.error("Failed to set role:", err);
      alert("There was an error saving your profile type. Please try again.");
    }
  };

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
        <RoleCard
          title="Job Seeker"
          description="Find opportunities and get matched by AI."
          icon="🚀"
          onClick={() => handleRoleSelect("seeker")}
        />

        <RoleCard
          title="Employer"
          description="Post roles and review AI-ranked candidates."
          icon="💼"
          onClick={() => handleRoleSelect("employer")}
        />
      </div>
    </div>
  );
};

// Clean sub-component to keep the main view readable
const RoleCard = ({ title, description, icon, onClick }) => (
  <button
    onClick={onClick}
    className="group relative flex items-center justify-between w-full p-6 bg-white border-2 border-slate-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300 text-left active:scale-[0.98] shadow-sm hover:shadow-md"
  >
    <div className="flex-1 pr-4">
      <p className="font-black text-slate-900 group-hover:text-blue-700 transition-colors uppercase tracking-wide text-xs mb-1">
        {title}
      </p>
      <p className="text-sm text-slate-500 leading-snug font-medium">
        {description}
      </p>
    </div>
    <span className="text-3xl filter grayscale group-hover:grayscale-0 transition-all duration-300">
      {icon}
    </span>
  </button>
);

export default RoleSelection;
