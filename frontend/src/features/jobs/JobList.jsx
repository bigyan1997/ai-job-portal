import { useState, useEffect, useMemo } from "react";
import { jobService } from "./services/jobService";
import JobCard from "./components/JobCard";

const JobList = ({ token, viewType, onSaveChange }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) =>
      [job.title, job.location, job.company_name].some((field) =>
        field.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    );
  }, [jobs, searchQuery]);

  useEffect(() => {
    const loadJobs = async () => {
      setLoading(true);
      try {
        const res = await jobService.fetchJobs(token, viewType);
        setJobs(res.data);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    if (token) loadJobs();
  }, [token, viewType]);

  const handleSaveToggle = async (jobId) => {
    try {
      await jobService.toggleSave(token, jobId);
      if (onSaveChange) onSaveChange();

      if (viewType === "saved") {
        setJobs((prev) => prev.filter((job) => job.id !== jobId));
      } else {
        setJobs((prev) =>
          prev.map((job) =>
            job.id === jobId ? { ...job, is_saved: !job.is_saved } : job,
          ),
        );
      }
    } catch (err) {
      alert("Failed to update saved status.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <header className="mb-10">
        <h2 className="text-3xl font-extrabold text-slate-900">
          {viewType === "saved" ? "Your Bookmarks" : "Discover Roles"}
        </h2>
        <input
          type="text"
          placeholder="Search jobs..."
          className="w-full mt-6 pl-14 pr-6 py-4 border-2 border-slate-100 rounded-2xl bg-white shadow-sm focus:border-blue-500 outline-none transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </header>

      {loading ? (
        <p className="text-center py-20 animate-pulse text-slate-400">
          Scanning for opportunities...
        </p>
      ) : (
        <div className="space-y-6">
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              token={token}
              onSaveToggle={() => handleSaveToggle(job.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default JobList;
