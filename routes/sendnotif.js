const express = require("express");
const router = express.Router();
const admin = require("../firebase"); // pastikan path sesuai
const db = require("../db"); // koneksi ke MySQL

router.post("/send-notif-hafalan", (req, res) => {
  const { id_santri, judul, isi } = req.body;

  // Ambil token FCM dari database
  db.query(
    "SELECT fcm_token FROM santri WHERE id_santri = ?",
    [id_santri],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Database error" });

      const token = result[0]?.fcm_token;
      if (!token)
        return res.status(404).json({ error: "Token tidak ditemukan" });

      // Siapkan payload notifikasi
      const message = {
        token,
        notification: {
          title: judul || "Hafalan Baru 🎉",
          body: isi || "Ustadz telah menambahkan hafalan baru untuk kamu!",
        },
        android: { priority: "high" },
        apns: {
          headers: { "apns-priority": "10" },
          payload: { aps: { sound: "default" } },
        },
      };

      // Kirim notifikasi FCM
      admin
        .messaging()
        .send(message)
        .then((response) => {
          console.log("✅ Notifikasi dikirim:", response);

          // Simpan log notifikasi ke database
          db.query(
            "INSERT INTO notifications (id_santri, judul, pesan, waktu) VALUES (?, ?, ?, NOW())",
            [id_santri, judul, isi],
            () => {
              return res
                .status(200)
                .json({ success: true, messageId: response });
            }
          );
        })
        .catch((error) => {
          console.error("❌ Gagal kirim notifikasi:", error);
          res.status(500).json({ error: "Gagal kirim notifikasi" });
        });
    }
  );
});

module.exports = router;
