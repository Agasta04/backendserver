const express = require("express");
const router = express.Router();
const firebaseController = require("../controllers/firebase.controller");

// Update FCM token
router.post("/update-token", firebaseController.updateFCMToken);

// Save notification to database
router.post("/api/simpan-notifikasi", firebaseController.saveNotification);

// Get notifications
router.get("/api/notifikasi", firebaseController.getNotifications);

// Send hafalan notification
router.post("/send-notif-hafalan", firebaseController.sendHafalanNotification);

module.exports = router;
