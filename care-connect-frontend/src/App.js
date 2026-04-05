import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import RegisterStudent from "./pages/RegisterStudent";
import RegisterDoctor from "./pages/RegisterDoctor";

export default function App() {
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
          </nav>
        </div>
      </header>

      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register-student" element={<RegisterStudent />} />
          <Route path="/register-doctor" element={<RegisterDoctor />} />
          <Route path="/login" element={<Login />} />
        </Routes>

        <div className="footer">
          {/* Backend: http://localhost:5000 • Frontend: http://localhost:3000 */}
        </div>
      </main>
    </BrowserRouter>
  );
}