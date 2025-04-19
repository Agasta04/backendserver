const db = require("../config/db");
const admin = require("../firebase");

exports.updateFCMToken = (req, res) => {
  console.log("📩 Received request body:", req.body);

  const { id_santri, fcm_token } = req.body;

  db.query(
    "UPDATE santri SET fcm_token = ? WHERE id_santri = ?",
    [fcm_token, id_santri],
    (err, result) => {
      if (err) {
        console.error("❌ Failed to update FCM Token:", err);
        return res.status(500).send(err);
      }

      console.log(
        "✅ Successfully updated FCM Token for santri ID:",
        id_santri
      );
      console.log("Query result:", result);
      res.send({ success: true });
    }
  );
};

exports.saveNotification = (req, res) => {
  const { id_santri, judul, pesan, waktu } = req.body;

  db.query(
    "INSERT INTO notifications (id_santri, judul, pesan, waktu) VALUES (?, ?, ?, ?)",
    [id_santri, judul, pesan, waktu],
    (err, result) => {
      if (err) {
        console.error("❌ Failed to save notification:", err);
        return res.status(500).send(err);
      }
      res.send({ success: true });
    }
  );
};

exports.getNotifications = (req, res) => {
  const { id_santri } = req.query;

  db.query(
    "SELECT * FROM notifications WHERE id_santri = ? ORDER BY waktu DESC",
    [id_santri],
    (err, result) => {
      if (err) {
        console.error("❌ Failed to get notifications:", err);
        return res.status(500).send(err);
      }
      res.json(result);
    }
  );
};

exports.sendHafalanNotification = (req, res) => {
  const { id_santri, judul, isi } = req.body;

  // 1. Get FCM token from database
  db.query(
    "SELECT fcm_token FROM santri WHERE id_santri = ?",
    [id_santri],
    (err, result) => {
      if (err) {
        console.error("❌ Error getting FCM token:", err);
        return res.status(500).json({ error: "Database error" });
      }

      const token = result[0]?.fcm_token;
      if (!token) {
        return res.status(404).json({ error: "Token not found" });
      }

      // 2. Prepare message
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

      // 3. Send via FCM
      admin
        .messaging()
        .send(message)
        .then((response) => {
          console.log("✅ Notification sent:", response);
          res.status(200).json({ success: true, messageId: response });
        })
        .catch((error) => {
          console.error("❌ Failed to send notification:", error);
          res.status(500).json({ error: "Failed to send notification" });
        });
    }
  );
};
