// ============================================================
//  GOOGLE APPS SCRIPT — BACKEND HCC KONSELING
//  File: Code.gs (dengan upload foto Evidence ke Google Drive)
//
//  CARA DEPLOY:
//  1. Buka script.google.com → New Project
//  2. Paste seluruh kode ini
//  3. Klik Deploy → New deployment → Web app
//  4. Execute as: Me | Who has access: Anyone
//  5. Copy URL dan paste ke config.js (konstanta GAS_URL)
// ============================================================

// ─── CONFIG ─────────────────────────────────────────────────
const SPREADSHEET_ID  = "GANTI_DENGAN_ID_SPREADSHEET_ANDA";
const SHEET_NAME      = "Data Konseling";
const LOG_SHEET       = "Log Aktivitas";

// ID folder Google Drive untuk menyimpan foto evidence.
// Cara membuat folder:
//   1. Buka drive.google.com → "+ Baru" → Folder → beri nama "HCC Evidence"
//   2. Buka folder → lihat URL: drive.google.com/drive/folders/[INI_FOLDER_ID]
//   3. Tempelkan ID-nya di sini.
const DRIVE_FOLDER_ID = "GANTI_DENGAN_ID_FOLDER_DRIVE_ANDA";

// ─── HANDLE GET ─────────────────────────────────────────────
function doGet(e) {
  const action = e.parameter.action;
  if (action === "count")   return countSessions();
  if (action === "getData") return getAllData(e.parameter.callback || "");

  return jsonOut({ status: "ok", message: "HCC Konseling API aktif." });
}

// ─── HANDLE POST ─────────────────────────────────────────────
// Semua submit (data + foto) masuk satu POST → proses di sini.
function doPost(e) {
  try {
    // GAS menerima body sebagai e.postData.contents
    const raw  = e.postData ? e.postData.contents : "";
    const data = JSON.parse(raw);

    // 1. Upload foto ke Drive, dapatkan link
    const evidenceLinks = uploadAllEvidence(data);

    // 2. Simpan ke Spreadsheet (dengan link)
    const result = saveToSpreadsheet(data, evidenceLinks);

    return jsonOut(result);
  } catch (err) {
    return jsonOut({ status: "error", message: err.message });
  }
}

// ─── UPLOAD SEMUA FOTO KE DRIVE ──────────────────────────────
function uploadAllEvidence(data) {
  const links = [];
  const files = data.evidenceFiles;
  if (!files || files.length === 0) return links;

  // Subfolder per sesi: "NamaPemimpin_Tanggal"
  const subName = sanitizeName(data.namaPemimpin) + "_" + sanitizeName(data.tanggalJam);
  const root    = DriveApp.getFolderById(DRIVE_FOLDER_ID);

  let folder;
  const existing = root.getFoldersByName(subName);
  folder = existing.hasNext() ? existing.next() : root.createFolder(subName);

  files.forEach(function(f) {
    try {
      const bytes      = Utilities.base64Decode(f.data);
      const blob       = Utilities.newBlob(bytes, f.mimeType, f.name);
      const uploaded   = folder.createFile(blob);
      uploaded.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      const viewLink = "https://drive.google.com/file/d/" + uploaded.getId() + "/view";
      links.push(viewLink);
    } catch (err) {
      // Catat error tapi lanjut ke foto berikutnya
      links.push("ERROR: " + err.message);
    }
  });

  return links;
}

function sanitizeName(str) {
  return (str || "unknown")
    .replace(/[\/\\:*?"<>|]/g, "")
    .replace(/\s+/g, "_")
    .substring(0, 50);
}

// ─── SAVE TO SPREADSHEET ─────────────────────────────────────
function saveToSpreadsheet(data, evidenceLinks) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  let   sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    setupHeaders(sheet);
  } else if (sheet.getLastRow() === 0) {
    setupHeaders(sheet);
  }

  const topicKeys    = ["fakta","inovasi","keluhan","kritikan","sop","lainlain"];
  const linksStr     = (evidenceLinks || []).join("\n");

  const row = [
    new Date(),                          // A  Timestamp
    data.hari            || "",          // B  Hari
    data.tanggalJam      || "",          // C  Tanggal & Jam
    data.namaPemimpin    || "",          // D  Nama Pemimpin
    data.namaCOU         || "",          // E  Nama COU
    data.region          || "",          // F  Region
    data.konselor        || "",          // G  Nama Konselor
    data.arahanTindakLanjut || "",       // H  Arahan & Tindak Lanjut
    data.kesimpulan      || "",          // I  Kesimpulan
    linksStr,                            // J  Link Evidence (Google Drive)
  ];

  topicKeys.forEach(function(key) {
    const t = data.hasilKonseling && data.hasilKonseling[key];
    row.push(t ? (t.narasi_cou      || "") : "");
    row.push(t ? (t.respon_konselor || "") : "");
  });

  sheet.appendRow(row);
  sheet.autoResizeColumns(1, row.length);

  logActivity(ss, data, evidenceLinks ? evidenceLinks.length : 0);

  return {
    status:        "success",
    message:       "Data konseling berhasil disimpan.",
    row:           sheet.getLastRow(),
    evidenceCount: evidenceLinks ? evidenceLinks.length : 0,
    evidenceLinks: evidenceLinks || [],
  };
}

// ─── SETUP HEADERS ───────────────────────────────────────────
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
    "Timestamp","Hari","Tanggal & Jam","Nama Pemimpin",
    "Nama COU","Region","Nama Konselor HCC",
    "Arahan & Tindak Lanjut","Kesimpulan Konseling",
    "Link Evidence (Google Drive)",
  ];

  topicKeys.forEach(function(key) {
    headers.push("[" + topicLabels[key] + "] Narasi COU");
    headers.push("[" + topicLabels[key] + "] Respon Konselor");
  });

  sheet.appendRow(headers);

  sheet.getRange(1, 1, 1, headers.length)
    .setBackground("#0d1b2a")
    .setFontColor("#c9a84c")
    .setFontWeight("bold")
    .setFontSize(11);

  sheet.setFrozenRows(1);
}

// ─── GET ALL DATA (Dashboard) ─────────────────────────────────
function getAllData(callback) {
  try {
    const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet || sheet.getLastRow() <= 1) {
      return jsonOutCb({ status: "success", data: [] }, callback);
    }

    const topicKeys = ["fakta","inovasi","keluhan","kritikan","sop","lainlain"];
    const rows = sheet.getDataRange().getValues();
    const data = [];

    for (var i = 1; i < rows.length; i++) {
      const r = rows[i];
      const hasilKonseling = {};
      topicKeys.forEach(function(key, ki) {
        const ci  = 10 + ki * 2; // col J = index 9 = evidenceLinks, so topics start at 10
        const cj  = 11 + ki * 2;
        const nc  = r[ci] || "";
        const rc  = r[cj] || "";
        if (nc || rc) hasilKonseling[key] = { narasi_cou: nc, respon_konselor: rc };
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
    return jsonOutCb({ status: "success", data }, callback);

  } catch (err) {
    return jsonOutCb({ status: "error", message: err.message, data: [] }, callback);
  }
}

// ─── LOG ACTIVITY ─────────────────────────────────────────────
function logActivity(ss, data, evidenceCount) {
  let log = ss.getSheetByName(LOG_SHEET);
  if (!log) {
    log = ss.insertSheet(LOG_SHEET);
    log.appendRow(["Timestamp","Pemimpin","COU","Region","Kesimpulan","Jumlah Evidence"]);
    log.getRange(1,1,1,6)
      .setBackground("#1b2f47")
      .setFontColor("#e6c87a")
      .setFontWeight("bold");
    log.setFrozenRows(1);
  }
  log.appendRow([
    new Date(),
    data.namaPemimpin || "",
    data.namaCOU      || "",
    data.region       || "",
    data.kesimpulan   || "",
    evidenceCount     || 0,
  ]);
}

// ─── COUNT SESSIONS ───────────────────────────────────────────
function countSessions() {
  try {
    const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const count = sheet ? Math.max(0, sheet.getLastRow() - 1) : 0;
    return jsonOut({ status: "ok", count });
  } catch (err) {
    return jsonOut({ status: "error", count: 0 });
  }
}

// ─── HELPERS ─────────────────────────────────────────────────
function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonOutCb(obj, callback) {
  const str = JSON.stringify(obj);
  return ContentService
    .createTextOutput(callback ? callback + "(" + str + ")" : str)
    .setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}
