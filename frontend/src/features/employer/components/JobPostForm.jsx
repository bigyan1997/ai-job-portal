import { useState } from "react";
// Import the centralized service instead of raw axios
import { jobService } from "../../jobs/services/jobService";

/**
 * Enhanced Card-based Job Posting Form.
 * Cleaned up to use the modular jobService layer.
 */
const JobPostForm = ({ token, onJobPosted }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    company_name: "",
    location: "",
    salary_range: "",
    description: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Logic is now centralized in jobService
      const res = await jobService.postJob(token, formData);

      // Reset Form
      setFormData({
        title: "",
        company_name: "",
        location: "",
        salary_range: "",
        description: "",
      });

      if (onJobPosted) onJobPosted(res.data);
      alert("🚀 Job published successfully!");
    } catch (err) {
      console.error("Submission failed:", err.response?.data);
      const errorMsg = err.response?.data?.detail || "Failed to publish job.";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border-2 border-slate-200 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="text-center mb-10">
        <div className="bg-blue-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl shadow-lg shadow-blue-100">
          💼
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          Create Listing
        </h2>
        <p className="text-slate-500 mt-2 font-medium italic">
          Define the role for our AI matching engine
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput
            label="Position Title"
            name="title"
            placeholder="e.g. Senior Developer"
            value={formData.title}
            onChange={handleChange}
          />
          <FormInput
            label="Employer Name"
            name="company_name"
            placeholder="Your Company"
            value={formData.company_name}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput
            label="Job Location"
            name="location"
            placeholder="e.g. Hurstville, NSW"
            value={formData.location}
            onChange={handleChange}
          />
          <FormInput
            label="Salary Range"
            name="salary_range"
            placeholder="$100k - $120k"
            value={formData.salary_range}
            onChange={handleChange}
            required={false}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Job Description
          </label>
          <textarea
            name="description"
            placeholder="Paste full job description here for AI analysis..."
            rows="6"
            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:border-blue-600 outline-none transition-all text-sm font-bold text-slate-700 leading-relaxed resize-none"
            onChange={handleChange}
            value={formData.description}
            required
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-blue-600 text-white border-2 border-transparent font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-white hover:border-slate-300 hover:text-slate-600 disabled:bg-slate-100 transition-all shadow-xl shadow-blue-100 active:scale-[0.98]"
        >
          {loading ? "Publishing..." : "Publish Job Posting"}
        </button>
      </form>
    </div>
  );
};

/**
 * Reusable input component to reduce JSX clutter
 */
const FormInput = ({
  label,
  name,
  placeholder,
  value,
  onChange,
  required = true,
}) => (
  <div className="space-y-2">
    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
      {label}
    </label>
    <input
      type="text"
      name={name}
      placeholder={placeholder}
      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:border-blue-600 outline-none transition-all text-sm font-bold text-slate-700"
      onChange={onChange}
      value={value}
      required={required}
    />
  </div>
);

export default JobPostForm;
