<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Donatur;
use Illuminate\Http\Request;

class DonaturController extends Controller
{
    public function search(Request $request)
    {
        $query = $request->get('q');
        
        $donaturs = Donatur::query()
            ->where('nama_lengkap', 'like', "%{$query}%")
            ->orWhere('no_telp', 'like', "%{$query}%")
            ->limit(20)
            ->get(['id', 'nama_lengkap', 'no_telp', 'tipe']);

        return response()->json($donaturs);
    }

    public function quickStore(Request $request)
    {
        $validated = $request->validate([
            'tipe' => 'required|in:Individu,Organisasi',
            'nama_lengkap' => 'required|string|max:255',
            'no_telp' => 'required|string|max:50',
            'alamat' => 'required|string',
            'jenis_kelamin' => 'nullable|in:L,P',
        ]);

        if (!empty($validated['no_telp'])) {
            $validated['no_telp'] = preg_replace('/[^0-9+]/', '', $validated['no_telp']);
        }
        
        $validated['jenis_kelamin'] = $validated['tipe'] === 'Individu' ? ($validated['jenis_kelamin'] ?? null) : null;

        $validated['is_approved'] = false; // Membutuhkan approval admin

        $donatur = Donatur::create($validated);

        return response()->json([
            'message' => 'Donatur berhasil ditambahkan',
            'donatur' => [
                'value' => $donatur->id,
                'label' => "{$donatur->nama_lengkap} - {$donatur->tipe} ({$donatur->no_telp})"
            ]
        ]);
    }
}
