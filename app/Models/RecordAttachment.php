<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecordAttachment extends Model
{
    protected $table = 'ticket_attachments';
    protected $fillable = [
        'ticket_id', 'field_id', 'ticket_log_id', 'file_path', 'original_name',
        'mime_type', 'file_size', 'wajib'
    ];

    public function log()
    {
        return $this->belongsTo(RecordLog::class, 'ticket_log_id');
    }

    public function record()
    {
        return $this->belongsTo(Record::class, 'ticket_id');
    }

    public function field()
    {
        return $this->belongsTo(FormField::class, 'field_id');
    }
}
