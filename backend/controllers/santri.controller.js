const db = require("../config/db");
const bcrypt = require("bcryptjs");
const moment = require("moment-timezone");

// Santri Dashboard
exports.getDashboardData = (req, res) => {
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
};

// Santri Hafalan
exports.getHafalanData = (req, res) => {
  const idSantri = parseInt(req.params.idSantri, 10);

  if (isNaN(idSantri)) {
    return res.status(400).json({ message: "Invalid Santri ID." });
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
      console.error("Query error:", err.message);
      return res.status(500).json({ message: "Server error occurred." });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "No memorization data found." });
    }

    res.json(results);
  });
};

// Santri Nilai
exports.getNilaiHafalanSantri = (req, res) => {
  const { idSantri } = req.params;

  const query = `
    SELECT 
      h.id_hafalan, 
      s.nama_santri AS nama_santri,
      h.tanggal_setoran, 
      h.surah, 
      h.ayat_awal, 
      h.ayat_akhir, 
      (h.ayat_akhir - h.ayat_awal + 1) AS jumlah_ayat, 
      h.nilai, 
      h.catatan 
    FROM hafalan h
    JOIN kelas_santri ks ON h.id_ks = ks.id_ks
    JOIN santri s ON ks.id_santri = s.id_santri
    WHERE ks.id_santri = ?
    ORDER BY h.tanggal_setoran DESC
  `;

  db.query(query, [idSantri], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Terjadi kesalahan server." });
    }

    res.status(200).json(results);
  });
};

// Santri Profile
exports.getProfile = (req, res) => {
  const { id } = req.params;
  console.log("Fetching profile for id_santri:", id);

  const query = `SELECT id_santri, nama_santri, wali_santri, telepon_wali, alamat FROM santri WHERE id_santri = ?`;
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).send({ message: "Server error occurred." });
    }
    if (results.length > 0) {
      res.status(200).send(results[0]);
    } else {
      res.status(404).send({ message: "Santri not found." });
    }
  });
};

exports.updateProfile = (req, res) => {
  const { id } = req.params;
  const { telepon_wali, alamat } = req.body;

  if (!telepon_wali && !alamat) {
    return res.status(400).send({ message: "No data to update." });
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
      return res.status(500).send({ message: "Server error occurred." });
    }
    res.status(200).send({ message: "Profile updated successfully." });
  });
};

exports.changePassword = async (req, res) => {
  const { id_santri } = req.params;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).send({ message: "Please fill all fields." });
  }

  db.query(
    "SELECT password FROM santri WHERE id_santri = ?",
    [id_santri],
    async (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send({ message: "Server error occurred." });
      }

      if (results.length === 0) {
        return res.status(404).send({ message: "Santri not found." });
      }

      const storedPassword = results[0].password;
      const isMatch = await bcrypt.compare(oldPassword, storedPassword);
      if (!isMatch) {
        return res.status(401).send({ message: "Incorrect old password." });
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      db.query(
        "UPDATE santri SET password = ?, password_plain = ? WHERE id_santri = ?",
        [hashedPassword, newPassword, id_santri],
        (updateErr, updateResults) => {
          if (updateErr) {
            console.error(updateErr);
            return res
              .status(500)
              .send({ message: "Failed to update password." });
          }
          res.status(200).send({ message: "Password updated successfully!" });
        }
      );
    }
  );
};

// Add other santri-related controller functions here...
