<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PengecekanRuangan extends Model
{
    use HasFactory;

    protected $table = 'pengecekan_ruangans';

    protected $fillable = [
        'kode_pengecekan',
        'user_id',
        'ruangan_id',
        'nama_ruangan',
        'tanggal_pengecekan',
        'kondisi_kebersihan',
        'kondisi_sarpras',
        'catatan_pemeriksaan',
        'foto_ruangan',
        'items_checked',
        'status_tinjauan',
        'admin_id',
        'catatan_admin',
        'ditinjau_pada',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tanggal_pengecekan' => 'date',
            'items_checked' => 'array',
            'ditinjau_pada' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function ruangan(): BelongsTo
    {
        return $this->belongsTo(Sarpras::class, 'ruangan_id');
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}
