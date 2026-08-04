# PRD: Fundata — Aplikasi Manajemen Funding & Fundraising

**Versi:** 1.0  
**Status:** Final  
**Tanggal:** 30 Juli 2026  
**Dari:** Halo APU V2 (Helpdesk System)  
**Menjadi:** Fundata (Funding & Fundraising Data Management)

---

## 1. Visi Produk

Aplikasi untuk mengelola data transaksi funding dan fundraising — mulai dari input data donasi oleh pengumpul (fundraiser), verifikasi oleh admin, monitor progress campaign, hingga laporan agregat per cabang/periode.

---

## 2. User Persona & Roles

| Role | Deskripsi | Kemampuan |
|---|---|---|
| **Fundraiser** (User) | Pengumpul donasi di lapangan | Input donasi, lihat riwayat, upload bukti |
| **Operator / Verifikator** (Admin) | Staff yang memverifikasi & mengelola data | Verifikasi transaksi, kelola campaign, lihat laporan |
| **Super Admin** | Pengelola penuh sistem | Semua akses termasuk konfigurasi, user management, peran |

---

## 3. Status Saat Ini (Sudah Berubah dari Halo APU)

| Area | Status |
|---|---|
| **App Name** | ✅ `APP_NAME="Fundata"` |
| **Primary Color** | ✅ Hijau (`#0F7B46`) — sudah diganti dari biru |
| **User Dashboard** | ✅ Konten donasi: total donasi, leaderboard, campaign progress, tren donasi |
| **Layout Labels** | ✅ "Input Data", "Data Saya", "Verifikasi Data", "Kategori Data", "Verifikator" |
| **Campaign** | ✅ Campaign fundraising sudah terintegrasi penuh |
| **Dashboard Admin** | ✅ Statistik donasi, top donatur, progress campaign, leaderboard |

---

## 4. Fitur Core

### 4.1 Manajemen Campaign Fundraising
- CRUD campaign: nama, deskripsi, target dana, banner, periode
- Progress bar: `(total donasi / target dana)`
- Filter campaign aktif/non-aktif

### 4.2 Input Data Transaksi
- Form dinamis per jenis program (dari Dynamic Form Builder)
- Field khusus: Nama Donatur, Jumlah Donasi (Rp), Campaign, metode bayar
- Upload bukti transfer/foto
- Auto-extract nama donatur & jumlah donasi dari form_data

### 4.3 Riwayat Transaksi
- List transaksi milik fundraiser sendiri
- Filter: status, campaign, tanggal
- Detail: form data, lampiran, log aktivitas

### 4.4 Verifikasi Data
- Queue transaksi yang perlu diverifikasi
- Workflow status yang diusulkan:
  - `diajukan` → `diverifikasi` → `selesai`
  - Bisa `ditolak` dengan catatan
- Assign ke operator tertentu

### 4.5 Dashboard & Laporan
- Card stats: total donasi, total donatur, total transaksi, campaign aktif
- Top 10 Fundraiser (pengumpul terbanyak)
- Top 10 Donatur (nominal terbesar)
- Progress Campaign (card per campaign dengan progress bar)
- Grafik: bulanan, per unit organisasi, per cabang
- Laporan per cabang: breakdown donasi per divisi/unit organisasi

### 4.6 Notifikasi
- Notifikasi in-app untuk fundraiser (transaksi diverifikasi/ditolak)
- Notifikasi untuk admin (ada transaksi baru masuk)
- WhatsApp notification
- Push notification browser

---

## 5. Perubahan yang Masih Diperlukan

### 5.1 Bersihkan Sisa Terminologi Helpdesk

| Lokasi | Teks Saat Ini | Usulan |
|---|---|---|
| `UserLayout.tsx` | "tiket baru" di teks notifikasi | "transaksi baru" atau "data baru" |
| `User/Dashboard.tsx` | Label "Jumlah Data (Tiket)" | "Jumlah Data (Transaksi)" |
| `User/Dashboard.tsx` | Status: "Data Aktif", "Sedang Diproses", "Selesai", "Ditolak" | Bisa dipertahankan atau disesuaikan |
| `AdminLayout.tsx` | Icon `Ticket` untuk Verifikasi Data | Ganti icon yang lebih sesuai (ClipboardCheck, FileCheck) |

### 5.2 Ikoni yang Masih Helpdesk

Beberapa ikon `lucide-react` masih bernuansa tiket:
- `Ticket` di `AdminLayout.tsx` → ganti `ClipboardCheck` atau `FileCheck`

### 5.3 File Dokumentasi

| File | Keterangan |
|---|---|
| `PROJECT.md` | Masih referensi Halo APU & CSAT Phase 5 — perlu diperbarui |
| `welcome.blade.php` | Template Laravel default (tidak dipakai, tidak perlu diubah) |

---

## 6. Arsitektur Teknis

### Stack
- **Backend**: Laravel 13 + Eloquent ORM
- **Frontend**: React 19 + Inertia.js + TypeScript
- **UI**: Tailwind CSS 4 + Shadcn UI + Lucide React
- **Database**: MySQL
- **Realtime**: Laravel Reverb + Echo
- **File Storage**: Public disk (`storage/app/public/`)
- **Auth**: Dual guard (`user` untuk Fundraiser, `admin` untuk Operator/Admin)

### Data Model Inti

```
Campaign (1) ──< (N) Transaksi (tickets) >── (N) Fundraiser (users)
                              │
                    ┌─────────┼─────────┐
                    │         │         │
              Form Data   Attachments   Logs
              (JSON)      (bukti)      (aktivitas)
```

### Status Workflow

```
diajukan  ──→  diverifikasi  ──→  selesai
    │                               ↑
    └──→  ditolak  ────────────────┘
              │
              └── revisi → diajukan ulang
```

---

## 7. Fitur yang Tidak Dipertahankan (Hidden/Diabaikan)

| Fitur | Alasan |
|---|---|
| SLA Tracking | Tidak relevan untuk funding |
| CSAT / Rating | Tidak relevan |
| Monitor Ruang/Kendaraan | Tidak relevan |
| Booking | Tidak relevan |
| TV Dashboard | Tidak relevan |

---

## 8. Prioritas Implementasi

| Fase | Item | Status |
|---|---|---|
| **Fase 0** | Rebrand warna, nama, layout | ✅ SELESAI |
| **Fase 1** | Bersihkan sisa terminologi helpdesk di UI | ⏳ BELUM |
| **Fase 2** | Sesuaikan workflow status funding | ⏳ BELUM |
| **Fase 3** | Sembunyikan fitur helpdesk yang tidak relevan | ⏳ BELUM |
| **Fase 4** | Adaptasi Dashboard & Laporan fokus funding | ⏳ BELUM |
| **Fase 5** | Role Fundraiser + Verifikator | ⏳ BELUM |

---

## 9. Catatan Tambahan

- Transformasi dilakukan dengan pendekatan **rebrand ringan** — struktur database tetap, tidak perlu migrasi besar
- Fokus pada perubahan UI/UX, terminologi, dan workflow
- Fitur dynamic form builder tetap dipertahankan karena esensial untuk input data funding
- Sistem notifikasi tetap dipertahankan (WhatsApp + In-App + Push)
