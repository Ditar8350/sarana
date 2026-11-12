<?php

namespace App\Http\Controllers\Mahasiswa;

use App\Events\AktivitasSistemEvent;
use App\Http\Controllers\Controller;
use App\Models\News;
use App\Models\Peminjaman;
use App\Models\PeminjamanItem;
use App\Models\PeminjamanLog;
use App\Models\Pengembalian;
use App\Models\Sarpras;
use App\Models\SarprasStockMutation;
use App\Models\User;
use App\Notifications\AktivitasBaruNotification;
use App\Services\PeminjamanService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PeminjamanMahasiswaController extends Controller
{
    /**
     * Cek kelayakan mahasiswa/user untuk meminjam sarpras.
     * Tidak boleh meminjam jika:
     * 1. Masih memiliki sarpras yang belum dikembalikan (status: disetujui, siap_diambil, sedang_dipinjam, menunggu_kembali)
     * 2. Masih memiliki tanggungan denda yang belum lunas (biaya_denda > 0 dan status_pembayaran_denda != 'lunas')
     *
     * @return array{eligible: bool, alasan: string, pesan: string, kode?: string, nominal?: float}|null
     */
    public static function checkPeminjamEligibility(?User $user): ?array
    {
        if (! $user) {
            return null;
        }

        // 1. Cek peminjaman aktif yang belum dikembalikan
        $peminjamanAktif = Peminjaman::where('user_id', $user->id)
            ->whereIn('status', ['disetujui', 'siap_diambil', 'sedang_dipinjam', 'menunggu_kembali'])
            ->latest('id')
            ->first();

        if ($peminjamanAktif) {
            $statusLabel = match ($peminjamanAktif->status) {
                'disetujui', 'siap_diambil' => 'sudah disetujui / siap diambil di loket',
                'menunggu_kembali' => 'sedang dalam proses verifikasi pengembalian',
                default => 'sedang aktif dipinjam dan belum dikembalikan',
            };

            return [
                'eligible' => false,
                'alasan' => 'belum_mengembalikan',
                'pesan' => "Anda belum dapat mengajukan peminjaman baru karena masih memiliki peminjaman ({$peminjamanAktif->kode_transaksi}) yang {$statusLabel}. Harap selesaikan pengembalian fasilitas tersebut terlebih dahulu.",
                'kode' => $peminjamanAktif->kode_transaksi,
            ];
        }

        // 2. Cek tanggungan denda yang belum lunas
        $dendaTertunggak = Pengembalian::where('user_id', $user->id)
            ->where('biaya_denda', '>', 0)
            ->where(function ($q) {
                $q->whereNull('status_pembayaran_denda')
                    ->orWhere('status_pembayaran_denda', '!=', 'lunas');
            })
            ->latest('id')
            ->first();

        if ($dendaTertunggak) {
            $nominalRp = 'Rp '.number_format((float) $dendaTertunggak->biaya_denda, 0, ',', '.');
            $statusDenda = match ($dendaTertunggak->status_pembayaran_denda) {
                'menunggu_verifikasi_admin' => 'sedang menunggu verifikasi pembayaran oleh admin',
                default => 'belum dibayar / belum lunas',
            };

            return [
                'eligible' => false,
                'alasan' => 'tanggungan_denda',
                'pesan' => "Anda belum dapat mengajukan peminjaman baru karena memiliki tanggungan denda sebesar {$nominalRp} pada pengembalian ({$dendaTertunggak->kode_pengembalian}) yang {$statusDenda}. Harap lunasi denda terlebih dahulu di menu Pengembalian.",
                'kode' => $dendaTertunggak->kode_pengembalian,
                'nominal' => (float) $dendaTertunggak->biaya_denda,
            ];
        }

        return null;
    }

    /**
     * Tampilkan katalog sarana & prasarana untuk dipilih mahasiswa
     */
    public function katalog(Request $request): Response
    {
        $sarpras = Sarpras::query()
            ->orderBy('jenis')
            ->orderBy('nama')
            ->get([
                'id',
                'kode',
                'nama',
                'jenis',
                'kategori',
                'lokasi',
                'stok_total',
                'stok_tersedia',
                'satuan',
                'kondisi_umum',
                'dapat_dipinjam',
                'deskripsi',
                'foto_url',
            ]);

        return Inertia::render('Mahasiswa/Sarpras/Index', [
            'sarpras' => $sarpras,
            'statusKelayakan' => self::checkPeminjamEligibility($request->user()),
        ]);
    }

    /**
     * Tampilkan halaman Informasi & Berita untuk Mahasiswa dan Masyarakat Umum di dalam Dashboard Layout
     */
    public function berita(): Response
    {
        $berita = News::where('status', 'Aktif')
            ->latest('date')
            ->latest('id')
            ->get()
            ->map(fn (News $item): array => [
                'id' => $item->id,
                'title' => $item->title,
                'slug' => $item->slug,
                'excerpt' => Str::limit(strip_tags($item->description ?? ''), 150),
                'image' => $item->image ?: '/images/Hero.png',
                'date' => Carbon::parse($item->date)->translatedFormat('d M Y'),
                'author' => $item->author ?: 'Humas Biro Sarpras',
            ]);

        return Inertia::render('Mahasiswa/Berita/Index', [
            'berita' => $berita,
        ]);
    }

    /**
     * Tampilkan riwayat & status peminjaman mahasiswa (Layanan Peminjaman)
     */
    public function index(Request $request): Response|RedirectResponse
    {
        $riwayatPeminjaman = Peminjaman::where('user_id', auth()->id())
            ->with(['items.sarpras', 'pengembalian', 'validator'])
            ->latest()
            ->get()
            ->map(fn (Peminjaman $p): array => [
                'id' => $p->id,
                'kode' => $p->kode_transaksi,
                'nama_peminjam' => $p->nama_peminjam,
                'nim_nip' => $p->nim_nip,
                'instansi_prodi' => $p->instansi_prodi,
                'no_whatsapp' => $p->no_whatsapp,
                'file_ktm' => $p->file_ktm,
                'keperluan' => $p->keperluan,
                'tanggal_mulai' => $p->tanggal_mulai->format('d M Y'),
                'tanggal_kembali_rencana' => $p->tanggal_kembali_rencana->format('d M Y'),
                'tanggal_kembali_aktual' => $p->tanggal_kembali_aktual?->format('d M Y'),
                'status' => $p->status,
                'catatan_admin' => $p->catatan_admin,
                'petugas_pengambilan' => $p->petugas_pengambilan,
                'no_hp_pendamping' => $p->no_hp_pendamping ?: ($p->pendampingStaf?->no_hp ?? null),
                'lokasi_pengambilan' => $p->lokasi_pengambilan,
                'foto_bukti_terima' => $p->foto_bukti_terima,
                'tanggal_terima' => $p->tanggal_terima?->format('d M Y H:i'),
                'validator_nama' => $p->validator?->name,
                'has_pengembalian' => (bool) $p->pengembalian,
                'pengembalian' => $p->pengembalian ? [
                    'id' => $p->pengembalian->id,
                    'kode_pengembalian' => $p->pengembalian->kode_pengembalian,
                    'status_verifikasi' => $p->pengembalian->status_verifikasi,
                    'biaya_denda' => (float) $p->pengembalian->biaya_denda,
                    'nomor_rekening' => $p->pengembalian->nomor_rekening,
                    'status_pembayaran_denda' => $p->pengembalian->status_pembayaran_denda,
                    'bukti_bayar_denda' => $p->pengembalian->bukti_bayar_denda,
                    'catatan_bayar_denda' => $p->pengembalian->catatan_bayar_denda,
                    'diverifikasi_denda_pada' => $p->pengembalian->diverifikasi_denda_pada?->format('d M Y H:i'),
                    'foto_bukti' => $p->pengembalian->foto_bukti_kembali,
                    'catatan_inspeksi' => $p->pengembalian->catatan_inspeksi_admin,
                ] : null,
                'items' => $p->items->unique('sarpras_id')->values()->map(fn ($it) => [
                    'id' => $it->id,
                    'sarpras_id' => $it->sarpras_id,
                    'nama_barang' => $it->sarpras?->nama ?? 'Barang',
                    'jenis' => $it->sarpras?->jenis ?? 'sarana',
                    'lokasi' => $it->sarpras?->lokasi ?? '-',
                    'foto_url' => $it->sarpras?->foto_url,
                    'qty' => $it->qty,
                    'satuan' => $it->sarpras?->satuan ?? 'Unit',
                ]),
            ]);

        return Inertia::render('Mahasiswa/Peminjaman/Index', [
            'riwayat' => $riwayatPeminjaman,
            'statusKelayakan' => self::checkPeminjamEligibility(auth()->user()),
        ]);
    }

    /**
     * Halaman Khusus Formulir Pengajuan Peminjaman Sarpras
     */
    public function create(Request $request): Response|RedirectResponse
    {
        $user = $request->user();
        $userRole = is_object($user?->role) ? ($user->role->value ?? '') : (string) ($user?->role ?? '');

        if (in_array($userRole, ['admin', 'staf'], true)) {
            $redirectRoute = $userRole === 'admin' ? 'admin.peminjaman.index' : 'layanan.sarpras.index';

            return redirect()->route($redirectRoute)->with('error', 'Role Admin & Staf Sarpras bertugas mengelola sirkulasi dan serah terima fasilitas, tidak dapat mengajukan peminjaman.');
        }

        $kelayakan = self::checkPeminjamEligibility($user);
        if ($kelayakan && ! $kelayakan['eligible']) {
            return redirect()->route('layanan.peminjaman.index')->with('error', $kelayakan['pesan']);
        }

        $sarprasId = $request->query('sarpras_id') ?? $request->query('pilih');

        $sarprasPilihan = null;
        if ($sarprasId) {
            $sarprasPilihan = Sarpras::find($sarprasId);
        }

        $sarprasTersedia = Sarpras::siapDipinjam()
            ->orderBy('nama')
            ->get([
                'id',
                'kode',
                'nama',
                'jenis',
                'kategori',
                'lokasi',
                'stok_tersedia',
                'satuan',
                'foto_url',
                'kondisi_umum',
                'deskripsi',
            ]);

        return Inertia::render('Mahasiswa/Peminjaman/Create', [
            'sarprasPilihan' => $sarprasPilihan,
            'sarprasTersedia' => $sarprasTersedia,
            'initialSarprasId' => $sarprasPilihan?->id ?? ($sarprasTersedia[0]->id ?? null),
        ]);
    }

    /**
     * Mahasiswa Mengajukan Peminjaman Sarpras Baru
     */
    public function store(Request $request, PeminjamanService $service): RedirectResponse
    {
        $user = $request->user();
        $userRole = is_object($user?->role) ? ($user->role->value ?? '') : (string) ($user?->role ?? '');

        if (in_array($userRole, ['admin', 'staf'], true)) {
            abort(403, 'Role Admin & Staf Sarpras bertugas mengelola sirkulasi dan serah terima fasilitas, tidak dapat mengajukan peminjaman.');
        }

        $kelayakan = self::checkPeminjamEligibility($user);
        if ($kelayakan && ! $kelayakan['eligible']) {
            return redirect()->back()
                ->with('error', $kelayakan['pesan'])
                ->withErrors(['items' => $kelayakan['pesan']]);
        }

        $isUmum = empty($user->nomor_induk) || $userRole === 'umum';

        $rules = [
            'nama_peminjam' => ['required', 'string', 'max:255'],
            'instansi_prodi' => ['required', 'string', 'max:255'],
            'no_whatsapp' => ['required', 'string', 'max:30'],
            'keperluan' => ['required', 'string', 'max:1000'],
            'tanggal_mulai' => ['required', 'date'],
            'tanggal_kembali_rencana' => ['required', 'date', 'after_or_equal:tanggal_mulai'],
            'file_ktm' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
            'file_surat' => ['nullable', 'file', 'mimes:pdf', 'max:5120'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.sarpras_id' => ['required', 'exists:sarpras,id'],
            'items.*.qty' => ['required', 'integer', 'min:1'],
        ];

        if (! $isUmum) {
            $rules['nim_nip'] = ['required', 'string', 'max:50'];
        } else {
            $rules['nim_nip'] = ['nullable', 'string', 'max:50'];
        }

        $messages = [
            'nama_peminjam.required' => 'Nama lengkap peminjam wajib diisi.',
            'instansi_prodi.required' => $isUmum ? 'Instansi / Asal peminjam wajib diisi.' : 'Fakultas dan Program Studi wajib dipilih.',
            'no_whatsapp.required' => 'Nomor WhatsApp aktif wajib diisi.',
            'keperluan.required' => 'Keperluan / alasan peminjaman wajib diisi.',
            'tanggal_mulai.required' => 'Tanggal mulai peminjaman wajib diisi.',
            'tanggal_kembali_rencana.required' => 'Tanggal selesai peminjaman wajib diisi.',
            'tanggal_kembali_rencana.after_or_equal' => 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.',
            'file_ktm.required' => $isUmum ? 'Foto / berkas identitas (KTP) wajib diunggah.' : 'Foto / berkas Kartu Tanda Mahasiswa (KTM) wajib diunggah.',
            'file_ktm.mimes' => 'Format berkas identitas harus berupa JPG, PNG, WEBP, atau PDF.',
            'file_ktm.max' => 'Ukuran berkas identitas maksimal 5MB.',
            'nim_nip.required' => 'NIM wajib diisi.',
            'items.required' => 'Pilih minimal 1 fasilitas yang ingin dipinjam.',
        ];

        $validated = $request->validate($rules, $messages);

        // Cek bentrok jadwal & kapasitas stok untuk semua item
        foreach ($validated['items'] as $item) {
            $tersedia = $service->checkKetersediaan(
                (int) $item['sarpras_id'],
                (int) $item['qty'],
                $validated['tanggal_mulai'],
                $validated['tanggal_kembali_rencana']
            );

            if (! $tersedia) {
                $namaBarang = Sarpras::find($item['sarpras_id'])?->nama ?? 'Barang pilihan';

                return redirect()->back()->withErrors([
                    'items' => "Stok fasilitas \"{$namaBarang}\" tidak mencukupi untuk jumlah yang diminta.",
                ]);
            }
        }

        $ktmPath = $request->hasFile('file_ktm')
            ? $request->file('file_ktm')->store('uploads/ktm', 'public')
            : null;
        $suratPath = $request->hasFile('file_surat')
            ? $request->file('file_surat')->store('uploads/surat', 'public')
            : null;

        $peminjaman = null;

        DB::transaction(function () use ($validated, $ktmPath, $suratPath, $user, &$peminjaman) {
            $kode = '#PJ-'.date('Y').'-'.strtoupper(Str::random(5));

            $peminjaman = Peminjaman::create([
                'kode_transaksi' => $kode,
                'user_id' => auth()->id(),
                'nama_peminjam' => $validated['nama_peminjam'],
                'nim_nip' => ! empty($validated['nim_nip']) ? $validated['nim_nip'] : ($user->nomor_induk ?: '-'),
                'instansi_prodi' => Str::limit($validated['instansi_prodi'], 100, ''),
                'no_whatsapp' => $validated['no_whatsapp'],
                'file_ktm' => $ktmPath ? '/storage/'.$ktmPath : '',
                'file_surat_pengantar' => $suratPath ? '/storage/'.$suratPath : null,
                'keperluan' => $validated['keperluan'],
                'tanggal_mulai' => Carbon::parse($validated['tanggal_mulai'])->startOfDay(),
                'tanggal_kembali_rencana' => Carbon::parse($validated['tanggal_kembali_rencana'])->endOfDay(),
                'status' => 'menunggu_validasi',
            ]);

            // Sinkronisasikan biodata mahasiswa (NIM, No HP, Fakultas & Prodi) ke profil akun jika belum terisi atau diperbarui
            if ($user->isMahasiswa()) {
                $profileUpdated = false;
                if (! empty($validated['nim_nip']) && $user->nomor_induk !== $validated['nim_nip']) {
                    $user->nomor_induk = $validated['nim_nip'];
                    $profileUpdated = true;
                }
                if (! empty($validated['no_whatsapp']) && $validated['no_whatsapp'] !== '08' && $user->no_hp !== $validated['no_whatsapp']) {
                    $user->no_hp = $validated['no_whatsapp'];
                    $profileUpdated = true;
                }
                if (! empty($validated['instansi_prodi']) && str_contains($validated['instansi_prodi'], ' - ') && $user->unit_ruangan !== $validated['instansi_prodi']) {
                    $user->unit_ruangan = $validated['instansi_prodi'];
                    $profileUpdated = true;
                }
                if ($profileUpdated) {
                    $user->save();
                }
            }

            foreach ($validated['items'] as $item) {
                $sarpras = Sarpras::where('id', $item['sarpras_id'])->lockForUpdate()->firstOrFail();

                if ($sarpras->stok_tersedia < $item['qty']) {
                    throw new \Exception("Stok fasilitas \"{$sarpras->nama}\" saat ini tidak mencukupi (Tersedia: {$sarpras->stok_tersedia}, Diminta: {$item['qty']}).");
                }

                $stokSebelum = $sarpras->stok_tersedia;
                $sarpras->decrement('stok_tersedia', $item['qty']);
                $stokSesudah = $sarpras->fresh()->stok_tersedia;

                PeminjamanItem::create([
                    'peminjaman_id' => $peminjaman->id,
                    'sarpras_id' => $item['sarpras_id'],
                    'qty' => $item['qty'],
                ]);

                SarprasStockMutation::create([
                    'sarpras_id' => $sarpras->id,
                    'peminjaman_id' => $peminjaman->id,
                    'tipe' => 'keluar',
                    'jumlah' => $item['qty'],
                    'stok_sebelum' => $stokSebelum,
                    'stok_sesudah' => $stokSesudah,
                    'keterangan' => "Peminjaman diajukan oleh {$validated['nama_peminjam']} ({$peminjaman->kode_transaksi})",
                    'created_by' => auth()->id(),
                ]);
            }

            PeminjamanLog::create([
                'peminjaman_id' => $peminjaman->id,
                'actor_id' => auth()->id(),
                'status_sebelum' => 'draft',
                'status_sesudah' => 'menunggu_validasi',
                'keterangan' => 'Pengajuan peminjaman dikirim oleh peminjam.',
            ]);
        });

        if ($peminjaman) {
            $firstItem = $peminjaman->items()->with('sarpras')->first();
            $itemTitle = $firstItem?->sarpras?->nama ?? 'Sarana & Prasarana';
            $extraCount = $peminjaman->items()->count() - 1;
            if ($extraCount > 0) {
                $itemTitle .= " (+{$extraCount} item lainnya)";
            }

            event(new AktivitasSistemEvent(
                actor: $user,
                jenisAktivitas: "Mengajukan Peminjaman {$itemTitle}",
                message: "Pengajuan {$peminjaman->kode_transaksi} ({$peminjaman->instansi_prodi}) untuk keperluan: {$peminjaman->keperluan}",
                actionUrl: '/admin/peminjaman',
                type: 'peminjaman',
                icon: 'document',
            ));
        }

        return redirect()->route('layanan.sarpras.index')->with('success', 'Pengajuan peminjaman berhasil dikirim! Silakan pantau status persetujuan di menu Layanan Peminjaman.');
    }

    /**
     * Step 4: Mahasiswa / Umum Mengunggah Bukti Barang yang Diterima (Setelah Validasi Step 3) -> Baru Dinyatakan Sukses
     */
    public function terimaBarang(Request $request, Peminjaman $peminjaman): RedirectResponse
    {
        if ($peminjaman->user_id !== auth()->id()) {
            abort(403);
        }

        if (! in_array($peminjaman->status, ['siap_diambil', 'disetujui', 'sedang_dipinjam'])) {
            return redirect()->back()->with('error', 'Bukti penerimaan barang hanya dapat diunggah setelah pembagian staf yang bertugas (Step 3) tervalidasi.');
        }

        $request->validate([
            'foto_bukti_terima' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
        ], [
            'foto_bukti_terima.required' => 'Foto bukti barang yang diterima wajib diunggah agar peminjaman dinyatakan Sukses.',
            'foto_bukti_terima.max' => 'Ukuran foto maksimal 5MB.',
        ]);

        $fotoPath = $request->file('foto_bukti_terima')->store('uploads/terima_barang', 'public');

        DB::transaction(function () use ($peminjaman, $fotoPath) {
            $peminjaman = Peminjaman::where('id', $peminjaman->id)->lockForUpdate()->firstOrFail();

            $sudahMutasi = SarprasStockMutation::where('peminjaman_id', $peminjaman->id)
                ->where('tipe', 'keluar')
                ->exists();

            if (! $sudahMutasi) {
                foreach ($peminjaman->items as $item) {
                    $sarpras = Sarpras::where('id', $item->sarpras_id)->lockForUpdate()->first();
                    if ($sarpras && $sarpras->stok_tersedia >= $item->qty) {
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
                            'keterangan' => "Barang diterima oleh peminjam ({$peminjaman->kode_transaksi})",
                            'created_by' => auth()->id(),
                        ]);
                    }
                }
            }

            $statusSebelum = $peminjaman->status;
            $peminjaman->update([
                'status' => 'sedang_dipinjam',
                'foto_bukti_terima' => '/storage/'.$fotoPath,
                'tanggal_terima' => now(),
            ]);

            PeminjamanLog::create([
                'peminjaman_id' => $peminjaman->id,
                'actor_id' => auth()->id(),
                'status_sebelum' => $statusSebelum,
                'status_sesudah' => 'sedang_dipinjam',
                'keterangan' => 'Peminjam mengunggah bukti barang yang diterima. Peminjaman dinyatakan Sukses (Step 4).',
            ]);
        });

        event(new AktivitasSistemEvent(
            actor: $request->user(),
            jenisAktivitas: "Mengunggah Bukti Barang Diterima ({$peminjaman->kode_transaksi})",
            message: "Peminjam telah menerima barang dari staf bertugas ({$peminjaman->petugas_pengambilan}) dan mengunggah bukti foto. Status Peminjaman: Sukses.",
            actionUrl: '/admin/peminjaman',
            type: 'peminjaman',
            icon: 'document',
        ));

        if ($peminjaman->pendampingStaf) {
            $peminjaman->pendampingStaf->notify(new AktivitasBaruNotification(
                title: "Barang Diterima Peminjam ({$peminjaman->kode_transaksi})",
                message: "Peminjam {$peminjaman->nama_peminjam} telah mengunggah bukti foto penerimaan sarpras. Status transaksi kini Aktif Dipinjam.",
                actionUrl: '/admin/peminjaman',
                type: 'peminjaman',
                icon: 'check',
            ));
        }

        return redirect()->back()->with('success', 'Bukti barang yang diterima berhasil diunggah! Peminjaman Anda kini dinyatakan Sukses (Step 4).');
    }

    /**
     * Mahasiswa Mengajukan Pengembalian & Mengunggah Bukti
     */
    public function submitPengembalian(Request $request, Peminjaman $peminjaman): RedirectResponse
    {
        if ($peminjaman->user_id !== auth()->id()) {
            abort(403);
        }

        $request->validate([
            'foto_bukti' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'catatan' => ['nullable', 'string', 'max:500'],
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
                'keterangan' => 'Peminjam mengajukan pengembalian dengan bukti foto.',
            ]);
        });

        event(new AktivitasSistemEvent(
            actor: $request->user(),
            jenisAktivitas: "Konfirmasi Pengembalian Barang ({$peminjaman->kode_transaksi})",
            message: "Pengembalian {$kode} ({$peminjaman->kode_transaksi}) menunggu inspeksi fisik oleh staf di meja loket.",
            actionUrl: '/admin/pengembalian',
            type: 'pengembalian',
            icon: 'alert',
        ));

        if ($peminjaman->pendampingStaf) {
            $peminjaman->pendampingStaf->notify(new AktivitasBaruNotification(
                title: "Pengembalian Masuk ({$peminjaman->kode_transaksi})",
                message: "Peminjam {$peminjaman->nama_peminjam} telah mengunggah bukti pengembalian. Silakan lakukan cek kondisi fisik barang di loket.",
                actionUrl: '/admin/pengembalian',
                type: 'pengembalian',
                icon: 'check',
            ));
        }

        return redirect()->back()->with('success', 'Bukti pengembalian berhasil diunggah! Silakan serahkan fisik fasilitas ke loket Sarpras untuk inspeksi kondisi oleh Staf.');
    }

    /**
     * Halaman Edit Formulir & Fasilitas Pengajuan Peminjaman Sebelum di-Approval Admin
     */
    public function edit(Request $request, Peminjaman $peminjaman): Response|RedirectResponse
    {
        if ($peminjaman->user_id !== auth()->id()) {
            abort(403, 'Anda tidak memiliki akses untuk mengedit pengajuan ini.');
        }

        if (! in_array($peminjaman->status, ['menunggu_validasi', 'ditunda'], true)) {
            return redirect()->route('layanan.peminjaman.index')
                ->with('error', 'Pengajuan ini sudah diproses atau disetujui oleh Admin sehingga tidak dapat diedit kembali.');
        }

        $peminjaman->load(['items.sarpras']);

        // Ambil sarpras yang siap dipinjam atau yang sedang dipinjam oleh transaksi ini
        $sarprasTersedia = Sarpras::siapDipinjam()
            ->orWhereIn('id', $peminjaman->items->pluck('sarpras_id'))
            ->orderBy('nama')
            ->get([
                'id',
                'kode',
                'nama',
                'jenis',
                'kategori',
                'lokasi',
                'stok_tersedia',
                'satuan',
                'foto_url',
                'kondisi_umum',
                'deskripsi',
            ]);

        // Tambahkan kembali alokasi qty yang sedang dipegang oleh peminjaman ini ke stok_tersedia tampilan
        $existingItemQty = $peminjaman->items->pluck('qty', 'sarpras_id');
        $sarprasTersedia->transform(function ($item) use ($existingItemQty) {
            if (isset($existingItemQty[$item->id])) {
                $item->stok_tersedia += (int) $existingItemQty[$item->id];
            }

            return $item;
        });

        return Inertia::render('Mahasiswa/Peminjaman/Edit', [
            'peminjaman' => $peminjaman,
            'sarprasTersedia' => $sarprasTersedia,
        ]);
    }

    /**
     * Simpan Perubahan Pengajuan Peminjaman & Fasilitas Sebelum Approval
     */
    public function update(Request $request, Peminjaman $peminjaman): RedirectResponse
    {
        if ($peminjaman->user_id !== auth()->id()) {
            abort(403, 'Anda tidak berhak mengubah pengajuan ini.');
        }

        if (! in_array($peminjaman->status, ['menunggu_validasi', 'ditunda'], true)) {
            return redirect()->route('layanan.peminjaman.index')
                ->with('error', 'Pengajuan peminjaman tidak dapat diubah karena status telah diproses Admin.');
        }

        $user = $request->user();
        $userRole = is_object($user?->role) ? ($user->role->value ?? '') : (string) ($user?->role ?? '');
        $isUmum = empty($user->nomor_induk) || $userRole === 'umum';

        $rules = [
            'nama_peminjam' => ['required', 'string', 'max:255'],
            'instansi_prodi' => ['required', 'string', 'max:255'],
            'no_whatsapp' => ['required', 'string', 'max:30'],
            'keperluan' => ['required', 'string', 'max:1000'],
            'tanggal_mulai' => ['required', 'date'],
            'tanggal_kembali_rencana' => ['required', 'date', 'after_or_equal:tanggal_mulai'],
            'file_ktm' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
            'file_surat' => ['nullable', 'file', 'mimes:pdf', 'max:5120'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.sarpras_id' => ['required', 'exists:sarpras,id'],
            'items.*.qty' => ['required', 'integer', 'min:1'],
        ];

        if (! $isUmum) {
            $rules['nim_nip'] = ['required', 'string', 'max:50'];
        } else {
            $rules['nim_nip'] = ['nullable', 'string', 'max:50'];
        }

        $messages = [
            'nama_peminjam.required' => 'Nama lengkap peminjam wajib diisi.',
            'instansi_prodi.required' => $isUmum ? 'Instansi / Asal peminjam wajib diisi.' : 'Fakultas dan Program Studi wajib dipilih.',
            'no_whatsapp.required' => 'Nomor WhatsApp aktif wajib diisi.',
            'keperluan.required' => 'Keperluan / alasan peminjaman wajib diisi.',
            'tanggal_mulai.required' => 'Tanggal mulai peminjaman wajib diisi.',
            'tanggal_kembali_rencana.required' => 'Tanggal selesai peminjaman wajib diisi.',
            'tanggal_kembali_rencana.after_or_equal' => 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.',
            'file_ktm.mimes' => 'Format berkas identitas harus berupa JPG, PNG, WEBP, atau PDF.',
            'file_ktm.max' => 'Ukuran berkas identitas maksimal 5MB.',
            'nim_nip.required' => 'NIM wajib diisi.',
            'items.required' => 'Pilih minimal 1 fasilitas yang ingin dipinjam.',
        ];

        $validated = $request->validate($rules, $messages);

        try {
            DB::transaction(function () use ($peminjaman, $validated, $request) {
                // 1. Kembalikan stok lama sementara
                foreach ($peminjaman->items as $oldItem) {
                    $sarpras = Sarpras::where('id', $oldItem->sarpras_id)->lockForUpdate()->first();
                    if ($sarpras) {
                        $sarpras->increment('stok_tersedia', $oldItem->qty);
                    }
                }
                SarprasStockMutation::where('peminjaman_id', $peminjaman->id)->where('tipe', 'keluar')->delete();

                // 2. Cek ketersediaan dan potong stok baru
                foreach ($validated['items'] as $newItem) {
                    $sarpras = Sarpras::where('id', $newItem['sarpras_id'])->lockForUpdate()->firstOrFail();
                    if ($sarpras->stok_tersedia < $newItem['qty']) {
                        throw new \Exception("Stok fasilitas \"{$sarpras->nama}\" tidak mencukupi (Tersedia: {$sarpras->stok_tersedia}, Diminta: {$newItem['qty']}).");
                    }

                    $stokSebelum = $sarpras->stok_tersedia;
                    $sarpras->decrement('stok_tersedia', $newItem['qty']);
                    $stokSesudah = $sarpras->fresh()->stok_tersedia;

                    SarprasStockMutation::create([
                        'sarpras_id' => $sarpras->id,
                        'peminjaman_id' => $peminjaman->id,
                        'tipe' => 'keluar',
                        'jumlah' => $newItem['qty'],
                        'stok_sebelum' => $stokSebelum,
                        'stok_sesudah' => $stokSesudah,
                        'keterangan' => "Pembaruan fasilitas peminjaman ({$peminjaman->kode_transaksi}) oleh peminjam",
                        'created_by' => auth()->id(),
                    ]);
                }

                // 3. Upload berkas baru jika dilampirkan
                $ktmPath = $peminjaman->file_ktm;
                if ($request->hasFile('file_ktm')) {
                    $stored = $request->file('file_ktm')->store('uploads/ktm', 'public');
                    $ktmPath = '/storage/'.$stored;
                }

                $suratPath = $peminjaman->file_surat_pengantar;
                if ($request->hasFile('file_surat')) {
                    $stored = $request->file('file_surat')->store('uploads/surat', 'public');
                    $suratPath = '/storage/'.$stored;
                }

                // 4. Perbarui data transaksi
                $peminjaman->update([
                    'nama_peminjam' => $validated['nama_peminjam'],
                    'nim_nip' => ! empty($validated['nim_nip']) ? $validated['nim_nip'] : $peminjaman->nim_nip,
                    'instansi_prodi' => Str::limit($validated['instansi_prodi'], 100, ''),
                    'no_whatsapp' => $validated['no_whatsapp'],
                    'file_ktm' => $ktmPath,
                    'file_surat_pengantar' => $suratPath,
                    'keperluan' => $validated['keperluan'],
                    'tanggal_mulai' => Carbon::parse($validated['tanggal_mulai'])->startOfDay(),
                    'tanggal_kembali_rencana' => Carbon::parse($validated['tanggal_kembali_rencana'])->endOfDay(),
                ]);

                // 5. Perbarui items relasi
                $peminjaman->items()->delete();
                foreach ($validated['items'] as $item) {
                    PeminjamanItem::create([
                        'peminjaman_id' => $peminjaman->id,
                        'sarpras_id' => $item['sarpras_id'],
                        'qty' => $item['qty'],
                    ]);
                }

                // 6. Catat log pembaruan
                PeminjamanLog::create([
                    'peminjaman_id' => $peminjaman->id,
                    'actor_id' => auth()->id(),
                    'status_sebelum' => $peminjaman->status,
                    'status_sesudah' => $peminjaman->status,
                    'keterangan' => 'Peminjam memperbarui data formulir & fasilitas yang diajukan.',
                ]);
            });

            event(new AktivitasSistemEvent(
                actor: auth()->user(),
                jenisAktivitas: "Memperbarui Peminjaman {$peminjaman->kode_transaksi}",
                message: "Pemohon memperbarui formulir peminjaman {$peminjaman->kode_transaksi}.",
                actionUrl: '/admin/peminjaman',
                type: 'peminjaman',
                icon: 'document',
            ));

            return redirect()->route('layanan.peminjaman.index')
                ->with('success', "Pengajuan peminjaman {$peminjaman->kode_transaksi} berhasil diperbarui!");
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['items' => $e->getMessage()])->withInput();
        }
    }

    /**
     * Peminjam Membatalkan / Menghapus Pengajuan Sebelum Approval
     */
    public function destroy(Request $request, Peminjaman $peminjaman): RedirectResponse
    {
        if ($peminjaman->user_id !== auth()->id()) {
            abort(403, 'Anda tidak berhak membatalkan pengajuan ini.');
        }

        if (! in_array($peminjaman->status, ['menunggu_validasi', 'ditunda'], true)) {
            return redirect()->back()->with('error', 'Pengajuan ini sudah diproses atau disetujui sehingga tidak dapat dibatalkan.');
        }

        DB::transaction(function () use ($peminjaman) {
            // 1. Kembalikan seluruh stok yang sempat dipotong
            foreach ($peminjaman->items as $item) {
                $sarpras = Sarpras::find($item->sarpras_id);
                if ($sarpras) {
                    $stokSebelum = $sarpras->stok_tersedia;
                    $sarpras->increment('stok_tersedia', $item->qty);
                    $stokSesudah = $sarpras->fresh()->stok_tersedia;

                    SarprasStockMutation::create([
                        'sarpras_id' => $sarpras->id,
                        'peminjaman_id' => $peminjaman->id,
                        'tipe' => 'masuk',
                        'jumlah' => $item->qty,
                        'stok_sebelum' => $stokSebelum,
                        'stok_sesudah' => $stokSesudah,
                        'keterangan' => "Pengembalian stok: Peminjaman {$peminjaman->kode_transaksi} dibatalkan oleh peminjam",
                        'created_by' => auth()->id(),
                    ]);
                }
            }

            // Hapus mutasi keluar
            SarprasStockMutation::where('peminjaman_id', $peminjaman->id)->where('tipe', 'keluar')->delete();

            $statusSebelum = $peminjaman->status;
            $peminjaman->update([
                'status' => 'dibatalkan',
                'catatan_admin' => 'Dibatalkan sendiri oleh pemohon sebelum validasi Admin.',
            ]);

            PeminjamanLog::create([
                'peminjaman_id' => $peminjaman->id,
                'actor_id' => auth()->id(),
                'status_sebelum' => $statusSebelum,
                'status_sesudah' => 'dibatalkan',
                'keterangan' => 'Pengajuan peminjaman dibatalkan oleh peminjam.',
            ]);
        });

        event(new AktivitasSistemEvent(
            actor: auth()->user(),
            jenisAktivitas: "Membatalkan Peminjaman {$peminjaman->kode_transaksi}",
            message: "Pemohon membatalkan pengajuan {$peminjaman->kode_transaksi}.",
            actionUrl: '/admin/peminjaman',
            type: 'peminjaman',
            icon: 'alert',
        ));

        return redirect()->route('layanan.peminjaman.index')
            ->with('success', "Pengajuan peminjaman {$peminjaman->kode_transaksi} berhasil dibatalkan dan stok fasilitas telah dikembalikan.");
    }
}
