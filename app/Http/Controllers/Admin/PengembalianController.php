<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\MaintenanceLaporan;
use App\Models\Peminjaman;
use App\Models\PeminjamanLog;
use App\Models\Pengembalian;
use App\Models\Sarpras;
use App\Models\SarprasStockMutation;
use App\Notifications\AktivitasBaruNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PengembalianController extends Controller
{
    /**
     * Menampilkan daftar pengembalian dan barang yang perlu inspeksi
     */
    public function index(Request $request): Response|RedirectResponse
    {
        if (! in_array($request->user()->role, [UserRole::Admin, UserRole::Staf], true)) {
            return redirect()->route('layanan.pengembalian.index');
        }

        $pengembalianList = Pengembalian::with(['peminjaman.items.sarpras', 'user', 'admin'])
            ->latest()
            ->get()
            ->map(fn (Pengembalian $k): array => [
                'id' => $k->id,
                'kode' => $k->kode_pengembalian,
                'kode_peminjaman' => $k->peminjaman?->kode_transaksi ?? '-',
                'peminjam' => $k->peminjaman?->nama_peminjam ?? $k->user?->name ?? '-',
                'nim_nip' => $k->peminjaman?->nim_nip ?? $k->user?->nomor_induk ?? '-',
                'instansi_prodi' => $k->peminjaman?->instansi_prodi ?? '-',
                'no_whatsapp' => $k->peminjaman?->no_whatsapp ?? '-',
                'tanggal_kembali' => $k->tanggal_pengajuan_kembali?->format('d M Y H:i'),
                'tanggal_verifikasi' => $k->tanggal_diterima?->format('d M Y H:i'),
                'foto_bukti' => $k->foto_bukti_kembali,
                'catatan_mahasiswa' => $k->catatan_mahasiswa,
                'status_verifikasi' => $k->status_verifikasi,
                'biaya_denda' => (float) $k->biaya_denda,
                'nomor_rekening' => $k->nomor_rekening,
                'status_pembayaran_denda' => $k->status_pembayaran_denda,
                'bukti_bayar_denda' => $k->bukti_bayar_denda,
                'catatan_bayar_denda' => $k->catatan_bayar_denda,
                'diverifikasi_denda_pada' => $k->diverifikasi_denda_pada?->format('d M Y H:i'),
                'verifikator_denda' => $k->verifikatorDenda?->name,
                'catatan_inspeksi_admin' => $k->catatan_inspeksi_admin,
                'pemeriksa_nama' => $k->admin?->name ?? 'Staf Sarpras',
                'items' => $k->peminjaman?->items->map(fn ($it) => [
                    'id' => $it->id,
                    'sarpras_id' => $it->sarpras_id,
                    'nama_barang' => $it->sarpras?->nama ?? 'Barang',
                    'qty' => $it->qty,
                    'satuan' => $it->sarpras?->satuan ?? 'Unit',
                    'kondisi_sebelum' => $it->kondisi_sebelum,
                    'kondisi_sesudah' => $it->kondisi_sesudah,
                ]) ?? [],
            ]);

        // Daftar peminjaman aktif yang siap dikembalikan jika diproses langsung oleh admin/staf
        $peminjamanAktif = Peminjaman::whereIn('status', ['disetujui', 'siap_diambil', 'sedang_dipinjam', 'menunggu_kembali'])
            ->with(['items.sarpras', 'user'])
            ->latest()
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'kode' => $p->kode_transaksi,
                'peminjam' => $p->nama_peminjam ?? $p->user?->name ?? 'Peminjam',
                'nim_nip' => $p->nim_nip ?? $p->user?->nomor_induk ?? '-',
                'instansi_prodi' => $p->instansi_prodi ?? '-',
                'tanggal_mulai' => $p->tanggal_mulai?->format('d M Y'),
                'tanggal_kembali_rencana' => $p->tanggal_kembali_rencana?->format('d M Y'),
                'status' => $p->status,
                'items' => $p->items->map(fn ($it) => [
                    'id' => $it->id,
                    'sarpras_id' => $it->sarpras_id,
                    'nama_barang' => $it->sarpras?->nama ?? 'Barang',
                    'qty' => $it->qty,
                    'satuan' => $it->sarpras?->satuan ?? 'Unit',
                ]),
            ]);

        return Inertia::render('Admin/Pengembalian/Index', [
            'pengembalianList' => $pengembalianList,
            'peminjamanAktif' => $peminjamanAktif,
            'currentUserRole' => $request->user()->role->value ?? (string) $request->user()->role,
            'currentUserId' => $request->user()->id,
        ]);
    }

    /**
     * Staf Sarpras Memverifikasi Pengembalian Fisik, Cek Kondisi & Menentukan Denda
     */
    public function verifikasi(Request $request, Pengembalian $pengembalian): RedirectResponse
    {
        if (! in_array($request->user()->role, [UserRole::Admin, UserRole::Staf], true)) {
            abort(403, 'Hanya Staf atau Admin Sarpras yang dapat melakukan inspeksi fisik pengembalian.');
        }

        $request->validate([
            'kondisi_items' => ['required', 'array'], // [item_id => 'sempurna'|'rusak_ringan'|'rusak_berat'|'hilang']
            'catatan_inspeksi_admin' => ['nullable', 'string', 'max:500'],
            'biaya_denda' => ['nullable', 'numeric', 'min:0'],
            'nomor_rekening' => ['nullable', 'string', 'max:255'],
            'buat_tiket_maintenance' => ['nullable', 'boolean'],
        ]);

        $buatTiketMaintenance = $request->boolean('buat_tiket_maintenance', true);

        DB::transaction(function () use ($pengembalian, $request, $buatTiketMaintenance) {
            $peminjaman = $pengembalian->peminjaman()->lockForUpdate()->firstOrFail();
            $hasDamage = false;
            $denda = (float) $request->input('biaya_denda', 0);

            foreach ($peminjaman->items as $item) {
                $kondisi = $request->kondisi_items[$item->id] ?? 'sempurna';
                if (in_array($kondisi, ['rusak_ringan', 'rusak_berat', 'hilang'], true)) {
                    $hasDamage = true;
                }

                $item->update([
                    'kondisi_sesudah' => $kondisi,
                ]);

                $sarpras = Sarpras::where('id', $item->sarpras_id)->lockForUpdate()->firstOrFail();
                $stokSebelum = $sarpras->stok_tersedia;

                if ($kondisi === 'hilang' || $kondisi === 'rusak_berat') {
                    // Barang rusak berat atau hilang: stok total berkurang permanen, stok tersedia tidak ditambah
                    $sarpras->decrement('stok_total', $item->qty);
                    $sarpras->update(['kondisi_umum' => 'rusak_berat']);
                    $stokSesudah = $sarpras->fresh()->stok_tersedia;
                } else {
                    // Sempurna / Rusak ringan: kembalikan stok barang yang tersedia
                    $sarpras->increment('stok_tersedia', $item->qty);
                    $stokSesudah = $sarpras->fresh()->stok_tersedia;
                    if ($kondisi === 'rusak_ringan') {
                        $sarpras->update(['kondisi_umum' => 'rusak_ringan']);
                    }
                }

                // Mutasi stok masuk
                SarprasStockMutation::create([
                    'sarpras_id' => $sarpras->id,
                    'peminjaman_id' => $peminjaman->id,
                    'tipe' => 'masuk',
                    'jumlah' => $item->qty,
                    'stok_sebelum' => $stokSebelum,
                    'stok_sesudah' => $stokSesudah,
                    'keterangan' => "Pengembalian {$pengembalian->kode_pengembalian} (Kondisi: {$kondisi})",
                    'created_by' => auth()->id(),
                ]);

                // Buat tiket maintenance otomatis jika saat kembali ditemukan rusak dengan denda otomatis dialokasikan
                if ($buatTiketMaintenance && in_array($kondisi, ['rusak_ringan', 'rusak_berat'])) {
                    MaintenanceLaporan::create([
                        'kode_tiket' => '#MNT-'.date('Y').'-'.strtoupper(Str::random(5)),
                        'user_id' => auth()->id(),
                        'admin_id' => $request->user()?->isAdmin() ? auth()->id() : null,
                        'sarpras_id' => $sarpras->id,
                        'nama_sarpras' => $sarpras->nama,
                        'lokasi_ruang' => $sarpras->lokasi,
                        'tingkat_urgensi' => $kondisi === 'rusak_berat' ? 'darurat' : 'sedang',
                        'deskripsi_kerusakan' => "Terdeteksi rusak saat pengembalian transaksi {$peminjaman->kode_transaksi} ({$kondisi}). Catatan: ".($request->catatan_inspeksi_admin ?? 'Butuh perbaikan teknisi.'),
                        'status' => 'menunggu_tinjauan',
                        'estimasi_biaya' => $denda, // Denda kerusakan yang diberikan langsung diintegrasikan sebagai biaya perbaikan
                    ]);
                }
            }

            $denda = $hasDamage ? $denda : 0;
            $nomorRekening = $request->input('nomor_rekening') ?: 'BSI (Bank Syariah Indonesia) No. Rek: 7182938475 a.n. Biro Sarpras Universitas Nurul Huda';
            $statusDenda = $denda > 0 ? 'menunggu_pembayaran' : 'tidak_ada_denda';

            $pengembalian->update([
                'admin_id' => auth()->id(),
                'tanggal_diterima' => now(),
                'status_verifikasi' => $denda > 0 ? 'ada_kerusakan_hilang' : 'disetujui_lengkap',
                'biaya_denda' => $denda,
                'nomor_rekening' => $denda > 0 ? $nomorRekening : null,
                'status_pembayaran_denda' => $statusDenda,
                'catatan_inspeksi_admin' => $request->catatan_inspeksi_admin,
            ]);

            $statusSebelum = $peminjaman->status;
            $peminjaman->update([
                'status' => 'selesai',
                'tanggal_kembali_aktual' => now(),
            ]);

            PeminjamanLog::create([
                'peminjaman_id' => $peminjaman->id,
                'actor_id' => auth()->id(),
                'status_sebelum' => $statusSebelum,
                'status_sesudah' => 'selesai',
                'keterangan' => 'Pengembalian diverifikasi selesai oleh admin. Stok barang telah dikembalikan ke sistem.',
            ]);
        });

        $pengembalian->refresh();
        if ($pengembalian->user) {
            if ((float) $pengembalian->biaya_denda > 0) {
                $nominalFormatted = number_format((float) $pengembalian->biaya_denda, 0, ',', '.');
                $pengembalian->user->notify(new AktivitasBaruNotification(
                    title: "Tagihan Denda Pengembalian ({$pengembalian->kode_pengembalian})",
                    message: "Ditemukan kerusakan/kehilangan dengan denda Rp {$nominalFormatted}. Silakan transfer ke {$pengembalian->nomor_rekening} dan unggah bukti pembayaran.",
                    actionUrl: '/layanan/pengembalian',
                    type: 'pengembalian',
                    icon: 'alert',
                ));
            } else {
                $pengembalian->user->notify(new AktivitasBaruNotification(
                    title: "Pengembalian Diverifikasi Selesai ({$pengembalian->kode_pengembalian})",
                    message: 'Pengembalian sarpras Anda telah diverifikasi lengkap dan selesai tanpa denda.',
                    actionUrl: '/layanan/pengembalian',
                    type: 'pengembalian',
                    icon: 'check',
                ));
            }
        }

        return redirect()->back()->with('success', 'Pengembalian berhasil diverifikasi dan stok telah bertambah kembali.');
    }

    /**
     * Admin Memverifikasi Pembayaran Denda Kerusakan / Keterlambatan
     */
    public function verifikasiDenda(Request $request, Pengembalian $pengembalian): RedirectResponse
    {
        if (! $request->user()->isAdmin()) {
            abort(403, 'Hanya Admin Sarpras yang dapat memverifikasi pembayaran denda.');
        }

        $validated = $request->validate([
            'status_denda' => ['required', 'in:lunas,ditolak'],
            'catatan_admin' => ['nullable', 'string', 'max:500'],
        ]);

        if ($validated['status_denda'] === 'lunas') {
            $pengembalian->update([
                'status_pembayaran_denda' => 'lunas',
                'diverifikasi_denda_oleh' => auth()->id(),
                'diverifikasi_denda_pada' => now(),
                'catatan_inspeksi_admin' => $validated['catatan_admin']
                    ? trim($pengembalian->catatan_inspeksi_admin." | Lunas: {$validated['catatan_admin']}")
                    : $pengembalian->catatan_inspeksi_admin,
            ]);

            if ($pengembalian->user) {
                $pengembalian->user->notify(new AktivitasBaruNotification(
                    title: "Denda Telah Lunas ({$pengembalian->kode_pengembalian})",
                    message: 'Pembayaran denda sebesar Rp '.number_format((float) $pengembalian->biaya_denda, 0, ',', '.').' telah diverifikasi LUNAS oleh Admin Sarpras.',
                    actionUrl: '/layanan/pengembalian',
                    type: 'pengembalian',
                    icon: 'check',
                ));
            }

            return redirect()->back()->with('success', "Pembayaran denda {$pengembalian->kode_pengembalian} berhasil diverifikasi Lunas.");
        } else {
            $pengembalian->update([
                'status_pembayaran_denda' => 'menunggu_pembayaran',
                'catatan_inspeksi_admin' => $validated['catatan_admin']
                    ? trim($pengembalian->catatan_inspeksi_admin." | Bukti Ditolak: {$validated['catatan_admin']}")
                    : $pengembalian->catatan_inspeksi_admin,
            ]);

            if ($pengembalian->user) {
                $pengembalian->user->notify(new AktivitasBaruNotification(
                    title: "Bukti Pembayaran Denda Ditolak ({$pengembalian->kode_pengembalian})",
                    message: 'Bukti pembayaran denda ditolak oleh Admin. Catatan: '.($validated['catatan_admin'] ?? 'Silakan upload ulang bukti transfer yang valid.'),
                    actionUrl: '/layanan/pengembalian',
                    type: 'pengembalian',
                    icon: 'alert',
                ));
            }

            return redirect()->back()->with('warning', 'Bukti pembayaran denda ditolak. Peminjam diminta untuk mengunggah ulang bukti transfer.');
        }
    }
}
