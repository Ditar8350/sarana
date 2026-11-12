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
        Schema::create('pengadaans', function (Blueprint $table) {
            $table->id();
            $table->string('kode_pengadaan', 50)->unique(); // Misal #BL-2026-001
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade'); // Staf pelapor/pengaju
            $table->string('nama_barang', 255);
            $table->string('kategori', 100); // Elektronik, Meubeler, Alat Tulis, dll
            $table->unsignedInteger('jumlah')->default(1);
            $table->string('satuan', 30)->default('Unit'); // Unit, Set, Pcs, Buah, dll
            $table->decimal('estimasi_harga_satuan', 14, 2)->default(0);
            $table->decimal('total_biaya', 14, 2)->default(0);

            // Lokasi Peletakan Barang Baru
            $table->string('lokasi_penempatan', 255); // Ruang Dosen Lt 2, Lab Multimedia, Kelas B-201, dll
            $table->string('ruangan_tujuan', 100)->nullable();

            // Rincian & Bukti
            $table->string('alasan_pengadaan', 255); // Kebutuhan lab baru, pergantian barang rusak, dll
            $table->text('spesifikasi')->nullable(); // Merek, tipe, spek teknis
            $table->string('nama_toko_vendor')->nullable(); // Nama vendor / link pembelian
            $table->string('foto_bukti_nota')->nullable(); // Bukti nota / foto brosur / kwitansi
            $table->date('tanggal_pembelian')->nullable();

            // Status Persetujuan & Verifikasi Admin
            $table->enum('status', [
                'diajukan',   // Menunggu persetujuan admin
                'disetujui',  // Disetujui & dialokasikan ke sarpras
                'selesai',    // Barang sudah dibeli & diletakkan di lokasi
                'ditolak',    // Ditolak admin
            ])->default('diajukan')->index();

            $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('catatan_admin')->nullable();
            $table->foreignId('sarpras_id')->nullable()->constrained('sarpras')->nullOnDelete(); // Jika sudah dimasukkan otomatis ke katalog sarpras
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pengadaans');
    }
};
