<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$tables = [
    'units',
    'sub_units',
    'form_fields',
    'campaigns',
    'org_divisis',
    'org_unit_organisasis',
    'org_jabatans',
    'admins',
    'users',
    'roles',
    'permissions',
    'model_has_roles',
    'role_has_permissions',
    'system_configs',
    'sla_configs',
    'reminder_configs',
];

$sql = "";

foreach ($tables as $table) {
    if (!DB::getSchemaBuilder()->hasTable($table)) {
        continue;
    }
    
    $rows = DB::table($table)->get();
    
    // We want to delete old records first when importing
    $sql .= "DELETE FROM `$table`;\n";
    
    if ($rows->count() > 0) {
        foreach ($rows as $row) {
            $rowArr = (array) $row;
            $columns = array_keys($rowArr);
            $values = array_values($rowArr);
            
            $escapedColumns = array_map(function($col) { return "`$col`"; }, $columns);
            $escapedValues = array_map(function($val) {
                if ($val === null) return "NULL";
                // Escape quotes and backslashes
                $escaped = str_replace(['\\', "'", "\n", "\r"], ['\\\\', "''", "\\n", "\\r"], $val);
                return "'$escaped'";
            }, $values);
            
            $sql .= "INSERT INTO `$table` (" . implode(', ', $escapedColumns) . ") VALUES (" . implode(', ', $escapedValues) . ");\n";
        }
    }
    $sql .= "\n";
}

file_put_contents(__DIR__ . '/database_baru.sql', $sql);
echo "Berhasil mengekstrak data ke database_baru.sql\n";
