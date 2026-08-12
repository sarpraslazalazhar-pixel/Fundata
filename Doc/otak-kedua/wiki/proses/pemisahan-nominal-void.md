---
judul: Pemisahan Nominal Void dan Donasi
tanggal_dibuat: 2026-08-12
tanggal_diupdate: 2026-08-12
kategori: proses
tag: [database, transaksi, void, donasi, laporan]
---

# Pemisahan Nominal Void dan Donasi

Dokumentasi alur dan mekanisme pemisahan pencatatan antara jumlah donasi (transaksi normal) dan nominal void (transaksi pembatalan/penyesuaian) di dalam sistem.

## 1. Tujuan
Mencegah nominal transaksi void (pembatalan/penyesuaian bukti setor) mengotori metrik total donasi terkumpul pada dashboard admin, dashboard fundraiser, leaderboard, serta laporan keuangan sistem.

## 2. Peta Alur Kerja (Workflow)

```
[User Input Form Void] ➔ [DataInputController Deteksi Sub-Unit] ➔ [Pemisahan Kolom Database] ➔ [Penyajian & Laporan Terpisah]
```

### Langkah 1: Penginputan Form oleh Pengguna
- **PIC:** Pengguna (User/Fundraiser)
- Pengguna memilih subunit layanan pembatalan (misal: "Permintaan Void" atau "Void Bukti Setor").
- Pengguna memasukkan nilai nominal yang ingin di-void pada field nominal form dinamis.

### Langkah 2: Deteksi Jenis Sub-Unit oleh Controller
- **File:** `app/Http/Controllers/User/DataInputController.php`
- Saat form disubmit, controller mendeteksi nama layanan dari sub-unit yang bersangkutan menggunakan pencarian kata kunci `"void"` (case-insensitive).
- Jika terdeteksi mengandung kata `"void"`, variabel `$isVoid` diset ke `true`.

### Langkah 3: Pemisahan Kolom di Database
- **Kolom Database:** Tabel `tickets` memiliki dua kolom desimal:
  - `jumlah_donasi` (untuk transaksi donasi riil/normal).
  - `nominal_void` (untuk transaksi void/pembatalan).
- **Proses Penyimpanan:**
  - Jika `$isVoid = true`, nilai nominal yang diekstrak dimasukkan ke kolom `nominal_void` (kolom `jumlah_donasi` diset `null`/`0`).
  - Jika `$isVoid = false`, nilai nominal dimasukkan ke kolom `jumlah_donasi` (kolom `nominal_void` diset `null`/`0`).

### Langkah 4: Penyajian dan Laporan
- **Dashboard & Leaderboard:** Penjumlahan total donasi hanya menggunakan query `SUM(jumlah_donasi)`. Nilai `nominal_void` otomatis tidak terhitung sehingga metrik donasi tetap akurat.
- **Tampilan Riwayat & Detail (User & Admin):**
  - Jika `nominal_void` terisi, data ditampilkan dengan format merah `(Void) Rp X.XXX` (misal pada `Riwayat.tsx` dan `Detail.tsx`).
  - Laporan semua data lunas (`Laporan/Data.tsx`) menampilkan nominal void dengan format kurung merah `(Rp X.XXX)` berkategori negatif.

---
## Lihat Juga
- [[sinkronisasi-notifikasi-chat]] (Proses)
