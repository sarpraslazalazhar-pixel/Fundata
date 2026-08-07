<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Akad extends Model
{
    use HasFactory;

    protected $fillable = [
        'parent_id',
        'nama_akad',
        'is_campaign_required',
        'is_active',
        'target_dana',
        'is_show_on_dashboard',
        'banner_url',
    ];

    protected $casts = [
        'is_campaign_required' => 'boolean',
        'is_active' => 'boolean',
        'is_show_on_dashboard' => 'boolean',
        'target_dana' => 'decimal:2',
    ];

    /**
     * Get the parent Akad.
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Akad::class, 'parent_id');
    }

    /**
     * Get the child Akads.
     */
    public function children(): HasMany
    {
        return $this->hasMany(Akad::class, 'parent_id');
    }

    /**
     * Get all transaction records tied to this Akad.
     */
    public function records(): HasMany
    {
        return $this->hasMany(Record::class, 'akad_id');
    }
}
