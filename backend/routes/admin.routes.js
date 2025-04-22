const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");

// Admin Dashboard
router.get("/dashboard", adminController.getDashboardData);
router.get("/hafalan", adminController.getDashboardHafalan);

// Admin Kelas
router.get("/kelas", adminController.getClassAdmin);
router.post("/add-kelas", adminController.addClassAdmin);
router.get("/class-ustadz", adminController.getUstadzData);
router.get("/kelas/:kelasId", adminController.getDetailClass);
router.put("/update-kelas/:kelasId", adminController.updateClass);
router.delete("/delete-kelas/:kelasId", adminController.deleteClass);

// Admin Santri Kelas
router.get("/santri", adminController.getSantriData);
router.post("/add-santri", adminController.addSantriData);
router.put("/update-santri/:id", adminController.updateSantriData);
router.put("/reset-password-santri/:id", adminController.resertSantriPassword);
router.delete("/delete-santri/:id", adminController.deleteSantriData);

// Admin Ustadz
router.get("/ustadz", adminController.getUstadzData);
router.post("/add-ustadz", adminController.addUstadzData);
router.put("/update-ustadz/:id", adminController.updateUstadzData);
router.put("/reset-password/:id", adminController.resertUstadzPassword);
router.delete("/delete-ustadz/:id", adminController.deleteUstadzData);

// Admin Hafalan
router.get("/hafalan/data", adminController.getHafalanData);
router.post("/add-hafalan", adminController.addHafalanData);
router.put("/update-hafalan/:id", adminController.updateHafalanData);
router.delete("/delete-hafalan/:id", adminController.deleteHafalanData);
router.get(
  "/laporan-admin-nilai/:id_santri",
  adminController.getLaporanNilaiAdmin
);

// Admin Profile
router.get("/:id", adminController.getProfile);
router.put("/:id/update", adminController.updateProfile);
router.put("/:id_admin/password", adminController.changePassword);

// Add other admin-related routes here...

module.exports = router;
