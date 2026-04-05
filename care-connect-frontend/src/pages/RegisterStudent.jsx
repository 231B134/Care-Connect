import { useState } from "react";
import { api } from "../api/axios";

export default function RegisterStudent() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    age: "",
    gender: "male",
    bloodGroup: "O+",
    chronicDiseases: "",
  });

  const [status, setStatus] = useState({ type: "", text: "" });

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setStatus({ type: "", text: "Registering..." });

    try {
      const payload = { ...form, age: Number(form.age) };
      const res = await api.post("/auth/register/student", payload);
      setStatus({ type: "ok", text: `Student registered. userId: ${res.data.userId}` });
    } catch (err) {
      setStatus({ type: "err", text: err?.response?.data?.message || "Registration failed" });
    }
  }

  return (
    <div className="card">
      <div className="cardTitle">
        <h2>Student Registration</h2>
        <span className="small">Use @juetguna.in email</span>
      </div>

      <form className="form" onSubmit={submit}>
        <div className="row2">
          <label className="label">
            Email
            <input className="input" placeholder="231b122@juetguna.in" value={form.email} onChange={(e) => update("email", e.target.value)} />
          </label>

          <label className="label">
            Password
            <input className="input" placeholder="Enter password" type="password" value={form.password} onChange={(e) => update("password", e.target.value)} />
          </label>
        </div>

        <div className="row2">
          <label className="label">
            Name
            <input className="input" placeholder="Your name" value={form.name} onChange={(e) => update("name", e.target.value)} />
          </label>

          <label className="label">
            Age
            <input className="input" placeholder="20" value={form.age} onChange={(e) => update("age", e.target.value)} />
          </label>
        </div>

        <div className="row2">
          <label className="label">
            Gender
            <select className="select" value={form.gender} onChange={(e) => update("gender", e.target.value)}>
              <option value="male">male</option>
              <option value="female">female</option>
              <option value="other">other</option>
            </select>
          </label>

          <label className="label">
            Blood Group
            <select className="select" value={form.bloodGroup} onChange={(e) => update("bloodGroup", e.target.value)}>
              <option value="A+">A+</option><option value="A-">A-</option>
              <option value="B+">B+</option><option value="B-">B-</option>
              <option value="AB+">AB+</option><option value="AB-">AB-</option>
              <option value="O+">O+</option><option value="O-">O-</option>
            </select>
          </label>
        </div>

        <label className="label">
          Chronic Diseases (optional)
          <input className="input" placeholder="e.g., asthma" value={form.chronicDiseases} onChange={(e) => update("chronicDiseases", e.target.value)} />
        </label>

        <button className="btn" type="submit">Create Student Account</button>
      </form>

      {status.text ? <div className={`alert ${status.type}`}>{status.text}</div> : null}
    </div>
  );
}