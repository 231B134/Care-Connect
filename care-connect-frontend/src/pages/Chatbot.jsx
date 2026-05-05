import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./Chatbot.css";

const URGENCY_KEY = "cc_last_urgency";

const defaultState = () => ({
  main_complaint: null,
  fever: null,
  fever_level: null, // low/mid/high
  symptom_days: null,
  headache: null,
  body_joint_pain: null,
  nausea_vomiting: null,
  diarrhea: null,
  stomach_pain: null,
  cold_cough_throat: null,
  dizziness_weakness: null,
  chest_pain: null,
  breathing_difficulty: null,
  pain_score: null,
  chronic_conditions: []
});

const questions = [
  { key: "main_complaint", q: "What is your main complaint today?", type: "option", options: ["fever", "cold_cough", "stomach_issue", "vomiting", "headache", "injury", "other"] },
  { key: "fever", q: "Do you currently have fever?", type: "yn" },
  { key: "fever_level", q: "What is your fever level?", type: "option", options: ["low", "mid", "high"], condition: (s) => s.fever === 1 },
  { key: "symptom_days", q: "Since how many days are symptoms present?", type: "number" },
  { key: "headache", q: "Do you have severe headache?", type: "yn" },
  { key: "body_joint_pain", q: "Do you have body/joint pain?", type: "yn" },
  { key: "nausea_vomiting", q: "Do you have nausea/vomiting?", type: "yn" },
  { key: "diarrhea", q: "Do you have loose motion/diarrhea?", type: "yn" },
  { key: "stomach_pain", q: "Do you have stomach pain?", type: "yn" },
  { key: "cold_cough_throat", q: "Do you have cold/cough/throat irritation?", type: "yn" },
  { key: "dizziness_weakness", q: "Do you feel dizziness or unusual weakness?", type: "yn" },
  { key: "chest_pain", q: "Do you have chest pain?", type: "yn" },
  { key: "breathing_difficulty", q: "Do you feel breathing difficulty?", type: "yn" },
  { key: "pain_score", q: "Pain score (0 to 10)?", type: "number_int_0_10" },
  { key: "chronic_conditions", q: "Select one chronic condition (or none)", type: "option", options: ["none", "tonsillitis", "mild_allergy", "thyroid_disorder", "migraine", "anemia", "recurrent_gastritis", "asthma", "diabetes", "hypertension", "epilepsy", "heart_disease", "kidney_disease", "immunocompromised"] }
];

const isAnswered = (key, val) => {
  if (key === "chronic_conditions") return Array.isArray(val) && val.length > 0;
  return !(val === null || val === undefined || val === "");
};

const isRelevant = (q, state) => {
  if (!q.condition) return true;
  return q.condition(state);
};

const inferMainComplaintFromState = (s) => {
  if (s.nausea_vomiting === 1 || s.diarrhea === 1 || s.stomach_pain === 1) return "stomach_issue";
  if (s.cold_cough_throat === 1) return "cold_cough";
  if (s.headache === 1) return "headache";
  if (s.fever === 1) return "fever";
  return "other";
};

export default function Chatbot() {
  const [messages, setMessages] = useState([{ from: "bot", text: "Hello! Please describe your condition in brief." }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [triageState, setTriageState] = useState(defaultState());
  const triageStateRef = useRef(triageState);

  const [phase, setPhase] = useState("nlp_first_text"); // nlp_first_text -> followup -> done
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [triageResult, setTriageResult] = useState(null);

  const lastAskedRef = useRef(null);
  const lastAnsweredRef = useRef(null);

  useEffect(() => {
    triageStateRef.current = triageState;
  }, [triageState]);

  const addMessage = (text, from = "bot") => {
    setMessages((prev) => [...prev, { from, text }]);
  };

  const nextMissingQuestion = (state) => {
    for (const q of questions) {
      if (!isRelevant(q, state)) continue;
      if (!isAnswered(q.key, state[q.key])) return q;
    }
    return null;
  };

  const askNext = () => {
    const q = nextMissingQuestion(triageStateRef.current);
    setCurrentQuestion(q);

    if (!q) {
      submitToBackend();
      return;
    }

    if (lastAskedRef.current === q.key) return;
    lastAskedRef.current = q.key;
    lastAnsweredRef.current = null;

    addMessage(q.q, "bot");
  };

  const handleNLPText = async (userText) => {
    addMessage(userText, "user");
    setLoading(true);

    try {
      const res = await fetch("/nlp_extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: userText })
      });
      const nlp = await res.json();

      const keys = [
        "fever", "headache", "body_joint_pain", "nausea_vomiting", "diarrhea",
        "stomach_pain", "cold_cough_throat", "dizziness_weakness", "chest_pain",
        "breathing_difficulty", "symptom_days"
      ];

      const next = { ...triageStateRef.current };
      keys.forEach((k) => {
        if (nlp[k] !== null && nlp[k] !== undefined) {
          next[k] = nlp[k];
        }
      });
      next.main_complaint = inferMainComplaintFromState(next);

      triageStateRef.current = next;
      setTriageState(next);

      const detected = Object.entries(nlp)
        .filter(([, v]) => v === 1)
        .map(([k]) => k.replaceAll("_", " "));

      addMessage(`Detected: ${detected.join(", ") || "no clear symptoms"}`, "bot");

      lastAskedRef.current = null;
      lastAnsweredRef.current = null;
      setPhase("followup");
      askNext();
    } catch (err) {
      addMessage("Error connecting to server.", "bot");
    } finally {
      setLoading(false);
    }
  };

  const submitToBackend = async () => {
    const required = ["main_complaint", "fever", "symptom_days", "pain_score", "chronic_conditions"];
    for (const k of required) {
      if (!isAnswered(k, triageStateRef.current[k])) {
        const q = questions.find((qq) => qq.key === k);
        setCurrentQuestion(q);
        if (q && lastAskedRef.current !== q.key) {
          lastAskedRef.current = q.key;
          lastAnsweredRef.current = null;
          addMessage(q.q, "bot");
        }
        return;
      }
    }

    if (triageStateRef.current.fever === 1 && !isAnswered("fever_level", triageStateRef.current.fever_level)) {
      const q = questions.find((qq) => qq.key === "fever_level");
      setCurrentQuestion(q);
      if (q && lastAskedRef.current !== q.key) {
        lastAskedRef.current = q.key;
        lastAnsweredRef.current = null;
        addMessage(q.q, "bot");
      }
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/triage_predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(triageStateRef.current)
      });
      const data = await res.json();
      setTriageResult(data);
      if (data?.priority_score !== undefined) {
        localStorage.setItem(URGENCY_KEY, String(data.priority_score));
      }
      addMessage("Triage completed.", "bot");
      setPhase("done");
      setCurrentQuestion(null);
      lastAskedRef.current = null;
      lastAnsweredRef.current = null;
    } catch (err) {
      addMessage("Error connecting to server.", "bot");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionAnswer = (answer) => {
    if (!currentQuestion) return;
    if (lastAnsweredRef.current === currentQuestion.key) return;
    lastAnsweredRef.current = currentQuestion.key;

    addMessage(answer, "user");

    const next = { ...triageStateRef.current };
    const newVal = currentQuestion.key === "chronic_conditions"
      ? [answer]
      : (currentQuestion.type === "yn" ? (answer === "Yes" ? 1 : 0) : answer);
    next[currentQuestion.key] = newVal;

    if (currentQuestion.key === "fever" && newVal === 0) {
      next.fever_level = null;
    }

    triageStateRef.current = next;
    setTriageState(next);

    askNext();
  };

  const submitText = () => {
    const val = input.trim();
    if (!val) return;

    if (phase === "nlp_first_text") {
      setInput("");
      handleNLPText(val);
      return;
    }

    if (!currentQuestion) return;
    if (lastAnsweredRef.current === currentQuestion.key) return;

    if (currentQuestion.type === "number") {
      if (isNaN(Number(val))) {
        alert("Please enter a valid number.");
        return;
      }
      lastAnsweredRef.current = currentQuestion.key;
      addMessage(val, "user");

      const next = { ...triageStateRef.current, [currentQuestion.key]: Number(val) };
      triageStateRef.current = next;
      setTriageState(next);

      setInput("");
      askNext();
      return;
    }

    if (currentQuestion.type === "number_int_0_10") {
      if (!/^\d+$/.test(val)) {
        alert("Please enter an integer from 0 to 10.");
        return;
      }
      const intVal = parseInt(val, 10);
      if (intVal < 0 || intVal > 10) {
        alert("Pain score must be between 0 and 10.");
        return;
      }
      lastAnsweredRef.current = currentQuestion.key;
      addMessage(val, "user");

      const next = { ...triageStateRef.current, [currentQuestion.key]: intVal };
      triageStateRef.current = next;
      setTriageState(next);

      setInput("");
      askNext();
      return;
    }
  };

  const expectingOptions = currentQuestion && (currentQuestion.type === "yn" || currentQuestion.type === "option");
  const expectingNumber = currentQuestion && (currentQuestion.type === "number" || currentQuestion.type === "number_int_0_10");
  const inputDisabled = phase === "done" || expectingOptions;

  return (
    <div className="container">
      <h2>Chatbot</h2>

      <div className="card chatBox">
        {messages.map((m, i) => (
          <p key={i}><b>{m.from}:</b> {m.text}</p>
        ))}
        {loading && <p><b>bot:</b> Thinking…</p>}
      </div>

      {expectingOptions && currentQuestion && (
        <div className="card" style={{ marginTop: 12 }}>
          <b>Choose one:</b>
          <div className="chatOptions">
            {(currentQuestion.type === "yn" ? ["Yes", "No"] : currentQuestion.options).map((opt) => (
              <button key={opt} className="chip" onClick={() => handleOptionAnswer(opt)}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="chatRow">
        <input
          className="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            phase === "nlp_first_text"
              ? "Describe your symptoms..."
              : expectingNumber
                ? (currentQuestion.type === "number_int_0_10" ? "Enter integer 0 to 10" : "Enter number")
                : "Use the buttons above"
          }
          disabled={inputDisabled}
        />
        <button className="btn" onClick={submitText} disabled={inputDisabled}>Send</button>
      </div>

      {triageResult && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>Urgency Result</h3>
          <p><b>Urgency Score:</b> {triageResult.priority_score ?? "N/A"}</p>
          <p><b>Recommendation:</b> {triageResult.final_priority ?? "N/A"}</p>
          <p><b>Reason:</b> {triageResult.reason_summary ?? "N/A"}</p>
          <hr />
          <p><b>Doctor Summary:</b><br />{triageResult.doctor_summary}</p>
          <div style={{ marginTop: 12 }}>
            <Link className="btn" to="/appointments?book=1">Go to Appointments →</Link>
          </div>
        </div>
      )}
    </div>
  );
}