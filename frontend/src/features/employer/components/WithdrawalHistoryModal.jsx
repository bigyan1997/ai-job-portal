import { useState, useEffect } from "react";
import { jobService } from "../../jobs/services/jobService";
import toast from "react-hot-toast";

const WithdrawalHistoryModal = ({ jobId, jobTitle, token, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        let res;
        if (jobId) {
          // Fetch for a specific job
          res = await jobService.fetchWithdrawalHistory(token, jobId);
        } else {
          // Fetch ALL withdrawals for this employer
          res = await jobService.fetchGlobalWithdrawals(token);
        }
        setLogs(res.data);
      } catch (err) {
        console.error("Fetch Error:", err);
        toast.error("Failed to load withdrawal history.");
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchHistory();
  }, [jobId, token]);

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-3xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="p-8 bg-slate-50 border-b flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Withdrawal Log
            </h3>
            <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest mt-1">
              {jobId ? `Job: ${jobTitle}` : "Global Management Console"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm hover:bg-slate-100 transition-colors text-slate-400"
          >
            ✕
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-white">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">
                Syncing History...
              </p>
            </div>
          ) : logs.length > 0 ? (
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                  <th className="pb-4 px-4">Candidate & Role</th>
                  <th className="pb-4 px-4">Reason</th>
                  <th className="pb-4 px-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="group bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-4 px-4 rounded-l-2xl">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900">
                          {log.seeker_name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold lowercase">
                          {log.seeker_email}
                        </span>
                        {/* Show Job Title if in Global View */}
                        {!jobId && (
                          <span className="text-[9px] font-black text-blue-500 uppercase mt-1">
                            📌 {log.job_title || "Unknown Job"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tight border ${
                          log.reason?.includes("offer")
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : log.reason?.includes("Salary")
                              ? "bg-amber-50 text-amber-600 border-amber-100"
                              : "bg-slate-100 text-slate-500 border-transparent"
                        }`}
                      >
                        {log.reason}
                      </span>
                    </td>
                    <td className="py-4 px-4 rounded-r-2xl text-[10px] font-black text-slate-400 uppercase">
                      {log.withdrawn_at}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-20 text-center">
              <div className="text-5xl mb-4 opacity-10 grayscale">📁</div>
              <h4 className="text-slate-900 font-black text-lg mb-1">
                No History Yet
              </h4>
              <p className="text-slate-400 font-bold text-xs">
                {jobId
                  ? "No candidates have withdrawn from this specific role."
                  : "Your global withdrawal history is currently clear."}
              </p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-6 bg-slate-50 border-t flex justify-end items-center gap-4">
          <p className="text-[9px] font-bold text-slate-400 uppercase">
            {logs.length} Total Records
          </p>
          <button
            onClick={onClose}
            className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-slate-800 transition-all active:scale-95"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalHistoryModal;
