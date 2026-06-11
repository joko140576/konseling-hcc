/* ===========================
   HCC KONSELING — APP.JS
   (Evidence foto dikirim bersama data utama dalam satu request JSON)
   =========================== */

// ─── TOPIC CONFIG ────────────────────────────────────────────
const TOPICS = {
  fakta:    { icon: "🔍", label: "Fakta & Temuan" },
  inovasi:  { icon: "💡", label: "Ide / Inovasi / Masukan" },
  keluhan:  { icon: "💬", label: "Keluhan / Curhat" },
  kritikan: { icon: "📌", label: "Kritikan" },
  sop:      { icon: "📋", label: "SOP, Peraturan & Compliance" },
  lainlain: { icon: "📎", label: "Lain-lain" },
};

let activeTopics  = new Set();
let evidenceFiles = []; // [{ file, dataUrl, name, mimeType }]

const MAX_EVIDENCE = 5;
const MAX_SIZE_MB  = 5;

// ─── STEP NAVIGATION ─────────────────────────────────────────
const SECTION_MAP = {
  1: "section-2",
  2: "section-3",
  3: "section-4",
  4: "section-evidence",
  5: "section-5",
};

function goToStep(step) {
  const allIds = [...Object.values(SECTION_MAP), "section-success"];
  allIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("active");
  });

  const steps = document.querySelectorAll(".step");
  steps.forEach((s, i) => {
    s.classList.remove("active", "done");
    if (i < step - 1)      s.classList.add("done");
    else if (i === step - 1) s.classList.add("active");
  });

  const target = SECTION_MAP[step];
  if (target) document.getElementById(target).classList.add("active");
  window.scrollTo({ top: document.getElementById("form-section").offsetTop - 20, behavior: "smooth" });
}

// ─── KESIMPULAN SELECTION ────────────────────────────────────
document.querySelectorAll(".kesimpulan-card").forEach(card => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".kesimpulan-card").forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");
  });
});

// ─── KONSELOR MANAGEMENT ─────────────────────────────────────
function addKonselor() {
  const list = document.getElementById("konselor-list");
  const row  = document.createElement("div");
  row.className = "konselor-row";
  row.innerHTML = `
    <input type="text" class="konselor-input" placeholder="Nama Konselor..."/>
    <button class="btn-remove-konselor" onclick="removeKonselor(this)">✕</button>
  `;
  list.appendChild(row);
  updateRemoveButtons();
}

function removeKonselor(btn) {
  if (document.querySelectorAll(".konselor-row").length > 1) {
    btn.closest(".konselor-row").remove();
  }
  updateRemoveButtons();
}

function updateRemoveButtons() {
  const rows = document.querySelectorAll(".konselor-row");
  rows.forEach(row => {
    row.querySelector(".btn-remove-konselor").style.display = rows.length > 1 ? "flex" : "none";
  });
}

// ─── TOPIC TOGGLE ────────────────────────────────────────────
function toggleTopic(key) {
  const btn       = document.getElementById(`btn-${key}`);
  const container = document.getElementById("topics-container");

  if (activeTopics.has(key)) {
    activeTopics.delete(key);
    btn.classList.remove("active");
    const panel = document.getElementById(`panel-${key}`);
    if (panel) { panel.style.opacity = "0"; setTimeout(() => panel.remove(), 200); }
  } else {
    activeTopics.add(key);
    btn.classList.add("active");
    createTopicPanel(key, container);
  }
}

function createTopicPanel(key, container) {
  const t = TOPICS[key];
  const panel = document.createElement("div");
  panel.className = "topic-panel";
  panel.id = `panel-${key}`;
  panel.innerHTML = `
    <div class="topic-panel-header"><span class="icon">${t.icon}</span><h3>${t.label}</h3></div>
    <div class="narasi-block">
      <div class="narasi-label cou">📣 Narasi dari COU</div>
      <textarea id="cou-${key}" rows="4" placeholder="Tuliskan apa yang disampaikan COU..."></textarea>
    </div>
    <div class="narasi-block">
      <div class="narasi-label konselor">💼 Respon Konselor HCC</div>
      <textarea id="konselor-${key}" rows="4" placeholder="Tuliskan respon konselor HCC..."></textarea>
    </div>
  `;
  container.appendChild(panel);
}

// ─── EVIDENCE UPLOAD ─────────────────────────────────────────
function handleEvidenceFiles(fileList) {
  const files     = Array.from(fileList);
  const remaining = MAX_EVIDENCE - evidenceFiles.length;

  if (remaining <= 0) {
    showToast(`⚠️ Maksimal ${MAX_EVIDENCE} foto evidence.`, "error");
    return;
  }

  const toAdd   = files.slice(0, remaining);
  const skipped = files.length - toAdd.length;
  let   loaded  = 0;

  toAdd.forEach(file => {
    if (!file.type.startsWith("image/")) {
      showToast(`⚠️ ${file.name} bukan file gambar.`, "error");
      loaded++; if (loaded === toAdd.length) renderEvidencePreviews();
      return;
    }
    if (file.size / 1024 / 1024 > MAX_SIZE_MB) {
      showToast(`⚠️ ${file.name} melebihi ${MAX_SIZE_MB} MB.`, "error");
      loaded++; if (loaded === toAdd.length) renderEvidencePreviews();
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      evidenceFiles.push({
        file,
        dataUrl:  e.target.result,
        name:     file.name,
        mimeType: file.type,
      });
      loaded++;
      if (loaded === toAdd.length) renderEvidencePreviews();
    };
    reader.readAsDataURL(file);
  });

  if (skipped > 0) showToast(`⚠️ ${skipped} foto dilewati (batas ${MAX_EVIDENCE} foto).`, "error");
  document.getElementById("evidence-input").value = "";
}

function removeEvidence(i) {
  evidenceFiles.splice(i, 1);
  renderEvidencePreviews();
}

function renderEvidencePreviews() {
  const grid = document.getElementById("evidence-preview-grid");
  grid.innerHTML = "";

  evidenceFiles.forEach((item, i) => {
    const card = document.createElement("div");
    card.className = "evidence-thumb";
    card.innerHTML = `
      <img src="${item.dataUrl}" alt="${item.name}" />
      <div class="evidence-thumb-name">${item.name}</div>
      <button class="evidence-thumb-remove" onclick="removeEvidence(${i})" title="Hapus">✕</button>
    `;
    grid.appendChild(card);
  });

  document.getElementById("evidence-drop-zone").style.display =
    evidenceFiles.length >= MAX_EVIDENCE ? "none" : "block";

  const status = document.getElementById("evidence-status");
  status.innerHTML = evidenceFiles.length > 0
    ? `<span class="evidence-count-badge">📸 ${evidenceFiles.length}/${MAX_EVIDENCE} foto dipilih</span>`
    : "";
}

// ─── COLLECT FORM DATA ───────────────────────────────────────
function collectFormData() {
  const hasilKonseling = {};
  activeTopics.forEach(key => {
    hasilKonseling[key] = {
      label:           TOPICS[key].label,
      narasi_cou:      document.getElementById(`cou-${key}`)?.value      || "",
      respon_konselor: document.getElementById(`konselor-${key}`)?.value || "",
    };
  });

  // Build evidence array: strip "data:image/...;base64," prefix
  const evidenceData = evidenceFiles.map(item => ({
    name:     item.name,
    mimeType: item.mimeType,
    data:     item.dataUrl.split(",")[1],
  }));

  return {
    hari:               document.getElementById("hari").value,
    tanggalJam:         document.getElementById("tanggalJam").value,
    namaPemimpin:       document.getElementById("namaPemimpin").value,
    namaCOU:            document.getElementById("namaCOU").value,
    region:             document.getElementById("region").value,
    konselor:           Array.from(document.querySelectorAll(".konselor-input"))
                          .map(i => i.value).filter(v => v.trim()).join(", "),
    hasilKonseling,
    arahanTindakLanjut: document.getElementById("arahanTindakLanjut").value,
    kesimpulan:         document.querySelector('input[name="kesimpulan"]:checked')?.value || "",
    evidenceFiles:      evidenceData,
    timestamp:          new Date().toLocaleString("id-ID"),
  };
}

// ─── VALIDATION ──────────────────────────────────────────────
function validateStep(step) {
  if (step === 1) {
    const v = ["hari","tanggalJam","namaPemimpin","namaCOU","region"].map(id =>
      document.getElementById(id).value.trim()
    );
    const konselor = document.querySelector(".konselor-input").value.trim();
    if (v.some(x => !x) || !konselor) {
      showToast("⚠️ Harap lengkapi semua field pada Informasi Sesi.", "error");
      return false;
    }
  }
  if (step === 5) {
    if (!document.querySelector('input[name="kesimpulan"]:checked')) {
      showToast("⚠️ Harap pilih kesimpulan konseling.", "error");
      return false;
    }
  }
  return true;
}

const _goToStep = goToStep;
window.goToStep = function(step) {
  if (step === 2 && !validateStep(1)) return;
  if (step === 5 && !validateStep(4)) return;
  _goToStep(step);
};

// ─── SUBMIT ──────────────────────────────────────────────────
async function submitForm() {
  if (!validateStep(5)) return;

  const data      = collectFormData();
  const submitBtn = document.getElementById("btn-submit");
  document.getElementById("submit-text").style.display    = "none";
  document.getElementById("submit-loading").style.display = "inline";
  submitBtn.disabled = true;

  // Demo mode
  if (GAS_URL === "https://script.google.com/macros/s/AKfycbz5DlFI6lmLTl8wCUGb_O0Jy2sfYzxWnWHqtYQPJ6DR90iLbYGaO-JZjA3dUz2iXoxA/exec") {
    setTimeout(() => {
      showSuccessScreen(data, []);
      showToast("Mode Demo — Backend belum dikonfigurasi.", "info");
    }, 800);
    return;
  }

  try {
    if (evidenceFiles.length > 0) {
      showToast("📤 Mengunggah foto & menyimpan data...", "info");
    }

    // Kirim SEMUA data (termasuk foto base64) dalam satu POST JSON
    // GAS akan upload foto ke Drive lalu simpan ke Spreadsheet sekaligus.
    // Catatan: GAS Web App selalu redirect ke URL baru saat POST,
    // kita perlu follow redirect dengan fetch biasa (bukan no-cors).
    const resp = await fetch(GAS_URL, {
      method:   "POST",
      redirect: "follow",
      headers:  { "Content-Type": "text/plain" }, // text/plain menghindari CORS preflight
      body:     JSON.stringify(data),
    });

    const result = await resp.json();

    if (result.status === "success") {
      showSuccessScreen(data, result.evidenceLinks || []);
      updateTotalSessions();
    } else {
      throw new Error(result.message || "Gagal menyimpan.");
    }

  } catch (err) {
    showToast("Gagal menyimpan: " + err.message, "error");
    document.getElementById("submit-text").style.display    = "inline";
    document.getElementById("submit-loading").style.display = "none";
    submitBtn.disabled = false;
  }
}

// ─── SUCCESS SCREEN ──────────────────────────────────────────
function showSuccessScreen(data, driveLinks) {
  document.querySelectorAll(".form-section").forEach(s => s.classList.remove("active"));
  document.getElementById("section-success").classList.add("active");
  document.querySelectorAll(".step").forEach(s => s.classList.add("done"));

  const topicList = [...activeTopics].map(k => TOPICS[k].label).join(", ") || "—";

  let evidenceSummary = "";
  if (driveLinks && driveLinks.length > 0) {
    const items = driveLinks.map((l, i) =>
      `<a href="${l}" target="_blank" style="color:#c9a84c">📎 Foto ${i+1}</a>`
    ).join("  ");
    evidenceSummary = `<strong>Evidence Foto (${driveLinks.length}):</strong><br/>${items}<br/>`;
  } else if (evidenceFiles.length > 0) {
    evidenceSummary = `<strong>Evidence Foto:</strong> ${evidenceFiles.length} foto diunggah<br/>`;
  }

  document.getElementById("success-summary").innerHTML = `
    <strong>Hari & Waktu:</strong> ${data.hari}, ${data.tanggalJam}<br/>
    <strong>Pemimpin:</strong> ${data.namaPemimpin}<br/>
    <strong>COU:</strong> ${data.namaCOU}<br/>
    <strong>Region:</strong> ${data.region}<br/>
    <strong>Konselor:</strong> ${data.konselor}<br/>
    <strong>Topik Dibahas:</strong> ${topicList}<br/>
    <strong>Kesimpulan:</strong> ${data.kesimpulan}<br/>
    ${evidenceSummary}
  `;

  window.scrollTo({ top: document.getElementById("form-section").offsetTop - 20, behavior: "smooth" });
}

// ─── RESET FORM ──────────────────────────────────────────────
function resetForm() {
  ["hari","tanggalJam","namaPemimpin","namaCOU","region","arahanTindakLanjut"]
    .forEach(id => { document.getElementById(id).value = ""; });

  document.getElementById("konselor-list").innerHTML = `
    <div class="konselor-row">
      <input type="text" class="konselor-input" placeholder="Nama Konselor 1..."/>
      <button class="btn-remove-konselor" onclick="removeKonselor(this)" style="display:none">✕</button>
    </div>`;

  document.getElementById("topics-container").innerHTML = "";
  activeTopics.clear();
  Object.keys(TOPICS).forEach(k => document.getElementById(`btn-${k}`)?.classList.remove("active"));

  document.querySelectorAll('input[name="kesimpulan"]').forEach(r => r.checked = false);
  document.querySelectorAll(".kesimpulan-card").forEach(c => c.classList.remove("selected"));

  // Reset evidence
  evidenceFiles = [];
  document.getElementById("evidence-preview-grid").innerHTML = "";
  document.getElementById("evidence-status").innerHTML = "";
  document.getElementById("evidence-drop-zone").style.display = "block";

  document.getElementById("submit-text").style.display    = "inline";
  document.getElementById("submit-loading").style.display = "none";
  document.getElementById("btn-submit").disabled = false;

  goToStep(1);
}

// ─── TOAST ───────────────────────────────────────────────────
function showToast(msg, type = "info") {
  const old = document.getElementById("toast");
  if (old) old.remove();
  const t = document.createElement("div");
  t.id = "toast";
  t.textContent = msg;
  t.style.cssText = `
    position:fixed;bottom:28px;left:50%;transform:translateX(-50%);
    background:${type==="error"?"#c0392b":type==="info"?"#2980b9":"#2d7a4f"};
    color:#fff;padding:14px 28px;border-radius:100px;
    font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;
    box-shadow:0 8px 24px rgba(0,0,0,.2);z-index:9999;animation:fadeUp .3s ease;
  `;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

// ─── TOTAL SESSIONS ──────────────────────────────────────────
async function updateTotalSessions() {
  if (GAS_URL === "https://script.google.com/macros/s/AKfycbz5DlFI6lmLTl8wCUGb_O0Jy2sfYzxWnWHqtYQPJ6DR90iLbYGaO-JZjA3dUz2iXoxA/exec") return;
  try {
    const r = await fetch(GAS_URL + "?action=count");
    const d = await r.json();
    if (d.count !== undefined) document.getElementById("total-sessions").textContent = d.count;
  } catch {}
}

// ─── INIT ────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  updateRemoveButtons();
  updateTotalSessions();

  // Set datetime sekarang
  const now   = new Date();
  const local = new Date(now - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  document.getElementById("tanggalJam").value = local;
  const days = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
  document.getElementById("hari").value = days[now.getDay()];

  // Drag & drop zone
  const dropZone = document.getElementById("evidence-drop-zone");
  if (dropZone) {
    dropZone.addEventListener("dragover",  e => { e.preventDefault(); dropZone.classList.add("drag-over"); });
    dropZone.addEventListener("dragleave", ()  => dropZone.classList.remove("drag-over"));
    dropZone.addEventListener("drop", e => {
      e.preventDefault();
      dropZone.classList.remove("drag-over");
      handleEvidenceFiles(e.dataTransfer.files);
    });
    // Klik area untuk buka file picker (kecuali label/tombol di dalam)
    dropZone.addEventListener("click", e => {
      const exclude = ["evidence-input","btn-upload-trigger"];
      if (!exclude.some(cls => e.target.id === cls || e.target.classList.contains(cls))) {
        document.getElementById("evidence-input").click();
      }
    });
  }
});
