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
        Schema::table('akads', function (Blueprint $table) {
            $table->decimal('target_dana', 15, 2)->nullable()->after('is_campaign_required');
            $table->boolean('is_show_on_dashboard')->default(false)->after('target_dana');
        });

        Schema::table('tickets', function (Blueprint $table) {
            $table->foreignId('akad_id')->nullable()->constrained('akads')->nullOnDelete()->after('campaign_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropForeign(['akad_id']);
            $table->dropColumn('akad_id');
        });

        Schema::table('akads', function (Blueprint $table) {
            $table->dropColumn(['target_dana', 'is_show_on_dashboard']);
        });
    }
};
