<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('maintenance_laporans', function (Blueprint $table) {
            $table->id();
            $table->string('kode_tiket', 50)->unique(); // Contoh: #MNT-2026-001
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade'); // Pelapor (Staf / Kepala Bagian Kelas)
            $table->foreignId('sarpras_id')->nullable()->constrained('sarpras')->nullOnDelete(); // Barang/ruang yang rusak (jika ada di katalog)

            // Detail Laporan
            $table->string('nama_sarpras'); // Contoh: AC Split 2PK, Proyektor Kelas 201, dll.
            $table->string('lokasi_ruang'); // Contoh: Ruang Kelas B-204, Lab Komputer Kampus B
            $table->enum('tingkat_urgensi', ['rendah', 'sedang', 'tinggi', 'darurat'])->default('sedang');
            $table->text('deskripsi_kerusakan');
            $table->string('foto_kerusakan')->nullable();

            // Status Pengerjaan Maintenance
            $table->enum('status', [
                'menunggu_tinjauan', // Laporan baru masuk
                'disetujui',         // Disetujui admin untuk dikerjakan
                'dalam_pengerjaan',   // Sedang diperbaiki teknisi
                'selesai',           // Selesai diperbaiki
                'ditolak',           // Ditolak / bukan tanggung jawab sarpras
            ])->default('menunggu_tinjauan')->index();

            // Tindak Lanjut Admin
            $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('nama_teknisi')->nullable(); // Bpk. Joko / Vendor Daikin
            $table->decimal('estimasi_biaya', 12, 2)->default(0);
            $table->text('catatan_admin')->nullable();
            $table->string('foto_perbaikan_selesai')->nullable();
            $table->dateTime('tanggal_mulai_perbaikan')->nullable();
            $table->dateTime('tanggal_selesai_perbaikan')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('maintenance_laporans');
    }
};
