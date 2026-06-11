/* ===========================
   HCC KONSELING — APP.JS
   (dengan fitur upload foto Evidence ke Google Drive)
   =========================== */

// ─── TOPIC CONFIG ─────────────────────────────────────────
const TOPICS = {
  fakta:    { icon: "🔍", label: "Fakta & Temuan" },
  inovasi:  { icon: "💡", label: "Ide / Inovasi / Masukan" },
  keluhan:  { icon: "💬", label: "Keluhan / Curhat" },
  kritikan: { icon: "📌", label: "Kritikan" },
  sop:      { icon: "📋", label: "SOP, Peraturan & Compliance" },
  lainlain: { icon: "📎", label: "Lain-lain" },
};

let activeTopics = new Set();

// ─── EVIDENCE FILES ───────────────────────────────────────
let evidenceFiles = []; // Array of { file, dataUrl, name }
const MAX_EVIDENCE = 5;
const MAX_SIZE_MB  = 5;

// ─── STEP NAVIGATION ──────────────────────────────────────
// Sections: step1=section-2, step2=section-3, step3=section-4, step4=section-evidence, step5=section-5
const SECTION_MAP = {
  1: "section-2",
  2: "section-3",
  3: "section-4",
  4: "section-evidence",
  5: "section-5",
};

function goToStep(step) {
  const allSections = Object.values(SECTION_MAP);
  allSections.push("section-success");
  allSections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("active");
  });

  const steps = document.querySelectorAll(".step");
  steps.forEach((s, i) => {
    s.classList.remove("active", "done");
    if (i < step - 1) s.classList.add("done");
    else if (i === step - 1) s.classList.add("active");
  });

  const targetId = SECTION_MAP[step];
  if (targetId) document.getElementById(targetId).classList.add("active");

  window.scrollTo({ top: document.getElementById("form-section").offsetTop - 20, behavior: "smooth" });
}

// ─── KESIMPULAN SELECTION ─────────────────────────────────
document.querySelectorAll(".kesimpulan-card").forEach(card => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".kesimpulan-card").forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");
  });
});

// ─── KONSELOR MANAGEMENT ──────────────────────────────────
function addKonselor() {
  const list = document.getElementById("konselor-list");
  const row = document.createElement("div");
  row.className = "konselor-row";
  row.innerHTML = `
    <input type="text" class="konselor-input" placeholder="Nama Konselor..."/>
    <button class="btn-remove-konselor" onclick="removeKonselor(this)">✕</button>
  `;
  list.appendChild(row);
  updateRemoveButtons();
}

function removeKonselor(btn) {
  const row = btn.closest(".konselor-row");
  if (document.querySelectorAll(".konselor-row").length > 1) {
    row.remove();
  }
  updateRemoveButtons();
}

function updateRemoveButtons() {
  const rows = document.querySelectorAll(".konselor-row");
  rows.forEach(row => {
    const btn = row.querySelector(".btn-remove-konselor");
    btn.style.display = rows.length > 1 ? "flex" : "none";
  });
}

// ─── TOPIC TOGGLE ─────────────────────────────────────────
function toggleTopic(key) {
  const btn = document.getElementById(`btn-${key}`);
  const container = document.getElementById("topics-container");

  if (activeTopics.has(key)) {
    activeTopics.delete(key);
    btn.classList.remove("active");
    const panel = document.getElementById(`panel-${key}`);
    if (panel) {
      panel.style.opacity = "0";
      setTimeout(() => panel.remove(), 200);
    }
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
    <div class="topic-panel-header">
      <span class="icon">${t.icon}</span>
      <h3>${t.label}</h3>
    </div>
    <div class="narasi-block">
      <div class="narasi-label cou">📣 Narasi dari COU</div>
      <textarea id="cou-${key}" rows="4" placeholder="Tuliskan apa yang disampaikan oleh COU mengenai ${t.label.toLowerCase()}..."></textarea>
    </div>
    <div class="narasi-block">
      <div class="narasi-label konselor">💼 Respon Konselor HCC</div>
      <textarea id="konselor-${key}" rows="4" placeholder="Tuliskan respon dan tanggapan konselor HCC..."></textarea>
    </div>
  `;
  container.appendChild(panel);
}

// ─── EVIDENCE UPLOAD ──────────────────────────────────────
function handleEvidenceFiles(fileList) {
  const files = Array.from(fileList);
  const remaining = MAX_EVIDENCE - evidenceFiles.length;

  if (remaining <= 0) {
    showToast(`⚠️ Maksimal ${MAX_EVIDENCE} foto evidence.`, "error");
    return;
  }

  const toAdd = files.slice(0, remaining);
  const skipped = files.length - toAdd.length;

  toAdd.forEach(file => {
    if (!file.type.startsWith("image/")) {
      showToast(`⚠️ ${file.name} bukan file gambar.`, "error");
      return;
    }
    const sizeMB = file.size / 1024 / 1024;
    if (sizeMB > MAX_SIZE_MB) {
      showToast(`⚠️ ${file.name} melebihi ${MAX_SIZE_MB} MB.`, "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      evidenceFiles.push({ file, dataUrl: e.target.result, name: file.name });
      renderEvidencePreviews();
      updateEvidenceStatus();
    };
    reader.readAsDataURL(file);
  });

  if (skipped > 0) {
    showToast(`⚠️ ${skipped} foto dilewati (batas ${MAX_EVIDENCE} foto).`, "error");
  }

  // Reset input so same file can be re-selected
  document.getElementById("evidence-input").value = "";
}

function removeEvidence(index) {
  evidenceFiles.splice(index, 1);
  renderEvidencePreviews();
  updateEvidenceStatus();
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
      <button class="evidence-thumb-remove" onclick="removeEvidence(${i})" title="Hapus foto">✕</button>
    `;
    grid.appendChild(card);
  });

  // Show/hide upload area hint
  const dropZone = document.getElementById("evidence-drop-zone");
  dropZone.style.display = evidenceFiles.length >= MAX_EVIDENCE ? "none" : "block";
}

function updateEvidenceStatus() {
  const status = document.getElementById("evidence-status");
  if (evidenceFiles.length === 0) {
    status.innerHTML = "";
  } else {
    status.innerHTML = `<span class="evidence-count-badge">${evidenceFiles.length}/${MAX_EVIDENCE} foto dipilih</span>`;
  }
}

// Drag & drop support
document.addEventListener("DOMContentLoaded", () => {
  const dropZone = document.getElementById("evidence-drop-zone");
  if (!dropZone) return;

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("drag-over");
  });
  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("drag-over");
  });
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
    handleEvidenceFiles(e.dataTransfer.files);
  });
  dropZone.addEventListener("click", (e) => {
    // Only trigger if clicking the drop zone itself (not the label/button inside)
    if (e.target === dropZone || e.target.classList.contains("evidence-upload-inner") ||
        e.target.classList.contains("evidence-upload-icon") ||
        e.target.classList.contains("evidence-upload-title") ||
        e.target.classList.contains("evidence-upload-hint")) {
      document.getElementById("evidence-input").click();
    }
  });
});

// ─── COLLECT FORM DATA ────────────────────────────────────
function collectFormData() {
  const hari = document.getElementById("hari").value;
  const tanggalJam = document.getElementById("tanggalJam").value;
  const namaPemimpin = document.getElementById("namaPemimpin").value;
  const namaCOU = document.getElementById("namaCOU").value;
  const region = document.getElementById("region").value;
  const arahanTindakLanjut = document.getElementById("arahanTindakLanjut").value;
  const kesimpulanEl = document.querySelector('input[name="kesimpulan"]:checked');
  const kesimpulan = kesimpulanEl ? kesimpulanEl.value : "";

  const konselorInputs = document.querySelectorAll(".konselor-input");
  const konselor = Array.from(konselorInputs).map(i => i.value).filter(v => v.trim() !== "").join(", ");

  const hasilKonseling = {};
  activeTopics.forEach(key => {
    hasilKonseling[key] = {
      label: TOPICS[key].label,
      narasi_cou: document.getElementById(`cou-${key}`)?.value || "",
      respon_konselor: document.getElementById(`konselor-${key}`)?.value || "",
    };
  });

  // Build evidence array: base64 data + filename
  const evidenceData = evidenceFiles.map(item => ({
    name: item.name,
    data: item.dataUrl.split(",")[1], // strip "data:image/...;base64,"
    mimeType: item.file.type,
  }));

  return {
    hari, tanggalJam, namaPemimpin, namaCOU, region, konselor,
    hasilKonseling, arahanTindakLanjut, kesimpulan,
    evidenceFiles: evidenceData,
    timestamp: new Date().toLocaleString("id-ID"),
  };
}

// ─── VALIDATION ───────────────────────────────────────────
function validateStep(step) {
  if (step === 1) {
    const hari = document.getElementById("hari").value;
    const tgl = document.getElementById("tanggalJam").value;
    const pemimpin = document.getElementById("namaPemimpin").value.trim();
    const cou = document.getElementById("namaCOU").value.trim();
    const region = document.getElementById("region").value;
    const konselor = document.querySelector(".konselor-input").value.trim();

    if (!hari || !tgl || !pemimpin || !cou || !region || !konselor) {
      showToast("⚠️ Harap lengkapi semua field pada Informasi Sesi.", "error");
      return false;
    }
  }
  if (step === 5) {
    const kesimpulan = document.querySelector('input[name="kesimpulan"]:checked');
    if (!kesimpulan) {
      showToast("⚠️ Harap pilih kesimpulan konseling.", "error");
      return false;
    }
  }
  return true;
}

// Override goToStep with validation
const _goToStep = goToStep;
window.goToStep = function(step) {
  if (step === 2 && !validateStep(1)) return;
  if (step === 5 && !validateStep(4)) return;
  _goToStep(step);
};

// ─── SUBMIT ───────────────────────────────────────────────
async function submitForm() {
  if (!validateStep(5)) return;

  const data = collectFormData();

  const submitBtn = document.getElementById("btn-submit");
  document.getElementById("submit-text").style.display = "none";
  document.getElementById("submit-loading").style.display = "inline";
  submitBtn.disabled = true;

  // Demo mode
  if (GAS_URL === "GANTI_DENGAN_URL_APPS_SCRIPT_ANDA") {
    setTimeout(() => {
      showSuccessScreen(data, []);
      showToast("Mode Demo - Backend belum dikonfigurasi.", "info");
    }, 800);
    return;
  }

  try {
    // Step 1: Upload evidence photos first (if any), get Drive links
    let driveLinks = [];
    if (data.evidenceFiles && data.evidenceFiles.length > 0) {
      showToast("📤 Mengunggah foto evidence...", "info");
      driveLinks = await uploadEvidenceToDrive(data.evidenceFiles, data);
    }

    // Step 2: Submit main form data (include drive links)
    const payload = new URLSearchParams({
      data: JSON.stringify({
        ...data,
        evidenceLinks: driveLinks,
        evidenceFiles: undefined, // don't re-send base64 in main payload
      })
    });

    await fetch(GAS_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: payload,
    });

    showSuccessScreen(data, driveLinks);
    updateTotalSessions();
  } catch (err) {
    showToast("Gagal menyimpan: " + err.message, "error");
    document.getElementById("submit-text").style.display = "inline";
    document.getElementById("submit-loading").style.display = "none";
    submitBtn.disabled = false;
  }
}

// ─── UPLOAD EVIDENCE TO DRIVE ─────────────────────────────
async function uploadEvidenceToDrive(files, formData) {
  const links = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    try {
      const payload = new URLSearchParams({
        action: "uploadEvidence",
        fileName: f.name,
        mimeType: f.mimeType,
        fileData: f.data,
        namaPemimpin: formData.namaPemimpin || "",
        tanggalJam: formData.tanggalJam || "",
      });

      // Because of no-cors we cannot read the response directly.
      // Instead we use a JSONP-style GET request approach for the upload response.
      // We send via POST with a callback param to get Drive link back.
      const resp = await fetch(GAS_URL + "?action=uploadEvidence", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: payload,
      });
      const result = await resp.json();
      if (result && result.link) {
        links.push({ name: f.name, link: result.link });
      }
    } catch (err) {
      console.warn("Upload evidence gagal untuk:", f.name, err.message);
    }
  }
  return links;
}

function showSuccessScreen(data, driveLinks) {
  document.querySelectorAll(".form-section").forEach(s => s.classList.remove("active"));
  document.getElementById("section-success").classList.add("active");
  document.querySelectorAll(".step").forEach(s => s.classList.add("done"));

  const topicList = Array.from(activeTopics).map(k => TOPICS[k].label).join(", ") || "—";

  let evidenceSummary = "";
  if (driveLinks && driveLinks.length > 0) {
    const linkItems = driveLinks.map(l => `<a href="${l.link}" target="_blank" style="color:#c9a84c">📎 ${l.name}</a>`).join("<br/>");
    evidenceSummary = `<strong>Evidence Foto (${driveLinks.length}):</strong><br/>${linkItems}<br/>`;
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

// ─── RESET FORM ───────────────────────────────────────────
function resetForm() {
  document.getElementById("hari").value = "";
  document.getElementById("tanggalJam").value = "";
  document.getElementById("namaPemimpin").value = "";
  document.getElementById("namaCOU").value = "";
  document.getElementById("region").value = "";
  document.getElementById("konselor-list").innerHTML = `<div class="konselor-row"><input type="text" class="konselor-input" placeholder="Nama Konselor 1..."/><button class="btn-remove-konselor" onclick="removeKonselor(this)" style="display:none">✕</button></div>`;
  document.getElementById("topics-container").innerHTML = "";
  activeTopics.clear();
  Object.keys(TOPICS).forEach(k => {
    document.getElementById(`btn-${k}`)?.classList.remove("active");
  });
  document.getElementById("arahanTindakLanjut").value = "";
  document.querySelectorAll('input[name="kesimpulan"]').forEach(r => r.checked = false);
  document.querySelectorAll(".kesimpulan-card").forEach(c => c.classList.remove("selected"));
  document.getElementById("submit-text").style.display = "inline";
  document.getElementById("submit-loading").style.display = "none";
  document.getElementById("btn-submit").disabled = false;

  // Reset evidence
  evidenceFiles = [];
  document.getElementById("evidence-preview-grid").innerHTML = "";
  document.getElementById("evidence-status").innerHTML = "";
  const dropZone = document.getElementById("evidence-drop-zone");
  if (dropZone) dropZone.style.display = "block";

  goToStep(1);
}

// ─── TOAST ────────────────────────────────────────────────
function showToast(msg, type = "info") {
  const old = document.getElementById("toast");
  if (old) old.remove();

  const toast = document.createElement("div");
  toast.id = "toast";
  toast.textContent = msg;
  toast.style.cssText = `
    position:fixed; bottom:28px; left:50%; transform:translateX(-50%);
    background:${type==="error"?"#c0392b":type==="info"?"#2980b9":"#2d7a4f"};
    color:white; padding:14px 28px; border-radius:100px;
    font-family:'DM Sans',sans-serif; font-size:14px; font-weight:600;
    box-shadow:0 8px 24px rgba(0,0,0,0.2); z-index:9999;
    animation:fadeUp 0.3s ease;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ─── LOAD TOTAL SESSIONS ──────────────────────────────────
async function updateTotalSessions() {
  if (GAS_URL === "GANTI_DENGAN_URL_APPS_SCRIPT_ANDA") return;
  try {
    const r = await fetch(GAS_URL + "?action=count");
    const d = await r.json();
    if (d.count) document.getElementById("total-sessions").textContent = d.count;
  } catch {}
}

// ─── INIT ─────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  updateRemoveButtons();
  updateTotalSessions();

  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString().slice(0, 16);
  document.getElementById("tanggalJam").value = local;

  const days = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
  const hariSelect = document.getElementById("hari");
  hariSelect.value = days[now.getDay()];
});
