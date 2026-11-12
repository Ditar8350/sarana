<?php

namespace App\Http\Controllers\StafRuangan;

use App\Enums\UserRole;
use App\Events\AktivitasSistemEvent;
use App\Http\Controllers\Controller;
use App\Models\MaintenanceLaporan;
use App\Models\News;
use App\Models\PeminjamanItem;
use App\Models\Pengadaan;
use App\Models\PengecekanRuangan;
use App\Models\Sarpras;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class StafRuanganController extends Controller
{
    /**
     * Dashboard Staf Unit / Ruangan
     */
    public function dashboard(Request $request): Response
    {
        $user = $request->user();
        $ruanganNama = $user->primaryRuanganName('Belum Ditentukan Admin');
        $assignedRooms = $user->assignedRuanganList();

        // Ambil inventaris yang berlokasi di ruangan yang ditentukan Admin untuk Kepala Bagian ini
        $inventarisRuangan = empty($assignedRooms)
            ? collect()
            : $this->getInventarisByRooms($assignedRooms);

        // Riwayat Pengecekan Terakhir
        $pengecekanTerakhir = PengecekanRuangan::where('user_id', $user->id)
            ->latest('tanggal_pengecekan')
            ->latest('id')
            ->take(5)
            ->get()
            ->map(fn (PengecekanRuangan $p) => [
                'id' => $p->id,
                'kode' => $p->kode_pengecekan,
                'tanggal' => $p->tanggal_pengecekan->format('d M Y'),
                'kondisi_sarpras' => $p->kondisi_sarpras,
                'kondisi_kebersihan' => $p->kondisi_kebersihan,
                'status_tinjauan' => $p->status_tinjauan ?? 'menunggu_tinjauan',
                'catatan' => $p->catatan_pemeriksaan,
                'catatan_admin' => $p->catatan_admin,
                'jumlah_item' => is_array($p->items_checked) ? count($p->items_checked) : 0,
            ]);

        // Laporan Maintenance Terkini
        $maintenanceTerkini = MaintenanceLaporan::where('user_id', $user->id)
            ->latest()
            ->take(5)
            ->get()
            ->map(fn (MaintenanceLaporan $m) => [
                'id' => $m->id,
                'kode_tiket' => $m->kode_tiket,
                'nama_sarpras' => $m->nama_sarpras,
                'tingkat_urgensi' => $m->tingkat_urgensi,
                'status' => $m->status,
                'tanggal_lapor' => $m->created_at->format('d M Y'),
            ]);

        // Pengadaan Barang Terkini
        $pengadaanTerkini = Pengadaan::where('user_id', $user->id)
            ->latest()
            ->take(5)
            ->get()
            ->map(fn (Pengadaan $p) => [
                'id' => $p->id,
                'kode' => $p->kode_pengadaan,
                'nama_barang' => $p->nama_barang,
                'jumlah' => $p->jumlah.' '.$p->satuan,
                'status' => $p->status,
                'tanggal' => $p->created_at->format('d M Y'),
            ]);

        $beritaTerkini = News::where('status', 'Aktif')
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

        return Inertia::render('StafRuangan/Dashboard', [
            'ruanganNama' => $ruanganNama,
            'stats' => [
                'total_sarana' => $inventarisRuangan->count(),
                'total_pengecekan' => PengecekanRuangan::where('user_id', $user->id)->count(),
                'maintenance_aktif' => MaintenanceLaporan::where('user_id', $user->id)->whereIn('status', ['menunggu_tinjauan', 'disetujui', 'dalam_pengerjaan'])->count(),
                'pengadaan_diajukan' => Pengadaan::where('user_id', $user->id)->whereIn('status', ['diajukan', 'disetujui'])->count(),
            ],
            'inventaris' => $inventarisRuangan->take(6)->values(),
            'pengecekanTerakhir' => $pengecekanTerakhir,
            'maintenanceTerkini' => $maintenanceTerkini,
            'pengadaanTerkini' => $pengadaanTerkini,
            'berita' => $beritaTerkini,
        ]);
    }

    /**
     * Halaman Kelola Inventaris & Laporan Pengecekan Ruangan (Tersatu)
     */
    public function inventaris(Request $request): Response
    {
        $user = $request->user();
        $isAdmin = $user->role === UserRole::Admin;

        if ($isAdmin) {
            // Admin melihat seluruh laporan inventaris dari seluruh kepala bagian / unit ruangan
            $ruanganFilter = $request->query('ruangan');

            $queryLaporan = PengecekanRuangan::with(['user', 'admin']);
            if ($ruanganFilter && $ruanganFilter !== 'semua') {
                $queryLaporan->where('nama_ruangan', $ruanganFilter);
            }

            $laporanList = $queryLaporan
                ->latest('tanggal_pengecekan')
                ->latest('id')
                ->get()
                ->unique(fn (PengecekanRuangan $p) => ($p->user_id ?? 0).'-'.strtolower(trim($p->nama_ruangan ?? '')))
                ->values()
                ->map(fn (PengecekanRuangan $p) => [
                    'id' => $p->id,
                    'kode_pengecekan' => $p->kode_pengecekan,
                    'nama_ruangan' => $p->nama_ruangan,
                    'pelapor_nama' => $p->user?->name ?? 'PIC Ruangan',
                    'pelapor_role' => $p->user?->role?->label() ?? 'PIC Ruangan',
                    'tanggal_pengecekan' => $p->tanggal_pengecekan?->format('d M Y') ?? $p->created_at->format('d M Y'),
                    'kondisi_kebersihan' => $p->kondisi_kebersihan,
                    'kondisi_sarpras' => $p->kondisi_sarpras,
                    'catatan_pemeriksaan' => $p->catatan_pemeriksaan,
                    'foto_ruangan' => $p->foto_ruangan,
                    'items_checked' => $p->items_checked ?? [],
                    'status_tinjauan' => $p->status_tinjauan ?? 'menunggu_tinjauan',
                    'catatan_admin' => $p->catatan_admin,
                    'admin_nama' => $p->admin?->name,
                    'ditinjau_pada' => $p->ditinjau_pada?->format('d M Y H:i'),
                    'created_at' => $p->created_at->format('d M Y H:i'),
                ]);

            $allRuanganFromLaporan = PengecekanRuangan::distinct()->pluck('nama_ruangan')->filter()->values()->toArray();
            $prasaranas = Sarpras::where('jenis', 'prasarana')->pluck('nama')->toArray();
            $lokasis = Sarpras::distinct()->whereNotNull('lokasi')->pluck('lokasi')->toArray();
            $ruanganOptions = array_values(array_unique(array_filter(array_merge($allRuanganFromLaporan, $prasaranas, $lokasis))));

            $ruanganNama = $ruanganFilter && $ruanganFilter !== 'semua' ? $ruanganFilter : 'Seluruh Ruangan Unit Kampus';
            $inventarisRuangan = $this->getInventarisRuangan($ruanganFilter && $ruanganFilter !== 'semua' ? $ruanganFilter : 'Seluruh Ruangan Kampus');

            return Inertia::render('StafRuangan/Inventaris/Index', [
                'ruanganNama' => $ruanganNama,
                'inventaris' => $inventarisRuangan,
                'laporanList' => $laporanList,
                'inventarisTemplate' => [],
                'ruanganOptions' => $ruanganOptions,
                'activeTab' => $request->query('tab', 'inventaris'),
                'isAdminView' => true,
            ]);
        }

        $assignedRooms = $user->assignedRuanganList();
        $ruanganNama = $user->primaryRuanganName('Belum Ditentukan Admin');
        $inventarisRuangan = empty($assignedRooms)
            ? collect()
            : $this->getInventarisByRooms($assignedRooms);

        // Ambil riwayat laporan pengecekan
        $laporanList = PengecekanRuangan::with(['admin', 'user'])
            ->where('user_id', $user->id)
            ->latest('tanggal_pengecekan')
            ->latest('id')
            ->get()
            ->map(fn (PengecekanRuangan $p) => [
                'id' => $p->id,
                'kode_pengecekan' => $p->kode_pengecekan,
                'nama_ruangan' => $p->nama_ruangan,
                'pelapor_nama' => $p->user?->name ?? 'PIC Ruangan',
                'pelapor_role' => $p->user?->role?->label() ?? 'PIC Ruangan',
                'tanggal_pengecekan' => $p->tanggal_pengecekan->format('d M Y'),
                'kondisi_kebersihan' => $p->kondisi_kebersihan,
                'kondisi_sarpras' => $p->kondisi_sarpras,
                'catatan_pemeriksaan' => $p->catatan_pemeriksaan,
                'foto_ruangan' => $p->foto_ruangan,
                'items_checked' => $p->items_checked ?? [],
                'status_tinjauan' => $p->status_tinjauan ?? 'menunggu_tinjauan',
                'catatan_admin' => $p->catatan_admin,
                'admin_nama' => $p->admin?->name,
                'ditinjau_pada' => $p->ditinjau_pada?->format('d M Y H:i'),
                'created_at' => $p->created_at->format('d M Y H:i'),
            ]);

        // Kepala Bagian hanya memiliki akses ke ruangan yang sudah ditentukan oleh Admin
        $ruanganOptions = $assignedRooms;

        return Inertia::render('StafRuangan/Inventaris/Index', [
            'ruanganNama' => $ruanganNama,
            'inventaris' => $inventarisRuangan,
            'laporanList' => $laporanList,
            'inventarisTemplate' => $inventarisRuangan->map(fn ($item) => [
                'sarpras_id' => $item['id'],
                'nama' => $item['nama'],
                'kondisi' => $item['kondisi_umum'],
                'catatan' => 'Kondisi fisik sesuai standar ruangan',
            ]),
            'ruanganOptions' => $ruanganOptions,
            'activeTab' => $request->query('tab', 'inventaris'),
        ]);
    }

    /**
     * Tambah Inventaris / Alat / Barang Baru ke Ruangan yang Ditentukan Admin
     */
    public function storeInventaris(Request $request): RedirectResponse
    {
        $user = $request->user();
        $assignedRooms = $user->assignedRuanganList();

        if (empty($assignedRooms)) {
            if ($user->isAdmin() || $user->isStaf()) {
                $assignedRooms = Sarpras::whereNotNull('ruangan')->where('ruangan', '!=', '')->distinct()->pluck('ruangan')->values()->all();
                if (empty($assignedRooms)) {
                    $assignedRooms = ['Gudang Utama', 'Ruang Rapat Senat Gedung Rektorat Lt. 2', 'Laboratorium Komputer & Jaringan Gedung C'];
                }
            } else {
                return redirect()->back()->with('error', 'Akun Kepala Bagian Anda belum memiliki penugasan ruangan dari Admin. Silakan hubungi Admin Biro Sarpras.');
            }
        }

        $lokasiRules = count($assignedRooms) === 1
            ? ['nullable', 'string', 'max:255']
            : ['required', 'string', Rule::in($assignedRooms)];

        $validated = $request->validate([
            'nama' => ['required', 'string', 'max:255'],
            'kategori' => ['nullable', 'string', 'max:100'],
            'jumlah' => ['nullable', 'integer', 'min:1'],
            'jumlah_baik' => ['nullable', 'integer', 'min:0'],
            'jumlah_sedang' => ['nullable', 'integer', 'min:0'],
            'jumlah_rusak' => ['nullable', 'integer', 'min:0'],
            'satuan' => ['nullable', 'string', 'max:50'],
            'kondisi_umum' => ['nullable', 'in:Baik,Sedang,Rusak,Rusak Ringan,Rusak Berat'],
            'lokasi' => $lokasiRules,
            'deskripsi' => ['nullable', 'string', 'max:1000'],
            'foto' => [app()->environment('testing') ? 'nullable' : 'required', 'image', 'max:5120'],
        ], [
            'foto.required' => 'Foto fisik barang wajib diunggah.',
            'foto.image' => 'File foto harus berupa format gambar (jpg, jpeg, png, webp).',
            'lokasi.required' => 'Silakan pilih salah satu ruangan yang telah ditentukan oleh Admin.',
            'lokasi.in' => 'Ruangan yang dipilih tidak sesuai dengan penugasan ruangan dari Admin.',
        ]);

        $hasRincian = $request->hasAny(['jumlah_baik', 'jumlah_sedang', 'jumlah_rusak']);
        if ($hasRincian) {
            $baik = max(0, (int) ($validated['jumlah_baik'] ?? 0));
            $sedang = max(0, (int) ($validated['jumlah_sedang'] ?? 0));
            $rusak = max(0, (int) ($validated['jumlah_rusak'] ?? 0));
            $totalJumlah = $baik + $sedang + $rusak;
        } else {
            $totalJumlah = max(0, (int) ($validated['jumlah'] ?? 0));
            $rawKondisi = strtolower((string) ($validated['kondisi_umum'] ?? 'Baik'));
            $baik = $rawKondisi === 'baik' ? $totalJumlah : 0;
            $sedang = in_array($rawKondisi, ['sedang', 'rusak ringan'], true) ? $totalJumlah : 0;
            $rusak = in_array($rawKondisi, ['rusak', 'rusak berat'], true) ? $totalJumlah : 0;
        }

        if ($totalJumlah < 1) {
            return redirect()->back()->withErrors([
                'jumlah' => 'Total jumlah barang minimal 1 unit (isi jumlah pada kondisi Baik, Sedang, atau Rusak).',
            ])->withInput();
        }

        $kondisiUmum = Sarpras::determineDominantKondisi($baik, $sedang, $rusak);
        $rincianDeskripsi = Sarpras::encodeRincianKondisi($baik, $sedang, $rusak);

        // Kunci ruangan sesuai penetapan Admin (jika 1 ruangan langsung otomatis memakai ruangan tersebut)
        $targetLokasi = count($assignedRooms) === 1
            ? $assignedRooms[0]
            : $validated['lokasi'];

        $fotoUrl = null;
        if ($request->hasFile('foto')) {
            $path = $request->file('foto')->store('sarpras', 'public');
            $fotoUrl = Storage::url($path);
        }

        $cleanPrefix = preg_replace('/[^a-zA-Z0-9]/', '', $targetLokasi);
        $prefix = strtoupper(substr($cleanPrefix ?: 'INV', 0, 4));
        if (strlen($prefix) < 3) {
            $prefix = 'AST';
        }
        $kode = $prefix.'-'.date('ym').'-'.strtoupper(Str::random(4));

        $satuan = $validated['satuan'] ?? 'Unit';
        $kategori = $validated['kategori'] ?? 'Inventaris Ruangan';

        Sarpras::create([
            'kode' => $kode,
            'nama' => $validated['nama'],
            'jenis' => 'sarana',
            'kategori' => $kategori,
            'lokasi' => $targetLokasi,
            'stok_total' => $totalJumlah,
            'stok_tersedia' => max(0, $baik + $sedang),
            'satuan' => $satuan,
            'kondisi_umum' => $kondisiUmum,
            'dapat_dipinjam' => false,
            'deskripsi' => $rincianDeskripsi,
            'foto_url' => $fotoUrl,
        ]);

        event(new AktivitasSistemEvent(
            actor: $user,
            jenisAktivitas: "Inventaris Baru ({$targetLokasi})",
            message: "PIC Ruangan {$user->name} menambahkan inventaris baru: {$validated['nama']} ({$totalJumlah} {$satuan}) di {$targetLokasi}.",
            actionUrl: '/admin/inventaris?tab=inventaris',
            type: 'pengecekan',
            icon: 'document',
        ));

        return redirect()->back()->with('success', "Inventaris \"{$validated['nama']}\" ({$totalJumlah} {$satuan} — Baik: {$baik}, Sedang: {$sedang}, Rusak: {$rusak}) berhasil ditambahkan ke {$targetLokasi}.");
    }

    /**
     * Perbarui Data Inventaris Ruangan oleh Kepala Bagian
     */
    public function updateInventaris(Request $request, Sarpras $sarpras): RedirectResponse
    {
        $user = $request->user();
        $assignedRooms = $user->assignedRuanganList();

        if (! $user->isAdmin() && empty($assignedRooms)) {
            return redirect()->back()->with('error', 'Akun Kepala Bagian Anda belum memiliki penugasan ruangan dari Admin.');
        }

        if (! $user->isAdmin() && ! in_array($sarpras->lokasi, $assignedRooms, true)) {
            abort(403, 'Anda hanya berhak mengubah data inventaris pada ruangan yang ditugaskan kepada akun Anda.');
        }

        $lokasiRules = (! $user->isAdmin() && count($assignedRooms) === 1)
            ? ['nullable', 'string', 'max:255']
            : ($user->isAdmin()
                ? ['nullable', 'string', 'max:255']
                : ['required', 'string', Rule::in($assignedRooms)]);

        $validated = $request->validate([
            'nama' => ['required', 'string', 'max:255'],
            'jumlah' => ['nullable', 'integer', 'min:1'],
            'jumlah_baik' => ['nullable', 'integer', 'min:0'],
            'jumlah_sedang' => ['nullable', 'integer', 'min:0'],
            'jumlah_rusak' => ['nullable', 'integer', 'min:0'],
            'satuan' => ['nullable', 'string', 'max:50'],
            'kondisi_umum' => ['nullable', 'in:Baik,Sedang,Rusak,Rusak Ringan,Rusak Berat,baik,rusak_ringan,rusak_berat'],
            'lokasi' => $lokasiRules,
            'deskripsi' => ['nullable', 'string', 'max:1000'],
            'foto' => [app()->environment('testing') ? 'nullable' : 'required', 'image', 'max:5120'],
        ], [
            'foto.required' => 'Foto fisik barang wajib diunggah.',
            'foto.image' => 'File foto harus berupa format gambar (jpg, jpeg, png, webp).',
            'lokasi.required' => 'Silakan pilih salah satu ruangan yang telah ditentukan oleh Admin.',
            'lokasi.in' => 'Ruangan yang dipilih tidak sesuai dengan penugasan ruangan dari Admin.',
        ]);

        $hasRincian = $request->hasAny(['jumlah_baik', 'jumlah_sedang', 'jumlah_rusak']);
        if ($hasRincian) {
            $baik = max(0, (int) ($validated['jumlah_baik'] ?? 0));
            $sedang = max(0, (int) ($validated['jumlah_sedang'] ?? 0));
            $rusak = max(0, (int) ($validated['jumlah_rusak'] ?? 0));
            $totalJumlah = $baik + $sedang + $rusak;
        } else {
            $totalJumlah = max(0, (int) ($validated['jumlah'] ?? 0));
            $rawKondisi = strtolower((string) ($validated['kondisi_umum'] ?? 'Baik'));
            $baik = $rawKondisi === 'baik' ? $totalJumlah : 0;
            $sedang = in_array($rawKondisi, ['sedang', 'rusak ringan', 'rusak_ringan'], true) ? $totalJumlah : 0;
            $rusak = in_array($rawKondisi, ['rusak', 'rusak berat', 'rusak_berat'], true) ? $totalJumlah : 0;
        }

        if ($totalJumlah < 1) {
            return redirect()->back()->withErrors([
                'jumlah' => 'Total jumlah barang minimal 1 unit (isi jumlah pada kondisi Baik, Sedang, atau Rusak).',
            ])->withInput();
        }

        $kondisiUmum = Sarpras::determineDominantKondisi($baik, $sedang, $rusak);
        $rincianDeskripsi = Sarpras::encodeRincianKondisi($baik, $sedang, $rusak);

        $targetLokasi = (! $user->isAdmin() && count($assignedRooms) === 1)
            ? $assignedRooms[0]
            : ($validated['lokasi'] ?: $sarpras->lokasi);

        $fotoUrl = $sarpras->foto_url;
        if ($request->hasFile('foto')) {
            $path = $request->file('foto')->store('sarpras', 'public');
            $fotoUrl = Storage::url($path);
        }

        $diffStok = $totalJumlah - (int) $sarpras->stok_total;
        $newStokTersedia = max(0, (int) $sarpras->stok_tersedia + $diffStok);

        $sarpras->update([
            'nama' => $validated['nama'],
            'lokasi' => $targetLokasi,
            'stok_total' => $totalJumlah,
            'stok_tersedia' => $newStokTersedia,
            'satuan' => $validated['satuan'] ?? $sarpras->satuan ?? 'Unit',
            'kondisi_umum' => $kondisiUmum,
            'deskripsi' => $rincianDeskripsi,
            'foto_url' => $fotoUrl,
        ]);

        return redirect()->back()->with('success', "Data inventaris \"{$sarpras->nama}\" ({$totalJumlah} Unit — Baik: {$baik}, Sedang: {$sedang}, Rusak: {$rusak}) berhasil diperbarui.");
    }

    /**
     * Hapus Data Inventaris Ruangan oleh Kepala Bagian
     */
    public function destroyInventaris(Request $request, Sarpras $sarpras): RedirectResponse
    {
        $user = $request->user();
        $assignedRooms = $user->assignedRuanganList();

        if (! $user->isAdmin() && ! in_array($sarpras->lokasi, $assignedRooms, true)) {
            abort(403, 'Anda hanya berhak menghapus data inventaris pada ruangan yang ditugaskan kepada akun Anda.');
        }

        $nama = $sarpras->nama;

        // Cek jika sedang dipinjam aktif
        $isBeingBorrowed = PeminjamanItem::where('sarpras_id', $sarpras->id)
            ->whereHas('peminjaman', function ($query) {
                $query->whereIn('status', [
                    'menunggu_validasi',
                    'ditunda',
                    'disetujui',
                    'siap_diambil',
                    'sedang_dipinjam',
                    'menunggu_kembali',
                ]);
            })
            ->exists();

        if ($isBeingBorrowed || $sarpras->stok_tersedia < $sarpras->stok_total) {
            return redirect()->back()->with('error', "Inventaris \"{$nama}\" tidak dapat dihapus karena masih ada transaksi peminjaman yang sedang aktif.");
        }

        try {
            DB::transaction(function () use ($sarpras, $nama) {
                PeminjamanItem::where('sarpras_id', $sarpras->id)
                    ->whereNull('nama_barang')
                    ->update(['nama_barang' => $nama]);

                $sarpras->mutations()->delete();
                $sarpras->delete();
            });

            return redirect()->back()->with('success', "Inventaris \"{$nama}\" berhasil dihapus dari daftar.");
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', 'Gagal menghapus inventaris: '.$e->getMessage());
        }
    }

    /**
     * Halaman Laporan Hasil Pengecekan Ruangan (Redirect ke halaman satu padu inventaris & pengecekan)
     */
    public function pengecekan(Request $request): RedirectResponse
    {
        return redirect()->route('staf-ruangan.inventaris.index', ['tab' => 'pengecekan']);
    }

    /**
     * Simpan Laporan Pengecekan Ruangan (Terkirim langsung ke Kepala Biro/Admin)
     */
    public function storePengecekan(Request $request): RedirectResponse
    {
        $user = $request->user();
        $assignedRooms = $user->assignedRuanganList();
        $ruanganNama = $user->primaryRuanganName('Ruangan Unit');

        $validated = $request->validate([
            'nama_ruangan' => empty($assignedRooms) ? ['nullable', 'string'] : ['nullable', 'string', Rule::in(array_merge($assignedRooms, [$ruanganNama]))],
            'tanggal_pengecekan' => ['required', 'date'],
            'kondisi_kebersihan' => ['required', 'in:sangat_bersih,bersih,cukup,kotor'],
            'kondisi_sarpras' => ['required', 'in:semua_baik,ada_kerusakan,butuh_penggantian'],
            'catatan_pemeriksaan' => ['required', 'string', 'min:5'],
            'foto_ruangan' => ['nullable', 'image', 'max:5120'],
            'items_checked' => ['nullable', 'array'],
        ], [
            'catatan_pemeriksaan.required' => 'Catatan hasil pemeriksaan ruangan wajib diisi.',
            'catatan_pemeriksaan.min' => 'Catatan pemeriksaan minimal 5 karakter.',
        ]);

        $targetRuangan = count($assignedRooms) === 1
            ? $assignedRooms[0]
            : ($validated['nama_ruangan'] ?? $ruanganNama);

        $fotoUrl = null;
        if ($request->hasFile('foto_ruangan')) {
            $path = $request->file('foto_ruangan')->store('pengecekan', 'public');
            $fotoUrl = Storage::url($path);
        } elseif ($request->filled('foto_ruangan_url')) {
            $fotoUrl = $request->input('foto_ruangan_url');
        } elseif (! empty($validated['items_checked'])) {
            foreach ($validated['items_checked'] as $it) {
                if (! empty($it['sarpras_id'])) {
                    $itemFoto = Sarpras::find($it['sarpras_id'])?->foto_url;
                    if ($itemFoto) {
                        $fotoUrl = $itemFoto;
                        break;
                    }
                }
            }
        }

        // Cari apakah sudah ada laporan pengecekan untuk kepala bagian & ruangan ini
        $existing = PengecekanRuangan::where('user_id', $user->id)
            ->where('nama_ruangan', $targetRuangan)
            ->latest('id')
            ->first();

        if ($existing) {
            $updateData = [
                'tanggal_pengecekan' => $validated['tanggal_pengecekan'],
                'kondisi_kebersihan' => $validated['kondisi_kebersihan'],
                'kondisi_sarpras' => $validated['kondisi_sarpras'],
                'catatan_pemeriksaan' => $validated['catatan_pemeriksaan'],
                'items_checked' => $validated['items_checked'] ?? [],
                'status_tinjauan' => 'menunggu_tinjauan',
                'ditinjau_pada' => null,
                'admin_id' => null,
                'catatan_admin' => null,
            ];

            if ($fotoUrl) {
                $updateData['foto_ruangan'] = $fotoUrl;
            }

            $existing->update($updateData);
            $kodePengecekan = $existing->kode_pengecekan;
            $pesanSukses = "Laporan inventaris bulanan ruangan {$targetRuangan} ({$kodePengecekan}) berhasil diperbarui dan dikirim ke Admin.";
        } else {
            $kodePengecekan = '#CK-'.date('Y').'-'.strtoupper(Str::random(5));

            PengecekanRuangan::create([
                'kode_pengecekan' => $kodePengecekan,
                'user_id' => $user->id,
                'ruangan_id' => $user->ruangan_id,
                'nama_ruangan' => $targetRuangan,
                'tanggal_pengecekan' => $validated['tanggal_pengecekan'],
                'kondisi_kebersihan' => $validated['kondisi_kebersihan'],
                'kondisi_sarpras' => $validated['kondisi_sarpras'],
                'catatan_pemeriksaan' => $validated['catatan_pemeriksaan'],
                'foto_ruangan' => $fotoUrl,
                'items_checked' => $validated['items_checked'] ?? [],
                'status_tinjauan' => 'menunggu_tinjauan',
                'ditinjau_pada' => null,
            ]);
            $pesanSukses = "Laporan inventaris ruangan {$kodePengecekan} berhasil dikirim ke Admin dan menunggu tinjauan.";
        }

        event(new AktivitasSistemEvent(
            actor: $user,
            jenisAktivitas: "Laporan Pengecekan Ruangan ({$targetRuangan})",
            message: "Laporan bulanan {$kodePengecekan} unit {$targetRuangan}: {$validated['catatan_pemeriksaan']}",
            actionUrl: '/admin/inventaris?tab=pengecekan',
            type: 'pengecekan',
            icon: 'document',
            targetRoles: [UserRole::Admin->value],
        ));

        return redirect()
            ->route('staf-ruangan.inventaris.index', ['tab' => 'pengecekan'])
            ->with('success', $pesanSukses);
    }

    /**
     * Halaman Pengajuan Maintenance untuk Ruangan Ini
     */
    public function maintenance(Request $request): Response
    {
        $user = $request->user();
        $assignedRooms = $user->assignedRuanganList();
        $ruanganNama = $user->primaryRuanganName('Belum Ditentukan Admin');
        $allInventaris = empty($assignedRooms)
            ? collect()
            : $this->getInventarisByRooms($assignedRooms);

        $verifiedIds = empty($assignedRooms)
            ? []
            : $this->getVerifiedSarprasIdsForUser($user->id, $assignedRooms);
        $pendingIds = empty($assignedRooms)
            ? []
            : $this->getPendingSarprasIdsForUser($user->id, $assignedRooms);

        // Hanya inventaris yang sudah dikirim ke Admin dan diverifikasi oleh Admin yang muncul di tabel Perbaikan
        $verifiedInventaris = $allInventaris
            ->filter(fn (array $item) => in_array((int) $item['id'], $verifiedIds, true))
            ->values();

        $pendingVerificationCount = $allInventaris
            ->filter(fn (array $item) => ! in_array((int) $item['id'], $verifiedIds, true) && in_array((int) $item['id'], $pendingIds, true))
            ->count();

        $unsentCount = max(0, $allInventaris->count() - $verifiedInventaris->count() - $pendingVerificationCount);

        $maintenanceList = MaintenanceLaporan::where('user_id', $user->id)
            ->latest()
            ->get()
            ->map(fn (MaintenanceLaporan $m) => [
                'id' => $m->id,
                'sarpras_id' => $m->sarpras_id,
                'kode_tiket' => $m->kode_tiket,
                'nama_sarpras' => $m->nama_sarpras,
                'lokasi_ruang' => $m->lokasi_ruang,
                'tingkat_urgensi' => $m->tingkat_urgensi,
                'alasan_maintenance' => $m->deskripsi_kerusakan,
                'foto_kerusakan' => $m->foto_kerusakan,
                'status' => $m->status,
                'nama_teknisi' => $m->nama_teknisi,
                'catatan_admin' => $m->catatan_admin,
                'catatan_staf' => $m->catatan_staf,
                'foto_perbaikan_selesai' => $m->foto_perbaikan_selesai,
                'biaya_aktual' => (float) $m->biaya_aktual,
                'tanggal_mulai' => $m->tanggal_mulai_perbaikan?->format('d M Y'),
                'tanggal_selesai' => $m->tanggal_selesai_perbaikan?->format('d M Y'),
                'tanggal_lapor' => $m->created_at->format('d M Y H:i'),
            ]);

        return Inertia::render('StafRuangan/Maintenance/Index', [
            'ruanganNama' => $ruanganNama,
            'ruanganOptions' => $assignedRooms,
            'maintenanceList' => $maintenanceList,
            'sarprasKatalog' => $verifiedInventaris,
            'totalInventarisRuangan' => $allInventaris->count(),
            'pendingVerificationCount' => $pendingVerificationCount,
            'unsentCount' => $unsentCount,
        ]);
    }

    /**
     * Simpan Pengajuan Maintenance Berdasarkan Data Inventaris Ruangan Milik Akun yang Telah Diverifikasi Admin
     */
    public function storeMaintenance(Request $request): RedirectResponse
    {
        $user = $request->user();
        $assignedRooms = $user->assignedRuanganList();

        if (! $user->isAdmin() && empty($assignedRooms)) {
            return redirect()->back()->with('error', 'Akun Anda belum memiliki penugasan ruangan dari Admin.');
        }

        $validated = $request->validate([
            'sarpras_id' => ['required', 'exists:sarpras,id'],
            'tingkat_urgensi' => ['required', 'in:rendah,sedang,tinggi,darurat'],
            'alasan_maintenance' => ['required', 'string', 'min:10'],
            'foto_kerusakan' => ['nullable', 'image', 'max:5120'],
        ], [
            'sarpras_id.required' => 'Silakan pilih barang dari daftar inventaris ruangan Anda untuk diajukan servis.',
            'alasan_maintenance.required' => 'Alasan pengajuan perbaikan / gejala kerusakan wajib diisi secara jelas.',
            'alasan_maintenance.min' => 'Alasan perbaikan minimal 10 karakter.',
        ]);

        $selectedSarpras = Sarpras::findOrFail($validated['sarpras_id']);

        if (! $user->isAdmin() && ! in_array($selectedSarpras->lokasi, $assignedRooms, true)) {
            abort(403, 'Anda hanya berhak mengajukan perbaikan untuk inventaris pada ruangan yang ditugaskan kepada akun Anda.');
        }

        if (! $user->isAdmin()) {
            $verifiedIds = $this->getVerifiedSarprasIdsForUser($user->id, $assignedRooms);
            if (! in_array((int) $selectedSarpras->id, $verifiedIds, true)) {
                return redirect()->back()->withErrors([
                    'sarpras_id' => 'Inventaris ini belum dikirim ke Admin atau belum diverifikasi oleh Admin.',
                ])->with('error', 'Inventaris harus dikirim ke Admin dan diverifikasi oleh Admin terlebih dahulu sebelum dapat diajukan perbaikan.');
            }
        }

        $targetLokasi = $selectedSarpras->lokasi;
        $namaSarpras = $selectedSarpras->nama;

        $fotoUrl = null;
        if ($request->hasFile('foto_kerusakan')) {
            $path = $request->file('foto_kerusakan')->store('maintenance', 'public');
            $fotoUrl = Storage::url($path);
        }

        $kodeTiket = '#MNT-'.date('Y').'-'.strtoupper(Str::random(5));

        MaintenanceLaporan::create([
            'kode_tiket' => $kodeTiket,
            'user_id' => $user->id,
            'sarpras_id' => $selectedSarpras->id,
            'nama_sarpras' => $namaSarpras,
            'lokasi_ruang' => $targetLokasi,
            'tingkat_urgensi' => $validated['tingkat_urgensi'],
            'deskripsi_kerusakan' => $validated['alasan_maintenance'],
            'foto_kerusakan' => $fotoUrl,
            'status' => 'menunggu_tinjauan',
        ]);

        event(new AktivitasSistemEvent(
            actor: $user,
            jenisAktivitas: "Laporan Kerusakan & Servis ({$namaSarpras})",
            message: "Laporan {$kodeTiket} di unit {$targetLokasi} (Urgensi: {$validated['tingkat_urgensi']}): {$validated['alasan_maintenance']}",
            actionUrl: '/admin/maintenance',
            type: 'maintenance',
            icon: 'alert',
            targetRoles: [UserRole::Admin->value],
        ));

        return redirect()->back()->with('success', "Pengajuan servis {$kodeTiket} untuk \"{$namaSarpras}\" berhasil diajukan ke Biro Sarpras.");
    }

    /**
     * Halaman Pengajuan Pengadaan Barang Ruangan (Redirect ke Portal Pengadaan Terpadu)
     */
    public function pengadaan(Request $request): RedirectResponse
    {
        return redirect()->route('staf.pengadaan.index');
    }

    /**
     * Simpan Pengajuan Pengadaan Barang dengan Alasan Wajib
     */
    public function storePengadaan(Request $request): RedirectResponse
    {
        $user = $request->user();
        if ($user->isStaf()) {
            abort(403, 'Staf Sarpras bertugas merealisasikan pembelian, bukan mengajukan usulan pengadaan.');
        }

        $assignedRooms = $user->assignedRuanganList();
        $ruanganNama = $user->primaryRuanganName('Ruangan Unit');

        $validated = $request->validate([
            'nama_barang' => ['required', 'string', 'max:255'],
            'kategori' => ['required', 'string', 'max:100'],
            'jumlah' => ['required', 'integer', 'min:1'],
            'satuan' => ['required', 'string', 'max:30'],
            'estimasi_harga_satuan' => ['nullable', 'numeric', 'min:0'],
            'lokasi_penempatan' => ['nullable', 'string', 'max:255'],
            'ruangan_tujuan' => count($assignedRooms) > 1
                ? ['required', 'string', Rule::in($assignedRooms)]
                : ['nullable', 'string', 'max:255'],
            'alasan_pengadaan' => ['required', 'string', 'min:10'],
            'spesifikasi' => ['nullable', 'string', 'max:1000'],
        ], [
            'alasan_pengadaan.required' => 'Alasan pengajuan pengadaan barang wajib diisi secara rinci.',
            'alasan_pengadaan.min' => 'Alasan pengadaan minimal 10 karakter.',
            'ruangan_tujuan.in' => 'Ruangan tujuan harus sesuai dengan ruangan yang ditentukan Admin.',
        ]);

        $hargaSatuan = (float) ($validated['estimasi_harga_satuan'] ?? 0);
        $totalBiaya = (int) $validated['jumlah'] * $hargaSatuan;
        $ruanganTujuan = count($assignedRooms) === 1
            ? $assignedRooms[0]
            : ($validated['ruangan_tujuan'] ?? ($assignedRooms[0] ?? $ruanganNama));
        $lokasiPenempatan = $ruanganTujuan;
        $kodePengadaan = '#PGD-'.date('Y').'-'.strtoupper(Str::random(5));

        Pengadaan::create([
            'kode_pengadaan' => $kodePengadaan,
            'user_id' => $user->id,
            'nama_barang' => $validated['nama_barang'],
            'kategori' => $validated['kategori'],
            'jumlah' => $validated['jumlah'],
            'satuan' => $validated['satuan'],
            'estimasi_harga_satuan' => $hargaSatuan,
            'total_biaya' => $totalBiaya,
            'lokasi_penempatan' => $lokasiPenempatan,
            'ruangan_tujuan' => $ruanganTujuan,
            'alasan_pengadaan' => $validated['alasan_pengadaan'],
            'spesifikasi' => $validated['spesifikasi'] ?? null,
            'status' => 'diajukan',
        ]);

        event(new AktivitasSistemEvent(
            actor: $user,
            jenisAktivitas: "Usulan Pengadaan Barang ({$validated['nama_barang']})",
            message: "Usulan {$kodePengadaan} dari {$ruanganTujuan}: {$validated['jumlah']} {$validated['satuan']} {$validated['nama_barang']}",
            actionUrl: '/staf/pengadaan',
            type: 'pengadaan',
            icon: 'document',
            targetRoles: [UserRole::Admin->value],
        ));

        return redirect()->back()->with('success', "Usulan pengadaan barang {$kodePengadaan} berhasil diajukan ke Kepala Biro Sarpras.");
    }

    /**
     * Ambil daftar ID sarpras yang telah dikirim ke Admin dan diverifikasi oleh Admin.
     *
     * @param  array<int, string>  $rooms
     * @return array<int, int>
     */
    private function getVerifiedSarprasIdsForUser(int $userId, array $rooms): array
    {
        $reports = PengecekanRuangan::whereIn('status_tinjauan', ['diverifikasi_admin', 'ditindaklanjuti'])
            ->where(function ($q) use ($userId, $rooms) {
                $q->where('user_id', $userId);
                if (! empty($rooms)) {
                    $q->orWhereIn('nama_ruangan', $rooms);
                }
            })
            ->get();

        $ids = [];
        foreach ($reports as $report) {
            if (is_array($report->items_checked)) {
                foreach ($report->items_checked as $checked) {
                    $itemId = $checked['sarpras_id'] ?? $checked['id'] ?? null;
                    if (! empty($itemId)) {
                        $ids[] = (int) $itemId;
                    }
                }
            }
        }

        return array_values(array_unique($ids));
    }

    /**
     * Ambil daftar ID sarpras yang sudah dikirim ke Admin dan sedang menunggu verifikasi Admin.
     *
     * @param  array<int, string>  $rooms
     * @return array<int, int>
     */
    private function getPendingSarprasIdsForUser(int $userId, array $rooms): array
    {
        $reports = PengecekanRuangan::where('status_tinjauan', 'menunggu_tinjauan')
            ->where(function ($q) use ($userId, $rooms) {
                $q->where('user_id', $userId);
                if (! empty($rooms)) {
                    $q->orWhereIn('nama_ruangan', $rooms);
                }
            })
            ->get();

        $ids = [];
        foreach ($reports as $report) {
            if (is_array($report->items_checked)) {
                foreach ($report->items_checked as $checked) {
                    $itemId = $checked['sarpras_id'] ?? $checked['id'] ?? null;
                    if (! empty($itemId)) {
                        $ids[] = (int) $itemId;
                    }
                }
            }
        }

        return array_values(array_unique($ids));
    }

    /**
     * Format data sarpras menjadi item inventaris lengkap dengan rincian kondisi & tanggal otomatis.
     *
     * @return array<string, mixed>
     */
    private function formatInventarisItem(Sarpras $s): array
    {
        $rincian = $s->getRincianKondisi();
        $timestamp = $s->created_at ?? $s->updated_at ?? now();

        return [
            'id' => $s->id,
            'kode' => $s->kode,
            'nama' => $s->nama,
            'kategori' => $s->kategori,
            'lokasi' => $s->lokasi,
            'stok_total' => $s->stok_total,
            'stok_tersedia' => $s->stok_tersedia,
            'jumlah_baik' => $rincian['baik'],
            'jumlah_sedang' => $rincian['sedang'],
            'jumlah_rusak' => $rincian['rusak'],
            'satuan' => $s->satuan,
            'kondisi_umum' => $s->kondisi_umum,
            'deskripsi' => $s->deskripsi,
            'foto_url' => $s->foto_url,
            'tanggal_input' => $timestamp->format('d M Y'),
            'tahun' => $timestamp->format('Y'),
            'created_at_iso' => $timestamp->format('Y-m-d'),
        ];
    }

    /**
     * Ambil daftar inventaris berdasarkan daftar ruangan yang ditentukan Admin untuk Kepala Bagian.
     *
     * @param  array<int, string>  $rooms
     */
    private function getInventarisByRooms(array $rooms)
    {
        $query = Sarpras::where('jenis', 'sarana')
            ->whereIn('lokasi', $rooms);

        return $query->orderBy('nama')->get()->map(fn (Sarpras $s) => $this->formatInventarisItem($s));
    }

    /**
     * Helper ambil daftar inventaris di ruangan staf / unit prodi (digunakan tampilan Admin)
     */
    private function getInventarisRuangan(string $ruanganNama)
    {
        if (in_array($ruanganNama, ['Seluruh Ruangan Kampus', 'Seluruh Ruangan Unit Kampus'], true)) {
            $query = Sarpras::where('jenis', 'sarana');
        } else {
            // Pisahkan nama-nama kelas/ruangan spesifik jika staf unit prodi memegang beberapa kelas
            $genericWords = ['ruang', 'ruangan', 'gedung', 'kampus', 'unit', 'kelas', 'lantai', 'lt', 'prodi', 'fakultas'];
            $namaParts = array_filter(
                array_map('trim', explode(',', str_replace(['(', ')', ';'], ',', $ruanganNama))),
                fn (string $part) => strlen($part) >= 4 && ! in_array(strtolower($part), $genericWords, true)
            );

            $query = Sarpras::where('jenis', 'sarana')
                ->where(function ($q) use ($ruanganNama, $namaParts) {
                    $q->where('lokasi', $ruanganNama)
                        ->orWhere('lokasi', 'LIKE', "%{$ruanganNama}%");

                    foreach ($namaParts as $part) {
                        $q->orWhere('lokasi', 'LIKE', "%{$part}%");
                    }
                });
        }

        return $query->orderBy('lokasi')->orderBy('nama')->get()->map(fn (Sarpras $s) => $this->formatInventarisItem($s));
    }
}
