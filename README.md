# 🏢 Program Konseling HCC

Platform digital untuk dokumentasi sesi konseling pemimpin secara terstruktur.

---

## 📁 Struktur File

```
hcc-konseling/
├── index.html     ← Frontend utama (buka di browser)
├── style.css      ← Styling halaman
├── app.js         ← Logic frontend + koneksi ke backend
└── Code.gs        ← Backend Google Apps Script
```

---

## 🚀 Cara Setup

### Step 1 — Buat Google Spreadsheet
1. Buka [Google Sheets](https://sheets.google.com)
2. Buat spreadsheet baru, beri nama: **"HCC Konseling Data"**
3. Copy **ID spreadsheet** dari URL:
   `https://docs.google.com/spreadsheets/d/**[INI_ID_NYA]**/edit`

---

### Step 2 — Deploy Google Apps Script
1. Buka [script.google.com](https://script.google.com)
2. Klik **New Project** → beri nama "HCC Konseling Backend"
3. Hapus semua isi default, paste isi file `Code.gs`
4. Ganti baris ini dengan ID spreadsheet Anda:
   ```js
   const SPREADSHEET_ID = "GANTI_DENGAN_ID_SPREADSHEET_ANDA";
   ```
5. Klik **Deploy → New Deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Klik **Deploy** → Copy **Web app URL**

---

### Step 3 — Hubungkan Frontend ke Backend
1. Buka file `app.js`
2. Ganti baris:
   ```js
   const GAS_URL = "GANTI_DENGAN_URL_APPS_SCRIPT_ANDA";
   ```
   Dengan URL yang didapat dari Step 2.

---

### Step 4 — Buka Website
1. Buka file `index.html` langsung di browser, atau
2. Upload ke web hosting (GitHub Pages, Netlify, dll.)

---

## 📋 Fitur

| Section | Konten |
|---------|--------|
| Hero | Headline, deskripsi, statistik |
| Section 1 | Form: Hari, Tanggal/Jam, Pemimpin, COU, Region, Konselor (multi) |
| Section 2 | Hasil Konseling per kategori (6 tombol topik, narasi COU + Konselor) |
| Section 3 | Arahan & Tindak Lanjut |
| Section 4 | Checklist Kesimpulan (5 opsi) |

## 📊 Data Spreadsheet

Sheet **"Data Konseling"** menyimpan kolom:
- Timestamp, Hari, Tanggal & Jam
- Nama Pemimpin, COU, Region, Konselor
- Arahan & Tindak Lanjut
- Kesimpulan
- Per topik: Narasi COU + Respon Konselor

Sheet **"Log Aktivitas"** untuk ringkasan cepat.
