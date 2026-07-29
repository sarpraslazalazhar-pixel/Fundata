<?php
$dir = 'app/Notifications';
$files = glob($dir . '/*.php');

foreach ($files as $f) {
    $c = file_get_contents($f);
    $c = str_replace('Ticket $ticket', 'Record $ticket', $c);
    $c = str_replace('Ticket $record', 'Record $record', $c);
    $c = str_replace('use App\Models\Ticket;', 'use App\Models\Record;', $c);
    
    // Some might not have imported it properly, so replace App\Models\Ticket
    $c = str_replace('App\Models\Ticket', 'App\Models\Record', $c);

    file_put_contents($f, $c);
}
echo "Done replacing Ticket to Record in Notifications";
