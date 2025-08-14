import React, { useEffect, useState } from "react";
import API from "../api";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000/api");

export default function Dashboard() {
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({ yesterday: "", today: "", blockers: "" });
  const [user, setUser] = useState(null);
  const [editingLogId, setEditingLogId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      API.get("/users/me", { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => setUser(res.data))
        .catch((err) => console.error(err));

      API.get("/logs", { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => setLogs(res.data))
        .catch((err) => console.error(err));
    }
  }, []);

  useEffect(() => {
    if (user?._id) socket.emit("registerUser", user._id);
  }, [user]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      let res;

      if (editingLogId) {
        res = await API.put(`/logs/${editingLogId}`, form, { headers: { Authorization: `Bearer ${token}` } });
        setLogs(logs.map((log) => (log._id === editingLogId ? res.data : log)));
        setEditingLogId(null);
      } else {
        res = await API.post("/logs", form, { headers: { Authorization: `Bearer ${token}` } });
        setLogs([...logs, res.data]);
      }

      setForm({ yesterday: "", today: "", blockers: "" });
    } catch (err) {
      alert("Failed to save log");
    }
  };

  const handleEdit = (log) => {
    setForm({ yesterday: log.yesterday, today: log.today, blockers: log.blockers });
    setEditingLogId(log._id);
  };

  const handleDelete = async (logId) => {
    try {
      await API.delete(`/logs/${logId}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      setLogs(logs.filter((log) => log._id !== logId));
    } catch (err) {
      alert("Failed to delete log");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "20px auto", border: "1px solid black", borderRadius: "8px", backgroundColor: "white" }}>
      <h2 style={{ textAlign: "center" }}>Dashboard</h2>

      {/* Employee form */}
      {user?.role === "Employee" && (
        <div style={{ marginBottom: "20px" }}>
          <form onSubmit={handleSubmit}>
            <input name="yesterday" placeholder="Yesterday" value={form.yesterday} onChange={handleChange} style={{ display: "block", width: "100%", padding: "8px", margin: "10px 0", border: "1px solid black", borderRadius: "4px" }} />
            <input name="today" placeholder="Today" value={form.today} onChange={handleChange} style={{ display: "block", width: "100%", padding: "8px", margin: "10px 0", border: "1px solid black", borderRadius: "4px" }} />
            <input name="blockers" placeholder="Blockers" value={form.blockers} onChange={handleChange} style={{ display: "block", width: "100%", padding: "8px", margin: "10px 0", border: "1px solid black", borderRadius: "4px" }} />
            <button type="submit" style={{ padding: "10px", backgroundColor: "green", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
              {editingLogId ? "Update Log" : "Add Log"}
            </button>
          </form>
        </div>
      )}

      {/* Employee logs */}
      {user?.role === "Employee" && (
        <div>
          <h3>Your Logs</h3>
          <ul>
            {logs.filter((log) => log.userId === user._id).map((log) => (
              <li key={log._id} style={{ border: "1px solid black", padding: "10px", margin: "10px 0", borderRadius: "4px", backgroundColor: "white" }}>
                <strong>Yesterday:</strong> {log.yesterday} <br />
                <strong>Today:</strong> {log.today} <br />
                <strong>Blockers:</strong> {log.blockers} <br />
                <button onClick={() => handleEdit(log)} style={{ padding: "5px 10px", backgroundColor: "blue", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", marginRight: "5px", marginTop: "5px" }}>Edit</button>
                <button onClick={() => handleDelete(log._id)} style={{ padding: "5px 10px", backgroundColor: "red", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", marginTop: "5px" }}>Delete</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Project Manager logs */}
      {user?.role === "Project Manager" && (
        <div>
          <h3>All Logs</h3>
          <ul>
            {logs.map((log) => (
              <li key={log._id} style={{ border: "1px solid black", padding: "10px", margin: "10px 0", borderRadius: "4px", backgroundColor: "white" }}>
                <strong>User:</strong> {log.userId} <br />
                <strong>Yesterday:</strong> {log.yesterday} <br />
                <strong>Today:</strong> {log.today} <br />
                <strong>Blockers:</strong> {log.blockers} <br />
                <button onClick={() => handleDelete(log._id)} style={{ padding: "5px 10px", backgroundColor: "red", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", marginTop: "5px" }}>Delete</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
















