import { useState } from "react";
import axios from "axios";

/**
 * Initial registration view.
 * Once an account is created, the user is typically moved to RoleSelection.jsx.
 */
const SignUpView = ({ onSignUpSuccess, onSwitchToLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Endpoint matches your Django urls.py configuration
  const API_BASE = "http://127.0.0.1:8000/api/auth/register/";

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(API_BASE, {
        email,
        password,
      });

      // Django REST Auth usually returns 'key', but your custom view returns 'token'
      const token = res.data.token || res.data.key;

      if (token) {
        onSignUpSuccess(token);
      }
    } catch (err) {
      console.error("Signup failed:", err.response?.data);

      // Extract specific error messages (e.g., "User with this email already exists")
      const backendErrors = err.response?.data;
      let errorMsg = "Registration failed.";

      if (backendErrors) {
        if (backendErrors.email) errorMsg = `Email: ${backendErrors.email[0]}`;
        else if (backendErrors.password)
          errorMsg = `Password: ${backendErrors.password[0]}`;
        else if (backendErrors.non_field_errors)
          errorMsg = backendErrors.non_field_errors[0];
      }

      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-8 w-full max-w-sm mx-auto p-6 bg-white rounded-3xl shadow-xl shadow-slate-100 animate-in fade-in zoom-in duration-300">
      <div className="text-center">
        <div className="bg-blue-50 text-blue-600 w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center text-xl shadow-inner">
          👋
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Create Account
        </h2>
        <p className="text-slate-500 text-sm mt-2 font-medium">
          Start your AI-powered job search.
        </p>
      </div>

      <form onSubmit={handleSignUp} className="w-full space-y-5">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Email Address
          </label>
          <input
            type="email"
            placeholder="name@example.com"
            className="w-full px-4 py-3.5 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Create Password
          </label>
          <input
            type="password"
            placeholder="Min. 8 characters"
            className="w-full px-4 py-3.5 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "Creating Profile..." : "Get Started"}
        </button>
      </form>

      <div className="pt-2 text-center">
        <p className="text-xs text-slate-400 font-medium">
          Already have an account?{" "}
          <button
            onClick={onSwitchToLogin}
            className="text-blue-600 font-black hover:underline transition-all"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignUpView;
