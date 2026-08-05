<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Donatur;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class DonaturController extends Controller
{
    public function index(Request $request)
    {
        $query = Donatur::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('nama_lengkap', 'like', "%{$search}%")
                  ->orWhere('no_telp', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
        }

        $donaturs = $query->orderBy('created_at', 'desc')->paginate(10)->withQueryString();

        return Inertia::render('Admin/Donatur/Index', [
            'donaturs' => $donaturs,
            'filters' => $request->only('search'),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tipe' => 'required|in:Individu,Organisasi',
            'nama_lengkap' => 'required|string|max:255',
            'no_telp' => 'required|string|max:50',
            'alamat' => 'required|string',
            'email' => 'nullable|email|max:255',
            'jenis_kelamin' => 'nullable|in:L,P',
        ]);

        if (!empty($validated['no_telp'])) {
            $validated['no_telp'] = preg_replace('/[^0-9+]/', '', $validated['no_telp']);
        }

        Donatur::create($validated);

        return redirect()->route('admin.donatur.index')->with('success', 'Data Donatur berhasil ditambahkan');
    }

    public function update(Request $request, Donatur $donatur)
    {
        $validated = $request->validate([
            'tipe' => 'required|in:Individu,Organisasi',
            'nama_lengkap' => 'required|string|max:255',
            'no_telp' => 'required|string|max:50',
            'alamat' => 'required|string',
            'email' => 'nullable|email|max:255',
            'jenis_kelamin' => 'nullable|in:L,P',
        ]);

        if (!empty($validated['no_telp'])) {
            $validated['no_telp'] = preg_replace('/[^0-9+]/', '', $validated['no_telp']);
        }

        $donatur->update($validated);

        return redirect()->route('admin.donatur.index')->with('success', 'Data Donatur berhasil diperbarui');
    }

    public function destroy(Donatur $donatur)
    {
        $donatur->delete();
        return redirect()->route('admin.donatur.index')->with('success', 'Data Donatur berhasil dihapus');
    }

    public function history(Donatur $donatur)
    {
        // Load records (donations) related to this donatur
        $records = $donatur->records()->with(['campaign', 'subUnit', 'user'])->orderBy('created_at', 'desc')->paginate(10);
        
        return Inertia::render('Admin/Donatur/History', [
            'donatur' => $donatur,
            'records' => $records
        ]);
    }

    public function approve(Donatur $donatur)
    {
        $donatur->update(['is_approved' => true]);
        return redirect()->back()->with('success', 'Donatur berhasil disetujui');
    }

    public function importTemplate()
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="template_donatur.csv"',
        ];

        $columns = ['tipe', 'nama_lengkap', 'jenis_kelamin', 'no_telp', 'email', 'alamat'];
        
        $callback = function() use($columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);
            // Contoh data
            fputcsv($file, ['Individu', 'Budi Santoso', 'L', '08123456789', 'budi@example.com', 'Jl. Merdeka No 1']);
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function importPreview(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt,xlsx,xls|max:5120',
        ]);

        $file = $request->file('file');
        
        // Simpan manual dengan move untuk menghindari isu getRealPath() kosong di OS tertentu
        $filename = \Illuminate\Support\Str::random(40) . '.' . $file->getClientOriginalExtension();
        $destinationPath = storage_path('app/temp_imports');
        if (!file_exists($destinationPath)) {
            mkdir($destinationPath, 0755, true);
        }
        $file->move($destinationPath, $filename);
        $tempPath = 'temp_imports/' . $filename;

        // Gunakan anonymous class untuk mengambil array dengan heading row
        $importClass = new class implements WithHeadingRow {};
        $data = Excel::toArray($importClass, storage_path('app/' . $tempPath))[0];

        $valid = [];
        $duplicates = [];
        $invalid = [];

        $existingPhones = Donatur::whereNotNull('no_telp')->pluck('no_telp')->toArray();

        foreach ($data as $row) {
            // Normalisasi key (kadang spasi jadi underscore)
            $row = array_change_key_case($row, CASE_LOWER);
            
            $nama = $row['nama_lengkap'] ?? null;
            $noTelp = $row['no_telp'] ?? null;
            $alamat = $row['alamat'] ?? null;
            $tipe = isset($row['tipe']) && in_array(ucfirst($row['tipe']), ['Individu', 'Organisasi']) ? ucfirst($row['tipe']) : 'Individu';
            $jenisKelamin = isset($row['jenis_kelamin']) && in_array(strtoupper($row['jenis_kelamin']), ['L', 'P']) ? strtoupper($row['jenis_kelamin']) : null;
            $email = $row['email'] ?? null;

            if ($noTelp) {
                $noTelp = preg_replace('/[^0-9+]/', '', $noTelp);
            }

            $rowData = [
                'tipe' => $tipe,
                'nama_lengkap' => $nama,
                'no_telp' => $noTelp,
                'alamat' => $alamat,
                'email' => $email,
                'jenis_kelamin' => $tipe === 'Individu' ? $jenisKelamin : null,
            ];

            if (empty($nama) || empty($noTelp) || empty($alamat)) {
                $invalid[] = $rowData;
            } elseif (in_array($noTelp, $existingPhones)) {
                $duplicates[] = $rowData;
            } else {
                $valid[] = $rowData;
                // Add to existing phones to prevent duplicates within the file
                $existingPhones[] = $noTelp;
            }
        }

        return response()->json([
            'valid' => $valid,
            'duplicates' => $duplicates,
            'invalid' => $invalid,
            'temp_file' => $tempPath,
        ]);
    }

    public function importConfirm(Request $request)
    {
        $request->validate([
            'temp_file' => 'required|string',
        ]);

        if (!Storage::exists($request->temp_file)) {
            return response()->json(['message' => 'File tidak ditemukan'], 404);
        }

        $importClass = new class implements WithHeadingRow {};
        $data = Excel::toArray($importClass, storage_path('app/' . $request->temp_file))[0];

        $validCount = 0;
        $existingPhones = Donatur::whereNotNull('no_telp')->pluck('no_telp')->toArray();
        $inserts = [];

        foreach ($data as $row) {
            $row = array_change_key_case($row, CASE_LOWER);
            
            $nama = $row['nama_lengkap'] ?? null;
            $noTelp = $row['no_telp'] ?? null;
            $alamat = $row['alamat'] ?? null;
            $tipe = isset($row['tipe']) && in_array(ucfirst($row['tipe']), ['Individu', 'Organisasi']) ? ucfirst($row['tipe']) : 'Individu';
            $jenisKelamin = isset($row['jenis_kelamin']) && in_array(strtoupper($row['jenis_kelamin']), ['L', 'P']) ? strtoupper($row['jenis_kelamin']) : null;
            $email = $row['email'] ?? null;

            if ($noTelp) {
                $noTelp = preg_replace('/[^0-9+]/', '', $noTelp);
            }

            if (!empty($nama) && !empty($noTelp) && !empty($alamat) && !in_array($noTelp, $existingPhones)) {
                $inserts[] = [
                    'tipe' => $tipe,
                    'nama_lengkap' => $nama,
                    'no_telp' => $noTelp,
                    'alamat' => $alamat,
                    'email' => $email,
                    'jenis_kelamin' => $tipe === 'Individu' ? $jenisKelamin : null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
                $existingPhones[] = $noTelp;
                $validCount++;
            }
        }

        if (count($inserts) > 0) {
            Donatur::insert($inserts);
        }

        Storage::delete($request->temp_file);

        return response()->json(['message' => "Berhasil mengimpor {$validCount} data"]);
    }
}
