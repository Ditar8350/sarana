<?php

use App\Http\Controllers\Admin\BeritaController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\DokumenController;
use App\Http\Controllers\Admin\HeroSectionController;
use App\Http\Controllers\Admin\KontakController;
use App\Http\Controllers\Admin\LaporanController;
use App\Http\Controllers\Admin\MaintenanceController;
use App\Http\Controllers\Admin\PeminjamanController;
use App\Http\Controllers\Admin\PengecekanRuanganController;
use App\Http\Controllers\Admin\PengembalianController;
use App\Http\Controllers\Admin\PenggunaController;
use App\Http\Controllers\Admin\SambutanController;
use App\Http\Controllers\Admin\StokSarprasController;
use App\Http\Controllers\Admin\StrukturController;
use App\Http\Controllers\Admin\VisiMisiController;
use App\Http\Controllers\Mahasiswa\PeminjamanMahasiswaController;
use App\Http\Controllers\Mahasiswa\PengembalianMahasiswaController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PublicController;
use App\Http\Controllers\Staf\LaporKerusakanController;
use App\Http\Controllers\Staf\PengadaanController;
use App\Http\Controllers\StafRuangan\StafRuanganController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::get('/', [PublicController::class, 'index'])->name('home');
Route::get('/berita/{slug}', [PublicController::class, 'berita'])->name('berita.detail');
Route::get('/dokumen', [PublicController::class, 'dokumen'])->name('dokumen');
Route::get('/dokumen/unduh/{dokumen}', [PublicController::class, 'unduhDokumen'])->name('dokumen.unduh');
Route::get('/struktur', [PublicController::class, 'struktur'])->name('struktur');

// User Auth Routes
Route::middleware(['auth', 'verified', 'throttle:60,1'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Portal Layanan Peminjaman & Pengembalian untuk Mahasiswa / Peminjam
    Route::prefix('layanan')->name('layanan.')->group(function () {
        Route::get('/sarpras', [PeminjamanMahasiswaController::class, 'katalog'])->name('sarpras.index');
        Route::get('/sarpras/ajukan', [PeminjamanMahasiswaController::class, 'create'])->name('sarpras.ajukan');
        Route::get('/peminjaman/ajukan', fn () => redirect()->route('layanan.sarpras.ajukan', request()->query()))->name('peminjaman.create');
        Route::get('/peminjaman', [PeminjamanMahasiswaController::class, 'index'])->name('peminjaman.index');
        Route::post('/peminjaman', [PeminjamanMahasiswaController::class, 'store'])->name('peminjaman.store');
        Route::get('/peminjaman/{peminjaman}/edit', [PeminjamanMahasiswaController::class, 'edit'])->name('peminjaman.edit');
        Route::match(['put', 'post'], '/peminjaman/{peminjaman}', [PeminjamanMahasiswaController::class, 'update'])->name('peminjaman.update');
        Route::delete('/peminjaman/{peminjaman}', [PeminjamanMahasiswaController::class, 'destroy'])->name('peminjaman.destroy');
        Route::post('/peminjaman/{peminjaman}/batal', [PeminjamanMahasiswaController::class, 'destroy'])->name('peminjaman.batal');
        Route::post('/peminjaman/{peminjaman}/terima-barang', [PeminjamanMahasiswaController::class, 'terimaBarang'])->name('peminjaman.terima-barang');
        Route::post('/peminjaman/{peminjaman}/kembalikan', [PeminjamanMahasiswaController::class, 'submitPengembalian'])->name('peminjaman.kembalikan');
        Route::get('/pengembalian', [PengembalianMahasiswaController::class, 'index'])->name('pengembalian.index');
        Route::post('/pengembalian/{peminjaman}', [PengembalianMahasiswaController::class, 'store'])->name('pengembalian.store');
        Route::post('/pengembalian/{pengembalian}/bayar-denda', [PengembalianMahasiswaController::class, 'bayarDenda'])->name('pengembalian.bayar-denda');
        Route::get('/berita', [PeminjamanMahasiswaController::class, 'berita'])->name('berita.index');
    });

    // Portal Pelaporan Maintenance & Kerusakan (Kepala Bagian Kelas & Admin)
    Route::prefix('staf')->name('staf.')->middleware('role:kepala_bagian,admin,staf_ruangan')->group(function () {
        Route::get('/lapor-kerusakan', [LaporKerusakanController::class, 'index'])->name('lapor-kerusakan.index');
        Route::post('/lapor-kerusakan', [LaporKerusakanController::class, 'store'])->name('lapor-kerusakan.store');
    });

    // Portal Pengadaan & Rencana Kebutuhan Sarpras (Kepala Bagian, Staf Sarpras, dan Admin)
    Route::prefix('staf')->name('staf.')->middleware('role:kepala_bagian,staf,admin,staf_ruangan')->group(function () {
        Route::get('/pengadaan', [PengadaanController::class, 'index'])->name('pengadaan.index');
        Route::post('/pengadaan', [PengadaanController::class, 'store'])->middleware('role:kepala_bagian,admin,staf_ruangan,staf')->name('pengadaan.store');
        Route::post('/pengadaan/{pengadaan}/upload-nota', [PengadaanController::class, 'uploadNota'])->middleware('role:staf,admin')->name('pengadaan.upload-nota');
        Route::post('/pengadaan/{pengadaan}/status', [PengadaanController::class, 'updateStatus'])->middleware('role:admin')->name('pengadaan.status');
    });

    // Master Stok Sarana & Prasarana (Admin, Staf Sarpras, dan Kepala Bagian)
    Route::prefix('admin')->name('admin.')->middleware('role:admin,staf,kepala_bagian,staf_ruangan')->group(function () {
        Route::get('/stok-sarpras', [StokSarprasController::class, 'index'])->name('stok-sarpras.index');
        Route::post('/stok-sarpras', [StokSarprasController::class, 'store'])->name('stok-sarpras.store');
        Route::match(['put', 'post'], '/stok-sarpras/{sarpras}', [StokSarprasController::class, 'update'])->name('stok-sarpras.update');
        Route::delete('/stok-sarpras/{sarpras}', [StokSarprasController::class, 'destroy'])->name('stok-sarpras.destroy');
    });

    // Validasi & Persetujuan Pengajuan Peminjaman (Khusus Admin Sarpras - Staf Tidak Bisa Memverifikasi)
    Route::prefix('admin')->name('admin.')->middleware('role:admin')->group(function () {
        Route::post('/peminjaman/{peminjaman}/approve', [PeminjamanController::class, 'approve'])->name('peminjaman.approve');
        Route::post('/peminjaman/{peminjaman}/tunda', [PeminjamanController::class, 'tunda'])->name('peminjaman.tunda');
        Route::post('/peminjaman/{peminjaman}/reject', [PeminjamanController::class, 'reject'])->name('peminjaman.reject');
        Route::post('/peminjaman/{peminjaman}/update', [PeminjamanController::class, 'update'])->name('peminjaman.update');
    });

    // Daftar Tugas Pendampingan & Serah-Terima Fisik Barang (Admin & Staf yang Ditugaskan)
    Route::prefix('admin')->name('admin.')->middleware('role:admin,staf')->group(function () {
        Route::get('/peminjaman', [PeminjamanController::class, 'index'])->name('peminjaman.index');
        Route::post('/peminjaman/{peminjaman}/serahkan', [PeminjamanController::class, 'serahkan'])->name('peminjaman.serahkan');
        Route::post('/peminjaman/{peminjaman}/terima-barang', [PeminjamanController::class, 'terimaBarang'])->name('peminjaman.terima-barang');
    });

    // Kelola & Tambah Inventaris Ruangan (Admin, Staf Sarpras, Kepala Bagian / Ruangan, Staf Ruangan)
    Route::prefix('admin')->name('admin.')->middleware('role:admin,staf,kepala_bagian,staf_ruangan')->group(function () {
        Route::get('/inventaris', [StafRuanganController::class, 'inventaris'])->name('inventaris.index');
        Route::post('/inventaris', [StafRuanganController::class, 'storeInventaris'])->name('inventaris.store');
        Route::post('/inventaris/{sarpras}', [StafRuanganController::class, 'updateInventaris'])->name('inventaris.update');
        Route::delete('/inventaris/{sarpras}', [StafRuanganController::class, 'destroyInventaris'])->name('inventaris.destroy');
    });

    // Operasional Sirkulasi Pengembalian, Maintenance & Laporan (Admin & Staf Sarpras)
    Route::prefix('admin')->name('admin.')->middleware('role:admin,staf')->group(function () {
        // Validasi Pengembalian Fisik & Cek Denda
        Route::get('/pengembalian', [PengembalianController::class, 'index'])->name('pengembalian.index');
        Route::post('/pengembalian/{pengembalian}/verifikasi', [PengembalianController::class, 'verifikasi'])->name('pengembalian.verifikasi');
        Route::post('/pengembalian/{pengembalian}/verifikasi-denda', [PengembalianController::class, 'verifikasiDenda'])->middleware('role:admin')->name('pengembalian.verifikasi-denda');

        // Monitoring, Penugasan & Update Maintenance / Servis
        Route::get('/maintenance', [MaintenanceController::class, 'index'])->name('maintenance.index');
        Route::post('/maintenance/{maintenance}/status', [MaintenanceController::class, 'updateStatus'])->name('maintenance.status');

        // Monitoring & Verifikasi Pengecekan Ruangan Unit
        Route::get('/pengecekan-ruangan', [PengecekanRuanganController::class, 'index'])->name('pengecekan-ruangan.index');
        Route::post('/pengecekan-ruangan/{pengecekan}/verifikasi', [PengecekanRuanganController::class, 'verifikasi'])->name('pengecekan-ruangan.verifikasi');

        // Rekap Laporan Terpadu
        Route::get('/laporan', [LaporanController::class, 'index'])->name('laporan.index');
    });

    // Portal Staf Unit / Ruangan, Kepala Bagian, & Staf Sarpras
    Route::prefix('staf-ruangan')->name('staf-ruangan.')->middleware('role:staf_ruangan,kepala_bagian,admin,staf')->group(function () {
        Route::get('/dashboard', [StafRuanganController::class, 'dashboard'])->name('dashboard');
        Route::get('/inventaris', [StafRuanganController::class, 'inventaris'])->name('inventaris.index');
        Route::post('/inventaris', [StafRuanganController::class, 'storeInventaris'])->name('inventaris.store');
        Route::post('/inventaris/{sarpras}', [StafRuanganController::class, 'updateInventaris'])->name('inventaris.update');
        Route::delete('/inventaris/{sarpras}', [StafRuanganController::class, 'destroyInventaris'])->name('inventaris.destroy');
        Route::get('/pengecekan', [StafRuanganController::class, 'pengecekan'])->name('pengecekan.index');
        Route::post('/pengecekan', [StafRuanganController::class, 'storePengecekan'])->name('pengecekan.store');
        Route::get('/maintenance', [StafRuanganController::class, 'maintenance'])->name('maintenance.index');
        Route::post('/maintenance', [StafRuanganController::class, 'storeMaintenance'])->name('maintenance.store');
        Route::get('/pengadaan', [StafRuanganController::class, 'pengadaan'])->name('pengadaan.index');
        Route::post('/pengadaan', [StafRuanganController::class, 'storePengadaan'])->name('pengadaan.store');
    });

    // Manajemen Berita & Pengumuman (Admin dan Staf Sarpras)
    Route::prefix('admin')->name('admin.')->middleware('role:admin,staf')->group(function () {
        Route::get('/berita', [BeritaController::class, 'index'])->name('berita.index');
        Route::post('/berita', [BeritaController::class, 'store'])->name('berita.store');
        Route::post('/berita/{berita}', [BeritaController::class, 'update'])->name('berita.update');
        Route::delete('/berita/{berita}', [BeritaController::class, 'destroy'])->name('berita.destroy');
    });

    // Sisi Manajerial & Eksekutif (Khusus Super Admin / Kepala Biro)
    Route::prefix('admin')->name('admin.')->middleware('role:admin')->group(function () {

        // Banner Beranda & Sambutan
        Route::get('/hero-section', [HeroSectionController::class, 'index'])->name('hero-section.index');
        Route::post('/hero-section', [HeroSectionController::class, 'update'])->name('hero-section.update');
        Route::get('/sambutan', [SambutanController::class, 'index'])->name('sambutan.index');
        Route::post('/sambutan', [SambutanController::class, 'update'])->name('sambutan.update');

        // Visi & Misi
        Route::get('/visi-misi', [VisiMisiController::class, 'index'])->name('visi-misi.index');
        Route::post('/visi-misi', [VisiMisiController::class, 'update'])->name('visi-misi.update');

        // Dokumen
        Route::get('/dokumen', [DokumenController::class, 'index'])->name('dokumen.index');
        Route::post('/dokumen', [DokumenController::class, 'store'])->name('dokumen.store');
        Route::post('/dokumen/{dokumen}', [DokumenController::class, 'update'])->name('dokumen.update');
        Route::delete('/dokumen/{dokumen}', [DokumenController::class, 'destroy'])->name('dokumen.destroy');

        // Struktur Organisasi
        Route::get('/struktur', [StrukturController::class, 'index'])->name('struktur.index');
        Route::post('/struktur', [StrukturController::class, 'update'])->name('struktur.update');

        // Kontak & Layanan
        Route::get('/kontak', [KontakController::class, 'index'])->name('kontak.index');
        Route::post('/kontak', [KontakController::class, 'update'])->name('kontak.update');

        // Manajemen Pengguna (Khusus Admin)
        Route::middleware('can:manage-users')->group(function () {
            Route::get('/pengguna', [PenggunaController::class, 'index'])->name('pengguna.index');
            Route::post('/pengguna', [PenggunaController::class, 'store'])->name('pengguna.store');
            Route::put('/pengguna/{pengguna}', [PenggunaController::class, 'update'])->name('pengguna.update');
            Route::delete('/pengguna/{pengguna}', [PenggunaController::class, 'destroy'])->name('pengguna.destroy');
        });
    });
});

Route::middleware('auth')->group(function () {
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead'])->name('notifications.markAllAsRead');
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.markAsRead');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
