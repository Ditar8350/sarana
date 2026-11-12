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
        // 1. Tambah kolom nama_barang pada peminjaman_items jika belum ada
        if (! Schema::hasColumn('peminjaman_items', 'nama_barang')) {
            Schema::table('peminjaman_items', function (Blueprint $table) {
                $table->string('nama_barang', 255)->nullable()->after('sarpras_id');
            });
        }

        // 2. Isi nama_barang yang masih null dari tabel sarpras
        try {
            DB::table('peminjaman_items')
                ->join('sarpras', 'peminjaman_items.sarpras_id', '=', 'sarpras.id')
                ->whereNull('peminjaman_items.nama_barang')
                ->update([
                    'peminjaman_items.nama_barang' => DB::raw('sarpras.nama'),
                ]);
        } catch (Throwable $e) {
            // Ignore if join fails
        }

        // 3. Ubah foreign key peminjaman_items.sarpras_id agar nullable dan ON DELETE SET NULL
        Schema::table('peminjaman_items', function (Blueprint $table) {
            // Drop foreign key lama
            $table->dropForeign(['sarpras_id']);
        });

        Schema::table('peminjaman_items', function (Blueprint $table) {
            // Ubah sarpras_id menjadi nullable
            $table->unsignedBigInteger('sarpras_id')->nullable()->change();

            // Pasang foreign key baru dengan nullOnDelete
            $table->foreign('sarpras_id')
                ->references('id')
                ->on('sarpras')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('peminjaman_items', function (Blueprint $table) {
            $table->dropForeign(['sarpras_id']);
            $table->unsignedBigInteger('sarpras_id')->nullable(false)->change();
            $table->foreign('sarpras_id')->references('id')->on('sarpras')->onDelete('restrict');

            if (Schema::hasColumn('peminjaman_items', 'nama_barang')) {
                $table->dropColumn('nama_barang');
            }
        });
    }
};
