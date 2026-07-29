<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecordLog extends Model
{
    protected $table = 'ticket_logs';
    public $timestamps = false; // We use timestamp column manually

    protected $fillable = [
        'ticket_id', 'admin_id', 'aksi', 'catatan', 'timestamp'
    ];

    protected $casts = [
        'timestamp' => 'datetime',
    ];

    public function record()
    {
        return $this->belongsTo(Record::class, 'ticket_id');
    }

    public function admin()
    {
        return $this->belongsTo(Admin::class);
    }

    public function attachments()
    {
        return $this->hasMany(RecordAttachment::class, 'ticket_log_id');
    }
}
