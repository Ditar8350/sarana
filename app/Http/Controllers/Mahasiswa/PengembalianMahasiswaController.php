<?php

namespace App\Http\Controllers\Mahasiswa;

use App\Events\AktivitasSistemEvent;
use App\Http\Controllers\Controller;
use App\Models\Peminjaman;
use App\Models\PeminjamanLog;
use App\Models\Pengembalian;
use App\Models\User;
use App\Notifications\AktivitasBaruNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PengembalianMahasiswaController extends Controller
{
    /**
     * Tampilkan halaman pengembalian sarpras untuk mahasiswa
     */
    public function index(Request $request): Response
    {
        $userId = auth()->id();

        // 1. Barang yang saat ini aktif dipinjam / disetujui (perlu dikembalikan)
        $sedangDipinjam = Peminjaman::where('user_id', $userId)
            ->whereIn('status', ['disetujui', 'siap_diambil', 'sedang_dipinjam'])
            ->with(['items.sarpras'])
            ->latest()
            ->get()
            ->map(fn (Peminjaman $p): array => [
                'id' => $p->id,
                'kode' => $p->kode_transaksi,
                'nama_peminjam' => $p->nama_peminjam,
                'nim_nip' => $p->nim_nip,
                'instansi_prodi' => $p->instansi_prodi,
                'keperluan' => $p->keperluan,
                'status_peminjaman' => $p->status,
                'tanggal_mulai' => $p->tanggal_mulai->format('d M Y'),
                'tanggal_kembali_rencana' => $p->tanggal_kembali_rencana->format('d M Y'),
                'petugas_pengambilan' => $p->petugas_pengambilan,
                'no_hp_pendamping' => $p->no_hp_pendamping ?: ($p->pendampingStaf?->no_hp ?? null),
                'lokasi_pengambilan' => $p->lokasi_pengambilan,
                'is_overdue' => now()->startOfDay()->gt($p->tanggal_kembali_rencana->startOfDay()),
                'items' => $p->items->unique('sarpras_id')->values()->map(fn ($it) => [
                    'id' => $it->id,
                    'sarpras_id' => $it->sarpras_id,
                    'nama_barang' => $it->sarpras?->nama ?? 'Fasilitas',
                    'jenis' => $it->sarpras?->jenis ?? 'sarana',
                    'lokasi' => $it->sarpras?->lokasi ?? '-',
                    'foto_url' => $it->sarpras?->foto_url,
                    'qty' => $it->qty,
                    'satuan' => $it->sarpras?->satuan ?? 'Unit',
                ]),
            ]);

        // 2. Pengembalian yang sudah diajukan bukti fotonya dan sedang menunggu inspeksi fisik staf gudang
        $menungguInspeksi = Peminjaman::where('user_id', $userId)
            ->where('status', 'menunggu_kembali')
            ->with(['items.sarpras', 'pengembalian'])
            ->latest()
            ->get()
            ->map(fn (Peminjaman $p): array => [
                'id' => $p->id,
                'kode' => $p->kode_transaksi,
                'nama_peminjam' => $p->nama_peminjam,
                'nim_nip' => $p->nim_nip,
                'instansi_prodi' => $p->instansi_prodi,
                'keperluan' => $p->keperluan,
                'tanggal_mulai' => $p->tanggal_mulai->format('d M Y'),
                'tanggal_kembali_rencana' => $p->tanggal_kembali_rencana->format('d M Y'),
                'kode_pengembalian' => $p->pengembalian?->kode_pengembalian,
                'tanggal_pengajuan_kembali' => $p->pengembalian?->tanggal_pengajuan_kembali?->format('d M Y H:i'),
                'foto_bukti' => $p->pengembalian?->foto_bukti_kembali,
                'catatan_mahasiswa' => $p->pengembalian?->catatan_mahasiswa,
                'status_verifikasi' => $p->pengembalian?->status_verifikasi ?? 'menunggu_inspeksi',
                'petugas_pengambilan' => $p->petugas_pengambilan,
                'no_hp_pendamping' => $p->no_hp_pendamping ?: ($p->pendampingStaf?->no_hp ?? null),
                'lokasi_pengambilan' => $p->lokasi_pengambilan,
                'items' => $p->items->unique('sarpras_id')->values()->map(fn ($it) => [
                    'id' => $it->id,
                    'nama_barang' => $it->sarpras?->nama ?? 'Fasilitas',
                    'lokasi' => $it->sarpras?->lokasi ?? '-',
                    'foto_url' => $it->sarpras?->foto_url,
                    'qty' => $it->qty,
                    'satuan' => $it->sarpras?->satuan ?? 'Unit',
                ]),
            ]);

        // 3. Riwayat pengembalian yang telah selesai dan diverifikasi staf
        $riwayatSelesai = Pengembalian::where('user_id', $userId)
            ->where('status_verifikasi', '!=', 'menunggu_inspeksi')
            ->with(['peminjaman.items.sarpras', 'admin', 'user'])
            ->latest()
            ->take(30)
            ->get()
            ->map(fn (Pengembalian $k): array => [
                'id' => $k->id,
                'peminjaman_id' => $k->peminjaman_id,
                'kode_pengembalian' => $k->kode_pengembalian,
                'kode_peminjaman' => $k->peminjaman?->kode_transaksi ?? '-',
                'nama_peminjam' => $k->peminjaman?->nama_peminjam ?? $k->user?->name ?? 'Mahasiswa',
                'nim_nip' => $k->peminjaman?->nim_nip ?? '-',
                'instansi_prodi' => $k->peminjaman?->instansi_prodi ?? '-',
                'keperluan' => $k->peminjaman?->keperluan ?? '-',
                'tanggal_mulai' => $k->peminjaman?->tanggal_mulai?->format('d M Y') ?? '-',
                'tanggal_kembali_rencana' => $k->peminjaman?->tanggal_kembali_rencana?->format('d M Y') ?? '-',
                'tanggal_kembali' => $k->tanggal_pengajuan_kembali?->format('d M Y H:i'),
                'tanggal_verifikasi' => $k->tanggal_diterima?->format('d M Y H:i') ?? $k->updated_at?->format('d M Y H:i'),
                'foto_bukti' => $k->foto_bukti_kembali,
                'catatan_mahasiswa' => $k->catatan_mahasiswa,
                'status_verifikasi' => $k->status_verifikasi,
                'biaya_denda' => (float) $k->biaya_denda,
                'nomor_rekening' => $k->nomor_rekening,
                'status_pembayaran_denda' => $k->status_pembayaran_denda,
                'bukti_bayar_denda' => $k->bukti_bayar_denda,
                'catatan_bayar_denda' => $k->catatan_bayar_denda,
                'diverifikasi_denda_pada' => $k->diverifikasi_denda_pada?->format('d M Y H:i'),
                'catatan_inspeksi_admin' => $k->catatan_inspeksi_admin,
                'pemeriksa_nama' => $k->admin?->name ?? 'Staf Sarpras',
                'lokasi_pengambilan' => $k->peminjaman?->lokasi_pengambilan,
                'items' => $k->peminjaman?->items->unique('sarpras_id')->values()->map(fn ($it) => [
                    'id' => $it->id,
                    'nama_barang' => $it->sarpras?->nama ?? 'Fasilitas',
                    'jenis' => $it->sarpras?->jenis ?? 'sarana',
                    'lokasi' => $it->sarpras?->lokasi ?? '-',
                    'foto_url' => $it->sarpras?->foto_url,
                    'qty' => $it->qty,
                    'satuan' => $it->satuan ?? $it->sarpras?->satuan ?? 'Unit',
                    'kondisi_sesudah' => $it->kondisi_sesudah ?? 'baik',
                ]) ?? [],
            ]);

        return Inertia::render('Mahasiswa/Pengembalian/Index', [
            'sedangDipinjam' => $sedangDipinjam,
            'menungguInspeksi' => $menungguInspeksi,
            'riwayatSelesai' => $riwayatSelesai,
        ]);
    }

    /**
     * Mahasiswa mengunggah foto bukti fisik dan mengajukan konfirmasi pengembalian
     */
    public function store(Request $request, Peminjaman $peminjaman): RedirectResponse
    {
        if ($peminjaman->user_id !== auth()->id()) {
            abort(403, 'Akses tidak diizinkan.');
        }

        if (! in_array($peminjaman->status, ['disetujui', 'siap_diambil', 'sedang_dipinjam'])) {
            return redirect()->back()->with('error', 'Status peminjaman ini tidak dapat diajukan pengembalian.');
        }

        $request->validate([
            'foto_bukti' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
            'catatan' => ['nullable', 'string', 'max:500'],
        ], [
            'foto_bukti.required' => 'Foto bukti kondisi fisik sarpras saat dikembalikan wajib diunggah.',
            'foto_bukti.max' => 'Ukuran foto bukti tidak boleh melebihi 5MB.',
        ]);

        $fotoPath = $request->file('foto_bukti')->store('uploads/pengembalian', 'public');

        $kode = '#KB-'.date('Y').'-'.strtoupper(Str::random(5));

        DB::transaction(function () use ($peminjaman, $fotoPath, $request, $kode) {
            Pengembalian::create([
                'kode_pengembalian' => $kode,
                'peminjaman_id' => $peminjaman->id,
                'user_id' => auth()->id(),
                'tanggal_pengajuan_kembali' => now(),
                'foto_bukti_kembali' => '/storage/'.$fotoPath,
                'catatan_mahasiswa' => $request->catatan,
                'status_verifikasi' => 'menunggu_inspeksi',
            ]);

            $statusSebelum = $peminjaman->status;

            $peminjaman->update([
                'status' => 'menunggu_kembali',
            ]);

            PeminjamanLog::create([
                'peminjaman_id' => $peminjaman->id,
                'actor_id' => auth()->id(),
                'status_sebelum' => $statusSebelum,
                'status_sesudah' => 'menunggu_kembali',
                'keterangan' => 'Peminjam mengajukan pengembalian dengan unggahan bukti foto fisik.',
            ]);
        });

        event(new AktivitasSistemEvent(
            actor: $request->user(),
            jenisAktivitas: 'Konfirmasi Pengembalian Barang',
            message: "Pengembalian {$kode} ({$peminjaman->kode_transaksi}) menunggu inspeksi fisik di pos sarpras.",
            actionUrl: '/admin/pengembalian',
            type: 'pengembalian',
            icon: 'alert',
        ));

        if ($peminjaman->pendampingStaf) {
            $peminjaman->pendampingStaf->notify(new AktivitasBaruNotification(
                title: "Pengembalian Masuk ({$peminjaman->kode_transaksi})",
                message: "Peminjam {$peminjaman->nama_peminjam} telah menyerahkan/mengunggah bukti fasilitas. Silakan lakukan cek kondisi fisik barang di loket.",
                actionUrl: '/admin/pengembalian',
                type: 'pengembalian',
                icon: 'check',
            ));
        }

        return redirect()->back()->with('success', 'Pengajuan pengembalian berhasil diajukan! Silakan serahkan fasilitas fisik ke loket Sarpras untuk verifikasi dan cek fisik oleh Staf.');
    }

    /**
     * Mahasiswa / Umum mengunggah bukti pembayaran denda kerusakan atau keterlambatan
     */
    public function bayarDenda(Request $request, Pengembalian $pengembalian): RedirectResponse
    {
        if ($pengembalian->user_id !== auth()->id()) {
            abort(403, 'Akses tidak diizinkan.');
        }

        if ($pengembalian->biaya_denda <= 0) {
            return redirect()->back()->with('error', 'Tidak ada tagihan denda untuk transaksi ini.');
        }

        if (! $request->hasFile('bukti_bayar_denda') && $request->hasFile('bukti_denda')) {
            $request->files->set('bukti_bayar_denda', $request->file('bukti_denda'));
        }

        $request->validate([
            'bukti_bayar_denda' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
            'catatan_bayar_denda' => ['nullable', 'string', 'max:500'],
            'catatan' => ['nullable', 'string', 'max:500'],
        ], [
            'bukti_bayar_denda.required' => 'Foto struk atau bukti transfer pembayaran denda wajib diunggah.',
            'bukti_bayar_denda.mimes' => 'Format file bukti transfer harus berupa JPG, PNG, WEBP, atau PDF.',
            'bukti_bayar_denda.max' => 'Ukuran file bukti transfer maksimal 5MB.',
        ]);

        $path = $request->file('bukti_bayar_denda')->store('bukti_denda', 'public');
        $buktiUrl = Storage::url($path);

        $pengembalian->update([
            'bukti_bayar_denda' => $buktiUrl,
            'catatan_bayar_denda' => $request->input('catatan_bayar_denda') ?? $request->input('catatan'),
            'status_pembayaran_denda' => 'menunggu_verifikasi_admin',
        ]);

        $nominalFormatted = number_format((float) $pengembalian->biaya_denda, 0, ',', '.');

        event(new AktivitasSistemEvent(
            actor: $request->user(),
            jenisAktivitas: "Pembayaran Denda Dikirim ({$pengembalian->kode_pengembalian})",
            message: "Peminjam {$request->user()->name} telah mengunggah bukti bayar denda Rp {$nominalFormatted}. Menunggu verifikasi admin.",
            actionUrl: '/admin/pengembalian',
            type: 'pengembalian',
            icon: 'document',
        ));

        $adminUsers = User::where('role', 'admin')->get();
        foreach ($adminUsers as $admin) {
            $admin->notify(new AktivitasBaruNotification(
                title: "Pembayaran Denda Masuk ({$pengembalian->kode_pengembalian})",
                message: "Peminjam {$request->user()->name} telah mengunggah bukti bayar denda Rp {$nominalFormatted}. Silakan verifikasi pelunasan.",
                actionUrl: '/admin/pengembalian',
                type: 'pengembalian',
                icon: 'document',
            ));
        }

        return redirect()->back()->with('success', 'Bukti pembayaran denda berhasil diunggah. Menunggu verifikasi dari Admin Sarpras.');
    }
}
