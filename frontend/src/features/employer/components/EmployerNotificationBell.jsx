import { useState, useEffect } from "react";
import { jobService } from "../../jobs/services/jobService";
import WithdrawalHistoryModal from "./WithdrawalHistoryModal";

const EmployerNotificationBell = ({ token }) => {
  const [logs, setLogs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const fetchLogs = async () => {
    try {
      const res = await jobService.fetchGlobalWithdrawals(token);
      const fetchedLogs = res.data;
      setLogs(fetchedLogs);

      if (fetchedLogs.length > 0) {
        // Get the ID of the most recent withdrawal
        const latestId = fetchedLogs[0].id;
        const lastSeenId = parseInt(
          localStorage.getItem("last_seen_withdrawal_id") || "0",
        );

        // If the latest ID is bigger than what we've seen, it's new!
        if (latestId > lastSeenId) {
          setHasUnread(true);
        } else {
          setHasUnread(false);
        }
      }
    } catch (err) {
      console.error("Sync Error:", err.response?.status);
    }
  };

  useEffect(() => {
    if (token) {
      fetchLogs();
      const interval = setInterval(fetchLogs, 20000); // Check every 20s
      return () => clearInterval(interval);
    }
  }, [token]);

  const handleOpenModal = () => {
    setShowModal(true);
    if (logs.length > 0) {
      // Mark the latest ID as "seen"
      localStorage.setItem("last_seen_withdrawal_id", logs[0].id.toString());
      setHasUnread(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        className={`relative p-2 rounded-xl transition-all duration-500 border group ${
          hasUnread
            ? "bg-amber-100 border-amber-300 shadow-lg shadow-amber-200/50 scale-110"
            : "bg-slate-50 border-slate-100"
        }`}
      >
        <span
          className={`text-lg transition-all duration-500 ${
            hasUnread ? "grayscale-0" : "grayscale opacity-30"
          }`}
        >
          🔔
        </span>

        {hasUnread && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600 border-2 border-white"></span>
          </span>
        )}
      </button>

      {showModal && (
        <WithdrawalHistoryModal
          jobId={null}
          jobTitle="Global Withdrawal History"
          token={token}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default EmployerNotificationBell;
