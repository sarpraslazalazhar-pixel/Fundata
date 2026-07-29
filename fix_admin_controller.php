<?php
$f = 'app/Http/Controllers/Admin/DataVerificationController.php';
$c = file_get_contents($f);
$c = str_replace('Ticket $ticket', 'Record $record', $c);
$c = str_replace('Ticket $record', 'Record $record', $c);
$c = str_replace('TicketAttachment $attachment', 'RecordAttachment $attachment', $c);
$c = str_replace('use App\Models\Ticket;', 'use App\Models\Record;', $c);
$c = preg_replace('/use App\\\\Models\\\\TicketAttachment;/', "use App\\Models\\RecordAttachment;", $c);
// also replace internal references to $ticket if they exist
$c = str_replace('$ticket->id', '$record->id', $c);
$c = str_replace('$ticket->', '$record->', $c);
// calculating SLA: $slaCalculator->calculateResponseDeadline($ticket);
file_put_contents($f, $c);
echo "Done replacing DataVerificationController";
