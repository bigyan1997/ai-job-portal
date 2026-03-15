import { useState, useEffect } from "react";
import axios from "axios";
import { Toaster } from "react-hot-toast";

// Feature Components
import LoginView from "./features/auth/LoginView";
import SignUpView from "./features/auth/SignUpView";
import RoleSelection from "./features/auth/RoleSelection";
import JobList from "./features/jobs/JobList";
import JobModal from "./features/jobs/components/JobModal";
import JobPostForm from "./features/employer/components/JobPostForm";
import EmployerJobList from "./features/employer/components/EmployerJobList";
import MyApplications from "./features/jobs/components/MyApplications";
import NotificationList from "./features/notifications/components/NotificationList";
import EmployerNotificationBell from "./features/employer/components/EmployerNotificationBell";

// Hooks & Services
import { useNotifications } from "./features/notifications/hooks/useNotifications";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [userData, setUserData] = useState(null);
  const [roleAssigned, setRoleAssigned] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("all");
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Hook handles WebSocket & Polling logic internally
  const {
    notifications,
    setNotifications,
    unreadCount,
    markAsRead,
    markAllRead,
  } = useNotifications(token);

  const API_BASE = "http://127.0.0.1:8000";

  // --- Handlers ---
  const refreshUserData = async (activeToken) => {
    const targetToken = activeToken || token;
    if (!targetToken) return;
    try {
      const res = await axios.get(`${API_BASE}/dj-rest-auth/user/`, {
        headers: { Authorization: `Token ${targetToken}` },
      });
      setUserData(res.data);
      if (res.data.is_job_seeker || res.data.is_employer) setRoleAssigned(true);
    } catch (err) {
      console.error("User fetch failed", err);
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleManualAuth = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    refreshUserData(newToken);
  };

  const handleGoogleSuccess = async (response) => {
    try {
      const res = await axios.post(`${API_BASE}/dj-rest-auth/google/`, {
        access_token: response.credential,
        id_token: response.credential,
      });
      handleManualAuth(res.data.key);
    } catch (err) {
      console.error("Google Auth Error", err);
    }
  };

  const selectRole = async (roleField) => {
    try {
      const res = await axios.patch(
        `${API_BASE}/api/user/update/`,
        { [roleField]: true },
        { headers: { Authorization: `Token ${token}` } },
      );
      setUserData(res.data);
      setRoleAssigned(true);
    } catch (err) {
      console.error("Role assignment failed", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUserData(null);
    setRoleAssigned(false);
    setView("all");
  };

  // On Mount: Validate existing session
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      refreshUserData(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) return <LoadingSpinner />;

  // --- Authenticated State ---
  if (token && roleAssigned) {
    return (
      <div className="flex min-h-screen bg-slate-50 text-slate-900">
        <Toaster
          position="top-center"
          reverseOrder={false}
          containerStyle={{
            zIndex: 99999,
          }}
          toastOptions={{
            style: {
              borderRadius: "16px",
              background: "#0f172a",
              color: "#fff",
              fontWeight: "600",
              fontSize: "14px",
              padding: "16px 24px",
            },
          }}
        />

        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full z-10">
          {/* Passed token here to enable Global Notification Bell */}
          <SidebarHeader isEmployer={userData?.is_employer} token={token} />

          <nav className="flex-1 px-4 space-y-2">
            <NavItems
              view={view}
              setView={setView}
              isEmployer={userData?.is_employer}
              unreadCount={unreadCount}
              savedCount={userData?.saved_jobs_count}
              onMarkAllRead={markAllRead}
            />
          </nav>
          <UserMenu email={userData?.email} onLogout={handleLogout} />
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 ml-64 p-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-8 tracking-tight">
              {getViewTitle(view, userData?.is_employer)}
            </h2>

            {userData?.is_employer ? (
              <>
                <JobPostForm
                  token={token}
                  onJobPosted={() => setRefreshTrigger((t) => t + 1)}
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
                    onViewJob={setSelectedJobId}
                    markAsRead={markAsRead}
                  />
                )}
                {(view === "all" || view === "saved") && (
                  <JobList
                    token={token}
                    viewType={view}
                    onSaveChange={() => refreshUserData(token)}
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

  // --- Auth State ---
  return (
    <AuthLayout>
      {!token ? (
        showSignUp ? (
          <SignUpView
            onSignUpSuccess={handleManualAuth}
            onSwitchToLogin={() => setShowSignUp(false)}
          />
        ) : (
          <LoginView
            onSuccess={handleGoogleSuccess}
            onManualLoginSuccess={handleManualAuth}
            onSwitchToSignup={() => setShowSignUp(true)}
          />
        )
      ) : (
        <RoleSelection onSelect={selectRole} />
      )}
    </AuthLayout>
  );
}

/** --- Sub-components --- **/

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// Unified SidebarHeader with Notification Bell logic
const SidebarHeader = ({ isEmployer, token }) => (
  <div className="p-8 flex justify-between items-start">
    <div>
      <h1 className="text-2xl font-black text-blue-600 tracking-tight">
        AI Portal
      </h1>
      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">
        {isEmployer ? "Employer Pro" : "Seeker Dashboard"}
      </p>
    </div>

    {/* Global Notification Bell for Employers */}
    {isEmployer && token && <EmployerNotificationBell token={token} />}
  </div>
);

const UserMenu = ({ email, onLogout }) => (
  <div className="p-4 border-t border-slate-100 bg-slate-50/50">
    <div className="flex items-center gap-3 px-2">
      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
        {email?.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-700 truncate">{email}</p>
        <button
          onClick={onLogout}
          className="text-[10px] text-red-400 font-bold hover:text-red-600 uppercase"
        >
          Sign Out
        </button>
      </div>
    </div>
  </div>
);

const NavItems = ({
  view,
  setView,
  isEmployer,
  unreadCount,
  savedCount,
  onMarkAllRead,
}) => {
  if (isEmployer) {
    return (
      <NavItem
        icon="📊"
        label="Dashboard"
        active={view === "all"}
        onClick={() => setView("all")}
      />
    );
  }
  return (
    <>
      <NavItem
        icon="🔍"
        label="Browse Jobs"
        active={view === "all"}
        onClick={() => setView("all")}
      />
      <NavItem
        icon="❤️"
        label="Saved"
        active={view === "saved"}
        onClick={() => setView("saved")}
        badge={savedCount}
      />
      <NavItem
        icon="💼"
        label="Applications"
        active={view === "applied"}
        onClick={() => setView("applied")}
      />
      <NavItem
        icon="🔔"
        label="Notifications"
        active={view === "notifications"}
        onClick={() => setView("notifications")}
        badge={unreadCount}
        isUrgent={unreadCount > 0}
        onAction={onMarkAllRead}
      />
    </>
  );
};

const NavItem = ({
  icon,
  label,
  active,
  onClick,
  badge,
  isUrgent,
  onAction,
}) => (
  <div className="relative group">
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all ${
        active
          ? "bg-blue-600 text-white shadow-lg"
          : "text-slate-500 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-center gap-3">
        <span>{icon}</span> {label}
      </div>

      <div className="flex items-center gap-2">
        {badge > 0 && (
          <span
            className={`text-[10px] px-2 py-0.5 rounded-md transition-all ${
              active
                ? "bg-white text-blue-600"
                : isUrgent
                  ? "bg-amber-500 text-white animate-pulse"
                  : "bg-slate-200 text-slate-600"
            }`}
          >
            {badge}
          </span>
        )}
      </div>
    </button>
  </div>
);

const AuthLayout = ({ children }) => (
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
      <div className="p-8">{children}</div>
    </div>
  </div>
);

const getViewTitle = (view, isEmployer) => {
  if (isEmployer) return "Employer Dashboard";
  switch (view) {
    case "saved":
      return "Your Favorites";
    case "applied":
      return "Active Applications";
    case "notifications":
      return "Notifications";
    default:
      return "Discover AI Jobs";
  }
};

export default App;
