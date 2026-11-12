<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PengecekanRuangan;
use App\Notifications\AktivitasBaruNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PengecekanRuanganController extends Controller
{
    /**
     * Tampilkan seluruh hasil pengecekan ruangan dari staf unit (Redirect ke halaman terpadu Inventaris & Pengecekan)
     */
    public function index(Request $request): RedirectResponse
    {
        return redirect()->route('admin.inventaris.index', ['tab' => 'pengecekan']);
    }

    /**
     * Verifikasi & tindak lanjut laporan pengecekan oleh Admin / Kepala Biro
     */
    public function verifikasi(Request $request, PengecekanRuangan $pengecekan): RedirectResponse
    {
        if (! $request->user()->isAdmin()) {
            abort(403, 'Hanya Admin yang dapat memverifikasi laporan pengecekan ruangan.');
        }

        $validated = $request->validate([
            'status_tinjauan' => ['required', 'in:diverifikasi_admin,ditindaklanjuti'],
            'catatan_admin' => ['nullable', 'string', 'max:1000'],
        ]);

        $pengecekan->update([
            'status_tinjauan' => $validated['status_tinjauan'],
            'catatan_admin' => $validated['catatan_admin'] ?? null,
            'admin_id' => $request->user()->id,
            'ditinjau_pada' => now(),
        ]);

        if ($pengecekan->user && $pengecekan->user_id !== $request->user()->id) {
            $statusLabel = $validated['status_tinjauan'] === 'ditindaklanjuti' ? 'Ditindaklanjuti' : 'Diverifikasi Admin';
            $pengecekan->user->notify(new AktivitasBaruNotification(
                title: "Laporan Pengecekan {$statusLabel} ({$pengecekan->kode_pengecekan})",
                message: "Laporan pengecekan ruangan {$pengecekan->nama_ruangan} telah {$statusLabel} oleh Admin.",
                actionUrl: '/admin/inventaris?tab=pengecekan',
                type: 'pengecekan',
                icon: 'check',
            ));
        }

        return redirect()->back()->with('success', "Laporan pengecekan {$pengecekan->kode_pengecekan} berhasil diverifikasi.");
    }
}
