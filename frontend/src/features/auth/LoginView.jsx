import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { authService } from "./authService"; // Import from the same feature folder

const LoginView = ({
  onSuccess,
  onError,
  onManualLoginSuccess,
  onSwitchToSignup,
}) => {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  // Unified change handler for all inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleManualLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Logic is now hidden inside the service
      const data = await authService.login(
        credentials.email,
        credentials.password,
      );

      // Pass the key/token back to your App.jsx or AuthContext
      onManualLoginSuccess(data.key || data.token);
    } catch (err) {
      console.error("Login error:", err.response?.data);
      alert(
        err.response?.data?.non_field_errors?.[0] ||
          "Invalid credentials. Please try again.",
      );
      if (onError) onError();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-8 w-full max-w-sm mx-auto p-6 bg-white rounded-3xl shadow-xl shadow-slate-100 animate-in fade-in zoom-in duration-300">
      <LoginHeader />

      <form onSubmit={handleManualLogin} className="w-full space-y-4">
        <AuthInput
          label="Email Address"
          name="email"
          type="email"
          placeholder="name@example.com"
          value={credentials.email}
          onChange={handleChange}
        />
        <AuthInput
          label="Password"
          name="password"
          type="password"
          placeholder="••••••••"
          value={credentials.password}
          onChange={handleChange}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Sign In"}
        </button>
      </form>

      <SocialDivider />

      <div className="w-full flex justify-center overflow-hidden rounded-xl border border-slate-100">
        <GoogleLogin
          onSuccess={onSuccess}
          onError={onError}
          useOneTap
          shape="rectangular"
          theme="filled_blue"
          width="320px"
        />
      </div>

      <FooterLink onSwitch={onSwitchToSignup} />
    </div>
  );
};

// --- Sub-Components (Keep your main component clean!) ---

const AuthInput = ({ label, ...props }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
      {label}
    </label>
    <input
      className="w-full px-4 py-3.5 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
      {...props}
      required
    />
  </div>
);

const LoginHeader = () => (
  <div className="text-center">
    <div className="bg-blue-600 w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-xl shadow-lg shadow-blue-200">
      🤖
    </div>
    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
      Welcome Back
    </h2>
    <p className="text-slate-500 text-sm mt-2 font-medium">
      The AI-driven path to your next role.
    </p>
  </div>
);

const SocialDivider = () => (
  <div className="w-full flex items-center gap-4">
    <div className="h-[1px] bg-slate-100 flex-1"></div>
    <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
      Social Auth
    </span>
    <div className="h-[1px] bg-slate-100 flex-1"></div>
  </div>
);

const FooterLink = ({ onSwitch }) => (
  <p className="text-xs text-slate-400 font-medium">
    New to the portal?{" "}
    <button
      onClick={onSwitch}
      className="text-blue-600 font-black hover:underline transition-all"
    >
      Create Account
    </button>
  </p>
);

export default LoginView;
