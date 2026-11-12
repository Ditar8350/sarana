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
        Schema::table('maintenance_laporans', function (Blueprint $table) {
            if (! Schema::hasColumn('maintenance_laporans', 'staf_id')) {
                $table->foreignId('staf_id')->nullable()->after('admin_id')->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('maintenance_laporans', 'catatan_staf')) {
                $table->text('catatan_staf')->nullable()->after('catatan_admin');
            }
            if (! Schema::hasColumn('maintenance_laporans', 'biaya_aktual')) {
                $table->decimal('biaya_aktual', 12, 2)->nullable()->after('estimasi_biaya');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('maintenance_laporans', function (Blueprint $table) {
            if (Schema::hasColumn('maintenance_laporans', 'staf_id')) {
                $table->dropForeign(['staf_id']);
                $table->dropColumn('staf_id');
            }
            if (Schema::hasColumn('maintenance_laporans', 'catatan_staf')) {
                $table->dropColumn('catatan_staf');
            }
            if (Schema::hasColumn('maintenance_laporans', 'biaya_aktual')) {
                $table->dropColumn('biaya_aktual');
            }
        });
    }
};
