import React, { useEffect, useState } from "react";
import API from "../api";
import socket from "../socket";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchData = async () => {
      try {
        const userRes = await API.get("/users/me", { headers: { Authorization: `Bearer ${token}` } });
        setUser(userRes.data);

        const notificationsRes = await API.get("/notifications", { headers: { Authorization: `Bearer ${token}` } });
        setNotifications(notificationsRes.data);

        if (!socket.connected) socket.connect();
        socket.emit("registerUser", userRes.data._id);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const handleNewNotification = n => setNotifications(prev => [n, ...prev]);

    socket.on("newNotification", handleNewNotification);
    return () => socket.off("newNotification", handleNewNotification);
  }, []);

  return (
    <div>
      <h2>Notifications</h2>
      {notifications.length === 0 && <p>No notifications yet.</p>}
      <ul>
        {notifications.map(n => <li key={n._id}>{n.message}</li>)}
      </ul>
    </div>
  );
}
