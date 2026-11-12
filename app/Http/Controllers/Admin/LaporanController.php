<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\MaintenanceLaporan;
use App\Models\Peminjaman;
use App\Models\Pengadaan;
use App\Models\PengecekanRuangan;
use App\Models\Pengembalian;
use App\Models\Sarpras;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LaporanController extends Controller
{
    /**
     * Tampilkan Halaman Pusat Rekap Laporan Terpadu (5 Kategori)
     */
    public function index(Request $request): Response
    {
        // 1. Data Laporan Inventaris Sarpras
        $laporanInventaris = Sarpras::orderBy('nama')
            ->get()
            ->map(function ($item) {
                $rincian = $item->getRincianKondisi();

                return [
                    'id' => $item->id,
                    'kode' => $item->kode,
                    'nama' => $item->nama,
                    'jenis' => $item->jenis,
                    'kategori' => $item->kategori,
                    'lokasi' => $item->lokasi,
                    'stok_total' => $item->stok_total,
                    'stok_tersedia' => $item->stok_tersedia,
                    'stok_dipinjam' => max(0, $item->stok_total - $item->stok_tersedia),
                    'satuan' => $item->satuan,
                    'kondisi_umum' => $item->kondisi_umum,
                    'baik' => $rincian['baik'],
                    'sedang' => $rincian['sedang'],
                    'rusak' => $rincian['rusak'],
                    'tahun' => $item->created_at?->format('Y') ?? date('Y'),
                    'dapat_dipinjam' => $item->dapat_dipinjam ? 'Bisa Dipinjam' : 'Terkunci',
                ];
            });

        // 2. Data Laporan Peminjaman
        $laporanPeminjaman = Peminjaman::with(['items.sarpras'])
            ->latest()
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'kode' => $p->kode_transaksi,
                'peminjam' => $p->nama_peminjam,
                'nim_nip' => $p->nim_nip,
                'unit' => $p->instansi_prodi,
                'keperluan' => $p->keperluan,
                'tanggal_mulai' => $p->tanggal_mulai->format('d/m/Y H:i'),
                'tanggal_kembali' => $p->tanggal_kembali_rencana->format('d/m/Y H:i'),
                'status' => strtoupper(str_replace('_', ' ', $p->status)),
                'file_ktm' => $p->file_ktm,
                'items' => $p->items->map(fn ($it) => "{$it->sarpras?->nama} ({$it->qty} {$it->sarpras?->satuan})")->join(', '),
            ]);

        // 3. Data Laporan Pengembalian
        $laporanPengembalian = Pengembalian::with(['peminjaman.items.sarpras', 'user'])
            ->latest()
            ->get()
            ->map(fn ($k) => [
                'id' => $k->id,
                'kode' => $k->kode_pengembalian,
                'kode_pinjam' => $k->peminjaman?->kode_transaksi ?? '-',
                'peminjam' => $k->peminjaman?->nama_peminjam ?? '-',
                'role_peminjam' => $k->user?->role === UserRole::Mahasiswa ? 'Mahasiswa' : 'Umum',
                'tanggal_kembali' => $k->tanggal_pengajuan_kembali->format('d/m/Y H:i'),
                'status_verifikasi' => strtoupper(str_replace('_', ' ', $k->status_verifikasi)),
                'biaya_denda' => (float) $k->biaya_denda,
                'nomor_rekening' => $k->nomor_rekening ?? '-',
                'status_pembayaran_denda' => strtoupper(str_replace('_', ' ', $k->status_pembayaran_denda ?? 'tidak_ada_denda')),
                'bukti_bayar_denda' => $k->bukti_bayar_denda,
                'catatan_inspeksi' => $k->catatan_inspeksi_admin ?? '-',
                'foto_bukti' => $k->foto_bukti_kembali,
                'items' => $k->peminjaman?->items->map(fn ($it) => "{$it->sarpras?->nama} [Kondisi: ".($it->kondisi_sesudah ?? 'sempurna').']')->join(', ') ?? '-',
            ]);

        // 4. Data Laporan Maintenance & Servis
        $laporanMaintenance = MaintenanceLaporan::with(['user', 'admin'])
            ->latest()
            ->get()
            ->map(fn ($m) => [
                'id' => $m->id,
                'kode' => $m->kode_tiket,
                'sarpras' => $m->nama_sarpras,
                'lokasi' => $m->lokasi_ruang,
                'pelapor' => $m->user?->name ?? 'Staf',
                'urgensi' => strtoupper($m->tingkat_urgensi),
                'deskripsi' => $m->deskripsi_kerusakan,
                'foto_kerusakan' => $m->foto_kerusakan,
                'teknisi' => $m->nama_teknisi ?? '-',
                'biaya' => (float) $m->estimasi_biaya,
                'status' => strtoupper(str_replace('_', ' ', $m->status)),
                'tanggal_lapor' => $m->created_at->format('d/m/Y H:i'),
            ]);

        // 5. Data Laporan Pengadaan / Pembelian & Peletakan Barang Baru dari Staf
        $laporanPengadaan = Pengadaan::with(['user', 'staf', 'admin', 'sarpras'])
            ->latest()
            ->get()
            ->map(fn ($b) => [
                'id' => $b->id,
                'kode' => $b->kode_pengadaan,
                'pelapor' => $b->user?->name ?? 'Pengusul',
                'staf' => $b->staf?->name ?? '-',
                'nama_barang' => $b->nama_barang,
                'kategori' => $b->kategori,
                'jumlah' => "{$b->jumlah} {$b->satuan}",
                'total_biaya' => (float) $b->total_biaya,
                'lokasi_penempatan' => "{$b->lokasi_penempatan} ({$b->ruangan_tujuan})",
                'alasan' => $b->alasan_pengadaan,
                'spesifikasi' => $b->spesifikasi,
                'vendor' => $b->nama_toko_vendor ?? '-',
                'status' => $b->status,
                'status_label' => strtoupper($b->status),
                'foto_bukti_nota' => $b->foto_bukti_nota,
                'sarpras_id' => $b->sarpras_id,
                'is_converted_to_sarpras' => ! empty($b->sarpras_id),
                'tanggal' => $b->created_at->format('d/m/Y H:i'),
            ]);

        // 6. Data Laporan Audit / Pengecekan Fisik Ruangan (Role PIC Ruangan)
        $laporanPengecekan = PengecekanRuangan::with(['user', 'admin'])
            ->latest('tanggal_pengecekan')
            ->latest('id')
            ->get()
            ->map(function ($ck) {
                $items = is_array($ck->items_checked) ? $ck->items_checked : [];
                $baik = 0;
                $sedang = 0;
                $rusak = 0;
                foreach ($items as $it) {
                    $k = strtolower($it['kondisi'] ?? 'baik');
                    if (str_contains($k, 'rusak')) {
                        $rusak++;
                    } elseif (str_contains($k, 'sedang')) {
                        $sedang++;
                    } else {
                        $baik++;
                    }
                }

                $fotoRuangan = $ck->foto_ruangan;
                if (! $fotoRuangan && ! empty($items)) {
                    foreach ($items as $it) {
                        if (! empty($it['sarpras_id'])) {
                            $f = Sarpras::find($it['sarpras_id'])?->foto_url;
                            if ($f) {
                                $fotoRuangan = $f;
                                break;
                            }
                        }
                    }
                }
                if (! $fotoRuangan && ! empty($ck->nama_ruangan)) {
                    $fotoRuangan = Sarpras::where('lokasi', $ck->nama_ruangan)->whereNotNull('foto_url')->value('foto_url');
                }

                return [
                    'id' => $ck->id,
                    'kode' => $ck->kode_pengecekan,
                    'ruangan' => $ck->nama_ruangan,
                    'pelapor' => $ck->user?->name ?? 'PIC Ruangan',
                    'role_pelapor' => 'PIC Ruangan',
                    'tanggal' => $ck->tanggal_pengecekan?->format('d/m/Y') ?? $ck->created_at->format('d/m/Y'),
                    'kondisi_kebersihan' => $ck->kondisi_kebersihan,
                    'kondisi_sarpras' => $ck->kondisi_sarpras,
                    'catatan' => $ck->catatan_pemeriksaan,
                    'foto_ruangan' => $fotoRuangan,
                    'total_item' => count($items),
                    'kondisi_baik' => $baik,
                    'kondisi_sedang' => $sedang,
                    'kondisi_rusak' => $rusak,
                    'items_checked' => $items,
                    'status_tinjauan' => strtoupper(str_replace('_', ' ', $ck->status_tinjauan)),
                    'admin_verifikator' => $ck->admin?->name ?? 'Admin Sarpras',
                ];
            });

        return Inertia::render('Admin/Laporan/Index', [
            'inventaris' => $laporanInventaris,
            'peminjaman' => $laporanPeminjaman,
            'pengembalian' => $laporanPengembalian,
            'maintenance' => $laporanMaintenance,
            'pengadaan' => $laporanPengadaan,
            'pengecekan' => $laporanPengecekan,
        ]);
    }
}
