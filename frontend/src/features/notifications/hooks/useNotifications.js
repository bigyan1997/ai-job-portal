import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { notificationService } from "../services/notificationService";

export const useNotifications = (token) => {
  const [notifications, setNotifications] = useState([]);

  // --- 1. FETCH HISTORY FROM DATABASE ---
  const fetchNotifications = useCallback(async () => {
    if (!token || token === "null" || token === "undefined") return;
    try {
      const res = await axios.get(
        "http://127.0.0.1:8000/api/jobs/notifications/",
        { headers: { Authorization: `Token ${token}` } },
      );
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, [token]);

  // --- 2. TRIGGER FETCH ON MOUNT ---
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // --- 3. MARK SINGLE AS READ ---
  const markAsRead = async (notificationId) => {
    try {
      // Optimistic UI Update
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n,
        ),
      );

      // FIX: Use the service instead of a hardcoded (and possibly wrong) URL
      await notificationService.markSingleRead(token, notificationId);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllRead = async () => {
    if (notifications.filter((n) => !n.is_read).length === 0) return;
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

      // FIX: This hits your NotificationListView.post() in Django
      await notificationService.markAllRead(token);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  // --- 4. WEBSOCKET LOGIC ---
  useEffect(() => {
    if (!token || token === "null" || token === "undefined") return;

    let socket;
    let reconnectTimeout;
    let isComponentMounted = true;

    const connect = () => {
      if (!isComponentMounted) return;

      socket = new WebSocket(
        `ws://127.0.0.1:8000/ws/notifications/?token=${token}`,
      );

      socket.onopen = () => {
        if (isComponentMounted) console.log("✅ WebSocket Connected");
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setNotifications((prev) => {
          // Prevent duplicates if the message is already in state
          if (data.id && prev.some((n) => n.id === data.id)) return prev;

          const extractedJobId = data.job_id || data.data?.job_id;
          const normalized = {
            id: data.id || `temp-${Date.now()}-${Math.random()}`,
            message: data.message,
            is_read: false,
            created_at: new Date().toISOString(),
            job_id: extractedJobId,
            application: extractedJobId
              ? { job: { id: extractedJobId } }
              : null,
          };
          return [normalized, ...prev];
        });
      };

      socket.onclose = (e) => {
        if (isComponentMounted && e.code !== 1000) {
          reconnectTimeout = setTimeout(connect, 3000);
        }
      };
    };

    connect();

    return () => {
      isComponentMounted = false;
      // Resilience check: Only close if the socket is actually active
      if (socket && socket.readyState <= 1) {
        socket.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, [token]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    setNotifications,
    unreadCount,
    markAsRead,
    markAllRead,
    fetchNotifications,
  };
};
