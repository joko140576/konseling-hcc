/* ===========================
   HCC DASHBOARD — dashboard.js
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

let allData = [];
let filteredData = [];
let sortField = "tanggalJam";
let sortAsc = false;

// ─── LOAD DATA ────────────────────────────────────────────
async function loadData() {
  showState("loading");
  const btn = document.getElementById("btn-refresh");
  btn.classList.add("spinning");

  try {
    if (GAS_URL === "https://script.google.com/macros/s/AKfycbyIsYNbByqKVtamAs3P-TWxaS42yjICnq3dWLI-z9thzcJ3EiNBLCquTiwtNJxjn32R/exec") {
      // Demo data
      allData = generateDemoData();
    } else {
      const res = await fetch(`${GAS_URL}?action=getData`, { method: "GET" });
      const json = await res.json();
      if (json.status !== "success") throw new Error(json.message || "Gagal memuat.");
      allData = json.data || [];
    }

    if (allData.length === 0) {
      showState("empty");
    } else {
      applyFilters();
      renderStats();
      renderCharts();
      showState("table");
    }
  } catch (err) {
    document.getElementById("db-error-msg").textContent =
      "Gagal memuat data: " + err.message + ". Pastikan GAS_URL sudah dikonfigurasi dan di-deploy ulang.";
    showState("error");
  } finally {
    btn.classList.remove("spinning");
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
  // Kesimpulan distribution
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

  // Region distribution
  const rCount = {};
  allData.forEach(d => {
    const r = d.region ? `Region ${d.region}` : "Lainnya";
    rCount[r] = (rCount[r] || 0) + 1;
  });
  const rSorted = Object.entries(rCount).sort((a,b) => {
    const na = parseInt(a[0].replace(/\D/g,"")) || 99;
    const nb = parseInt(b[0].replace(/\D/g,"")) || 99;
    return na - nb;
  });
  const rMax = Math.max(...rSorted.map(r => r[1]), 1);
  const barColors = ["gold","blue","green","orange","navy","red","gold","blue","green","orange"];

  const rChart = document.getElementById("chart-region");
  rChart.innerHTML = rSorted.map(([label, val], i) => {
    const pct = Math.round((val / rMax) * 100);
    return `<div class="bar-row">
      <div class="bar-label short">${label}</div>
      <div class="bar-track"><div class="bar-fill ${barColors[i % barColors.length]}" style="width:${pct}%"></div></div>
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

  // Sort
  filteredData.sort((a, b) => {
    let va = a[sortField] || "", vb = b[sortField] || "";
    if (sortField === "region") { va = parseInt(va) || 0; vb = parseInt(vb) || 0; }
    if (sortField === "tanggalJam") { va = new Date(va); vb = new Date(vb); }
    return sortAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
  });

  document.getElementById("filter-count").textContent =
    filteredData.length < allData.length
      ? `Menampilkan ${filteredData.length} dari ${allData.length} data`
      : `${allData.length} total data`;

  renderTable();
}

function sortBy(field) {
  if (sortField === field) sortAsc = !sortAsc;
  else { sortField = field; sortAsc = true; }
  applyFilters();
}

// ─── TABLE ────────────────────────────────────────────────
function renderTable() {
  const tbody = document.getElementById("db-tbody");
  if (filteredData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-light)">Tidak ada data yang cocok dengan filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = filteredData.map((d, i) => {
    const meta = KESIMPULAN_COLORS[d.kesimpulan] || { cls: "", emoji: "" };
    const tgl  = d.tanggalJam ? formatDate(d.tanggalJam) : "—";
    return `<tr>
      <td style="color:var(--text-light);font-size:12px">${i + 1}</td>
      <td>${tgl}</td>
      <td>${d.hari || "—"}</td>
      <td><strong>${d.namaPemimpin || "—"}</strong></td>
      <td>${d.namaCOU || "—"}</td>
      <td><span class="region-tag">${d.region ? "Region " + d.region : "—"}</span></td>
      <td style="font-size:12px">${d.konselor || "—"}</td>
      <td><span class="badge-kesimpulan ${meta.cls}">${meta.emoji} ${d.kesimpulan || "—"}</span></td>
      <td><button class="btn-detail" onclick="openModal(${i})">Lihat Detail</button></td>
    </tr>`;
  }).join("");
}

function formatDate(str) {
  if (!str) return "—";
  try {
    const d = new Date(str);
    return d.toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
  } catch { return str; }
}

// ─── MODAL ────────────────────────────────────────────────
function openModal(idx) {
  const d = filteredData[idx];
  if (!d) return;

  document.getElementById("modal-title").textContent = d.namaPemimpin || "Detail Sesi";

  const metaK = KESIMPULAN_COLORS[d.kesimpulan] || { cls: "badge-b", emoji: "" };

  let topicsHTML = "";
  Object.entries(TOPIC_META).forEach(([key, meta]) => {
    const t = d.hasilKonseling?.[key];
    if (!t || (!t.narasi_cou && !t.respon_konselor)) return;
    topicsHTML += `
      <div class="modal-topic">
        <div class="modal-topic-header">
          <span class="icon">${meta.icon}</span>
          <h4>${meta.label}</h4>
        </div>
        <div class="modal-topic-body">
          <div class="modal-narasi">
            <div class="modal-narasi-label cou">Narasi COU</div>
            ${t.narasi_cou
              ? `<div class="modal-narasi-text">${escHtml(t.narasi_cou)}</div>`
              : `<div class="modal-narasi-empty">Tidak ada narasi</div>`}
          </div>
          <div class="modal-narasi">
            <div class="modal-narasi-label konselor">Respon Konselor HCC</div>
            ${t.respon_konselor
              ? `<div class="modal-narasi-text">${escHtml(t.respon_konselor)}</div>`
              : `<div class="modal-narasi-empty">Tidak ada respon</div>`}
          </div>
        </div>
      </div>`;
  });

  document.getElementById("modal-body").innerHTML = `
    <div class="modal-info-grid">
      <div class="modal-info-item"><div class="modal-info-label">Hari & Tanggal</div><div class="modal-info-value">${d.hari || "—"}, ${formatDate(d.tanggalJam)}</div></div>
      <div class="modal-info-item"><div class="modal-info-label">Nama COU</div><div class="modal-info-value">${d.namaCOU || "—"}</div></div>
      <div class="modal-info-item"><div class="modal-info-label">Region</div><div class="modal-info-value">${d.region ? "Region " + d.region : "—"}</div></div>
      <div class="modal-info-item"><div class="modal-info-label">Konselor HCC</div><div class="modal-info-value">${d.konselor || "—"}</div></div>
      <div class="modal-info-item"><div class="modal-info-label">Timestamp Simpan</div><div class="modal-info-value">${d.timestamp || "—"}</div></div>
      <div class="modal-info-item">
        <div class="modal-info-label">Kesimpulan</div>
        <div><span class="badge-kesimpulan ${metaK.cls}">${metaK.emoji} ${d.kesimpulan || "—"}</span></div>
      </div>
    </div>

    ${topicsHTML || `<p style="color:var(--text-light);font-size:13px;margin-bottom:20px">Tidak ada topik yang dibahas.</p>`}

    ${d.arahanTindakLanjut ? `
    <div class="modal-arahan">
      <div class="modal-arahan-label">📌 Arahan & Tindak Lanjut</div>
      <div class="modal-arahan-text">${escHtml(d.arahanTindakLanjut)}</div>
    </div>` : ""}
  `;

  document.getElementById("modal-overlay").classList.add("open");
  document.getElementById("modal").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  document.getElementById("modal-overlay").classList.remove("open");
  document.getElementById("modal").classList.remove("open");
  document.body.style.overflow = "";
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/\n/g,"<br/>");
}

// ─── EXPORT CSV ───────────────────────────────────────────
function exportCSV() {
  if (!allData.length) { alert("Tidak ada data untuk diekspor."); return; }

  const headers = ["No","Timestamp","Hari","Tanggal & Jam","Nama Pemimpin","Nama COU","Region","Konselor","Arahan & Tindak Lanjut","Kesimpulan"];
  const rows = allData.map((d, i) => [
    i + 1,
    d.timestamp || "",
    d.hari || "",
    d.tanggalJam || "",
    d.namaPemimpin || "",
    d.namaCOU || "",
    d.region ? "Region " + d.region : "",
    d.konselor || "",
    (d.arahanTindakLanjut || "").replace(/\n/g," "),
    d.kesimpulan || "",
  ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(","));

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `HCC_Konseling_${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

// ─── DEMO DATA ────────────────────────────────────────────
function generateDemoData() {
  const pemimpins = ["Budi Santoso","Dewi Rahayu","Agus Purnomo","Siti Aminah","Rendra Wijaya","Lestari Indah"];
  const cous      = ["Hendra K.","Mega Putri","Fajar Nugroho","Ratih Sari"];
  const konselors = ["Dr. Anita","Pak Suharto","Bu Citra"];
  const kesSamples = ["Sangat Baik","Baik","Baik","Cukup","Perlu Perbaikan","Sangat Perlu Perbaikan"];
  const haris = ["Senin","Selasa","Rabu","Kamis","Jumat"];

  return Array.from({ length: 14 }, (_, i) => {
    const topicKeys = ["fakta","inovasi","keluhan","kritikan","sop","lainlain"];
    const usedTopics = topicKeys.filter(() => Math.random() > 0.5);
    const hasilKonseling = {};
    usedTopics.forEach(k => {
      hasilKonseling[k] = {
        narasi_cou: `Narasi dari COU mengenai ${TOPIC_META[k].label} pada sesi ini.`,
        respon_konselor: `Respon konselor terkait ${TOPIC_META[k].label}.`,
      };
    });
    const d = new Date(2025, 4 + Math.floor(i/5), (i % 20) + 1, 9 + (i % 5));
    return {
      timestamp: d.toLocaleString("id-ID"),
      hari: haris[i % haris.length],
      tanggalJam: d.toISOString().slice(0,16),
      namaPemimpin: pemimpins[i % pemimpins.length],
      namaCOU: cous[i % cous.length],
      region: String((i % 10) + 1),
      konselor: konselors[i % konselors.length],
      arahanTindakLanjut: i % 3 === 0 ? "Pemimpin diminta untuk meningkatkan koordinasi dengan tim dan melaporkan perkembangan dalam 2 minggu." : "",
      kesimpulan: kesSamples[i % kesSamples.length],
      hasilKonseling,
    };
  });
}

// ─── INIT ─────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  loadData();
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
});
