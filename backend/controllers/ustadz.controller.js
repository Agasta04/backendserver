const db = require("../config/db");
const bcrypt = require("bcryptjs");
const moment = require("moment-timezone");

// 🚀🚀🚀 HALAMAN DASHBOARD USTADZ
// Ustadz Dashboard
exports.getDashboardData = (req, res) => {
  const id_ustadz = parseInt(req.params.id_ustadz, 10);

  if (isNaN(id_ustadz)) {
    return res.status(400).json({ message: "Invalid Ustadz ID." });
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
      console.error("Query error:", err.message);
      return res.status(500).json({ message: "Server error occurred." });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Data not found." });
    }

    res.json(results[0]);
  });
};

// Recent Hafalan
exports.getRecentHafalan = (req, res) => {
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
      console.error("Query error:", err.message);
      return res.status(500).json({ message: "Server error occurred." });
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ message: "No recent memorization reports." });
    }

    res.json(results);
  });
};

// 🚀🚀🚀 HALAMAN KELAS SANTRI
// Ustadz Class Data
exports.getClassData = (req, res) => {
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
};

// Ustadz Santri Data By Class
exports.getSantriData = (req, res) => {
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
};

// 🚀🚀🚀 HALAMAN HAFALAN
// Ustadz Hafalan Data By Id Santri
exports.getHafalanData = (req, res) => {
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
};

// Ustadz Add Hafalan
exports.addHafalan = (req, res) => {
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
};

//Ustadz Edit Hafalan
exports.editHafalan = (req, res) => {
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
};

// Ustadz Delete Hafalan
exports.deleteHafalan = (req, res) => {
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
};

exports.getLaporanNilaiUstadz = (req, res) => {
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
};

// 🚀🚀🚀 HALAMAN PROFILE USTADZ
// Ustadz Profile
exports.getProfile = (req, res) => {
  const { id } = req.params;

  if (isNaN(id) || id <= 0) {
    return res.status(400).send({ message: "Invalid ID." });
  }

  const query = `SELECT id_ustadz, nama_ustadz, jabatan, telepon, email, alamat FROM ustadz WHERE id_ustadz = ?`;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).send({ message: "Server error occurred." });
    }
    if (results.length > 0) {
      res.status(200).send(results[0]);
    } else {
      res.status(404).send({ message: "Ustadz not found." });
    }
  });
};

exports.updateProfile = (req, res) => {
  const { id } = req.params;
  const { telepon, email, alamat } = req.body;

  if (!telepon && !email && !alamat) {
    return res.status(400).send({ message: "No data to update." });
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
      return res.status(500).send({ message: "Server error occurred." });
    }
    res.status(200).send({ message: "Profile updated successfully." });
  });
};

exports.changePassword = async (req, res) => {
  const { id_ustadz } = req.params;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).send({ message: "Please fill all fields." });
  }

  db.query(
    "SELECT password FROM ustadz WHERE id_ustadz = ?",
    [id_ustadz],
    async (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send({ message: "Server error occurred." });
      }

      if (results.length === 0) {
        return res.status(404).send({ message: "Ustadz not found." });
      }

      const storedPassword = results[0].password;
      const isMatch = await bcrypt.compare(oldPassword, storedPassword);
      if (!isMatch) {
        return res.status(401).send({ message: "Incorrect old password." });
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      db.query(
        "UPDATE ustadz SET password = ? WHERE id_ustadz = ?",
        [hashedPassword, id_ustadz],
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

// Add other ustadz-related controller functions here...
