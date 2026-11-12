<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 30)->default('mahasiswa')->after('email')->index();
            $table->string('nomor_induk', 50)->nullable()->unique()->after('role');
        });

        // Pengguna yang sudah ada sebelumnya adalah pengelola sistem, jadikan admin.
        DB::table('users')->update(['role' => 'admin']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['nomor_induk']);
            $table->dropIndex(['role']);
            $table->dropColumn(['role', 'nomor_induk']);
        });
    }
};
