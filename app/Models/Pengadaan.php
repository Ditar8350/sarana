<?php

namespace App\Models;

use Database\Factories\PengadaanFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'kode_pengadaan',
    'user_id',
    'staf_id',
    'nama_barang',
    'kategori',
    'jumlah',
    'satuan',
    'estimasi_harga_satuan',
    'total_biaya',
    'lokasi_penempatan',
    'ruangan_tujuan',
    'alasan_pengadaan',
    'spesifikasi',
    'nama_toko_vendor',
    'foto_bukti_nota',
    'tanggal_pembelian',
    'status',
    'admin_id',
    'catatan_admin',
    'sarpras_id',
])]
class Pengadaan extends Model
{
    /** @use HasFactory<PengadaanFactory> */
    use HasFactory;

    protected $table = 'pengadaans';

    protected function casts(): array
    {
        return [
            'jumlah' => 'integer',
            'estimasi_harga_satuan' => 'decimal:2',
            'total_biaya' => 'decimal:2',
            'tanggal_pembelian' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function staf(): BelongsTo
    {
        return $this->belongsTo(User::class, 'staf_id');
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function sarpras(): BelongsTo
    {
        return $this->belongsTo(Sarpras::class, 'sarpras_id');
    }
}
