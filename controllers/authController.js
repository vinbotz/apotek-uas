const { readJSON, writeJSON } = require("../utils/database");
const { v4: uuidv4 } = require("uuid");

// Login
exports.login = (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username dan password wajib diisi",
      });
    }

    const users = readJSON("users.json");
    const user = users.find(
      (u) => u.username === username && u.password === password
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Username atau password salah",
      });
    }

    // Jangan kirim password ke client
    const userData = {
      id: user.id,
      username: user.username,
      role: user.role,
      nama: user.nama,
    };

    res.json({
      success: true,
      data: userData,
      message: "Login berhasil",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Register (hanya untuk admin)
exports.register = (req, res) => {
  try {
    const { username, password, role, nama } = req.body;

    if (!username || !password || !role || !nama) {
      return res.status(400).json({
        success: false,
        message: "Semua field wajib diisi",
      });
    }

    if (!["Admin", "Kasir"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role harus Admin atau Kasir",
      });
    }

    const users = readJSON("users.json");

    // Cek apakah username sudah ada
    const existingUser = users.find((u) => u.username === username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Username sudah digunakan",
      });
    }

    const newUser = {
      id: uuidv4(),
      username,
      password, // Dalam production, password harus di-hash
      role,
      nama,
      created_at: new Date().toISOString(),
    };

    users.push(newUser);
    writeJSON("users.json", users);

    const userData = {
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
      nama: newUser.nama,
    };

    res.status(201).json({
      success: true,
      data: userData,
      message: "User berhasil dibuat",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all users (hanya admin)
exports.getAllUsers = (req, res) => {
  try {
    const users = readJSON("users.json");
    const usersWithoutPassword = users.map((u) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      nama: u.nama,
      created_at: u.created_at,
    }));

    res.json({ success: true, data: usersWithoutPassword });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
