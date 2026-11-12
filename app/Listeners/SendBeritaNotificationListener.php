<?php

namespace App\Listeners;

use App\Enums\UserRole;
use App\Events\BeritaPublishedEvent;
use App\Models\User;
use App\Notifications\BeritaBaruNotification;
use Illuminate\Support\Facades\Notification;

class SendBeritaNotificationListener
{
    /**
     * Handle the event.
     */
    public function handle(BeritaPublishedEvent $event): void
    {
        // Penerima: Kirim notifikasi ini secara massal ke semua pengguna
        // yang memiliki role mahasiswa, umum, dan kepala_bagian / staf_ruangan
        $targetRoles = [
            UserRole::Mahasiswa->value,
            UserRole::KepalaBagian->value,
            UserRole::StafRuangan->value,
            'umum',
        ];

        User::query()
            ->where(function ($query) use ($targetRoles) {
                $query->whereIn('role', $targetRoles)
                    ->orWhereNull('role');
            })
            ->chunkById(100, function ($users) use ($event) {
                Notification::send($users, new BeritaBaruNotification($event->berita));
            });
    }
}
