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
