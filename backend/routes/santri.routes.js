const express = require("express");
const router = express.Router();
const santriController = require("../controllers/santri.controller");

// Santri Dashboard
router.get("/dashboard/:idSantri", santriController.getDashboardData);

// Santri Hafalan
router.get("/hafalan/:idSantri", santriController.getHafalanData);

// Santri Nilai
router.get(
  "/laporan-santri-nilai/:idSantri",
  santriController.getNilaiHafalanSantri
);

// Santri Profile
router.get("/profile/:id", santriController.getProfile);
router.put("/:id/update", santriController.updateProfile);
router.put("/:id_santri/password", santriController.changePassword);

// Add other santri-related routes here...

module.exports = router;
