<?php

namespace Tests\Feature;

use App\Models\MaintenanceLaporan;
use App\Models\Pengadaan;
use App\Models\PengecekanRuangan;
use App\Models\Sarpras;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class KepalaBagianTest extends TestCase
{
    use RefreshDatabase;

    public function test_kepala_bagian_can_access_inventaris_and_add_item(): void
    {
        $kepalaBagian = User::factory()->kepalaBagian()->create([
            'unit_ruangan' => 'Laboratorium Komputer',
        ]);

        // Verifikasi akses halaman inventaris
        $inventarisResponse = $this->actingAs($kepalaBagian)->get('/admin/inventaris');
        $inventarisResponse->assertOk();

        // Verifikasi simpan inventaris ruangan
        $storeResponse = $this->actingAs($kepalaBagian)->post('/admin/inventaris', [
            'nama' => 'PC All In One Asus Core i5',
            'kategori' => 'Elektronik & Multimedia',
            'lokasi' => 'Laboratorium Komputer',
            'jumlah' => 5,
            'satuan' => 'Unit',
            'kondisi_umum' => 'Baik',
        ]);
        $storeResponse->assertRedirect();
        $this->assertDatabaseHas('sarpras', [
            'nama' => 'PC All In One Asus Core i5',
            'lokasi' => 'Laboratorium Komputer',
            'stok_total' => 5,
        ]);

        $response = $this->actingAs($kepalaBagian)->get('/admin/stok-sarpras');
        $response->assertOk();

        $postResponse = $this->actingAs($kepalaBagian)->post('/admin/stok-sarpras', [
            'kode' => 'SR-PRJ-KPB-01',
            'nama' => 'Proyektor Epson EB-E500',
            'jenis' => 'sarana',
            'kategori' => 'Elektronik & Multimedia',
            'lokasi' => 'Gedung A Lab Komputer 1',
            'stok_total' => 2,
            'satuan' => 'Unit',
            'kondisi_umum' => 'baik',
            'dapat_dipinjam' => true,
            'deskripsi' => 'Pengadaan oleh Kepala Bagian',
        ]);

        $postResponse->assertRedirect();
        $this->assertDatabaseHas('sarpras', [
            'kode' => 'SR-PRJ-KPB-01',
            'nama' => 'Proyektor Epson EB-E500',
        ]);
    }

    public function test_kepala_bagian_can_submit_maintenance_report_connected_to_admin(): void
    {
        $kepalaBagian = User::factory()->kepalaBagian()->create();
        $sarpras = Sarpras::factory()->create(['nama' => 'AC Panasonic 2PK']);

        $response = $this->actingAs($kepalaBagian)->get('/staf/lapor-kerusakan');
        $response->assertOk();

        $postResponse = $this->actingAs($kepalaBagian)->post('/staf/lapor-kerusakan', [
            'sarpras_id' => $sarpras->id,
            'nama_sarpras' => $sarpras->nama,
            'lokasi_ruang' => 'Ruang Kelas A-201',
            'tingkat_urgensi' => 'darurat',
            'deskripsi_kerusakan' => 'AC mengeluarkan asap dan tidak dingin.',
        ]);

        $postResponse->assertRedirect();
        $this->assertDatabaseHas('maintenance_laporans', [
            'user_id' => $kepalaBagian->id,
            'nama_sarpras' => 'AC Panasonic 2PK',
            'tingkat_urgensi' => 'darurat',
        ]);

        // Verifikasi terhubung ke admin
        $admin = User::factory()->admin()->create();
        $adminResponse = $this->actingAs($admin)->get('/admin/maintenance');
        $adminResponse->assertOk();
    }

    public function test_kepala_bagian_can_login_and_access_dashboard(): void
    {
        $kepalaBagian = User::factory()->kepalaBagian()->create([
            'email' => 'kepala@unuha.ac.id',
            'password' => bcrypt('password'),
        ]);

        $loginResponse = $this->post('/login', [
            'email' => 'kepala@unuha.ac.id',
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $loginResponse->assertRedirect('/dashboard');

        $dashboardResponse = $this->actingAs($kepalaBagian)->get('/dashboard');
        $dashboardResponse->assertRedirect(route('staf-ruangan.dashboard'));

        $stafRuanganDashboardResponse = $this->actingAs($kepalaBagian)->get(route('staf-ruangan.dashboard'));
        $stafRuanganDashboardResponse->assertOk();
    }

    public function test_kepala_bagian_pengadaan_to_admin_approval_to_staf_purchase_and_room_allocation(): void
    {
        Storage::fake('public');

        $kepalaBagian = User::factory()->kepalaBagian()->create([
            'unit_ruangan' => 'Laboratorium Multimedia',
        ]);
        $admin = User::factory()->admin()->create();
        $staf = User::factory()->staf()->create(['name' => 'Haris']);

        // 1. Kepala Bagian mengajukan pengadaan dari /staf-ruangan/pengadaan
        $resPengadaan = $this->actingAs($kepalaBagian)->post('/staf-ruangan/pengadaan', [
            'nama_barang' => 'Kabel LAN Cat 6 300 Meter',
            'kategori' => 'Jaringan & IT',
            'jumlah' => 2,
            'satuan' => 'Roll',
            'estimasi_harga_satuan' => 750000,
            'alasan_pengadaan' => 'Peremajaan kabel jaringan untuk ruang praktikum multimedia',
            'spesifikasi' => 'Belden Original Cat6 1000Mbps',
        ]);
        $resPengadaan->assertRedirect();

        $pengadaan = Pengadaan::where('nama_barang', 'Kabel LAN Cat 6 300 Meter')->first();
        $this->assertNotNull($pengadaan);
        $this->assertEquals('diajukan', $pengadaan->status);
        $this->assertEquals('Laboratorium Multimedia', $pengadaan->ruangan_tujuan);

        // 2. Admin menyetujui usulan pengadaan
        $resAdmin = $this->actingAs($admin)->post(route('staf.pengadaan.status', $pengadaan), [
            'status' => 'disetujui',
            'catatan_admin' => 'Disetujui. Harap staf sarpras membelanjakan ke toko rekanan.',
        ]);
        $resAdmin->assertRedirect();
        $pengadaan->refresh();
        $this->assertEquals('disetujui', $pengadaan->status);

        // 3. Staf sarpras membelanjakan dan upload bukti nota
        $dummyNota = UploadedFile::fake()->image('nota_belden.jpg', 600, 800);
        $resStaf = $this->actingAs($staf)->post(route('staf.pengadaan.upload-nota', $pengadaan), [
            'tanggal_pembelian' => '2026-11-06',
            'estimasi_harga_satuan' => 750000,
            'foto_bukti_nota' => $dummyNota,
            'nama_toko_vendor' => 'Toko Komputer Prima IT',
            'spesifikasi' => 'Belden Cat6 High Quality',
        ]);
        $resStaf->assertRedirect();
        $pengadaan->refresh();
        $this->assertEquals('selesai', $pengadaan->status);
        $this->assertNotNull($pengadaan->sarpras_id);

        // 4. Verifikasi barang langsung terdaftar di katalog sarpras & teralokasi ke ruangan Kepala Bagian
        $sarpras = Sarpras::find($pengadaan->sarpras_id);
        $this->assertNotNull($sarpras);
        $this->assertEquals('Kabel LAN Cat 6 300 Meter', $sarpras->nama);
        $this->assertEquals('Laboratorium Multimedia', $sarpras->lokasi);
        $this->assertEquals(2, $sarpras->stok_total);
    }

    public function test_admin_maintenance_assignment_to_staf_and_completion_by_staf(): void
    {
        $kepalaBagian = User::factory()->kepalaBagian()->create([
            'unit_ruangan' => 'Ruang Dosen Gedung A',
        ]);
        $admin = User::factory()->admin()->create();
        $staf = User::factory()->staf()->create(['name' => 'Haris']);

        // 1. Kepala Bagian melapor kerusakan dari inventaris ruangan yang telah diverifikasi Admin
        $sarprasDosen = Sarpras::factory()->create([
            'nama' => 'Proyektor BenQ Ruang Dosen',
            'lokasi' => 'Ruang Dosen Gedung A',
        ]);
        PengecekanRuangan::create([
            'kode_pengecekan' => '#CK-2026-TEST1',
            'user_id' => $kepalaBagian->id,
            'nama_ruangan' => 'Ruang Dosen Gedung A',
            'tanggal_pengecekan' => now()->toDateString(),
            'kondisi_kebersihan' => 'bersih',
            'kondisi_sarpras' => 'ada_kerusakan',
            'catatan_pemeriksaan' => 'Laporan inventaris awal',
            'items_checked' => [['sarpras_id' => $sarprasDosen->id, 'nama' => $sarprasDosen->nama, 'kondisi' => 'rusak_ringan']],
            'status_tinjauan' => 'diverifikasi_admin',
            'ditinjau_pada' => now(),
        ]);

        $this->actingAs($kepalaBagian)->post('/staf-ruangan/maintenance', [
            'sarpras_id' => $sarprasDosen->id,
            'tingkat_urgensi' => 'tinggi',
            'alasan_maintenance' => 'Lampu proyektor berkedip merah dan mati mendadak saat presentasi',
        ]);

        $maintenance = MaintenanceLaporan::where('nama_sarpras', 'Proyektor BenQ Ruang Dosen')->first();
        $this->assertNotNull($maintenance);
        $this->assertEquals('menunggu_tinjauan', $maintenance->status);

        // 2. Admin validasi dan menugaskan Staf Sarpras
        $resTugaskan = $this->actingAs($admin)->post("/admin/maintenance/{$maintenance->id}/status", [
            'status' => 'disetujui',
            'staf_id' => $staf->id,
            'nama_teknisi' => 'Haris (Staf Sarpras)',
            'estimasi_biaya' => 200000,
            'catatan_admin' => 'Segera cek dan ganti filter atau bohlam proyektor.',
        ]);
        $resTugaskan->assertRedirect();

        $maintenance->refresh();
        $this->assertEquals('disetujui', $maintenance->status);
        $this->assertEquals($staf->id, $maintenance->staf_id);

        // 3. Staf sarpras memulai pengerjaan
        $resMulai = $this->actingAs($staf)->post("/admin/maintenance/{$maintenance->id}/status", [
            'status' => 'dalam_pengerjaan',
            'staf_id' => $staf->id,
        ]);
        $resMulai->assertRedirect();
        $maintenance->refresh();
        $this->assertEquals('dalam_pengerjaan', $maintenance->status);
        $this->assertNotNull($maintenance->tanggal_mulai_perbaikan);

        // 4. Staf sarpras menyelesaikan perbaikan
        $resSelesai = $this->actingAs($staf)->post("/admin/maintenance/{$maintenance->id}/status", [
            'status' => 'selesai',
            'staf_id' => $staf->id,
            'biaya_aktual' => 150000,
            'catatan_staf' => 'Pembersihan debu blower dan reset timer lampu, proyektor sudah normal jernih.',
        ]);
        $resSelesai->assertRedirect();

        $maintenance->refresh();
        $this->assertEquals('selesai', $maintenance->status);
        $this->assertEquals(150000, (float) $maintenance->biaya_aktual);
        $this->assertNotNull($maintenance->tanggal_selesai_perbaikan);
        $this->assertStringContainsString('Pembersihan debu blower', $maintenance->catatan_staf);
    }
}
