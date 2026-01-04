const express = require("express");
const router = express.Router();
const laporanController = require("../controllers/laporanController");

router.get("/dashboard", laporanController.getDashboard);
router.get("/harian", laporanController.getLaporanHarian);
router.get("/bulanan", laporanController.getLaporanBulanan);
router.get("/terlaris", laporanController.getObatTerlaris);

module.exports = router;
