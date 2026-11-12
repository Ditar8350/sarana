<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\StorePenggunaRequest;
use App\Http\Requests\UpdatePenggunaRequest;
use App\Models\Sarpras;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PenggunaController extends Controller
{
    /**
     * Display the list of users.
     */
    public function index(): Response
    {
        $users = User::query()
            ->with('ruangan')
            ->orderBy('name')
            ->get()
            ->map(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role->value,
                'role_label' => ($user->role === UserRole::Mahasiswa && empty($user->nomor_induk))
                    ? 'Masyarakat Umum'
                    : $user->role->label(),
                'nomor_induk' => $user->nomor_induk,
                'no_hp' => $user->no_hp,
                'ruangan_id' => $user->ruangan_id,
                'unit_ruangan' => $user->unit_ruangan ?: $user->ruangan?->nama,
                'assigned_rooms' => $user->assignedRuanganList(),
                'created_at' => $user->created_at?->translatedFormat('d M Y'),
            ]);

        $prasaranaItems = Sarpras::where('jenis', 'prasarana')
            ->orderBy('nama')
            ->get(['id', 'nama', 'lokasi']);

        $ruanganMap = [];
        foreach ($prasaranaItems as $item) {
            $key = mb_strtolower(trim($item->nama));
            if ($key !== '' && ! isset($ruanganMap[$key])) {
                $ruanganMap[$key] = [
                    'id' => $item->id,
                    'nama' => trim($item->nama),
                    'lokasi' => $item->lokasi ?: 'Kampus UNUHA',
                ];
            }
        }

        // Tambahkan lokasi unik dari tabel sarpras & unit_ruangan yang sudah terdaftar agar pilihan Admin lengkap
        $extraLocations = Sarpras::query()
            ->whereNotNull('lokasi')
            ->distinct()
            ->pluck('lokasi')
            ->toArray();

        $existingUnitRooms = User::query()
            ->whereNotNull('unit_ruangan')
            ->pluck('unit_ruangan')
            ->flatMap(fn (string $val) => array_map('trim', explode(',', $val)))
            ->filter()
            ->toArray();

        $nextVirtualId = -1;
        foreach (array_merge($extraLocations, $existingUnitRooms) as $roomName) {
            $cleanName = trim((string) $roomName);
            $key = mb_strtolower($cleanName);
            if ($cleanName !== '' && ! isset($ruanganMap[$key])) {
                $ruanganMap[$key] = [
                    'id' => $nextVirtualId--,
                    'nama' => $cleanName,
                    'lokasi' => 'Unit / Ruangan Kampus',
                ];
            }
        }

        $ruanganList = array_values($ruanganMap);

        return Inertia::render('Admin/Pengguna', [
            'users' => $users,
            'roles' => UserRole::options(),
            'ruanganList' => $ruanganList,
        ]);
    }

    /**
     * Store a newly created user.
     */
    public function store(StorePenggunaRequest $request): RedirectResponse
    {
        $user = new User($request->validated());
        $user->email_verified_at = now();
        $user->save();

        return redirect()->back()->with('success', 'Pengguna berhasil ditambahkan.');
    }

    /**
     * Update the given user.
     */
    public function update(UpdatePenggunaRequest $request, User $pengguna): RedirectResponse
    {
        $validated = $request->validated();

        if (blank($validated['password'] ?? null)) {
            unset($validated['password']);
        }

        $pengguna->update($validated);

        return redirect()->back()->with('success', 'Data pengguna berhasil diperbarui.');
    }

    /**
     * Remove the given user.
     */
    public function destroy(Request $request, User $pengguna): RedirectResponse
    {
        if ($pengguna->is($request->user())) {
            return redirect()->back()->with('error', 'Anda tidak dapat menghapus akun Anda sendiri.');
        }

        $pengguna->delete();

        return redirect()->back()->with('success', 'Pengguna berhasil dihapus.');
    }
}
