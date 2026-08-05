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
        Schema::create('payment_methods', function (Blueprint $table) {
            $table->id();
            $table->string('nama_bank');
            $table->string('nomor_rekening')->nullable();
            $table->string('nama_pemilik')->nullable();
            $table->string('logo_qris')->nullable();
            $table->text('instruksi')->nullable();
            $table->enum('kategori', ['transfer_bank', 'e_wallet', 'qris', 'cash'])->default('transfer_bank');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_methods');
    }
};
