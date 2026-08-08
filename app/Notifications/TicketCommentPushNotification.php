<?php

namespace App\Notifications;

use App\Models\Record;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushMessage;
use NotificationChannels\WebPush\WebPushChannel;

class TicketCommentPushNotification extends Notification implements ShouldBroadcast, ShouldQueue
{
    use Queueable;

    protected $ticket;
    protected $senderName;
    protected $commentText;
    protected $url;

    /**
     * Create a new notification instance.
     */
    public function __construct(Record $ticket, $senderName, $commentText, $url)
    {
        $this->ticket = $ticket;
        $this->senderName = $senderName;
        $this->commentText = $commentText;
        $this->url = $url;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', WebPushChannel::class];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'ticket_comment',
            'ticket_id' => $this->ticket->id,
            'title' => 'Komentar Baru: Tiket #' . $this->ticket->id,
            'message' => $this->senderName . ' menambahkan komentar baru.',
            'url' => $this->url,
        ];
    }

    /**
     * Get the web push representation of the notification.
     */
    public function toWebPush($notifiable, $notification)
    {
        $faviconPath = \App\Models\SystemConfig::getValue('favicon_path');
        $iconUrl = $faviconPath ? url('/storage/' . $faviconPath) : url('/favicon.ico');

        return (new WebPushMessage)
            ->title('Komentar Baru: Tiket #' . $this->ticket->id)
            ->icon($iconUrl)
            ->body($this->senderName . ': ' . \Illuminate\Support\Str::limit($this->commentText, 100))
            ->action('Lihat Tiket', $this->url)
            ->data(['url' => $this->url]);
    }
}
