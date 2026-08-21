<?php

namespace App\Console\Commands;

use App\Models\Message;
use Illuminate\Console\Command;

class PruneOldMessagesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'messages:prune {--days=7 : Umur pesan dalam hari sebelum dihapus}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Hapus pesan chat dan file lampiran yang usianya sudah lebih dari 7 hari secara permanen';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $days = (int) $this->option('days');
        $cutoffDate = now()->subDays($days);

        $this->info("Mencari pesan yang dibuat sebelum {$cutoffDate->toDateTimeString()} (lebih dari {$days} hari)...");

        $oldMessages = Message::where('created_at', '<', $cutoffDate)->get();
        $count = $oldMessages->count();

        if ($count === 0) {
            $this->info('Tidak ada pesan lama yang perlu dihapus.');
            return Command::SUCCESS;
        }

        $deletedAttachments = 0;
        foreach ($oldMessages as $msg) {
            if ($msg->attachment_path) {
                $deletedAttachments++;
            }
            $msg->delete(); // Memicu event static::deleting() di model Message untuk hapus file di storage
        }

        $this->info("Berhasil menghapus {$count} pesan lama dan {$deletedAttachments} file lampiran.");

        return Command::SUCCESS;
    }
}
