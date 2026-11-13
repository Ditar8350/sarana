<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $user = $this->user();
        $isMahasiswa = $user?->isMahasiswa() || $user?->role === UserRole::Mahasiswa;

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($user?->id),
            ],
            'nomor_induk' => ['required', 'string', 'max:50'],
            'no_hp' => ['required', 'string', 'max:30'],
            'fakultas' => [$isMahasiswa ? 'required' : 'nullable', 'string', 'max:150'],
            'prodi' => [$isMahasiswa ? 'required' : 'nullable', 'string', 'max:150'],
        ];
    }

    /**
     * Custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        $user = $this->user();
        $nomorIndukLabel = $user?->isMahasiswa()
            ? 'NIM'
            : ($user?->role === UserRole::Umum ? 'NIK / Nomor Identitas' : 'NIP.Y');

        return [
            'name.required' => 'Nama lengkap wajib diisi.',
            'email.required' => 'Alamat email wajib diisi.',
            'email.email' => 'Format alamat email tidak valid.',
            'email.unique' => 'Alamat email sudah digunakan oleh pengguna lain.',
            'nomor_induk.required' => "{$nomorIndukLabel} wajib diisi.",
            'no_hp.required' => 'Nomor HP / WhatsApp wajib diisi.',
            'fakultas.required' => 'Fakultas / Pascasarjana wajib dipilih.',
            'prodi.required' => 'Program Studi wajib dipilih.',
            'prodi.required_with' => 'Silakan pilih Program Studi terlebih dahulu setelah memilih Fakultas.',
        ];
    }
}
