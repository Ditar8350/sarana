<?php

namespace App\Enums;

class KategoriSarpras
{
    /**
     * Kategori standar untuk jenis Sarana (Barang / Alat / Fasilitas Fisik)
     */
    public const SARANA_IT_INFORMATIKA = 'IT & Informatika';

    public const SARANA_ELEKTRONIK_MULTIMEDIA = 'Elektronik & Multimedia';

    public const SARANA_FURNITUR_MEBEL = 'Furnitur & Mebel';

    public const SARANA_PERALATAN_PERKAKAS = 'Peralatan & Perkakas';

    public const SARANA_OLAHRAGA_SENI = 'Olahraga & Seni';

    public const SARANA_PERLENGKAPAN_ACARA = 'Perlengkapan Acara & Protokoler';

    public const SARANA_LAINNYA = 'Lainnya';

    /**
     * Kategori standar untuk jenis Prasarana (Gedung / Ruangan / Lahan)
     */
    public const PRASARANA_GEDUNG_RUANGAN = 'Gedung & Ruangan';

    public const PRASARANA_LABORATORIUM = 'Laboratorium';

    public const PRASARANA_AULA_AUDITORIUM = 'Aula & Auditorium';

    public const PRASARANA_FASILITAS_OLAHRAGA = 'Fasilitas Olahraga & Lapangan';

    public const PRASARANA_LAINNYA = 'Lainnya';

    /**
     * Daftar pilihan kategori untuk Sarana
     *
     * @return array<int, string>
     */
    public static function daftarSarana(): array
    {
        return [
            self::SARANA_IT_INFORMATIKA,
            self::SARANA_ELEKTRONIK_MULTIMEDIA,
            self::SARANA_FURNITUR_MEBEL,
            self::SARANA_PERALATAN_PERKAKAS,
            self::SARANA_OLAHRAGA_SENI,
            self::SARANA_PERLENGKAPAN_ACARA,
            self::SARANA_LAINNYA,
        ];
    }

    /**
     * Daftar pilihan kategori untuk Prasarana
     *
     * @return array<int, string>
     */
    public static function daftarPrasarana(): array
    {
        return [
            self::PRASARANA_GEDUNG_RUANGAN,
            self::PRASARANA_LABORATORIUM,
            self::PRASARANA_AULA_AUDITORIUM,
            self::PRASARANA_FASILITAS_OLAHRAGA,
            self::PRASARANA_LAINNYA,
        ];
    }

    /**
     * Tebak / tentukan kategori otomatis berdasarkan nama barang & jenisnya
     */
    public static function guessCategory(string $nama, string $jenis = 'sarana'): string
    {
        $n = strtolower($nama);

        if ($jenis === 'prasarana') {
            if (str_contains($n, 'lab') || str_contains($n, 'laboratorium')) {
                return self::PRASARANA_LABORATORIUM;
            }
            if (str_contains($n, 'aula') || str_contains($n, 'auditorium') || str_contains($n, 'hall')) {
                return self::PRASARANA_AULA_AUDITORIUM;
            }
            if (str_contains($n, 'lapangan') || str_contains($n, 'stadion') || str_contains($n, 'gor')) {
                return self::PRASARANA_FASILITAS_OLAHRAGA;
            }

            return self::PRASARANA_GEDUNG_RUANGAN;
        }

        // IT & Informatika
        if (
            str_contains($n, 'komputer') ||
            str_contains($n, 'pc') ||
            str_contains($n, 'laptop') ||
            str_contains($n, 'notebook') ||
            str_contains($n, 'monitor') ||
            str_contains($n, 'cpu') ||
            str_contains($n, 'printer') ||
            str_contains($n, 'scanner') ||
            str_contains($n, 'mouse') ||
            str_contains($n, 'keyboard') ||
            str_contains($n, 'router') ||
            str_contains($n, 'switch') ||
            str_contains($n, 'server') ||
            str_contains($n, 'harddisk') ||
            str_contains($n, 'flashdisk') ||
            str_contains($n, 'webcam') ||
            str_contains($n, 'ups') ||
            str_contains($n, 'it') ||
            str_contains($n, 'informatika')
        ) {
            return self::SARANA_IT_INFORMATIKA;
        }

        // Elektronik & Multimedia
        if (
            str_contains($n, 'proyektor') ||
            str_contains($n, 'projector') ||
            str_contains($n, 'sound') ||
            str_contains($n, 'speaker') ||
            str_contains($n, 'mic') ||
            str_contains($n, 'audio') ||
            str_contains($n, 'kamera') ||
            str_contains($n, 'cam') ||
            str_contains($n, 'tv') ||
            str_contains($n, 'televisi') ||
            str_contains($n, 'layar') ||
            str_contains($n, 'screen') ||
            str_contains($n, 'mixer') ||
            str_contains($n, 'amplifier') ||
            str_contains($n, 'handycam')
        ) {
            return self::SARANA_ELEKTRONIK_MULTIMEDIA;
        }

        // Furnitur & Mebel
        if (
            str_contains($n, 'meja') ||
            str_contains($n, 'kursi') ||
            str_contains($n, 'lemari') ||
            str_contains($n, 'rak') ||
            str_contains($n, 'podium') ||
            str_contains($n, 'mimbar') ||
            str_contains($n, 'whiteboard') ||
            str_contains($n, 'papan')
        ) {
            return self::SARANA_FURNITUR_MEBEL;
        }

        // Peralatan & Perkakas
        if (
            str_contains($n, 'tangga') ||
            str_contains($n, 'genset') ||
            str_contains($n, 'bor') ||
            str_contains($n, 'kabel rol') ||
            str_contains($n, 'stopkontak') ||
            str_contains($n, 'perkakas') ||
            str_contains($n, 'toolkit') ||
            str_contains($n, 'pompa')
        ) {
            return self::SARANA_PERALATAN_PERKAKAS;
        }

        // Olahraga & Seni
        if (
            str_contains($n, 'matras') ||
            str_contains($n, 'bola') ||
            str_contains($n, 'raket') ||
            str_contains($n, 'net') ||
            str_contains($n, 'tenda') ||
            str_contains($n, 'olahraga') ||
            str_contains($n, 'gitar') ||
            str_contains($n, 'seni')
        ) {
            return self::SARANA_OLAHRAGA_SENI;
        }

        return self::SARANA_LAINNYA;
    }
}
