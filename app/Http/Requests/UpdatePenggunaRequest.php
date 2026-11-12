<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdatePenggunaRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('manage-users');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $pengguna = $this->route('pengguna');

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique('users', 'email')->ignore($pengguna)],
            'role' => [
                'required',
                Rule::enum(UserRole::class),
                // Admin tidak boleh menurunkan perannya sendiri agar tidak terkunci dari menu ini.
                Rule::when($pengguna?->is($this->user()), [Rule::in([UserRole::Admin->value])]),
            ],
            'no_hp' => ['required', 'string', 'max:25'],
            'nomor_induk' => [
                'required',
                'string',
                'max:50',
                Rule::unique('users', 'nomor_induk')->ignore($pengguna),
            ],
            'ruangan_id' => ['nullable', 'exists:sarpras,id'],
            'unit_ruangan' => [
                'nullable',
                'required_if:role,kepala_bagian,staf_ruangan',
                'string',
                'max:500',
            ],
            'password' => ['nullable', 'confirmed', Password::defaults()],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama lengkap wajib diisi.',
            'email.required' => 'Alamat email wajib diisi.',
            'role.in' => 'Anda tidak dapat mengubah peran akun Anda sendiri.',
            'no_hp.required' => 'Nomor HP / WhatsApp wajib diisi.',
            'nomor_induk.required' => 'NIP.Y / Nomor identitas wajib diisi.',
            'nomor_induk.unique' => 'NIP.Y / Nomor identitas sudah terdaftar di sistem.',
            'unit_ruangan.required_if' => 'Admin wajib memilih minimal satu ruangan untuk akun PIC Ruangan.',
        ];
    }
}
