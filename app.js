/* ===========================
   HCC KONSELING — APP.JS (FINAL)
   =========================== */

// ─── GLOBAL CONFIG ────────────────────────────────────────
window.GAS_URL = "https://script.google.com/macros/s/AKfycbyIsYNbByqKVtamAs3P-TWxaS42yjICnq3dWLI-z9thzcJ3EiNBLCquTiwtNJxjn32R/exec";

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
    document.getElementById(id)?.classList.remove("active");
    steps[i]?.classList.remove("active","done");
  });

  document.getElementById(`section-${step + 1}`)?.classList.add("active");

  steps.forEach((s, i) => {
    if (i < step - 1) s.classList.add("done");
    else if (i === step - 1) s.classList.add("active");
  });
}

// ─── KESIMPULAN ──────────────────────────────────────────
document.querySelectorAll(".kesimpulan-card").forEach(card => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".kesimpulan-card").forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");
  });
});

// ─── KONSELOR ─────────────────────────────────────────────
function addKonselor() {
  const list = document.getElementById("konselor-list");
  if (!list) return;

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
    if (btn) btn.style.display = rows.length > 1 ? "flex" : "none";
  });
}

// ─── TOPIC ────────────────────────────────────────────────
function toggleTopic(key) {
  const btn = document.getElementById(`btn-${key}`);
  const container = document.getElementById("topics-container");

  if (!btn || !container) return;

  if (activeTopics.has(key)) {
    activeTopics.delete(key);
    btn.classList.remove("active");
    document.getElementById(`panel-${key}`)?.remove();
  } else {
    activeTopics.add(key);
    btn.classList.add("active");

    const t = TOPICS[key];
    const panel = document.createElement("div");
    panel.id = `panel-${key}`;
    panel.className = "topic-panel";
    panel.innerHTML = `
      <h3>${t.icon} ${t.label}</h3>
      <textarea id="cou-${key}" placeholder="Narasi COU"></textarea>
      <textarea id="konselor-${key}" placeholder="Respon Konselor"></textarea>
    `;
    container.appendChild(panel);
  }
}

// ─── COLLECT DATA ─────────────────────────────────────────
function collectFormData() {
  const get = id => document.getElementById(id)?.value || "";

  const hasilKonseling = {};
  activeTopics.forEach(key => {
    hasilKonseling[key] = {
      narasi_cou: get(`cou-${key}`),
      respon_konselor: get(`konselor-${key}`)
    };
  });

  return {
    hari: get("hari"),
    tanggalJam: get("tanggalJam"),
    namaPemimpin: get("namaPemimpin"),
    namaCOU: get("namaCOU"),
    region: get("region"),
    konselor: Array.from(document.querySelectorAll(".konselor-input"))
      .map(i => i.value).join(", "),
    arahanTindakLanjut: get("arahanTindakLanjut"),
    kesimpulan: document.querySelector('input[name="kesimpulan"]:checked')?.value || "",
    hasilKonseling,
    timestamp: new Date().toISOString()
  };
}

// ─── SUBMIT ───────────────────────────────────────────────
async function submitForm() {
  if (!window.GAS_URL) {
    alert("GAS_URL belum diset");
    return;
  }

  const data = collectFormData();

  try {
    await fetch(window.GAS_URL, {
      method: "POST",
      mode: "no-cors",
      body: new URLSearchParams({ data: JSON.stringify(data) })
    });

    alert("Data berhasil disimpan!");
  } catch (e) {
    alert("Gagal: " + e.message);
  }
}

// ─── INIT ─────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  updateRemoveButtons();

  const now = new Date();
  const tanggal = document.getElementById("tanggalJam");
  if (tanggal) {
    tanggal.value = new Date(now.getTime() - now.getTimezoneOffset()*60000)
      .toISOString().slice(0,16);
  }
});
