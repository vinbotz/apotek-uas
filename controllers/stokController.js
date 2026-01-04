const { readJSON, writeJSON } = require("../utils/database");
const { v4: uuidv4 } = require("uuid");

// Get all stok history
exports.getAllStok = (req, res) => {
  try {
    const stok = readJSON("stok.json");
    // Sort by tanggal terbaru
    stok.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    res.json({ success: true, data: stok });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get stok by obat_id
exports.getStokByObat = (req, res) => {
  try {
    const stok = readJSON("stok.json");
    const obatStok = stok.filter((s) => s.obat_id === req.params.obat_id);
    obatStok.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    res.json({ success: true, data: obatStok });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update stok (tambah/kurangi manual)
exports.updateStok = (req, res) => {
  try {
    const { obat_id, perubahan, jenis, keterangan } = req.body;

    if (!obat_id || perubahan === undefined || !jenis) {
      return res.status(400).json({
        success: false,
        message: "obat_id, perubahan, dan jenis wajib diisi",
      });
    }

    if (!["Masuk", "Keluar"].includes(jenis)) {
      return res.status(400).json({
        success: false,
        message: 'Jenis harus "Masuk" atau "Keluar"',
      });
    }

    const obat = readJSON("obat.json");
    const obatItem = obat.find((o) => o.id === obat_id);

    if (!obatItem) {
      return res
        .status(404)
        .json({ success: false, message: "Obat tidak ditemukan" });
    }

    const perubahanQty =
      jenis === "Masuk" ? parseInt(perubahan) : -parseInt(perubahan);

    // Validasi jika stok keluar lebih besar dari stok tersedia
    if (jenis === "Keluar" && obatItem.stok < perubahan) {
      return res.status(400).json({
        success: false,
        message: `Stok tidak mencukupi. Stok tersedia: ${obatItem.stok}`,
      });
    }

    // Update stok obat
    obatItem.stok += perubahanQty;
    obatItem.updated_at = new Date().toISOString();

    // Record di stok.json
    const stok = readJSON("stok.json");
    stok.push({
      id: uuidv4(),
      obat_id: obatItem.id,
      obat_nama: obatItem.nama,
      perubahan: perubahanQty,
      jenis: jenis,
      keterangan: keterangan || "Update manual",
      tanggal: new Date().toISOString(),
    });

    writeJSON("obat.json", obat);
    writeJSON("stok.json", stok);

    res.json({
      success: true,
      data: obatItem,
      message: `Stok berhasil diupdate. Stok sekarang: ${obatItem.stok}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get current stok semua obat
exports.getCurrentStok = (req, res) => {
  try {
    const obat = readJSON("obat.json");
    const stokSummary = obat.map((o) => ({
      id: o.id,
      nama: o.nama,
      kategori: o.kategori,
      satuan: o.satuan,
      stok: o.stok,
      harga_jual: o.harga_jual,
    }));

    res.json({ success: true, data: stokSummary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
