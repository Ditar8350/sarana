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
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('ruangan_id')->nullable()->after('nomor_induk')->constrained('sarpras')->nullOnDelete();
            $table->string('unit_ruangan', 255)->nullable()->after('ruangan_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['ruangan_id']);
            $table->dropColumn(['ruangan_id', 'unit_ruangan']);
        });
    }
};
