<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\PengecekanRuangan;
use App\Models\Sarpras;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PenggunaManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_user_list(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->staf()->create();

        $this->actingAs($admin)
            ->get('/admin/pengguna')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Pengguna')
                ->has('users', 2)
                ->has('roles', 4)
            );
    }

    public function test_non_admin_cannot_access_user_management(): void
    {
        $staf = User::factory()->staf()->create();
        $target = User::factory()->create();

        $this->actingAs($staf)->get('/admin/pengguna')->assertForbidden();
        $this->actingAs($staf)->post('/admin/pengguna', [])->assertForbidden();
        $this->actingAs($staf)->delete("/admin/pengguna/{$target->id}")->assertForbidden();

        $this->assertModelExists($target);
    }

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/admin/pengguna')->assertRedirect('/login');
    }

    public function test_admin_can_create_user_with_each_role(): void
    {
        $admin = User::factory()->admin()->create();

        foreach (UserRole::cases() as $index => $role) {
            $this->actingAs($admin)
                ->post('/admin/pengguna', [
                    'name' => "Pengguna {$index}",
                    'email' => "pengguna{$index}@unuha.ac.id",
                    'role' => $role->value,
                    'nomor_induk' => "NI-{$index}",
                    'unit_ruangan' => in_array($role, [UserRole::KepalaBagian, UserRole::StafRuangan], true)
                        ? 'Ruang Rapat Senat, Lab Komputer 1'
                        : null,
                    'password' => 'RahasiaKuat123',
                    'password_confirmation' => 'RahasiaKuat123',
                ])
                ->assertRedirect()
                ->assertSessionHasNoErrors();

            $user = User::where('email', "pengguna{$index}@unuha.ac.id")->firstOrFail();
            $this->assertSame($role, $user->role);
            $this->assertTrue(Hash::check('RahasiaKuat123', $user->password));
            $this->assertNotNull($user->email_verified_at);
        }
    }

    public function test_create_user_validates_input(): void
    {
        $admin = User::factory()->admin()->create();
        $existing = User::factory()->create(['nomor_induk' => '12345']);

        $this->actingAs($admin)
            ->post('/admin/pengguna', [
                'name' => '',
                'email' => $existing->email,
                'role' => 'superuser',
                'nomor_induk' => '12345',
                'password' => 'RahasiaKuat123',
                'password_confirmation' => 'berbeda',
            ])
            ->assertSessionHasErrors(['name', 'email', 'role', 'nomor_induk', 'password']);

        $this->assertDatabaseCount('users', 2);
    }

    public function test_admin_can_update_user_without_changing_password(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();
        $originalPassword = $user->password;

        $this->actingAs($admin)
            ->put("/admin/pengguna/{$user->id}", [
                'name' => 'Nama Baru',
                'email' => $user->email,
                'role' => UserRole::KepalaBagian->value,
                'unit_ruangan' => 'Lab Komputer 1, Lab Komputer 2',
                'nomor_induk' => '',
                'password' => '',
                'password_confirmation' => '',
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $user->refresh();
        $this->assertSame('Nama Baru', $user->name);
        $this->assertSame(UserRole::KepalaBagian, $user->role);
        $this->assertSame(['Lab Komputer 1', 'Lab Komputer 2'], $user->assignedRuanganList());
        $this->assertSame($originalPassword, $user->password);
    }

    public function test_kepala_bagian_can_only_upload_inventaris_to_admin_assigned_rooms(): void
    {
        $kepala = User::factory()->create([
            'role' => UserRole::KepalaBagian,
            'unit_ruangan' => 'Lab Komputer 1, Lab Komputer 2',
        ]);

        // Gagal jika mencoba memilih ruangan di luar penetapan Admin
        $this->actingAs($kepala)
            ->post('/staf-ruangan/inventaris', [
                'nama' => 'Proyektor Baru',
                'jumlah' => 2,
                'kondisi_umum' => 'Baik',
                'lokasi' => 'Aula Utama Gedung B',
            ])
            ->assertSessionHasErrors('lokasi');

        // Berhasil jika memilih salah satu ruangan yang ditentukan Admin
        $this->actingAs($kepala)
            ->post('/staf-ruangan/inventaris', [
                'nama' => 'Proyektor Baru',
                'jumlah' => 2,
                'kondisi_umum' => 'Baik',
                'lokasi' => 'Lab Komputer 2',
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('sarpras', [
            'nama' => 'Proyektor Baru',
            'lokasi' => 'Lab Komputer 2',
            'stok_total' => 2,
        ]);

        $sarpras = Sarpras::where('nama', 'Proyektor Baru')->firstOrFail();

        // Kepala bagian dapat mengedit inventaris dengan rincian jumlah per kondisi (misal total 13: Baik 10, Sedang 2, Rusak 1)
        $this->actingAs($kepala)
            ->post("/staf-ruangan/inventaris/{$sarpras->id}", [
                'nama' => 'Proyektor Epson EB-X500',
                'jumlah_baik' => 10,
                'jumlah_sedang' => 2,
                'jumlah_rusak' => 1,
                'lokasi' => 'Lab Komputer 1',
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseHas('sarpras', [
            'id' => $sarpras->id,
            'nama' => 'Proyektor Epson EB-X500',
            'lokasi' => 'Lab Komputer 1',
            'stok_total' => 13,
            'deskripsi' => 'Rincian Kondisi: Baik: 10, Sedang: 2, Rusak: 1',
        ]);

        $this->assertSame(
            ['baik' => 10, 'sedang' => 2, 'rusak' => 1],
            $sarpras->refresh()->getRincianKondisi()
        );

        // Sebelum dikirim ke Admin & diverifikasi, inventaris belum bisa diajukan perbaikan
        $this->actingAs($kepala)
            ->post('/staf-ruangan/maintenance', [
                'sarpras_id' => $sarpras->id,
                'tingkat_urgensi' => 'sedang',
                'alasan_maintenance' => 'Lampu proyektor berkedip dan redup saat dinyalakan.',
            ])
            ->assertSessionHasErrors('sarpras_id');

        // Kepala bagian mengirim laporan inventaris ke Admin
        $this->actingAs($kepala)
            ->post('/staf-ruangan/pengecekan', [
                'nama_ruangan' => 'Lab Komputer 1',
                'tanggal_pengecekan' => now()->toDateString(),
                'kondisi_kebersihan' => 'bersih',
                'kondisi_sarpras' => 'ada_kerusakan',
                'catatan_pemeriksaan' => 'Laporan inventaris Lab Komputer 1',
                'items_checked' => [
                    [
                        'id' => $sarpras->id,
                        'nama' => $sarpras->nama,
                        'kondisi' => 'Sedang',
                        'catatan' => 'Jumlah: 5 Unit | Lokasi: Lab Komputer 1',
                    ],
                ],
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $laporan = PengecekanRuangan::where('user_id', $kepala->id)->latest('id')->firstOrFail();

        // Saat masih menunggu verifikasi Admin, tetap belum bisa diajukan perbaikan
        $this->actingAs($kepala)
            ->post('/staf-ruangan/maintenance', [
                'sarpras_id' => $sarpras->id,
                'tingkat_urgensi' => 'sedang',
                'alasan_maintenance' => 'Lampu proyektor berkedip dan redup saat dinyalakan.',
            ])
            ->assertSessionHasErrors('sarpras_id');

        // Admin memverifikasi laporan inventaris Kepala Bagian
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin)
            ->post("/admin/pengecekan-ruangan/{$laporan->id}/verifikasi", [
                'status_tinjauan' => 'diverifikasi_admin',
                'catatan_admin' => 'Inventaris telah diverifikasi oleh Admin.',
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        // Setelah diverifikasi Admin, Kepala bagian dapat mengajukan servis untuk inventaris di ruangannya
        $this->actingAs($kepala)
            ->post('/staf-ruangan/maintenance', [
                'sarpras_id' => $sarpras->id,
                'tingkat_urgensi' => 'sedang',
                'alasan_maintenance' => 'Lampu proyektor berkedip dan redup saat dinyalakan.',
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseHas('maintenance_laporans', [
            'user_id' => $kepala->id,
            'sarpras_id' => $sarpras->id,
            'nama_sarpras' => 'Proyektor Epson EB-X500',
            'lokasi_ruang' => 'Lab Komputer 1',
        ]);

        // Kepala bagian lain yang berbeda ruangan tidak berhak mengajukan servis / menghapus inventaris ini
        $kepalaLain = User::factory()->create([
            'role' => UserRole::KepalaBagian,
            'unit_ruangan' => 'Ruang Rapat Rektorat',
        ]);

        $this->actingAs($kepalaLain)
            ->post('/staf-ruangan/maintenance', [
                'sarpras_id' => $sarpras->id,
                'tingkat_urgensi' => 'tinggi',
                'alasan_maintenance' => 'Mencoba ajukan perbaikan inventaris ruangan orang lain.',
            ])
            ->assertForbidden();

        // Kepala bagian pemilik ruangan dapat menghapus inventaris
        $this->actingAs($kepala)
            ->delete("/staf-ruangan/inventaris/{$sarpras->id}")
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('sarpras', [
            'id' => $sarpras->id,
        ]);
    }

    public function test_admin_cannot_change_own_role(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->put("/admin/pengguna/{$admin->id}", [
                'name' => $admin->name,
                'email' => $admin->email,
                'role' => UserRole::Mahasiswa->value,
            ])
            ->assertSessionHasErrors('role');

        $this->assertSame(UserRole::Admin, $admin->refresh()->role);
    }

    public function test_admin_can_delete_other_user_but_not_self(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $this->actingAs($admin)
            ->delete("/admin/pengguna/{$user->id}")
            ->assertRedirect()
            ->assertSessionHas('success');
        $this->assertModelMissing($user);

        $this->actingAs($admin)
            ->delete("/admin/pengguna/{$admin->id}")
            ->assertRedirect()
            ->assertSessionHas('error');
        $this->assertModelExists($admin);
    }
}
