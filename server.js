const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const cors = require("cors");
const moment = require("moment-timezone");
const bcrypt = require("bcryptjs");
const admin = require("./firebase");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(cors());

// ✅ Pastikan zona waktu server tetap WIB
process.env.TZ = "Asia/Jakarta";
console.log("Zona Waktu Server:", new Date().toString());

// ✅ Konfigurasi koneksi database MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  timezone: process.env.DB_TIMEZONE,
  multipleStatements: true, // Jika butuh eksekusi beberapa query sekaligus
});

// ✅ Tangani error koneksi
db.connect((err) => {
  if (err) {
    console.error("Database connection error:", err);
    setTimeout(connectDatabase, 5000); // Coba reconnect setelah 5 detik
  } else {
    console.log("Terhubung ke database MySQL.");
  }
});

// ✅ Tangani jika koneksi MySQL terputus
db.on("error", (err) => {
  console.error("Database error:", err);
  if (err.code === "PROTOCOL_CONNECTION_LOST") {
    console.log("Mencoba menghubungkan ulang ke database...");
    connectDatabase();
  } else {
    throw err;
  }
});

// ✅ Fungsi untuk reconnect otomatis jika koneksi terputus
function connectDatabase() {
  db.connect((err) => {
    if (err) {
      console.error("Gagal menyambungkan ulang ke database:", err);
      setTimeout(connectDatabase, 5000);
    } else {
      console.log("Koneksi ke database berhasil diperbarui.");
    }
  });
}

// ✅ Middleware untuk debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// fcm token
app.post("/firebase/update-token", (req, res) => {
  console.log("📩 Body yang diterima:", req.body);

  const { id_santri, fcm_token } = req.body;

  db.query(
    "UPDATE santri SET fcm_token = ? WHERE id_santri = ?",
    [fcm_token, id_santri],
    (err, result) => {
      if (err) {
        console.error("❌ Gagal update FCM Token:", err);
        return res.status(500).send(err);
      }

      console.log("Berhasil update FCM Token untuk santri ID:", id_santri);
      console.log("Result dari query:", result);
      res.send({ success: true });
    }
  );
});

app.post("/firebase/simpan-notifikasi", (req, res) => {
  const { id_santri, judul, pesan, waktu } = req.body;
  db.query(
    "INSERT INTO notifications (id_santri, judul, pesan, waktu) VALUES (?, ?, ?, ?)",
    [id_santri, judul, pesan, waktu],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.send({ success: true });
    }
  );
});

app.get("/firbase/notifikasi", (req, res) => {
  const { id_santri } = req.query;
  db.query(
    "SELECT * FROM notifications WHERE id_santri = ? ORDER BY waktu DESC",
    [id_santri],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.json(result);
    }
  );
});

app.post("/firebase/send-notif-hafalan", (req, res) => {
  const { id_santri, judul, isi } = req.body;

  // 1. Ambil token FCM dari database
  db.query(
    "SELECT fcm_token FROM santri WHERE id_santri = ?",
    [id_santri],
    (err, result) => {
      if (err) {
        console.error("❌ Error ambil token FCM:", err);
        return res.status(500).json({ error: "Database error" });
      }

      const token = result[0]?.fcm_token;
      if (!token) {
        return res.status(404).json({ error: "Token tidak ditemukan" });
      }

      // 2. Siapkan pesan
      const message = {
        token: token,
        notification: {
          title: judul || "Hafalan Baru 🎉",
          body: isi || "Ustadz telah menambahkan hafalan baru untuk kamu!",
        },
        android: {
          priority: "high",
        },
        apns: {
          headers: {
            "apns-priority": "10",
          },
          payload: {
            aps: {
              sound: "default",
            },
          },
        },
      };

      // 3. Kirim via FCM
      admin
        .messaging()
        .send(message)
        .then((response) => {
          console.log("✅ Notifikasi dikirim:", response);
          res.status(200).json({ success: true, messageId: response });
        })
        .catch((error) => {
          console.error("❌ Gagal kirim notifikasi:", error);
          res.status(500).json({ error: "Gagal kirim notifikasi" });
        });
    }
  );
});

// ✅ Endpoint Login dengan bcrypt
app.post("/login/autentication", async (req, res) => {
  console.log("Login request received:", req.body);

  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).send({ message: "Data login tidak lengkap." });
  }

  let query = "";
  let userRole = role.toLowerCase();
  if (userRole === "ustadz") {
    query =
      "SELECT id_ustadz, nama_ustadz AS nama, password FROM ustadz WHERE nama_ustadz = ?";
  } else if (userRole === "santri") {
    query =
      "SELECT id_santri, nama_santri AS nama, password FROM santri WHERE nama_santri = ?";
  } else if (userRole === "admin") {
    query =
      "SELECT id_admin, nama_admin AS nama, password FROM admin WHERE nama_admin = ?";
  } else {
    return res.status(400).send({ message: "Role tidak valid." });
  }

  db.query(query, [username], async (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).send({ message: "Terjadi kesalahan server." });
    }

    if (results.length === 0) {
      console.log("User not found:", username);
      return res.status(401).send({ message: "Username atau password salah." });
    }

    const user = results[0];
    console.log("User found:", user);

    try {
      // ✅ Debugging: Cek password di database
      console.log("Password dari database:", user.password);

      // ✅ Pastikan perbandingan password menggunakan bcryptjs
      const match = await bcrypt.compare(password, user.password); // Sebelumnya `bcryptjs.compare`

      if (!match) {
        console.log("Password mismatch for user:", username);
        return res
          .status(401)
          .send({ message: "Username atau password salah." });
      }

      delete user.password;
      console.log("Login berhasil:", user);

      res.status(200).send({
        message: "Login berhasil",
        role: userRole,
        user,
      });
    } catch (bcryptError) {
      console.error("Bcrypt error:", bcryptError);
      return res.status(500).send({
        message: "Terjadi kesalahan server saat verifikasi password.",
      });
    }
  });
});

// ✅✅✅ENDPOINT SISI SANTRI
// 🚀🚀🚀 HALAMAN DASHBOARD SANTRI
// ✅ Endpoint untuk mendapatkan data jumlah dan list hafalan halaman dashboard
app.get("/santri/dashboard/:idSantri", (req, res) => {
  const idSantri = parseInt(req.params.idSantri, 10);

  if (isNaN(idSantri)) {
    return res.status(400).json({ message: "ID Santri tidak valid." });
  }

  const query = `
    SELECT 
      s.nama_santri AS nama_santri,
      h.tanggal_setoran, 
      h.surah, 
      h.ayat_awal, 
      h.ayat_akhir, 
      h.catatan, 
      h.nilai
    FROM hafalan h
    JOIN kelas_santri ks ON h.id_ks = ks.id_ks
    JOIN santri s ON ks.id_santri = s.id_santri
    WHERE ks.id_santri = ? 
    ORDER BY h.tanggal_setoran DESC;
  `;

  db.query(query, [idSantri], (err, results) => {
    if (err) {
      console.error("Kesalahan query:", err.message);
      return res
        .status(500)
        .json({ message: "Terjadi kesalahan pada server." });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Data hafalan tidak ditemukan." });
    }

    // Menghitung total surah (unique) dan total ayat
    const totalSurah = new Set(results.map((r) => r.surah)).size;
    const totalAyat = results.reduce(
      (sum, r) => sum + ((r.ayat_akhir || 0) - (r.ayat_awal || 0) + 1),
      0
    );

    res.json({
      message: "Data hafalan ditemukan",
      total_surah: totalSurah,
      total_ayat: totalAyat,
      hafalan: results,
    });
  });
});

// 🚀🚀🚀 HALAMAN HAFALAN
// ✅ Endpoint untuk mendapatkan data hafalan berdasarkan ID santri pada halaman hafalan
app.get("/santri/hafalan/:idSantri", (req, res) => {
  const idSantri = parseInt(req.params.idSantri, 10);

  if (isNaN(idSantri)) {
    return res.status(400).json({ message: "ID Santri tidak valid." });
  }

  const query = `
    SELECT 
      s.nama_santri AS nama_santri, 
      h.tanggal_setoran, 
      h.surah, 
      h.ayat_awal, 
      h.ayat_akhir, 
      h.catatan, 
      h.nilai
    FROM hafalan h
    JOIN kelas_santri ks ON h.id_ks = ks.id_ks
    JOIN santri s ON ks.id_santri = s.id_santri
    WHERE ks.id_santri = ? 
    ORDER BY h.tanggal_setoran;
  `;

  db.query(query, [idSantri], (err, results) => {
    if (err) {
      console.error("Kesalahan query:", err.message);
      return res
        .status(500)
        .json({ message: "Terjadi kesalahan pada server." });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Data hafalan tidak ditemukan." });
    }

    res.json(results);
  });
});

app.get("/santri/laporan-santri-nilai/:id_santri", (req, res) => {
  const { id_santri } = req.params;

  const query = `
    SELECT 
  h.id_hafalan, 
  s.nama_santri AS nama_santri,  -- ✅ Tambahkan ini
  h.tanggal_setoran, 
  h.surah, 
  h.ayat_awal, 
  h.ayat_akhir, 
  (h.ayat_akhir - h.ayat_awal + 1) AS jumlah_ayat, 
  h.nilai, 
  h.catatan 
FROM hafalan h
JOIN kelas_santri ks ON h.id_ks = ks.id_ks
JOIN santri s ON ks.id_santri = s.id_santri  -- ✅ Join ke tabel santri
WHERE ks.id_santri = ?
ORDER BY h.tanggal_setoran DESC
  `;

  db.query(query, [id_santri], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Terjadi kesalahan server." });
    }

    res.status(200).json(results);
  });
});

// 🚀🚀🚀 HALAMAN PROFILE SANTRI
// ✅ Endpoint untuk mendapatkan data profil santri berdasarkan ID
app.get("/santri/profile/:id", (req, res) => {
  const { id } = req.params;
  console.log("Fetching profile for id_santri:", id);

  const query = `SELECT id_santri, nama_santri, wali_santri, telepon_wali, alamat FROM santri WHERE id_santri = ?`;
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).send({ message: "Terjadi kesalahan server." });
    }
    if (results.length > 0) {
      res.status(200).send(results[0]);
    } else {
      res.status(404).send({ message: "Santri tidak ditemukan." });
    }
  });
});

// ✅ Endpoint untuk memperbarui profil santri berdasarkan ID
app.put("/santri/:id/update", (req, res) => {
  const { id } = req.params;
  const { telepon_wali, alamat } = req.body;

  if (!telepon_wali && !alamat) {
    return res.status(400).send({ message: "Tidak ada data yang diperbarui." });
  }

  const updateFields = [];
  const values = [];

  if (telepon_wali) {
    updateFields.push("telepon_wali = ?");
    values.push(telepon_wali);
  }
  if (alamat) {
    updateFields.push("alamat = ?");
    values.push(alamat);
  }
  values.push(id);

  const query = `UPDATE santri SET ${updateFields.join(
    ", "
  )} WHERE id_santri = ?`;

  db.query(query, values, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).send({ message: "Terjadi kesalahan server." });
    }
    res.status(200).send({ message: "Profil berhasil diperbarui." });
  });
});

// ✅ Endpoint Ubah Password untuk Santri
app.put("/santri/:id_santri/password", async (req, res) => {
  const { id_santri } = req.params;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).send({ message: "Harap isi semua kolom." });
  }

  // Ambil password lama dari database
  db.query(
    "SELECT password FROM santri WHERE id_santri = ?",
    [id_santri],
    async (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send({ message: "Terjadi kesalahan server." });
      }

      if (results.length === 0) {
        return res.status(404).send({ message: "Santri tidak ditemukan." });
      }

      const storedPassword = results[0].password;

      // ✅ Bandingkan password lama dengan yang diinput
      const isMatch = await bcrypt.compare(oldPassword, storedPassword);
      if (!isMatch) {
        return res.status(401).send({ message: "Password lama salah." });
      }

      // ✅ Hash password baru sebelum menyimpannya
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // ✅ Update password & password_plain di database
      db.query(
        "UPDATE santri SET password = ?, password_plain = ? WHERE id_santri = ?",
        [hashedPassword, newPassword, id_santri],
        (updateErr, updateResults) => {
          if (updateErr) {
            console.error(updateErr);
            return res
              .status(500)
              .send({ message: "Gagal memperbarui password." });
          }
          res.status(200).send({ message: "Password berhasil diperbarui!" });
        }
      );
    }
  );
});

// ✅✅✅ENDPOINT SISI USTADZ
// 🚀🚀🚀 HALAMAN DASHBOARD USTADZ
// ✅ Endpoint untuk mendapatkan jumlah data
app.get("/ustadz/dashboard/:id_ustadz", (req, res) => {
  const id_ustadz = parseInt(req.params.id_ustadz, 10);

  if (isNaN(id_ustadz)) {
    return res.status(400).json({ message: "ID ustadz tidak valid." });
  }

  const query = `
    SELECT 
      (SELECT COUNT(*) FROM kelas WHERE id_ustadz = ?) AS total_kelas,
      (SELECT COUNT(*) FROM kelas_santri ks 
       JOIN kelas k ON ks.id_kelas = k.id_kelas 
       WHERE k.id_ustadz = ?) AS total_santri,
      (SELECT COUNT(*) FROM hafalan h 
       JOIN kelas_santri ks ON h.id_ks = ks.id_ks
       JOIN kelas k ON ks.id_kelas = k.id_kelas 
       WHERE k.id_ustadz = ?) AS total_hafalan
  `;

  db.query(query, [id_ustadz, id_ustadz, id_ustadz], (err, results) => {
    if (err) {
      console.error("Kesalahan query:", err.message);
      return res
        .status(500)
        .json({ message: "Terjadi kesalahan pada server." });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Data tidak ditemukan." });
    }

    res.json(results[0]);
  });
});

// ✅ Endpoint untuk mendapatkan laporan hafalan terbaru berdasarkan ID ustadz
app.get("/ustadz/dashboard/recent-hafalan/:id_ustadz", (req, res) => {
  const id_ustadz = req.params.id_ustadz;

  const query = `
    SELECT
      h.id_hafalan,
      h.tanggal_setoran,
      h.surah,
      h.ayat_awal,
      h.ayat_akhir,
      h.nilai,
      h.catatan,
      s.nama_santri AS nama_santri
    FROM hafalan h
    JOIN kelas_santri ks ON h.id_ks = ks.id_ks
    JOIN santri s ON ks.id_santri = s.id_santri
    JOIN kelas k ON ks.id_kelas = k.id_kelas
    WHERE k.id_ustadz = ? 
    ORDER BY h.tanggal_setoran DESC;
  `;

  db.query(query, [id_ustadz], (err, results) => {
    if (err) {
      console.error("Kesalahan query:", err.message);
      return res
        .status(500)
        .json({ message: "Terjadi kesalahan pada server." });
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ message: "Tidak ada laporan hafalan terbaru." });
    }

    res.json(results);
  });
});

// 🚀🚀🚀 HALAMAN KELAS SANTRI
// ✅ Endpoint untuk mendapatkan daftar kelas berdasarkan Id_ustadz
app.get("/ustadz/kelas", (req, res) => {
  const ustadzId = req.query.ustadzId;
  if (!ustadzId) {
    return res.status(400).send({ message: "Id_ustadz diperlukan." });
  }

  const query = "SELECT id_kelas, nama_kelas FROM kelas WHERE id_ustadz = ?";
  db.query(query, [ustadzId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send({ message: "Terjadi kesalahan server." });
    }
    res.status(200).send(results);
  });
});

// ✅ Endpoint untuk mendapatkan daftar santri berdasarkan Id_kelas
app.get("/kelas/:classId/santri", (req, res) => {
  const { classId } = req.params; // Menggunakan classId sebagai parameter

  const query = `
    SELECT 
      ks.id_ks, -- Menambahkan id_ks dari tabel kelas_santri
      s.id_santri, 
      s.nama_santri AS nama_santri,
      s.nis, 
      s.wali_santri,
      s.jenis_kelamin,  
      s.telepon_wali, 
      s.alamat
    FROM kelas_santri ks
    INNER JOIN santri s ON ks.id_santri = s.id_santri
    WHERE ks.id_kelas = ?;
  `;

  db.query(query, [classId], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).send({ message: "Terjadi kesalahan server." });
    }

    res.status(200).send(results);
  });
});

// 🚀🚀🚀 HALAMAN HAFALAN
// ✅ Endpoint untuk mengambil data hafalan berdasarkan Id_santri
app.get("/ustadz/hafalan-santri", (req, res) => {
  const santriId = req.query.id_santri; // Ambil Id_santri dari query parameter

  if (!santriId) {
    return res.status(400).send({ message: "Id_santri diperlukan." });
  }

  const query = `
    SELECT 
      h.id_hafalan,
      h.surah,
      h.ayat_awal,
      h.ayat_akhir,
      h.tanggal_setoran,
      h.catatan,
      h.nilai,
      s.nama_santri AS nama_santri,
      k.nama_kelas AS kelas
    FROM hafalan h
    INNER JOIN kelas_santri ks ON h.id_ks = ks.id_ks
    INNER JOIN santri s ON ks.id_santri = s.id_santri
    INNER JOIN kelas k ON ks.id_kelas = k.id_kelas
    WHERE ks.id_santri = ? 
    ORDER BY h.tanggal_setoran DESC;`;

  db.query(query, [santriId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send({ message: "Terjadi kesalahan server." });
    }
    res.status(200).send(results);
  });
});

// ✅ Endpoint untuk menambahkan data hafalan
app.post("/ustadz/add-hafalan", (req, res) => {
  const {
    id_ks,
    tanggal_setoran,
    surah,
    ayat_awal,
    ayat_akhir,
    catatan,
    nilai,
  } = req.body;

  console.log("Menerima data request:", req.body);

  // 🔍 Validasi input
  if (
    !id_ks ||
    !tanggal_setoran ||
    !surah ||
    ayat_awal === undefined ||
    ayat_akhir === undefined ||
    nilai === undefined
  ) {
    console.error("Validasi gagal: Semua field wajib diisi kecuali catatan.");
    return res
      .status(400)
      .json({ error: "Semua field wajib diisi kecuali catatan." });
  }

  let formattedDate = moment.tz(tanggal_setoran, "YYYY-MM-DD", "Asia/Jakarta"); // Backend menerima YYYY-MM-DD

  if (!formattedDate.isValid()) {
    console.error("Format tanggal salah:", tanggal_setoran);
    return res.status(400).json({ error: "Format tanggal harus YYYY-MM-DD." });
  }

  formattedDate = formattedDate.format("YYYY-MM-DD"); // Simpan dalam format YYYY-MM-DD

  console.log("Tanggal yang akan disimpan:", formattedDate);

  // ✅ Query SQL untuk menambahkan data hafalan
  const query = `
    INSERT INTO hafalan (id_ks, tanggal_setoran, surah, ayat_awal, ayat_akhir, catatan, nilai)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    id_ks,
    formattedDate, // Gunakan tanggal dalam format YYYY-MM-DD
    surah,
    ayat_awal,
    ayat_akhir,
    catatan || null,
    nilai,
  ];

  // ✅ Eksekusi query
  db.query(query, values, (error, results) => {
    if (error) {
      console.error("Error saat menambahkan data ke database:", error.message);
      return res.status(500).json({
        error: "Terjadi kesalahan pada server.",
        detail: error.message,
      });
    }
    console.log("Data berhasil ditambahkan dengan ID:", results.insertId);
    res.status(201).json({
      message: "Data hafalan berhasil ditambahkan.",
      data: {
        id_hafalan: results.insertId,
        id_ks,
        tanggal_setoran: formattedDate, // Pastikan data yang dikembalikan tetap dalam format YYYY-MM-DD
        surah,
        ayat_awal,
        ayat_akhir,
        catatan: catatan || null,
        nilai,
      },
    });
  });
});

// ✅ Update Hafalan dengan Validasi & Perbaikan Format Tanggal
app.put("/ustadz/update-hafalan/:id", (req, res) => {
  const { id } = req.params;
  let { tanggal_setoran, surah, ayat_awal, ayat_akhir, catatan, nilai } =
    req.body;

  // Konversi tanggal ke zona waktu Asia/Jakarta sebelum disimpan
  if (tanggal_setoran) {
    tanggal_setoran = moment
      .tz(tanggal_setoran, "Asia/Jakarta")
      .format("YYYY-MM-DD");
  }

  const query = `UPDATE hafalan SET 
    tanggal_setoran = ?, 
    surah = ?, 
    ayat_awal = ?, 
    ayat_akhir = ?, 
    catatan = ?, 
    nilai = ? 
    WHERE id_hafalan = ?`;

  db.query(
    query,
    [tanggal_setoran, surah, ayat_awal, ayat_akhir, catatan, nilai, id],
    (err, result) => {
      if (err) {
        console.error("Error updating hafalan:", err);
        res.status(500).json({ message: "Gagal memperbarui hafalan" });
      } else {
        res.status(200).json({ message: "Hafalan berhasil diperbarui" });
      }
    }
  );
});

// ✅ Hapus Hafalan
app.delete("/ustadz/delete-hafalan/:id", (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM hafalan WHERE id_hafalan = ?";

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Error menghapus hafalan:", err);
      res.status(500).json({ message: "Gagal menghapus hafalan" });
    } else {
      res.status(200).json({ message: "Hafalan berhasil dihapus" });
    }
  });
});

app.get("/ustadz/laporan-ustadz-nilai/:id_santri", (req, res) => {
  const { id_santri } = req.params;

  const query = `
    SELECT 
  h.id_hafalan, 
  s.nama_santri AS nama_santri,  -- ✅ Tambahkan ini
  h.tanggal_setoran, 
  h.surah, 
  h.ayat_awal, 
  h.ayat_akhir, 
  (h.ayat_akhir - h.ayat_awal + 1) AS jumlah_ayat, 
  h.nilai, 
  h.catatan 
FROM hafalan h
JOIN kelas_santri ks ON h.id_ks = ks.id_ks
JOIN santri s ON ks.id_santri = s.id_santri  -- ✅ Join ke tabel santri
WHERE ks.id_santri = ?
ORDER BY h.tanggal_setoran DESC
  `;

  db.query(query, [id_santri], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Terjadi kesalahan server." });
    }

    res.status(200).json(results);
  });
});

// 🚀🚀🚀 HALAMAN PROFILE USTADZ
// ✅Endpoint untuk mendapatkan data profil ustadz berdasarkan ID
app.get("/ustadz/:id", (req, res) => {
  const { id } = req.params;

  // Validasi input
  if (isNaN(id) || id <= 0) {
    return res.status(400).send({ message: "ID tidak valid." });
  }

  // Query untuk mendapatkan data ustadz dengan penamaan kolom yang disesuaikan
  const query = `SELECT id_ustadz, nama_ustadz, jabatan, telepon, email, alamat FROM ustadz WHERE id_ustadz = ?`;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).send({ message: "Terjadi kesalahan server." });
    }
    if (results.length > 0) {
      res.status(200).send(results[0]);
    } else {
      res.status(404).send({ message: "Ustadz tidak ditemukan." });
    }
  });
});

// ✅ Endpoint untuk memperbarui profil ustadz berdasarkan ID
app.put("/ustadz/:id/update", (req, res) => {
  const { id } = req.params;
  const { telepon, email, alamat } = req.body; // Perubahan ke huruf kecil

  if (!telepon && !email && !alamat) {
    return res.status(400).send({ message: "Tidak ada data yang diperbarui." });
  }

  const updateFields = [];
  const values = [];

  if (telepon) {
    updateFields.push("telepon = ?");
    values.push(telepon);
  }
  if (email) {
    updateFields.push("email = ?");
    values.push(email);
  }
  if (alamat) {
    updateFields.push("alamat = ?");
    values.push(alamat);
  }
  values.push(id);

  const query = `UPDATE ustadz SET ${updateFields.join(
    ", "
  )} WHERE id_ustadz = ?`;

  db.query(query, values, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).send({ message: "Terjadi kesalahan server." });
    }
    res.status(200).send({ message: "Profil berhasil diperbarui." });
  });
});

// ✅ Endpoint Ubah Password ustadz dengan bcrypt
app.put("/ustadz/:id_ustadz/password", async (req, res) => {
  const { id_ustadz } = req.params;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).send({ message: "Harap isi semua kolom." });
  }

  // Ambil password lama dari database
  db.query(
    "SELECT password FROM ustadz WHERE id_ustadz = ?",
    [id_ustadz],
    async (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send({ message: "Terjadi kesalahan server." });
      }

      if (results.length === 0) {
        return res.status(404).send({ message: "Ustadz tidak ditemukan." });
      }

      const storedPassword = results[0].password;

      // ✅ Bandingkan password lama dengan yang diinput
      const isMatch = await bcrypt.compare(oldPassword, storedPassword);
      if (!isMatch) {
        return res.status(401).send({ message: "Password lama salah." });
      }

      // ✅ Hash password baru sebelum menyimpannya
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password di database
      db.query(
        "UPDATE ustadz SET password = ? WHERE id_ustadz = ?",
        [hashedPassword, id_ustadz],
        (updateErr, updateResults) => {
          if (updateErr) {
            console.error(updateErr);
            return res
              .status(500)
              .send({ message: "Gagal memperbarui password." });
          }
          res.status(200).send({ message: "Password berhasil diperbarui!" });
        }
      );
    }
  );
});

// ✅✅✅ENDPOINT SISI ADMIN
// 🚀🚀🚀 HALAMAN DASHBOARD
// ✅ Endpoint untuk mengambil data jumlah data untuk dashboard admin
app.get("/admin/dashboard", (req, res) => {
  const query = `
    SELECT 
      (SELECT COUNT(*) FROM santri) AS total_santri,
      (SELECT COUNT(*) FROM ustadz) AS total_ustadz,
      (SELECT COUNT(*) FROM hafalan) AS total_hafalan;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send({ message: "Terjadi kesalahan server." });
    }
    res.status(200).json(results[0]);
  });
});

app.get("/admin/hafalan", (req, res) => {
  const query = `
    SELECT 
      h.id_hafalan,
      h.surah,
      h.ayat_awal,
      h.ayat_akhir,
      h.tanggal_setoran,
      h.catatan,
      h.nilai,
      s.nama_santri AS nama_santri,
      k.nama_kelas AS kelas
    FROM hafalan h
    INNER JOIN kelas_santri ks ON h.id_ks = ks.id_ks
    INNER JOIN santri s ON ks.id_santri = s.id_santri
    INNER JOIN kelas k ON ks.id_kelas = k.id_kelas
    ORDER BY h.tanggal_setoran DESC;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).send({ message: "Terjadi kesalahan server." });
    }
    res.status(200).send(results);
  });
});

// 🚀🚀🚀 HALAMAN KELAS
// ✅ Endpoint untuk mendapatkan semua kelas
app.get("/admin/kelas", (req, res) => {
  const query = "SELECT id_kelas, nama_kelas FROM kelas";
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Gagal mengambil data kelas" });
    }
    res.json(results);
  });
});

// ✅ Endpoint untuk menambahkan kelas
app.post("/admin/add-kelas", async (req, res) => {
  const { nama_kelas, id_ustadz } = req.body;

  if (!nama_kelas || !id_ustadz) {
    return res.status(400).json({ error: "Nama Kelas dan Ustadz wajib diisi" });
  }

  try {
    const query = `INSERT INTO kelas (nama_kelas, id_ustadz) VALUES (?, ?)`;

    db.query(query, [nama_kelas, id_ustadz], (err, result) => {
      if (err) {
        console.error("Error saat menambah kelas:", err);
        return res.status(500).json({ error: "Terjadi kesalahan pada server" });
      }
      res.status(201).json({ message: "Kelas berhasil ditambahkan" });
    });
  } catch (error) {
    console.error("Kesalahan saat memproses data:", error);
    res.status(500).json({ error: "Terjadi kesalahan saat memproses data" });
  }
});

// ✅ Endpoint untuk mendapatkan daftar ustadz untuk menambahkan kelas
app.get("/admin/class-ustadz", async (req, res) => {
  try {
    db.query("SELECT id_ustadz, nama_ustadz FROM ustadz", (err, result) => {
      if (err) {
        console.error("Error mengambil data ustadz:", err);
        return res.status(500).json({ error: "Terjadi kesalahan pada server" });
      }
      res.status(200).json(result);
    });
  } catch (error) {
    console.error("Kesalahan pada server:", error);
    res.status(500).json({ error: "Terjadi kesalahan saat mengambil data" });
  }
});

// ✅ Endpoint untuk mendapatkan detail kelas
app.get("/admin/kelas/:kelasId", (req, res) => {
  const kelasId = req.params.kelasId;
  const sql = `SELECT k.id_kelas, k.nama_kelas, k.id_ustadz, u.nama_ustadz 
               FROM kelas k 
               JOIN ustadz u ON k.id_ustadz = u.id_ustadz 
               WHERE k.id_kelas = ?`;

  db.query(sql, [kelasId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Gagal mengambil detail kelas" });
    }
    if (result.length === 0) {
      return res.status(404).json({ error: "Kelas tidak ditemukan" });
    }
    res.json(result[0]); // Pastikan mengembalikan id_ustadz juga
  });
});

// ✅ Endpoint untuk update kelas
app.put("/admin/update-kelas/:kelasId", (req, res) => {
  const kelasId = req.params.kelasId;
  const { nama_kelas, id_ustadz } = req.body; // Sekarang menerima id_ustadz langsung

  const sql = `UPDATE kelas 
               SET nama_kelas = ?, id_ustadz = ? 
               WHERE id_kelas = ?`;

  db.query(sql, [nama_kelas, id_ustadz, kelasId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Gagal memperbarui kelas" });
    }
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "Kelas tidak ditemukan atau tidak ada perubahan" });
    }
    res.json({ message: "Kelas berhasil diperbarui" });
  });
});

// ✅ Endpoint untuk delet kelas
app.delete("/admin/delete-kelas/:kelasId", (req, res) => {
  const kelasId = req.params.kelasId;

  const sql = `DELETE FROM kelas WHERE id_kelas = ?`;

  db.query(sql, [kelasId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Gagal menghapus kelas" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Kelas tidak ditemukan" });
    }
    res.json({ message: "Kelas berhasil dihapus" });
  });
});

// 🚀🚀🚀 HALAMAN SANTRI
// ✅ Endpoint untuk mendapatkan daftar santri
app.get("/admin/santri", (req, res) => {
  const kelasId = req.query.kelasId;
  if (!kelasId) {
    return res.status(400).send({ message: "kelasId diperlukan." });
  }

  const query = `
    SELECT 
      s.id_santri,
      s.nama_santri,
      s.nis,
      s.jenis_kelamin,
      s.wali_santri,
      s.telepon_wali,
      s.alamat,
      k.nama_kelas
    FROM santri s
    INNER JOIN kelas_santri ks ON s.id_santri = ks.id_santri
    INNER JOIN kelas k ON ks.id_kelas = k.id_kelas
    WHERE ks.id_kelas = ?
    ORDER BY s.nama_santri ASC;`;

  db.query(query, [kelasId], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).send({ message: "Terjadi kesalahan server." });
    }
    res.status(200).send(results);
  });
});

// ✅ Endpoint untuk menambahkan santri dengan jenis kelamin
app.post("/admin/add-santri", async (req, res) => {
  const {
    nama_santri,
    nis,
    password,
    jenis_kelamin,
    wali_santri,
    telepon_wali,
    alamat,
    id_kelas,
  } = req.body;

  if (!nama_santri || !nis || !password || !jenis_kelamin || !id_kelas) {
    return res.status(400).json({
      message: "Nama, NIS, Password, Jenis Kelamin, dan id_kelas wajib diisi.",
    });
  }

  try {
    // ✅ Hash password sebelum menyimpannya ke database
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // ✅ Simpan data santri dengan password yang telah dienkripsi dan jenis kelamin
    const insertSantri =
      "INSERT INTO santri (nama_santri, nis, password, jenis_kelamin, wali_santri, telepon_wali, alamat) VALUES (?, ?, ?, ?, ?, ?, ?)";

    db.query(
      insertSantri,
      [
        nama_santri,
        nis,
        hashedPassword,
        jenis_kelamin,
        wali_santri,
        telepon_wali,
        alamat,
      ],
      (err, result) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ message: "Gagal menambahkan santri." });
        }

        const id_santri = result.insertId;

        // ✅ Masukkan ke kelas_santri
        const insertKelasSantri =
          "INSERT INTO kelas_santri (id_kelas, id_santri) VALUES (?, ?)";
        db.query(insertKelasSantri, [id_kelas, id_santri], (err, result) => {
          if (err) {
            console.error("Error memasukkan ke kelas_santri:", err);
            return res
              .status(500)
              .json({ message: "Gagal menambahkan ke kelas." });
          }
          res
            .status(201)
            .json({ message: "Santri berhasil ditambahkan ke kelas." });
        });
      }
    );
  } catch (error) {
    console.error("Error hashing password:", error);
    res.status(500).json({ message: "Gagal mengenkripsi password." });
  }
});

// ✅ Update data santri (termasuk jenis kelamin)
app.put("/admin/update-santri/:id", (req, res) => {
  const { id } = req.params;
  const { nama_santri, nis, wali_santri, telepon_wali, alamat, jenis_kelamin } =
    req.body;

  const query = `UPDATE santri SET 
        nama_santri = ?,
        nis = ?,  
        wali_santri = ?, 
        telepon_wali = ?, 
        alamat = ?,
        jenis_kelamin = ?
        WHERE id_santri = ?`;

  db.query(
    query,
    [nama_santri, nis, wali_santri, telepon_wali, alamat, jenis_kelamin, id],
    (err, result) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Gagal memperbarui santri", error: err });
      }
      res.json({ message: "Santri berhasil diperbarui" });
    }
  );
});

//✅ Endpoint untuk mereset password santri
app.put("/admin/reset-password-santri/:id", async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: "Password baru diperlukan" });
  }

  try {
    // Hash password sebelum disimpan ke database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Query untuk update password santri berdasarkan ID
    const sql = "UPDATE santri SET password = ? WHERE id_santri = ?";
    db.query(sql, [hashedPassword, id], (err, result) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Gagal mereset password", error: err });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Santri tidak ditemukan" });
      }

      res.json({ message: "Password santri berhasil direset" });
    });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server", error });
  }
});

// ✅ Delete data santri
app.delete("/admin/delete-santri/:id", (req, res) => {
  const { id } = req.params;

  const query = `DELETE FROM santri WHERE id_santri = ?`;

  db.query(query, [id], (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Gagal menghapus santri", error: err });
    }
    res.json({ message: "Santri berhasil dihapus" });
  });
});

// 🚀🚀🚀 HALAMAN USTADZ
// ✅ Endpoint untuk mengambil data ustadz
app.get("/admin/ustadz", (req, res) => {
  const query = `
    SELECT 
      id_ustadz,
      nama_ustadz,
      nip,
      jenis_kelamin,
      jabatan,
      telepon,
      email,
      alamat
    FROM ustadz
    ORDER BY nama_ustadz ASC;`;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).send({ message: "Terjadi kesalahan server." });
    }
    res.status(200).send(results);
  });
});

// ✅ Endpoint untuk menambah data ustadz
app.post("/admin/add-ustadz", async (req, res) => {
  const {
    nama_ustadz,
    nip,
    password,
    jabatan,
    telepon,
    email,
    alamat,
    jenis_kelamin,
  } = req.body;

  if (!nama_ustadz || !nip || !password || !email || !jenis_kelamin) {
    return res.status(400).json({
      error: "Nama, NIP, Password, Email, dan Jenis Kelamin wajib diisi",
    });
  }

  try {
    // Hash password menggunakan bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const query = `INSERT INTO ustadz (nama_ustadz, nip, password, jabatan, telepon, email, alamat, jenis_kelamin) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(
      query,
      [
        nama_ustadz,
        nip,
        hashedPassword,
        jabatan,
        telepon,
        email,
        alamat,
        jenis_kelamin,
      ],
      (err, result) => {
        if (err) {
          console.error("Error saat menambah ustadz:", err);
          return res
            .status(500)
            .json({ error: "Terjadi kesalahan pada server" });
        }
        res.status(201).json({ message: "Ustadz berhasil ditambahkan" });
      }
    );
  } catch (error) {
    console.error("Terjadi kesalahan saat memproses data:", error);
    res.status(500).json({ error: "Terjadi kesalahan saat memproses data" });
  }
});

// ✅ Update data ustadz (termasuk jenis kelamin)
app.put("/admin/update-ustadz/:id", (req, res) => {
  const { id } = req.params;
  const { nama_ustadz, nip, jabatan, telepon, email, alamat, jenis_kelamin } =
    req.body;

  const query = `UPDATE ustadz SET 
        nama_ustadz = ?,
        nip = ?,  
        jabatan = ?, 
        telepon = ?, 
        email = ?, 
        alamat = ?, 
        jenis_kelamin = ?
        WHERE id_ustadz = ?`;

  db.query(
    query,
    [nama_ustadz, nip, jabatan, telepon, email, alamat, jenis_kelamin, id],
    (err, result) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Gagal memperbarui ustadz", error: err });
      }
      res.json({ message: "Ustadz berhasil diperbarui" });
    }
  );
});

// ✅ Resert password ustadz
app.put("/admin/reset-password/:id", async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  try {
    // Hash password baru
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const query = `UPDATE ustadz SET password = ? WHERE id_ustadz = ?`;
    db.query(query, [hashedPassword, id], (err, result) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Gagal mereset password", error: err });
      }
      res.json({ message: "Password berhasil diperbarui" });
    });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan", error });
  }
});

// ✅ Delete data ustadz
app.delete("/admin/delete-ustadz/:id", (req, res) => {
  const { id } = req.params;

  const query = `DELETE FROM ustadz WHERE id_ustadz = ?`;

  db.query(query, [id], (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Gagal menghapus ustadz", error: err });
    }
    res.json({ message: "Ustadz berhasil dihapus" });
  });
});

// 🚀🚀🚀 HALAMAN HAFALAN
// ✅ Endpoint untuk mendapatkan list hafalan
app.get("/admin/hafalan/data", (req, res) => {
  const { santri_id } = req.query;

  if (!santri_id) {
    return res.status(400).send({ message: "ID santri diperlukan." });
  }

  const query = `
    SELECT 
      h.id_hafalan,
      h.surah,
      h.ayat_awal,
      h.ayat_akhir,
      h.tanggal_setoran,
      h.catatan,
      h.nilai,
      s.nama_santri AS nama_santri,
      k.nama_kelas AS kelas,
      ks.id_ks  -- ✅ Tambahkan id_ks di hasil query
    FROM hafalan h
    INNER JOIN kelas_santri ks ON h.id_ks = ks.id_ks
    INNER JOIN santri s ON ks.id_santri = s.id_santri
    INNER JOIN kelas k ON ks.id_kelas = k.id_kelas
    WHERE s.id_santri = ?
    ORDER BY h.tanggal_setoran DESC;
  `;

  db.query(query, [santri_id], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).send({ message: "Terjadi kesalahan server." });
    }

    // ✅ Jika ada hasil, tambahkan id_ks ke objek santri agar bisa digunakan di frontend
    if (results.length > 0) {
      const id_ks = results[0].id_ks; // Ambil id_ks dari hasil query pertama
      results.forEach((item) => (item.id_ks = id_ks)); // Pastikan semua item memiliki id_ks
    }

    res.status(200).send(results);
  });
});

// ✅ Endpoint untuk menambahkan data hafalan
app.post("/admin/add-hafalan", (req, res) => {
  const {
    id_ks,
    tanggal_setoran,
    surah,
    ayat_awal,
    ayat_akhir,
    catatan,
    nilai,
  } = req.body;

  console.log("Menerima data request:", req.body);

  // 🔍 Validasi input
  if (
    !id_ks ||
    !tanggal_setoran ||
    !surah ||
    ayat_awal === undefined ||
    ayat_akhir === undefined ||
    nilai === undefined
  ) {
    console.error("Validasi gagal: Semua field wajib diisi kecuali catatan.");
    return res
      .status(400)
      .json({ error: "Semua field wajib diisi kecuali catatan." });
  }

  // 🔍 Pastikan format tanggal yang diterima adalah YYYY-MM-DD
  let formattedDate = moment.tz(tanggal_setoran, "YYYY-MM-DD", "Asia/Jakarta"); // Backend menerima YYYY-MM-DD

  if (!formattedDate.isValid()) {
    console.error("Format tanggal salah:", tanggal_setoran);
    return res.status(400).json({ error: "Format tanggal harus YYYY-MM-DD." });
  }

  formattedDate = formattedDate.format("YYYY-MM-DD"); // Simpan dalam format YYYY-MM-DD

  console.log("Tanggal yang akan disimpan:", formattedDate);

  // ✅ Query SQL untuk menambahkan data hafalan
  const query = `
    INSERT INTO hafalan (id_ks, tanggal_setoran, surah, ayat_awal, ayat_akhir, catatan, nilai)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    id_ks,
    formattedDate, // Gunakan tanggal dalam format YYYY-MM-DD
    surah,
    ayat_awal,
    ayat_akhir,
    catatan || null,
    nilai,
  ];

  // ✅ Eksekusi query
  db.query(query, values, (error, results) => {
    if (error) {
      console.error("Error saat menambahkan data ke database:", error.message);
      return res.status(500).json({
        error: "Terjadi kesalahan pada server.",
        detail: error.message,
      });
    }
    console.log("Data berhasil ditambahkan dengan ID:", results.insertId);
    res.status(201).json({
      message: "Data hafalan berhasil ditambahkan.",
      data: {
        id_hafalan: results.insertId,
        id_ks,
        tanggal_setoran: formattedDate, // Pastikan data yang dikembalikan tetap dalam format YYYY-MM-DD
        surah,
        ayat_awal,
        ayat_akhir,
        catatan: catatan || null,
        nilai,
      },
    });
  });
});

// ✅ Update Hafalan
app.put("/admin/update-hafalan/:id", (req, res) => {
  const { id } = req.params;
  let { tanggal_setoran, surah, ayat_awal, ayat_akhir, catatan, nilai } =
    req.body;

  // Konversi tanggal ke zona waktu Asia/Jakarta sebelum disimpan
  if (tanggal_setoran) {
    tanggal_setoran = moment
      .tz(tanggal_setoran, "Asia/Jakarta")
      .format("YYYY-MM-DD");
  }

  const query = `UPDATE hafalan SET 
    tanggal_setoran = ?, 
    surah = ?, 
    ayat_awal = ?, 
    ayat_akhir = ?, 
    catatan = ?, 
    nilai = ? 
    WHERE id_hafalan = ?`;

  db.query(
    query,
    [tanggal_setoran, surah, ayat_awal, ayat_akhir, catatan, nilai, id],
    (err, result) => {
      if (err) {
        console.error("Error updating hafalan:", err);
        res.status(500).json({ message: "Gagal memperbarui hafalan" });
      } else {
        res.status(200).json({ message: "Hafalan berhasil diperbarui" });
      }
    }
  );
});

// ✅ Hapus Hafalan
app.delete("/admin/delete-hafalan/:id", (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM hafalan WHERE id_hafalan = ?";

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Error menghapus hafalan:", err);
      res.status(500).json({ message: "Gagal menghapus hafalan" });
    } else {
      res.status(200).json({ message: "Hafalan berhasil dihapus" });
    }
  });
});

app.get("/admin/laporan-admin-nilai/:id_santri", (req, res) => {
  const { id_santri } = req.params;

  const query = `
    SELECT 
  h.id_hafalan, 
  s.nama_santri AS nama_santri,  -- ✅ Tambahkan ini
  h.tanggal_setoran, 
  h.surah, 
  h.ayat_awal, 
  h.ayat_akhir, 
  (h.ayat_akhir - h.ayat_awal + 1) AS jumlah_ayat, 
  h.nilai, 
  h.catatan 
FROM hafalan h
JOIN kelas_santri ks ON h.id_ks = ks.id_ks
JOIN santri s ON ks.id_santri = s.id_santri  -- ✅ Join ke tabel santri
WHERE ks.id_santri = ?
ORDER BY h.tanggal_setoran DESC
  `;

  db.query(query, [id_santri], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Terjadi kesalahan server." });
    }

    res.status(200).json(results);
  });
});

// 🚀🚀🚀 HALAMAN PROFILE ADMIN
// ✅ Endpoint untuk mendapatkan data profil admin berdasarkan ID
app.get("/admin/:id", (req, res) => {
  const { id } = req.params;

  // Validasi input
  if (isNaN(id) || id <= 0) {
    return res.status(400).send({ message: "ID tidak valid." });
  }

  // Query untuk mendapatkan data admin
  const query = `SELECT id_admin, nama_admin, jabatan, telepon, email, alamat FROM admin WHERE id_admin = ?`;
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).send({ message: "Terjadi kesalahan server." });
    }
    if (results.length > 0) {
      res.status(200).send(results[0]);
    } else {
      res.status(404).send({ message: "Admin tidak ditemukan." });
    }
  });
});

// ✅ Endpoint untuk memperbarui profil admin berdasarkan ID
app.put("/admin/:id/update", (req, res) => {
  const { id } = req.params;
  const { telepon, email, alamat } = req.body;

  if (!telepon && !email && !alamat) {
    return res.status(400).send({ message: "Tidak ada data yang diperbarui." });
  }

  const updateFields = [];
  const values = [];

  if (telepon) {
    updateFields.push("telepon = ?");
    values.push(telepon);
  }
  if (email) {
    updateFields.push("email = ?");
    values.push(email);
  }
  if (alamat) {
    updateFields.push("alamat = ?");
    values.push(alamat);
  }

  values.push(id);

  const query = `UPDATE admin SET ${updateFields.join(
    ", "
  )} WHERE id_admin = ?`;

  db.query(query, values, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).send({ message: "Terjadi kesalahan server." });
    }
    res.status(200).send({ message: "Profil berhasil diperbarui." });
  });
});

// ✅ Endpoint Ubah Password untuk Admin
app.put("/admin/:id_admin/password", async (req, res) => {
  const { id_admin } = req.params;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).send({ message: "Harap isi semua kolom." });
  }

  // Ambil password lama dari database
  db.query(
    "SELECT password FROM admin WHERE id_admin = ?",
    [id_admin],
    async (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send({ message: "Terjadi kesalahan server." });
      }

      if (results.length === 0) {
        return res.status(404).send({ message: "Admin tidak ditemukan." });
      }

      const storedPassword = results[0].password;

      // ✅ Bandingkan password lama dengan yang diinput
      const isMatch = await bcrypt.compare(oldPassword, storedPassword);
      if (!isMatch) {
        return res.status(401).send({ message: "Password lama salah." });
      }

      // ✅ Hash password baru sebelum menyimpannya
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password di database
      db.query(
        "UPDATE admin SET password = ? WHERE id_admin = ?",
        [hashedPassword, id_admin],
        (updateErr, updateResults) => {
          if (updateErr) {
            console.error(updateErr);
            return res
              .status(500)
              .send({ message: "Gagal memperbarui password." });
          }
          res.status(200).send({ message: "Password berhasil diperbarui!" });
        }
      );
    }
  );
});

// ✅Jalankan server Node.js
app.listen(3000, "0.0.0.0", () => {
  console.log("Server berjalan di http://localhost:3000");
});
