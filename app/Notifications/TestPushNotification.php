<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushMessage;
use NotificationChannels\WebPush\WebPushChannel;

class TestPushNotification extends Notification
{
    public function via($notifiable)
    {
        return [WebPushChannel::class];
    }

    public function toWebPush($notifiable, $notification)
    {
        $faviconPath = \App\Models\SystemConfig::getValue('favicon_path');
        $iconUrl = $faviconPath ? url('/storage/' . $faviconPath) : url('/favicon.ico');

        return (new WebPushMessage)
            ->title('Test Notifikasi Berhasil! 🎉')
            ->icon($iconUrl)
            ->body('Halo! Jika Anda melihat popup ini, berarti integrasi sistem Push Notification berjalan dengan sempurna.')
            ->action('Tutup', url('/'));
    }
}
