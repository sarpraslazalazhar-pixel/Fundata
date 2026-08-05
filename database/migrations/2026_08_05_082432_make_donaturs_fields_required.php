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
        Schema::table('donaturs', function (Blueprint $table) {
            $table->string('no_telp')->nullable(false)->change();
            $table->text('alamat')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('donaturs', function (Blueprint $table) {
            $table->string('no_telp')->nullable()->change();
            $table->text('alamat')->nullable()->change();
        });
    }
};
