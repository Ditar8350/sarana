<?php

namespace App\Notifications;

use App\Models\News;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

class BeritaBaruNotification extends Notification
{
    use Queueable;

    public function __construct(public News $berita) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $excerpt = $this->berita->excerpt ?: Str::limit(strip_tags($this->berita->description ?? ''), 95);

        return [
            'title' => "Pengumuman Baru: {$this->berita->title}",
            'message' => $excerpt,
            'icon' => 'megaphone',
            'url' => "/berita/{$this->berita->slug}",
            'type' => 'berita',
            'berita_id' => $this->berita->id,
        ];
    }
}
