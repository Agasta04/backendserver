const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const moment = require("moment-timezone");

const app = express();

// Set timezone
process.env.TZ = "Asia/Jakarta";
console.log("Server Timezone:", new Date().toString());

// Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(cors());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Import routes
const loginRoutes = require("./routes/login.routes");
const santriRoutes = require("./routes/santri.routes");
const ustadzRoutes = require("./routes/ustadz.routes");
const adminRoutes = require("./routes/admin.routes");
const firebaseRoutes = require("./routes/firebase.routes");

// Use routes
app.use("/", loginRoutes);
app.use("/", santriRoutes);
app.use("/", ustadzRoutes);
app.use("/", adminRoutes);
app.use("/", firebaseRoutes); // Firebase routes

module.exports = app;
