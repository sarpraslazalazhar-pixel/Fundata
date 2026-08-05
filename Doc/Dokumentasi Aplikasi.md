# Dokumentasi Aplikasi Fundata

**Fundata** — Aplikasi input data donatur (Funding & Fundraising Data Management) untuk LAZ Al-Azhar.

> Berasal dari rebrand Halo APU V2 (Helpdesk System) menjadi aplikasi pengelolaan data funding & fundraising.

---

## 1. Ringkasan

Fundata dipakai untuk mencatat dan mengelola transaksi donasi dari pengumpul (fundraiser) di lapangan: input donasi via form dinamis per program, upload bukti, verifikasi oleh admin/verifikator, sampai laporan donasi per cabang, per unit organisasi, dan per periode.

## 2. Tech Stack

| Lapisan | Teknologi |
|---|---|
| Backend | Laravel 13 (PHP 8.3), Eloquent ORM |
| Frontend | React 19 + Inertia.js v3 + TypeScript |
| UI | Tailwind CSS 4 + Shadcn-style components + Lucide Icons |
| Realtime | Laravel Reverb + Laravel Echo |
| Auth | Dual guard: `user` (Fundraiser) & `admin` (Operator/Admin) |
| Permission | Spatie Laravel Permission (guard `admin`) |
| Notifikasi | Database + Broadcast + WebPush (VAPID) + WhatsApp (Watzap) |
| Storage | Local public disk (`storage/app/public`) |
| Build | Vite 8 |
| Pengujian | PHPUnit / Pest (suite sedang rusak — lihat bagian Status) |

## 3. Arsitektur & Alur Data

```
Divisi/Unit Organisasi ── User (Fundraiser)
                          │ input
                          ▼
Unit Layanan ── Sub Unit (program) ── Form Fields (form dinamis)
                          │
                    Transaksi (tabel tickets, model Record)
                    ├── form_data (JSON)
                    ├── lampiran (bukti transfer/foto)
                    ├── donatur_id ── Donatur
                    ├── campaign_id ── Campaign
                    ├── log aktivitas (ticket_logs)
                    └── assigned_admin_id ── Admin (verifikator)
```

## 4. Role & Alur Kerja

| Role | Akses |
|---|---|
| **Fundraiser** (User) | Login, input data donasi (wizard 4 langkah), riwayat & detail data, kirim jawaban/revisi, terima hasil, chat, profil |
| **Operator / Verifikator** (Admin) | Dashboard, verifikasi data (assign/status/prioritas), kelola donatur + import Excel, laporan & export, chat, notifikasi |
| **Super Admin** (Admin) | Semua di atas + manajemen user/operator/peran, master data, peraturan form (form builder), konfigurasi sistem, campaign, akad, metode pembayaran |

Status transaksi saat ini (belum seragam casing-nya):
`open → on_proses → solve / reject`, plus `pending`, `waiting_approval`, `need_revision`, `Selesai`.

> PRD mengusulkan alur funding: `diajukan → diverifikasi → selesai`, bisa `ditolak` + revisi. **Belum diterapkan** — status kode masih memakai terminologi helpdesk.

## 5. Modul Utama

### 5.1 User (Fundraiser)
- **Dashboard**: total donasi pribadi, peringkat/leaderboard cabang, tren donasi, progress campaign.
- **Input Data** (`/data/buat`): wizard 4 langkah — pilih kategori (unit) → isi form dinamis (termasuk dropdown dependen divisi/unit org, lookup donatur, metode bayar, akad, campaign, info peraturan) → lampiran → tinjau & simpan.
- **Data Saya** (`/data/saya`): riwayat transaksi + filter, detail dengan timeline & lampiran, aksi batal/jawab/minta revisi/terima hasil.
- **Pesan** (`/pesan`): chat realtime dengan admin/verifikator, bisa menautkan data transaksi.

### 5.2 Admin
- **Dashboard**: statistik donasi, donasi per cabang, top fundraiser/donatur, grafik bulanan/per unit, progress campaign, filter tanggal.
- **Verifikasi Data** (`/admin/verifikasi-data`): queue transaksi, assign ke operator, ubah status/prioritas, download/view lampiran.
- **Laporan Data**: tabel laporan + export CSV dari form_data (permission `akses-laporan`).
- **Donatur**: CRUD, persetujuan (approve), riwayat, import massal Excel (upload → preview valid/duplikat/invalid → konfirmasi).
- **Master Data**: unit & sub-unit layanan, divisi/unit organisasi/jabatan, metode pembayaran (transfer/e-wallet/QRIS/cash), campaign, akad (hirarki).
- **Peraturan Form**: form builder per sub-unit — 16 tipe field, field kondisional (parent/trigger), drag-drop urutan, preview.
- **Konfigurasi**: branding (logo/favicon/banner/suara), WhatsApp gateway, jam kerja, timezone, maintenance cache.
- **Manajemen**: user, operator, peran + izin (6 grup permission).
- **Pesan & Notifikasi**: pusat notifikasi admin (read/snooze/done), chat realtime.

## 6. Skema Database (ringkas)

| Tabel | Isi |
|---|---|
| `users` | Fundraiser (nama, email, no_wa, divisi/unit org/jabatan) |
| `admins` | Operator/verifikator (username, email, no_wa) |
| `org_divisi`, `org_unit`, `org_jabatan` | Struktur organisasi |
| `units`, `sub_units` | Kategori layanan & program (sub-unit punya `is_revision_enabled`) |
| `form_fields` | Definisi form dinamis (label, tipe, opsi, field kondisional, urutan) |
| `tickets` | Transaksi (model `Record`): form_data JSON, status, priority, donatur_id, campaign_id, jumlah_donasi, assigned_admin_id |
| `ticket_attachments` | Lampiran bukti (file_path, mime, ukuran) |
| `ticket_logs` | Log aktivitas (aksi, catatan, admin) |
| `donaturs` | Data donatur (tipe Individu/Organisasi, is_approved) |
| `campaigns` | Campaign fundraising (target dana, banner, periode, is_active) |
| `akads` | Akad/layanan donasi (hirarki parent-child, is_campaign_required) |
| `payment_methods` | Metode bayar (rekening, QRIS, instruksi, kategori) |
| `conversations`, `messages` | Chat (participant morphs, context morphs, lampiran base64→file) |
| `roles`, `permissions`, pivot | Spatie permission |
| `system_configs` | Konfigurasi key-value |
| `reminder_configs` | (tidak terpakai — scheduler sudah dihapus) |
| `room_vehicle_bookings` | (tidak terpakai — fitur booking tidak dipertahankan) |
| `push_subscriptions` | Web push per user/admin |

## 7. Routing Penting

- Publik: `/`, `/tv` (bermasalah, lihat Status), `/login`, `/register`, `/lupa-password`
- User (guard `web`): `/dashboard`, `/data/buat`, `/data/saya`, `/data/{record}*`, `/pesan`, `/profil`
- Admin (guard `admin`, prefix `/admin`): `/dashboard`, `/verifikasi-data/*`, `/laporan/data`, `/donatur*`, `/master/*`, `/peraturan-form/*`, `/konfigurasi`, `/manajemen-*`, `/notifications`, `/pesan`
- API (semua **tanpa auth** — perlu diwaspadai): `/api/org-units/{id}`, `/api/sub-units/{id}`, `/api/form-fields/{id}`, `/api/donatur/search`, `/api/donatur/quick-store`, `/api/messages/*` (yang terakhir auth)
- Sistem: `POST /admin/system/optimize` & `/admin/system/clear` (auth + permission `akses-konfigurasi`)

## 8. Catatan Keamanan yang Sudah Ditutup

- ✅ Route publik `GET /system/optimize` & `/system/clear` (bisa cache-clear/DoS oleh siapa pun) — sudah dihapus, diganti POST terproteksi di `/admin/system/*`.
- ✅ Tombol scheduler manual yang menunjuk route tak ada — sudah dihapus (tab "Sistem" menggantikan tab "Scheduler").

## 9. Status & Masalah Dikenal (penting dibaca)

Proyek ini sedang dalam **migrasi setengah jalan dari helpdesk (Halo APU) ke Fundata**. Model `Ticket` sudah direname menjadi `Record` (tabel tetap `tickets`), tetapi banyak sisa yang patah:

1. **Kelas `App\Models\Ticket` tidak ada** tapi masih dirujuk: `User::tickets()`, `RoomVehicleBooking::ticket()`, `PendingTicketReminderCommand`, `TvDashboardController` (route `/tv` 500), `UserManagementController::destroy`.
2. **Fitur helpdesk dihapus tapi masih dirujuk**: `Csat`, `SlaConfig`, `TicketSlaTracking`, `SlaCalculator` (folder app/Services tidak ada). Akibatnya:
   - Seluruh `tests/Feature/CsatTest.php`, `tests/Unit/SlaCalculator*` gagal → **test suite merah (34 error)**.
   - `database/seeders/SlaConfigSeeder` dipanggil `DatabaseSeeder` → seed gagal.
3. **Notifikasi user/operator** memakai `route('tiket.show')` / `route('admin.tiket.show')` yang tidak ada di `routes/web.php` → notifikasi user tidak terkirim.
4. **Route publik tanpa proteksi**: `/api/donatur/quick-store`, dropdown API, `/api/donatur/search` (tanpa filter is_approved).
5. **`/admin/verifikasi-data/*` tanpa middleware permission**; download/view lampiran tanpa cek kepemilikan (admin unit lain bisa unduh lampiran unit mana pun).
6. **Chat attachment**: mime type dari klien disimpan dan dipakai inline → potensi XSS (`text/html`).
7. **`Record` generate ID acak 9 digit** padahal kolom PK auto-increment.
8. **`acceptResult` salah digerbang** `is_revision_enabled` (sub-unit tanpa revisi → user tak bisa terima hasil).
9. Status transaksi tidak konsisten casing (`open`, `solve`, `Selesai`, `waiting_approval`, `need_revision`, ...).
10. `DonaturImport` = stub kosong; script `fix_*.php`, `check_bookings.php`, `dump_db.php` di root = sisa refactor sekali jalan.

## 10. Setup Lokal

```bash
composer install
npm install
cp .env.example .env   # set DB, APP_URL
php artisan key:generate
php artisan migrate --seed   # ⚠️ seeder error: SlaConfigSeeder — perlu dihapus dulu dari DatabaseSeeder
npm run dev             # terminal 1
php artisan serve       # terminal 2
```

Untuk shared hosting tanpa SSH, cache bisa dioptimalkan/dibersihkan dari menu **Konfigurasi → Sistem** (harus login sebagai admin dengan izin `akses-konfigurasi`).

## 11. Prioritas Perbaikan Berikutnya

1. Selesaikan rename `Ticket` → `Record` (hapus referensi kelas tak ada, perbaiki `TvDashboardController`).
2. Tutup endpoint API publik tanpa auth (`quick-store`, dropdown, search donatur).
3. Perbaiki route notifikasi (`tiket.show`/`admin.tiket.show`) → route `data.show`/`admin.data.show`.
4. Tambah permission di `/admin/verifikasi-data/*` + cek kepemilikan lampiran.
5. Bersihkan test suite & seeder dari referensi CSAT/SLA/CSAT yang sudah dihapus.
6. Terapkan terminologi funding (PRD Fase 1–5): status `diajukan → diverifikasi → selesai`, label UI "Data/Transaksi", ganti ikon helpdesk.
