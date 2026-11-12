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
        // 1. Master Sarana & Prasarana
        Schema::create('sarpras', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 50)->unique();
            $table->string('nama', 255);
            $table->string('jenis', 30)->default('sarana')->index(); // sarana, prasarana
            $table->string('kategori', 100);
            $table->string('lokasi', 255);
            $table->unsignedInteger('stok_total')->default(1);
            $table->unsignedInteger('stok_tersedia')->default(1);
            $table->string('satuan', 30)->default('Unit');
            $table->string('kondisi_umum', 30)->default('baik'); // baik, rusak_ringan, rusak_berat
            $table->boolean('dapat_dipinjam')->default(true)->index();
            $table->text('deskripsi')->nullable();
            $table->string('foto_url')->nullable();
            $table->timestamps();
        });

        // 2. Transaksi Peminjaman Induk
        Schema::create('peminjamans', function (Blueprint $table) {
            $table->id();
            $table->string('kode_transaksi', 50)->unique();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('nama_peminjam');
            $table->string('nim_nip', 50);
            $table->string('instansi_prodi', 100);
            $table->string('no_whatsapp', 20);
            $table->string('file_ktm');
            $table->string('file_surat_pengantar')->nullable();
            $table->text('keperluan');
            $table->dateTime('tanggal_mulai');
            $table->dateTime('tanggal_kembali_rencana');
            $table->dateTime('tanggal_kembali_aktual')->nullable();
            $table->string('status', 40)->default('menunggu_validasi')->index();
            $table->text('catatan_admin')->nullable();
            $table->foreignId('validated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('validated_at')->nullable();
            $table->timestamps();
        });

        // 3. Item Sarpras yang Dipinjam
        Schema::create('peminjaman_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('peminjaman_id')->constrained('peminjamans')->onDelete('cascade');
            $table->foreignId('sarpras_id')->constrained('sarpras')->onDelete('restrict');
            $table->unsignedInteger('qty')->default(1);
            $table->string('kondisi_sebelum', 30)->default('baik');
            $table->string('kondisi_sesudah', 30)->nullable();
            $table->text('catatan_kondisi')->nullable();
            $table->timestamps();
        });

        // 4. Data Pengembalian & Bukti
        Schema::create('pengembalians', function (Blueprint $table) {
            $table->id();
            $table->string('kode_pengembalian', 50)->unique();
            $table->foreignId('peminjaman_id')->unique()->constrained('peminjamans')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users');
            $table->dateTime('tanggal_pengajuan_kembali');
            $table->string('foto_bukti_kembali')->nullable();
            $table->text('catatan_mahasiswa')->nullable();
            $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('tanggal_diterima')->nullable();
            $table->string('status_verifikasi', 40)->default('menunggu_inspeksi');
            $table->decimal('biaya_denda', 12, 2)->default(0);
            $table->text('catatan_inspeksi_admin')->nullable();
            $table->timestamps();
        });

        // 5. Audit Trail Log Transaksi
        Schema::create('peminjaman_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('peminjaman_id')->constrained('peminjamans')->onDelete('cascade');
            $table->foreignId('actor_id')->constrained('users');
            $table->string('status_sebelum');
            $table->string('status_sesudah');
            $table->text('keterangan')->nullable();
            $table->timestamps();
        });

        // 6. Audit Trail Mutasi Stok Sarpras
        Schema::create('sarpras_stock_mutations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sarpras_id')->constrained('sarpras')->onDelete('cascade');
            $table->foreignId('peminjaman_id')->nullable()->constrained('peminjamans')->nullOnDelete();
            $table->string('tipe', 20); // keluar, masuk, penyesuaian
            $table->integer('jumlah');
            $table->integer('stok_sebelum');
            $table->integer('stok_sesudah');
            $table->string('keterangan');
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sarpras_stock_mutations');
        Schema::dropIfExists('peminjaman_logs');
        Schema::dropIfExists('pengembalians');
        Schema::dropIfExists('peminjaman_items');
        Schema::dropIfExists('peminjamans');
        Schema::dropIfExists('sarpras');
    }
};
