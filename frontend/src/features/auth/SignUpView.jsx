import { useState } from "react";
import { authService } from "./authService"; // Importing from the same folder

const SignUpView = ({ onSignUpSuccess, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await authService.register(
        formData.email,
        formData.password,
      );
      // Django returns 'token' or 'key'
      const token = data.token || data.key;
      if (token) onSignUpSuccess(token);
    } catch (err) {
      // Cleaner error extraction
      const errors = err.response?.data;
      const errorMsg =
        errors?.email?.[0] ||
        errors?.password?.[0] ||
        errors?.non_field_errors?.[0] ||
        "Registration failed.";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-8 w-full max-w-sm mx-auto p-6 bg-white rounded-3xl shadow-xl shadow-slate-100">
      <div className="text-center">
        <div className="bg-blue-50 text-blue-600 w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center text-xl shadow-inner">
          👋
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Create Account
        </h2>
      </div>

      <form onSubmit={handleSignUp} className="w-full space-y-5">
        <AuthInput
          label="Email Address"
          name="email"
          type="email"
          placeholder="name@example.com"
          value={formData.email}
          onChange={handleChange}
        />
        <AuthInput
          label="Create Password"
          name="password"
          type="password"
          placeholder="Min. 8 characters"
          value={formData.password}
          onChange={handleChange}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "Creating Profile..." : "Get Started"}
        </button>
      </form>

      <p className="text-xs text-slate-400 font-medium text-center">
        Already have an account?{" "}
        <button
          onClick={onSwitchToLogin}
          className="text-blue-600 font-black hover:underline"
        >
          Login
        </button>
      </p>
    </div>
  );
};

// Reusable Input Sub-component
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

export default SignUpView;
