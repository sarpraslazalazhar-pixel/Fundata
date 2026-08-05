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
        Schema::create('akads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->nullable()->constrained('akads')->nullOnDelete();
            $table->string('nama_akad');
            $table->boolean('is_campaign_required')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('akads');
    }
};
