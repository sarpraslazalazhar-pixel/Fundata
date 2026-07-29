<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\FormField;
use App\Models\Record;
use App\Models\RecordAttachment;
use App\Models\RecordLog;
use App\Models\SystemConfig;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class MyDataController extends Controller
{
    public function index(Request $request)
    {
        $query = Record::where('user_id', auth()->id())
            ->with(['unit', 'subUnit']);

        // Filter status
        if ($request->has('status') && $request->status) {
            if (is_array($request->status)) {
                $query->whereIn('status', $request->status);
            } else {
                $query->where('status', $request->status);
            }
        }

        // Filter rentang tanggal
        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $records = $query->orderByDesc('created_at')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('User/Data/Riwayat', [
            'records' => $records,
            'filters' => $request->only('status', 'date_from', 'date_to'),
            'statuses' => ['open', 'on_proses', 'pending', 'solve', 'reject', 'dibatalkan', 'waiting_approval', 'need_revision'],
        ]);
    }

    public function download(RecordAttachment $attachment)
    {
        $record = $attachment->record;
        if ($record->user_id !== auth()->id()) {
            abort(403);
        }

        if (!Storage::disk('public')->exists($attachment->file_path)) {
            abort(404, 'File tidak ditemukan.');
        }

        return Storage::disk('public')->download($attachment->file_path, $attachment->original_name);
    }

    public function viewAttachment(RecordAttachment $attachment)
    {
        $record = $attachment->record;
        if ($record->user_id !== auth()->id()) {
            abort(403);
        }

        if (!Storage::disk('public')->exists($attachment->file_path)) {
            abort(404, 'File tidak ditemukan.');
        }

        $headers = [
            'Content-Type' => $attachment->mime_type,
            'Content-Disposition' => 'inline; filename="' . $attachment->original_name . '"'
        ];

        return response()->file(Storage::disk('public')->path($attachment->file_path), $headers);
    }

    public function show(Record $record)
    {
        // Pastikan tiket milik user yang login
        if ((int)$record->user_id !== (int)auth()->id()) {
            abort(403, 'Anda tidak memiliki akses ke tiket ini.');
        }

        $record->load([
            'unit',
            'subUnit',
            'orgDivisi',
            'orgUnit',
            'jabatan',
            'attachments',
            'csat',
            'logs' => function ($q) {
                $q->orderBy('timestamp', 'desc');
            },
            'logs.admin',
            'logs.attachments',
        ]);

        // Ambil form fields untuk mapping label
        $formFields = FormField::where('sub_unit_id', $record->sub_unit_id)
            ->orderBy('urutan')
            ->get();

        $maxRevisions = (int) \App\Models\SystemConfig::getValue('max_revisions', 5);

        return Inertia::render('User/Data/Detail', [
            'ticket' => $record,
            'formFields' => $formFields,
            'maxRevisions' => $maxRevisions,
        ]);
    }

    public function cancel(Record $record)
    {
        if ($record->user_id !== auth()->id()) {
            abort(403);
        }
        if ($record->status !== 'open') {
            return redirect()->back()->with('error', 'Hanya tiket dengan status Open yang bisa dibatalkan.');
        }

        $record->update(['status' => 'dibatalkan']);

        if ($record->booking) {
            $record->booking->update(['status' => 'dibatalkan']);
        }

        RecordLog::create([
            'ticket_id' => $record->id,
            'admin_id' => null,
            'aksi' => 'dibatalkan',
            'catatan' => 'Tiket dibatalkan oleh ' . auth()->user()->username,
        ]);

        return redirect()->route('data.riwayat')->with('success', 'Tiket berhasil dibatalkan.');
    }

    public function reply(Request $request, Record $record)
    {
        if ($record->user_id !== auth()->id()) {
            abort(403);
        }

        if (in_array($record->status, ['solve', 'reject', 'dibatalkan'])) {
            return redirect()->back()->with('error', 'Tidak dapat membalas tiket yang sudah selesai atau dibatalkan.');
        }

        $request->validate([
            'catatan' => 'required|string|max:1000',
            'general_attachments' => 'nullable|array|max:3',
            'general_attachments.*' => 'file|max:3072|mimes:jpg,jpeg,png,pdf,doc,docx',
        ]);

        $log = RecordLog::create([
            'ticket_id' => $record->id,
            'admin_id' => null,
            'aksi' => 'balasan',
            'catatan' => $request->catatan,
        ]);

        $generalFiles = $request->file('general_attachments');
        if (!empty($generalFiles) && is_array($generalFiles)) {
            foreach ($generalFiles as $file) {
                if (!$file || !is_a($file, \Illuminate\Http\UploadedFile::class) || !$file->isValid()) continue;

                $path = \Illuminate\Support\Facades\Storage::disk('public')->putFileAs(
                    "ticket-attachments/{$record->id}",
                    $file->getPathname(),
                    $file->hashName()
                );

                RecordAttachment::create([
                    'ticket_id' => $record->id,
                    'field_id' => null,
                    'ticket_log_id' => $log->id,
                    'file_path' => $path,
                    'original_name' => $file->getClientOriginalName(),
                    'mime_type' => $file->getMimeType(),
                    'file_size' => $file->getSize(),
                    'wajib' => false,
                ]);
            }
        }

        $notifiedAdmins = \App\Models\Admin::whereHas('units', function ($query) use ($record) {
            $query->where('units.id', $record->subUnit->unit_id);
        })->orWhereHas('roles', function($q) {
            $q->where('name', 'superadmin');
        })->get();

        if ($notifiedAdmins->isNotEmpty()) {
            $senderName = auth()->user()->name ?? auth()->user()->username;
            $url = route('admin.data.show', $record->id);
            \Illuminate\Support\Facades\Notification::send($notifiedAdmins, new \App\Notifications\TicketCommentPushNotification($record, $senderName, $request->catatan, $url));
        }

        return redirect()->back()->with('success', 'Balasan berhasil dikirim.');
    }

    public function acceptResult(Record $record)
    {
        if ($record->user_id !== auth()->id()) {
            abort(403);
        }

        if ($record->status !== 'solve') {
            return redirect()->back()->with('error', 'Tiket tidak dalam status selesai.');
        }

        if (!$record->subUnit->is_revision_enabled) {
            return redirect()->back()->with('error', 'Fitur revisi tidak diaktifkan untuk jenis layanan ini.');
        }

        $record->update(['is_result_accepted' => true]);

        RecordLog::create([
            'ticket_id' => $record->id,
            'admin_id' => null,
            'aksi' => 'accepted',
            'catatan' => 'Hasil akhir diterima oleh user.',
        ]);

        return redirect()->back()->with('success', 'Hasil telah Anda terima.');
    }

    public function requestRevision(Request $request, Record $record)
    {
        if ($record->user_id !== auth()->id()) {
            abort(403);
        }

        if ($record->status !== 'solve') {
            return redirect()->back()->with('error', 'Tiket tidak dalam status selesai.');
        }

        if (!$record->subUnit->is_revision_enabled) {
            return redirect()->back()->with('error', 'Fitur revisi tidak diaktifkan untuk jenis layanan ini.');
        }

        $maxRevisions = (int) SystemConfig::getValue('max_revisions', 5);

        if ($record->revision_count >= $maxRevisions) {
            return redirect()->back()->with('error', 'Anda telah mencapai batas maksimal revisi (' . $maxRevisions . ' kali).');
        }

        $request->validate([
            'catatan' => 'required|string|max:1000',
            'general_attachments' => 'nullable|array|max:3',
            'general_attachments.*' => 'file|max:3072|mimes:jpg,jpeg,png,pdf,doc,docx',
        ]);

        $record->update([
            'status' => 'need_revision',
            'revision_count' => $record->revision_count + 1,
        ]);

        $log = RecordLog::create([
            'ticket_id' => $record->id,
            'admin_id' => null,
            'aksi' => 'need_revision',
            'catatan' => $request->catatan,
        ]);

        $generalFiles = $request->file('general_attachments');
        if (!empty($generalFiles) && is_array($generalFiles)) {
            foreach ($generalFiles as $file) {
                if (!$file || !is_a($file, \Illuminate\Http\UploadedFile::class) || !$file->isValid()) continue;

                $path = \Illuminate\Support\Facades\Storage::disk('public')->putFileAs(
                    "record-attachments/{$record->id}",
                    $file->getPathname(),
                    $file->hashName()
                );

                RecordAttachment::create([
                    'ticket_id' => $record->id,
                    'field_id' => null,
                    'ticket_log_id' => $log->id,
                    'file_path' => $path,
                    'original_name' => $file->getClientOriginalName(),
                    'mime_type' => $file->getMimeType(),
                    'file_size' => $file->getSize(),
                    'wajib' => false,
                ]);
            }
        }

        $notifiedAdmins = \App\Models\Admin::whereHas('units', function ($query) use ($record) {
            $query->where('units.id', $record->subUnit->unit_id);
        })->get();

        if ($notifiedAdmins->isNotEmpty()) {
            \Illuminate\Support\Facades\Notification::send($notifiedAdmins, new \App\Notifications\RevisionRequestedNotification($record, $request->catatan));
        } else {
            \Illuminate\Support\Facades\Notification::send(new \Illuminate\Notifications\AnonymousNotifiable, new \App\Notifications\RevisionRequestedNotification($record, $request->catatan));
        }

        return redirect()->back()->with('success', 'Permintaan revisi berhasil dikirim.');
    }
}

