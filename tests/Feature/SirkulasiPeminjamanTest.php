<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Peminjaman;
use App\Models\PeminjamanItem;
use App\Models\Pengembalian;
use App\Models\Sarpras;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SirkulasiPeminjamanTest extends TestCase
{
    use RefreshDatabase;

    public function test_complete_sirkulasi_peminjaman_workflow(): void
    {
        $admin = User::factory()->admin()->create();
        $staf = User::factory()->staf()->create();
        $mahasiswa = User::factory()->create();

        $sarpras = Sarpras::factory()->create([
            'nama' => 'Proyektor Epson',
            'stok_total' => 5,
            'stok_tersedia' => 5,
            'dapat_dipinjam' => true,
        ]);

        // 1. Mahasiswa mengajukan peminjaman
        $peminjaman = Peminjaman::create([
            'kode_transaksi' => 'PJ-2026-TEST',
            'user_id' => $mahasiswa->id,
            'nama_peminjam' => 'Mahasiswa Test',
            'nim_nip' => '2026001',
            'instansi_prodi' => 'Sistem Informasi',
            'no_whatsapp' => '08123456789',
            'file_ktm' => '/storage/ktm.png',
            'keperluan' => 'Seminar Proposal',
            'tanggal_mulai' => now()->addDay(),
            'tanggal_kembali_rencana' => now()->addDays(2),
            'status' => 'menunggu_validasi',
        ]);

        PeminjamanItem::create([
            'peminjaman_id' => $peminjaman->id,
            'sarpras_id' => $sarpras->id,
            'qty' => 2,
        ]);

        // Stok masih 5
        $this->assertEquals(5, $sarpras->fresh()->stok_tersedia);

        // 2. Admin Menyetujui Izin
        $this->actingAs($admin)
            ->post("/admin/peminjaman/{$peminjaman->id}/approve", [
                'catatan_admin' => 'Disetujui. Ambil di pos sarpras.',
            ])
            ->assertRedirect();

        $this->assertEquals('disetujui', $peminjaman->fresh()->status);
        // Stok fisik di gudang belum dipotong sebelum serah-terima
        $this->assertEquals(5, $sarpras->fresh()->stok_tersedia);

        // 3. Staf Sarpras menyerahkan barang fisik di loket (Step 3 Pembagian Staf)
        $this->actingAs($staf)
            ->post("/admin/peminjaman/{$peminjaman->id}/serahkan", [
                'petugas_pengambilan' => 'Staf Loket Sarpras',
                'lokasi_pengambilan' => 'Gedung Rektorat Lt. 1',
            ])
            ->assertRedirect();

        $this->assertEquals('siap_diambil', $peminjaman->fresh()->status);
        // Stok berkurang 2 -> menjadi 3
        $this->assertEquals(3, $sarpras->fresh()->stok_tersedia);
        $this->assertDatabaseHas('sarpras_stock_mutations', [
            'sarpras_id' => $sarpras->id,
            'peminjaman_id' => $peminjaman->id,
            'tipe' => 'keluar',
            'jumlah' => 2,
        ]);

        // 3b. Mahasiswa/Admin mengunggah bukti terima (Step 4 Sukses -> sedang_dipinjam)
        Storage::fake('public');
        $file = UploadedFile::fake()->image('bukti.jpg');
        $this->actingAs($staf)
            ->post("/admin/peminjaman/{$peminjaman->id}/terima-barang", [
                'foto_bukti_terima' => $file,
            ])
            ->assertRedirect();

        $this->assertEquals('sedang_dipinjam', $peminjaman->fresh()->status);

        // 4. Mahasiswa mengajukan pengembalian
        $pengembalian = Pengembalian::create([
            'kode_pengembalian' => 'KB-2026-TEST',
            'peminjaman_id' => $peminjaman->id,
            'user_id' => $mahasiswa->id,
            'tanggal_pengajuan_kembali' => now(),
            'status_verifikasi' => 'menunggu_inspeksi',
        ]);

        // 5. Staf Sarpras melakukan inspeksi fisik & verifikasi selesai
        $item = $peminjaman->items->first();
        $this->actingAs($staf)
            ->post("/admin/pengembalian/{$pengembalian->id}/verifikasi", [
                'kondisi_items' => [$item->id => 'sempurna'],
                'catatan_inspeksi_admin' => 'Barang lengkap dan mulus.',
                'biaya_denda' => 0,
            ])
            ->assertRedirect();

        $this->assertEquals('selesai', $peminjaman->fresh()->status);
        // Stok pulih bertambah kembali 2 -> menjadi 5
        $this->assertEquals(5, $sarpras->fresh()->stok_tersedia);
        $this->assertDatabaseHas('sarpras_stock_mutations', [
            'sarpras_id' => $sarpras->id,
            'peminjaman_id' => $peminjaman->id,
            'tipe' => 'masuk',
            'jumlah' => 2,
        ]);
    }

    public function test_alur_4_step_mahasiswa_katalog_dan_tunda(): void
    {
        $admin = User::factory()->admin()->create();
        $mahasiswa = User::factory()->create();

        $sarpras = Sarpras::factory()->create([
            'nama' => 'Kamera Sony A6400',
            'jenis' => 'sarana',
            'stok_total' => 2,
            'stok_tersedia' => 2,
            'dapat_dipinjam' => true,
        ]);

        // 1. Mahasiswa membuka katalog sarpras
        $responseKatalog = $this->actingAs($mahasiswa)->get(route('layanan.sarpras.index'));
        $responseKatalog->assertOk();

        // 2. Mahasiswa mengajukan peminjaman (Step 1)
        $peminjaman = Peminjaman::create([
            'kode_transaksi' => 'PJ-4STEP-TEST',
            'user_id' => $mahasiswa->id,
            'nama_peminjam' => 'Dita Ramdani',
            'nim_nip' => '2355202065',
            'instansi_prodi' => 'Teknik Informatika',
            'no_whatsapp' => '081234567890',
            'file_ktm' => '/storage/ktm_dita.png',
            'keperluan' => 'Dokumentasi Acara Kampus',
            'tanggal_mulai' => now()->addDay(),
            'tanggal_kembali_rencana' => now()->addDays(2),
            'status' => 'menunggu_validasi',
        ]);

        PeminjamanItem::create([
            'peminjaman_id' => $peminjaman->id,
            'sarpras_id' => $sarpras->id,
            'qty' => 1,
        ]);

        // 3. Admin menunda pengajuan (Step 2 - Ditunda)
        $this->actingAs($admin)
            ->post("/admin/peminjaman/{$peminjaman->id}/tunda", [
                'alasan' => 'Mohon konfirmasi jadwal kembali.',
            ])
            ->assertRedirect();

        $peminjaman->refresh();
        $this->assertEquals('ditunda', $peminjaman->status);
        $this->assertEquals('Mohon konfirmasi jadwal kembali.', $peminjaman->catatan_admin);

        // 4. Admin menyetujui pengajuan + tentukan pihak & lokasi loket (Step 2 -> Step 3)
        $this->actingAs($admin)
            ->post("/admin/peminjaman/{$peminjaman->id}/approve", [
                'petugas_pengambilan' => 'Bpk. Haris (Staf Loket Sarpras)',
                'lokasi_pengambilan' => 'Gudang Sarpras Kampus Sukaraja',
                'catatan_admin' => 'Disetujui. Tunjukkan KTM saat pengambilan.',
            ])
            ->assertRedirect();

        $peminjaman->refresh();
        $this->assertEquals('disetujui', $peminjaman->status);
        $this->assertEquals('Bpk. Haris (Staf Loket Sarpras)', $peminjaman->petugas_pengambilan);
        $this->assertEquals('Gudang Sarpras Kampus Sukaraja', $peminjaman->lokasi_pengambilan);
    }

    public function test_mahasiswa_can_submit_peminjaman_with_multiple_items_and_ktm_required(): void
    {
        Storage::fake('public');

        $mahasiswa = User::factory()->create([
            'role' => UserRole::Mahasiswa,
            'nomor_induk' => '2355202065',
        ]);

        $item1 = Sarpras::factory()->create([
            'nama' => 'Monitor LED',
            'jenis' => 'sarana',
            'stok_total' => 10,
            'stok_tersedia' => 10,
            'dapat_dipinjam' => true,
        ]);

        $item2 = Sarpras::factory()->create([
            'nama' => 'Kamera Sony A6400',
            'jenis' => 'sarana',
            'stok_total' => 2,
            'stok_tersedia' => 2,
            'dapat_dipinjam' => true,
        ]);

        // Coba submit tanpa KTM -> Harus gagal validasi karena KTM wajib
        $responseNoKtm = $this->actingAs($mahasiswa)->post('/layanan/peminjaman', [
            'nama_peminjam' => 'Dita Ramdani',
            'nim_nip' => '2355202065',
            'instansi_prodi' => 'S1 Informatika - Fakultas Sains dan Teknologi (FST)',
            'no_whatsapp' => '08123456789',
            'keperluan' => 'Praktikum dan Dokumentasi',
            'tanggal_mulai' => now()->addDay()->toDateString(),
            'tanggal_kembali_rencana' => now()->addDays(2)->toDateString(),
            'items' => [
                ['sarpras_id' => $item1->id, 'qty' => 1],
                ['sarpras_id' => $item2->id, 'qty' => 1],
            ],
        ]);
        $responseNoKtm->assertSessionHasErrors('file_ktm');

        // Submit dengan KTM dan beberapa item sekaligus -> Harus sukses
        $ktmFile = UploadedFile::fake()->create('ktm_dita.jpg', 200, 'image/jpeg');

        $responseSuccess = $this->actingAs($mahasiswa)->post('/layanan/peminjaman', [
            'nama_peminjam' => 'Dita Ramdani',
            'nim_nip' => '2355202065',
            'instansi_prodi' => 'S1 Informatika - Fakultas Sains dan Teknologi (FST)',
            'no_whatsapp' => '08123456789',
            'keperluan' => 'Praktikum dan Dokumentasi',
            'tanggal_mulai' => now()->addDay()->toDateString(),
            'tanggal_kembali_rencana' => now()->addDays(2)->toDateString(),
            'file_ktm' => $ktmFile,
            'items' => [
                ['sarpras_id' => $item1->id, 'qty' => 1],
                ['sarpras_id' => $item2->id, 'qty' => 1],
            ],
        ]);

        $responseSuccess->assertRedirect(route('layanan.sarpras.index'));
        $responseSuccess->assertSessionHas('success');

        $this->assertDatabaseHas('peminjamans', [
            'nama_peminjam' => 'Dita Ramdani',
            'nim_nip' => '2355202065',
        ]);

        $createdPeminjaman = Peminjaman::where('nama_peminjam', 'Dita Ramdani')->latest()->first();
        $this->assertNotNull($createdPeminjaman);
        $this->assertCount(2, $createdPeminjaman->items);
    }
}
