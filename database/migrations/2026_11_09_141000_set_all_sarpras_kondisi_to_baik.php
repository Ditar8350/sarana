<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        try {
            DB::table('sarpras')->where('kondisi_umum', '!=', 'baik')->update([
                'kondisi_umum' => 'baik',
            ]);
        } catch (Throwable $e) {
            // Ignore if fails
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No reverse needed
    }
};
