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
            $table->string('foto_bukti_terima')->nullable()->after('lokasi_pengambilan');
            $table->dateTime('tanggal_terima')->nullable()->after('foto_bukti_terima');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('peminjamans', function (Blueprint $table) {
            $table->dropColumn(['foto_bukti_terima', 'tanggal_terima']);
        });
    }
};
