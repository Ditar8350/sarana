<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Peminjaman;
use App\Models\PeminjamanLog;
use App\Models\Sarpras;
use App\Models\SarprasStockMutation;
use App\Models\User;
use App\Notifications\AktivitasBaruNotification;
use Exception;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PeminjamanController extends Controller
{
    /**
     * Menampilkan daftar transaksi peminjaman sarpras
     */
    public function index(Request $request): Response|RedirectResponse
    {
        $user = $request->user();
        if (! in_array($user->role, [UserRole::Admin, UserRole::Staf], true)) {
            return redirect()->route('layanan.peminjaman.index');
        }

        $isStaf = $user->isStaf();

        $peminjamans = Peminjaman::with(['items.sarpras', 'user', 'pendampingStaf'])
            ->latest()
            ->get()
            ->map(function (Peminjaman $p) use ($user, $isStaf): array {
                // Bersihkan item duplikat (sarpras_id yang sama dalam 1 transaksi) bila ada
                $seenSarprasIds = [];
                $uniqueItems = [];
                foreach ($p->items as $it) {
                    if (in_array($it->sarpras_id, $seenSarprasIds, true)) {
                        $it->delete();

                        continue;
                    }
                    $seenSarprasIds[] = $it->sarpras_id;
                    $uniqueItems[] = [
                        'id' => $it->id,
                        'sarpras_id' => $it->sarpras_id,
                        'nama_barang' => $it->sarpras?->nama ?? 'Barang Dihapus',
                        'qty' => $it->qty,
                        'satuan' => $it->sarpras?->satuan ?? 'Unit',
                        'kondisi_sebelum' => $it->kondisi_sebelum,
                    ];
                }

                $userClean = strtolower(trim(preg_replace('/\s*\(.*?\)/', '', $user->name)));
                $petugasClean = strtolower(trim(preg_replace('/\s*\(.*?\)/', '', (string) $p->petugas_pengambilan)));
                $isAssignedToMe = $isStaf && (
                    ((int) $p->pendamping_staf_id === (int) $user->id) ||
                    ($userClean !== '' && $petugasClean !== '' && (
                        $userClean === $petugasClean ||
                        str_contains($userClean, $petugasClean) ||
                        str_contains($petugasClean, $userClean)
                    ))
                );

                return [
                    'id' => $p->id,
                    'kode' => $p->kode_transaksi,
                    'peminjam' => $p->nama_peminjam,
                    'nim_nip' => $p->nim_nip,
                    'unit' => $p->instansi_prodi,
                    'no_whatsapp' => $p->no_whatsapp,
                    'file_ktm' => $p->file_ktm,
                    'file_surat_pengantar' => $p->file_surat_pengantar,
                    'keperluan' => $p->keperluan,
                    'tanggal_mulai' => $p->tanggal_mulai->format('d M Y'),
                    'tanggal_kembali_rencana' => $p->tanggal_kembali_rencana->format('d M Y'),
                    'tanggal_mulai_raw' => $p->tanggal_mulai->format('Y-m-d'),
                    'tanggal_kembali_raw' => $p->tanggal_kembali_rencana->format('Y-m-d'),
                    'status' => $p->status,
                    'catatan_admin' => $p->catatan_admin,
                    'petugas_pengambilan' => $p->petugas_pengambilan,
                    'pendamping_staf_id' => $p->pendamping_staf_id,
                    'no_hp_pendamping' => $p->no_hp_pendamping ?: ($p->pendampingStaf?->no_hp ?? null),
                    'lokasi_pengambilan' => $p->lokasi_pengambilan,
                    'foto_bukti_terima' => $p->foto_bukti_terima,
                    'tanggal_terima' => $p->tanggal_terima?->format('d M Y H:i'),
                    'is_assigned_to_me' => $isAssignedToMe,
                    'items' => $uniqueItems,
                ];
            });

        $stafUsers = User::where('role', UserRole::Staf->value)
            ->orderBy('name')
            ->get(['id', 'name', 'role', 'no_hp']);

        return Inertia::render('Admin/Peminjaman/Index', [
            'peminjamanList' => $peminjamans,
            'stafUsers' => $stafUsers,
            'currentUserRole' => $user->role->value ?? (string) $user->role,
            'currentUserId' => $user->id,
        ]);
    }

    /**
     * Helper mencari User Staf dari ID atau string nama petugas
     */
    private function resolveStafPendamping(?int $stafId, ?string $petugasLabel): ?User
    {
        if ($stafId) {
            $user = User::where('role', UserRole::Staf->value)->find($stafId);
            if ($user) {
                return $user;
            }
        }

        if ($petugasLabel) {
            $exact = User::where('role', UserRole::Staf->value)
                ->where('name', $petugasLabel)
                ->first();
            if ($exact) {
                return $exact;
            }

            $cleanLabel = strtolower(trim(preg_replace('/\s*\(.*?\)/', '', $petugasLabel)));
            if ($cleanLabel !== '') {
                $stafUsers = User::where('role', UserRole::Staf->value)->get();
                foreach ($stafUsers as $u) {
                    $uClean = strtolower(trim(preg_replace('/\s*\(.*?\)/', '', $u->name)));
                    if ($uClean === $cleanLabel || str_contains($uClean, $cleanLabel) || str_contains($cleanLabel, $uClean)) {
                        return $u;
                    }
                }
            }

            return User::where('role', UserRole::Staf->value)
                ->where('name', 'like', "%{$petugasLabel}%")
                ->first();
        }

        return null;
    }

    /**
     * Step 2: Admin Validasi & Menyetujui Peminjaman (Status: Disetujui - Menunggu Pembagian Staf Step 3)
     */
    public function approve(Request $request, Peminjaman $peminjaman): RedirectResponse
    {
        if (! $request->user()->isAdmin()) {
            abort(403, 'Hanya Admin yang dapat memvalidasi pengajuan peminjaman.');
        }

        try {
            $assignedStaf = null;

            DB::transaction(function () use ($peminjaman, $request, &$assignedStaf) {
                $peminjaman = Peminjaman::where('id', $peminjaman->id)
                    ->whereIn('status', ['menunggu_validasi', 'ditunda'])
                    ->lockForUpdate()
                    ->firstOrFail();

                foreach ($peminjaman->items as $item) {
                    $sarpras = Sarpras::where('id', $item->sarpras_id)->firstOrFail();
                    if ($sarpras->stok_tersedia < $item->qty) {
                        throw new Exception("Stok untuk {$sarpras->nama} saat ini tidak mencukupi (Tersedia: {$sarpras->stok_tersedia}, Diminta: {$item->qty}).");
                    }
                }

                $statusSebelum = $peminjaman->status;
                $pendampingStafId = $request->input('pendamping_staf_id') ? (int) $request->input('pendamping_staf_id') : null;
                $petugasInput = $request->input('petugas_pengambilan');
                $staf = $this->resolveStafPendamping($pendampingStafId, $petugasInput);
                $assignedStaf = $staf;

                $petugasPengambilan = $petugasInput ?: ($staf ? $staf->name : $peminjaman->petugas_pengambilan);
                $noHpInput = $request->input('no_hp_pendamping');
                $noHpPendamping = $noHpInput ?: ($staf?->no_hp ?? $peminjaman->no_hp_pendamping);

                if ($staf && ! empty($noHpInput) && empty($staf->no_hp)) {
                    $staf->update(['no_hp' => $noHpInput]);
                }

                $peminjaman->update([
                    'status' => 'disetujui',
                    'validated_by' => auth()->id(),
                    'validated_at' => now(),
                    'catatan_admin' => $request->input('catatan_admin', 'Disetujui oleh Admin. Menunggu pembagian staf yang bertugas untuk serah terima barang.'),
                    'petugas_pengambilan' => $petugasPengambilan,
                    'pendamping_staf_id' => $staf?->id ?? ($pendampingStafId ?: $peminjaman->pendamping_staf_id),
                    'no_hp_pendamping' => $noHpPendamping,
                    'lokasi_pengambilan' => $request->input('lokasi_pengambilan') ?: ($peminjaman->lokasi_pengambilan ?: 'Loket Gudang Biro Sarpras Kampus Sukaraja'),
                ]);

                PeminjamanLog::create([
                    'peminjaman_id' => $peminjaman->id,
                    'actor_id' => auth()->id(),
                    'status_sebelum' => $statusSebelum,
                    'status_sesudah' => 'disetujui',
                    'keterangan' => 'Pengajuan peminjaman disetujui oleh Admin (Step 2). Dilanjutkan ke pembagian staf yang bertugas.',
                ]);
            });

            if ($peminjaman->user) {
                $peminjaman->user->notify(new AktivitasBaruNotification(
                    title: "Peminjaman Disetujui ({$peminjaman->kode_transaksi})",
                    message: 'Pengajuan peminjaman Anda telah disetujui oleh Admin Sarpras.',
                    actionUrl: '/layanan/peminjaman',
                    type: 'peminjaman',
                    icon: 'document',
                ));
            }

            if ($assignedStaf && $assignedStaf->id !== auth()->id()) {
                $assignedStaf->notify(new AktivitasBaruNotification(
                    title: "Tugas Pendampingan Peminjaman ({$peminjaman->kode_transaksi})",
                    message: "Anda ditugaskan mendampingi serah terima peminjaman {$peminjaman->nama_peminjam} di {$peminjaman->lokasi_pengambilan}.",
                    actionUrl: '/admin/peminjaman',
                    type: 'peminjaman',
                    icon: 'document',
                ));
            }

            return redirect()->back()->with('success', "Peminjaman {$peminjaman->kode_transaksi} berhasil disetujui (Step 2). Silakan lanjutkan dengan Pembagian Staf yang Bertugas pada Step 3.");
        } catch (Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    /**
     * Admin Menunda Pengajuan Peminjaman
     */
    public function tunda(Request $request, Peminjaman $peminjaman): RedirectResponse
    {
        $request->validate([
            'alasan' => ['required', 'string', 'max:500'],
        ]);

        DB::transaction(function () use ($peminjaman, $request) {
            $statusSebelum = $peminjaman->status;

            $peminjaman->update([
                'status' => 'ditunda',
                'validated_by' => auth()->id(),
                'validated_at' => now(),
                'catatan_admin' => $request->alasan,
            ]);

            PeminjamanLog::create([
                'peminjaman_id' => $peminjaman->id,
                'actor_id' => auth()->id(),
                'status_sebelum' => $statusSebelum,
                'status_sesudah' => 'ditunda',
                'keterangan' => "Peminjaman ditunda oleh Admin. Catatan: {$request->alasan}",
            ]);
        });

        return redirect()->back()->with('success', "Status pengajuan peminjaman {$peminjaman->kode_transaksi} diubah menjadi Ditunda.");
    }

    /**
     * Step 3: Pembagian Staf yang Bertugas & Validasi Serah Terima Loket
     */
    public function serahkan(Request $request, Peminjaman $peminjaman): RedirectResponse
    {
        $request->validate([
            'petugas_pengambilan' => ['required', 'string', 'max:255'],
            'lokasi_pengambilan' => ['required', 'string', 'max:255'],
            'catatan_staf' => ['nullable', 'string', 'max:500'],
        ], [
            'petugas_pengambilan.required' => 'Nama staf yang bertugas wajib dipilih atau diisi.',
            'lokasi_pengambilan.required' => 'Lokasi serah terima barang wajib diisi.',
        ]);

        try {
            $assignedStaf = null;

            DB::transaction(function () use ($peminjaman, $request, &$assignedStaf) {
                $peminjaman = Peminjaman::where('id', $peminjaman->id)
                    ->whereIn('status', ['disetujui', 'siap_diambil', 'menunggu_validasi'])
                    ->lockForUpdate()
                    ->firstOrFail();

                // Cek apakah mutasi keluar sudah pernah dicatat
                $sudahMutasi = SarprasStockMutation::where('peminjaman_id', $peminjaman->id)
                    ->where('tipe', 'keluar')
                    ->exists();

                if (! $sudahMutasi) {
                    foreach ($peminjaman->items as $item) {
                        $sarpras = Sarpras::where('id', $item->sarpras_id)->lockForUpdate()->firstOrFail();

                        if ($sarpras->stok_tersedia < $item->qty) {
                            throw new Exception("Stok untuk {$sarpras->nama} tidak mencukupi (Tersedia: {$sarpras->stok_tersedia}, Diminta: {$item->qty}).");
                        }

                        $stokSebelum = $sarpras->stok_tersedia;
                        $sarpras->decrement('stok_tersedia', $item->qty);
                        $stokSesudah = $sarpras->fresh()->stok_tersedia;

                        SarprasStockMutation::create([
                            'sarpras_id' => $sarpras->id,
                            'peminjaman_id' => $peminjaman->id,
                            'tipe' => 'keluar',
                            'jumlah' => $item->qty,
                            'stok_sebelum' => $stokSebelum,
                            'stok_sesudah' => $stokSesudah,
                            'keterangan' => "Pembagian staf bertugas ({$request->petugas_pengambilan}) untuk peminjaman ({$peminjaman->kode_transaksi})",
                            'created_by' => auth()->id(),
                        ]);
                    }
                }

                $statusSebelum = $peminjaman->status;
                $pendampingStafId = $request->input('pendamping_staf_id') ? (int) $request->input('pendamping_staf_id') : null;
                $petugasInput = $request->input('petugas_pengambilan');
                $staf = $this->resolveStafPendamping($pendampingStafId, $petugasInput);
                $assignedStaf = $staf;

                $petugasNama = $petugasInput ?: ($staf ? $staf->name : $peminjaman->petugas_pengambilan);
                $noHpInput = $request->input('no_hp_pendamping');
                $noHpPendamping = $noHpInput ?: ($staf?->no_hp ?? $peminjaman->no_hp_pendamping);

                if ($staf && ! empty($noHpInput) && empty($staf->no_hp)) {
                    $staf->update(['no_hp' => $noHpInput]);
                }

                $peminjaman->update([
                    'status' => 'siap_diambil',
                    'petugas_pengambilan' => $petugasNama,
                    'pendamping_staf_id' => $staf?->id ?? ($pendampingStafId ?: $peminjaman->pendamping_staf_id),
                    'no_hp_pendamping' => $noHpPendamping,
                    'lokasi_pengambilan' => $request->lokasi_pengambilan,
                    'catatan_admin' => $request->filled('catatan_staf') ? $request->catatan_staf : $peminjaman->catatan_admin,
                    'validated_by' => $peminjaman->validated_by ?? auth()->id(),
                    'validated_at' => $peminjaman->validated_at ?? now(),
                ]);

                PeminjamanLog::create([
                    'peminjaman_id' => $peminjaman->id,
                    'actor_id' => auth()->id(),
                    'status_sebelum' => $statusSebelum,
                    'status_sesudah' => 'siap_diambil',
                    'keterangan' => "Step 3 Tervalidasi: Staf yang bertugas ({$request->petugas_pengambilan}) di {$request->lokasi_pengambilan}. Menunggu unggahan bukti barang diterima pada Step 4.",
                ]);
            });

            if ($peminjaman->user) {
                $peminjaman->user->notify(new AktivitasBaruNotification(
                    title: "Staf Bertugas Ditentukan ({$peminjaman->kode_transaksi})",
                    message: "Silakan temui {$request->petugas_pengambilan} di {$request->lokasi_pengambilan} dan unggah foto barang yang diterima agar peminjaman dinyatakan Sukses.",
                    actionUrl: '/layanan/peminjaman',
                    type: 'peminjaman',
                    icon: 'document',
                ));
            }

            if ($assignedStaf && $assignedStaf->id !== auth()->id()) {
                $assignedStaf->notify(new AktivitasBaruNotification(
                    title: "Tugas Serah Terima Peminjaman ({$peminjaman->kode_transaksi})",
                    message: "Anda ditugaskan melayani serah terima barang untuk {$peminjaman->nama_peminjam} di {$request->lokasi_pengambilan}.",
                    actionUrl: '/admin/peminjaman',
                    type: 'peminjaman',
                    icon: 'document',
                ));
            }

            return redirect()->back()->with('success', "Pembagian staf yang bertugas ({$request->petugas_pengambilan}) untuk {$peminjaman->kode_transaksi} berhasil disimpan (Step 3). Peminjaman akan dinyatakan Sukses (Step 4) setelah bukti barang yang diterima diunggah.");
        } catch (Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    /**
     * Step 4: Upload Bukti Barang yang Diterima (Setelah Validasi Step 3 -> Baru Dinyatakan Sukses)
     */
    public function terimaBarang(Request $request, Peminjaman $peminjaman): RedirectResponse
    {
        $request->validate([
            'foto_bukti_terima' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
        ], [
            'foto_bukti_terima.required' => 'Foto bukti barang yang diterima wajib diunggah agar Step 4 dinyatakan Sukses.',
            'foto_bukti_terima.max' => 'Ukuran foto maksimal 5MB.',
        ]);

        try {
            $path = $request->file('foto_bukti_terima')->store('uploads/terima_barang', 'public');

            DB::transaction(function () use ($peminjaman, $path) {
                $peminjaman = Peminjaman::where('id', $peminjaman->id)
                    ->whereIn('status', ['siap_diambil', 'disetujui', 'sedang_dipinjam'])
                    ->lockForUpdate()
                    ->firstOrFail();

                $sudahMutasi = SarprasStockMutation::where('peminjaman_id', $peminjaman->id)
                    ->where('tipe', 'keluar')
                    ->exists();

                if (! $sudahMutasi) {
                    foreach ($peminjaman->items as $item) {
                        $sarpras = Sarpras::where('id', $item->sarpras_id)->lockForUpdate()->firstOrFail();
                        if ($sarpras->stok_tersedia < $item->qty) {
                            throw new Exception("Stok untuk {$sarpras->nama} tidak mencukupi.");
                        }
                        $stokSebelum = $sarpras->stok_tersedia;
                        $sarpras->decrement('stok_tersedia', $item->qty);
                        $stokSesudah = $sarpras->fresh()->stok_tersedia;

                        SarprasStockMutation::create([
                            'sarpras_id' => $sarpras->id,
                            'peminjaman_id' => $peminjaman->id,
                            'tipe' => 'keluar',
                            'jumlah' => $item->qty,
                            'stok_sebelum' => $stokSebelum,
                            'stok_sesudah' => $stokSesudah,
                            'keterangan' => "Barang diterima peminjam ({$peminjaman->kode_transaksi})",
                            'created_by' => auth()->id(),
                        ]);
                    }
                }

                $statusSebelum = $peminjaman->status;
                $peminjaman->update([
                    'status' => 'sedang_dipinjam',
                    'foto_bukti_terima' => '/storage/'.$path,
                    'tanggal_terima' => now(),
                ]);

                PeminjamanLog::create([
                    'peminjaman_id' => $peminjaman->id,
                    'actor_id' => auth()->id(),
                    'status_sebelum' => $statusSebelum,
                    'status_sesudah' => 'sedang_dipinjam',
                    'keterangan' => 'Bukti barang yang diterima telah diunggah. Step 4 dinyatakan Sukses.',
                ]);
            });

            return redirect()->back()->with('success', "Bukti penerimaan barang {$peminjaman->kode_transaksi} berhasil diunggah! Peminjaman kini dinyatakan Sukses (Step 4).");
        } catch (Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    /**
     * Admin Menolak Pengajuan Peminjaman
     */
    public function reject(Request $request, Peminjaman $peminjaman): RedirectResponse
    {
        $request->validate([
            'alasan' => ['required', 'string', 'max:500'],
        ]);

        DB::transaction(function () use ($peminjaman, $request) {
            $statusSebelum = $peminjaman->status;

            // Kembalikan stok yang sebelumnya terpotong saat diajukan
            $mutasiKeluar = SarprasStockMutation::where('peminjaman_id', $peminjaman->id)
                ->where('tipe', 'keluar')
                ->get();
            foreach ($mutasiKeluar as $mutasi) {
                $sarpras = Sarpras::find($mutasi->sarpras_id);
                if ($sarpras) {
                    $sarpras->increment('stok_tersedia', $mutasi->jumlah);
                }
            }
            SarprasStockMutation::where('peminjaman_id', $peminjaman->id)->delete();

            $peminjaman->update([
                'status' => 'ditolak',
                'validated_by' => auth()->id(),
                'validated_at' => now(),
                'catatan_admin' => $request->alasan,
            ]);

            PeminjamanLog::create([
                'peminjaman_id' => $peminjaman->id,
                'actor_id' => auth()->id(),
                'status_sebelum' => $statusSebelum,
                'status_sesudah' => 'ditolak',
                'keterangan' => "Peminjaman ditolak. Alasan: {$request->alasan}",
            ]);
        });

        if ($peminjaman->user) {
            $peminjaman->user->notify(new AktivitasBaruNotification(
                title: "Pengajuan Peminjaman Ditolak ({$peminjaman->kode_transaksi})",
                message: "Pengajuan peminjaman Anda ditolak. Alasan: {$request->alasan}",
                actionUrl: '/layanan/peminjaman',
                type: 'peminjaman',
                icon: 'alert',
            ));
        }

        return redirect()->back()->with('success', 'Pengajuan peminjaman telah ditolak.');
    }

    /**
     * Edit & Perbarui Data Transaksi Peminjaman (Status, Staf Bertugas, Jadwal, Lokasi, Bukti Terima)
     */
    public function update(Request $request, Peminjaman $peminjaman): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:menunggu_validasi,ditunda,disetujui,siap_diambil,sedang_dipinjam,menunggu_kembali,selesai,ditolak'],
            'petugas_pengambilan' => ['nullable', 'string', 'max:255'],
            'lokasi_pengambilan' => ['nullable', 'string', 'max:255'],
            'tanggal_mulai' => ['nullable', 'date'],
            'tanggal_kembali_rencana' => ['nullable', 'date'],
            'catatan_admin' => ['nullable', 'string', 'max:500'],
            'foto_bukti_terima' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
        ]);

        try {
            $fotoBuktiPath = $peminjaman->foto_bukti_terima;
            if ($request->hasFile('foto_bukti_terima')) {
                $stored = $request->file('foto_bukti_terima')->store('uploads/terima_barang', 'public');
                $fotoBuktiPath = '/storage/'.$stored;
            }

            DB::transaction(function () use ($peminjaman, $validated, $fotoBuktiPath, $request) {
                $statusSebelum = $peminjaman->status;
                $statusBaru = $validated['status'];

                // Jika beralih ke status aktif meminjam dan belum pernah potong stok
                if (in_array($statusBaru, ['siap_diambil', 'sedang_dipinjam'], true)) {
                    $sudahMutasiKeluar = SarprasStockMutation::where('peminjaman_id', $peminjaman->id)
                        ->where('tipe', 'keluar')
                        ->exists();

                    if (! $sudahMutasiKeluar) {
                        foreach ($peminjaman->items->unique('sarpras_id') as $item) {
                            $sarpras = Sarpras::where('id', $item->sarpras_id)->lockForUpdate()->first();
                            if ($sarpras && $sarpras->stok_tersedia >= $item->qty) {
                                $stokSebelum = $sarpras->stok_tersedia;
                                $sarpras->decrement('stok_tersedia', $item->qty);
                                SarprasStockMutation::create([
                                    'sarpras_id' => $sarpras->id,
                                    'peminjaman_id' => $peminjaman->id,
                                    'tipe' => 'keluar',
                                    'jumlah' => $item->qty,
                                    'stok_sebelum' => $stokSebelum,
                                    'stok_sesudah' => $sarpras->fresh()->stok_tersedia,
                                    'keterangan' => "Update status peminjaman ({$peminjaman->kode_transaksi})",
                                    'created_by' => auth()->id(),
                                ]);
                            }
                        }
                    }
                }

                $pendampingStafId = $request->input('pendamping_staf_id') ? (int) $request->input('pendamping_staf_id') : null;
                $petugasInput = $validated['petugas_pengambilan'] ?? $request->input('petugas_pengambilan');
                $staf = $this->resolveStafPendamping($pendampingStafId, $petugasInput);
                if ($staf) {
                    $pendampingStafId = $staf->id;
                    $petugasPengambilan = $staf->name;
                } else {
                    $petugasPengambilan = $petugasInput ?: $peminjaman->petugas_pengambilan;
                }

                $noHpInput = $request->input('no_hp_pendamping');
                $noHpPendamping = $noHpInput ?: ($staf?->no_hp ?? $peminjaman->no_hp_pendamping);

                if ($staf && ! empty($noHpInput) && empty($staf->no_hp)) {
                    $staf->update(['no_hp' => $noHpInput]);
                }

                $lokasiInput = $validated['lokasi_pengambilan'] ?? null;
                $tglMulaiInput = $validated['tanggal_mulai'] ?? null;
                $tglKembaliInput = $validated['tanggal_kembali_rencana'] ?? null;

                $updateData = [
                    'status' => $statusBaru,
                    'petugas_pengambilan' => $statusBaru === 'ditolak' ? null : $petugasPengambilan,
                    'pendamping_staf_id' => $statusBaru === 'ditolak' ? null : $pendampingStafId,
                    'no_hp_pendamping' => $statusBaru === 'ditolak' ? null : $noHpPendamping,
                    'lokasi_pengambilan' => $lokasiInput ?: $peminjaman->lokasi_pengambilan,
                    'tanggal_mulai' => $tglMulaiInput ?: $peminjaman->tanggal_mulai,
                    'tanggal_kembali_rencana' => $tglKembaliInput ?: $peminjaman->tanggal_kembali_rencana,
                    'catatan_admin' => $validated['catatan_admin'] ?? $peminjaman->catatan_admin,
                    'foto_bukti_terima' => $fotoBuktiPath,
                    'tanggal_terima' => ($statusBaru === 'sedang_dipinjam' && ! $peminjaman->tanggal_terima) ? now() : $peminjaman->tanggal_terima,
                ];

                if ($statusBaru === 'ditolak' && ! $peminjaman->validated_at) {
                    $updateData['validated_by'] = auth()->id();
                    $updateData['validated_at'] = now();
                }

                $peminjaman->update($updateData);

                // Jika status diubah menjadi ditolak atau dibatalkan dan sebelumnya sempat memotong stok, kembalikan stok
                if (in_array($statusBaru, ['ditolak', 'dibatalkan'], true)) {
                    $mutasiKeluar = SarprasStockMutation::where('peminjaman_id', $peminjaman->id)
                        ->where('tipe', 'keluar')
                        ->get();
                    foreach ($mutasiKeluar as $mutasi) {
                        $sarpras = Sarpras::find($mutasi->sarpras_id);
                        if ($sarpras) {
                            $sarpras->increment('stok_tersedia', $mutasi->jumlah);
                        }
                    }
                    SarprasStockMutation::where('peminjaman_id', $peminjaman->id)->delete();
                }

                if ($statusSebelum !== $statusBaru) {
                    $keteranganLog = match ($statusBaru) {
                        'ditolak' => 'Pengajuan peminjaman ditolak melalui menu Edit. Alasan: '.($validated['catatan_admin'] ?: 'Tidak ada alasan.'),
                        'disetujui', 'siap_diambil' => 'Pengajuan peminjaman disetujui melalui menu Edit.',
                        default => 'Data dan status peminjaman diperbarui melalui menu Edit.',
                    };

                    PeminjamanLog::create([
                        'peminjaman_id' => $peminjaman->id,
                        'actor_id' => auth()->id(),
                        'status_sebelum' => $statusSebelum,
                        'status_sesudah' => $statusBaru,
                        'keterangan' => $keteranganLog,
                    ]);

                    if ($statusBaru === 'ditolak' && $peminjaman->user) {
                        $peminjaman->user->notify(new AktivitasBaruNotification(
                            title: "Pengajuan Peminjaman Ditolak ({$peminjaman->kode_transaksi})",
                            message: 'Pengajuan peminjaman Anda ditolak oleh Admin Sarpras. Catatan: '.($validated['catatan_admin'] ?: 'Tidak ada catatan tambahan.'),
                            actionUrl: '/layanan/peminjaman',
                            type: 'peminjaman',
                            icon: 'alert',
                        ));
                    } elseif (in_array($statusBaru, ['disetujui', 'siap_diambil'], true) && in_array($statusSebelum, ['menunggu_validasi', 'ditunda', 'ditolak'], true) && $peminjaman->user) {
                        $peminjaman->user->notify(new AktivitasBaruNotification(
                            title: "Peminjaman Disetujui ({$peminjaman->kode_transaksi})",
                            message: 'Pengajuan peminjaman Anda telah disetujui oleh Admin Sarpras.',
                            actionUrl: '/layanan/peminjaman',
                            type: 'peminjaman',
                            icon: 'document',
                        ));
                    }
                }
            });

            return redirect()->back()->with('success', "Data peminjaman {$peminjaman->kode_transaksi} berhasil diperbarui.");
        } catch (Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }
}
