/* ===========================
   HCC KONSELING — APP.JS
   =========================== */

// ─── CONFIG ───────────────────────────────────────────────
// Ganti URL ini dengan URL Google Apps Script yang sudah di-deploy
const GAS_URL = "https://script.google.com/macros/s/AKfycbytgxZg4A9sJQ64rowJsZvgXwWHOdZSlYk1trlXUMu5VuN8DR4SPhl_5eh_iIcsMJpi/exec";

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

// ─── STEP NAVIGATION ──────────────────────────────────────
function goToStep(step) {
  const sections = ["section-2","section-3","section-4","section-5"];
  const steps = document.querySelectorAll(".step");

  sections.forEach((id, i) => {
    const el = document.getElementById(id);
    el.classList.remove("active");
    steps[i].classList.remove("active","done");
  });

  const targetId = `section-${step + 1}`;
  document.getElementById(targetId).classList.add("active");

  steps.forEach((s, i) => {
    if (i < step - 1) s.classList.add("done");
    else if (i === step - 1) s.classList.add("active");
  });

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

  // Show remove buttons on all if > 1
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

  // Collect topic narations
  const hasilKonseling = {};
  activeTopics.forEach(key => {
    hasilKonseling[key] = {
      label: TOPICS[key].label,
      narasi_cou: document.getElementById(`cou-${key}`)?.value || "",
      respon_konselor: document.getElementById(`konselor-${key}`)?.value || "",
    };
  });

  return {
    hari, tanggalJam, namaPemimpin, namaCOU, region, konselor,
    hasilKonseling, arahanTindakLanjut, kesimpulan,
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
  if (step === 4) {
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
  if (step === 4 && !validateStep(3)) return;
  _goToStep(step);
};

// ─── SUBMIT ───────────────────────────────────────────────
async function submitForm() {
  if (!validateStep(4)) return;

  const data = collectFormData();

  const submitBtn = document.getElementById("btn-submit");
  document.getElementById("submit-text").style.display = "none";
  document.getElementById("submit-loading").style.display = "inline";
  submitBtn.disabled = true;

  // Demo mode
  if (GAS_URL === https://script.google.com/macros/s/AKfycbytgxZg4A9sJQ64rowJsZvgXwWHOdZSlYk1trlXUMu5VuN8DR4SPhl_5eh_iIcsMJpi/exec") {
    setTimeout(() => {
      showSuccessScreen(data);
      showToast("Mode Demo - Backend belum dikonfigurasi.", "info");
    }, 800);
    return;
  }

  try {
    // no-cors + URLSearchParams to avoid CORS preflight
    const payload = new URLSearchParams({ data: JSON.stringify(data) });
    await fetch(GAS_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: payload,
    });
    // no-cors = opaque response, assume success
    showSuccessScreen(data);
    updateTotalSessions();
  } catch (err) {
    showToast("Gagal menyimpan: " + err.message, "error");
    document.getElementById("submit-text").style.display = "inline";
    document.getElementById("submit-loading").style.display = "none";
    submitBtn.disabled = false;
  }
}

function showSuccessScreen(data) {
  // Hide all sections
  document.querySelectorAll(".form-section").forEach(s => s.classList.remove("active"));
  document.getElementById("section-success").classList.add("active");

  // Mark all steps done
  document.querySelectorAll(".step").forEach(s => s.classList.add("done"));

  // Build summary
  const topicList = Array.from(activeTopics).map(k => TOPICS[k].label).join(", ") || "—";
  document.getElementById("success-summary").innerHTML = `
    <strong>Hari & Waktu:</strong> ${data.hari}, ${data.tanggalJam}<br/>
    <strong>Pemimpin:</strong> ${data.namaPemimpin}<br/>
    <strong>COU:</strong> ${data.namaCOU}<br/>
    <strong>Region:</strong> ${data.region}<br/>
    <strong>Konselor:</strong> ${data.konselor}<br/>
    <strong>Topik Dibahas:</strong> ${topicList}<br/>
    <strong>Kesimpulan:</strong> ${data.kesimpulan}
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

// ─── LOAD TOTAL SESSIONS (optional) ───────────────────────
async function updateTotalSessions() {
  if (GAS_URL === "https://script.google.com/macros/s/AKfycbytgxZg4A9sJQ64rowJsZvgXwWHOdZSlYk1trlXUMu5VuN8DR4SPhl_5eh_iIcsMJpi/exec") return;
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

  // Set today's datetime
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString().slice(0, 16);
  document.getElementById("tanggalJam").value = local;

  // Set today's day
  const days = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
  const hariSelect = document.getElementById("hari");
  hariSelect.value = days[now.getDay()];
});
