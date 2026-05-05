import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";

const STORAGE_KEY = "cc_slots";

const urgencyClass = (urgency) => {
  const score = Number.parseFloat(urgency);
  const safe = Number.isFinite(score) ? score : 0;
  if (safe >= 70) return "scheduleItem--high";
  if (safe > 40) return "scheduleItem--medium";
  return "scheduleItem--low";
};

const timeToMinutes = (timeStr) => {
  const [time, meridiem] = timeStr.split(" ");
  const [hh, mm] = time.split(":").map((v) => Number(v));
  const base = hh % 12;
  const add = meridiem === "PM" ? 12 : 0;
  return (base + add) * 60 + mm;
};

export default function Home() {
  const [bookedSlots, setBookedSlots] = useState([]);
  const isLoggedIn = Boolean(localStorage.getItem("token"));

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      setBookedSlots(Array.isArray(list) ? list.filter((s) => s.booked) : []);
    } catch {
      setBookedSlots([]);
    }
  }, []);

  const todayLabel = useMemo(
    () => new Date().toLocaleDateString("en-US", { weekday: "short" }),
    []
  );

  const todaysAppointments = useMemo(() => {
    return bookedSlots
      .filter((s) => s.day === todayLabel)
      .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
      .slice(0, 3);
  }, [bookedSlots, todayLabel]);

  return (
    <>
      <section className="hero">
        <h1>Care Connect</h1>
        <p>
          A simple portal for students and doctors. Register, login, and manage health
          information securely.
        </p>
      </section>

      <section className="grid">
        {!isLoggedIn && (
          <>
            <div className="card half">
              <div className="cardTitle">
                <h2>Student</h2>
                <span className="small">College email required</span>
              </div>
              <p className="small">
                Create an account with your college email, then keep your profile details updated.
              </p>
              <Link className="chip" to="/register-student">Register Student →</Link>
            </div>

            <div className="card half">
              <div className="cardTitle">
                <h2>Doctor</h2>
                <span className="small">Create doctor profile</span>
              </div>
              <p className="small">
                Register as a doctor and login to access doctor features (next step).
              </p>
              <Link className="chip" to="/register-doctor">Register Doctor →</Link>
            </div>

            <div className="card">
              <div className="cardTitle">
                <h2>Already registered?</h2>
                <span className="small">Get JWT token</span>
              </div>
              <Link className="chip" to="/login">Login →</Link>
            </div>
          </>
        )}

        {isLoggedIn && (
          <div className="card">
            <div className="cardTitle">
              <h2>Today’s Appointments</h2>
              <span className="small">{todayLabel} • top 3 only</span>
            </div>

            {todaysAppointments.length === 0 ? (
              <p className="small">No appointments today.</p>
            ) : (
              <div className="scheduleList">
                {todaysAppointments.map((s) => (
                  <div key={s.id} className={`scheduleItem ${urgencyClass(s.urgency)}`}>
                    <div><b>{s.day}</b> • {s.time}</div>
                    <div className="scheduleMeta">Generic Patient • Urgency {s.urgency ?? "N/A"}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 10 }}>
              <Link className="chip" to="/appointments">View full week →</Link>
            </div>
          </div>
        )}
      </section>
    </>
  );
}