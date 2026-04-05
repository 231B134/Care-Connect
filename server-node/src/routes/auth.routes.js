const router = require("express").Router();
const { registerStudent, registerDoctor, login } = require("../controllers/auth.controller");

router.post("/register/student", registerStudent);
router.post("/register/doctor", registerDoctor);
router.post("/login", login);

module.exports = router;