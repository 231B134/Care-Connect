const bcrypt = require("bcrypt");
const User = require("../models/User");


function isCollegeEmail(email) {
  return /@juetguna\.in$/i.test(String(email || "").trim());
}

class AuthService {
  static async registerStudent({ email, password, name, age, gender, bloodGroup, chronicDiseases }) {
  email = String(email).toLowerCase().trim();

  if (!isCollegeEmail(email)) {
    throw new Error("Student must use college email (@juetguna.in).");
  }

  const existing = await User.findOne({ email });
  if (existing) throw new Error("Email already registered.");

  const passwordHash = await bcrypt.hash(password, 12);

  // 1) create user
  const user = await User.create({ email, passwordHash, role: "student" });

  // 2) create student profile linked to user
  await StudentProfile.create({
    userId: user._id,
    name,
    age,
    gender,
    bloodGroup,
    chronicDiseases: chronicDiseases || "",
  });

  return user;
}

  static async registerDoctor({ email, password, name, specialization, phone }) {
  email = String(email).toLowerCase().trim();

  const existing = await User.findOne({ email });
  if (existing) throw new Error("Email already registered.");

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({ email, passwordHash, role: "doctor" });

  await DoctorProfile.create({
    userId: user._id,
    name,
    specialization,
    phone: phone || "",
  });

  return user;
}

  static async login({ email, password }) {
    email = String(email).toLowerCase().trim();

    const user = await User.findOne({ email });
    if (!user) throw new Error("Invalid email or password.");

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new Error("Invalid email or password.");

    return user;
  }
}

module.exports = AuthService;