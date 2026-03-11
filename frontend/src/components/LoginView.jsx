import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";

/**
 * Authentication view providing both traditional and Google OAuth login.
 */
const LoginView = ({
  onSuccess,
  onError,
  onManualLoginSuccess,
  onSwitchToSignup,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const API_BASE = "http://127.0.0.1:8000/api/auth/login/";

  /**
   * Handles traditional email/password login.
   */
  const handleManualLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // FIX: Standard DRF/dj-rest-auth expects 'email' if you configured
      // your CustomUser that way, though some setups still use 'username' keys.
      // Based on your backend settings, we pass email.
      const res = await axios.post(API_BASE, {
        email: email,
        password: password,
      });

      // Pass the token (and potentially user role) to the global state
      onManualLoginSuccess(res.data.key || res.data.token);
    } catch (err) {
      console.error("Login error:", err.response?.data);
      alert("Invalid credentials. Please try again.");
      if (onError) onError();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-8 w-full max-w-sm mx-auto p-6 bg-white rounded-3xl shadow-xl shadow-slate-100 animate-in fade-in zoom-in duration-300">
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

      {/* Email/Password Form */}
      <form onSubmit={handleManualLogin} className="w-full space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Email Address
          </label>
          <input
            type="email"
            placeholder="name@example.com"
            className="w-full px-4 py-3.5 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full px-4 py-3.5 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Sign In"}
        </button>
      </form>

      {/* Divider */}
      <div className="w-full flex items-center gap-4">
        <div className="h-[1px] bg-slate-100 flex-1"></div>
        <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
          Social Auth
        </span>
        <div className="h-[1px] bg-slate-100 flex-1"></div>
      </div>

      {/* Google Login Component */}
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

      <p className="text-xs text-slate-400 font-medium">
        New to the portal?{" "}
        <button
          onClick={onSwitchToSignup}
          className="text-blue-600 font-black hover:underline transition-all"
        >
          Create Account
        </button>
      </p>
    </div>
  );
};

export default LoginView;
