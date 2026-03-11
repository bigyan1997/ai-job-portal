import React from "react";
import axios from "axios";

/**
 * Enhanced Notification Feed.
 * Features Glassmorphism design, real-time status pulses, and safe ID handling.
 */
const NotificationList = ({
  notifications,
  setNotifications,
  token,
  onViewJob,
}) => {
  const API_BASE = "http://127.0.0.1:8000/api/jobs/notifications/";

  // --- API ACTIONS ---

  const deleteNotification = async (id) => {
    // Only attempt delete if ID is a valid database integer
    if (!id || typeof id === "string") return;
    try {
      await axios.delete(`${API_BASE}${id}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Delete notification failed:", err);
    }
  };

  const markAllRead = async () => {
    try {
      await axios.post(
        API_BASE,
        {},
        {
          headers: { Authorization: `Token ${token}` },
        },
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Mark all read failed:", err);
    }
  };

  const markSingleRead = async (id) => {
    // CRITICAL FIX: Ignore IDs that look like timestamps (too long for standard PKs)
    if (!id || id > 1000000000) return;

    try {
      await axios.patch(
        `${API_BASE}${id}/`,
        { is_read: true },
        { headers: { Authorization: `Token ${token}` } },
      );
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
    } catch (err) {
      console.error("Mark single read failed:", err);
    }
  };

  const clearAll = async () => {
    if (!window.confirm("Permanently delete all notifications?")) return;
    try {
      await axios.delete(API_BASE, {
        headers: { Authorization: `Token ${token}` },
      });
      setNotifications([]);
    } catch (err) {
      console.error("Clear all failed:", err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 px-4 pb-20 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* Premium Glassmorphism Header */}
      <div className="sticky top-6 z-30 flex justify-between items-center bg-white/70 backdrop-blur-2xl p-8 rounded-[3rem] border border-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
            <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">
              Smart Stream
            </h3>
          </div>
          <p className="text-sm font-black text-slate-900 tracking-tight">
            {notifications.filter((n) => !n.is_read).length} Unread Updates
          </p>
        </div>

        <div className="flex gap-2">
          {notifications.some((n) => !n.is_read) && (
            <button
              onClick={markAllRead}
              className="px-5 py-2.5 text-[10px] font-black text-slate-900 bg-white border border-slate-100 hover:bg-slate-900 hover:text-white rounded-2xl transition-all uppercase tracking-widest shadow-sm active:scale-95"
            >
              Read All
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="px-5 py-2.5 text-[10px] font-black text-rose-500 hover:bg-rose-50 rounded-2xl transition-all uppercase tracking-widest active:scale-95"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Cards List */}
      <div className="space-y-6">
        {notifications.length > 0 ? (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                if (!n.is_read) markSingleRead(n.id);
                const jobId = n.application?.job?.id || n.job_id;
                if (jobId) onViewJob(jobId);
              }}
              className={`group relative p-10 rounded-[3.5rem] border-2 transition-all duration-500 cursor-pointer overflow-hidden ${
                n.is_read
                  ? "bg-slate-50/50 border-transparent opacity-60 grayscale-[0.5] hover:grayscale-0 hover:bg-white hover:border-slate-100"
                  : "bg-white border-blue-600 shadow-[0_30px_60px_rgba(37,99,235,0.1)] hover:scale-[1.02]"
              }`}
            >
              {/* Individual Delete - Refined Visual */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(n.id);
                }}
                className="absolute top-10 right-10 w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-100 text-slate-400 hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-sm"
              >
                ✕
              </button>

              <div className="flex items-start gap-8">
                {/* Visual Icon with Score Integration */}
                <div
                  className={`mt-1 flex-shrink-0 w-16 h-16 rounded-[2rem] flex items-center justify-center text-2xl transition-all duration-500 ${
                    n.is_read
                      ? "bg-slate-200/50 text-slate-400"
                      : "bg-blue-600 text-white shadow-xl shadow-blue-200"
                  }`}
                >
                  {n.message.toLowerCase().includes("match") ? "🎯" : "⚡"}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <p
                      className={`text-[17px] leading-[1.6] pr-10 tracking-tight ${
                        n.is_read
                          ? "text-slate-500 font-medium"
                          : "text-slate-900 font-black"
                      }`}
                    >
                      {n.message}
                    </p>
                  </div>

                  <div className="flex items-center gap-5">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                      {n.created_at_human}
                    </p>
                    {!n.is_read && (
                      <span className="flex items-center gap-2 text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-ping"></span>
                        Action Required
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          /* Empty State - High Visual Quality */
          <div className="text-center py-32 bg-white rounded-[4rem] border-2 border-dashed border-slate-100 shadow-inner">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl grayscale opacity-50">
              📬
            </div>
            <h4 className="text-slate-900 font-black text-2xl tracking-tight">
              Quiet on the front
            </h4>
            <p className="text-slate-400 text-sm mt-3 max-w-[320px] mx-auto font-medium leading-relaxed">
              When employers review your nursing credentials or match scores
              change, you'll see them here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationList;
