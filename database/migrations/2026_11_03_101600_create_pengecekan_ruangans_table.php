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
        Schema::create('pengecekan_ruangans', function (Blueprint $table) {
            $table->id();
            $table->string('kode_pengecekan', 50)->unique();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('ruangan_id')->nullable()->constrained('sarpras')->nullOnDelete();
            $table->string('nama_ruangan', 255);
            $table->date('tanggal_pengecekan');
            $table->enum('kondisi_kebersihan', ['sangat_bersih', 'bersih', 'cukup', 'kotor'])->default('bersih');
            $table->enum('kondisi_sarpras', ['semua_baik', 'ada_kerusakan', 'butuh_penggantian'])->default('semua_baik');
            $table->text('catatan_pemeriksaan');
            $table->string('foto_ruangan')->nullable();
            $table->json('items_checked')->nullable();
            $table->enum('status_tinjauan', ['menunggu_tinjauan', 'diverifikasi_admin', 'ditindaklanjuti'])->default('menunggu_tinjauan')->index();
            $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('catatan_admin')->nullable();
            $table->timestamp('ditinjau_pada')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pengecekan_ruangans');
    }
};
