<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessagesRead implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $reader_id;
    public $reader_type;
    public $sender_id;
    public $sender_type;

    public function __construct($readerId, $readerType, $senderId, $senderType)
    {
        $this->reader_id = $readerId;
        $this->reader_type = $readerType;
        $this->sender_id = $senderId;
        $this->sender_type = $senderType;
    }

    public function broadcastOn(): array
    {
        // Broadcast to the original sender of the messages (so their UI turns blue check)
        $channelName = str_replace('\\', '.', ltrim($this->sender_type, '\\')) . '.' . $this->sender_id;

        return [
            new PrivateChannel($channelName),
        ];
    }
}
