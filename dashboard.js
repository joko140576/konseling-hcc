/* ===========================
   HCC DASHBOARD — dashboard.js (FINAL)
   =========================== */

const TOPIC_META = {
  fakta:    { icon: "🔍", label: "Fakta & Temuan" },
  inovasi:  { icon: "💡", label: "Ide / Inovasi / Masukan" },
  keluhan:  { icon: "💬", label: "Keluhan / Curhat" },
  kritikan: { icon: "📌", label: "Kritikan" },
  sop:      { icon: "📋", label: "SOP, Peraturan & Compliance" },
  lainlain: { icon: "📎", label: "Lain-lain" },
};

const KESIMPULAN_COLORS = {
  "Sangat Baik":          { cls: "badge-sb",  bar: "green",  emoji: "⭐⭐⭐⭐⭐" },
  "Baik":                 { cls: "badge-b",   bar: "blue",   emoji: "⭐⭐⭐⭐" },
  "Cukup":                { cls: "badge-c",   bar: "navy",   emoji: "⭐⭐⭐" },
  "Perlu Perbaikan":      { cls: "badge-pp",  bar: "orange", emoji: "⭐⭐" },
  "Sangat Perlu Perbaikan":{ cls: "badge-spp",bar: "red",    emoji: "⭐" },
};

// 🔥 PASTIKAN INI SUDAH DIISI URL WEB APP GAS
const GAS_URL = "https://script.google.com/macros/s/AKfycbyIsYNbByqKVtamAs3P-TWxaS42yjICnq3dWLI-z9thzcJ3EiNBLCquTiwtNJxjn32R/exec";

let allData = [];
let filteredData = [];
let sortField = "tanggalJam";
let sortAsc = false;

// ─── LOAD DATA ────────────────────────────────────────────
async function loadData() {
  showState("loading");
  const btn = document.getElementById("btn-refresh");
  btn?.classList.add("spinning");

  try {
    const res = await fetch(`${GAS_URL}?action=getData`, {
      method: "GET",
      cache: "no-store"
    });

    if (!res.ok) throw new Error("Response server gagal");

    const json = await res.json();

    if (!json || json.status !== "success") {
      throw new Error(json?.message || "Format response tidak valid");
    }

    // ✅ Ambil data asli dari Spreadsheet
    allData = Array.isArray(json.data) ? json.data : [];

    if (allData.length === 0) {
      showState("empty");
      return;
    }

    applyFilters();
    renderStats();
    renderCharts();
    showState("table");

  } catch (err) {
    document.getElementById("db-error-msg").textContent =
      "Gagal memuat data: " + err.message;
    showState("error");
    console.error("LOAD DATA ERROR:", err);
  } finally {
    btn?.classList.remove("spinning");
  }
}

// ─── SHOW STATE ───────────────────────────────────────────
function showState(state) {
  document.getElementById("db-loading").style.display   = state === "loading" ? "block" : "none";
  document.getElementById("db-empty").style.display     = state === "empty"   ? "block" : "none";
  document.getElementById("db-error").style.display     = state === "error"   ? "block" : "none";
  document.getElementById("db-table-wrap").style.display= state === "table"   ? "block" : "none";
}

// ─── STATS ────────────────────────────────────────────────
function renderStats() {
  const total = allData.length;
  const sb    = allData.filter(d => d.kesimpulan === "Sangat Baik").length;
  const b     = allData.filter(d => d.kesimpulan === "Baik").length;
  const perlu = allData.filter(d =>
    d.kesimpulan === "Perlu Perbaikan" || d.kesimpulan === "Sangat Perlu Perbaikan"
  ).length;
  const regions = new Set(allData.map(d => d.region).filter(Boolean)).size;

  animateNum("stat-total", total);
  animateNum("stat-sangat-baik", sb);
  animateNum("stat-baik", b);
  animateNum("stat-perlu", perlu);
  animateNum("stat-region", regions);
}

function animateNum(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let cur = 0;
  const step = Math.ceil(target / 20);
  const iv = setInterval(() => {
    cur = Math.min(cur + step, target);
    el.textContent = cur;
    if (cur >= target) clearInterval(iv);
  }, 40);
}

// ─── CHARTS ───────────────────────────────────────────────
function renderCharts() {
  const kOrder = ["Sangat Baik","Baik","Cukup","Perlu Perbaikan","Sangat Perlu Perbaikan"];
  const kCount = {};
  allData.forEach(d => { kCount[d.kesimpulan] = (kCount[d.kesimpulan] || 0) + 1; });
  const kMax = Math.max(...Object.values(kCount), 1);

  const kChart = document.getElementById("chart-kesimpulan");
  kChart.innerHTML = kOrder.map(k => {
    const val = kCount[k] || 0;
    const meta = KESIMPULAN_COLORS[k] || { bar: "navy" };
    const pct = Math.round((val / kMax) * 100);
    return `<div class="bar-row">
      <div class="bar-label">${k}</div>
      <div class="bar-track"><div class="bar-fill ${meta.bar}" style="width:${pct}%"></div></div>
      <div class="bar-val">${val}</div>
    </div>`;
  }).join("");
}

// ─── FILTERS ──────────────────────────────────────────────
function applyFilters() {
  const search  = (document.getElementById("filter-search")?.value || "").toLowerCase();
  const region  = document.getElementById("filter-region")?.value || "";
  const kesimp  = document.getElementById("filter-kesimpulan")?.value || "";

  filteredData = allData.filter(d => {
    const matchSearch = !search ||
      (d.namaPemimpin || "").toLowerCase().includes(search) ||
      (d.namaCOU || "").toLowerCase().includes(search) ||
      (d.konselor || "").toLowerCase().includes(search);

    const matchRegion  = !region  || `Region ${d.region}` === region;
    const matchKesimp  = !kesimp  || d.kesimpulan === kesimp;

    return matchSearch && matchRegion && matchKesimp;
  });

  renderTable();
}

// ─── TABLE ────────────────────────────────────────────────
function renderTable() {
  const tbody = document.getElementById("db-tbody");

  if (!filteredData.length) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center">Tidak ada data</td></tr>`;
    return;
  }

  tbody.innerHTML = filteredData.map((d, i) => {
    const tgl  = d.tanggalJam ? formatDate(d.tanggalJam) : "—";
    return `<tr>
      <td>${i + 1}</td>
      <td>${tgl}</td>
      <td>${d.namaPemimpin || "-"}</td>
      <td>${d.namaCOU || "-"}</td>
      <td>${d.region || "-"}</td>
      <td>${d.kesimpulan || "-"}</td>
    </tr>`;
  }).join("");
}

// ─── FORMAT DATE ──────────────────────────────────────────
function formatDate(str) {
  try {
    const d = new Date(str);
    return d.toLocaleDateString("id-ID", {
      day:"2-digit", month:"short", year:"numeric",
      hour:"2-digit", minute:"2-digit"
    });
  } catch {
    return str;
  }
}

// ─── INIT ─────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  loadData();
});
