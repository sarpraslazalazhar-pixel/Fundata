<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NotificationController extends Controller
{
    /**
     * Ambil jumlah notifikasi yang belum dibaca.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $count = $request->user()
            ->unreadNotifications()
            ->count();

        return response()->json([
            'unread_count' => $count,
        ]);
    }

    /**
     * Halaman semua notifikasi.
     */
    public function index(Request $request)
    {
        $query = $request->user()->notifications();

        // Filter: status
        $status = $request->get('status');
        if ($status === 'unread') {
            $query->whereNull('read_at');
        } elseif ($status === 'read') {
            $query->whereNotNull('read_at');
        }

        // Filter: tipe
        $type = $request->get('type');
        if ($type) {
            $query->where('type', 'LIKE', "%{$type}%");
        }

        $notifications = $query->latest()->paginate(20);

        if ($request->wantsJson()) {
            return response()->json([
                'notifications' => $notifications
            ]);
        }

        // Jika halaman index untuk user belum ada, bisa diarahkan ke dashboard atau dibuat view baru
        return Inertia::render('User/Notifications/Index', [
            'notifications' => $notifications,
            'filters' => [
                'status' => $status,
                'type' => $type,
            ],
        ]);
    }

    /**
     * Tandai satu notifikasi sebagai sudah dibaca.
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()
            ->notifications()
            ->findOrFail($id);

        $notification->markAsRead();

        return response()->json(['success' => true]);
    }

    /**
     * Snooze notifikasi.
     */
    public function snooze(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'snooze_minutes' => 'required|integer|in:15,30,60,120,1440',
        ]);

        $notification = $request->user()
            ->notifications()
            ->findOrFail($id);

        $data = $notification->data;
        $data['snoozed_until'] = now()->addMinutes($validated['snooze_minutes'])->toISOString();
        $data['snoozed'] = true;

        $notification->update([
            'data' => $data,
            'read_at' => now(), // Mark as read saat di-snooze
        ]);

        return response()->json([
            'success' => true,
            'snoozed_until' => $data['snoozed_until'],
        ]);
    }

    /**
     * Tandai notifikasi sebagai selesai (done).
     */
    public function markAsDone(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()
            ->notifications()
            ->findOrFail($id);

        $data = $notification->data;
        $data['done_at'] = now()->toISOString();

        $notification->update([
            'data' => $data,
            'read_at' => $notification->read_at ?? now(),
        ]);

        return response()->json(['success' => true]);
    }

    /**
     * Tandai semua notifikasi sebagai sudah dibaca.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json(['success' => true]);
    }
}
