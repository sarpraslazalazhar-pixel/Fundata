<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    protected $fillable = [
        'nama_bank',
        'nomor_rekening',
        'nama_pemilik',
        'logo_qris',
        'instruksi',
        'kategori',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
