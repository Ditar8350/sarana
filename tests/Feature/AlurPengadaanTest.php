<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Pengadaan;
use App\Models\Sarpras;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AlurPengadaanTest extends TestCase
{
    use RefreshDatabase;

    public function test_alur_lengkap_pengadaan_kepala_bagian_admin_staf(): void
    {
        Storage::fake('public');

        // 1. Setup 3 Pengguna (Kepala Bagian, Admin, Staf)
        $kepalaBagian = User::factory()->create([
            'role' => UserRole::KepalaBagian,
            'name' => 'Pak Budi Ka. Lab',
        ]);

        $admin = User::factory()->create([
            'role' => UserRole::Admin,
            'name' => 'Kepala Biro Sarpras',
        ]);

        $staf = User::factory()->create([
            'role' => UserRole::Staf,
            'name' => 'Haris Staf Lapangan',
        ]);

        // 2. Kepala Bagian mengajukan rencana kebutuhan barang baru
        $responseAjukan = $this->actingAs($kepalaBagian)->post(route('staf.pengadaan.store'), [
            'nama_barang' => 'Router Mikrotik CCR1009',
            'kategori' => 'Elektronik & Multimedia',
            'jumlah' => 2,
            'satuan' => 'Unit',
            'lokasi_penempatan' => 'Gedung Rektorat Kampus Utama',
            'ruangan_tujuan' => 'Ruang Server NOC Lt 3',
            'alasan_pengadaan' => 'Peningkatan kapasitas bandwidth jaringan kampus dan praktikum mahasiswa',
        ]);

        $responseAjukan->assertSessionHas('success');

        $pengadaan = Pengadaan::first();
        $this->assertNotNull($pengadaan);
        $this->assertEquals('Router Mikrotik CCR1009', $pengadaan->nama_barang);
        $this->assertEquals(2, $pengadaan->jumlah);
        $this->assertEquals('diajukan', $pengadaan->status);
        $this->assertEquals($kepalaBagian->id, $pengadaan->user_id);
        $this->assertEquals(0, (float) $pengadaan->estimasi_harga_satuan);

        // 3. Admin memvalidasi dan menyetujui rencana kebutuhan
        $responseAdminApprove = $this->actingAs($admin)->post(route('staf.pengadaan.status', $pengadaan), [
            'status' => 'disetujui',
            'catatan_admin' => 'Disetujui untuk dibeli oleh staf gudang.',
        ]);

        $responseAdminApprove->assertSessionHas('success');
        $pengadaan->refresh();
        $this->assertEquals('disetujui', $pengadaan->status);
        $this->assertEquals($admin->id, $pengadaan->admin_id);

        // 4. Staf Sarpras membelanjakan barang dan mengunggah foto bukti nota
        $dummyNota = UploadedFile::fake()->image('nota_mikrotik.jpg', 600, 800);

        $responseStafBeli = $this->actingAs($staf)->post(route('staf.pengadaan.upload-nota', $pengadaan), [
            'tanggal_pembelian' => '2026-11-02',
            'estimasi_harga_satuan' => 4500000,
            'foto_bukti_nota' => $dummyNota,
            'nama_toko_vendor' => 'CV. Mitra Jaringan Utama',
            'spesifikasi' => 'CCR1009-7G-1C-1S+ 8 Core',
        ]);

        $responseStafBeli->assertSessionHas('success');
        $pengadaan->refresh();
        $this->assertEquals('selesai', $pengadaan->status);
        $this->assertEquals($staf->id, $pengadaan->staf_id);
        $this->assertEquals(4500000, (float) $pengadaan->estimasi_harga_satuan);
        $this->assertEquals(9000000, (float) $pengadaan->total_biaya);
        $this->assertNotNull($pengadaan->foto_bukti_nota);

        // 5. Admin menambahkan barang pengadaan selesai ke Master Stok Sarpras
        $responseAddSarpras = $this->actingAs($admin)->post(route('staf.pengadaan.status', $pengadaan), [
            'status' => 'selesai',
            'masukkan_ke_sarpras' => true,
        ]);

        $responseAddSarpras->assertSessionHas('success');
        $pengadaan->refresh();
        $this->assertNotNull($pengadaan->sarpras_id);

        $sarpras = Sarpras::find($pengadaan->sarpras_id);
        $this->assertNotNull($sarpras);
        $this->assertEquals('Router Mikrotik CCR1009', $sarpras->nama);
        $this->assertEquals(2, $sarpras->stok_total);
        $this->assertEquals(2, $sarpras->stok_tersedia);
    }

    public function test_otorisasi_dan_integrasi_pengadaan_perbaikan_peminjaman(): void
    {
        Storage::fake('public');

        $kepalaBagian = User::factory()->create(['role' => UserRole::KepalaBagian]);
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $stafA = User::factory()->create(['role' => UserRole::Staf, 'name' => 'Haris']);
        $stafB = User::factory()->create(['role' => UserRole::Staf, 'name' => 'Ahmad']);

        // 1. Staf dapat membuat usulan pengadaan baru dan terintegrasi ke Admin
        $this->actingAs($stafA)->post(route('staf.pengadaan.store'), [
            'nama_barang' => 'Kursi Kuliah',
            'kategori' => 'Mebel & Furnitur',
            'jumlah' => 5,
            'satuan' => 'Unit',
            'lokasi_penempatan' => 'Gedung B',
            'ruangan_tujuan' => 'Ruang 201',
            'alasan_pengadaan' => 'Kurang kursi',
        ])->assertSessionHas('success');

        // 2. Kepala Bagian mengajukan dengan estimasi harga (#13)
        $this->actingAs($kepalaBagian)->post(route('staf.pengadaan.store'), [
            'nama_barang' => 'Proyektor Epson',
            'kategori' => 'Elektronik & Multimedia',
            'jumlah' => 2,
            'satuan' => 'Unit',
            'estimasi_harga_satuan' => 5000000,
            'lokasi_penempatan' => 'Gedung A',
            'ruangan_tujuan' => 'Lab Multimedia',
            'alasan_pengadaan' => 'Penggantian proyektor buram',
        ])->assertSessionHas('success');

        $pengadaan = Pengadaan::where('nama_barang', 'Proyektor Epson')->firstOrFail();
        $this->assertEquals(10000000, (float) $pengadaan->total_biaya);

        // 3. Staf tidak boleh menyetujui usulan pengadaan (#3) dan tidak boleh upload nota sebelum disetujui (#4)
        $this->actingAs($stafA)->post(route('staf.pengadaan.status', $pengadaan), [
            'status' => 'disetujui',
        ])->assertForbidden();

        $this->actingAs($stafA)->post(route('staf.pengadaan.upload-nota', $pengadaan), [
            'tanggal_pembelian' => '2026-11-05',
            'estimasi_harga_satuan' => 5000000,
            'foto_bukti_nota' => UploadedFile::fake()->image('nota.jpg'),
        ])->assertStatus(422);

        // 4. Admin menyetujui dan menugaskan Staf A (#5)
        $this->actingAs($admin)->post(route('staf.pengadaan.status', $pengadaan), [
            'status' => 'disetujui',
            'staf_id' => $stafA->id,
            'catatan_admin' => 'Belanja sesuai estimasi.',
        ])->assertSessionHas('success');

        $pengadaan->refresh();
        $this->assertEquals($stafA->id, $pengadaan->staf_id);

        // Staf B yang tidak ditugaskan ditolak saat upload nota (#4)
        $this->actingAs($stafB)->post(route('staf.pengadaan.upload-nota', $pengadaan), [
            'tanggal_pembelian' => '2026-11-05',
            'estimasi_harga_satuan' => 4800000,
            'foto_bukti_nota' => UploadedFile::fake()->image('nota.jpg'),
        ])->assertForbidden();

        // Staf A berhasil upload nota
        $this->actingAs($stafA)->post(route('staf.pengadaan.upload-nota', $pengadaan), [
            'tanggal_pembelian' => '2026-11-05',
            'estimasi_harga_satuan' => 4800000,
            'foto_bukti_nota' => UploadedFile::fake()->image('nota.jpg'),
        ])->assertSessionHas('success');

        // 5. Staf dapat mengakses halaman Tugas Pendampingan (/admin/peminjaman) (#1)
        $this->actingAs($stafA)->get(route('admin.peminjaman.index'))->assertOk();
    }

    public function test_staf_sarpras_dapat_mengajukan_pengadaan_dan_terintegrasi_ke_admin(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin, 'name' => 'Biro Admin']);
        $staf = User::factory()->create(['role' => UserRole::Staf, 'name' => 'Staf Pengadaan']);

        // 1. Staf Sarpras mengajukan pengadaan barang
        $response = $this->actingAs($staf)->post(route('staf.pengadaan.store'), [
            'nama_barang' => 'Kabel LAN Cat6 300 Meter',
            'kategori' => 'Elektronik & Multimedia',
            'jumlah' => 2,
            'satuan' => 'Roll',
            'estimasi_harga_satuan' => 1250000,
            'ruangan_tujuan' => 'Gudang Sarpras Kampus A',
            'alasan_pengadaan' => 'Stok kabel untuk instalasi ruang kelas baru',
            'spesifikasi' => 'Merk Belden Original Cat6 UTP',
        ]);

        $response->assertSessionHas('success');

        // Pastikan tersimpan dengan status 'diajukan' dan pelapor adalah staf
        $pengadaan = Pengadaan::where('nama_barang', 'Kabel LAN Cat6 300 Meter')->firstOrFail();
        $this->assertEquals('diajukan', $pengadaan->status);
        $this->assertEquals($staf->id, $pengadaan->user_id);
        $this->assertEquals(2500000, (float) $pengadaan->total_biaya);

        // 2. Admin melihat pengadaan ini di antrean validasi pengadaan
        $adminIndex = $this->actingAs($admin)->get(route('staf.pengadaan.index'));
        $adminIndex->assertOk();

        // 3. Admin memvalidasi dan menyetujui pengadaan
        $this->actingAs($admin)->post(route('staf.pengadaan.status', $pengadaan), [
            'status' => 'disetujui',
            'staf_id' => $staf->id,
            'catatan_admin' => 'Disetujui untuk dibeli dari anggaran sarpras.',
        ])->assertSessionHas('success');

        $pengadaan->refresh();
        $this->assertEquals('disetujui', $pengadaan->status);
        $this->assertEquals($staf->id, $pengadaan->staf_id);

        // 4. Staf melihat barang ini di daftar pengadaan miliknya
        $stafIndex = $this->actingAs($staf)->get(route('staf.pengadaan.index'));
        $stafIndex->assertOk();

        // 5. Admin & Staf dapat mengakses halaman Laporan dengan 6 kategori terpadu
        $this->actingAs($admin)->get(route('admin.laporan.index'))->assertOk();
        $this->actingAs($staf)->get(route('admin.laporan.index'))->assertOk();
    }
}
