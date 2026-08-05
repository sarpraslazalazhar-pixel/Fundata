<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class PaymentMethodController extends Controller
{
    public function index(Request $request)
    {
        $query = PaymentMethod::query();

        if ($request->has('search') && $request->search != '') {
            $query->where('nama_bank', 'like', '%' . $request->search . '%')
                  ->orWhere('nama_pemilik', 'like', '%' . $request->search . '%')
                  ->orWhere('nomor_rekening', 'like', '%' . $request->search . '%');
        }

        $paymentMethods = $query->orderBy('kategori')
            ->orderBy('nama_bank')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Admin/MasterData/PaymentMethod/Index', [
            'paymentMethods' => $paymentMethods,
            'filters' => $request->only('search'),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_bank' => 'required|string|max:255',
            'nomor_rekening' => 'nullable|string|max:255',
            'nama_pemilik' => 'nullable|string|max:255',
            'instruksi' => 'nullable|string',
            'kategori' => 'required|in:transfer_bank,e_wallet,qris,cash',
            'is_active' => 'nullable|boolean',
            'logo_qris' => 'nullable|image|max:2048',
        ]);

        if ($request->has('is_active')) {
            $validated['is_active'] = $request->boolean('is_active');
        }

        if ($request->hasFile('logo_qris')) {
            $path = $request->file('logo_qris')->store('payment_methods', 'public');
            $validated['logo_qris'] = $path;
        }

        PaymentMethod::create($validated);

        return redirect()->back()->with('success', 'Metode Pembayaran berhasil ditambahkan.');
    }

    public function update(Request $request, PaymentMethod $metode_pembayaran)
    {
        $validated = $request->validate([
            'nama_bank' => 'required|string|max:255',
            'nomor_rekening' => 'nullable|string|max:255',
            'nama_pemilik' => 'nullable|string|max:255',
            'instruksi' => 'nullable|string',
            'kategori' => 'required|in:transfer_bank,e_wallet,qris,cash',
            'is_active' => 'nullable|boolean',
            'logo_qris' => 'nullable|image|max:2048',
        ]);

        if ($request->has('is_active')) {
            $validated['is_active'] = $request->boolean('is_active');
        }

        if ($request->hasFile('logo_qris')) {
            if ($metode_pembayaran->logo_qris) {
                Storage::disk('public')->delete($metode_pembayaran->logo_qris);
            }
            $path = $request->file('logo_qris')->store('payment_methods', 'public');
            $validated['logo_qris'] = $path;
        }

        $metode_pembayaran->update($validated);

        return redirect()->back()->with('success', 'Metode Pembayaran berhasil diupdate.');
    }

    public function destroy(PaymentMethod $metode_pembayaran)
    {
        if ($metode_pembayaran->logo_qris) {
            Storage::disk('public')->delete($metode_pembayaran->logo_qris);
        }
        $metode_pembayaran->delete();
        return redirect()->back()->with('success', 'Metode Pembayaran berhasil dihapus.');
    }
}
