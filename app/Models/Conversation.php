<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    protected $fillable = [
        'participant_one_type', 'participant_one_id',
        'participant_two_type', 'participant_two_id',
    ];

    public function participant_one()
    {
        return $this->morphTo();
    }

    public function participant_two()
    {
        return $this->morphTo();
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }
}
