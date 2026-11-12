<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'kode_pengembalian',
    'peminjaman_id',
    'user_id',
    'tanggal_pengajuan_kembali',
    'foto_bukti_kembali',
    'catatan_mahasiswa',
    'admin_id',
    'tanggal_diterima',
    'status_verifikasi',
    'biaya_denda',
    'nomor_rekening',
    'status_pembayaran_denda',
    'bukti_bayar_denda',
    'catatan_bayar_denda',
    'diverifikasi_denda_oleh',
    'diverifikasi_denda_pada',
    'catatan_inspeksi_admin',
])]
class Pengembalian extends Model
{
    use HasFactory;

    protected $table = 'pengembalians';

    protected function casts(): array
    {
        return [
            'tanggal_pengajuan_kembali' => 'datetime',
            'tanggal_diterima' => 'datetime',
            'diverifikasi_denda_pada' => 'datetime',
            'biaya_denda' => 'decimal:2',
        ];
    }

    public function peminjaman(): BelongsTo
    {
        return $this->belongsTo(Peminjaman::class, 'peminjaman_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function verifikatorDenda(): BelongsTo
    {
        return $this->belongsTo(User::class, 'diverifikasi_denda_oleh');
    }
}
