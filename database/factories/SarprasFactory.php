<?php

namespace Database\Factories;

use App\Models\Sarpras;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Sarpras>
 */
class SarprasFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'kode' => 'SR-'.fake()->unique()->numerify('#####'),
            'nama' => fake()->words(2, true),
            'jenis' => fake()->randomElement(['sarana', 'prasarana']),
            'kategori' => 'Elektronik & Multimedia',
            'lokasi' => 'Gedung A',
            'stok_total' => 5,
            'stok_tersedia' => 5,
            'satuan' => 'Unit',
            'kondisi_umum' => 'baik',
            'dapat_dipinjam' => true,
            'deskripsi' => fake()->sentence(),
        ];
    }
}
