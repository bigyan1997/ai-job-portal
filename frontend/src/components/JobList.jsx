import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import JobCard from "./JobCard";

/**
 * Main feed component for Job Seekers.
 * Handles fetching all jobs, saved jobs, and real-time frontend filtering.
 */
const JobList = ({ token, viewType, onSaveChange }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);

  const API_BASE = "http://127.0.0.1:8000/api/jobs/";

  /**
   * Performance optimization: Filter jobs only when 'jobs' or 'searchQuery' changes.
   * This prevents unnecessary re-calculations on every re-render.
   */
  const filteredJobs = useMemo(() => {
    return jobs.filter(
      (job) =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company_name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [jobs, searchQuery]);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = viewType === "saved" ? `${API_BASE}saved/` : API_BASE;
        const res = await axios.get(url, {
          headers: { Authorization: `Token ${token}` },
        });
        setJobs(res.data);
      } catch (err) {
        setError("Unable to load jobs. Please check your connection.");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchJobs();
  }, [token, viewType]);

  /**
   * Toggles the saved status of a job.
   * Handles optimistic UI updates and removes from view if in 'Saved' mode.
   */
  const handleSaveToggle = async (jobId) => {
    try {
      await axios.post(
        `${API_BASE}${jobId}/save/`,
        {},
        { headers: { Authorization: `Token ${token}` } },
      );

      // Notify parent component to update global state if necessary
      if (onSaveChange) onSaveChange();

      if (viewType === "saved") {
        // Remove from the 'Saved Jobs' list immediately if unsaved
        setJobs((prev) => prev.filter((job) => job.id !== jobId));
      } else {
        // Toggle the heart icon state locally in the global feed
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
      {/* Search Header */}
      <div className="mb-10 text-center sm:text-left">
        <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
          {viewType === "saved" ? "Your Bookmarks" : "Discover Roles"}
        </h2>
        <p className="text-slate-500">
          {viewType === "saved"
            ? "Track the positions you are interested in."
            : "Browse AI-matched opportunities across Australia."}
        </p>
      </div>

      {/* Search Bar UI */}
      <div className="relative mb-10 group">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-xl">
          🔍
        </div>
        <input
          type="text"
          placeholder="Search by title, location, or company..."
          className="block w-full pl-14 pr-6 py-4 border-2 border-slate-100 rounded-2xl bg-white shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-50 focus:outline-none transition-all text-slate-700 font-medium"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Content Rendering */}
      {loading ? (
        <div className="flex flex-col items-center py-20 animate-pulse">
          <div className="h-10 w-10 bg-blue-100 rounded-full mb-4"></div>
          <p className="text-slate-400 font-medium">
            Scanning for opportunities...
          </p>
        </div>
      ) : error ? (
        <div className="text-center py-10 text-rose-500 font-semibold">
          {error}
        </div>
      ) : filteredJobs.length > 0 ? (
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
      ) : (
        /* Empty State */
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100 shadow-sm">
          <div className="text-5xl mb-4">📂</div>
          <p className="text-slate-500 font-bold text-lg mb-1">
            {searchQuery ? "No results found" : "No jobs to show"}
          </p>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">
            {searchQuery
              ? `We couldn't find anything matching "${searchQuery}". Try a different location.`
              : "Adjust your filters or check back later for new postings."}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="mt-6 text-blue-600 font-bold hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default JobList;
