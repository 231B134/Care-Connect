const jwt = require("jsonwebtoken");
const AuthService = require("../services/AuthService");

async function registerStudent(req, res) {
  try {
    const user = await AuthService.registerStudent(req.body);
    res.status(201).json({ message: "Student registered", userId: user._id });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}

async function registerDoctor(req, res) {
  try {
    const user = await AuthService.registerDoctor(req.body);
    res.status(201).json({ message: "Doctor registered", userId: user._id });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}

async function login(req, res) {
  try {
    const user = await AuthService.login(req.body);

    const token = jwt.sign(
      { sub: String(user._id), role: user.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token, role: user.role });
  } catch (e) {
    res.status(401).json({ message: e.message });
  }
}

module.exports = { registerStudent, registerDoctor, login };