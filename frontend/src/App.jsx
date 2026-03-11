import { useState, useEffect } from "react";
import axios from "axios";

// Component Imports
import LoginView from "./components/LoginView";
import SignUpView from "./components/SignupView";
import RoleSelection from "./components/RoleSelection";
import JobPostForm from "./components/JobPostForm";
import JobList from "./components/JobList";
import EmployerJobList from "./components/EmployerJobList";
import MyApplications from "./components/MyApplications";
import NotificationList from "./components/NotificationList";
import JobModal from "./components/JobModal";

function App() {
  const [token, setToken] = useState(null);
  const [showSignUp, setShowSignUp] = useState(false);
  const [userData, setUserData] = useState(null);
  const [roleAssigned, setRoleAssigned] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);

  const handleManualAuth = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    refreshUserData();
  };

  // --- API FETCHERS ---
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await axios.get(
        "http://127.0.0.1:8000/api/jobs/notifications/",
        {
          headers: { Authorization: `Token ${token}` },
        },
      );
      setNotifications(res.data);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const refreshUserData = async () => {
    if (!token) return;
    try {
      const res = await axios.get("http://127.0.0.1:8000/dj-rest-auth/user/", {
        headers: { Authorization: `Token ${token}` },
      });
      setUserData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // --- EFFECTS ---
  useEffect(() => {
    // 1. Strict check: Prevent connecting if token is missing or a placeholder string
    if (!token || token === "null" || token === "undefined") return;

    let socket;
    let reconnectTimeout;

    const connect = () => {
      socket = new WebSocket(
        `ws://127.0.0.1:8000/ws/notifications/?token=${token}`,
      );

      socket.onopen = () => {
        console.log("✅ WebSocket Connected for User");
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("📩 Real-time Update Received:", data);

        const normalizedNotification = {
          id: data.id || Date.now(),
          message: data.message,
          is_read: false,
          created_at: new Date().toISOString(),
          // Matches the structure NotificationList.jsx expects
          application: data.job_id ? { job: { id: data.job_id } } : null,
        };

        setNotifications((prev) => [normalizedNotification, ...prev]);
      };

      socket.onclose = (e) => {
        // Only reconnect if the closure wasn't intentional
        if (e.code !== 1000) {
          console.log("🔌 WebSocket lost. Reconnecting in 3s...");
          reconnectTimeout = setTimeout(connect, 3000);
        }
      };

      socket.onerror = (err) => {
        console.error("❌ WebSocket Error");
        socket.close();
      };
    };

    connect();

    return () => {
      if (socket) socket.close();
      clearTimeout(reconnectTimeout);
    };
  }, [token]);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      axios
        .get("http://127.0.0.1:8000/dj-rest-auth/user/", {
          headers: { Authorization: `Token ${savedToken}` },
        })
        .then((res) => {
          setToken(savedToken);
          setUserData(res.data);
          if (res.data.is_job_seeker || res.data.is_employer)
            setRoleAssigned(true);
        })
        .catch(() => localStorage.removeItem("token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Polling for Notifications (Every 60 seconds)
  useEffect(() => {
    if (token) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [token]);

  // --- HANDLERS ---
  const handleSuccess = async (response) => {
    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/dj-rest-auth/google/",
        {
          access_token: response.credential,
          id_token: response.credential,
        },
      );
      const tokenKey = res.data.key;
      localStorage.setItem("token", tokenKey);
      setToken(tokenKey);
      const userRes = await axios.get(
        "http://127.0.0.1:8000/dj-rest-auth/user/",
        {
          headers: { Authorization: `Token ${tokenKey}` },
        },
      );
      setUserData(userRes.data);
      if (userRes.data?.is_job_seeker || userRes.data?.is_employer)
        setRoleAssigned(true);
    } catch (err) {
      console.error(err);
    }
  };

  const selectRole = async (roleField) => {
    try {
      const res = await axios.patch(
        "http://127.0.0.1:8000/api/user/update/",
        { [roleField]: true },
        {
          headers: { Authorization: `Token ${token}` },
        },
      );
      setUserData(res.data);
      setRoleAssigned(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUserData(null);
    setRoleAssigned(false);
    setView("all");
    setNotifications([]);
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );

  if (token && roleAssigned) {
    const unreadCount = notifications.filter((n) => !n.is_read).length;

    return (
      <div className="flex min-h-screen bg-slate-50 text-slate-900">
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full z-10">
          <div className="p-8">
            <h1 className="text-2xl font-black text-blue-600 tracking-tight">
              AI Portal
            </h1>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">
              {userData?.is_employer ? "Employer Pro" : "Seeker Dashboard"}
            </p>
          </div>

          <nav className="flex-1 px-4 space-y-2">
            {userData?.is_employer ? (
              <button
                onClick={() => setView("all")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${view === "all" ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "text-slate-500 hover:bg-slate-50"}`}
              >
                <span>📊</span> Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => setView("all")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${view === "all" ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "text-slate-500 hover:bg-slate-50"}`}
                >
                  <span>🔍</span> Browse Jobs
                </button>
                <button
                  onClick={() => setView("saved")}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all ${view === "saved" ? "bg-red-500 text-white shadow-lg shadow-red-100" : "text-slate-500 hover:bg-slate-50"}`}
                >
                  <div className="flex items-center gap-3">
                    <span>❤️</span> Saved
                  </div>
                  {userData?.saved_jobs_count > 0 && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md ${view === "saved" ? "bg-white text-red-500" : "bg-red-500 text-white"}`}
                    >
                      {userData.saved_jobs_count}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setView("applied")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${view === "applied" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-slate-500 hover:bg-slate-50"}`}
                >
                  <span>💼</span> Applications
                </button>
                <button
                  onClick={() => setView("notifications")}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all ${view === "notifications" ? "bg-amber-500 text-white shadow-lg shadow-amber-100" : "text-slate-500 hover:bg-slate-50"}`}
                >
                  <div className="flex items-center gap-3">
                    <span>🔔</span> Notifications
                  </div>
                  {unreadCount > 0 && (
                    <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-md animate-pulse shadow-sm shadow-amber-200">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </>
            )}
          </nav>

          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0">
                {userData?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-700 truncate">
                  {userData?.email}
                </p>
                <button
                  onClick={handleLogout}
                  className="text-[10px] text-red-400 font-bold hover:text-red-600 uppercase tracking-tighter"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 ml-64 p-10">
          <div className="max-w-4xl mx-auto">
            <header className="mb-8">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {userData?.is_employer
                  ? "Employer Dashboard"
                  : view === "all"
                    ? "Discover AI Jobs"
                    : view === "saved"
                      ? "Your Favorites"
                      : view === "notifications"
                        ? "Notifications"
                        : "Active Applications"}
              </h2>
            </header>

            {userData?.is_employer ? (
              <>
                <JobPostForm
                  token={token}
                  onJobPosted={() => setRefreshTrigger((prev) => prev + 1)}
                />
                <EmployerJobList token={token} key={refreshTrigger} />
              </>
            ) : (
              <>
                {view === "applied" && <MyApplications token={token} />}
                {view === "notifications" && (
                  <NotificationList
                    notifications={notifications}
                    setNotifications={setNotifications}
                    token={token}
                    onViewJob={(id) => setSelectedJobId(id)}
                  />
                )}
                {(view === "all" || view === "saved") && (
                  <JobList
                    token={token}
                    viewType={view}
                    onSaveChange={refreshUserData}
                  />
                )}
              </>
            )}
          </div>
        </main>

        {selectedJobId && (
          <JobModal
            jobId={selectedJobId}
            token={token}
            onClose={() => setSelectedJobId(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-blue-600 p-8 text-center text-white">
          <h1 className="text-3xl font-extrabold tracking-tight">
            AI Job Portal
          </h1>
          <p className="text-blue-100 mt-2 text-sm font-medium">
            Next-gen matching
          </p>
        </div>
        <div className="p-8">
          {!token ? (
            showSignUp ? (
              <SignUpView
                onSignUpSuccess={handleManualAuth}
                onSwitchToLogin={() => setShowSignUp(false)}
              />
            ) : (
              <LoginView
                onSuccess={handleSuccess}
                onManualLoginSuccess={handleManualAuth}
                onSwitchToSignup={() => setShowSignUp(true)}
              />
            )
          ) : (
            <RoleSelection onSelect={selectRole} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
