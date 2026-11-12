<?php

namespace App\Listeners;

use App\Enums\UserRole;
use App\Events\AktivitasSistemEvent;
use App\Models\User;
use App\Notifications\AktivitasBaruNotification;
use Illuminate\Support\Facades\Notification;

class SendAktivitasNotificationListener
{
    /**
     * Handle the event.
     */
    public function handle(AktivitasSistemEvent $event): void
    {
        $targetRoles = $event->targetRoles ?? [UserRole::Admin->value];
        $targetUserIds = array_values(array_filter((array) ($event->targetUserIds ?? [])));

        if (empty($targetRoles) && empty($targetUserIds)) {
            return;
        }

        $recipients = User::query()
            ->where(function ($query) use ($targetRoles, $targetUserIds): void {
                if (! empty($targetRoles)) {
                    $query->whereIn('role', $targetRoles);
                }
                if (! empty($targetUserIds)) {
                    $query->orWhereIn('id', $targetUserIds);
                }
            })
            ->when($event->actor->exists, fn ($q) => $q->where('id', '!=', $event->actor->id))
            ->get()
            ->unique('id');

        if ($recipients->isNotEmpty()) {
            $title = "{$event->actor->name} - {$event->jenisAktivitas}";

            Notification::send($recipients, new AktivitasBaruNotification(
                title: $title,
                message: $event->message,
                actionUrl: $event->actionUrl,
                type: $event->type,
                icon: $event->icon,
            ));
        }
    }
}
