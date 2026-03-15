import axios from "axios";

const API_BASE = "http://127.0.0.1:8000/api/jobs";

const getHeaders = (token) => ({
  headers: { Authorization: `Token ${token}` },
});

export const jobService = {
  // --- SEEKER METHODS ---
  fetchJobs: (token, viewType) => {
    const url = viewType === "saved" ? `${API_BASE}/saved/` : `${API_BASE}/`;
    return axios.get(url, getHeaders(token));
  },

  fetchMyApplications: (token) =>
    axios.get(`${API_BASE}/my-applications/`, getHeaders(token)),

  fetchJobDetail: (token, jobId) =>
    axios.get(`${API_BASE}/${jobId}/`, getHeaders(token)),

  toggleSave: (token, jobId) =>
    axios.post(`${API_BASE}/${jobId}/save/`, {}, getHeaders(token)),

  /**
   * Enhanced Apply Method:
   * Catches backend errors and surfaces them for the toast notifications.
   */
  apply: async (token, formData) => {
    try {
      const response = await axios.post(`${API_BASE}/apply/`, formData, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      return response;
    } catch (error) {
      // Extract the error message from Django (e.g., "PDF contains no text")
      const errorMessage =
        error.response?.data?.error || "AI analysis failed. Please try again.";

      // Throw a clean error so toast.promise can catch it
      throw new Error(errorMessage);
    }
  },

  optimizeResume: (token, data) =>
    axios.post(`${API_BASE}/optimize-resume/`, data, getHeaders(token)),

  withdrawApplication: (token, id) =>
    axios.delete(`${API_BASE}/applications/withdraw/${id}/`, getHeaders(token)),

  // --- EMPLOYER METHODS ---
  postJob: (token, data) => axios.post(`${API_BASE}/`, data, getHeaders(token)),

  fetchEmployerJobs: (token) =>
    axios.get(`${API_BASE}/my-jobs/`, getHeaders(token)),

  updateJob: (token, id, data) =>
    axios.patch(`${API_BASE}/${id}/`, data, getHeaders(token)),

  deleteJob: (token, id) =>
    axios.delete(`${API_BASE}/${id}/`, getHeaders(token)),

  fetchApplicants: (token, jobId) =>
    axios.get(`${API_BASE}/${jobId}/applications/`, getHeaders(token)),

  updateApplicationStatus: (token, appId, status) =>
    axios.patch(
      `${API_BASE}/applications/${appId}/status/`,
      { status },
      getHeaders(token),
    ),
  analyzeOnly: (token, formData) =>
    axios.post(`${API_BASE}/analyze-resume/`, formData, {
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "multipart/form-data",
      },
    }),

  generateCoverLetter: (token, data) =>
    axios.post(`${API_BASE}/generate-cover-letter/`, data, {
      headers: { Authorization: `Token ${token}` },
    }),

  withdrawApplication: (token, jobId, reason) => {
    return axios.delete(`${API_BASE}/applications/withdraw/${jobId}/`, {
      headers: { Authorization: `Token ${token}` },
      data: { reason: reason },
    });
  },
  fetchWithdrawalHistory: (token, jobId) =>
    axios.get(`${API_BASE}/${jobId}/withdrawal-history/`, getHeaders(token)),

  fetchGlobalWithdrawals: (token) =>
    axios.get(`${API_BASE}/all-withdrawals/`, {
      headers: { Authorization: `Token ${token}` },
    }),
};
