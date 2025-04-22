// backend/app.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

const app = express();
process.env.TZ = "Asia/Jakarta";

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Health check untuk Railway
app.get("/", (req, res) => {
  res.send("🚀 Backend Hafalan Santri aktif!");
});

// Routes
const loginRoutes = require("./routes/login.routes");
const santriRoutes = require("./routes/santri.routes");
const ustadzRoutes = require("./routes/ustadz.routes");
const adminRoutes = require("./routes/admin.routes");
const firebaseRoutes = require("./routes/firebase.routes");

app.use("/login", loginRoutes);
app.use("/santri", santriRoutes);
app.use("/ustadz", ustadzRoutes);
app.use("/admin", adminRoutes);
app.use("/firebase", firebaseRoutes);

module.exports = app;
