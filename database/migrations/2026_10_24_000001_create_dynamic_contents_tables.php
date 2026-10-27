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
        Schema::create('hero_sections', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('subtitle');
            $table->string('image')->nullable();
            $table->timestamps();
        });

        Schema::create('sambutans', function (Blueprint $table) {
            $table->id();
            $table->string('photo')->nullable();
            $table->string('judul_kepala_biro')->default('Kepala Biro Sarana & Prasarana');
            $table->string('name');
            $table->string('title');
            $table->text('message')->nullable();
            $table->timestamps();
        });

        Schema::create('news', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('author');
            $table->date('date');
            $table->string('image')->nullable();
            $table->longText('description');
            $table->string('status')->default('Aktif');
            $table->timestamps();
        });

        Schema::create('visi_misis', function (Blueprint $table) {
            $table->id();
            $table->text('visi');
            $table->json('misi');
            $table->timestamps();
        });

        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('category');
            $table->string('file_path');
            $table->string('size')->nullable();
            $table->string('type')->default('pdf');
            $table->date('date')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documents');
        Schema::dropIfExists('visi_misis');
        Schema::dropIfExists('news');
        Schema::dropIfExists('sambutans');
        Schema::dropIfExists('hero_sections');
    }
};
