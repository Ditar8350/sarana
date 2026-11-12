<?php

namespace App\Enums;

enum KondisiSarpras: string
{
    case Baik = 'baik';
    case RusakRingan = 'rusak_ringan';
    case RusakBerat = 'rusak_berat';

    /**
     * Human readable label for the condition.
     */
    public function label(): string
    {
        return match ($this) {
            self::Baik => 'Baik',
            self::RusakRingan => 'Rusak Ringan',
            self::RusakBerat => 'Rusak Berat',
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
            fn (self $kondisi): array => ['value' => $kondisi->value, 'label' => $kondisi->label()],
            self::cases(),
        );
    }
}
