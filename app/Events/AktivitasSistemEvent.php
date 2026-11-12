<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AktivitasSistemEvent
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param  array<int, string>|null  $targetRoles
     * @param  array<int, int>|int|null  $targetUserIds
     */
    public function __construct(
        public User $actor,
        public string $jenisAktivitas,
        public string $message,
        public string $actionUrl,
        public string $type = 'aktivitas',
        public string $icon = 'alert', // 'alert' | 'document' | 'megaphone'
        public ?array $targetRoles = null,
        public array|int|null $targetUserIds = null,
    ) {}
}
