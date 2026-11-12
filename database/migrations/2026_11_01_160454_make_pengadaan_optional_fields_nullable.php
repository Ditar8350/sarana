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
        Schema::table('pengadaans', function (Blueprint $table) {
            $table->string('alasan_pengadaan', 255)->nullable()->default(null)->change();
            $table->string('nama_toko_vendor', 255)->nullable()->default(null)->change();
            $table->text('spesifikasi')->nullable()->default(null)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pengadaans', function (Blueprint $table) {
            $table->string('alasan_pengadaan', 255)->nullable(false)->change();
        });
    }
};
