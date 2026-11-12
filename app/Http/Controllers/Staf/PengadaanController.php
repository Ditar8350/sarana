<?php

namespace App\Http\Controllers\Staf;

use App\Enums\UserRole;
use App\Events\AktivitasSistemEvent;
use App\Http\Controllers\Controller;
use App\Models\Pengadaan;
use App\Models\Sarpras;
use App\Models\User;
use App\Notifications\AktivitasBaruNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PengadaanController extends Controller
{
    /**
     * Tampilkan data pengadaan / rencana kebutuhan barang
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $role = $user->role instanceof UserRole ? $user->role->value : (string) $user->role;
        $isAdmin = $user->isAdmin();
        $isStaf = $user->isStaf();
        $isKepalaBagian = $user->isKepalaBagian();

        $query = Pengadaan::with(['user', 'staf', 'admin', 'sarpras'])->latest();

        if ($isKepalaBagian) {
            // Kepala Bagian memantau rencana usulan dari ruangannya sendiri
            $query->where('user_id', $user->id);
        }

        $pengadaanList = $query->get()->map(fn (Pengadaan $p) => [
            'id' => $p->id,
            'kode_pengadaan' => $p->kode_pengadaan,
            'user_id' => $p->user_id,
            'pelapor_nama' => $p->user?->name ?? 'Pengusul',
            'pelapor_role' => $p->user?->role?->label() ?? 'Kepala Bagian',
            'staf_id' => $p->staf_id,
            'staf_nama' => $p->staf?->name,
            'admin_nama' => $p->admin?->name,
            'nama_barang' => $p->nama_barang,
            'kategori' => $p->kategori,
            'jumlah' => $p->jumlah,
            'satuan' => $p->satuan,
            'estimasi_harga_satuan' => (float) $p->estimasi_harga_satuan,
            'total_biaya' => (float) $p->total_biaya,
            'lokasi_penempatan' => $p->lokasi_penempatan,
            'ruangan_tujuan' => $p->ruangan_tujuan,
            'alasan_pengadaan' => $p->alasan_pengadaan,
            'spesifikasi' => $p->spesifikasi,
            'nama_toko_vendor' => $p->nama_toko_vendor,
            'foto_bukti_nota' => $p->foto_bukti_nota,
            'tanggal_pembelian' => $p->tanggal_pembelian?->format('d/m/Y'),
            'status' => $p->status,
            'catatan_admin' => $p->catatan_admin,
            'sarpras_id' => $p->sarpras_id,
            'is_converted_to_sarpras' => ! empty($p->sarpras_id),
            'is_assigned_to_me' => $isStaf && ($p->staf_id === $user->id || $p->staf_id === null),
            'tanggal_dibuat' => $p->created_at->format('d M Y H:i'),
        ]);

        $stafUsers = User::where('role', UserRole::Staf->value)
            ->select('id', 'name', 'no_hp')
            ->orderBy('name')
            ->get()
            ->map(fn (User $u): array => [
                'id' => $u->id,
                'name' => $u->name,
                'no_hp' => $u->no_hp,
            ]);

        $assignedRooms = $user->assignedRuanganList();
        $userRuangan = $user->primaryRuanganName('');

        $allRuanganList = Sarpras::where('jenis', 'prasarana')->pluck('nama')->filter()->unique()->values()->toArray();
        if (empty($allRuanganList)) {
            $allRuanganList = ['Gudang Sarpras Kampus A', 'Gudang Sarpras Kampus B', 'Biro Sarpras', 'Ruang Rapat Senat', 'Laboratorium Komputer', 'Aula Utama'];
        }

        return Inertia::render('Staf/Pengadaan/Index', [
            'pengadaanList' => $pengadaanList,
            'stafUsers' => $stafUsers,
            'currentUserId' => $user->id,
            'userRuangan' => $userRuangan,
            'assignedRooms' => $assignedRooms,
            'allRuanganList' => $allRuanganList,
            'userRole' => $isKepalaBagian ? 'kepala_bagian' : $role,
            'isAdmin' => $isAdmin,
            'isStaf' => $isStaf,
            'isKepalaBagian' => $isKepalaBagian,
        ]);
    }

    /**
     * Staf Sarpras / Kepala Bagian / Admin mengajukan rencana kebutuhan barang baru
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        $isKepalaBagian = $user->isKepalaBagian();
        $isStaf = $user->isStaf();
        $assignedRooms = $user->assignedRuanganList();

        $validated = $request->validate([
            'nama_barang' => ['required', 'string', 'max:255'],
            'kategori' => ['required', 'string', 'max:100'],
            'jumlah' => ['required', 'integer', 'min:1'],
            'satuan' => ['required', 'string', 'max:30'],
            'estimasi_harga_satuan' => ['nullable', 'numeric', 'min:0'],
            'lokasi_penempatan' => ['nullable', 'string', 'max:255'], // Gedung / Kampus
            'ruangan_tujuan' => ($isKepalaBagian && count($assignedRooms) > 1)
                ? ['required', 'string', Rule::in($assignedRooms)]
                : ['nullable', 'string', 'max:255'],                  // Ruangan spesifik
            'alasan_pengadaan' => ['required', 'string', 'max:500'],   // Alasan kebutuhan
            'spesifikasi' => ['nullable', 'string', 'max:1000'],
        ], [
            'ruangan_tujuan.in' => 'Ruangan tujuan harus sesuai dengan penugasan ruangan dari Admin.',
        ]);

        $defaultRuangan = $user->primaryRuanganName($isStaf ? 'Gudang Sarpras' : 'Ruangan Unit');
        if ($isKepalaBagian && count($assignedRooms) === 1) {
            $ruanganTujuan = $assignedRooms[0];
            $lokasiPenempatan = $assignedRooms[0];
        } elseif ($isKepalaBagian && count($assignedRooms) > 1) {
            $ruanganTujuan = $validated['ruangan_tujuan'];
            $lokasiPenempatan = $validated['lokasi_penempatan'] ?: $ruanganTujuan;
        } else {
            $lokasiPenempatan = $validated['lokasi_penempatan'] ?? $validated['ruangan_tujuan'] ?? $defaultRuangan;
            $ruanganTujuan = $validated['ruangan_tujuan'] ?? $lokasiPenempatan;
        }
        $hargaSatuan = (float) ($validated['estimasi_harga_satuan'] ?? 0);
        $totalBiaya = (int) $validated['jumlah'] * $hargaSatuan;

        $kode = '#PGD-'.date('Y').'-'.strtoupper(Str::random(5));

        $pengadaan = Pengadaan::create([
            'kode_pengadaan' => $kode,
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
            'status' => 'diajukan', // Menunggu validasi admin
        ]);

        event(new AktivitasSistemEvent(
            actor: $user,
            jenisAktivitas: "Usulan Pengadaan Barang ({$pengadaan->nama_barang})",
            message: "Pengajuan {$pengadaan->kode_pengadaan} oleh {$user->name} ({$user->role?->label()}): {$pengadaan->jumlah} {$pengadaan->satuan} {$pengadaan->nama_barang} ({$pengadaan->ruangan_tujuan})",
            actionUrl: '/staf/pengadaan',
            type: 'pengadaan',
            icon: 'shopping-cart',
            targetRoles: [UserRole::Admin->value],
        ));

        // Kirim notifikasi database ke semua Admin
        $admins = User::where('role', UserRole::Admin->value)->get();
        foreach ($admins as $adminUser) {
            $adminUser->notify(new AktivitasBaruNotification(
                title: "Usulan Pengadaan Baru ({$pengadaan->kode_pengadaan})",
                message: "{$user->name} ({$user->role?->label()}) mengajukan pengadaan {$pengadaan->nama_barang} ({$pengadaan->jumlah} {$pengadaan->satuan}) untuk {$pengadaan->ruangan_tujuan}.",
                actionUrl: '/staf/pengadaan',
                type: 'pengadaan',
            ));
        }

        return redirect()->back()->with('success', "Rencana kebutuhan barang {$pengadaan->nama_barang} ({$pengadaan->kode_pengadaan}) berhasil diajukan dan menunggu validasi Admin!");
    }

    /**
     * Staf Sarpras membelanjakan barang yang telah di-ACC & mengunggah bukti nota
     */
    public function uploadNota(Request $request, Pengadaan $pengadaan): RedirectResponse
    {
        $user = $request->user();
        if (! $user->isStaf() && ! $user->isAdmin()) {
            abort(403, 'Hanya Staf Sarpras yang dapat mengunggah bukti pembelian.');
        }

        if ($pengadaan->status !== 'disetujui') {
            abort(422, 'Hanya usulan pengadaan yang telah disetujui Admin yang dapat dibelanjakan.');
        }

        if ($user->isStaf() && $pengadaan->staf_id !== null && $pengadaan->staf_id !== $user->id) {
            abort(403, 'Pengadaan ini ditugaskan kepada staf sarpras lain.');
        }

        $validated = $request->validate([
            'tanggal_pembelian' => ['required', 'date'],
            'estimasi_harga_satuan' => ['required', 'numeric', 'min:0'],
            'foto_bukti_nota' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf,webp', 'max:5120'],
            'nama_toko_vendor' => ['nullable', 'string', 'max:255'],
            'spesifikasi' => ['nullable', 'string', 'max:1000'],
        ]);

        $path = $request->file('foto_bukti_nota')->store('uploads/pengadaan', 'public');
        $fotoPath = '/storage/'.$path;

        $totalBiaya = $pengadaan->jumlah * $validated['estimasi_harga_satuan'];

        $pengadaan->update([
            'staf_id' => $user->id,
            'tanggal_pembelian' => $validated['tanggal_pembelian'],
            'estimasi_harga_satuan' => $validated['estimasi_harga_satuan'],
            'total_biaya' => $totalBiaya,
            'foto_bukti_nota' => $fotoPath,
            'nama_toko_vendor' => $validated['nama_toko_vendor'] ?? $pengadaan->nama_toko_vendor,
            'spesifikasi' => $validated['spesifikasi'] ?? $pengadaan->spesifikasi,
            'status' => 'selesai',
        ]);

        // Otomatis daftarkan barang hasil belanja ke katalog sarpras & alokasikan ke ruangan Kepala Bagian
        if (! $pengadaan->sarpras_id) {
            $ruanganAlokasi = $pengadaan->ruangan_tujuan ?: ($pengadaan->lokasi_penempatan ?: 'Ruangan Kampus');
            $cleanPrefix = preg_replace('/[^a-zA-Z0-9]/', '', $ruanganAlokasi);
            $prefix = strtoupper(substr($cleanPrefix ?: 'INV', 0, 4));
            if (strlen($prefix) < 3) {
                $prefix = 'AST';
            }
            $kodeSarpras = $prefix.'-'.date('ym').'-'.strtoupper(Str::random(4));

            $sarpras = Sarpras::create([
                'kode' => $kodeSarpras,
                'nama' => $pengadaan->nama_barang,
                'jenis' => 'sarana',
                'kategori' => $pengadaan->kategori ?: 'Inventaris Ruangan',
                'lokasi' => $ruanganAlokasi,
                'stok_total' => $pengadaan->jumlah,
                'stok_tersedia' => $pengadaan->jumlah,
                'satuan' => $pengadaan->satuan ?: 'Unit',
                'kondisi_umum' => 'baik',
                'dapat_dipinjam' => false,
                'deskripsi' => "Pengadaan {$pengadaan->kode_pengadaan}. Toko/Vendor: ".($validated['nama_toko_vendor'] ?? '-').". Dialokasikan untuk unit: {$ruanganAlokasi}",
                'foto' => $fotoPath,
            ]);

            $pengadaan->update(['sarpras_id' => $sarpras->id]);
        }

        // Notifikasi ke Admin & Kepala Bagian pengusul
        event(new AktivitasSistemEvent(
            actor: $user,
            jenisAktivitas: "Realisasi Pembelian Pengadaan ({$pengadaan->nama_barang})",
            message: "Barang {$pengadaan->nama_barang} ({$pengadaan->jumlah} {$pengadaan->satuan}) telah selesai dibeli oleh staf {$user->name} dan langsung dialokasikan ke {$pengadaan->ruangan_tujuan}.",
            actionUrl: '/staf/pengadaan',
            type: 'pengadaan',
            icon: 'check',
            targetRoles: [UserRole::Admin->value],
            targetUserIds: $pengadaan->user_id,
        ));

        return redirect()->back()->with('success', "Pembelian {$pengadaan->nama_barang} ({$pengadaan->kode_pengadaan}) telah selesai dibelanjakan, bukti nota tersimpan, dan barang langsung didaftarkan ke inventaris ruangan!");
    }

    /**
     * Admin memvalidasi rencana kebutuhan & opsi integrasi ke Master Stok Sarpras
     */
    public function updateStatus(Request $request, Pengadaan $pengadaan): RedirectResponse
    {
        $user = $request->user();
        if (! $user->isAdmin()) {
            abort(403, 'Hanya Admin yang dapat memvalidasi usulan pengadaan.');
        }

        $validated = $request->validate([
            'status' => ['required', 'in:diajukan,disetujui,selesai,ditolak'],
            'staf_id' => ['nullable', 'exists:users,id'],
            'catatan_admin' => ['nullable', 'string', 'max:500'],
            'masukkan_ke_sarpras' => ['nullable', 'boolean'],
        ]);

        $updatePayload = [
            'status' => $validated['status'],
            'admin_id' => $user->id,
            'catatan_admin' => $validated['catatan_admin'] ?? $pengadaan->catatan_admin,
        ];

        if (array_key_exists('staf_id', $validated) && $validated['staf_id']) {
            $updatePayload['staf_id'] = $validated['staf_id'];
        }

        $pengadaan->update($updatePayload);

        // Jika disetujui / selesai dan admin ingin langsung memasukkan ke katalog stok Sarpras
        if (in_array($validated['status'], ['disetujui', 'selesai']) && ! empty($validated['masukkan_ke_sarpras']) && ! $pengadaan->sarpras_id) {
            $ruanganAlokasi = $pengadaan->ruangan_tujuan ?: ($pengadaan->lokasi_penempatan ?: 'Ruangan Kampus');
            $kodeSarpras = 'SR-'.strtoupper(Str::random(6));
            $sarpras = Sarpras::create([
                'kode' => $kodeSarpras,
                'nama' => $pengadaan->nama_barang,
                'jenis' => 'sarana',
                'kategori' => $pengadaan->kategori ?: 'Inventaris Ruangan',
                'lokasi' => $ruanganAlokasi,
                'stok_total' => $pengadaan->jumlah,
                'stok_tersedia' => $pengadaan->jumlah,
                'satuan' => $pengadaan->satuan ?: 'Unit',
                'kondisi_umum' => 'baik',
                'dapat_dipinjam' => true,
                'deskripsi' => "Pengadaan {$pengadaan->kode_pengadaan}. Spek: {$pengadaan->spesifikasi}",
            ]);

            $pengadaan->update(['sarpras_id' => $sarpras->id]);
        }

        // Notifikasi tertarget ke Pengusul (Kepala Bagian) & Staf Pelaksana
        if ($validated['status'] === 'disetujui') {
            if ($pengadaan->user && $pengadaan->user_id !== $user->id) {
                $pengadaan->user->notify(new AktivitasBaruNotification(
                    title: "Usulan Pengadaan Disetujui ({$pengadaan->kode_pengadaan})",
                    message: "Usulan {$pengadaan->nama_barang} ({$pengadaan->jumlah} {$pengadaan->satuan}) untuk {$pengadaan->ruangan_tujuan} telah disetujui Admin.",
                    actionUrl: '/staf/pengadaan',
                    type: 'pengadaan',
                    icon: 'check',
                ));
            }

            if ($pengadaan->staf_id) {
                $stafPelaksana = User::find($pengadaan->staf_id);
                $stafPelaksana?->notify(new AktivitasBaruNotification(
                    title: "Tugas Belanja Pengadaan ({$pengadaan->kode_pengadaan})",
                    message: "Anda ditugaskan membeli {$pengadaan->jumlah} {$pengadaan->satuan} {$pengadaan->nama_barang} untuk {$pengadaan->ruangan_tujuan}.",
                    actionUrl: '/staf/pengadaan',
                    type: 'pengadaan',
                    icon: 'document',
                ));
            } else {
                event(new AktivitasSistemEvent(
                    actor: $user,
                    jenisAktivitas: "Pengadaan Disetujui untuk Dibeli ({$pengadaan->nama_barang})",
                    message: "Usulan {$pengadaan->kode_pengadaan} ({$pengadaan->jumlah} {$pengadaan->satuan} {$pengadaan->nama_barang}) siap dibelanjakan oleh Staf Sarpras.",
                    actionUrl: '/staf/pengadaan',
                    type: 'pengadaan',
                    icon: 'document',
                    targetRoles: [UserRole::Staf->value],
                ));
            }
        } elseif ($validated['status'] === 'ditolak' && $pengadaan->user && $pengadaan->user_id !== $user->id) {
            $pengadaan->user->notify(new AktivitasBaruNotification(
                title: "Usulan Pengadaan Ditolak ({$pengadaan->kode_pengadaan})",
                message: "Usulan {$pengadaan->nama_barang} ditolak oleh Admin. Alasan: ".($validated['catatan_admin'] ?? '-'),
                actionUrl: '/staf/pengadaan',
                type: 'pengadaan',
                icon: 'alert',
            ));
        }

        return redirect()->back()->with('success', "Status pengadaan {$pengadaan->kode_pengadaan} berhasil diperbarui.");
    }
}
