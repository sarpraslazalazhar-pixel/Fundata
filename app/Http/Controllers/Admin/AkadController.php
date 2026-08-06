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
            'target_dana' => 'nullable|numeric|min:0',
            'is_show_on_dashboard' => 'boolean',
            'banner' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        if ($request->hasFile('banner')) {
            if (!$request->file('banner')->isValid()) {
                return back()->withErrors(['banner' => 'File gambar tidak valid atau ukurannya terlalu besar (Maks 2MB).']);
            }
            $file = $request->file('banner');
            $filename = uniqid() . '_' . time() . '.' . $file->getClientOriginalExtension();
            $file->move(storage_path('app/public/akads'), $filename);
            $validated['banner_url'] = '/storage/akads/' . $filename;
        }

        Akad::create($validated);

        return redirect()->route('admin.master.akad.index')->with('success', 'Akad berhasil ditambahkan.');
    }

    public function update(Request $request, Akad $akad)
    {
        $validated = $request->validate([
            'parent_id' => 'nullable|exists:akads,id',
            'nama_akad' => 'required|string|max:255',
            'is_campaign_required' => 'boolean',
            'is_active' => 'boolean',
            'target_dana' => 'nullable|numeric|min:0',
            'is_show_on_dashboard' => 'boolean',
            'banner' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        if ($request->hasFile('banner')) {
            if (!$request->file('banner')->isValid()) {
                return back()->withErrors(['banner' => 'File gambar tidak valid atau ukurannya terlalu besar (Maks 2MB).']);
            }
            if ($akad->banner_url) {
                $oldPath = str_replace('/storage/', '', $akad->banner_url);
                \Illuminate\Support\Facades\Storage::disk('public')->delete($oldPath);
            }
            $file = $request->file('banner');
            $filename = uniqid() . '_' . time() . '.' . $file->getClientOriginalExtension();
            $file->move(storage_path('app/public/akads'), $filename);
            $validated['banner_url'] = '/storage/akads/' . $filename;
        }

        $akad->update($validated);

        return redirect()->route('admin.master.akad.index')->with('success', 'Akad berhasil diperbarui.');
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
