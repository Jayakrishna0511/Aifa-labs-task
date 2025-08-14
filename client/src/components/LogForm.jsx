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
