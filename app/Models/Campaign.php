<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Campaign extends Model
{
    use HasFactory;

    protected $guarded = ['id'];
    protected $appends = ['banner_url'];

    protected $casts = [
        'target_dana' => 'decimal:2',
        'is_active' => 'boolean',
        'tgl_mulai' => 'date',
        'tgl_selesai' => 'date',
    ];

    public function records()
    {
        return $this->hasMany(Record::class, 'campaign_id');
    }

    public function getBannerUrlAttribute()
    {
        return $this->banner_path ? url('storage/' . $this->banner_path) : null;
    }
}
