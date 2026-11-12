<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password', 'role', 'nomor_induk', 'no_hp', 'ruangan_id', 'unit_ruangan'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Daftar resmi Fakultas, Sekolah Pascasarjana, dan Program Studi Universitas Nurul Huda (UNUHA).
     *
     * @var array<string, list<string>>
     */
    public const FAKULTAS_PRODI_UNUHA = [
        'Fakultas Sains dan Teknologi (FST)' => [
            'S1 Informatika',
            'S1 Matematika',
            'S1 Sains Pertanian',
            'S1 Peternakan',
        ],
        'Fakultas Ilmu Pendidikan (FIP)' => [
            'S1 Pendidikan Bahasa dan Sastra Indonesia',
            'S1 Pendidikan Bahasa Inggris',
            'S1 Pendidikan Ekonomi',
            'S1 Pendidikan Fisika',
            'S1 Pendidikan Teknologi Informasi (PTI)',
            'S1 Pendidikan Kepelatihan Olahraga',
        ],
        'Fakultas Agama Islam (FAI)' => [
            'S1 Pendidikan Agama Islam (PAI)',
            'S1 Pendidikan Guru Madrasah Ibtidaiyah (PGMI)',
            'S1 Pendidikan Bahasa Arab',
        ],
        'Sekolah Pascasarjana' => [
            'S2 Pendidikan Agama Islam',
        ],
    ];

    /**
     * The model's default values for attributes.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'role' => 'mahasiswa',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = [
        'fakultas',
        'prodi',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
        ];
    }

    /**
     * Ruangan/prasarana yang ditugaskan ke staf unit.
     */
    public function ruangan(): BelongsTo
    {
        return $this->belongsTo(Sarpras::class, 'ruangan_id');
    }

    /**
     * Ambil daftar ruangan yang ditentukan oleh Admin untuk Kepala Bagian ini.
     *
     * @return array<int, string>
     */
    public function assignedRuanganList(): array
    {
        $raw = $this->unit_ruangan ?: ($this->ruangan?->nama ?? '');
        if (blank($raw)) {
            return [];
        }

        return array_values(array_unique(array_filter(array_map('trim', explode(',', $raw)))));
    }

    /**
     * Ambil label nama ruangan utama atau gabungan ruangan yang dipegang.
     */
    public function primaryRuanganName(string $fallback = 'Ruangan Unit'): string
    {
        $list = $this->assignedRuanganList();
        if (empty($list)) {
            return $fallback;
        }

        return implode(', ', $list);
    }

    /**
     * Determine whether the user is an administrator.
     */
    public function isAdmin(): bool
    {
        return $this->role === UserRole::Admin;
    }

    /**
     * Determine whether the user is a kepala bagian.
     */
    public function isKepalaBagian(): bool
    {
        return $this->role === UserRole::KepalaBagian || $this->role === UserRole::StafRuangan;
    }

    /**
     * Determine whether the user is a staff member.
     */
    public function isStaf(): bool
    {
        return $this->role === UserRole::Staf;
    }

    /**
     * Determine whether the user is a room/unit staff member.
     */
    public function isStafRuangan(): bool
    {
        return $this->isKepalaBagian();
    }

    /**
     * Determine whether the user is a student.
     */
    public function isMahasiswa(): bool
    {
        return $this->role === UserRole::Mahasiswa;
    }

    /**
     * Urai informasi Fakultas dan Program Studi mahasiswa dari atribut unit_ruangan.
     *
     * @return array{fakultas: ?string, prodi: ?string}
     */
    public function parseFakultasProdi(): array
    {
        if ($this->isKepalaBagian() || $this->isAdmin() || $this->isStaf()) {
            return ['fakultas' => null, 'prodi' => null];
        }

        $raw = trim((string) ($this->unit_ruangan ?? ''));
        if ($raw === '') {
            return ['fakultas' => null, 'prodi' => null];
        }

        // Format standar: "{prodi} - {fakultas}"
        if (str_contains($raw, ' - ')) {
            [$partProdi, $partFakultas] = array_map('trim', explode(' - ', $raw, 2));
            foreach (self::FAKULTAS_PRODI_UNUHA as $fakultasName => $prodiList) {
                if (strcasecmp($partFakultas, $fakultasName) === 0 || in_array($partProdi, $prodiList, true)) {
                    $matchedProdi = in_array($partProdi, $prodiList, true) ? $partProdi : null;

                    return [
                        'fakultas' => $fakultasName,
                        'prodi' => $matchedProdi,
                    ];
                }
            }
        }

        // Jika hanya tersimpan nama Program Studi atau nama Fakultas
        foreach (self::FAKULTAS_PRODI_UNUHA as $fakultasName => $prodiList) {
            if (strcasecmp($raw, $fakultasName) === 0) {
                return ['fakultas' => $fakultasName, 'prodi' => null];
            }
            foreach ($prodiList as $prodiName) {
                if (strcasecmp($raw, $prodiName) === 0) {
                    return ['fakultas' => $fakultasName, 'prodi' => $prodiName];
                }
            }
        }

        return ['fakultas' => null, 'prodi' => null];
    }

    /**
     * Accessor fakultas mahasiswa.
     */
    public function getFakultasAttribute(): ?string
    {
        return $this->parseFakultasProdi()['fakultas'];
    }

    /**
     * Accessor program studi mahasiswa.
     */
    public function getProdiAttribute(): ?string
    {
        return $this->parseFakultasProdi()['prodi'];
    }
}
