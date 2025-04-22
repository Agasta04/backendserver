const db = require("../config/db");
const bcrypt = require("bcryptjs");
const moment = require("moment-timezone");

// 🚀🚀🚀 HALAMAN DASHBOARD
// Admin Dashboard
exports.getDashboardData = (req, res) => {
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
};

exports.getDashboardHafalan = (req, res) => {
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
};

// 🚀🚀🚀 HALAMAN KELAS
exports.getClassAdmin = (req, res) => {
  const query = "SELECT id_kelas, nama_kelas FROM kelas";
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Gagal mengambil data kelas" });
    }
    res.json(results);
  });
};

exports.addClassAdmin = (req, res) => {
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
};

exports.getUstadzData = (req, res) => {
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
};

exports.getDetailClass = (req, res) => {
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
};

exports.updateClass = (req, res) => {
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
};

exports.deleteClass = (req, res) => {
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
};

// 🚀🚀🚀 HALAMAN SANTRI
exports.getSantriData = (req, res) => {
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
};

exports.addSantriData = async (req, res) => {
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
};

exports.updateSantriData = (req, res) => {
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
};

exports.resertSantriPassword = async (req, res) => {
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
};

exports.deleteSantriData = (req, res) => {
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
};

// 🚀🚀🚀 HALAMAN USTADZ
exports.getUstadzData = (req, res) => {
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
};

exports.addUstadzData = async (req, res) => {
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
};

exports.updateUstadzData = (req, res) => {
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
};

exports.resertUstadzPassword = async (req, res) => {
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
};

exports.deleteUstadzData = (req, res) => {
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
};

// 🚀🚀🚀 HALAMAN HAFALAN
exports.getHafalanData = (req, res) => {
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
};

exports.addHafalanData = (req, res) => {
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
};

exports.updateHafalanData = (req, res) => {
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

exports.deleteHafalanData = (req, res) => {
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

exports.getLaporanNilaiAdmin = (req, res) => {
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

// 🚀🚀🚀 HALAMAN PROFILE ADMIN
// Admin Profile
exports.getProfile = (req, res) => {
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
};

exports.updateProfile = (req, res) => {
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
};

exports.changePassword = async (req, res) => {
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
};

// Add other admin-related controller functions here...
