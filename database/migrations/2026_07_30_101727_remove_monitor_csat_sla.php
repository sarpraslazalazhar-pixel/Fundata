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
        Schema::dropIfExists('csats');
        Schema::dropIfExists('ticket_sla_tracking');
        Schema::dropIfExists('sla_configs');

        if (Schema::hasTable('sub_units')) {
            Schema::table('sub_units', function (Blueprint $table) {
                $columnsToDrop = [];
                
                $monitorCols = [
                    'is_monitored',
                    'monitor_kategori',
                    'monitor_asset_field_id',
                    'monitor_start_field_id',
                    'monitor_end_field_id',
                    'monitor_date_field_id',
                    'monitor_end_date_field_id'
                ];
                
                foreach ($monitorCols as $col) {
                    if (Schema::hasColumn('sub_units', $col)) {
                        $columnsToDrop[] = $col;
                    }
                }

                if (!empty($columnsToDrop)) {
                    $table->dropColumn($columnsToDrop);
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Not reversing
    }
};
