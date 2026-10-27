<?php

namespace App\Http\Middleware;

use App\Models\Contact;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'contact' => function () {
                return Cache::rememberForever('global_contact', function () {
                    $contact = Contact::first();
                    return $contact ? [
                        'address' => $contact->address,
                        'email' => $contact->email,
                        'phone' => $contact->phone,
                    ] : null;
                });
            },
        ];
    }
}
