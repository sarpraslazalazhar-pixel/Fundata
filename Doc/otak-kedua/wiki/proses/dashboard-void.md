---
judul: Dashboard Void
tanggal_dibuat: 2026-08-12
tanggal_diupdate: 2026-08-12
kategori: proses
tag: [void, dashboard, manajer, approval, laporan]
---

# Dashboard Void

Halaman khusus Admin Panel untuk memantau dan memproses transaksi void (`/admin/void`, menu **Dashboard Void**).

## Akses
- Super Admin (otomatis).
- Admin dengan permission `akses-void-approval` (role Manajer).

## Komponen Halaman

### KPI Cards
| KPI | Sumber data |
|-----|-------------|
| Total Nominal Void | `SUM(nominal_void)` tiket void **disetujui** |
| Jumlah Transaksi Void | `COUNT(*)` tiket void **disetujui** |
| Menunggu Persetujuan | `COUNT(*)` status `menunggu_manager` |
| Fundraiser Void Aktif | `COUNT(DISTINCT user_id)` tiket void disetujui |

> **Semantik angka:** Hanya tiket yang sudah **disetujui Manajer** (status `open`, `on_proses`, `pending`, `solve`) yang dijumlahkan pada KPI nominal & jumlah. Void tertunda (`menunggu_manager`) atau ditolak (`reject`) tidak ikut dijumlah — ditampilkan di list.

### Filter
- Bulan & tahun (berlaku untuk semua data di halaman).
- Status: Semua / Menunggu Manajer / Disetujui / Ditolak.

### List Fundraiser
- Dikumpulkan per user: nama, username, jumlah transaksi void, total nominal void.
- Hanya void yang disetujui, diurutkan nominal terbesar, paginasi.

### List Transaksi Void
- Kolom: ID Data, tanggal, fundraiser, layanan, donatur, nominal void, status, aksi.
- Tiket `menunggu_manager` menampilkan tombol **Approve** / **Reject** langsung (Reject wajib catatan via dialog).
- Tiket lain menampilkan tombol **Detail** menuju halaman tiket.

## Implementasi
- Controller: `app/Http/Controllers/Admin/VoidController.php` (method `index`).
- Page: `resources/js/Pages/Admin/Void/Index.tsx`.
- Route: `GET /admin/void` → `admin.void.index` (middleware `permission:akses-void-approval`).
- Aksi approve/reject memakai route yang sama dengan Verifikasi Data:
  - `admin.data.approve-void` → `approveVoid` di `DataVerificationController`.
  - `admin.data.reject-void` → `rejectVoid` di `DataVerificationController`.
- Komponen aksi cepat bersama: `resources/js/Components/VoidDecisionButtons.tsx` (dipakai juga di Daftar Data).
- Dashboard utama hanya menampilkan kartu ringkas + link menuju halaman ini.

## Lihat Juga
- [[prosedur-void-transaksi]]
- [[pemisahan-nominal-void]]