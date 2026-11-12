<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Sarpras;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::firstOrCreate(
            ['email' => 'birosarpras@unuha.ac.id'],
            [
                'name' => 'Admin Sarana & Prasarana',
                'password' => Hash::make('AdminSarpras123'),
                'role' => UserRole::Admin,
                'nomor_induk' => 'ADM-2026-001',
            ]
        );

        User::firstOrCreate(
            ['email' => 'kepala@unuha.ac.id'],
            [
                'name' => 'Dr. H. Ahmad Fauzi, M.Pd (Kepala Bagian)',
                'password' => Hash::make('password'),
                'role' => UserRole::KepalaBagian,
                'nomor_induk' => 'KPB-2026-001',
            ]
        );

        User::firstOrCreate(
            ['email' => 'staf@unuha.ac.id'],
            [
                'name' => 'Haris (Staf Sarpras)',
                'password' => Hash::make('password'),
                'role' => UserRole::Staf,
                'nomor_induk' => 'STF-2026-001',
            ]
        );

        $senat = Sarpras::where('kode', 'PR-SNT-002')->first();
        $aula = Sarpras::where('kode', 'PR-AUL-001')->first();

        User::firstOrCreate(
            ['email' => 'staf.senat@unuha.ac.id'],
            [
                'name' => 'Budi Santoso (PIC Ruang Senat)',
                'password' => Hash::make('password'),
                'role' => UserRole::KepalaBagian,
                'nomor_induk' => 'KPB-2026-002',
                'ruangan_id' => $senat?->id,
                'unit_ruangan' => 'Ruang Rapat Senat Gedung Rektorat Lt. 2',
            ]
        );

        User::firstOrCreate(
            ['email' => 'staf.aula@unuha.ac.id'],
            [
                'name' => 'Siti Rahmawati (PIC Aula Utama)',
                'password' => Hash::make('password'),
                'role' => UserRole::KepalaBagian,
                'nomor_induk' => 'KPB-2026-003',
                'ruangan_id' => $aula?->id,
                'unit_ruangan' => 'Aula Utama Gedung B Kampus Sukaraja',
            ]
        );

        User::firstOrCreate(
            ['email' => 'staf.lab@unuha.ac.id'],
            [
                'name' => 'Dimas Prasetyo (PIC Lab Komputer)',
                'password' => Hash::make('password'),
                'role' => UserRole::KepalaBagian,
                'nomor_induk' => 'KPB-2026-004',
                'unit_ruangan' => 'Laboratorium Komputer & Jaringan Gedung C',
            ]
        );
    }
}
