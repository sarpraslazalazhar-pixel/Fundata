<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Record extends Model
{
    protected $table = 'tickets';
    public $incrementing = false;
    protected $keyType = 'integer';

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->{$model->getKeyName()})) {
                // ponytail: eliminate exists() query with a highly unique time-based 9-digit integer
                // Format: last 5 digits of timestamp + 4 random digits
                $model->{$model->getKeyName()} = (int) (substr((string) time(), -5) . random_int(1000, 9999));
            }
        });
    }
    protected $fillable = [
        'user_id', 'divisi_id', 'org_unit_id', 'jabatan_id',
        'unit_id', 'sub_unit_id', 'campaign_id', 'akad_id',
        'donatur_id', 'jumlah_donasi', 'nominal_void', 'form_data', 'status', 'priority', 'assigned_admin_id',
        'revision_count', 'waiting_approval_at', 'is_result_accepted', 'link_kwitansi', 'nomor_kwitansi'
    ];

    protected $appends = ['formatted_id', 'judul', 'sub_unit_nama', 'unit_nama', 'donatur_nama'];
    protected $with = ['unit', 'subUnit', 'donatur'];

    public function getSubUnitNamaAttribute()
    {
        return $this->subUnit ? $this->subUnit->nama_layanan : null;
    }

    public function getUnitNamaAttribute()
    {
        return $this->unit ? $this->unit->nama_unit : ($this->subUnit && $this->subUnit->unit ? $this->subUnit->unit->nama_unit : null);
    }

    public function getDonaturNamaAttribute()
    {
        if ($this->donatur) {
            return $this->donatur->nama_lengkap;
        }
        if (!empty($this->form_data) && is_array($this->form_data)) {
            return $this->form_data['nama_donatur'] 
                ?? $this->form_data['donatur_nama'] 
                ?? $this->form_data['nama_lengkap']
                ?? $this->form_data['nama']
                ?? $this->form_data['nama_pemohon']
                ?? null;
        }
        return null;
    }

    public function getFormattedIdAttribute()
    {
        $id = (string) $this->id;
        if (strlen($id) === 9) {
            return substr($id, 0, 3) . '-' . substr($id, 3, 3) . '-' . substr($id, 6, 3);
        }
        return $id;
    }

    public function getJudulAttribute()
    {
        if (!empty($this->form_data) && is_array($this->form_data)) {
            foreach ($this->form_data as $key => $value) {
                if (is_string($value) && !empty($value) && strlen($value) < 100) {
                    return $value;
                }
            }
        }
        return $this->subUnit ? $this->subUnit->nama_layanan : 'Tiket #' . $this->formatted_id;
    }

    protected $casts = [
        'form_data' => 'array',
        'user_id' => 'integer',
        'divisi_id' => 'integer',
        'org_unit_id' => 'integer',
        'jabatan_id' => 'integer',
        'unit_id' => 'integer',
        'sub_unit_id' => 'integer',
        'campaign_id' => 'integer',
        'akad_id' => 'integer',
        'donatur_id' => 'integer',
        'is_result_accepted' => 'boolean',
        'nominal_void' => 'float',
    ];

    public function campaign()
    {
        return $this->belongsTo(Campaign::class, 'campaign_id');
    }

    public function akad()
    {
        return $this->belongsTo(Akad::class, 'akad_id');
    }

    public function donatur()
    {
        return $this->belongsTo(Donatur::class, 'donatur_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    public function subUnit()
    {
        return $this->belongsTo(SubUnit::class);
    }

    public function attachments()
    {
        return $this->hasMany(RecordAttachment::class, 'ticket_id');
    }

    public function logs()
    {
        return $this->hasMany(RecordLog::class, 'ticket_id');
    }

    public function orgDivisi()
    {
        return $this->belongsTo(OrgDivisi::class, 'divisi_id');
    }

    public function orgUnit()
    {
        return $this->belongsTo(OrgUnit::class, 'org_unit_id');
    }

    public function jabatan()
    {
        return $this->belongsTo(OrgJabatan::class, 'jabatan_id');
    }



    public function booking()
    {
        return $this->hasOne(RoomVehicleBooking::class, 'ticket_id');
    }

    public function assignedAdmin()
    {
        return $this->belongsTo(Admin::class, 'assigned_admin_id');
    }
}

