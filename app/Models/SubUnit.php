<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubUnit extends Model
{
    protected $fillable = [
        'unit_id', 'nama_layanan', 'deskripsi', 'aktif',
        'is_revision_enabled'
    ];

    protected $casts = [
        'aktif' => 'boolean',
        'is_revision_enabled' => 'boolean',
    ];

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    public function formFields()
    {
        return $this->hasMany(FormField::class);
    }
}
