const { readJSON, writeJSON } = require("../utils/database");
const { v4: uuidv4 } = require("uuid");

// Get all transaksi
exports.getAllTransaksi = (req, res) => {
  try {
    const transaksi = readJSON("transaksi.json");
    // Sort by tanggal terbaru
    transaksi.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    res.json({ success: true, data: transaksi });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get transaksi by ID
exports.getTransaksiById = (req, res) => {
  try {
    const transaksi = readJSON("transaksi.json");
    const transaksiItem = transaksi.find((t) => t.id === req.params.id);

    if (!transaksiItem) {
      return res
        .status(404)
        .json({ success: false, message: "Transaksi tidak ditemukan" });
    }

    res.json({ success: true, data: transaksiItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create new transaksi
exports.createTransaksi = (req, res) => {
  try {
    const { items } = req.body; // items: [{ obat_id, qty }]

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Items transaksi tidak boleh kosong",
      });
    }

    const obat = readJSON("obat.json");
    const transaksi = readJSON("transaksi.json");
    const stok = readJSON("stok.json");

    let total = 0;
    const detailItems = [];

    // Validasi dan proses setiap item
    for (const item of items) {
      const obatItem = obat.find((o) => o.id === item.obat_id);

      if (!obatItem) {
        return res.status(400).json({
          success: false,
          message: `Obat dengan ID ${item.obat_id} tidak ditemukan`,
        });
      }

      if (obatItem.stok < item.qty) {
        return res.status(400).json({
          success: false,
          message: `Stok ${obatItem.nama} tidak mencukupi. Stok tersedia: ${obatItem.stok}`,
        });
      }

      const subtotal = obatItem.harga_jual * item.qty;
      total += subtotal;

      detailItems.push({
        obat_id: obatItem.id,
        obat_nama: obatItem.nama,
        qty: parseInt(item.qty),
        harga_satuan: obatItem.harga_jual,
        subtotal: subtotal,
      });

      // Kurangi stok
      obatItem.stok -= parseInt(item.qty);

      // Record di stok.json
      stok.push({
        id: uuidv4(),
        obat_id: obatItem.id,
        obat_nama: obatItem.nama,
        perubahan: -parseInt(item.qty),
        jenis: "Keluar",
        keterangan: "Penjualan",
        tanggal: new Date().toISOString(),
      });
    }

    // Hitung pajak 11%
    const pajak = total * 0.11;
    const total_dengan_pajak = total + pajak;

    // Buat transaksi baru
    const newTransaksi = {
      id: uuidv4(),
      no_transaksi: `TRX-${Date.now()}`,
      tanggal: new Date().toISOString(),
      items: detailItems,
      subtotal: total,
      pajak: pajak,
      total: total_dengan_pajak,
      created_at: new Date().toISOString(),
    };

    transaksi.push(newTransaksi);
    writeJSON("transaksi.json", transaksi);
    writeJSON("obat.json", obat);
    writeJSON("stok.json", stok);

    res.status(201).json({
      success: true,
      data: newTransaksi,
      message: "Transaksi berhasil dibuat",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
