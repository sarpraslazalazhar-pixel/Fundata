<?php

use Illuminate\Support\Facades\Schedule;
use App\Models\Record;
use App\Models\Admin;
use App\Models\Message;
use App\Notifications\PendingTicketReminderNotification;

Schedule::call(function () {
    // 1. Tiket Pending > 1 Hari (Ingatkan Admin)
    $pendingRecords = Record::where('status', 'Pending')
        ->where('updated_at', '<=', now()->subDay())
        ->get();

    if ($pendingRecords->count() > 0) {
        $admins = Admin::where('is_superadmin', true)->get();
        foreach ($pendingRecords as $record) {
            foreach ($admins as $admin) {
                $admin->notify(new PendingTicketReminderNotification($record, 'admin'));
            }
        }
    }

    // 2. Tiket Revisi > 1 Hari (Ingatkan User)
    $revisiRecords = Record::where('status', 'Revisi')
        ->where('updated_at', '<=', now()->subDay())
        ->get();

    foreach ($revisiRecords as $record) {
        if ($record->user) {
            $record->user->notify(new PendingTicketReminderNotification($record, 'user'));
        }
    }

    // 3. Auto-delete Pesan Chat > 7 Hari
    $oldMessages = Message::where('created_at', '<', now()->subDays(7))->get();
    foreach ($oldMessages as $msg) {
        $msg->delete(); // Memanggil event deleting di model untuk hapus attachment
    }
})->daily();
