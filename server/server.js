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


