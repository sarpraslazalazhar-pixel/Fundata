<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushMessage;
use NotificationChannels\WebPush\WebPushChannel;

class NewMessageNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $message;
    public $senderName;

    /**
     * Create a new notification instance.
     */
    public function __construct($message, $senderName)
    {
        $this->message = $message;
        $this->senderName = $senderName;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return [WebPushChannel::class];
    }

    public function toWebPush($notifiable, $notification)
    {
        $faviconPath = \App\Models\SystemConfig::getValue('favicon_path');
        $iconUrl = $faviconPath ? url('/storage/' . $faviconPath) : url('/favicon.ico');

        return (new WebPushMessage)
            ->title('Pesan Baru dari ' . $this->senderName)
            ->icon($iconUrl)
            ->body($this->message->body)
            ->action('Lihat Pesan', 'view_message')
            ->data(['url' => url('/')]); // or url('/messages')
    }
}
