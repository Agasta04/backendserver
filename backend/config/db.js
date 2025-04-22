// backend/config/db.js
const mysql = require("mysql2");
require("dotenv").config();

// Buat koneksi ke database
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "hafalan_santri",
  port: process.env.DB_PORT || 3306,
  timezone: "+07:00", // Gunakan offset karena Asia/Jakarta kadang tidak didukung
});

// Fungsi untuk koneksi ulang jika koneksi terputus
function connectDatabase() {
  db.connect((err) => {
    if (err) {
      console.error("❌ Gagal koneksi ke database:", err);
      setTimeout(connectDatabase, 5000); // Coba koneksi ulang setelah 5 detik
    } else {
      console.log("✅ Terkoneksi dengan database MySQL.");
    }
  });
}

// Jalankan koneksi awal
connectDatabase();

// Tangani jika koneksi tiba-tiba terputus
db.on("error", (err) => {
  console.error("⚠️ Kesalahan koneksi database:", err);
  if (err.code === "PROTOCOL_CONNECTION_LOST") {
    console.log("🔁 Mencoba koneksi ulang...");
    connectDatabase();
  } else {
    throw err;
  }
});

module.exports = db;
