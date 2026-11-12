<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case KepalaBagian = 'kepala_bagian';
    case Staf = 'staf';
    case StafRuangan = 'staf_ruangan';
    case Mahasiswa = 'mahasiswa';
    case Umum = 'umum';

    /**
     * Human readable label for the role.
     */
    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Admin',
            self::KepalaBagian => 'PIC Ruangan',
            self::Staf => 'Staf Sarpras',
            self::StafRuangan => 'PIC Ruangan',
            self::Mahasiswa => 'Mahasiswa',
            self::Umum => 'Umum',
        };
    }

    /**
     * Role options for select inputs.
     *
     * @return array<int, array{value: string, label: string}>
     */
    public static function options(): array
    {
        return [
            ['value' => self::Admin->value, 'label' => self::Admin->label()],
            ['value' => self::KepalaBagian->value, 'label' => self::KepalaBagian->label()],
            ['value' => self::Staf->value, 'label' => self::Staf->label()],
            ['value' => self::Mahasiswa->value, 'label' => self::Mahasiswa->label()],
            ['value' => self::Umum->value, 'label' => self::Umum->label()],
        ];
    }
}
