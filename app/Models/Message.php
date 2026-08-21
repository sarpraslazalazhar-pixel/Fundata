<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $fillable = [
        'conversation_id',
        'sender_type',
        'sender_id',
        'body',
        'context_type',
        'context_id',
        'is_read',
        'attachment_path',
        'attachment_name',
        'attachment_type',
        'attachment_size',
    ];

    protected $with = ['context'];

    protected $casts = [
        'is_read' => 'boolean',
    ];

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    public function sender()
    {
        return $this->morphTo();
    }

    public function context()
    {
        return $this->morphTo();
    }

    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($message) {
            if ($message->attachment_path && \Illuminate\Support\Facades\Storage::disk('public')->exists($message->attachment_path)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($message->attachment_path);
            }
        });
    }
}
