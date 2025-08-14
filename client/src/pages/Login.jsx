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
