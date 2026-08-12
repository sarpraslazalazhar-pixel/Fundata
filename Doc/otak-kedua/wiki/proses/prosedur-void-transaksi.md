---
judul: Prosedur Void Transaksi
tanggal_dibuat: 2026-08-12
tanggal_diupdate: 2026-08-12
kategori: proses
tag: [void, transaksi, approval, manajer, kasir, dashboard]
---

# Prosedur Void Transaksi

Prosedur berjenjang untuk menangani transaksi yang dibatalkan (void) guna memastikan keamanan dan mencegah penyalahgunaan wewenang oleh operator lapangan.

## Tujuan
Memastikan setiap transaksi donasi atau pembayaran yang dibatalkan (void) telah melalui proses verifikasi dan persetujuan dari pihak yang memiliki otoritas lebih tinggi (Manajer), sebelum kasir dapat membatalkan atau mengubah status tiket transaksi tersebut.

## Trigger
- Fundraiser / User memasukkan data transaksi baru melalui form.
- Transaksi terdeteksi sebagai "Void" jika:
  - Sub-unit / layanan yang dipilih bernama "Void".
  - Atau nominal void (`nominal_void`) terisi angka lebih dari 0.

## PIC (Person In Charge)
- **Fundraiser** (Input data)
- **[[manajer]]** (Persetujuan / Penolakan)
- **Kasir / Operator** (Pemrosesan akhir)

## Langkah-langkah

1. **Input Transaksi (Fundraiser)**
   - Fundraiser melakukan submit data transaksi.
   - Sistem mendeteksi bahwa ini adalah transaksi Void.
   - Sistem menetapkan status awal tiket menjadi `menunggu_manager`.
   - Sistem mengirim notifikasi ke admin berperan `akses-void-approval` (Manajer) bahwa ada void menunggu persetujuan.

2. **Verifikasi dan Persetujuan (Manajer)**
   - Manajer dapat meninjau dari halaman **Dashboard Void** (`/admin/void`, menu "Dashboard Void") atau daftar tiket di Data Verification.
   - Manajer dapat langsung **Approve/Reject dari list** (Reject wajib mengisi catatan via dialog) tanpa membuka detail tiket.
   - Manajer memeriksa tiket dengan status `menunggu_manager`.
   - Manajer memutuskan:
     - **Approve (Setuju):** Status tiket berubah menjadi `open` (Baru) agar bisa diproses Kasir. Fundraiser mendapatkan notifikasi.
     - **Reject (Tolak):** Status tiket berubah menjadi `reject` (Ditolak). Wajib menyertakan catatan penolakan. Fundraiser mendapatkan notifikasi berisi alasan penolakan.

3. **Pemrosesan Akhir (Kasir)**
   - Kasir tidak dapat memproses tiket selama statusnya masih `menunggu_manager` (status, prioritas, dan penugasan operator terkunci).
   - Setelah tiket disetujui (berstatus `open`), Kasir dapat memverifikasi dan mengubah statusnya menjadi `on_proses`, `solve`, atau `pending` seperti transaksi normal.

## Dashboard Void
- Halaman khusus di Panel Admin: **Dashboard Void** (`/admin/void`) — diakses oleh Super Admin dan admin berperan `akses-void-approval`.
- Menampilkan:
  - KPI: Total Nominal Void, Jumlah Transaksi Void, Menunggu Persetujuan, Fundraiser Void Aktif.
  - List fundraiser pengumpul void (nama, jumlah transaksi, total nominal).
  - List transaksi void lengkap dengan filter bulan/tahun/status dan aksi approve/reject cepat.
- **Semantik angka:** KPI (Total Nominal & Jumlah Transaksi) hanya menghitung void yang **sudah disetujui** (status `open`, `on_proses`, `pending`, `solve`). Void yang masih menunggu (`menunggu_manager`) atau ditolak (`reject`) tidak dijumlahkan.

## Output
- Transaksi void tercatat sah dan disetujui, atau ditolak secara sistem.
- Nominal void tercatat dan ditampilkan di "Dashboard Void" Admin Panel.
- Notifikasi keputusan diterima fundraiser; notifikasi pengajuan baru diterima Manajer.

## Lihat Juga
- [[manajer]]
- [[pemisahan-nominal-void]]
