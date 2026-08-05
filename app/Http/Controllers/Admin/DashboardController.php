<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Record;
// use App\Models\TicketSlaTracking;
use App\Models\Unit;
use App\Models\RoomVehicleBooking;
use App\Models\Campaign;
use App\Models\User;
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

        $statusAggregates = (clone $baseQuery)->selectRaw('
            COUNT(*) as total_tickets,
            SUM(CASE WHEN status = "open" THEN 1 ELSE 0 END) as open_count,
            SUM(CASE WHEN status = "on_proses" THEN 1 ELSE 0 END) as on_proses_count,
            SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as pending_count,
            SUM(CASE WHEN status IN ("solve", "selesai") THEN 1 ELSE 0 END) as solve_count,
            SUM(CASE WHEN status = "reject" THEN 1 ELSE 0 END) as reject_count,
            SUM(CASE WHEN status NOT IN ("reject", "dibatalkan") THEN jumlah_donasi ELSE 0 END) as total_donasi,
            SUM(CASE WHEN status NOT IN ("reject", "dibatalkan") AND donatur_id IS NOT NULL THEN 1 ELSE 0 END) as total_donatur
        ')->first();

        $totalTickets = (int) ($statusAggregates->total_tickets ?? 0);
        $statusCounts = [
            'open' => (int) ($statusAggregates->open_count ?? 0),
            'on_proses' => (int) ($statusAggregates->on_proses_count ?? 0),
            'pending' => (int) ($statusAggregates->pending_count ?? 0),
            'solve' => (int) ($statusAggregates->solve_count ?? 0),
            'reject' => (int) ($statusAggregates->reject_count ?? 0),
        ];

        $totalDonasi = (float) ($statusAggregates->total_donasi ?? 0);
        $totalDonatur = (int) ($statusAggregates->total_donatur ?? 0);

        // ── Top 10 Amil (berdasarkan nominal donasi) ──
        $topAmilQuery = DB::table('tickets')
            ->join('users', 'tickets.user_id', '=', 'users.id')
            ->select(
                'users.username',
                'users.name',
                DB::raw('COUNT(*) as total_tiket'),
                DB::raw('SUM(tickets.jumlah_donasi) as total_donasi')
            )
            ->whereNotIn('tickets.status', ['reject', 'dibatalkan']);
            
        if ($year) $topAmilQuery->whereYear('tickets.created_at', $year);
        if ($month) $topAmilQuery->whereMonth('tickets.created_at', $month);
        
        $topAmil = $topAmilQuery->groupBy('users.id', 'users.username', 'users.name')
            ->orderByDesc('total_donasi')
            ->limit(10)
            ->get();

        $followUpTickets = Record::with(['user.divisi', 'unit', 'subUnit'])
            ->whereIn('status', ['open', 'pending'])
            ->latest()
            ->limit(10)
            ->get();

        $units = Unit::where('aktif', true)->orderBy('nama_unit')->get();
        $unitNames = $units->pluck('nama_unit', 'id');

        // Monthly chart — only if year is selected
        $monthlyChartData = [];
        if ($year) {
            $monthlyRaw = Record::selectRaw('MONTH(created_at) as bulan, unit_id, COUNT(*) as total')
                ->whereYear('created_at', $year)
                ->groupBy('bulan', 'unit_id')
                ->with('unit')
                ->get();

            $monthlyChartData = collect(range(1, 12))->map(function ($b) use ($monthlyRaw, $unitNames) {
                $row = ['bulan' => date('M', mktime(0, 0, 0, $b, 1))];
                foreach ($unitNames as $id => $name) {
                    $row[$name] = $monthlyRaw->firstWhere(fn($r) => $r->bulan == $b && $r->unit_id == $id)?->total ?? 0;
                }
                return $row;
            });
        }

        // Yearly chart — all years regardless of filter
        $yearlyRaw = Record::selectRaw('YEAR(created_at) as tahun, unit_id, COUNT(*) as total')
            ->groupBy('tahun', 'unit_id')
            ->with('unit')
            ->get();

        $yearlyChartData = $yearlyRaw
            ->groupBy('tahun')
            ->sortKeys()
            ->map(function ($items, $tahun) use ($unitNames) {
                $row = ['tahun' => (string) $tahun];
                foreach ($unitNames as $id => $name) {
                    $row[$name] = $items->firstWhere('unit_id', $id)?->total ?? 0;
                }
                return $row;
            })->values();

        // Sub unit chart — per unit + aggregate across all
        $subUnitQuery = Record::selectRaw('unit_id, sub_unit_id, COUNT(*) as total')
            ->whereNotNull('sub_unit_id');
        if ($year) $subUnitQuery->whereYear('created_at', $year);
        if ($month) $subUnitQuery->whereMonth('created_at', $month);
        $subUnitRaw = $subUnitQuery->groupBy('unit_id', 'sub_unit_id')
            ->with(['unit', 'subUnit'])
            ->get();

        $subUnitChartData = $subUnitRaw
            ->groupBy('unit_id')
            ->map(fn($items) => $items->map(fn($i) => [
                'name' => $i->subUnit?->nama_layanan ?? 'Unknown',
                'value' => $i->total,
            ])->values());

        // Add aggregate across all units
        $subUnitChartData['_all'] = $subUnitRaw
            ->groupBy('sub_unit_id')
            ->map(fn($items) => [
                'name' => $items->first()->subUnit?->nama_layanan ?? 'Unknown',
                'value' => $items->sum('total'),
            ])->values();

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


        // ── Tiket Bulanan (12 bulan terakhir) ──
        $tiketBulanan = DB::table('tickets')
            ->select(
                DB::raw("DATE_FORMAT(created_at, '%Y-%m') as bulan"),
                DB::raw('COUNT(*) as total'),
                DB::raw("SUM(CASE WHEN status IN ('Selesai', 'Solve', 'selesai', 'solve') THEN 1 ELSE 0 END) as selesai"),
                DB::raw("SUM(CASE WHEN status NOT IN ('Selesai', 'Solve', 'selesai', 'solve') THEN 1 ELSE 0 END) as aktif"),
            )
            ->where('created_at', '>=', now()->subYear())
            ->groupBy(DB::raw("DATE_FORMAT(created_at, '%Y-%m')"))
            ->orderBy('bulan')
            ->get();



        // ── Daily Chart (7 Hari Terakhir) ──
        $startDate = now()->subDays(6)->startOfDay();
        $dailyRaw = Record::selectRaw('DATE(created_at) as date, unit_id, COUNT(*) as total')
            ->where('created_at', '>=', $startDate)
            ->groupBy('date', 'unit_id')
            ->get();

        $dates = collect();
        for ($i = 6; $i >= 0; $i--) {
            $dates->push(now()->subDays($i)->format('Y-m-d'));
        }

        $dailyChartData = $dates->map(function ($dateStr) use ($dailyRaw, $unitNames) {
            $row = ['date' => $dateStr];
            foreach ($unitNames as $id => $name) {
                $row[$name] = $dailyRaw->firstWhere(fn($r) => $r->date === $dateStr && $r->unit_id === $id)?->total ?? 0;
            }
            return $row;
        });

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
        $campaignProgress = $campaigns->map(function($campaign) {
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
            'totalTickets' => $totalTickets,
            'statusCounts' => $statusCounts,
            'topAmil' => $topAmil,
            'topDonatur' => $topDonatur,
            'riwayatTransaksi' => $riwayatTransaksi,

            'tiketBulanan' => $tiketBulanan,
            'followUpTickets' => $followUpTickets,
            'monthlyChartData' => $monthlyChartData,
            'yearlyChartData' => $yearlyChartData,
            'dailyChartData' => $dailyChartData,
            'subUnitChartData' => $subUnitChartData,
            'units' => $units,
            'filters' => ['month' => $month, 'year' => $year],
            'totalDonasi' => $totalDonasi,
            'totalDonatur' => $totalDonatur,
            'donasiPerCabang' => $donasiPerCabang,
            'campaignProgress' => $campaignProgress,
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

