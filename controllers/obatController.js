const { readJSON, writeJSON } = require("../utils/database");
const { v4: uuidv4 } = require("uuid");

// Get all obat
exports.getAllObat = (req, res) => {
  try {
    const obat = readJSON("obat.json");
    res.json({ success: true, data: obat });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get obat by ID
exports.getObatById = (req, res) => {
  try {
    const obat = readJSON("obat.json");
    const obatItem = obat.find((o) => o.id === req.params.id);

    if (!obatItem) {
      return res
        .status(404)
        .json({ success: false, message: "Obat tidak ditemukan" });
    }

    res.json({ success: true, data: obatItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create new obat
exports.createObat = (req, res) => {
  try {
    const { nama, kategori, satuan, harga_beli, harga_jual, stok_awal } =
      req.body;

    // Validasi
    if (
      !nama ||
      !kategori ||
      !satuan ||
      !harga_beli ||
      !harga_jual ||
      stok_awal === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Semua field wajib diisi",
      });
    }

    const obat = readJSON("obat.json");

    // Cek apakah nama obat sudah ada
    const existingObat = obat.find(
      (o) => o.nama.toLowerCase() === nama.toLowerCase()
    );
    if (existingObat) {
      return res.status(400).json({
        success: false,
        message: "Nama obat sudah ada",
      });
    }

    const newObat = {
      id: uuidv4(),
      nama,
      kategori,
      satuan,
      harga_beli: parseFloat(harga_beli),
      harga_jual: parseFloat(harga_jual),
      stok: parseInt(stok_awal) || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    obat.push(newObat);
    writeJSON("obat.json", obat);

    // Update stok.json
    const stok = readJSON("stok.json");
    stok.push({
      id: uuidv4(),
      obat_id: newObat.id,
      obat_nama: nama,
      perubahan: parseInt(stok_awal),
      jenis: "Masuk",
      keterangan: "Stok awal",
      tanggal: new Date().toISOString(),
    });
    writeJSON("stok.json", stok);

    res
      .status(201)
      .json({
        success: true,
        data: newObat,
        message: "Obat berhasil ditambahkan",
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update obat
exports.updateObat = (req, res) => {
  try {
    const { nama, kategori, satuan, harga_beli, harga_jual } = req.body;
    const obat = readJSON("obat.json");
    const index = obat.findIndex((o) => o.id === req.params.id);

    if (index === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Obat tidak ditemukan" });
    }

    // Update data
    if (nama) obat[index].nama = nama;
    if (kategori) obat[index].kategori = kategori;
    if (satuan) obat[index].satuan = satuan;
    if (harga_beli !== undefined)
      obat[index].harga_beli = parseFloat(harga_beli);
    if (harga_jual !== undefined)
      obat[index].harga_jual = parseFloat(harga_jual);
    obat[index].updated_at = new Date().toISOString();

    writeJSON("obat.json", obat);
    res.json({
      success: true,
      data: obat[index],
      message: "Obat berhasil diupdate",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete obat
exports.deleteObat = (req, res) => {
  try {
    const obat = readJSON("obat.json");
    const index = obat.findIndex((o) => o.id === req.params.id);

    if (index === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Obat tidak ditemukan" });
    }

    obat.splice(index, 1);
    writeJSON("obat.json", obat);

    res.json({ success: true, message: "Obat berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
