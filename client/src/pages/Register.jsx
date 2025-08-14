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
