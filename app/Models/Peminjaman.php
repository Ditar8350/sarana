<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'kode_transaksi',
    'user_id',
    'nama_peminjam',
    'nim_nip',
    'instansi_prodi',
    'no_whatsapp',
    'file_ktm',
    'file_surat_pengantar',
    'keperluan',
    'tanggal_mulai',
    'tanggal_kembali_rencana',
    'tanggal_kembali_aktual',
    'status',
    'catatan_admin',
    'petugas_pengambilan',
    'pendamping_staf_id',
    'no_hp_pendamping',
    'lokasi_pengambilan',
    'foto_bukti_terima',
    'tanggal_terima',
    'validated_by',
    'validated_at',
])]
class Peminjaman extends Model
{
    use HasFactory;

    protected $table = 'peminjamans';

    protected function casts(): array
    {
        return [
            'tanggal_mulai' => 'datetime',
            'tanggal_kembali_rencana' => 'datetime',
            'tanggal_kembali_aktual' => 'datetime',
            'tanggal_terima' => 'datetime',
            'validated_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function validator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'validated_by');
    }

    public function pendampingStaf(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pendamping_staf_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(PeminjamanItem::class, 'peminjaman_id');
    }

    public function pengembalian(): HasOne
    {
        return $this->hasOne(Pengembalian::class, 'peminjaman_id');
    }

    public function logs(): HasMany
    {
        return $this->hasMany(PeminjamanLog::class, 'peminjaman_id')->latest();
    }
}
