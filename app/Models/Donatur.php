<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Donatur extends Model
{
    use HasFactory;

    protected $fillable = [
        'tipe',
        'nama_lengkap',
        'no_telp',
        'alamat',
        'email',
        'jenis_kelamin',
        'is_approved'
    ];

    protected $casts = [
        'is_approved' => 'boolean',
    ];

    public function records(): HasMany
    {
        return $this->hasMany(Record::class, 'donatur_id');
    }
}
