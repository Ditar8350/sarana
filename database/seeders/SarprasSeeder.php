<?php

namespace Database\Seeders;

use App\Enums\KategoriSarpras;
use App\Models\Sarpras;
use Illuminate\Database\Seeder;

class SarprasSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $items = [
            // Kategori IT & Informatika (Komputer, PC, Laptop, Monitor, Printer)
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

            // Kategori Elektronik & Multimedia
            [
                'kode' => 'SR-PRJ-001',
                'nama' => 'Proyektor Epson EB-E500 (HDMI + Remote)',
                'jenis' => 'sarana',
                'kategori' => KategoriSarpras::SARANA_ELEKTRONIK_MULTIMEDIA,
                'lokasi' => 'Gudang Sarpras Kampus B Sukaraja',
                'stok_total' => 5,
                'stok_tersedia' => 5,
                'satuan' => 'Unit',
                'kondisi_umum' => 'baik',
                'dapat_dipinjam' => true,
                'deskripsi' => 'Lengkap dengan tas, kabel VGA, HDMI, dan kabel power.',
            ],
            [
                'kode' => 'SR-SND-002',
                'nama' => 'Sound System Portable + 2 Wireless Mic',
                'jenis' => 'sarana',
                'kategori' => KategoriSarpras::SARANA_ELEKTRONIK_MULTIMEDIA,
                'lokasi' => 'Gedung A Kampus Utama',
                'stok_total' => 3,
                'stok_tersedia' => 3,
                'satuan' => 'Set',
                'kondisi_umum' => 'baik',
                'dapat_dipinjam' => true,
                'deskripsi' => 'Baterai rechargeable, Bluetooth & USB receiver.',
            ],
            [
                'kode' => 'SR-CAM-003',
                'nama' => 'Kamera Sony Alpha A6400 Kit 16-50mm',
                'jenis' => 'sarana',
                'kategori' => KategoriSarpras::SARANA_ELEKTRONIK_MULTIMEDIA,
                'lokasi' => 'Ruang Humas & Sarpras',
                'stok_total' => 2,
                'stok_tersedia' => 2,
                'satuan' => 'Unit',
                'kondisi_umum' => 'baik',
                'dapat_dipinjam' => true,
                'deskripsi' => 'Termasuk strap, 2 baterai cadangan, dan charger kit.',
            ],

            // Kategori Furnitur & Mebel
            [
                'kode' => 'SR-FRN-001',
                'nama' => 'Podium Pidato Kayu Jati Ukir UNUHA',
                'jenis' => 'sarana',
                'kategori' => KategoriSarpras::SARANA_FURNITUR_MEBEL,
                'lokasi' => 'Gudang Logistik Sukaraja',
                'stok_total' => 2,
                'stok_tersedia' => 2,
                'satuan' => 'Unit',
                'kondisi_umum' => 'baik',
                'dapat_dipinjam' => true,
                'deskripsi' => 'Podium upacara resmi universitas dengan dudukan mic ganda.',
            ],

            // Kategori Peralatan & Perkakas
            [
                'kode' => 'SR-TLS-001',
                'nama' => 'Genset Silent Honda EU22i (2000 Watt)',
                'jenis' => 'sarana',
                'kategori' => KategoriSarpras::SARANA_PERALATAN_PERKAKAS,
                'lokasi' => 'Gudang Maintenance Sukaraja',
                'stok_total' => 2,
                'stok_tersedia' => 2,
                'satuan' => 'Unit',
                'kondisi_umum' => 'baik',
                'dapat_dipinjam' => true,
                'deskripsi' => 'Genset portable silent untuk kebutuhan darurat listrik kegiatan luar ruangan.',
            ],

            // Prasarana (Gedung & Ruangan)
            [
                'kode' => 'PR-AUL-001',
                'nama' => 'Aula Utama Gedung B Kampus Sukaraja',
                'jenis' => 'prasarana',
                'kategori' => KategoriSarpras::PRASARANA_AULA_AUDITORIUM,
                'lokasi' => 'Kampus B Sukaraja',
                'stok_total' => 1,
                'stok_tersedia' => 1,
                'satuan' => 'Ruangan',
                'kondisi_umum' => 'baik',
                'dapat_dipinjam' => true,
                'deskripsi' => 'Kapasitas 400 kursi, ber-AC, dan panggung kehormatan.',
            ],
            [
                'kode' => 'PR-SNT-002',
                'nama' => 'Ruang Rapat Senat Gedung Rektorat Lt. 2',
                'jenis' => 'prasarana',
                'kategori' => KategoriSarpras::PRASARANA_GEDUNG_RUANGAN,
                'lokasi' => 'Gedung A Lt. 2 Sukaraja',
                'stok_total' => 1,
                'stok_tersedia' => 1,
                'satuan' => 'Ruangan',
                'kondisi_umum' => 'baik',
                'dapat_dipinjam' => true,
                'deskripsi' => 'Meja bundar rapat, layar proyektor motorized, kapasitas 35 orang.',
            ],
            [
                'kode' => 'PR-LAB-003',
                'nama' => 'Laboratorium Komputer & Jaringan Gedung C',
                'jenis' => 'prasarana',
                'kategori' => KategoriSarpras::PRASARANA_LABORATORIUM,
                'lokasi' => 'Gedung C Lt. 1 Sukaraja',
                'stok_total' => 1,
                'stok_tersedia' => 1,
                'satuan' => 'Ruangan',
                'kondisi_umum' => 'baik',
                'dapat_dipinjam' => true,
                'deskripsi' => 'Ruang lab dengan 30 PC terkoneksi LAN gigabit, proyektor, dan AC.',
            ],
        ];

        foreach ($items as $item) {
            Sarpras::updateOrCreate(['kode' => $item['kode']], $item);
        }
    }
}
