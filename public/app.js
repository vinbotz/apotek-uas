const API_BASE = "/api";

// Authentication state
let currentUser = null;

// Custom Modal System
let modalResolve = null;

function showCustomModal(title, message, type = "info", showConfirm = false) {
  return new Promise((resolve) => {
    const modal = document.getElementById("custom-modal");
    const modalTitle = document.getElementById("modal-title");
    const modalMessage = document.getElementById("modal-message");
    const modalIcon = document.getElementById("modal-icon");
    const btnOk = document.getElementById("modal-btn-ok");
    const btnYes = document.getElementById("modal-btn-yes");
    const btnNo = document.getElementById("modal-btn-no");

    // Reset modal classes
    modal.className = "custom-modal " + type;

    // Set content
    modalTitle.textContent = title;
    modalMessage.textContent = message;

    // Set icon based on type
    switch (type) {
      case "success":
        modalIcon.textContent = "✅";
        break;
      case "error":
        modalIcon.textContent = "❌";
        break;
      case "warning":
        modalIcon.textContent = "⚠️";
        break;
      default:
        modalIcon.textContent = "ℹ️";
    }

    // Show/hide buttons
    if (showConfirm) {
      btnOk.style.display = "none";
      btnYes.style.display = "";
      btnNo.style.display = "";
      modalResolve = resolve;
    } else {
      btnOk.style.display = "";
      btnYes.style.display = "none";
      btnNo.style.display = "none";
      modalResolve = null;
      btnOk.onclick = () => {
        closeCustomModal();
        resolve(true);
      };
    }

    modal.style.display = "block";

    // If not confirm, auto resolve after showing
    if (!showConfirm) {
      // Will be resolved when OK is clicked
    }
  });
}

function closeCustomModal() {
  const modal = document.getElementById("custom-modal");
  modal.style.display = "none";
  // If it's a confirm dialog and no result was passed, resolve as false (cancelled)
  if (modalResolve) {
    modalResolve(false);
    modalResolve = null;
  }
}

function modalConfirm(result) {
  // Resolve first before closing to avoid double resolve
  if (modalResolve) {
    const resolve = modalResolve;
    modalResolve = null; // Clear first to prevent double resolve
    resolve(result);
  }
  closeCustomModal();
}

// Replace alert function
function customAlert(message, type = "info") {
  const title =
    type === "success"
      ? "Berhasil"
      : type === "error"
      ? "Error"
      : type === "warning"
      ? "Peringatan"
      : "Informasi";
  return showCustomModal(title, message, type, false);
}

// Replace confirm function
function customConfirm(message) {
  return showCustomModal("Konfirmasi", message, "warning", true);
}

// Close modal when clicking outside
window.onclick = function (event) {
  const modal = document.getElementById("custom-modal");
  if (event.target === modal) {
    // If it's a confirm dialog, resolve as false (user cancelled)
    if (modalResolve) {
      modalResolve(false);
      modalResolve = null;
    }
    closeCustomModal();
  }
};

// Check if user is logged in
function checkAuth() {
  const savedUser = localStorage.getItem("currentUser");
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    showMainApp();
    return true;
  }
  return false;
}

// Show login screen
function showLoginScreen() {
  document.getElementById("login-screen").style.display = "flex";
  document.getElementById("main-app").style.display = "none";
}

// Show main app
function showMainApp() {
  const loginScreen = document.getElementById("login-screen");
  const mainApp = document.getElementById("main-app");

  if (loginScreen) {
    loginScreen.style.animation = "fadeOut 0.3s ease";
    setTimeout(() => {
      loginScreen.style.display = "none";
    }, 300);
  }

  if (mainApp) {
    mainApp.style.display = "block";
    mainApp.style.animation = "fadeIn 0.5s ease";
  }

  if (currentUser) {
    document.getElementById(
      "user-info"
    ).textContent = `${currentUser.nama} (${currentUser.role})`;

    // Show/hide admin-only features
    updateUIForRole();

    // Setup tab navigation - use setTimeout to ensure DOM is ready
    setTimeout(() => {
      setupTabNavigation();
      // Load initial data for active tab
      loadDashboard();
      updateObatSelect();
    }, 100);
  }
}

// Update UI based on role
function updateUIForRole() {
  const isAdmin = currentUser && currentUser.role === "Admin";

  // Show/hide admin-only buttons
  document.querySelectorAll(".admin-only").forEach((el) => {
    el.style.display = isAdmin ? "" : "none";
  });

  // Update table header Aksi column visibility if needed
  // Column will always be there but buttons will be hidden for Kasir
}

// Handle login
async function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;
  const errorDiv = document.getElementById("login-error");

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (data.success) {
      currentUser = data.data;
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      showMainApp(); // This will setup tabs and load data
      errorDiv.style.display = "none";
    } else {
      errorDiv.textContent = data.message || "Login gagal";
      errorDiv.style.display = "block";
    }
  } catch (error) {
    errorDiv.textContent = "Error: " + error.message;
    errorDiv.style.display = "block";
  }
}

// Handle logout
async function handleLogout() {
  const confirmed = await customConfirm("Yakin ingin logout?");
  if (confirmed) {
    currentUser = null;
    localStorage.removeItem("currentUser");
    cart = [];
    document.getElementById("login-form").reset();
    showLoginScreen();
  }
}

// Tab Navigation
let tabNavigationSetup = false;

function setupTabNavigation() {
  // Prevent duplicate event listeners
  if (tabNavigationSetup) return;

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabName = btn.dataset.tab;

      // Update active tab button
      document
        .querySelectorAll(".tab-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // Update active tab content
      document.querySelectorAll(".tab-content").forEach((content) => {
        content.classList.remove("active");
      });
      const tabContent = document.getElementById(tabName);
      if (tabContent) {
        tabContent.classList.add("active");

        // Load data based on active tab
        if (tabName === "dashboard") loadDashboard();
        else if (tabName === "obat") loadObat();
        else if (tabName === "transaksi") {
          loadTransaksi();
          updateObatSelect();
        } else if (tabName === "stok") loadStok();
        else if (tabName === "laporan") {
          // Laporan doesn't need initial load
        }
      }
    });
  });

  tabNavigationSetup = true;
}

let cart = [];

// Dashboard
async function loadDashboard() {
  try {
    const res = await fetch(`${API_BASE}/laporan/dashboard`);
    const data = await res.json();

    if (data.success) {
      const stats = data.data;
      document.getElementById("dashboard-stats").innerHTML = `
                <div class="stat-card">
                    <h3>Total Obat</h3>
                    <div class="value">${stats.total_obat}</div>
                </div>
                <div class="stat-card">
                    <h3>Total Stok</h3>
                    <div class="value">${stats.total_stok}</div>
                </div>
                <div class="stat-card">
                    <h3>Obat Habis</h3>
                    <div class="value">${stats.obat_habis}</div>
                </div>
                <div class="stat-card">
                    <h3>Transaksi Hari Ini</h3>
                    <div class="value">${stats.transaksi_hari_ini}</div>
                </div>
                <div class="stat-card">
                    <h3>Penjualan Hari Ini</h3>
                    <div class="value">Rp ${formatCurrency(
                      stats.penjualan_hari_ini
                    )}</div>
                </div>
                <div class="stat-card">
                    <h3>Total Penjualan</h3>
                    <div class="value">Rp ${formatCurrency(
                      stats.total_penjualan
                    )}</div>
                </div>
            `;
    }
  } catch (error) {
    console.error("Error loading dashboard:", error);
  }
}

// Obat Management
async function loadObat() {
  try {
    const tbody = document.getElementById("tbody-obat");
    if (tbody) {
      tbody.innerHTML =
        '<tr><td colspan="7" style="text-align: center; padding: 20px;"><div class="loading">Memuat data...</div></td></tr>';
    }

    const res = await fetch(`${API_BASE}/obat`);
    const data = await res.json();

    if (data.success) {
      const isAdmin = currentUser && currentUser.role === "Admin";
      const tbody = document.getElementById("tbody-obat");

      if (!tbody) {
        console.error("Table body not found!");
        return;
      }

      if (data.data.length === 0) {
        const colCount = isAdmin ? 7 : 6;
        tbody.innerHTML = `<tr><td colspan="${colCount}" style="text-align: center;">Tidak ada data obat</td></tr>`;
        return;
      }

      tbody.innerHTML = data.data
        .map(
          (obat) => `
                <tr>
                    <td>${obat.nama}</td>
                    <td>${obat.kategori}</td>
                    <td>${obat.satuan}</td>
                    <td>Rp ${formatCurrency(obat.harga_beli)}</td>
                    <td>Rp ${formatCurrency(obat.harga_jual)}</td>
                    <td><strong>${obat.stok}</strong> ${
            obat.stok === 0 ? '<span style="color:red">(Habis)</span>' : ""
          }</td>
                    ${
                      isAdmin
                        ? `<td>
                        <button class="btn btn-warning" onclick="editObat('${obat.id}')">Edit</button>
                        <button class="btn btn-danger" onclick="deleteObat('${obat.id}')">Hapus</button>
                    </td>`
                        : `<td></td>`
                    }
                </tr>
            `
        )
        .join("");

      // Update select options
      updateObatSelect();

      // Also update stok select if exists
      const stokSelect = document.getElementById("stok-obat-id");
      if (stokSelect) {
        updateObatSelect(); // This function updates both selects
      }
    }
  } catch (error) {
    console.error("Error loading obat:", error);
    const tbody = document.getElementById("tbody-obat");
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">Error loading data: ${error.message}</td></tr>`;
    }
  }
}

async function showAddObatForm() {
  if (!currentUser || currentUser.role !== "Admin") {
    await customAlert("Hanya Admin yang dapat menambah obat!", "error");
    return;
  }
  document.getElementById("add-obat-form").style.display = "block";
  document.getElementById("form-tambah-obat").reset();
}

function closeForm(formId) {
  document.getElementById(formId).style.display = "none";
}

async function addObat(event) {
  event.preventDefault();

  if (!currentUser || currentUser.role !== "Admin") {
    await customAlert("Hanya Admin yang dapat menambah obat!", "error");
    return;
  }

  const form = event.target;
  const formData = {
    nama: form[0].value,
    kategori: form[1].value,
    satuan: form[2].value,
    harga_beli: form[3].value,
    harga_jual: form[4].value,
    stok_awal: form[5].value,
  };

  try {
    const res = await fetch(`${API_BASE}/obat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await res.json();
    if (data.success) {
      await customAlert("Obat berhasil ditambahkan!", "success");
      closeForm("add-obat-form");
      loadObat();
    } else {
      await customAlert("Error: " + data.message, "error");
    }
  } catch (error) {
    await customAlert("Error: " + error.message, "error");
  }
}

async function editObat(id) {
  if (!currentUser || currentUser.role !== "Admin") {
    await customAlert("Hanya Admin yang dapat mengedit obat!", "error");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/obat/${id}`);
    const data = await res.json();

    if (data.success) {
      const obat = data.data;
      document.getElementById("edit-obat-id").value = obat.id;
      document.getElementById("edit-obat-nama").value = obat.nama;
      document.getElementById("edit-obat-kategori").value = obat.kategori;
      document.getElementById("edit-obat-satuan").value = obat.satuan;
      document.getElementById("edit-obat-harga-beli").value = obat.harga_beli;
      document.getElementById("edit-obat-harga-jual").value = obat.harga_jual;
      document.getElementById("edit-obat-form").style.display = "block";
    }
  } catch (error) {
    await customAlert("Error: " + error.message, "error");
  }
}

async function updateObat(event) {
  event.preventDefault();
  const form = event.target;
  const id = document.getElementById("edit-obat-id").value;
  const formData = {
    nama: document.getElementById("edit-obat-nama").value,
    kategori: document.getElementById("edit-obat-kategori").value,
    satuan: document.getElementById("edit-obat-satuan").value,
    harga_beli: document.getElementById("edit-obat-harga-beli").value,
    harga_jual: document.getElementById("edit-obat-harga-jual").value,
  };

  try {
    const res = await fetch(`${API_BASE}/obat/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await res.json();
    if (data.success) {
      await customAlert("Obat berhasil diupdate!", "success");
      closeForm("edit-obat-form");
      loadObat();
    } else {
      await customAlert("Error: " + data.message, "error");
    }
  } catch (error) {
    await customAlert("Error: " + error.message, "error");
  }
}

async function deleteObat(id) {
  if (!currentUser || currentUser.role !== "Admin") {
    await customAlert("Hanya Admin yang dapat menghapus obat!", "error");
    return;
  }

  const confirmed = await customConfirm("Yakin ingin menghapus obat ini?");
  if (!confirmed) return;

  try {
    const res = await fetch(`${API_BASE}/obat/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();
    if (data.success) {
      await customAlert("Obat berhasil dihapus!", "success");
      loadObat();
    } else {
      await customAlert("Error: " + data.message, "error");
    }
  } catch (error) {
    await customAlert("Error: " + error.message, "error");
  }
}

async function updateObatSelect() {
  try {
    const res = await fetch(`${API_BASE}/obat`);
    const data = await res.json();

    if (data.success) {
      const select = document.getElementById("select-obat");
      select.innerHTML =
        '<option value="">Pilih Obat</option>' +
        data.data
          .map(
            (obat) =>
              `<option value="${obat.id}" data-nama="${
                obat.nama
              }" data-harga="${obat.harga_jual}" data-stok="${obat.stok}">${
                obat.nama
              } - Stok: ${obat.stok} - Rp ${formatCurrency(
                obat.harga_jual
              )}</option>`
          )
          .join("");

      // Update stok select juga
      const stokSelect = document.getElementById("stok-obat-id");
      if (stokSelect) {
        stokSelect.innerHTML =
          '<option value="">Pilih Obat</option>' +
          data.data
            .map(
              (obat) =>
                `<option value="${obat.id}">${obat.nama} (Stok: ${obat.stok})</option>`
            )
            .join("");
      }
    }
  } catch (error) {
    console.error("Error updating select:", error);
  }
}

// Transaksi
async function addItemToCart() {
  const select = document.getElementById("select-obat");
  const qty = parseInt(document.getElementById("qty-obat").value);

  if (!select.value || !qty || qty < 1) {
    await customAlert("Pilih obat dan masukkan jumlah!", "warning");
    return;
  }

  const option = select.options[select.selectedIndex];
  const obatId = select.value;
  const nama = option.dataset.nama;
  const harga = parseFloat(option.dataset.harga);
  const stok = parseInt(option.dataset.stok);

  if (qty > stok) {
    await customAlert(`Stok tidak mencukupi! Stok tersedia: ${stok}`, "error");
    return;
  }

  // Cek apakah sudah ada di cart
  const existingIndex = cart.findIndex((item) => item.obat_id === obatId);
  if (existingIndex >= 0) {
    const newQty = cart[existingIndex].qty + qty;
    if (newQty > stok) {
      await customAlert(
        `Stok tidak mencukupi! Stok tersedia: ${stok}`,
        "error"
      );
      return;
    }
    cart[existingIndex].qty = newQty;
    cart[existingIndex].subtotal = newQty * harga;
  } else {
    cart.push({
      obat_id: obatId,
      nama: nama,
      qty: qty,
      harga: harga,
      subtotal: qty * harga,
    });
  }

  updateCart();
  document.getElementById("qty-obat").value = "";
}

function updateCart() {
  const cartDiv = document.getElementById("cart-items");
  const totalDiv = document.getElementById("cart-total");

  if (cart.length === 0) {
    cartDiv.innerHTML = "<p>Keranjang kosong</p>";
    totalDiv.innerHTML = "";
    return;
  }

  cartDiv.innerHTML = cart
    .map(
      (item, index) => `
        <div class="cart-item">
            <div>
                <strong>${item.nama}</strong><br>
                ${item.qty} x Rp ${formatCurrency(
        item.harga
      )} = Rp ${formatCurrency(item.subtotal)}
            </div>
            <button class="btn btn-danger" onclick="removeFromCart(${index})">Hapus</button>
        </div>
    `
    )
    .join("");

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const pajak = subtotal * 0.11;
  const total = subtotal + pajak;

  totalDiv.innerHTML = `
    <div style="text-align: right;">
      <div style="margin-bottom: 5px;">Subtotal: Rp ${formatCurrency(
        subtotal
      )}</div>
      <div style="margin-bottom: 5px;">Pajak (11%): Rp ${formatCurrency(
        pajak
      )}</div>
      <div style="font-size: 1.2em; border-top: 2px solid #667eea; padding-top: 5px; margin-top: 10px;">
        <strong>Total: Rp ${formatCurrency(total)}</strong>
      </div>
    </div>
  `;
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCart();
}

async function checkout() {
  if (cart.length === 0) {
    await customAlert("Keranjang kosong!", "warning");
    return;
  }

  const items = cart.map((item) => ({
    obat_id: item.obat_id,
    qty: item.qty,
  }));

  try {
    const res = await fetch(`${API_BASE}/transaksi`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });

    const data = await res.json();
    if (data.success) {
      const trans = data.data;
      await customAlert(
        `Transaksi berhasil!\n\nSubtotal: Rp ${formatCurrency(
          trans.subtotal
        )}\nPajak (11%): Rp ${formatCurrency(
          trans.pajak
        )}\nTotal: Rp ${formatCurrency(trans.total)}`,
        "success"
      );
      cart = [];
      updateCart();
      loadTransaksi();
      updateObatSelect(); // Update stok di select
    } else {
      await customAlert("Error: " + data.message, "error");
    }
  } catch (error) {
    await customAlert("Error: " + error.message, "error");
  }
}

async function loadTransaksi() {
  try {
    const res = await fetch(`${API_BASE}/transaksi`);
    const data = await res.json();

    if (data.success) {
      const listDiv = document.getElementById("transaksi-list");
      listDiv.innerHTML = data.data
        .slice(0, 10)
        .map((trans) => {
          const subtotal = trans.subtotal || trans.total;
          const pajak = trans.pajak || 0;
          const total = trans.total;

          return `
                <div class="transaksi-item">
                    <h4>${trans.no_transaksi}</h4>
                    <div class="date">${formatDate(trans.tanggal)}</div>
                    ${
                      pajak > 0
                        ? `
                      <div>Subtotal: Rp ${formatCurrency(subtotal)}</div>
                      <div>Pajak (11%): Rp ${formatCurrency(pajak)}</div>
                    `
                        : ""
                    }
                    <div>Total: <strong>Rp ${formatCurrency(
                      total
                    )}</strong></div>
                    <div>Items: ${trans.items.length}</div>
                </div>
            `;
        })
        .join("");
    }
  } catch (error) {
    console.error("Error loading transaksi:", error);
  }
}

// Stok Management
async function loadStok() {
  try {
    // Load current stok
    const res = await fetch(`${API_BASE}/stok/current`);
    const data = await res.json();

    if (data.success) {
      const tbody = document.getElementById("tbody-stok");
      tbody.innerHTML = data.data
        .map(
          (stok) => `
                <tr>
                    <td>${stok.nama}</td>
                    <td>${stok.kategori}</td>
                    <td><strong>${stok.stok}</strong> ${stok.satuan}</td>
                    <td>Rp ${formatCurrency(stok.harga_jual)}</td>
                </tr>
            `
        )
        .join("");
    }

    // Load stok history
    const resHistory = await fetch(`${API_BASE}/stok`);
    const dataHistory = await resHistory.json();

    if (dataHistory.success) {
      const tbodyHistory = document.getElementById("tbody-stok-history");
      tbodyHistory.innerHTML = dataHistory.data
        .slice(0, 50)
        .map(
          (item) => `
                <tr>
                    <td>${formatDate(item.tanggal)}</td>
                    <td>${item.obat_nama}</td>
                    <td><span style="color: ${
                      item.jenis === "Masuk" ? "green" : "red"
                    }">${item.jenis}</span></td>
                    <td><strong>${item.perubahan > 0 ? "+" : ""}${
            item.perubahan
          }</strong></td>
                    <td>${item.keterangan}</td>
                </tr>
            `
        )
        .join("");
    }

    updateObatSelect();
  } catch (error) {
    console.error("Error loading stok:", error);
  }
}

async function showUpdateStokForm() {
  if (!currentUser || currentUser.role !== "Admin") {
    await customAlert("Hanya Admin yang dapat update stok!", "error");
    return;
  }
  document.getElementById("update-stok-form").style.display = "block";
  document.getElementById("form-update-stok").reset();
}

async function updateStok(event) {
  event.preventDefault();

  if (!currentUser || currentUser.role !== "Admin") {
    await customAlert("Hanya Admin yang dapat update stok!", "error");
    return;
  }
  const form = event.target;
  const formData = {
    obat_id: document.getElementById("stok-obat-id").value,
    perubahan: document.getElementById("stok-perubahan").value,
    jenis: document.getElementById("stok-jenis").value,
    keterangan: document.getElementById("stok-keterangan").value,
  };

  try {
    const res = await fetch(`${API_BASE}/stok/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await res.json();
    if (data.success) {
      await customAlert("Stok berhasil diupdate!", "success");
      closeForm("update-stok-form");
      loadStok();
    } else {
      await customAlert("Error: " + data.message, "error");
    }
  } catch (error) {
    await customAlert("Error: " + error.message, "error");
  }
}

// Laporan
async function loadLaporanHarian() {
  const tanggal = document.getElementById("filter-tanggal").value;
  if (!tanggal) {
    await customAlert("Pilih tanggal terlebih dahulu!", "warning");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/laporan/harian?tanggal=${tanggal}`);
    const data = await res.json();

    if (data.success) {
      displayLaporan(data.data);
    }
  } catch (error) {
    await customAlert("Error: " + error.message, "error");
  }
}

async function loadLaporanBulanan() {
  const bulan = document.getElementById("filter-bulan").value;
  if (!bulan) {
    await customAlert("Pilih bulan terlebih dahulu!", "warning");
    return;
  }

  const [tahun, bulanAngka] = bulan.split("-");

  try {
    const res = await fetch(
      `${API_BASE}/laporan/bulanan?bulan=${bulanAngka}&tahun=${tahun}`
    );
    const data = await res.json();

    if (data.success) {
      displayLaporan(data.data);
    }
  } catch (error) {
    await customAlert("Error: " + error.message, "error");
  }
}

async function loadObatTerlaris() {
  try {
    const res = await fetch(`${API_BASE}/laporan/terlaris?limit=10`);
    const data = await res.json();

    if (data.success) {
      const content = `
                <h3>10 Obat Terlaris</h3>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Nama Obat</th>
                                <th>Qty Terjual</th>
                                <th>Total Penjualan</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.data
                              .map(
                                (obat, index) => `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${obat.nama}</td>
                                    <td>${obat.qty}</td>
                                    <td>Rp ${formatCurrency(obat.total)}</td>
                                </tr>
                            `
                              )
                              .join("")}
                        </tbody>
                    </table>
                </div>
            `;
      document.getElementById("laporan-content").innerHTML = content;
    }
  } catch (error) {
    await customAlert("Error: " + error.message, "error");
  }
}

function displayLaporan(data) {
  const content = `
        <div class="alert alert-success">
            <h3>Laporan Periode: ${data.periode || data.tanggal}</h3>
            <p>Total Transaksi: <strong>${data.total_transaksi}</strong></p>
            <p>Total Penjualan: <strong>Rp ${formatCurrency(
              data.total_penjualan
            )}</strong></p>
        </div>
        ${
          data.obat_terjual
            ? `
            <h3>Detail Obat Terjual</h3>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Nama Obat</th>
                            <th>Qty</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.obat_terjual
                          .map(
                            (obat) => `
                            <tr>
                                <td>${obat.nama}</td>
                                <td>${obat.qty}</td>
                                <td>Rp ${formatCurrency(obat.total)}</td>
                            </tr>
                        `
                          )
                          .join("")}
                    </tbody>
                </table>
            </div>
        `
            : ""
        }
    `;
  document.getElementById("laporan-content").innerHTML = content;
}

// Helper functions
function formatCurrency(amount) {
  return new Intl.NumberFormat("id-ID").format(amount);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Load initial data
document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  if (!checkAuth()) {
    showLoginScreen();
  } else {
    setupTabNavigation();
    loadDashboard();
    updateObatSelect();
  }
});
