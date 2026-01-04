const express = require("express");
const router = express.Router();
const stokController = require("../controllers/stokController");

router.get("/", stokController.getAllStok);
router.get("/current", stokController.getCurrentStok);
router.get("/obat/:obat_id", stokController.getStokByObat);
router.post("/update", stokController.updateStok);

module.exports = router;
