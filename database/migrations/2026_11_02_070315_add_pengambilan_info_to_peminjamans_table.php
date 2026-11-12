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
        Schema::table('peminjamans', function (Blueprint $table) {
            $table->string('petugas_pengambilan', 255)->nullable()->after('catatan_admin');
            $table->string('lokasi_pengambilan', 255)->nullable()->after('petugas_pengambilan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('peminjamans', function (Blueprint $table) {
            $table->dropColumn(['petugas_pengambilan', 'lokasi_pengambilan']);
        });
    }
};
