import { useState } from "react";
import { api } from "../api/axios";

export default function RegisterDoctor() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    specialization: "",
    phone: "",
  });

  const [status, setStatus] = useState({ type: "", text: "" });

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setStatus({ type: "", text: "Registering..." });

    try {
      const res = await api.post("/auth/register/doctor", form);
      setStatus({ type: "ok", text: `Doctor registered. userId: ${res.data.userId}` });
    } catch (err) {
      setStatus({ type: "err", text: err?.response?.data?.message || "Registration failed" });
    }
  }

  return (
    <div className="card">
      <div className="cardTitle">
        <h2>Doctor Registration</h2>
        <span className="small">Create doctor profile</span>
      </div>

      <form className="form" onSubmit={submit}>
        <div className="row2">
          <label className="label">
            Email
            <input className="input" placeholder="doctor@gmail.com" value={form.email} onChange={(e) => update("email", e.target.value)} />
          </label>

          <label className="label">
            Password
            <input className="input" placeholder="Enter password" type="password" value={form.password} onChange={(e) => update("password", e.target.value)} />
          </label>
        </div>

        <div className="row2">
          <label className="label">
            Doctor Name
            <input className="input" placeholder="Dr. Sharma" value={form.name} onChange={(e) => update("name", e.target.value)} />
          </label>

          <label className="label">
            Specialization
            <input className="input" placeholder="General Physician" value={form.specialization} onChange={(e) => update("specialization", e.target.value)} />
          </label>
        </div>

        <label className="label">
          Phone (optional)
          <input className="input" placeholder="9876543210" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
        </label>

        <button className="btn" type="submit">Create Doctor Account</button>
      </form>

      {status.text ? <div className={`alert ${status.type}`}>{status.text}</div> : null}
    </div>
  );
}