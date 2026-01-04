# Sistem Manajemen Apotek

Sistem manajemen apotek sederhana menggunakan Node.js, Express, dan database JSON.

## Fitur

- ✅ **Manajemen Obat (CRUD)** - Tambah, lihat, edit, dan hapus data obat
- ✅ **Penjualan/Transaksi** - Proses penjualan dengan multiple items
- ✅ **Manajemen Stok** - Update stok masuk/keluar dan lihat riwayat perubahan
- ✅ **Laporan Penjualan** - Laporan harian, bulanan, dan obat terlaris

## Instalasi

1. Install Node.js (versi 14 atau lebih baru)

2. Install dependencies:

```bash
npm install
```

3. Jalankan aplikasi:

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

## Struktur Project

```
apotek-uas/
├── app.js                 # Entry point Express server
├── package.json           # Dependencies
├── data/                  # Folder database JSON
│   ├── obat.json
│   ├── transaksi.json
│   ├── stok.json
│   └── users.json
├── middleware/            # Middleware
│   └── auth.js
├── routes/                # Route handlers
│   ├── obat.js
│   ├── transaksi.js
│   ├── stok.js
│   └── laporan.js
├── controllers/           # Business logic
│   ├── authController.js
│   ├── obatController.js
│   ├── transaksiController.js
│   ├── stokController.js
│   └── laporanController.js
├── routes/                # Route handlers
│   ├── auth.js
│   ├── obat.js
│   ├── transaksi.js
│   ├── stok.js
│   └── laporan.js
├── utils/                 # Helper functions
│   └── database.js
└── public/                # Frontend files
    ├── index.html
    ├── styles.css
    └── app.js
```

## API Endpoints

### Obat

- `GET /api/obat` - Get all obat
- `GET /api/obat/:id` - Get obat by ID
- `POST /api/obat` - Create new obat
- `PUT /api/obat/:id` - Update obat
- `DELETE /api/obat/:id` - Delete obat

### Transaksi

- `GET /api/transaksi` - Get all transaksi
- `GET /api/transaksi/:id` - Get transaksi by ID
- `POST /api/transaksi` - Create new transaksi

### Stok

- `GET /api/stok` - Get all stok history
- `GET /api/stok/current` - Get current stok semua obat
- `GET /api/stok/obat/:obat_id` - Get stok history by obat
- `POST /api/stok/update` - Update stok (masuk/keluar)

### Laporan

- `GET /api/laporan/dashboard` - Dashboard summary
- `GET /api/laporan/harian?tanggal=YYYY-MM-DD` - Laporan harian
- `GET /api/laporan/bulanan?bulan=X&tahun=YYYY` - Laporan bulanan
- `GET /api/laporan/terlaris?limit=10` - Obat terlaris

### Authentication

- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register user baru (Admin only)
- `GET /api/auth/users` - Get all users (Admin only)

## Teknologi

- **Node.js** - Runtime environment
- **Express** - Web framework
- **JSON** - Database (file-based)
- **Vanilla JavaScript** - Frontend

## Default User Accounts

**Admin:**

- Username: `admin`
- Password: `admin123`

**Kasir:**

- Username: `kasir`
- Password: `kasir123`

## Catatan

- Data disimpan dalam file JSON di folder `data/`
- Sistem autentikasi dengan role-based access control
- Pajak 11% otomatis pada setiap transaksi
- Cocok untuk penggunaan sederhana atau UAS
- Copyright © 2026 by revin
