<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

class SchedulerController extends Controller
{


    /**
     * Jalankan command reminder booking secara manual.
     */
    public function runBookingReminder()
    {
        try {
            Artisan::call('reminder:booking');
            $output = trim(Artisan::output());
            Log::info('Manual Booking Reminder executed', ['output' => $output]);
            return back()->with('success', 'Booking Reminder berhasil dijalankan. ' . $output);
        } catch (\Exception $e) {
            Log::error('Manual Booking Reminder failed', ['error' => $e->getMessage()]);
            return back()->with('error', 'Gagal menjalankan Booking Reminder: ' . $e->getMessage());
        }
    }

    /**
     * Jalankan command reminder pending ticket secara manual.
     */
    public function runPendingReminder()
    {
        try {
            Artisan::call('reminder:pending');
            $output = trim(Artisan::output());
            Log::info('Manual Pending Reminder executed', ['output' => $output]);
            return back()->with('success', 'Pending Reminder berhasil dijalankan. ' . $output);
        } catch (\Exception $e) {
            Log::error('Manual Pending Reminder failed', ['error' => $e->getMessage()]);
            return back()->with('error', 'Gagal menjalankan Pending Reminder: ' . $e->getMessage());
        }
    }

    /**
     * Jalankan semua scheduler sekaligus.
     */
    public function runAll()
    {
        $results = [];
        $commands = [
            'reminder:booking' => 'Booking Reminder',
            'reminder:pending' => 'Pending Reminder',
        ];

        foreach ($commands as $command => $label) {
            try {
                Artisan::call($command);
                $results[] = "✅ {$label}: " . trim(Artisan::output());
            } catch (\Exception $e) {
                $results[] = "❌ {$label}: " . $e->getMessage();
            }
        }

        Log::info('Manual Run All Schedulers', ['results' => $results]);
        return back()->with('success', implode(' | ', $results));
    }
}
