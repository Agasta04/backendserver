const express = require("express");
const router = express.Router();
const ustadzController = require("../controllers/ustadz.controller");

// Ustadz Dashboard
router.get("/dashboard-ustadz/:id_ustadz", ustadzController.getDashboardData);
router.get(
  "/dashboard-ustadz/:id_ustadz/recent-hafalan",
  ustadzController.getRecentHafalan
);

// Ustadz Kelas
router.get("/ustadz/kelas", ustadzController.getClassData);
router.get("/kelas/:classId/santri", ustadzController.getSantriData);

// Ustadz Hafalan
router.get("/hafalan-santri", ustadzController.getHafalanData);
router.post("/add-hafalan", ustadzController.addHafalan);
router.put("/update-hafalan/:id", ustadzController.editHafalan);
router.delete("/delete-hafalan/:id", ustadzController.deleteHafalan);
router.get(
  "/ustadz-laporan-nilai/:id_santri",
  ustadzController.getLaporanNilaiUstadz
);

// Ustadz Profile
router.get("/ustadz/:id", ustadzController.getProfile);
router.put("/ustadz/:id/update", ustadzController.updateProfile);
router.put("/ustadz/:id_ustadz/password", ustadzController.changePassword);

// Add other ustadz-related routes here...

module.exports = router;
