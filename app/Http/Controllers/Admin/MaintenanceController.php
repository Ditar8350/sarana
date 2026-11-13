<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Events\AktivitasSistemEvent;
use App\Http\Controllers\Controller;
use App\Models\MaintenanceLaporan;
use App\Models\Sarpras;
use App\Models\User;
use App\Notifications\AktivitasBaruNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class MaintenanceController extends Controller
{
    /**
     * Tampilkan daftar laporan maintenance & kerusakan sarpras
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isStaf = $user->role === UserRole::Staf;

        $laporans = MaintenanceLaporan::with(['user', 'admin', 'sarpras', 'staf'])
            ->latest()
            ->get()
            ->map(function (MaintenanceLaporan $l) use ($isStaf, $user): array {
                $isFromPengembalian = str_contains((string) $l->deskripsi_kerusakan, 'pengembalian')
                    || str_contains((string) $l->deskripsi_kerusakan, 'Terdeteksi rusak saat');
                $dendaNominal = (float) $l->estimasi_biaya;

                // Jika berasal dari pengembalian barang dan nominal masih 0, sinkronkan dengan denda pengembalian
                if ($isFromPengembalian && $dendaNominal <= 0) {
                    if (preg_match('/#PJ-[A-Za-z0-9-]+/', (string) $l->deskripsi_kerusakan, $matches)) {
                        $peminjamanKode = $matches[0];
                        $pj = \App\Models\Peminjaman::where('kode_transaksi', $peminjamanKode)->with('pengembalian')->first();
                        if ($pj && $pj->pengembalian && $pj->pengembalian->biaya_denda > 0) {
                            $dendaNominal = (float) $pj->pengembalian->biaya_denda;
                            $l->update(['estimasi_biaya' => $dendaNominal]);
                        }
                    }
                }

                return [
                    'id' => $l->id,
                    'kode_tiket' => $l->kode_tiket,
                    'pelapor_nama' => $l->user?->name ?? 'PIC Ruangan',
                    'pelapor_role' => $isFromPengembalian
                        ? 'Inspeksi Pengembalian'
                        : ($l->user?->role?->label() ?? 'PIC Ruangan'),
                    'pelapor_ruangan' => $l->user?->unit_ruangan ?? ($l->user?->ruangan?->nama ?? $l->lokasi_ruang),
                    'sarpras_nama' => $l->nama_sarpras,
                    'lokasi_ruang' => $l->lokasi_ruang,
                    'tingkat_urgensi' => $l->tingkat_urgensi,
                    'deskripsi_kerusakan' => $l->deskripsi_kerusakan,
                    'foto_kerusakan' => $l->foto_kerusakan,
                    'status' => $l->status,
                    'staf_id' => $l->staf_id,
                    'staf_nama' => $l->staf?->name ?? $l->nama_teknisi,
                    'nama_teknisi' => $l->nama_teknisi,
                    'estimasi_biaya' => $dendaNominal,
                    'denda_kerusakan' => $dendaNominal,
                    'is_from_pengembalian' => $isFromPengembalian,
                    'biaya_aktual' => (float) $l->biaya_aktual,
                    'catatan_admin' => $l->catatan_admin,
                    'catatan_staf' => $l->catatan_staf,
                    'foto_perbaikan_selesai' => $l->foto_perbaikan_selesai,
                    'tanggal_lapor' => $l->created_at->format('d M Y H:i'),
                    'tanggal_mulai' => $l->tanggal_mulai_perbaikan?->format('d M Y'),
                    'tanggal_selesai' => $l->tanggal_selesai_perbaikan?->format('d M Y'),
                    'is_assigned_to_me' => $isStaf && (
                        $l->staf_id === $user->id ||
                        ($l->nama_teknisi && str_contains($l->nama_teknisi, $user->name)) ||
                        ($l->staf_id === null && in_array($l->status, ['disetujui', 'dalam_pengerjaan', 'selesai']))
                    ),
                ];
            });

        $sarprasKatalog = Sarpras::orderBy('nama')->get(['id', 'nama', 'lokasi']);

        $stafUsers = User::whereIn('role', [UserRole::Staf->value, UserRole::Admin->value])
            ->select('id', 'name', 'no_hp', 'role')
            ->orderBy('name')
            ->get()
            ->map(fn (User $u): array => [
                'id' => $u->id,
                'name' => $u->name,
                'no_hp' => $u->no_hp,
                'role_label' => $u->role === UserRole::Staf ? 'Staf Sarpras' : 'Admin Sarpras',
            ]);

        return Inertia::render('Admin/Maintenance/Index', [
            'laporanList' => $laporans,
            'sarprasKatalog' => $sarprasKatalog,
            'stafUsers' => $stafUsers,
            'currentUserId' => $user->id,
            'currentUserRole' => $user->role->value ?? (string) $user->role,
        ]);
    }

    /**
     * Admin & Staf Sarpras Menindaklanjuti & Mengubah Status Maintenance
     */
    public function updateStatus(Request $request, MaintenanceLaporan $maintenance): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'status' => ['required', 'in:menunggu_tinjauan,disetujui,dalam_pengerjaan,selesai,ditolak'],
            'staf_id' => ['nullable', 'exists:users,id'],
            'nama_teknisi' => ['nullable', 'string', 'max:255'],
            'estimasi_biaya' => ['nullable', 'numeric', 'min:0'],
            'biaya_aktual' => ['nullable', 'numeric', 'min:0'],
            'catatan_admin' => ['nullable', 'string', 'max:1000'],
            'catatan_staf' => ['nullable', 'string', 'max:1000'],
            'foto_perbaikan_selesai' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        // Otorisasi khusus untuk Staf Sarpras
        if ($user->role === UserRole::Staf) {
            if (! in_array($validated['status'], ['dalam_pengerjaan', 'selesai'], true)) {
                abort(403, 'Staf Sarpras hanya dapat mengubah status perbaikan menjadi Dalam Pengerjaan atau Selesai.');
            }

            if (in_array($maintenance->status, ['menunggu_tinjauan', 'ditolak'], true)) {
                abort(403, 'Tiket perbaikan harus divalidasi dan disetujui oleh Admin terlebih dahulu.');
            }

            if ($maintenance->staf_id !== null && $maintenance->staf_id !== $user->id) {
                abort(403, 'Tiket perbaikan ini ditugaskan kepada staf sarpras lain.');
            }
        } elseif ($user->role !== UserRole::Admin) {
            abort(403, 'Akses tidak diizinkan.');
        }

        $previousStatus = $maintenance->status;

        $updateData = [
            'status' => $validated['status'],
        ];

        // Jika user adalah admin
        if ($user->role === UserRole::Admin) {
            $updateData['admin_id'] = $user->id;
            if (array_key_exists('staf_id', $validated)) {
                $updateData['staf_id'] = $validated['staf_id'];
            }
            if (array_key_exists('nama_teknisi', $validated)) {
                $updateData['nama_teknisi'] = $validated['nama_teknisi'];
            }
            if (array_key_exists('estimasi_biaya', $validated)) {
                $updateData['estimasi_biaya'] = $validated['estimasi_biaya'] ?? 0;
            }
            if (array_key_exists('catatan_admin', $validated)) {
                $updateData['catatan_admin'] = $validated['catatan_admin'];
            }
        }

        // Jika user adalah staf pelaksana
        if ($user->role === UserRole::Staf) {
            if (! $maintenance->staf_id) {
                $updateData['staf_id'] = $user->id;
            }
            if (array_key_exists('catatan_staf', $validated)) {
                $updateData['catatan_staf'] = $validated['catatan_staf'];
            }
            if (array_key_exists('biaya_aktual', $validated)) {
                $updateData['biaya_aktual'] = $validated['biaya_aktual'];
            }
        }

        if ($request->hasFile('foto_perbaikan_selesai')) {
            $path = $request->file('foto_perbaikan_selesai')->store('maintenance_selesai', 'public');
            $updateData['foto_perbaikan_selesai'] = Storage::url($path);
        }

        if ($validated['status'] === 'dalam_pengerjaan' && ! $maintenance->tanggal_mulai_perbaikan) {
            $updateData['tanggal_mulai_perbaikan'] = now();
        }

        if ($validated['status'] === 'selesai') {
            $updateData['tanggal_selesai_perbaikan'] = now();
            // Jika terhubung ke katalog barang, update kondisi kembali normal & pulihkan stok jika sebelumnya rusak berat
            if ($maintenance->sarpras_id && $previousStatus !== 'selesai') {
                $sarpras = Sarpras::find($maintenance->sarpras_id);
                if ($sarpras) {
                    $wasRusakBerat = $sarpras->kondisi_umum === 'rusak_berat'
                        || str_contains((string) $maintenance->deskripsi_kerusakan, '(rusak_berat)');

                    if ($wasRusakBerat) {
                        $sarpras->increment('stok_total', 1);
                        $sarpras->increment('stok_tersedia', 1);
                    }

                    $sarpras->update(['kondisi_umum' => 'baik']);
                }
            }
        }

        $maintenance->update($updateData);

        // Notifikasi tertarget: Admin <-> Staf yang Ditugaskan <-> Kepala Bagian (Pelapor)
        $statusLabel = str_replace('_', ' ', strtoupper($validated['status']));
        if ($user->role === UserRole::Admin) {
            // 1. Beritahu Staf Pelaksana jika ditugaskan
            if ($validated['status'] === 'disetujui' && $maintenance->staf_id && $maintenance->staf_id !== $user->id) {
                $stafPelaksana = User::find($maintenance->staf_id);
                $stafPelaksana?->notify(new AktivitasBaruNotification(
                    title: "Tugas Perbaikan Baru ({$maintenance->kode_tiket})",
                    message: "Anda ditugaskan memperbaiki {$maintenance->nama_sarpras} di {$maintenance->lokasi_ruang}.",
                    actionUrl: '/admin/maintenance',
                    type: 'maintenance',
                    icon: 'wrench',
                ));
            }

            // 2. Beritahu Kepala Bagian / Pelapor
            if ($maintenance->user && $maintenance->user_id !== $user->id) {
                $maintenance->user->notify(new AktivitasBaruNotification(
                    title: "Status Perbaikan {$statusLabel} ({$maintenance->kode_tiket})",
                    message: "Laporan perbaikan {$maintenance->nama_sarpras} telah diperbarui menjadi {$statusLabel} oleh Admin.",
                    actionUrl: '/staf-ruangan/maintenance',
                    type: 'maintenance',
                    icon: $validated['status'] === 'ditolak' ? 'alert' : 'wrench',
                ));
            }
        } else {
            // Staf mengubah status (Dalam Pengerjaan / Selesai) -> Beritahu Admin dan Pelapor (Kepala Bagian)
            event(new AktivitasSistemEvent(
                actor: $user,
                jenisAktivitas: "Update Status Perbaikan ({$maintenance->kode_tiket})",
                message: "Status perbaikan {$maintenance->nama_sarpras} diubah menjadi: {$statusLabel} oleh {$user->name}",
                actionUrl: '/admin/maintenance',
                type: 'maintenance',
                icon: $validated['status'] === 'selesai' ? 'check' : 'wrench',
                targetRoles: [UserRole::Admin->value],
                targetUserIds: $maintenance->user_id,
            ));
        }

        return redirect()->back()->with('success', "Status laporan perbaikan fasilitas berhasil diperbarui.");
    }
}
