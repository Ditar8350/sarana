<?php

use App\Enums\KategoriSarpras;
use App\Models\Sarpras;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Perbarui semua record sarpras yang ada dengan kategori yang akurat
        $items = Sarpras::all();
        foreach ($items as $item) {
            $guessed = KategoriSarpras::guessCategory($item->nama, $item->jenis);
            $item->update(['kategori' => $guessed]);
        }

        // 2. Tambahkan / pastikan item contoh sarana kategori IT & Informatika tersedia
        $itItems = [
            [
                'kode' => 'SR-IT-001',
                'nama' => 'Komputer PC Desktop All-in-One Core i5',
                'jenis' => 'sarana',
                'kategori' => KategoriSarpras::SARANA_IT_INFORMATIKA,
                'lokasi' => 'Laboratorium Komputer & Jaringan Gedung C',
                'stok_total' => 15,
                'stok_tersedia' => 15,
                'satuan' => 'Unit',
                'kondisi_umum' => 'baik',
                'dapat_dipinjam' => true,
                'deskripsi' => 'Spesifikasi: Intel Core i5, RAM 16GB, SSD 512GB, Monitor 23.8 inch FHD, Keyboard + Mouse.',
            ],
            [
                'kode' => 'SR-IT-002',
                'nama' => 'Laptop Lenovo ThinkPad L14 Core i7',
                'jenis' => 'sarana',
                'kategori' => KategoriSarpras::SARANA_IT_INFORMATIKA,
                'lokasi' => 'Gudang Sarpras Kampus B Sukaraja',
                'stok_total' => 6,
                'stok_tersedia' => 6,
                'satuan' => 'Unit',
                'kondisi_umum' => 'baik',
                'dapat_dipinjam' => true,
                'deskripsi' => 'Lengkap dengan charger original dan tas laptop ThinkPad.',
            ],
            [
                'kode' => 'SR-IT-003',
                'nama' => 'Monitor LED 24 Inch Samsung IPS Full HD',
                'jenis' => 'sarana',
                'kategori' => KategoriSarpras::SARANA_IT_INFORMATIKA,
                'lokasi' => 'Gudang Sarpras Kampus A',
                'stok_total' => 8,
                'stok_tersedia' => 8,
                'satuan' => 'Unit',
                'kondisi_umum' => 'baik',
                'dapat_dipinjam' => true,
                'deskripsi' => 'Termasuk kabel power dan kabel HDMI High Speed.',
            ],
            [
                'kode' => 'SR-IT-004',
                'nama' => 'Printer Epson EcoTank L3210 All-in-One',
                'jenis' => 'sarana',
                'kategori' => KategoriSarpras::SARANA_IT_INFORMATIKA,
                'lokasi' => 'Ruang Humas & Sarpras',
                'stok_total' => 3,
                'stok_tersedia' => 3,
                'satuan' => 'Unit',
                'kondisi_umum' => 'baik',
                'dapat_dipinjam' => true,
                'deskripsi' => 'Fungsi Print, Scan, dan Copy warna.',
            ],
        ];

        foreach ($itItems as $data) {
            Sarpras::firstOrCreate(['kode' => $data['kode']], $data);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
