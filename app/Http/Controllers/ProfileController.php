<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->nomor_induk = $validated['nomor_induk'];
        $user->no_hp = $validated['no_hp'];

        if (! $user->isKepalaBagian() && ! $user->isAdmin() && ! $user->isStaf()) {
            if ($request->hasAny(['fakultas', 'prodi'])) {
                $fakultas = trim((string) ($validated['fakultas'] ?? ''));
                $prodi = trim((string) ($validated['prodi'] ?? ''));

                if ($fakultas !== '' && $prodi !== '') {
                    $user->unit_ruangan = "{$prodi} - {$fakultas}";
                } elseif ($fakultas === '' && $prodi === '') {
                    $user->unit_ruangan = null;
                }
            }
        }

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        return Redirect::route('profile.edit')->with('success', 'Biodata dan informasi profil Anda berhasil diperbarui.');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
