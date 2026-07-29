<?php
$files = [
    'app/Http/Controllers/CsatController.php',
    'app/Http/Controllers/TvDashboardController.php'
];

foreach ($files as $f) {
    if (!file_exists($f)) continue;
    $c = file_get_contents($f);
    $c = str_replace('Ticket $ticket', 'Record $ticket', $c);
    $c = str_replace('Ticket $record', 'Record $record', $c);
    $c = str_replace('use App\Models\Ticket;', 'use App\Models\Record;', $c);
    file_put_contents($f, $c);
}
echo "Done replacing Ticket to Record in controllers";
