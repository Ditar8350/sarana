<?php

namespace App\Models;

use Database\Factories\MaintenanceLaporanFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'kode_tiket',
    'user_id',
    'sarpras_id',
    'nama_sarpras',
    'lokasi_ruang',
    'tingkat_urgensi',
    'deskripsi_kerusakan',
    'foto_kerusakan',
    'status',
    'admin_id',
    'staf_id',
    'nama_teknisi',
    'estimasi_biaya',
    'biaya_aktual',
    'catatan_admin',
    'catatan_staf',
    'foto_perbaikan_selesai',
    'tanggal_mulai_perbaikan',
    'tanggal_selesai_perbaikan',
])]
class MaintenanceLaporan extends Model
{
    /** @use HasFactory<MaintenanceLaporanFactory> */
    use HasFactory;

    protected $table = 'maintenance_laporans';

    protected function casts(): array
    {
        return [
            'estimasi_biaya' => 'decimal:2',
            'biaya_aktual' => 'decimal:2',
            'tanggal_mulai_perbaikan' => 'datetime',
            'tanggal_selesai_perbaikan' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function staf(): BelongsTo
    {
        return $this->belongsTo(User::class, 'staf_id');
    }

    public function sarpras(): BelongsTo
    {
        return $this->belongsTo(Sarpras::class, 'sarpras_id');
    }
}
