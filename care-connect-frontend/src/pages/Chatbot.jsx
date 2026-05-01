import { useState } from "react";

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! Tell me your symptoms." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [triage, setTriage] = useState(null);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setMessages((prev) => [...prev, { from: "user", text }]);
    setLoading(true);

    try {
      const res = await fetch("/nlp_extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      const data = await res.json();

      const detected = Object.entries(data)
        .filter(([, v]) => v === 1)
        .map(([k]) => k.replaceAll("_", " "));

      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: `Detected: ${detected.join(", ") || "no clear symptoms"}`
        }
      ]);

      const triageRes = await fetch("/triage_predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const triageData = await triageRes.json();
      setTriage(triageData);

    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "Error connecting to server." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>Chatbot</h2>

      <div className="card" style={{ minHeight: 240, marginBottom: 12 }}>
        {messages.map((m, i) => (
          <p key={i}><b>{m.from}:</b> {m.text}</p>
        ))}
        {loading && <p><b>bot:</b> Thinking…</p>}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type symptoms..."
          style={{ flex: 1, padding: 8 }}
        />
        <button onClick={sendMessage}>Send</button>
      </div>

      {triage && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>Urgency Result</h3>
          <p><b>Urgency Score:</b> {triage.priority_score ?? "N/A"}</p>
          <p><b>Recommendation:</b> {triage.final_priority ?? "N/A"}</p>
          <p><b>Reason:</b> {triage.reason_summary ?? "N/A"}</p>
        </div>
      )}
    </div>
  );
}