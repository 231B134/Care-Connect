const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const authRoutes = require("./routes/auth.routes");

const app = express();

app.use(helmet());
app.use(express.json());

app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));

app.use("/auth", authRoutes);

app.get("/health", (req, res) => {
  res.json({ ok: true, project: "Care Connect" });
});

module.exports = app;