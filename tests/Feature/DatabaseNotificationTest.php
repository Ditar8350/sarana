<?php

namespace Tests\Feature;

use App\Events\AktivitasSistemEvent;
use App\Events\BeritaPublishedEvent;
use App\Models\News;
use App\Models\User;
use App\Notifications\AktivitasBaruNotification;
use App\Notifications\BeritaBaruNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class DatabaseNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_berita_baru_notification_has_valid_payload(): void
    {
        $news = new News([
            'title' => 'Pengumuman Libur Perkuliahan',
            'slug' => 'pengumuman-libur-perkuliahan',
            'description' => 'Dalam rangka hari libur nasional, operasional biro diliburkan.',
            'author' => 'Admin Sarpras',
            'status' => 'Aktif',
            'date' => '2026-11-04',
        ]);
        $news->id = 999;

        $notif = new BeritaBaruNotification($news);
        $user = new User(['name' => 'Budi', 'role' => 'mahasiswa']);
        $payload = $notif->toArray($user);

        $this->assertEquals('Pengumuman Baru: Pengumuman Libur Perkuliahan', $payload['title']);
        $this->assertEquals('megaphone', $payload['icon']);
        $this->assertEquals('/berita/pengumuman-libur-perkuliahan', $payload['url']);
        $this->assertEquals('berita', $payload['type']);
    }

    public function test_aktivitas_baru_notification_has_valid_payload(): void
    {
        $notif = new AktivitasBaruNotification(
            title: 'Dita Ramdani - Mengajukan Peminjaman Proyektor',
            message: 'Pengajuan #PJ-2026-12345 menunggu validasi Admin.',
            actionUrl: '/admin/peminjaman',
            type: 'peminjaman',
            icon: 'document',
        );

        $admin = new User(['name' => 'Admin Sarpras', 'role' => 'admin']);
        $payload = $notif->toArray($admin);

        $this->assertEquals('Dita Ramdani - Mengajukan Peminjaman Proyektor', $payload['title']);
        $this->assertEquals('/admin/peminjaman', $payload['url']);
        $this->assertEquals('peminjaman', $payload['type']);
        $this->assertEquals('document', $payload['icon']);
    }

    public function test_events_are_registered_to_listeners(): void
    {
        Event::fake([
            BeritaPublishedEvent::class,
            AktivitasSistemEvent::class,
        ]);

        $news = new News([
            'title' => 'Warta Kampus',
            'slug' => 'warta-kampus',
            'description' => 'Info terkini',
            'author' => 'Admin',
            'status' => 'Aktif',
            'date' => '2026-11-04',
        ]);

        event(new BeritaPublishedEvent($news));
        Event::assertDispatched(BeritaPublishedEvent::class);

        $user = new User(['name' => 'Peminjam', 'role' => 'mahasiswa']);
        event(new AktivitasSistemEvent(
            actor: $user,
            jenisAktivitas: 'Mengajukan Peminjaman',
            message: 'Peminjaman item',
            actionUrl: '/admin/peminjaman',
        ));
        Event::assertDispatched(AktivitasSistemEvent::class);
    }

    public function test_user_can_silently_mark_all_notifications_as_read(): void
    {
        $user = User::factory()->create();

        $user->notify(new AktivitasBaruNotification(
            title: 'Notifikasi Uji',
            message: 'Pesan uji notifikasi',
            actionUrl: '/layanan/peminjaman',
            type: 'peminjaman',
            icon: 'document',
        ));

        $this->assertEquals(1, $user->unreadNotifications()->count());

        $response = $this->actingAs($user)->post('/notifications/mark-all-read', [
            'silent' => true,
        ]);

        $response->assertStatus(302);
        $response->assertSessionMissing('success');
        $this->assertEquals(0, $user->fresh()->unreadNotifications()->count());
    }

    public function test_user_can_mark_all_notifications_as_read_with_flash(): void
    {
        $user = User::factory()->create();

        $user->notify(new AktivitasBaruNotification(
            title: 'Notifikasi Uji 2',
            message: 'Pesan uji 2',
            actionUrl: '/layanan/peminjaman',
            type: 'peminjaman',
            icon: 'document',
        ));

        $this->assertEquals(1, $user->unreadNotifications()->count());

        $response = $this->actingAs($user)->post('/notifications/mark-all-read');

        $response->assertStatus(302);
        $response->assertSessionHas('success', 'Semua notifikasi telah ditandai sebagai dibaca.');
        $this->assertEquals(0, $user->fresh()->unreadNotifications()->count());
    }
}
