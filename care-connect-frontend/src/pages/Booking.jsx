import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Booking.css";

const STORAGE_KEY = "cc_slots";
const URGENCY_KEY = "cc_last_urgency";

const dayOrder = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const initialSlots = [
  { id: 1, day: "Mon", time: "10:00 AM", booked: false, urgency: null },
  { id: 2, day: "Mon", time: "11:00 AM", booked: false, urgency: null },
  { id: 3, day: "Mon", time: "02:00 PM", booked: true, urgency: 6 },

  { id: 4, day: "Tue", time: "10:00 AM", booked: false, urgency: null },
  { id: 5, day: "Tue", time: "11:30 AM", booked: false, urgency: null },
  { id: 6, day: "Tue", time: "03:00 PM", booked: true, urgency: 4 },

  { id: 7, day: "Wed", time: "09:30 AM", booked: false, urgency: null },
  { id: 8, day: "Wed", time: "01:00 PM", booked: false, urgency: null },
  { id: 9, day: "Wed", time: "04:00 PM", booked: false, urgency: null },

  { id: 10, day: "Thu", time: "09:00 AM", booked: false, urgency: null },
  { id: 11, day: "Thu", time: "11:00 AM", booked: true, urgency: 5 },
  { id: 12, day: "Thu", time: "02:30 PM", booked: false, urgency: null },

  { id: 13, day: "Fri", time: "10:30 AM", booked: false, urgency: null },
  { id: 14, day: "Fri", time: "01:30 PM", booked: false, urgency: null },
  { id: 15, day: "Fri", time: "03:30 PM", booked: true, urgency: 7 },

  { id: 16, day: "Sat", time: "09:00 AM", booked: false, urgency: null },
  { id: 17, day: "Sat", time: "11:30 AM", booked: false, urgency: null },
  { id: 18, day: "Sat", time: "02:00 PM", booked: true, urgency: 3 },

  { id: 19, day: "Sun", time: "10:00 AM", booked: false, urgency: null },
  { id: 20, day: "Sun", time: "12:00 PM", booked: false, urgency: null },
  { id: 21, day: "Sun", time: "03:00 PM", booked: true, urgency: 6 }
];

const hasFullWeek = (slots) => {
  const days = new Set(slots.map((s) => s.day));
  return dayOrder.every((d) => days.has(d));
};

const loadSlots = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed) && hasFullWeek(parsed)) return parsed;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSlots));
    return initialSlots;
  } catch {
    return initialSlots;
  }
};

const loadUrgency = () => {
  const raw = localStorage.getItem(URGENCY_KEY);
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
};

const pickRecommendedSlotId = (slots, urgencyScore) => {
  const available = slots.filter((s) => !s.booked);
  if (!available.length) return null;
  if (urgencyScore >= 7) return available[0].id;
  if (urgencyScore >= 4) return available[Math.floor(available.length / 2)].id;
  return available[available.length - 1].id;
};

const timeToMinutes = (timeStr) => {
  const [time, meridiem] = timeStr.split(" ");
  const [hh, mm] = time.split(":").map((v) => Number(v));
  const base = hh % 12;
  const add = meridiem === "PM" ? 12 : 0;
  return (base + add) * 60 + mm;
};

export default function Booking() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const canBook = params.get("book") === "1";

  const [slots, setSlots] = useState(loadSlots());
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [confirmedSlotId, setConfirmedSlotId] = useState(null);

  const urgencyScore = loadUrgency();
  const recommendedId = useMemo(
    () => pickRecommendedSlotId(slots, urgencyScore),
    [slots, urgencyScore]
  );
  const recommendedSlot = slots.find((s) => s.id === recommendedId);

  const todayLabel = new Date().toLocaleDateString("en-US", { weekday: "short" });
  const todayIndex = dayOrder.indexOf(todayLabel);
  const orderedDays = [
    ...dayOrder.slice(todayIndex),
    ...dayOrder.slice(0, todayIndex)
  ];

  const handleConfirmSlot = () => {
    if (!canBook) return;
    const finalId = selectedSlotId ?? recommendedId;
    if (!finalId) return;

    const next = slots.map((s) =>
      s.id === finalId ? { ...s, booked: true, urgency: urgencyScore } : s
    );

    setSlots(next);
    setConfirmedSlotId(finalId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  return (
    <div className="container">
      <div className="card bookingCard">
        <div className="cardTitle">
          <h2>Appointments</h2>
          <span className="small">Full week calendar</span>
        </div>

        <p><b>Urgency Score:</b> {urgencyScore}</p>
        {recommendedSlot && (
          <p><b>Recommended:</b> {recommendedSlot.day} {recommendedSlot.time}</p>
        )}

        <div className="calendar-grid">
          {orderedDays.map((day) => {
            const slotsForDay = slots
              .filter((s) => s.day === day)
              .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

            return (
              <div key={day} className="calendar-day">
                <b>{day}</b>
                <div className="slot-row">
                  {slotsForDay.map((slot) => {
                    const isSelected = selectedSlotId === slot.id;
                    const isBooked = slot.booked;
                    const className = [
                      "slot",
                      isSelected ? "slot--selected" : "",
                      isBooked ? "slot--booked" : ""
                    ].join(" ");

                    return (
                      <button
                        key={slot.id}
                        onClick={() => canBook && !isBooked && setSelectedSlotId(slot.id)}
                        disabled={!canBook || isBooked}
                        className={className}
                      >
                        {slot.time} {isBooked ? "• Booked" : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bookingActions">
          {canBook ? (
            <button className="btn" onClick={handleConfirmSlot}>Confirm appointment</button>
          ) : (
            <Link className="chip" to="/chatbot">Book after Chatbot →</Link>
          )}
          <Link className="chip" to="/">Back to Home</Link>
        </div>

        {confirmedSlotId && canBook && (
          <div className="alert ok">
            Booked! Generic Patient • Urgency {urgencyScore}
          </div>
        )}
      </div>
    </div>
  );
}