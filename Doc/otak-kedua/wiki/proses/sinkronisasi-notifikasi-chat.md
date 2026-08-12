---
judul: Sinkronisasi Notifikasi Chat Real-time
tanggal_dibuat: 2026-08-12
tanggal_diupdate: 2026-08-12
kategori: proses
tag: [chat, websocket, notifikasi, realtime]
---

# Sinkronisasi Notifikasi Chat Real-time

Dokumentasi mekanisme pembaruan dan sinkronisasi tanda notifikasi (badge/red dot) pesan belum dibaca di sidebar dan tabbar layout aplikasi secara real-time.

## 1. Tujuan
Memastikan indikator pesan masuk (badge jumlah unread) di sidebar (desktop) dan bottom tabbar (mobile) segera hilang ketika pengguna telah membuka/membaca ruang percakapan tersebut, serta bertambah secara real-time ketika ada pesan baru masuk dari orang lain.

## 2. Alur Sinkronisasi (Workflow)

```
[Pesan Baru / Aksi Membaca] ➔ [Pembaruan State Contacts] ➔ [Trigger Event 'messages-read'] ➔ [Layout Catch & Update Badge]
```

### Langkah 1: Aksi Pengguna & Pembaruan Server
- **Menerima Pesan:** Event `MessageSent` didengar melalui Laravel Echo. Jika chat aktif sedang terbuka, sistem otomatis memanggil fungsi `markAsRead`.
- **Membaca Chat:** Membuka percakapan memicu pemanggilan API `/api/messages/{chat_id}/read` untuk mengeset `is_read = true` di database.

### Langkah 2: Pembaruan State Lokal di ChatInterface
- **File:** `resources/js/Components/Chat/ChatInterface.tsx`
- **Pembersihan Unread:** State `contacts` di-map dan `unread_count` untuk kontak aktif dipaksa bernilai `0`.
- **Proteksi Polling:** Saat auto-polling berjalan setiap 6 detik (`fetchContacts` dan `fetchMessages`), unread count dari kontak aktif tetap dipaksa `0` pada client-side untuk mencegah race condition/stale data dari response server yang lambat memproses status baca.

### Langkah 3: Pengiriman Event Kustom
- Di dalam `ChatInterface.tsx`, terdapat `useEffect` yang mendeteksi perubahan state `contacts`.
- Fungsi menghitung total seluruh `unread_count` dari daftar kontak, lalu memicu event kustom browser:
  ```javascript
  window.dispatchEvent(new CustomEvent('messages-read', { detail: { unreadCount: total } }));
  ```

### Langkah 4: Pembaruan Badge di Layout
- **File:** `UserLayout.tsx` dan `AdminLayout.tsx`
- Layout mendengarkan event kustom `'messages-read'` dan memperbarui state lokal layout:
  ```javascript
  window.addEventListener('messages-read', (e) => {
      setUnreadMessagesCount(e.detail.unreadCount);
  });
  ```
- Komponen sidebar (desktop) dan `BottomNav` (mobile) merefleksikan jumlah tersebut secara instan tanpa perlu memuat ulang halaman.

### Langkah 5: Pencegahan Konflik Sesi Ganda (Admin & User)
- **File:** `app/Http/Middleware/HandleInertiaRequests.php`
- **Masalah:** Jika developer/pengguna masuk sebagai Admin sekaligus User dalam satu browser, inisialisasi Inertia sharing data akan memprioritaskan admin. Hal ini menyebabkan badge unread milik admin muncul di sidebar user dashboard, termasuk pesan milik user itu sendiri yang dikirim ke admin namun belum dibaca oleh admin.
- **Solusi (Path-Aware User Detection):** 
  Sistem mengecek path URL saat ini. Jika URL diawali dengan `/admin`, sistem memprioritaskan guard `admin` untuk menghitung pesan belum dibaca. Jika di luar path admin, guard `web` (user biasa) diprioritaskan terlebih dahulu.
  ```php
  $isAdminPath = $request->is('admin/*') || $request->is('admin');
  $user = $isAdminPath
      ? ($request->user('admin') ?: $request->user('web'))
      : ($request->user('web') ?: $request->user('admin'));
  ```

---
## Lihat Juga
- [[pemisahan-nominal-void]] (Proses)
