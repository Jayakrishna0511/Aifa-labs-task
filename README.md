frontend
npm install axios socket.io-client react-router-dom

src/api.js,socket.js
src/comp/LogForm.jsx
scr/pages/Dashboard.jsx,Login.jsx,Register.jsx,Notification.jsx

LogForm.jsx:=:
import React, { useState } from "react";
import { API } from "../api";

export default function LogForm({ onAdded }) {
  const [form, setForm] = useState({ yesterday: "", today: "", blockers: "" });

  const submit = async () => {
    await API.post("/logs", form);
    alert("Log created");
    setForm({ yesterday: "", today: "", blockers: "" });
    onAdded();
  };

  return (
    <div>
      <h3>Create Daily Log</h3>
      <input placeholder="Yesterday" value={form.yesterday} onChange={(e) => setForm({ ...form, yesterday: e.target.value })} />
      <input placeholder="Today" value={form.today} onChange={(e) => setForm({ ...form, today: e.target.value })} />
      <input placeholder="Blockers" value={form.blockers} onChange={(e) => setForm({ ...form, blockers: e.target.value })} />
      <button onClick={submit}>Add Log</button>
    </div>
  );
}


Dashboard.jsx:=:
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

Login.jsx:=:
import React, { useState } from "react";
import API from "../api";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/login", form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      alert("Login successful");
      window.location.href = "/dashboard";
    } catch (err) {
      alert(err.response?.data?.msg || "Login failed");
    }
  };

  return (
    <div style={{border:"1px solid black", padding:"20px", borderRadius:"8px", maxWidth:"400px", margin:"20px auto", backgroundColor:"white", display:"flex", flexDirection:"column", alignItems:"center"}}>
  <h2 style={{textAlign:"center", marginBottom:"20px"}}>Login</h2>
  <input name="email" placeholder="Email" onChange={handleChange} style={{width:"90%", padding:"8px", margin:"10px 0", border:"1px solid black", borderRadius:"4px"}} />
  <input type="password" name="password" placeholder="Password" onChange={handleChange} style={{width:"90%", padding:"8px", margin:"10px 0", border:"1px solid black", borderRadius:"4px"}} />
  <button type="submit" onClick={handleSubmit} style={{width:"95%", padding:"10px", backgroundColor:"blue", color:"white", border:"none", borderRadius:"4px", marginTop:"10px", cursor:"pointer"}}>Login</button>
</div>

  );
}


Notifications.jsx:=:
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


Register.jsx:=:
import React, { useState } from "react";
import API from "../api";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Employee",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/register", form);
      alert("Registered successfully");
      window.location.href = "/login";
    } catch (err) {
      alert(err.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div
  style={{border: "1px solid black",padding: "20px",borderRadius: "8px", maxWidth: "400px",margin: "20px auto",display: "flex",flexDirection: "column",alignItems: "center"}}
>
  <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Register</h2>

  <input
    name="name" placeholder="Name" onChange={handleChange}
    style={{width: "90%",padding: "8px",margin: "10px 0",border: "1px solid black",borderRadius: "4px"}}
  />
  <input
    name="email" placeholder="Email" onChange={handleChange}
    style={{width: "90%",padding: "8px",margin: "10px 0",border: "1px solid black",borderRadius: "4px"}}
  />
  <input
   type="password" name="password" placeholder="Password" onChange={handleChange}
    style={{width: "90%",padding: "8px",margin: "10px 0",border: "1px solid black",borderRadius: "4px"}}
  />
  <select
    name="role" onChange={handleChange}
    style={{width: "92%",padding: "8px",margin: "10px 0",border: "1px solid black",borderRadius: "4px"}}
  >
    <option value="Employee">Employee</option>
    <option value="Project Manager">Project Manager</option>
  </select>
  <button
    type="submit"  onClick={handleSubmit}
    style={{width: "95%",padding: "10px",backgroundColor: "green",color: "white",border: "none",borderRadius: "4px",marginTop: "10px",cursor: "pointer"}}
  >
    Register
  </button>
</div>

  );
}


src lo:==:
api.js:=
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api", 
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    // req.headers.Authorization = token;
    req.headers.Authorization = `Bearer ${token}`;

  }
  return req;
});

export default API;


socket.js:=:
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  autoConnect: false,
});

export default socket;


and 
App.jsx:::===:::
// import React from "react";
// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import Register from "./pages/Register";
// import Login from "./pages/Login";
// import Dashboard from "./pages/Dashboard";
// import Notifications from "./pages/Notifications";

// export default function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="/" element={<Login />} />
//         <Route path="/login" element={<Login />} />
//         <Route path="/register" element={<Register />} />
//         <Route path="/dashboard" element={<Dashboard />} />
//         <Route path="/notifications" element={<Notifications />} />
//       </Routes>
//     </BrowserRouter>
//   );
// }



import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Notifications from "./pages/Notifications";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/notifications" element={<Notifications />} />
      </Routes>
    </BrowserRouter>
  );
}


--------------------------------------------------------------------------------------------------------------------------------------
backend
npm install express mongoose cors jsonwebtoken bcryptjs dotenv socket.io
files:

.env:-----
MONGO_URI=mongodb+srv://jayakrishna:jay123456@cluster0.00ao7kk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
PORT=5000
JWT_SECRET=supersecretkey

db.js:-------
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};
export default connectDB;

middleware.js:-------
import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  // const token = req.headers["authorization"];
  // if (!token) return res.status(401).json({ msg: "No token provided" });

  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ msg: "No token" });

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ msg: "Invalid token" });
    req.user = decoded;
    next();
  });
};


models.js:---------
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['Employee', 'Project Manager'], default: 'Employee' }
});

const LogSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  date: { type: Date, default: Date.now },
  yesterday: String,
  today: String,
  blockers: String
});

const NotificationSchema = new mongoose.Schema({
  recipientId: mongoose.Schema.Types.ObjectId,
  message: String,
  sender: String,
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', UserSchema);
export const Log = mongoose.model('Log', LogSchema);
export const Notification = mongoose.model('Notification', NotificationSchema);

routes.js:--------
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "./models/User.js";
import Log from "./models/Log.js";
import Notification from "./models/Notification.js";
import { protect } from "./middleware.js";

const router = express.Router();

/* Utility: emit to a list of userIds if connected */
function emitTo(io, connectedUsers, userIds, event, payload) {
  userIds
    .map((id) => String(id))
    .forEach((id) => {
      const sid = connectedUsers[id];
      if (sid) io.to(sid).emit(event, payload);
    });
}

// REGISTER
router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ msg: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, role });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE LOG
router.post("/logs", protect, async (req, res) => {
  const { yesterday, today, blockers } = req.body;
  const io = req.app.get("io");
  const connectedUsers = req.app.get("connectedUsers");

  try {
    let log = await Log.create({ userId: req.user.id, yesterday, today, blockers });
    log = await log.populate("userId", "name role");

    // Build recipients (creator + PMs)
    const pmIds = await User.find({ role: "Project Manager" }).distinct("_id");
    const recipients = [req.user.id, ...pmIds];

    // Create notifications
    const creatorNote = await Notification.create({
      recipientId: req.user.id,
      message: "Your log was created successfully.",
      sender: req.user.id,
    });

    const pmNotes = await Promise.all(
      pmIds.map((pmId) =>
        Notification.create({
          recipientId: pmId,
          message: `New log created by ${log.userId.name} (${log.userId.role}).`,
          sender: req.user.id,
        })
      )
    );

    // Emit the log & notifications
    emitTo(io, connectedUsers, recipients, "newLog", log);
    emitTo(io, connectedUsers, [req.user.id], "newNotification", creatorNote);
    emitTo(io, connectedUsers, pmIds, "newNotification", null); // emit individually below for payload

    // (Emit each PM note individually so they get their own payload)
    pmNotes.forEach((note, i) => emitTo(io, connectedUsers, [pmIds[i]], "newNotification", note));

    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET LOGS
router.get("/logs", protect, async (req, res) => {
  try {
    const logs = await Log.find().populate("userId", "name role");
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE LOG
router.delete("/logs/:id", protect, async (req, res) => {
  const io = req.app.get("io");
  const connectedUsers = req.app.get("connectedUsers");

  try {
    const log = await Log.findById(req.params.id).populate("userId", "name role");
    if (!log) return res.status(404).json({ msg: "Log not found" });

    await Log.findByIdAndDelete(req.params.id);

    // Recipients for delete event & notes (creator + PMs)
    const pmIds = await User.find({ role: "Project Manager" }).distinct("_id");
    const creatorId = log.userId?._id?.toString();
    const recipients = [creatorId, ...pmIds].filter(Boolean);

    // Create notifications
    const creatorNote = creatorId
      ? await Notification.create({
          recipientId: creatorId,
          message: `Your log "${log._id}" was deleted by ${req.user.role}.`,
          sender: req.user.id,
        })
      : null;

    const pmNotes = await Promise.all(
      pmIds.map((pmId) =>
        Notification.create({
          recipientId: pmId,
          message: `Log "${log._id}" (by ${log.userId?.name || "Unknown"}) was deleted by ${req.user.role}.`,
          sender: req.user.id,
        })
      )
    );

    // Emit delete + notifications
    emitTo(io, connectedUsers, recipients, "deleteLog", log._id);
    if (creatorNote) emitTo(io, connectedUsers, [creatorId], "newNotification", creatorNote);
    pmNotes.forEach((note, i) => emitTo(io, connectedUsers, [pmIds[i]], "newNotification", note));

    res.json({ msg: "Log deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE LOG
router.put("/logs/:id", protect, async (req, res) => {
  const io = req.app.get("io");
  const connectedUsers = req.app.get("connectedUsers");

  try {
    let log = await Log.findById(req.params.id);
    if (!log) return res.status(404).json({ msg: "Log not found" });

    if (String(log.userId) !== String(req.user.id)) {
      return res.status(403).json({ msg: "Not authorized" });
    }

    log.yesterday = req.body.yesterday;
    log.today = req.body.today;
    log.blockers = req.body.blockers;

    await log.save();
    log = await log.populate("userId", "name role");

    emitTo(io, connectedUsers, [log.userId._id], "updateLog", log);

    // Optional: notify creator that update succeeded
    const note = await Notification.create({
      recipientId: log.userId._id,
      message: `Your log "${log._id}" was updated.`,
      sender: req.user.id,
    });
    emitTo(io, connectedUsers, [log.userId._id], "newNotification", note);

    res.json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CURRENT USER
router.get("/users/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// NOTIFICATIONS CRUD
router.get("/notifications", protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipientId: req.user.id }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/notifications", protect, async (req, res) => {
  const io = req.app.get("io");
  const connectedUsers = req.app.get("connectedUsers");
  try {
    const { recipientId, message } = req.body;
    const notification = await Notification.create({ recipientId, message, sender: req.user.id });
    emitTo(io, connectedUsers, [recipientId], "newNotification", notification);
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;


server.js:------
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import connectDB from "./db.js";
import router from "./routes.js";

dotenv.config();
connectDB();

const app = express();
const server = createServer(app);

// Socket.IO setup
const io = new SocketIOServer(server, { cors: { origin: "*" } });

// Connected users map
const connectedUsers = {};
app.set("io", io);
app.set("connectedUsers", connectedUsers);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("registerUser", (userId) => {
    const key = String(userId);
    connectedUsers[key] = socket.id;
    console.log("Registered user:", key, "-> socket:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    for (const id in connectedUsers) {
      if (connectedUsers[id] === socket.id) delete connectedUsers[id];
    }
  });
});

app.use(cors());
app.use(express.json());
app.use("/api", router);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));


models/Logs.js,Notification.js,User.js:------
Log.js:---
import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  date: { type: Date, default: Date.now },
  yesterday: String,
  today: String,
  blockers: String
});

export default mongoose.models.Log || mongoose.model("Log", logSchema);

Notification.js:---
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipientId: mongoose.Schema.Types.ObjectId,
  message: String,
  sender: String,
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Notification || mongoose.model("Notification", notificationSchema);



User.js----:
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ["Employee", "Project Manager"], default: "Employee" }
});

export default mongoose.models.User || mongoose.model("User", userSchema);
