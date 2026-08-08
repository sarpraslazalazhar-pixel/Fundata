<?php

namespace App\Notifications;

use App\Channels\WhatsAppChannel;
use App\Models\ReminderConfig;
use App\Models\Record;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\SerializesModels;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class PendingTicketReminderNotification extends Notification implements ShouldBroadcast, ShouldQueue
{
    use Queueable, SerializesModels;

    protected int $hariPending;
    protected string $target;

    public function __construct(
        protected Record $ticket,
        string $target = 'admin'
    ) {
        $this->hariPending = (int) now()->diffInDays($this->ticket->updated_at);
        $this->target = $target; // 'admin' atau 'user'
    }

    public function via(object $notifiable): array
    {
        $channels = ['database', 'broadcast', WebPushChannel::class];
        
        if ($this->target === 'admin') {
            $config = ReminderConfig::where('jenis_reminder', 'pending_lama')->first();
            if ($config && is_array($config->channel_aktif)) {
                if (in_array('email', $config->channel_aktif)) {
                    $channels[] = 'mail';
                }
                if (in_array('whatsapp', $config->channel_aktif)) {
                    $channels[] = WhatsAppChannel::class;
                }
            }
        } elseif (!empty($notifiable->no_wa)) {
            // For user, simply send WA if available (or use a separate config)
            $channels[] = WhatsAppChannel::class;
        }

        return $channels;
    }

    public function toDatabase(object $notifiable): array
    {
        $judul = $this->target === 'admin' ? "Tiket Pending Lama" : "Tiket Membutuhkan Revisi";
        $status = $this->target === 'admin' ? "Pending" : "Revisi";
        $pesan = $this->target === 'admin' 
            ? "Tiket #{$this->ticket->formatted_id} \"{$this->ticket->judul}\" sudah pending selama {$this->hariPending} hari. Silakan tindak lanjuti."
            : "Tiket #{$this->ticket->formatted_id} \"{$this->ticket->judul}\" membutuhkan revisi. Harap segera perbaiki data Anda.";
        
        $url = $this->target === 'admin' ? "/admin/verifikasi-data/{$this->ticket->id}" : "/data/{$this->ticket->id}";

        return [
            'ticket_id' => $this->ticket->id,
            'judul_tiket' => $this->ticket->judul,
            'status' => $status,
            'hari_pending' => $this->hariPending,
            'unit' => $this->ticket->subUnit?->unit?->nama_unit,
            'sub_unit' => $this->ticket->subUnit?->nama_layanan,
            'judul' => $judul,
            'title' => $judul, // added title for backward compatibility
            'pesan' => $pesan,
            'message' => $pesan, // added message
            'icon' => 'clock',
            'aksi_url' => $url,
            'url' => $url,
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        $dbData = $this->toDatabase($notifiable);
        return new BroadcastMessage($dbData);
    }

    public function toWebPush($notifiable, $notification)
    {
        $dbData = $this->toDatabase($notifiable);
        $faviconPath = \App\Models\SystemConfig::getValue('favicon_path');
        $iconUrl = $faviconPath ? url('/storage/' . $faviconPath) : url('/favicon.ico');

        return (new WebPushMessage)
            ->title($dbData['judul'])
            ->icon($iconUrl)
            ->body($dbData['pesan'])
            ->action('Lihat Tiket', url($dbData['aksi_url']))
            ->data(['url' => url($dbData['aksi_url'])]);
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = $this->target === 'admin' ? url("/admin/verifikasi-data/{$this->ticket->id}") : url("/data/{$this->ticket->id}");
        $status = $this->target === 'admin' ? 'Pending' : 'Revisi';
        
        return (new MailMessage)
            ->subject("Pengingat Tiket {$status} — #{$this->ticket->formatted_id}")
            ->greeting("Halo, {$notifiable->name}!")
            ->line("Tiket berikut sudah dalam status {$status} selama **{$this->hariPending} hari**:")
            ->line("**Tiket:** #{$this->ticket->formatted_id} — {$this->ticket->judul}")
            ->line("**Unit:** {$this->ticket->subUnit?->unit?->nama_unit}")
            ->line("**Menunggu Sejak:** {$this->ticket->updated_at->format('d M Y H:i')}")
            ->action('Lihat Tiket', $url)
            ->line('Mohon segera ditindaklanjuti.');
    }

    public function toWhatsApp(object $notifiable): array
    {
        $namaPenerima = $notifiable->name ?? ($notifiable->nama ?? ($notifiable->username ?? ''));
        $url = $this->target === 'admin' ? url("/admin/verifikasi-data/{$this->ticket->id}") : url("/data/{$this->ticket->id}");
        $status = $this->target === 'admin' ? 'Pending' : 'Revisi';

        $message = "Halo *{$namaPenerima}* 👋\n\n";
        $message .= "Ada info pengingat nih. Pengajuan *{$this->ticket->formatted_id}* udah berstatus {$status} selama {$this->hariPending} hari ya 😊\n\n";
        $message .= "Biar lebih jelas, langsung aja cek detailnya di sini:\n{$url}\n\n";
        $message .= "Terima kasih";

        return [
            'receiver' => $notifiable->no_wa,
            'message' => $message,
        ];
    }
}
