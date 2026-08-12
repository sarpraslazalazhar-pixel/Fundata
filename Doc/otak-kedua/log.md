# Log Wiki Otak Kedua

Log ini mencatat semua aktivitas wiki secara kronologis. Setiap entri menggunakan format standar untuk kemudahan parsing.

---

## [2026-08-12 17:40] update | Dashboard Void & Perbaikan Alur Persetujuan
- **Dibuat:**
  - Proses: [[dashboard-void]]
- **Update:**
  - Proses: [[prosedur-void-transaksi]]
- **Catatan:** Implementasi halaman Dashboard Void khusus (KPI, list fundraiser, list transaksi, aksi approve/reject cepat). KPI kini hanya menghitung void yang disetujui. Menambahkan notifikasi ke fundraiser saat approve/reject dan notifikasi ke Manajer saat void baru masuk. Memperkuat kuncian kasir (status, prioritas, penugasan) selama `menunggu_manager`. Manajer void kini selalu dapat melihat tiket `menunggu_manager`.

## [2026-08-12 15:10] update | Dokumentasi Alur Persetujuan Void
- **Dibuat:**
  - Proses: [[prosedur-void-transaksi]]
  - Entities: [[manajer]]
- **Catatan:** Menambahkan dokumentasi untuk fitur alur persetujuan transaksi Void secara berjenjang oleh role Manajer. Ini mencakup pembuatan role Manajer baru di Panel Admin dan implementasi halaman Dashboard Void.

## [2026-08-12 12:15] update | Dokumentasi Fitur Baru (Void & Notifikasi)
- **Dibuat:**
  - Proses: [[pemisahan-nominal-void]], [[sinkronisasi-notifikasi-chat]]
- **Catatan:** Menambahkan dokumentasi untuk fitur pemisahan nominal void dari jumlah donasi pada transaksi/laporan serta fitur perbaikan sinkronisasi real-time notifikasi chat pada layout aplikasi (termasuk deteksi path-aware di middleware Inertia untuk mencegah konflik sesi ganda).

## [2026-08-12 11:30] ingest | SOP Onboarding Klien Baru
- **Dibuat:**
  - Ringkasan Sumber: [[2026-08-12-sop-onboarding-klien]]
  - Proses: [[onboarding-klien]]
  - Konsep: [[kick-off-meeting]], [[sla]]
  - Entities: [[account-manager]], [[project-manager]], [[direktur-operasional]]
- **Catatan:** Ingest dokumen sumber pertama berupa SOP onboarding dari folder `raw/`. Semua relasi entitas, proses, dan konsep telah dihubungkan.

## [2026-08-12 11:20] setup | Inisialisasi Wiki

**Dibuat:**
- `CLAUDE.md` — Skema dan aturan wiki
- `index.md` — Katalog halaman
- `log.md` — File ini

**Struktur folder:**
- `raw/` — Untuk dokumen sumber
- `raw/assets/` — Untuk gambar dan lampiran
- `wiki/entities/` — Halaman entitas
- `wiki/konsep/` — Halaman konsep
- `wiki/proses/` — Halaman proses/SOP
- `wiki/sumber/` — Ringkasan sumber
- `wiki/sintesis/` — Analisis dan sintesis

**Status:** Wiki siap digunakan. Tambahkan sumber pertama ke `raw/` untuk memulai.

---

## Cara Membaca Log

Setiap entri memiliki format:
```
## [YYYY-MM-DD HH:MM] tipe | judul
```

**Tipe entri:**
- `setup` — Konfigurasi dan inisialisasi
- `ingest` — Menyerap sumber baru
- `query` — Menjawab pertanyaan
- `lint` — Pemeriksaan kesehatan wiki
- `update` — Perubahan pada skema atau struktur

**Parse dengan CLI:**
```bash
# 5 entri terakhir
grep "^## \[" log.md | tail -5

# Semua aktivitas hari ini
grep "2026-08-12" log.md

# Semua ingest
grep "ingest" log.md
```
