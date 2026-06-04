# 🏢 Program Konseling HCC
**Human Capital Counseling System** — Platform digital dokumentasi sesi konseling pemimpin.

---

## 📁 Struktur File (9 File)

```
hcc-konseling/
├── index.html      ← Halaman input sesi konseling (4 step form)
├── style.css       ← CSS utama (tema Navy & Gold)
├── app.js          ← Logic form input + submit ke Google Sheets
├── config.js       ← ⚙️  KONFIGURASI URL — EDIT FILE INI
├── dashboard.html  ← Halaman dashboard & database konseling
├── dashboard.css   ← CSS khusus dashboard
├── dashboard.js    ← Logic dashboard + JSONP fetch data real
├── Code.gs         ← Backend Google Apps Script
└── README.md       ← Panduan ini
```

> ⚠️ **Semua file harus berada dalam 1 folder yang sama.**

---

## 🚀 Cara Setup (3 Langkah)

### Step 1 — Buat Google Spreadsheet
1. Buka [sheets.google.com](https://sheets.google.com)
2. Buat spreadsheet baru → beri nama **"HCC Konseling Data"**
3. Copy **ID spreadsheet** dari URL:
   `https://docs.google.com/spreadsheets/d/`**`[ID_INI]`**`/edit`

---

### Step 2 — Deploy Google Apps Script
1. Buka [script.google.com](https://script.google.com) → **New Project**
2. Beri nama project: `HCC Konseling Backend`
3. Hapus semua isi default, paste seluruh isi file `Code.gs`
4. Ganti baris berikut dengan ID spreadsheet dari Step 1:
   ```js
   const SPREADSHEET_ID = "GANTI_DENGAN_ID_SPREADSHEET_ANDA";
   ```
5. Klik **Deploy → New Deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Klik **Deploy** → **Authorize** → Copy **Web app URL**

---

### Step 3 — Isi URL di config.js
Buka file `config.js`, ganti URL:
```js
var GAS_URL = "PASTE_URL_DARI_STEP_2_DI_SINI";
```

Simpan → buka `index.html` di browser. Selesai! ✅

---

## 📋 Fitur Lengkap

### Halaman Input (index.html)
| Step | Konten |
|------|--------|
| 1 | Hari, Tanggal & Jam, Nama Pemimpin, Nama COU, Region (dropdown 1-10), Konselor HCC (multi, bisa tambah/hapus) |
| 2 | 6 tombol topik toggle: Fakta & Temuan, Ide/Inovasi, Keluhan/Curhat, Kritikan, SOP & Compliance, Lain-lain — setiap topik punya narasi COU + Respon Konselor |
| 3 | Arahan & Tindak Lanjut (textarea) |
| 4 | Kesimpulan: Sangat Baik / Baik / Cukup / Perlu Perbaikan / Sangat Perlu Perbaikan |

### Halaman Dashboard (dashboard.html)
- **5 Stat Card**: Total Sesi, Sangat Baik, Baik, Perlu Perbaikan, Region Aktif
- **2 Grafik Bar**: Distribusi Kesimpulan & Sesi per Region
- **Tabel Data**: sorting, filter cari/region/kesimpulan, badge warna
- **Modal Detail**: lihat semua isi sesi lengkap per baris
- **Export CSV**: download semua data ke file `.csv`

---

## 📊 Struktur Spreadsheet (Auto-dibuat)

Sheet **"Data Konseling"** kolom:
`Timestamp | Hari | Tanggal & Jam | Nama Pemimpin | Nama COU | Region | Konselor HCC | Arahan & Tindak Lanjut | Kesimpulan | [per topik] Narasi COU | Respon Konselor`

Sheet **"Log Aktivitas"**: ringkasan cepat setiap sesi masuk.

---

## 🔧 Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Dashboard tidak muncul data | Pastikan `Code.gs` sudah di-deploy ulang setelah diedit |
| CORS error saat submit | Normal — submit pakai `no-cors`, data tetap tersimpan |
| `GAS_URL is not defined` | Pastikan `config.js` ada di folder yang sama |
| Data tidak masuk spreadsheet | Cek `SPREADSHEET_ID` di `Code.gs` sudah benar |

> Setiap kali edit `Code.gs`, wajib **Deploy ulang → New Version** agar perubahan aktif.

---

© 2025 Program Konseling HCC — Human Capital Counseling System
