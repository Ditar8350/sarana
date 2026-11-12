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
        // 1. Tambah no_hp pada users
        if (! Schema::hasColumn('users', 'no_hp')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('no_hp', 25)->nullable()->after('email');
            });
        }

        // 2. Tambah pendamping_staf_id & no_hp_pendamping pada peminjamans
        Schema::table('peminjamans', function (Blueprint $table) {
            if (! Schema::hasColumn('peminjamans', 'pendamping_staf_id')) {
                $table->foreignId('pendamping_staf_id')->nullable()->after('petugas_pengambilan')->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('peminjamans', 'no_hp_pendamping')) {
                $table->string('no_hp_pendamping', 25)->nullable()->after('pendamping_staf_id');
            }
        });

        // 3. Tambah kolom denda & bukti pembayaran pada pengembalians
        Schema::table('pengembalians', function (Blueprint $table) {
            if (! Schema::hasColumn('pengembalians', 'nomor_rekening')) {
                $table->string('nomor_rekening', 255)->nullable()->after('biaya_denda');
            }
            if (! Schema::hasColumn('pengembalians', 'status_pembayaran_denda')) {
                $table->string('status_pembayaran_denda', 40)->default('tidak_ada_denda')->after('nomor_rekening');
            }
            if (! Schema::hasColumn('pengembalians', 'bukti_bayar_denda')) {
                $table->string('bukti_bayar_denda', 255)->nullable()->after('status_pembayaran_denda');
            }
            if (! Schema::hasColumn('pengembalians', 'catatan_bayar_denda')) {
                $table->text('catatan_bayar_denda')->nullable()->after('bukti_bayar_denda');
            }
            if (! Schema::hasColumn('pengembalians', 'diverifikasi_denda_oleh')) {
                $table->foreignId('diverifikasi_denda_oleh')->nullable()->after('catatan_bayar_denda')->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('pengembalians', 'diverifikasi_denda_pada')) {
                $table->timestamp('diverifikasi_denda_pada')->nullable()->after('diverifikasi_denda_oleh');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'no_hp')) {
                $table->dropColumn('no_hp');
            }
        });

        Schema::table('peminjamans', function (Blueprint $table) {
            if (Schema::hasColumn('peminjamans', 'pendamping_staf_id')) {
                $table->dropForeign(['pendamping_staf_id']);
                $table->dropColumn(['pendamping_staf_id', 'no_hp_pendamping']);
            }
        });

        Schema::table('pengembalians', function (Blueprint $table) {
            if (Schema::hasColumn('pengembalians', 'diverifikasi_denda_oleh')) {
                $table->dropForeign(['diverifikasi_denda_oleh']);
            }
            $table->dropColumn([
                'nomor_rekening',
                'status_pembayaran_denda',
                'bukti_bayar_denda',
                'catatan_bayar_denda',
                'diverifikasi_denda_oleh',
                'diverifikasi_denda_pada',
            ]);
        });
    }
};
