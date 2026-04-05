import { useState } from "react";
import { api } from "../api/axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState({ type: "", text: "" });

  async function submit(e) {
    e.preventDefault();
    setStatus({ type: "", text: "Logging in..." });

    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      setStatus({ type: "ok", text: "Login success. Token saved in localStorage." });
    } catch (err) {
      setStatus({ type: "err", text: err?.response?.data?.message || "Login failed" });
    }
  }

  return (
    <div className="card">
      <div className="cardTitle">
        <h2>Login</h2>
        <span className="small">JWT token will be saved</span>
      </div>

      <form className="form" onSubmit={submit}>
        <label className="label">
          Email
          <input className="input" placeholder="your email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>

        <label className="label">
          Password
          <input className="input" placeholder="your password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>

        <button className="btn" type="submit">Login</button>
      </form>

      {status.text ? <div className={`alert ${status.type}`}>{status.text}</div> : null}
    </div>
  );
}