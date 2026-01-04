const express = require("express");
const router = express.Router();
const transaksiController = require("../controllers/transaksiController");

router.get("/", transaksiController.getAllTransaksi);
router.get("/:id", transaksiController.getTransaksiById);
router.post("/", transaksiController.createTransaksi);

module.exports = router;
