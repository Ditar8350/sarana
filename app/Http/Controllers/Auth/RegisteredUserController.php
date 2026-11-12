<?php

namespace App\Http\Controllers\Auth;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view (Mahasiswa atau Publik).
     */
    public function create(Request $request): Response
    {
        $type = ($request->is('register/publik') || $request->query('type') === 'publik') ? 'publik' : 'mahasiswa';

        return Inertia::render('Auth/Register', [
            'initialType' => $type,
        ]);
    }

    /**
     * Handle an incoming registration request (Mahasiswa atau Publik).
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $isPublik = $request->input('type') === 'publik';

        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:'.User::class],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ];

        $messages = [];

        if (! $isPublik) {
            $rules['nomor_induk'] = ['required', 'string', 'max:50', 'unique:users,nomor_induk'];
            $messages = [
                'nomor_induk.required' => 'NIM wajib diisi.',
                'nomor_induk.unique' => 'NIM ini sudah terdaftar.',
            ];
        }

        $validated = $request->validate($rules, $messages);

        $user = new User([
            'name' => $validated['name'],
            'nomor_induk' => $isPublik ? null : ($validated['nomor_induk'] ?? null),
            'email' => $validated['email'],
            'password' => $validated['password'],
        ]);
        $user->role = UserRole::Mahasiswa;
        $user->save();

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('dashboard', absolute: false));
    }
}
