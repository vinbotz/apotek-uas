const { readJSON } = require("../utils/database");

// Laporan penjualan harian
exports.getLaporanHarian = (req, res) => {
  try {
    const { tanggal } = req.query;
    const transaksi = readJSON("transaksi.json");

    let filtered = transaksi;

    if (tanggal) {
      const targetDate = new Date(tanggal).toISOString().split("T")[0];
      filtered = transaksi.filter((t) => {
        const transDate = new Date(t.tanggal).toISOString().split("T")[0];
        return transDate === targetDate;
      });
    }

    const totalPenjualan = filtered.reduce((sum, t) => sum + t.total, 0);
    const totalTransaksi = filtered.length;

    res.json({
      success: true,
      data: {
        tanggal: tanggal || "Semua",
        total_transaksi: totalTransaksi,
        total_penjualan: totalPenjualan,
        detail: filtered,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Laporan penjualan bulanan
exports.getLaporanBulanan = (req, res) => {
  try {
    const { bulan, tahun } = req.query;
    const transaksi = readJSON("transaksi.json");

    let filtered = transaksi;

    if (bulan && tahun) {
      filtered = transaksi.filter((t) => {
        const transDate = new Date(t.tanggal);
        return (
          transDate.getMonth() + 1 === parseInt(bulan) &&
          transDate.getFullYear() === parseInt(tahun)
        );
      });
    } else if (tahun) {
      filtered = transaksi.filter((t) => {
        const transDate = new Date(t.tanggal);
        return transDate.getFullYear() === parseInt(tahun);
      });
    }

    const totalPenjualan = filtered.reduce((sum, t) => sum + t.total, 0);
    const totalTransaksi = filtered.length;

    // Group by obat
    const obatTerjual = {};
    filtered.forEach((t) => {
      t.items.forEach((item) => {
        if (!obatTerjual[item.obat_id]) {
          obatTerjual[item.obat_id] = {
            nama: item.obat_nama,
            qty: 0,
            total: 0,
          };
        }
        obatTerjual[item.obat_id].qty += item.qty;
        obatTerjual[item.obat_id].total += item.subtotal;
      });
    });

    res.json({
      success: true,
      data: {
        periode: bulan && tahun ? `${bulan}/${tahun}` : tahun || "Semua",
        total_transaksi: totalTransaksi,
        total_penjualan: totalPenjualan,
        obat_terjual: Object.values(obatTerjual),
        detail: filtered,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Laporan obat terlaris
exports.getObatTerlaris = (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const transaksi = readJSON("transaksi.json");

    const obatTerjual = {};

    transaksi.forEach((t) => {
      t.items.forEach((item) => {
        if (!obatTerjual[item.obat_id]) {
          obatTerjual[item.obat_id] = {
            obat_id: item.obat_id,
            nama: item.obat_nama,
            qty: 0,
            total: 0,
          };
        }
        obatTerjual[item.obat_id].qty += item.qty;
        obatTerjual[item.obat_id].total += item.subtotal;
      });
    });

    const sorted = Object.values(obatTerjual)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: sorted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Dashboard summary
exports.getDashboard = (req, res) => {
  try {
    const obat = readJSON("obat.json");
    const transaksi = readJSON("transaksi.json");

    // Total obat
    const totalObat = obat.length;

    // Total stok
    const totalStok = obat.reduce((sum, o) => sum + o.stok, 0);

    // Obat habis
    const obatHabis = obat.filter((o) => o.stok === 0).length;

    // Total transaksi hari ini
    const today = new Date().toISOString().split("T")[0];
    const transaksiHariIni = transaksi.filter((t) => {
      const transDate = new Date(t.tanggal).toISOString().split("T")[0];
      return transDate === today;
    });

    const totalPenjualanHariIni = transaksiHariIni.reduce(
      (sum, t) => sum + t.total,
      0
    );

    // Total penjualan semua waktu
    const totalPenjualan = transaksi.reduce((sum, t) => sum + t.total, 0);

    res.json({
      success: true,
      data: {
        total_obat: totalObat,
        total_stok: totalStok,
        obat_habis: obatHabis,
        transaksi_hari_ini: transaksiHariIni.length,
        penjualan_hari_ini: totalPenjualanHariIni,
        total_penjualan: totalPenjualan,
        total_transaksi: transaksi.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
