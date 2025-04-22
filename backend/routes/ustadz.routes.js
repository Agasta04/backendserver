const express = require("express");
const router = express.Router();
const ustadzController = require("../controllers/ustadz.controller");

// Ustadz Dashboard
router.get("/dashboard/:id_ustadz", ustadzController.getDashboardData);
router.get(
  "/dashboard/recent-hafalan/:id_ustadz",
  ustadzController.getRecentHafalan
);

// Ustadz Kelas
router.get("/kelas", ustadzController.getClassData);
router.get("/kelas/:classId/santri", ustadzController.getSantriData);

// Ustadz Hafalan
router.get("/hafalan-santri", ustadzController.getHafalanData);
router.post("/add-hafalan", ustadzController.addHafalan);
router.put("/update-hafalan/:id", ustadzController.editHafalan);
router.delete("/delete-hafalan/:id", ustadzController.deleteHafalan);
router.get(
  "/laporan-ustadz-nilai/:id_santri",
  ustadzController.getLaporanNilaiUstadz
);

// Ustadz Profile
router.get("/:id", ustadzController.getProfile);
router.put("/:id/update", ustadzController.updateProfile);
router.put("/:id_ustadz/password", ustadzController.changePassword);

// Add other ustadz-related routes here...

module.exports = router;
