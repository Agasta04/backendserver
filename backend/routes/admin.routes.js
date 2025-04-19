const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");

// Admin Dashboard
router.get("/dashboard-admin", adminController.getDashboardData);
router.get("/hafalan", adminController.getDashboardHafalan);

// Admin Kelas
router.get("/admin/kelas", adminController.getClassAdmin);
router.post("/add-kelas", adminController.addClassAdmin);
router.get("/class-ustadz", adminController.getUstadzData);
router.get("/admin/kelas/:kelasId", adminController.getDetailClass);
router.put("/admin/update-kelas/:kelasId", adminController.updateClass);
router.delete("/admin/delete-kelas/:kelasId", adminController.deleteClass);

// Admin Santri Kelas
router.get("/admin/santri", adminController.getSantriData);
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
router.get("/hafalan/admin", adminController.getHafalanData);
router.post("/admin-add-hafalan", adminController.addHafalanData);
router.put("/admin-update-hafalan/:id", adminController.updateHafalanData);
router.delete("/admin-delete-hafalan/:id", adminController.deleteHafalanData);
router.get(
  "/admin-laporan-nilai/:id_santri",
  adminController.getLaporanNilaiAdmin
);

// Admin Profile
router.get("/admin/:id", adminController.getProfile);
router.put("/admin/:id/update", adminController.updateProfile);
router.put("/admin/:id_admin/password", adminController.changePassword);

// Add other admin-related routes here...

module.exports = router;
