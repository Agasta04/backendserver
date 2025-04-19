const mysql = require("mysql");
require("dotenv").config();

// Database connection configuration
const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "",
  database: "hafalan_santri",
  port: 3306,
  timezone: "Asia/Jakarta", // Gunakan zona waktu lokal
});

// Handle connection errors
db.connect((err) => {
  if (err) {
    console.error("Database connection error:", err);
    setTimeout(connectDatabase, 5000);
  } else {
    console.log("Connected to MySQL database.");
  }
});

// Handle disconnection
db.on("error", (err) => {
  console.error("Database error:", err);
  if (err.code === "PROTOCOL_CONNECTION_LOST") {
    console.log("Attempting to reconnect to database...");
    connectDatabase();
  } else {
    throw err;
  }
});

// Reconnect function
function connectDatabase() {
  db.connect((err) => {
    if (err) {
      console.error("Failed to reconnect to database:", err);
      setTimeout(connectDatabase, 5000);
    } else {
      console.log("Database connection reestablished.");
    }
  });
}

module.exports = db;
