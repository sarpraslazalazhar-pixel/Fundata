<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CampaignController extends Controller
{
    public function index()
    {
        $campaigns = Campaign::withSum('records', 'jumlah_donasi')->latest()->get();
        return Inertia::render('Admin/Campaign/Index', [
            'campaigns' => $campaigns
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_campaign' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'target_dana' => 'required|numeric|min:0',
            'is_active' => 'boolean',
            'tgl_mulai' => 'nullable|date',
            'tgl_selesai' => 'nullable|date|after_or_equal:tgl_mulai',
            'banner' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        $data = $validated;
        unset($data['banner']);

        if ($request->hasFile('banner')) {
            if (!$request->file('banner')->isValid()) {
                return back()->withErrors(['banner' => 'File gambar tidak valid atau ukurannya terlalu besar (Maks 2MB).']);
            }
            $file = $request->file('banner');
            $filename = uniqid() . '_' . time() . '.' . $file->getClientOriginalExtension();
            $file->move(storage_path('app/public/campaigns'), $filename);
            $data['banner_path'] = 'campaigns/' . $filename;
        }

        Campaign::create($data);

        return redirect()->back()->with('success', 'Campaign berhasil ditambahkan.');
    }

    public function update(Request $request, Campaign $campaign)
    {
        $validated = $request->validate([
            'nama_campaign' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'target_dana' => 'required|numeric|min:0',
            'is_active' => 'boolean',
            'tgl_mulai' => 'nullable|date',
            'tgl_selesai' => 'nullable|date|after_or_equal:tgl_mulai',
            'banner' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        $data = $validated;
        unset($data['banner']);

        if ($request->hasFile('banner')) {
            if (!$request->file('banner')->isValid()) {
                return back()->withErrors(['banner' => 'File gambar tidak valid atau ukurannya terlalu besar (Maks 2MB).']);
            }
            if ($campaign->banner_path) {
                Storage::disk('public')->delete($campaign->banner_path);
            }
            $file = $request->file('banner');
            $filename = uniqid() . '_' . time() . '.' . $file->getClientOriginalExtension();
            $file->move(storage_path('app/public/campaigns'), $filename);
            $data['banner_path'] = 'campaigns/' . $filename;
        }

        $campaign->update($data);

        return redirect()->back()->with('success', 'Campaign berhasil diperbarui.');
    }

    public function destroy(Campaign $campaign)
    {
        if ($campaign->banner_path) {
            Storage::disk('public')->delete($campaign->banner_path);
        }
        $campaign->delete();

        return redirect()->back()->with('success', 'Campaign berhasil dihapus.');
    }
}
