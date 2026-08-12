<?php

namespace App\Notifications;

use App\Channels\WhatsAppChannel;
use App\Models\Record;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class VoidPendingApprovalNotification extends Notification implements ShouldBroadcast, ShouldQueue
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

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }

    public function toWebPush($notifiable, $notification)
    {
        $faviconPath = \App\Models\SystemConfig::getValue('favicon_path');
        $iconUrl = $faviconPath ? url('/storage/' . $faviconPath) : url('/favicon.ico');

        return (new \NotificationChannels\WebPush\WebPushMessage)
            ->title('Void Menunggu Persetujuan')
            ->icon($iconUrl)
            ->body($this->pesan())
            ->action('Tinjau Sekarang', route('admin.data.show', $this->ticket->id))
            ->data(['url' => route('admin.data.show', $this->ticket->id)]);
    }

    public function toDatabase(object $notifiable): array
    {
        return $this->toArray($notifiable);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'void_pending_approval',
            'ticket_id' => $this->ticket->id,
            'title' => 'Void Menunggu Persetujuan',
            'judul' => 'Void Menunggu Persetujuan',
            'message' => $this->pesan(),
            'pesan' => $this->pesan(),
            'url' => route('admin.data.show', $this->ticket->id),
            'aksi_url' => route('admin.data.show', $this->ticket->id),
        ];
    }

    private function pesan(): string
    {
        $pembuat = $this->ticket->user->name ?: $this->ticket->user->username;
        $layanan = $this->ticket->subUnit->nama_layanan ?? '-';
        $nominal = number_format((float) $this->ticket->nominal_void, 0, ',', '.');

        return "Pengajuan void {$layanan} dari {$pembuat} sebesar Rp {$nominal} menunggu persetujuan Anda.";
    }

    public function toWhatsApp(object $notifiable): array
    {
        $pembuat = $this->ticket->user->name ?: $this->ticket->user->username;
        $layanan = $this->ticket->subUnit->nama_layanan ?? '-';
        $nominal = number_format((float) $this->ticket->nominal_void, 0, ',', '.');
        $url = route('admin.data.show', $this->ticket->id);
        $namaAdmin = $notifiable->name ?? ($notifiable->nama ?? 'Admin');

        $message = "Halo *{$namaAdmin}* 👋\n\n";
        $message .= "Ada pengajuan *void {$layanan}* dari *{$pembuat}* sebesar *Rp {$nominal}* yang menunggu persetujuan Anda sebagai Manajer 😊\n\n";
        $message .= "Silakan tinjau dan setujui/tolak di sini:\n{$url}\n\n";
        $message .= "Terima kasih";

        return [
            'receiver' => $notifiable->no_wa,
            'message' => $message,
        ];
    }
}