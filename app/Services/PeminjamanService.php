<?php

namespace App\Services;

use App\Models\Peminjaman;
use App\Models\Sarpras;

class PeminjamanService
{
    /**
     * Memeriksa ketersediaan stok barang pada rentang tanggal tertentu (Overlap Check).
     */
    public function checkKetersediaan(int $sarprasId, int $qtyDiminta, string $tanggalMulai, string $tanggalKembali): bool
    {
        $sarpras = Sarpras::find($sarprasId);

        if (! $sarpras || ! $sarpras->dapat_dipinjam) {
            return false;
        }

        // Cek total peminjaman yang sedang aktif dipinjam pada rentang tanggal tersebut
        $totalDipinjamPadaJadwal = Peminjaman::whereIn('status', ['sedang_dipinjam', 'menunggu_kembali'])
            ->whereHas('items', function ($query) use ($sarprasId) {
                $query->where('sarpras_id', $sarprasId);
            })
            ->where(function ($query) use ($tanggalMulai, $tanggalKembali) {
                $query->where('tanggal_mulai', '<=', $tanggalKembali)
                    ->where('tanggal_kembali_rencana', '>=', $tanggalMulai);
            })
            ->with(['items' => fn ($q) => $q->where('sarpras_id', $sarprasId)])
            ->get()
            ->sum(function ($peminjaman) use ($sarprasId) {
                return $peminjaman->items->where('sarpras_id', $sarprasId)->sum('qty');
            });

        $sisaStokPadaPeriode = max((int) $sarpras->stok_tersedia, (int) $sarpras->stok_total - (int) $totalDipinjamPadaJadwal);

        return $sisaStokPadaPeriode >= $qtyDiminta && $sarpras->stok_tersedia >= $qtyDiminta;
    }
}
