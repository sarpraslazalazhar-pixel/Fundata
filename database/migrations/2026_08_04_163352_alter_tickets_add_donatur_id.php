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
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropColumn('nama_donatur');
            $table->unsignedBigInteger('donatur_id')->nullable()->after('form_data');
            
            $table->foreign('donatur_id')->references('id')->on('donaturs')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropForeign(['donatur_id']);
            $table->dropColumn('donatur_id');
            $table->string('nama_donatur')->nullable()->after('form_data');
        });
    }
};
