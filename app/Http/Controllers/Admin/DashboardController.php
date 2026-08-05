<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Record;
use App\Models\Campaign;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $month = $request->input('month', date('n'));
        $year = $request->input('year', date('Y'));

        $baseQuery = Record::query();
        if ($year) $baseQuery->whereYear('created_at', $year);
        if ($month) $baseQuery->whereMonth('created_at', $month);

        $validBase = (clone $baseQuery)->whereNotIn('status', ['reject', 'dibatalkan']);

        // ── KPI ──
        $kpi = (clone $baseQuery)->selectRaw('
            COUNT(*) as total_transaksi,
            COALESCE(SUM(CASE WHEN status NOT IN ("reject", "dibatalkan") THEN jumlah_donasi ELSE 0 END), 0) as total_donasi,
            COUNT(CASE WHEN status NOT IN ("reject", "dibatalkan") AND donatur_id IS NOT NULL THEN 1 END) as total_donatur
        ')->first();

        $totalTransaksi = (int) ($kpi->total_transaksi ?? 0);
        $totalDonasi = (float) ($kpi->total_donasi ?? 0);
        $totalDonatur = (int) ($kpi->total_donatur ?? 0);
        $fundraiserAktif = (clone $validBase)->distinct()->count('user_id');

        // ── Tren Nominal per Bulan ──
        $monthlyRaw = (clone $validBase)
            ->selectRaw('MONTH(created_at) as bulan, COALESCE(SUM(jumlah_donasi), 0) as total_nominal')
            ->groupBy('bulan')
            ->get();
        $monthlyTrend = collect(range(1, 12))->map(function ($b) use ($monthlyRaw) {
            return [
                'bulan' => date('M', mktime(0, 0, 0, $b, 1)),
                'total' => (float) ($monthlyRaw->firstWhere('bulan', $b)?->total_nominal ?? 0),
            ];
        });

        // ── Distribusi Nominal per Metode Pembayaran ──
        $metodeFieldIds = \App\Models\FormField::where('tipe_field', 'metode_bayar')->pluck('id')->toArray();
        $paymentMethodMap = \App\Models\PaymentMethod::all()->keyBy('id');

        $distribusiMetode = collect();
        if (!empty($metodeFieldIds)) {
            $metodeRaw = (clone $validBase)
                ->select(['id', 'form_data', 'jumlah_donasi'])
                ->get();

            foreach ($metodeRaw as $row) {
                $formData = is_string($row->form_data) ? json_decode($row->form_data, true) : $row->form_data;
                if (!is_array($formData)) continue;

                foreach ($metodeFieldIds as $fid) {
                    if (isset($formData[$fid]) && $formData[$fid] !== null && $formData[$fid] !== '') {
                        $mid = $formData[$fid];
                        if (isset($paymentMethodMap[$mid])) {
                            $name = $paymentMethodMap[$mid]->nama_bank;
                            $distribusiMetode[$name] = ($distribusiMetode[$name] ?? 0) + (float) $row->jumlah_donasi;
                        }
                        break;
                    }
                }
            }
        }
        $distribusiMetode = $distribusiMetode
            ->map(fn($total, $name) => ['name' => $name, 'value' => round($total, 2)])
            ->sortByDesc('value')
            ->values();

        // ── Top 10 Fundraiser ──
        $topFundraiserQuery = DB::table('tickets')
            ->join('users', 'tickets.user_id', '=', 'users.id')
            ->select(
                'users.username',
                'users.name',
                DB::raw('COUNT(*) as total_tiket'),
                DB::raw('SUM(tickets.jumlah_donasi) as total_donasi')
            )
            ->whereNotIn('tickets.status', ['reject', 'dibatalkan']);

        if ($year) $topFundraiserQuery->whereYear('tickets.created_at', $year);
        if ($month) $topFundraiserQuery->whereMonth('tickets.created_at', $month);

        $topFundraiser = $topFundraiserQuery->groupBy('users.id', 'users.username', 'users.name')
            ->orderByDesc('total_donasi')
            ->limit(10)
            ->get();

        // ── Data Perlu Ditindak Lanjuti ──
        $followUpTickets = Record::with(['user.divisi', 'unit', 'subUnit'])
            ->whereIn('status', ['open', 'pending'])
            ->latest()
            ->limit(10)
            ->get();

        // ── Top 10 Donatur ──
        $topDonaturQuery = DB::table('tickets')
            ->join('donaturs', 'tickets.donatur_id', '=', 'donaturs.id')
            ->select(
                'donaturs.nama_lengkap as nama_donatur',
                DB::raw('COUNT(tickets.id) as total_transaksi'),
                DB::raw('SUM(tickets.jumlah_donasi) as total_donasi')
            )
            ->whereNotIn('tickets.status', ['reject', 'dibatalkan'])
            ->whereNotNull('tickets.donatur_id');

        if ($year) $topDonaturQuery->whereYear('tickets.created_at', $year);
        if ($month) $topDonaturQuery->whereMonth('tickets.created_at', $month);

        $topDonatur = $topDonaturQuery->groupBy('donaturs.id', 'donaturs.nama_lengkap')
            ->orderByDesc('total_donasi')
            ->limit(10)
            ->get();

        // ── Riwayat Transaksi Terbaru ──
        $riwayatTransaksiQuery = Record::with(['user:id,username,name', 'donatur'])
            ->select('id', 'user_id', 'donatur_id', 'jumlah_donasi', 'created_at', 'status', 'form_data')
            ->whereNotIn('status', ['reject', 'dibatalkan'])
            ->where('jumlah_donasi', '>', 0);

        if ($year) $riwayatTransaksiQuery->whereYear('created_at', $year);
        if ($month) $riwayatTransaksiQuery->whereMonth('created_at', $month);

        $riwayatTransaksi = $riwayatTransaksiQuery->latest()
            ->limit(10)
            ->get();

        // ── Donasi per Cabang ──
        $donasiCabangQuery = Record::select(
            'users.divisi_id',
            'users.org_unit_id',
            'org_divisi.nama_divisi',
            'org_unit.nama_unit_organisasi',
            DB::raw('SUM(tickets.jumlah_donasi) as total_donasi'),
            DB::raw('COUNT(tickets.id) as total_transaksi')
        )
        ->leftJoin('users', 'tickets.user_id', '=', 'users.id')
        ->leftJoin('org_divisi', 'users.divisi_id', '=', 'org_divisi.id')
        ->leftJoin('org_unit', 'users.org_unit_id', '=', 'org_unit.id')
        ->whereNotIn('tickets.status', ['reject', 'dibatalkan'])
        ->groupBy('users.divisi_id', 'users.org_unit_id', 'org_divisi.nama_divisi', 'org_unit.nama_unit_organisasi');

        if ($year) $donasiCabangQuery->whereYear('tickets.created_at', $year);
        if ($month) $donasiCabangQuery->whereMonth('tickets.created_at', $month);

        $donasiPerCabang = $donasiCabangQuery->get()->map(function ($item) {
            $divisiName = $item->nama_divisi ?? 'Tanpa Divisi';
            $unitName = $item->nama_unit_organisasi;
            $namaCabang = $unitName ? $divisiName . ' - ' . $unitName : $divisiName;

            return [
                'identifier' => ($item->divisi_id ?? 'null') . '_' . ($item->org_unit_id ?? 'null'),
                'divisi_id' => $item->divisi_id,
                'org_unit_id' => $item->org_unit_id,
                'nama_cabang' => $namaCabang,
                'total_donasi' => (float) $item->total_donasi,
                'total_transaksi' => (int) $item->total_transaksi,
            ];
        })->sortByDesc('total_donasi')->values();

        // ── Campaign Progress ──
        $campaigns = Campaign::where('is_active', true)->orderBy('nama_campaign')->get();
        $campaignProgress = $campaigns->map(function ($campaign) {
            $terkumpul = Record::where('campaign_id', $campaign->id)
                ->whereNotIn('status', ['reject', 'dibatalkan'])
                ->sum('jumlah_donasi') ?? 0;
            return [
                'id' => $campaign->id,
                'nama_campaign' => $campaign->nama_campaign,
                'target_dana' => (float) $campaign->target_dana,
                'terkumpul' => (float) $terkumpul,
                'persentase' => $campaign->target_dana > 0 ? min(100, round(($terkumpul / $campaign->target_dana) * 100, 2)) : 0,
            ];
        });

        return Inertia::render('Admin/Dashboard/Index', [
            'totalDonasi' => $totalDonasi,
            'totalTransaksi' => $totalTransaksi,
            'totalDonatur' => $totalDonatur,
            'fundraiserAktif' => $fundraiserAktif,
            'monthlyTrend' => $monthlyTrend,
            'distribusiMetode' => $distribusiMetode,
            'topFundraiser' => $topFundraiser,
            'topDonatur' => $topDonatur,
            'riwayatTransaksi' => $riwayatTransaksi,
            'followUpTickets' => $followUpTickets,
            'donasiPerCabang' => $donasiPerCabang,
            'campaignProgress' => $campaignProgress,
            'filters' => ['month' => $month, 'year' => $year],
        ]);
    }

    public function getDonaturByCabang(Request $request, $divisiId = null, $orgUnitId = null)
    {
        $month = $request->input('month', date('n'));
        $year = $request->input('year', date('Y'));

        $query = Record::select(
                'tickets.id',
                'tickets.jumlah_donasi',
                'tickets.form_data',
                'donaturs.nama_lengkap as nama_donatur_rel'
            )
            ->leftJoin('users', 'tickets.user_id', '=', 'users.id')
            ->leftJoin('donaturs', 'tickets.donatur_id', '=', 'donaturs.id')
            ->whereNotIn('tickets.status', ['reject', 'dibatalkan'])
            ->where('tickets.jumlah_donasi', '>', 0);

        if ($divisiId === 'null' || $divisiId === null) {
            $query->whereNull('users.divisi_id');
        } else {
            $query->where('users.divisi_id', $divisiId);
        }

        if ($orgUnitId === 'null' || $orgUnitId === null) {
            $query->whereNull('users.org_unit_id');
        } else {
            $query->where('users.org_unit_id', $orgUnitId);
        }

        if ($year) $query->whereYear('tickets.created_at', $year);
        if ($month) $query->whereMonth('tickets.created_at', $month);

        $records = $query->get();

        // Cari ID field yang berhubungan dengan donatur untuk fallback data lama
        $donaturFieldIds = \App\Models\FormField::where('tipe_field', 'donatur_lookup')
            ->orWhere('label', 'like', '%donatur%')
            ->orWhere('label', 'like', '%nama%')
            ->pluck('id')
            ->map(fn($id) => (string)$id)
            ->toArray();

        $grouped = [];

        foreach ($records as $record) {
            $namaDonatur = $record->nama_donatur_rel;

            if (empty($namaDonatur)) {
                $formData = is_string($record->form_data) ? json_decode($record->form_data, true) : $record->form_data;
                $foundName = null;
                
                if (is_array($formData)) {
                    foreach ($donaturFieldIds as $fieldId) {
                        if (!empty($formData[$fieldId])) {
                            // Pastikan bukan ID angka (karena jika angka, itu referensi ke donaturs yang mungkin terhapus)
                            if (!is_numeric($formData[$fieldId])) {
                                $foundName = $formData[$fieldId];
                                break;
                            }
                        }
                    }
                }
                
                $namaDonatur = $foundName ?: 'Hamba Allah';
            }

            if (!isset($grouped[$namaDonatur])) {
                $grouped[$namaDonatur] = [
                    'nama_donatur' => $namaDonatur,
                    'total_donasi' => 0,
                    'total_transaksi' => 0,
                ];
            }

            $grouped[$namaDonatur]['total_donasi'] += (float) $record->jumlah_donasi;
            $grouped[$namaDonatur]['total_transaksi'] += 1;
        }

        $donaturList = collect(array_values($grouped))->sortByDesc('total_donasi')->values()->all();

        return response()->json($donaturList);
    }
}
