const express = require("express");
const router = express.Router();
const santriController = require("../controllers/santri.controller");

// Santri Dashboard
router.get("/santri/dashboard/:idSantri", santriController.getDashboardData);

// Santri Hafalan
router.get("/santri/hafalan/:idSantri", santriController.getHafalanData);

// Santri Nilai
router.get("/santri/laporan-nilai/:id-santri", santriController.getNilaiSantri);

// Santri Profile
router.get("/santri/profile/:id", santriController.getProfile);
router.put("/santri/:id/update", santriController.updateProfile);
router.put("/santri/:id_santri/password", santriController.changePassword);

// Add other santri-related routes here...

module.exports = router;
