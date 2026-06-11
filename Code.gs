// ============================================================
//  GOOGLE APPS SCRIPT — BACKEND HCC KONSELING
//  File: Code.gs (dengan fitur upload foto Evidence ke Google Drive)
//
//  CARA DEPLOY:
//  1. Buka script.google.com → New Project
//  2. Paste seluruh kode ini
//  3. Klik Deploy → New deployment → Web app
//  4. Execute as: Me | Who has access: Anyone
//  5. Copy URL dan paste ke config.js (konstanta GAS_URL)
// ============================================================

// ─── CONFIG ─────────────────────────────────────────────────
const SPREADSHEET_ID = "GANTI_DENGAN_ID_SPREADSHEET_ANDA";
// Cara dapat ID: buka Google Sheet → lihat URL
// https://docs.google.com/spreadsheets/d/[INI_ID_NYA]/edit

const SHEET_NAME  = "Data Konseling";
const LOG_SHEET   = "Log Aktivitas";

// ID folder Google Drive untuk menyimpan foto evidence.
// Cara membuat folder:
//   1. Buka drive.google.com → klik "+ Baru" → Folder → beri nama misal "HCC Evidence"
//   2. Buka folder tersebut → lihat URL: https://drive.google.com/drive/folders/[INI_FOLDER_ID]
//   3. Tempelkan ID-nya di sini.
const DRIVE_FOLDER_ID = "GANTI_DENGAN_ID_FOLDER_DRIVE_ANDA";

// ─── HANDLE GET ─────────────────────────────────────────────
function doGet(e) {
  const action = e.parameter.action;

  if (action === "count") {
    return countSessions();
  }

  if (action === "getData") {
    return getAllData(e.parameter.callback || "");
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok", message: "HCC Konseling API aktif." }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── HANDLE POST ────────────────────────────────────────────
function doPost(e) {
  try {
    const action = e.parameter.action || "";

    // ── Upload foto evidence ke Google Drive ──
    if (action === "uploadEvidence") {
      return uploadEvidenceFile(e);
    }

    // ── Simpan data form ke Spreadsheet ──
    let data;
    if (e.parameter && e.parameter.data) {
      data = JSON.parse(e.parameter.data);
    } else {
      data = JSON.parse(e.postData.contents);
    }

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

// ─── UPLOAD EVIDENCE FILE TO GOOGLE DRIVE ───────────────────
function uploadEvidenceFile(e) {
  try {
    const fileName     = e.parameter.fileName     || "evidence.jpg";
    const mimeType     = e.parameter.mimeType     || "image/jpeg";
    const fileData     = e.parameter.fileData     || "";
    const namaPemimpin = e.parameter.namaPemimpin || "Unknown";
    const tanggalJam   = e.parameter.tanggalJam   || "";

    if (!fileData) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: "error", message: "Tidak ada data file." }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Decode base64
    const bytes = Utilities.base64Decode(fileData);
    const blob  = Utilities.newBlob(bytes, mimeType, fileName);

    // Get or create subfolder per sesi: "NamaPemimpin_Tanggal"
    const rootFolder  = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const subFolderName = sanitizeName(namaPemimpin) + "_" + sanitizeName(tanggalJam);
    let subFolder;
    const existingFolders = rootFolder.getFoldersByName(subFolderName);
    if (existingFolders.hasNext()) {
      subFolder = existingFolders.next();
    } else {
      subFolder = rootFolder.createFolder(subFolderName);
    }

    // Upload file
    const uploadedFile = subFolder.createFile(blob);
    uploadedFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileId   = uploadedFile.getId();
    const viewLink = "https://drive.google.com/file/d/" + fileId + "/view";

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", link: viewLink, fileId }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function sanitizeName(str) {
  return (str || "").replace(/[^a-zA-Z0-9\u00C0-\u024F_\- ]/g, "").replace(/\s+/g, "_").substring(0, 40);
}

// ─── SAVE TO SPREADSHEET ────────────────────────────────────
function saveToSpreadsheet(data) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  let   sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    setupHeaders(sheet);
  }

  const topicKeys = ["fakta", "inovasi", "keluhan", "kritikan", "sop", "lainlain"];

  // Build evidence links string
  let evidenceLinksStr = "";
  if (data.evidenceLinks && data.evidenceLinks.length > 0) {
    evidenceLinksStr = data.evidenceLinks
      .map(l => l.link || l)
      .join("\n");
  }

  const row = [
    new Date(),                              // A: Timestamp
    data.hari           || "",               // B: Hari
    data.tanggalJam     || "",               // C: Tanggal & Jam
    data.namaPemimpin   || "",               // D: Nama Pemimpin
    data.namaCOU        || "",               // E: Nama COU
    data.region         || "",               // F: Region
    data.konselor       || "",               // G: Nama Konselor
    data.arahanTindakLanjut || "",           // H: Arahan & Tindak Lanjut
    data.kesimpulan     || "",               // I: Kesimpulan
    evidenceLinksStr,                        // J: Link Evidence (Google Drive)
  ];

  // Append topic columns (COU + Konselor per topic)
  topicKeys.forEach(key => {
    const topicData = data.hasilKonseling && data.hasilKonseling[key];
    row.push(topicData ? topicData.narasi_cou      || "" : "");  // K,M,O,Q,S,U
    row.push(topicData ? topicData.respon_konselor || "" : "");  // L,N,P,R,T,V
  });

  sheet.appendRow(row);
  sheet.autoResizeColumns(1, row.length);

  logActivity(ss, data);

  return {
    status:  "success",
    message: "Data konseling berhasil disimpan.",
    row:     sheet.getLastRow(),
  };
}

// ─── SETUP HEADERS ──────────────────────────────────────────
function setupHeaders(sheet) {
  const topicLabels = {
    fakta:    "Fakta & Temuan",
    inovasi:  "Ide/Inovasi/Masukan",
    keluhan:  "Keluhan/Curhat",
    kritikan: "Kritikan",
    sop:      "SOP & Compliance",
    lainlain: "Lain-lain",
  };
  const topicKeys = ["fakta","inovasi","keluhan","kritikan","sop","lainlain"];

  const headers = [
    "Timestamp", "Hari", "Tanggal & Jam", "Nama Pemimpin",
    "Nama COU", "Region", "Nama Konselor HCC",
    "Arahan & Tindak Lanjut", "Kesimpulan Konseling",
    "Link Evidence (Google Drive)",
  ];

  topicKeys.forEach(key => {
    headers.push(`[${topicLabels[key]}] Narasi COU`);
    headers.push(`[${topicLabels[key]}] Respon Konselor`);
  });

  sheet.appendRow(headers);

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange
    .setBackground("#0d1b2a")
    .setFontColor("#c9a84c")
    .setFontWeight("bold")
    .setFontSize(11);

  sheet.setFrozenRows(1);
}

// ─── GET ALL DATA (for Dashboard) ───────────────────────────
function getAllData(callback) {
  try {
    const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet || sheet.getLastRow() <= 1) {
      const out = JSON.stringify({ status: "success", data: [] });
      return ContentService
        .createTextOutput(callback ? `${callback}(${out})` : out)
        .setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
    }

    const topicKeys = ["fakta","inovasi","keluhan","kritikan","sop","lainlain"];
    const rows      = sheet.getDataRange().getValues();
    const data      = [];

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const hasilKonseling = {};
      topicKeys.forEach((key, ki) => {
        // Columns shift by 1 now due to evidenceLinks at index 9
        const couIdx      = 10 + ki * 2;
        const konselorIdx = 11 + ki * 2;
        const narasi_cou      = r[couIdx]      || "";
        const respon_konselor = r[konselorIdx] || "";
        if (narasi_cou || respon_konselor) {
          hasilKonseling[key] = { narasi_cou, respon_konselor };
        }
      });

      data.push({
        timestamp:          r[0] ? new Date(r[0]).toLocaleString("id-ID") : "",
        hari:               r[1]  || "",
        tanggalJam:         r[2]  || "",
        namaPemimpin:       r[3]  || "",
        namaCOU:            r[4]  || "",
        region:             r[5]  || "",
        konselor:           r[6]  || "",
        arahanTindakLanjut: r[7]  || "",
        kesimpulan:         r[8]  || "",
        evidenceLinks:      r[9]  || "",
        hasilKonseling,
      });
    }

    data.reverse();

    const out = JSON.stringify({ status: "success", data });
    return ContentService
      .createTextOutput(callback ? `${callback}(${out})` : out)
      .setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);

  } catch (err) {
    const out = JSON.stringify({ status: "error", message: err.message, data: [] });
    return ContentService
      .createTextOutput(callback ? `${callback}(${out})` : out)
      .setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
  }
}

// ─── LOG ACTIVITY ────────────────────────────────────────────
function logActivity(ss, data) {
  let logSheet = ss.getSheetByName(LOG_SHEET);
  if (!logSheet) {
    logSheet = ss.insertSheet(LOG_SHEET);
    logSheet.appendRow(["Timestamp", "Pemimpin", "COU", "Region", "Kesimpulan", "Jumlah Evidence"]);
    logSheet.getRange(1, 1, 1, 6)
      .setBackground("#1b2f47")
      .setFontColor("#e6c87a")
      .setFontWeight("bold");
    logSheet.setFrozenRows(1);
  }
  const evidenceCount = data.evidenceLinks ? data.evidenceLinks.length : 0;
  logSheet.appendRow([
    new Date(),
    data.namaPemimpin || "",
    data.namaCOU      || "",
    data.region       || "",
    data.kesimpulan   || "",
    evidenceCount,
  ]);
}

// ─── COUNT SESSIONS ─────────────────────────────────────────
function countSessions() {
  try {
    const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const count = sheet ? Math.max(0, sheet.getLastRow() - 1) : 0;

    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok", count }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", count: 0 }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
