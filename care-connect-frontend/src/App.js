import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { useState } from "react";
import Home from "./pages/Home";
import Login from "./pages/Login";
import RegisterStudent from "./pages/RegisterStudent";
import RegisterDoctor from "./pages/RegisterDoctor";
import Chatbot from "./pages/Chatbot";
import Booking from "./pages/Booking";
import ProtectedRoute from "./ProtectedRoute";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem("token"))
  );

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setIsLoggedIn(false);
    window.location.href = "/login";
  };

  return (
    <BrowserRouter>
      <header className="nav">
        <div className="navInner">
          <div className="brand">
            <div className="brandBadge" />
            <div>Care Connect</div>
          </div>

          <nav className="navLinks">
            <Link className="chip" to="/">Home</Link>

            {isLoggedIn && (
              <>
                <Link className="chip" to="/chatbot">Chatbot</Link>
                <Link className="chip" to="/appointments">Appointments</Link>
                <button className="chip" onClick={logout}>Logout</button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register-student" element={<RegisterStudent />} />
          <Route path="/register-doctor" element={<RegisterDoctor />} />
          <Route
            path="/login"
            element={<Login onLogin={() => setIsLoggedIn(true)} />}
          />
          <Route
            path="/chatbot"
            element={
              <ProtectedRoute>
                <Chatbot />
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointments"
            element={
              <ProtectedRoute>
                <Booking />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </BrowserRouter>
  );
}