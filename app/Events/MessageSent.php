<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Models\Conversation;

class MessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;
    public $conversation;

    public function __construct($message, Conversation $conversation)
    {
        $this->message = $message;
        $this->conversation = $conversation;
    }

    public function broadcastOn(): array
    {
        // Determine who the receiver is
        if ($this->message->sender_type === $this->conversation->participant_one_type && 
            $this->message->sender_id === $this->conversation->participant_one_id) {
            $receiverType = $this->conversation->participant_two_type;
            $receiverId = $this->conversation->participant_two_id;
        } else {
            $receiverType = $this->conversation->participant_one_type;
            $receiverId = $this->conversation->participant_one_id;
        }

        // Format channel name based on class
        $channelName = str_replace('\\', '.', ltrim($receiverType, '\\')) . '.' . $receiverId;

        return [
            new PrivateChannel($channelName),
        ];
    }
}
