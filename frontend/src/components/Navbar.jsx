import React from "react";
// Import the bell component we discussed
import EmployerNotificationBell from "../features/employer/components/EmployerNotificationBell";

/**
 * Global Navigation Bar.
 * Displays user identity, role-specific badges, notifications, and auth controls.
 */
const Navbar = ({ userData, onLogout, token }) => {
  const userInitial = userData?.email ? userData.email[0].toUpperCase() : "?";

  return (
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-[100] border-b border-slate-100 px-6 py-4 flex justify-between items-center shadow-sm">
      {/* Brand Logo */}
      <div className="flex items-center gap-2">
        <div className="bg-blue-600 text-white p-1.5 rounded-lg text-lg">
          🤖
        </div>
        <h1 className="text-xl font-black text-slate-900 tracking-tighter">
          AI<span className="text-blue-600">Portal</span>
        </h1>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        {/* --- NOTIFICATION BELL (Employer Only) --- */}
        {userData?.is_employer && token && (
          <div className="mr-2">
            <EmployerNotificationBell token={token} />
          </div>
        )}

        {/* User Profile Section */}
        {userData && (
          <div className="flex items-center gap-3 pr-2">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[11px] font-bold text-slate-900 truncate max-w-[150px]">
                {userData.email}
              </span>
              <span
                className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                  userData.is_employer
                    ? "bg-amber-100 text-amber-700 border border-amber-200"
                    : "bg-blue-50 text-blue-600 border border-blue-100"
                }`}
              >
                {userData.is_employer ? "Employer" : "Candidate"}
              </span>
            </div>

            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-slate-200">
              {userInitial}
            </div>
          </div>
        )}

        <div className="h-8 w-px bg-slate-100 hidden sm:block"></div>

        <button
          onClick={onLogout}
          className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-rose-600 transition-all active:scale-95"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
