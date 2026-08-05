<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\FormField;
use App\Models\OrgDivisi;
use App\Models\OrgJabatan;
use App\Models\RoomVehicleBooking;
use App\Models\Record;
use App\Models\RecordAttachment;
use App\Models\RecordLog;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use App\Notifications\TicketCreatedUserNotification;
use App\Notifications\TicketCreatedAdminNotification;
use Inertia\Inertia;
use App\Models\Campaign;
use App\Models\Unit;

class DataInputController extends Controller
{
    public function create()
    {
        return Inertia::render('User/Data/Wizard', [
            'unitList' => Unit::where('aktif', true)->orderBy('nama_unit')->get(),
            'campaigns' => Campaign::where('is_active', true)->orderBy('nama_campaign')->get(),
            'paymentMethods' => \App\Models\PaymentMethod::where('is_active', true)->get(),
            'akads' => \App\Models\Akad::where('is_active', true)->with('children')->whereNull('parent_id')->get(),
        ]);
    }

    public function store(Request $request)
    {
        // Decode form_data from JSON string (prevents FormData nesting loss with files)
        if (is_string($request->form_data)) {
            $request->merge([
                'form_data' => json_decode($request->form_data, true) ?? [],
            ]);
        }

        // Validasi dasar
        $request->validate([
            'unit_id' => 'required|exists:units,id',
            'sub_unit_id' => 'required|exists:sub_units,id',
            'campaign_id' => 'nullable|exists:campaigns,id',
            'form_data' => 'required|array',
            'donatur_id' => 'nullable|exists:donaturs,id',
            'jumlah_donasi' => 'nullable|numeric|min:0',
            'attachments' => 'nullable|array',
            'attachments.*' => 'nullable|array|max:3',
            'attachments.*.*' => 'file|max:3072', // max 3MB per file
            'general_attachments' => 'nullable|array|max:3',
            'general_attachments.*' => 'file|max:3072|mimes:jpg,jpeg,png,pdf,doc,docx',
        ]);

        // Validasi form_data berdasarkan form_fields yang wajib (hanya yg visible)
        $formFields = FormField::where('sub_unit_id', $request->sub_unit_id)->get();
        $extractedDonaturId = null;
        $extractedJumlahDonasi = null;

        foreach ($formFields as $field) {
            $fieldKey = (string) $field->id;
            $val = $request->form_data[$fieldKey] ?? null;

            // Extract dynamically
            if ($val) {
                if ($field->tipe_field === 'donatur_lookup') {
                    $extractedDonaturId = $val;
                }
                if (stripos($field->label, 'donasi') !== false || stripos($field->label, 'jumlah donasi') !== false || stripos($field->label, 'nominal') !== false) {
                    // Hanya set ke jumlah_donasi jika tipe data numerik/nominal_rp, atau string angka
                    if (is_numeric(str_replace(['Rp', '.', ',', ' '], '', $val))) {
                        $extractedJumlahDonasi = (float) str_replace(['Rp', '.', ',', ' '], '', $val);
                    }
                }
            }

            if (!$field->wajib || $field->isUpload() || $field->tipe_field === 'info_peraturan') continue;
            // Skip hidden conditional fields
            if ($field->parent_field_id) {
                $parentValue = $request->form_data[(string) $field->parent_field_id] ?? null;
                if ($field->trigger_value === '*') {
                    if ($parentValue === null || $parentValue === '') continue;
                } else {
                    if ($parentValue != $field->trigger_value) continue;
                }
            }
            $fieldKey = (string) $field->id;
            if (!isset($request->form_data[$fieldKey]) || empty($request->form_data[$fieldKey])) {
                return back()->withErrors([
                    'form_data.' . $fieldKey => "Field \"{$field->label}\" wajib diisi.",
                ]);
            }
        }

        $record = DB::transaction(function () use ($request, $formFields, $extractedDonaturId, $extractedJumlahDonasi) {
            $initialStatus = 'open'; // Draft/Open

            $user = auth()->user();

            // 1. Buat record
            $record = Record::create([
                'user_id' => $user->id,
                'divisi_id' => $user->divisi_id,
                'org_unit_id' => $user->org_unit_id,
                'jabatan_id' => $user->jabatan_id,
                'unit_id' => $request->unit_id,
                'sub_unit_id' => $request->sub_unit_id,
                'campaign_id' => $request->campaign_id,
                'form_data' => $request->form_data,
                'donatur_id' => $extractedDonaturId ?? $request->donatur_id,
                'jumlah_donasi' => $extractedJumlahDonasi ?? $request->jumlah_donasi,
                'status' => $initialStatus,
            ]);

            // 2. Simpan attachments
            $uploadedFiles = $request->file('attachments');
            if (!empty($uploadedFiles) && is_array($uploadedFiles)) {
                foreach ($uploadedFiles as $fieldId => $filesArray) {
                    if (!is_array($filesArray)) continue;
                    $field = $formFields->firstWhere('id', $fieldId);
                    
                    foreach ($filesArray as $file) {
                        if (!$file || !is_a($file, \Illuminate\Http\UploadedFile::class) || !$file->isValid()) {
                            \Log::error("Invalid file upload for field $fieldId", [
                                'is_file' => $file ? is_a($file, \Illuminate\Http\UploadedFile::class) : false,
                                'valid' => $file ? $file->isValid() : false
                            ]);
                            continue;
                        }

                        // Bypass getRealPath() bug in Windows by passing string path
                        $path = \Illuminate\Support\Facades\Storage::disk('public')->putFileAs(
                            "record-attachments/{$record->id}",
                            $file->getPathname(),
                            $file->hashName()
                        );

                        RecordAttachment::create([
                            'ticket_id' => $record->id,
                            'field_id' => $fieldId,
                            'file_path' => $path,
                            'original_name' => $file->getClientOriginalName(),
                            'mime_type' => $file->getMimeType(),
                            'file_size' => $file->getSize(),
                            'wajib' => $field ? $field->wajib : false,
                        ]);
                    }
                }
            }

            // Simpan general attachments
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
                        'ticket_log_id' => null,
                        'file_path' => $path,
                        'original_name' => $file->getClientOriginalName(),
                        'mime_type' => $file->getMimeType(),
                        'file_size' => $file->getSize(),
                        'wajib' => false,
                    ]);
                }
            }


            // 4. Log awal
            RecordLog::create([
                'ticket_id' => $record->id,
                'admin_id' => null,
                'aksi' => 'dibuat',
                'catatan' => 'Data disimpan oleh ' . auth()->user()->username,
            ]);


            return $record;
        });

        // 6. Notifikasi WA & In-App (di luar transaksi agar tidak mengganggu DB)
        try {
            $record->load('user', 'subUnit');
            // Notifikasi ke User
            $record->user->notify(new TicketCreatedUserNotification($record));
            // Notifikasi ke Admin
            $notifiedAdmins = \App\Models\Admin::whereHas('units', function ($query) use ($record) {
                $query->where('units.id', $record->unit_id);
            })->orWhereHas('roles', function($q) {
                $q->where('name', 'superadmin');
            })->get();

            if ($notifiedAdmins->isNotEmpty()) {
                Notification::send($notifiedAdmins, new TicketCreatedAdminNotification($record));
            } else {
                Notification::send(new \Illuminate\Notifications\AnonymousNotifiable, new TicketCreatedAdminNotification($record));
            }
        } catch (\Exception $e) {
            \Log::error("Gagal mengirim notifikasi untuk data #{$record->id}: " . $e->getMessage());
        }

        return redirect()->route('data.riwayat')->with('success', 'Data berhasil disimpan!');
    }
}
