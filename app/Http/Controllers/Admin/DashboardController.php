<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\MaintenanceLaporan;
use App\Models\News;
use App\Models\Peminjaman;
use App\Models\PengecekanRuangan;
use App\Models\Pengembalian;
use App\Models\Sarpras;
use App\Models\View;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response|RedirectResponse
    {
        if ($request->user()->role === UserRole::Mahasiswa) {
            return $this->mahasiswaDashboard($request);
        }

        if ($request->user()->role === UserRole::StafRuangan || $request->user()->role === UserRole::KepalaBagian) {
            return redirect()->route('staf-ruangan.dashboard');
        }

        $butuhValidasi = Peminjaman::where('status', 'menunggu_validasi')->count();
        $butuhInspeksi = Pengembalian::where('status_verifikasi', 'menunggu_inspeksi')->count();
        $sedangDipinjam = Peminjaman::whereIn('status', ['disetujui', 'siap_diambil', 'sedang_dipinjam'])->count();
        $totalAset = Sarpras::count();
        $siapPakai = Sarpras::where('stok_tersedia', '>', 0)->count();
        $tiketServis = MaintenanceLaporan::whereIn('status', ['menunggu_tinjauan', 'sedang_dikerjakan'])->count();
        $pengecekanMenunggu = PengecekanRuangan::where('status_tinjauan', 'menunggu_tinjauan')->count();

        // Antrean Peminjaman yang Butuh Validasi
        $antreanValidasi = Peminjaman::where('status', 'menunggu_validasi')
            ->with(['items.sarpras'])
            ->latest()
            ->take(5)
            ->get()
            ->map(fn (Peminjaman $p) => [
                'id' => $p->id,
                'kode' => $p->kode_transaksi,
                'pemohon' => $p->nama_peminjam,
                'nim_nip' => $p->nim_nip,
                'instansi_prodi' => $p->instansi_prodi,
                'tanggal_mulai' => $p->tanggal_mulai?->format('d M Y'),
                'tanggal_kembali' => $p->tanggal_kembali_rencana?->format('d M Y'),
                'items' => $p->items->unique('sarpras_id')->map(fn ($it) => ($it->sarpras?->nama ?? 'Sarpras')." ({$it->qty})")->join(', '),
            ]);

        // Antrean Pengembalian yang Butuh Cek Fisik
        $antreanPengembalian = Pengembalian::where('status_verifikasi', 'menunggu_inspeksi')
            ->with(['peminjaman.items.sarpras', 'user'])
            ->latest()
            ->take(5)
            ->get()
            ->map(fn (Pengembalian $k) => [
                'id' => $k->id,
                'kode' => $k->kode_pengembalian,
                'kode_peminjaman' => $k->peminjaman?->kode_transaksi ?? '-',
                'peminjam' => $k->peminjaman?->nama_peminjam ?? $k->user?->name ?? 'Mahasiswa',
                'nim_nip' => $k->peminjaman?->nim_nip ?? '-',
                'tanggal_kembali' => $k->tanggal_pengajuan_kembali?->format('d M Y H:i'),
                'foto_bukti' => $k->foto_bukti_kembali,
                'items' => $k->peminjaman?->items->unique('sarpras_id')->map(fn ($it) => ($it->sarpras?->nama ?? 'Sarpras')." ({$it->qty})")->join(', '),
            ]);

        // Laporan Maintenance Terkini
        $laporanMaintenance = MaintenanceLaporan::latest()
            ->take(5)
            ->get()
            ->map(fn (MaintenanceLaporan $m) => [
                'id' => $m->id,
                'kode_tiket' => $m->kode_tiket,
                'nama_sarpras' => $m->nama_sarpras,
                'lokasi_ruang' => $m->lokasi_ruang,
                'tingkat_urgensi' => $m->tingkat_urgensi,
                'status' => $m->status,
                'nama_teknisi' => $m->nama_teknisi,
                'deskripsi' => $m->deskripsi_kerusakan,
            ]);

        $recentNews = News::latest('date')
            ->latest('id')
            ->take(6)
            ->get()
            ->map(fn (News $item): array => [
                'id' => $item->id,
                'title' => $item->title,
                'slug' => $item->slug,
                'excerpt' => Str::limit(strip_tags($item->description), 140),
                'image' => $item->image ?: '/images/Hero.png',
                'date' => Carbon::parse($item->date)->translatedFormat('d M Y'),
                'author' => $item->author ?: 'Humas Sarpras',
                'status' => $item->status ?? 'Aktif',
            ]);

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'butuh_validasi' => $butuhValidasi,
                'butuh_inspeksi' => $butuhInspeksi,
                'sedang_dipinjam' => $sedangDipinjam,
                'total_aset' => $totalAset,
                'siap_pakai' => $siapPakai,
                'tiket_servis' => $tiketServis,
                'pengecekan_menunggu' => $pengecekanMenunggu,
                'total_berita' => News::count(),
                'total_dokumen' => Document::count(),
                'total_pengunjung' => View::first()?->count ?? 2044,
            ],
            'antreanValidasi' => $antreanValidasi,
            'antreanPengembalian' => $antreanPengembalian,
            'laporanMaintenance' => $laporanMaintenance,
            'recentNews' => $recentNews,
        ]);
    }

    /**
     * Read-only dashboard for students: news, borrowable inventory and their own loans.
     */
    private function mahasiswaDashboard(Request $request): Response
    {
        $userId = $request->user()->id;

        $berita = News::where('status', 'Aktif')
            ->latest('date')
            ->take(5)
            ->get()
            ->map(fn (News $item): array => [
                'id' => $item->id,
                'title' => $item->title,
                'slug' => $item->slug,
                'excerpt' => Str::limit(strip_tags($item->description), 120),
                'image' => $item->image ?: '/images/Hero.png',
                'date' => Carbon::parse($item->date)->translatedFormat('d M Y'),
                'author' => $item->author ?: 'Humas Sarpras',
            ]);

        $inventaris = Sarpras::where('dapat_dipinjam', true)
            ->orderByRaw('CASE WHEN stok_tersedia > 0 THEN 0 ELSE 1 END')
            ->orderBy('jenis')
            ->orderBy('nama')
            ->get()
            ->map(fn (Sarpras $item): array => [
                'id' => $item->id,
                'kode' => $item->kode,
                'nama' => $item->nama,
                'jenis' => $item->jenis,
                'kategori' => $item->kategori,
                'lokasi' => $item->lokasi,
                'stok_total' => $item->stok_total,
                'stok_tersedia' => $item->stok_tersedia,
                'satuan' => $item->satuan,
                'kondisi_umum' => $item->kondisi_umum,
                'foto_url' => $item->foto_url,
            ]);

        $peminjamanSaya = Peminjaman::where('user_id', $userId)
            ->with('items.sarpras')
            ->latest()
            ->take(5)
            ->get()
            ->map(fn (Peminjaman $p): array => [
                'id' => $p->id,
                'kode' => $p->kode_transaksi,
                'status' => $p->status,
                'tanggal_mulai' => $p->tanggal_mulai->translatedFormat('d M Y'),
                'tanggal_kembali_rencana' => $p->tanggal_kembali_rencana->translatedFormat('d M Y'),
                'barang' => $p->items->unique('sarpras_id')->map(fn ($it) => ($it->sarpras?->nama ?? 'Barang')." ({$it->qty})")->join(', '),
            ]);

        $statusCounts = Peminjaman::where('user_id', $userId)
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return Inertia::render('Mahasiswa/Dashboard', [
            'berita' => $berita,
            'inventaris' => $inventaris,
            'peminjamanSaya' => $peminjamanSaya,
            'ringkasan' => [
                'menunggu' => (int) (($statusCounts['menunggu_validasi'] ?? 0) + ($statusCounts['disetujui'] ?? 0) + ($statusCounts['siap_diambil'] ?? 0)),
                'aktif' => (int) (($statusCounts['sedang_dipinjam'] ?? 0) + ($statusCounts['menunggu_kembali'] ?? 0)),
                'selesai' => (int) ($statusCounts['selesai'] ?? 0),
                'item_tersedia' => $inventaris->where('stok_tersedia', '>', 0)->count(),
            ],
        ]);
    }
}
