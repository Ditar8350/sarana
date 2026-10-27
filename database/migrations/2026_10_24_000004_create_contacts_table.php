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
        Schema::create('contacts', function (Blueprint $table) {
            $table->id();
            $table->text('address');
            $table->string('email');
            $table->string('phone');
            $table->timestamps();
        });

        DB::table('contacts')->insert([
            'address' => 'Gedung Rektorat Lt. 1, Kampus A & B, Jl. Kota Baru Desa Sukaraja, Kec. Buay Madang, Kab. OKU Timur, Sumatera Selatan 32312',
            'email' => 'sarpras@unuha.ac.id',
            'phone' => '0821-8466-0898',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contacts');
    }
};
