// ============================================================
//  GOOGLE APPS SCRIPT — BACKEND HCC KONSELING
//  File: Code.gs
//  
//  CARA DEPLOY:
//  1. Buka script.google.com → New Project
//  2. Paste seluruh kode ini
//  3. Klik Deploy → New deployment → Web app
//  4. Execute as: Me | Who has access: Anyone
//  5. Copy URL dan paste ke app.js (konstanta GAS_URL)
// ============================================================

// ─── CONFIG ─────────────────────────────────────────────────
const SPREADSHEET_ID = "GANTI_DENGAN_ID_SPREADSHEET_ANDA";
// Cara dapat ID: buka Google Sheet → lihat URL
// https://docs.google.com/spreadsheets/d/[INI_ID_NYA]/edit

const SHEET_NAME = "Data Konseling";
const LOG_SHEET  = "Log Aktivitas";

// ─── HANDLE GET ─────────────────────────────────────────────
function doGet(e) {
  const action = e.parameter.action;

  if (action === "count") {
    return countSessions();
  }

  // Default: return info
  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok", message: "HCC Konseling API aktif." }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── HANDLE POST ────────────────────────────────────────────
function doPost(e) {
  try {
    const raw  = e.postData.contents;
    const data = JSON.parse(raw);

    const result = saveToSpreadsheet(data);
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─── SAVE TO SPREADSHEET ────────────────────────────────────
function saveToSpreadsheet(data) {
  const ss        = SpreadsheetApp.openById(SPREADSHEET_ID);
  let   sheet     = ss.getSheetByName(SHEET_NAME);

  // Auto-create sheet if not exists
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    setupHeaders(sheet);
  }

  // Build topic columns
  const topicKeys = ["fakta", "inovasi", "keluhan", "kritikan", "sop", "lainlain"];
  const topicLabels = {
    fakta:    "Fakta & Temuan",
    inovasi:  "Ide/Inovasi/Masukan",
    keluhan:  "Keluhan/Curhat",
    kritikan: "Kritikan",
    sop:      "SOP & Compliance",
    lainlain: "Lain-lain",
  };

  // Check if headers exist
  if (sheet.getLastRow() === 0) {
    setupHeaders(sheet, topicLabels, topicKeys);
  }

  // Build row
  const row = [
    new Date(),                             // A: Timestamp
    data.hari          || "",               // B: Hari
    data.tanggalJam    || "",               // C: Tanggal & Jam
    data.namaPemimpin  || "",               // D: Nama Pemimpin
    data.namaCOU       || "",               // E: Nama COU
    data.region        || "",               // F: Region
    data.konselor      || "",               // G: Nama Konselor
    data.arahanTindakLanjut || "",          // H: Arahan & Tindak Lanjut
    data.kesimpulan    || "",               // I: Kesimpulan
  ];

  // Append topic columns (COU + Konselor per topic)
  topicKeys.forEach(key => {
    const topicData = data.hasilKonseling && data.hasilKonseling[key];
    row.push(topicData ? topicData.narasi_cou       || "" : ""); // J,L,N,P,R,T
    row.push(topicData ? topicData.respon_konselor  || "" : ""); // K,M,O,Q,S,U
  });

  sheet.appendRow(row);

  // Auto-resize columns
  sheet.autoResizeColumns(1, row.length);

  // Log activity
  logActivity(ss, data);

  return {
    status: "success",
    message: "Data konseling berhasil disimpan.",
    row: sheet.getLastRow(),
  };
}

// ─── SETUP HEADERS ──────────────────────────────────────────
function setupHeaders(sheet, topicLabels, topicKeys) {
  const labels   = topicLabels || {
    fakta:    "Fakta & Temuan",
    inovasi:  "Ide/Inovasi/Masukan",
    keluhan:  "Keluhan/Curhat",
    kritikan: "Kritikan",
    sop:      "SOP & Compliance",
    lainlain: "Lain-lain",
  };
  const keys = topicKeys || ["fakta","inovasi","keluhan","kritikan","sop","lainlain"];

  const headers = [
    "Timestamp", "Hari", "Tanggal & Jam", "Nama Pemimpin",
    "Nama COU", "Region", "Nama Konselor HCC",
    "Arahan & Tindak Lanjut", "Kesimpulan Konseling"
  ];

  keys.forEach(key => {
    headers.push(`[${labels[key]}] Narasi COU`);
    headers.push(`[${labels[key]}] Respon Konselor`);
  });

  sheet.appendRow(headers);

  // Style header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange
    .setBackground("#0d1b2a")
    .setFontColor("#c9a84c")
    .setFontWeight("bold")
    .setFontSize(11);

  sheet.setFrozenRows(1);
}

// ─── LOG ACTIVITY ────────────────────────────────────────────
function logActivity(ss, data) {
  let logSheet = ss.getSheetByName(LOG_SHEET);
  if (!logSheet) {
    logSheet = ss.insertSheet(LOG_SHEET);
    logSheet.appendRow(["Timestamp", "Pemimpin", "COU", "Region", "Kesimpulan"]);
    logSheet.getRange(1, 1, 1, 5)
      .setBackground("#1b2f47")
      .setFontColor("#e6c87a")
      .setFontWeight("bold");
    logSheet.setFrozenRows(1);
  }
  logSheet.appendRow([
    new Date(),
    data.namaPemimpin || "",
    data.namaCOU      || "",
    data.region       || "",
    data.kesimpulan   || "",
  ]);
}

// ─── COUNT SESSIONS ─────────────────────────────────────────
function countSessions() {
  try {
    const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const count = sheet ? Math.max(0, sheet.getLastRow() - 1) : 0; // minus header

    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok", count }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", count: 0 }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─── CORS HEADERS (add to all responses if needed) ──────────
function addCORSHeaders(output) {
  return output; // GAS handles CORS automatically for public deployments
}
