const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Routes
const authRoutes = require("./routes/auth");
const obatRoutes = require("./routes/obat");
const transaksiRoutes = require("./routes/transaksi");
const stokRoutes = require("./routes/stok");
const laporanRoutes = require("./routes/laporan");

app.use("/api/auth", authRoutes);
app.use("/api/obat", obatRoutes);
app.use("/api/transaksi", transaksiRoutes);
app.use("/api/stok", stokRoutes);
app.use("/api/laporan", laporanRoutes);

// Route untuk halaman utama
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
