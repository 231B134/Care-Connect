require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");

async function start() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected");

  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`Care Connect server running on port ${port}`));
}

start().catch((err) => {
  console.error("Server failed:", err.message);
  process.exit(1);
});