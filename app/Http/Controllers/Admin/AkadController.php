<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Akad;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AkadController extends Controller
{
    public function index()
    {
        // Get all Akads with their children
        $akads = Akad::with('children')->whereNull('parent_id')->get();
        // Also get flat list for parent selection dropdown
        $allParents = Akad::whereNull('parent_id')->get();

        return Inertia::render('Admin/Akad/Index', [
            'akads' => $akads,
            'parentOptions' => $allParents
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'parent_id' => 'nullable|exists:akads,id',
            'nama_akad' => 'required|string|max:255',
            'is_campaign_required' => 'boolean',
            'is_active' => 'boolean',
        ]);

        Akad::create($validated);

        return redirect()->back()->with('success', 'Akad berhasil ditambahkan.');
    }

    public function update(Request $request, Akad $akad)
    {
        $validated = $request->validate([
            'parent_id' => 'nullable|exists:akads,id',
            'nama_akad' => 'required|string|max:255',
            'is_campaign_required' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $akad->update($validated);

        return redirect()->back()->with('success', 'Akad berhasil diperbarui.');
    }

    public function destroy(Akad $akad)
    {
        if ($akad->children()->count() > 0) {
            return redirect()->back()->with('error', 'Tidak dapat menghapus Akad ini karena memiliki cabang (anak).');
        }

        $akad->delete();

        return redirect()->back()->with('success', 'Akad berhasil dihapus.');
    }
}
