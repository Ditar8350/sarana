<?php

namespace App\Http\Controllers\Admin;

use App\Enums\KategoriSarpras;
use App\Http\Controllers\Controller;
use App\Models\PeminjamanItem;
use App\Models\Sarpras;
use App\Models\SarprasStockMutation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class StokSarprasController extends Controller
{
    /**
     * Tampilkan data stok sarana & prasarana yang disediakan
     */
    public function index(Request $request): Response
    {
        $sarpras = Sarpras::query()
            ->orderBy('nama')
            ->get()
            ->map(fn (Sarpras $item): array => [
                'id' => $item->id,
                'kode' => $item->kode,
                'nama' => $item->nama,
                'jenis' => $item->jenis,
                'kategori' => $item->kategori ?: KategoriSarpras::guessCategory($item->nama, $item->jenis),
                'lokasi' => $item->lokasi,
                'stok_total' => $item->stok_total,
                'stok_tersedia' => $item->stok_tersedia,
                'stok_dipinjam' => max(0, $item->stok_total - $item->stok_tersedia),
                'satuan' => $item->satuan,
                'kondisi_umum' => $item->kondisi_umum,
                'dapat_dipinjam' => $item->dapat_dipinjam,
                'deskripsi' => $item->deskripsi,
                'foto_url' => $item->foto_url,
            ]);

        return Inertia::render('Admin/StokSarpras/Index', [
            'sarpras' => $sarpras,
            'kategoriSarana' => KategoriSarpras::daftarSarana(),
            'kategoriPrasarana' => KategoriSarpras::daftarPrasarana(),
        ]);
    }

    /**
     * Tambah Sarana / Prasarana baru ke katalog stok
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'kode' => ['required', 'string', 'max:50', 'unique:sarpras,kode'],
            'nama' => ['required', 'string', 'max:255'],
            'jenis' => ['required', 'in:sarana,prasarana'],
            'kategori' => ['nullable', 'string', 'max:100'],
            'lokasi' => ['required', 'string', 'max:255'],
            'stok_total' => ['required', 'integer', 'min:1'],
            'satuan' => ['required', 'string', 'max:30'],
            'dapat_dipinjam' => ['required', 'boolean'],
            'deskripsi' => ['nullable', 'string', 'max:1000'],
            'foto' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $validated['kondisi_umum'] = 'baik';
        $validated['kategori'] = ! empty($validated['kategori'])
            ? trim($validated['kategori'])
            : KategoriSarpras::guessCategory($validated['nama'], $validated['jenis']);

        $fotoUrl = null;
        if ($request->hasFile('foto')) {
            $path = $request->file('foto')->store('uploads/sarpras', 'public');
            $fotoUrl = '/storage/'.$path;
        }

        $sarpras = Sarpras::create([
            ...$validated,
            'foto_url' => $fotoUrl,
            'stok_tersedia' => $validated['stok_total'],
        ]);

        // Catat mutasi awal
        SarprasStockMutation::create([
            'sarpras_id' => $sarpras->id,
            'tipe' => 'penyesuaian',
            'jumlah' => $sarpras->stok_total,
            'stok_sebelum' => 0,
            'stok_sesudah' => $sarpras->stok_total,
            'keterangan' => 'Pengadaan / input awal master data sarpras',
            'created_by' => auth()->id(),
        ]);

        return redirect()->back()->with('success', "Item {$sarpras->nama} berhasil ditambahkan ke stok.");
    }

    /**
     * Perbarui data sarana / prasarana
     */
    public function update(Request $request, Sarpras $sarpras): RedirectResponse
    {
        $validated = $request->validate([
            'kode' => ['required', 'string', 'max:50', 'unique:sarpras,kode,'.$sarpras->id],
            'nama' => ['required', 'string', 'max:255'],
            'jenis' => ['required', 'in:sarana,prasarana'],
            'kategori' => ['nullable', 'string', 'max:100'],
            'lokasi' => ['required', 'string', 'max:255'],
            'stok_total' => ['required', 'integer', 'min:1'],
            'satuan' => ['required', 'string', 'max:30'],
            'dapat_dipinjam' => ['required', 'boolean'],
            'deskripsi' => ['nullable', 'string', 'max:1000'],
            'foto' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $validated['kondisi_umum'] = 'baik';
        $validated['kategori'] = ! empty($validated['kategori'])
            ? trim($validated['kategori'])
            : ($sarpras->kategori ?: KategoriSarpras::guessCategory($validated['nama'], $validated['jenis']));

        $fotoUrl = $sarpras->foto_url;
        if ($request->hasFile('foto')) {
            $path = $request->file('foto')->store('uploads/sarpras', 'public');
            $fotoUrl = '/storage/'.$path;
        }

        $selisihStok = $validated['stok_total'] - $sarpras->stok_total;
        $stokTersediaBaru = max(0, $sarpras->stok_tersedia + $selisihStok);

        if ($selisihStok !== 0) {
            SarprasStockMutation::create([
                'sarpras_id' => $sarpras->id,
                'tipe' => 'penyesuaian',
                'jumlah' => abs($selisihStok),
                'stok_sebelum' => $sarpras->stok_tersedia,
                'stok_sesudah' => $stokTersediaBaru,
                'keterangan' => 'Penyesuaian stok total master barang',
                'created_by' => auth()->id(),
            ]);
        }

        $sarpras->update([
            ...$validated,
            'foto_url' => $fotoUrl,
            'stok_tersedia' => $stokTersediaBaru,
        ]);

        return redirect()->back()->with('success', "Data {$sarpras->nama} berhasil diperbarui.");
    }

    /**
     * Hapus item sarpras
     */
    public function destroy(Sarpras $sarpras): RedirectResponse
    {
        // Cek apakah sarpras masih terikat pada peminjaman yang sedang aktif/berjalan
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
            return redirect()->back()->with('error', "Sarpras '{$sarpras->nama}' tidak dapat dihapus karena masih ada transaksi peminjaman yang sedang berjalan atau belum dikembalikan.");
        }

        try {
            $nama = $sarpras->nama;

            DB::transaction(function () use ($sarpras, $nama) {
                // Pastikan snapshot nama_barang pada riwayat peminjaman lama tidak hilang
                PeminjamanItem::where('sarpras_id', $sarpras->id)
                    ->whereNull('nama_barang')
                    ->update(['nama_barang' => $nama]);

                // Hapus riwayat mutasi stok terkait jika ada
                $sarpras->mutations()->delete();

                // Hapus sarpras
                $sarpras->delete();
            });

            return redirect()->back()->with('success', "Sarpras '{$nama}' berhasil dihapus.");
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', 'Gagal menghapus sarpras: '.$e->getMessage());
        }
    }
}
