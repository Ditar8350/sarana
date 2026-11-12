<?php

namespace App\Providers;

use App\Events\AktivitasSistemEvent;
use App\Events\BeritaPublishedEvent;
use App\Listeners\SendAktivitasNotificationListener;
use App\Listeners\SendBeritaNotificationListener;
use App\Models\User;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        Gate::define('manage-users', fn (User $user): bool => $user->isAdmin());

        Event::listen(BeritaPublishedEvent::class, SendBeritaNotificationListener::class);
        Event::listen(AktivitasSistemEvent::class, SendAktivitasNotificationListener::class);
    }
}
