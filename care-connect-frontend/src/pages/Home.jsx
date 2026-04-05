import { Link } from "react-router-dom";

export default function Home() {
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
      </section>
    </>
  );
}