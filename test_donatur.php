<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$r = App\Models\Record::latest()->first();
echo "Before: " . $r->donatur_id . "\n";
$r->donatur_id = 1;
try {
    $r->save();
    echo "After: " . $r->donatur_id . "\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
