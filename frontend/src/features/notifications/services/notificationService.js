import axios from "axios";

const API_BASE = "http://127.0.0.1:8000/api/jobs/notifications/";

const getHeaders = (token) => ({
  headers: { Authorization: `Token ${token}` },
});

export const notificationService = {
  markAllRead: (token) => axios.post(API_BASE, {}, getHeaders(token)),

  markSingleRead: (token, id) =>
    axios.patch(`${API_BASE}${id}/`, { is_read: true }, getHeaders(token)),

  deleteNotification: (token, id) =>
    axios.delete(`${API_BASE}${id}/`, getHeaders(token)),

  clearAll: (token) => axios.delete(API_BASE, getHeaders(token)),
};
