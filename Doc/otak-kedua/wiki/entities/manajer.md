---
judul: Manajer (Role Admin)
tanggal_dibuat: 2026-08-12
tanggal_diupdate: 2026-08-12
kategori: entities
tag: [role, admin, persetujuan, otoritas]
---

# Manajer

Manajer (atau Manager) adalah sebuah role/otoritas khusus di tingkat Admin Panel yang berfungsi sebagai eskalasi persetujuan atas transaksi-transaksi yang memiliki risiko tinggi atau yang di luar wewenang operasional biasa (Kasir/Operator).

## Peran & Tanggung Jawab

- Melakukan review (tinjauan) terhadap transaksi Void yang diajukan oleh Fundraiser di lapangan.
- Memberikan persetujuan (Approve) agar transaksi Void bisa diteruskan dan diproses secara administratif oleh Kasir.
- Memberikan penolakan (Reject) jika pengajuan Void tidak beralasan atau melanggar prosedur.
- Memantau tren dan metrik Void melalui Dashboard Void.

## Hak Akses Sistem

Role `Manager` ini berada pada level *guard admin* di dalam sistem Fundata.
Permission khusus yang dimiliki:
- `akses-void-approval`: Kemampuan khusus untuk menyetujui atau menolak tiket transaksi berstatus `menunggu_manager`.

## Lihat Juga
- [[prosedur-void-transaksi]]
- [[direktur-operasional]]
