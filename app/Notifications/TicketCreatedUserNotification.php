<?php

namespace App\Notifications;

use App\Channels\WhatsAppChannel;
use App\Models\Record;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class TicketCreatedUserNotification extends Notification implements ShouldBroadcast, ShouldQueue
{
    use Queueable;

    public $ticket;

    public function __construct(Record $ticket)
    {
        $this->ticket = $ticket;
    }

    public function via(object $notifiable): array
    {
        $channels = ['database', 'broadcast', \NotificationChannels\WebPush\WebPushChannel::class];
        if (!empty($notifiable->no_wa)) {
            $channels[] = WhatsAppChannel::class;
        }
        return $channels;
    }

    /**
     * Get the broadcastable representation of the notification.
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'type' => 'ticket_created',
            'ticket_id' => $this->ticket->id,
            'title' => 'Tiket Baru Berhasil Dibuat',
            'message' => 'Tiket Anda dengan layanan ' . ($this->ticket->subUnit->nama_layanan ?? '-') . ' telah kami terima dan akan segera diproses.',
            'url' => route('data.show', $this->ticket->id),
        ]);
    }

    public function toWebPush($notifiable, $notification)
    {
        $faviconPath = \App\Models\SystemConfig::getValue('favicon_path');
        $iconUrl = $faviconPath ? url('/storage/' . $faviconPath) : url('/favicon.ico');

        return (new \NotificationChannels\WebPush\WebPushMessage)
            ->title('Tiket Baru Berhasil Dibuat')
            ->icon($iconUrl)
            ->body('Tiket Anda dengan layanan ' . ($this->ticket->subUnit->nama_layanan ?? '-') . ' telah kami terima dan akan segera diproses.')
            ->action('Lihat Tiket', route('data.show', $this->ticket->id))
            ->data(['url' => route('data.show', $this->ticket->id)]);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'ticket_created',
            'ticket_id' => $this->ticket->id,
            'title' => 'Tiket Baru Berhasil Dibuat',
            'message' => 'Tiket Anda dengan layanan ' . ($this->ticket->subUnit->nama_layanan ?? '-') . ' telah kami terima dan akan segera diproses.',
            'url' => route('data.show', $this->ticket->id),
        ];
    }

    public function toWhatsApp(object $notifiable): array
    {
        $layanan = $this->ticket->subUnit->nama_layanan ?? '-';
        $nama = $notifiable->name ?: $notifiable->username;
        $url = route('data.show', $this->ticket->id);
        
        $message = "Halo *{$nama}*\n\n";
        $message .= "*{$layanan}* telah terdaftar di sistem ticketing Kami.\n\n";
        $message .= "Kamu bisa memantau status pengajuan melalui link berikut:\n{$url}\n\n";
        $message .= "Terima kasih,\n";
        $message .= "Tim Halo APU";

        return [
            'receiver' => $notifiable->no_wa,
            'message' => $message,
        ];
    }
}

