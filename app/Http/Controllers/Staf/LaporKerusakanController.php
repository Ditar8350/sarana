<?php

namespace App\Http\Controllers\Staf;

use App\Enums\UserRole;
use App\Events\AktivitasSistemEvent;
use App\Http\Controllers\Controller;
use App\Models\MaintenanceLaporan;
use App\Models\Sarpras;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class LaporKerusakanController extends Controller
{
    /**
     * Halaman pelaporan kerusakan untuk Staf & Kepala Bagian Kelas
     */
    public function index(Request $request): Response|RedirectResponse
    {
        if ($request->user()->role === UserRole::Staf) {
            return redirect()->route('staf.pengadaan.index');
        }

        $riwayatSaya = MaintenanceLaporan::where('user_id', auth()->id())
            ->latest()
            ->get()
            ->map(fn (MaintenanceLaporan $l): array => [
                'id' => $l->id,
                'kode_tiket' => $l->kode_tiket,
                'sarpras_nama' => $l->nama_sarpras,
                'lokasi_ruang' => $l->lokasi_ruang,
                'tingkat_urgensi' => $l->tingkat_urgensi,
                'deskripsi_kerusakan' => $l->deskripsi_kerusakan,
                'foto_kerusakan' => $l->foto_kerusakan,
                'status' => $l->status,
                'nama_teknisi' => $l->nama_teknisi,
                'catatan_admin' => $l->catatan_admin,
                'tanggal_lapor' => $l->created_at->format('d M Y H:i'),
            ]);

        $sarprasKatalog = Sarpras::orderBy('nama')->get(['id', 'nama', 'lokasi']);

        return Inertia::render('Staf/LaporKerusakan/Index', [
            'riwayatSaya' => $riwayatSaya,
            'sarprasKatalog' => $sarprasKatalog,
        ]);
    }

    /**
     * Staf / Kepala Bagian Kelas Mengirim Laporan Kerusakan
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'sarpras_id' => ['nullable', 'exists:sarpras,id'],
            'nama_sarpras' => ['required', 'string', 'max:255'],
            'lokasi_ruang' => ['required', 'string', 'max:255'],
            'tingkat_urgensi' => ['required', 'in:rendah,sedang,tinggi,darurat'],
            'deskripsi_kerusakan' => ['required', 'string', 'max:2000'],
            'foto_kerusakan' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $fotoPath = null;
        if ($request->hasFile('foto_kerusakan')) {
            $path = $request->file('foto_kerusakan')->store('uploads/maintenance', 'public');
            $fotoPath = '/storage/'.$path;
        }

        $kode = '#MNT-'.date('Y').'-'.strtoupper(Str::random(5));

        $laporan = MaintenanceLaporan::create([
            'kode_tiket' => $kode,
            'user_id' => auth()->id(),
            'sarpras_id' => $validated['sarpras_id'] ?? null,
            'nama_sarpras' => $validated['nama_sarpras'],
            'lokasi_ruang' => $validated['lokasi_ruang'],
            'tingkat_urgensi' => $validated['tingkat_urgensi'],
            'deskripsi_kerusakan' => $validated['deskripsi_kerusakan'],
            'foto_kerusakan' => $fotoPath,
            'status' => 'menunggu_tinjauan',
        ]);

        // Jika terhubung ke katalog sarpras, tandai kondisinya sebagai rusak ringan
        if (! empty($validated['sarpras_id'])) {
            Sarpras::where('id', $validated['sarpras_id'])->update(['kondisi_umum' => 'rusak_ringan']);
        }

        event(new AktivitasSistemEvent(
            actor: $request->user(),
            jenisAktivitas: "Laporan Kerusakan ({$validated['nama_sarpras']})",
            message: "Laporan {$laporan->kode_tiket} di {$validated['lokasi_ruang']} (Urgensi: {$validated['tingkat_urgensi']}): {$validated['deskripsi_kerusakan']}",
            actionUrl: '/admin/maintenance',
            type: 'maintenance',
            icon: 'alert',
        ));

        return redirect()->back()->with('success', "Laporan kerusakan {$laporan->kode_tiket} berhasil diajukan ke Biro Sarpras!");
    }
}
