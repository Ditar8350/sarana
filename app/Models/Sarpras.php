<?php

namespace App\Models;

use Database\Factories\SarprasFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'kode',
    'nama',
    'jenis',
    'kategori',
    'lokasi',
    'stok_total',
    'stok_tersedia',
    'satuan',
    'kondisi_umum',
    'dapat_dipinjam',
    'deskripsi',
    'foto_url',
])]
class Sarpras extends Model
{
    /** @use HasFactory<SarprasFactory> */
    use HasFactory;

    protected $table = 'sarpras';

    protected function casts(): array
    {
        return [
            'stok_total' => 'integer',
            'stok_tersedia' => 'integer',
            'dapat_dipinjam' => 'boolean',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(PeminjamanItem::class, 'sarpras_id');
    }

    public function mutations(): HasMany
    {
        return $this->hasMany(SarprasStockMutation::class, 'sarpras_id');
    }

    public function scopeSiapDipinjam(Builder $query): void
    {
        $query->where('dapat_dipinjam', true)->where('stok_tersedia', '>', 0);
    }

    /**
     * Format rincian jumlah per kondisi ke dalam string deskripsi terstruktur.
     */
    public static function encodeRincianKondisi(int $baik, int $sedang, int $rusak): string
    {
        return "Rincian Kondisi: Baik: {$baik}, Sedang: {$sedang}, Rusak: {$rusak}";
    }

    /**
     * Tentukan status kondisi_umum berdasarkan rincian jumlah per kondisi.
     */
    public static function determineDominantKondisi(int $baik, int $sedang, int $rusak): string
    {
        if ($rusak > 0 && $baik === 0 && $sedang === 0) {
            return 'Rusak';
        }

        if ($sedang > 0 && $baik === 0 && $rusak === 0) {
            return 'Sedang';
        }

        if ($baik > 0 && $sedang === 0 && $rusak === 0) {
            return 'Baik';
        }

        if ($rusak > 0) {
            return 'Rusak';
        }

        if ($sedang > 0) {
            return 'Sedang';
        }

        return 'Baik';
    }

    /**
     * Ambil rincian jumlah unit untuk kondisi Baik, Sedang, dan Rusak.
     *
     * @return array{baik: int, sedang: int, rusak: int}
     */
    public function getRincianKondisi(): array
    {
        $deskripsi = (string) ($this->deskripsi ?? '');
        if (preg_match('/Baik:\s*(\d+)\s*,\s*Sedang:\s*(\d+)\s*,\s*Rusak:\s*(\d+)/i', $deskripsi, $matches)) {
            $baik = (int) $matches[1];
            $sedang = (int) $matches[2];
            $rusak = (int) $matches[3];

            if (($baik + $sedang + $rusak) > 0 || (int) $this->stok_total === 0) {
                return [
                    'baik' => $baik,
                    'sedang' => $sedang,
                    'rusak' => $rusak,
                ];
            }
        }

        $total = max(0, (int) $this->stok_total);
        $rawKondisi = strtolower(trim((string) ($this->kondisi_umum ?? 'baik')));

        if (in_array($rawKondisi, ['sedang', 'rusak_ringan', 'rusak ringan'], true)) {
            return [
                'baik' => 0,
                'sedang' => $total,
                'rusak' => 0,
            ];
        }

        if (in_array($rawKondisi, ['rusak', 'rusak_berat', 'rusak berat'], true)) {
            return [
                'baik' => 0,
                'sedang' => 0,
                'rusak' => $total,
            ];
        }

        return [
            'baik' => $total,
            'sedang' => 0,
            'rusak' => 0,
        ];
    }
}
