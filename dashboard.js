/* ===========================
   HCC DASHBOARD — FINAL
   =========================== */

const GAS_URL = window.GAS_URL;

let allData = [];

// ─── LOAD DATA ────────────────────────────────────────────
async function loadData() {
  if (!GAS_URL) {
    alert("GAS_URL belum ada!");
    return;
  }

  try {
    const res = await fetch(`${GAS_URL}?action=getData`);
    const json = await res.json();

    if (json.status !== "success") {
      throw new Error("Gagal ambil data");
    }

    allData = json.data || [];
    renderTable();

  } catch (err) {
    console.error(err);
    alert("Error load data");
  }
}

// ─── RENDER TABLE ─────────────────────────────────────────
function renderTable() {
  const tbody = document.getElementById("db-tbody");
  if (!tbody) return;

  if (!allData.length) {
    tbody.innerHTML = `<tr><td colspan="6">Tidak ada data</td></tr>`;
    return;
  }

  tbody.innerHTML = allData.map((d, i) => `
    <tr>
      <td>${i+1}</td>
      <td>${d.namaPemimpin || "-"}</td>
      <td>${d.namaCOU || "-"}</td>
      <td>${d.region || "-"}</td>
      <td>${d.kesimpulan || "-"}</td>
      <td>${d.tanggalJam || "-"}</td>
    </tr>
  `).join("");
}

// ─── INIT ─────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", loadData);
