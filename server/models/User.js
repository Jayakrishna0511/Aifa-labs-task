import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ["Employee", "Project Manager"], default: "Employee" }
});

export default mongoose.models.User || mongoose.model("User", userSchema);
