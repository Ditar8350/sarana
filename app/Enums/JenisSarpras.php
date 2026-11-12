<?php

namespace App\Enums;

enum JenisSarpras: string
{
    case Sarana = 'sarana';
    case Prasarana = 'prasarana';

    /**
     * Human readable label for the type.
     */
    public function label(): string
    {
        return match ($this) {
            self::Sarana => 'Sarana (Barang/Peralatan)',
            self::Prasarana => 'Prasarana (Ruangan/Gedung)',
        };
    }

    /**
     * Options for select inputs.
     *
     * @return array<int, array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $jenis): array => ['value' => $jenis->value, 'label' => $jenis->label()],
            self::cases(),
        );
    }
}
