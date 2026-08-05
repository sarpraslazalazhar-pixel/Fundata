<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Record;
use App\Models\Unit;
use App\Models\SubUnit;
use App\Models\OrgDivisi;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class LaporanDataController extends Controller
{
    public function index(Request $request)
    {
        // Filters
        $year = $request->input('year', date('Y'));
        $month = $request->input('month');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $unitId = $request->input('unit_id');
        $subUnitId = $request->input('sub_unit_id');
        $status = $request->input('status');
        $divisiId = $request->input('divisi_id');

        // References for Dropdowns
        $units = Unit::where('aktif', true)->orderBy('nama_unit')->get();
        $subUnits = $unitId ? SubUnit::where('unit_id', $unitId)->orderBy('nama_layanan')->get() : [];
        $divisiList = OrgDivisi::orderBy('nama_divisi')->get();

        // Base Query with Filters
        $baseQuery = Record::query();

        if ($dateFrom && $dateTo) {
            $baseQuery->whereBetween('tickets.created_at', [$dateFrom . ' 00:00:00', $dateTo . ' 23:59:59']);
        } else {
            if ($year) $baseQuery->whereYear('tickets.created_at', $year);
            if ($month) $baseQuery->whereMonth('tickets.created_at', $month);
        }

        if ($unitId) {
            $baseQuery->whereHas('subUnit', function ($q) use ($unitId) {
                $q->where('unit_id', $unitId);
            });
        }
        if ($subUnitId) {
            $baseQuery->where('tickets.sub_unit_id', $subUnitId);
        }
        if ($status) {
            // handle array of status or single string
            if (is_array($status)) {
                $baseQuery->whereIn('tickets.status', $status);
            } else {
                $baseQuery->where('tickets.status', $status);
            }
        }
        if ($divisiId) {
            $baseQuery->whereHas('user', function ($q) use ($divisiId) {
                $q->where('divisi_id', $divisiId);
            });
        }

        // 1. Status Counts
        $statusAggregates = (clone $baseQuery)->selectRaw('
            COUNT(*) as total_tickets,
            SUM(CASE WHEN status = "open" THEN 1 ELSE 0 END) as open_count,
            SUM(CASE WHEN status = "on_proses" THEN 1 ELSE 0 END) as on_proses_count,
            SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as pending_count,
            SUM(CASE WHEN status IN ("solve", "selesai") THEN 1 ELSE 0 END) as solve_count,
            SUM(CASE WHEN status = "reject" THEN 1 ELSE 0 END) as reject_count,
            SUM(CASE WHEN status = "dibatalkan" THEN 1 ELSE 0 END) as dibatalkan_count,
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
            'dibatalkan' => (int) ($statusAggregates->dibatalkan_count ?? 0),
        ];

        $totalDonasi = (float) ($statusAggregates->total_donasi ?? 0);
        $totalDonatur = (int) ($statusAggregates->total_donatur ?? 0);



        // 3. ECharts Data: Trend Bulanan (Based on filters, grouped by month)
        $monthlyRaw = (clone $baseQuery)->selectRaw('MONTH(tickets.created_at) as bulan, COUNT(*) as total')
            ->groupBy('bulan')
            ->get();
        $monthlyTrend = collect(range(1, 12))->map(function ($b) use ($monthlyRaw) {
            return [
                'bulan' => date('M', mktime(0, 0, 0, $b, 1)),
                'total' => $monthlyRaw->firstWhere('bulan', $b)?->total ?? 0
            ];
        });

        // 4. ECharts Data: Distribusi Tiket per Unit/Sub-Unit
        $ticketsByUnitRaw = (clone $baseQuery)->selectRaw('sub_units.unit_id, units.nama_unit, COUNT(tickets.id) as total')
            ->join('sub_units', 'tickets.sub_unit_id', '=', 'sub_units.id')
            ->join('units', 'sub_units.unit_id', '=', 'units.id')
            ->groupBy('sub_units.unit_id', 'units.nama_unit')
            ->get();
        
        $ticketsByUnit = $ticketsByUnitRaw->map(function($item) {
            return [
                'name' => $item->nama_unit,
                'value' => $item->total,
            ];
        });

        // 5. ECharts Data: Top 5 Divisi Pengaju
        $topDivisiData = (clone $baseQuery)->selectRaw('org_divisi.nama_divisi, COUNT(tickets.id) as total')
            ->join('users', 'tickets.user_id', '=', 'users.id')
            ->join('org_divisi', 'users.divisi_id', '=', 'org_divisi.id')
            ->groupBy('users.divisi_id', 'org_divisi.nama_divisi')
            ->orderByDesc('total')
            ->limit(5)
            ->get()->map(function($item) {
                return [
                    'name' => $item->nama_divisi ?? 'Unknown',
                    'value' => $item->total
                ];
            });

        // 5b. List Tiket By Status & By Layanan (Old Cards)
        $ticketsByStatus = (clone $baseQuery)->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->get();

        $ticketsByLayanan = (clone $baseQuery)->selectRaw('sub_units.nama_layanan as layanan, count(tickets.id) as count')
            ->join('sub_units', 'tickets.sub_unit_id', '=', 'sub_units.id')
            ->groupBy('sub_units.id', 'sub_units.nama_layanan')
            ->orderByDesc('count')
            ->get();

        // 6. Paginated Tickets Data
        $records = (clone $baseQuery)->with(['user.divisi', 'subUnit.unit', 'donatur'])
            ->latest('tickets.created_at')
            ->paginate(15, ['*'], 'page')
            ->withQueryString();

        // 7. Paginated Donatur Data
        $donaturList = (clone $baseQuery)
            ->join('donaturs', 'tickets.donatur_id', '=', 'donaturs.id')
            ->selectRaw('donaturs.nama_lengkap as nama_donatur, count(tickets.id) as total_transaksi, sum(tickets.jumlah_donasi) as total_rupiah')
            ->whereNotNull('tickets.donatur_id')
            ->whereNotIn('tickets.status', ['reject', 'dibatalkan'])
            ->groupBy('donaturs.id', 'donaturs.nama_lengkap')
            ->orderByDesc('total_rupiah')
            ->paginate(15, ['*'], 'donatur_page')
            ->withQueryString();

        return Inertia::render('Admin/Laporan/Data', [
            'filters' => [
                'year' => $year,
                'month' => $month,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'unit_id' => $unitId,
                'sub_unit_id' => $subUnitId,
                'status' => $status,
                'divisi_id' => $divisiId,
            ],
            'units' => $units,
            'subUnits' => $subUnits,
            'divisiList' => $divisiList,
            'totalTickets' => $totalTickets,
            'statusCounts' => $statusCounts,
            'monthlyTrend' => $monthlyTrend,
            'ticketsByUnit' => $ticketsByUnit,
            'topDivisiData' => $topDivisiData,
            'ticketsByStatus' => $ticketsByStatus,
            'ticketsByLayanan' => $ticketsByLayanan,
            'totalDonasi' => $totalDonasi,
            'totalDonatur' => $totalDonatur,
            'records' => $records,
            'donaturList' => $donaturList,
        ]);
    }

    public function export(Request $request)
    {
        $year = $request->input('year');
        $month = $request->input('month');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $unitId = $request->input('unit_id');
        $subUnitId = $request->input('sub_unit_id');
        $status = $request->input('status');
        $divisiId = $request->input('divisi_id');

        $baseQuery = Record::query()->with(['user.divisi', 'subUnit.unit', 'donatur']);

        if ($dateFrom && $dateTo) {
            $baseQuery->whereBetween('tickets.created_at', [$dateFrom . ' 00:00:00', $dateTo . ' 23:59:59']);
        } else {
            if ($year) $baseQuery->whereYear('tickets.created_at', $year);
            if ($month) $baseQuery->whereMonth('tickets.created_at', $month);
        }

        if ($unitId) {
            $baseQuery->whereHas('subUnit', function ($q) use ($unitId) {
                $q->where('unit_id', $unitId);
            });
        }
        if ($subUnitId) {
            $baseQuery->where('tickets.sub_unit_id', $subUnitId);
        }
        if ($status) {
            if (is_array($status)) {
                $baseQuery->whereIn('tickets.status', $status);
            } else {
                $baseQuery->where('tickets.status', $status);
            }
        }
        if ($divisiId) {
            $baseQuery->whereHas('user', function ($q) use ($divisiId) {
                $q->where('divisi_id', $divisiId);
            });
        }

        $records = $baseQuery->orderBy('tickets.created_at', 'desc')->get();

        // Cari semua kunci dinamis dari form_data
        $dynamicKeys = [];
        foreach ($records as $record) {
            $formData = is_string($record->form_data) ? json_decode($record->form_data, true) : $record->form_data;
            if (is_array($formData)) {
                foreach (array_keys($formData) as $key) {
                    if (!in_array($key, $dynamicKeys)) {
                        $dynamicKeys[] = $key;
                    }
                }
            }
        }

        $headers = array_merge([
            'Nomor Data',
            'Tanggal Input',
            'Cabang / Divisi',
            'Nama Amil',
            'Nama Donatur',
            'Nominal Donasi (Rp)',
            'Layanan',
            'Status'
        ], $dynamicKeys);

        $callback = function() use ($records, $headers, $dynamicKeys) {
            $file = fopen('php://output', 'w');
            // Menambahkan BOM untuk UTF-8 agar Excel bisa membacanya dengan baik
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            fputcsv($file, $headers);

            foreach ($records as $record) {
                $formData = is_string($record->form_data) ? json_decode($record->form_data, true) : $record->form_data;
                if (!is_array($formData)) $formData = [];

                $row = [
                    $record->ticket_number,
                    $record->created_at->format('Y-m-d H:i:s'),
                    $record->user->divisi->nama_divisi ?? '-',
                    $record->user->name ?? $record->user->username ?? '-',
                    $record->donatur->nama_lengkap ?? '-',
                    $record->jumlah_donasi ?? 0,
                    $record->subUnit->nama_layanan ?? '-',
                    $record->status,
                ];

                foreach ($dynamicKeys as $key) {
                    $val = $formData[$key] ?? '';
                    if (is_array($val)) {
                        $val = implode(', ', $val);
                    }
                    $row[] = $val;
                }

                fputcsv($file, $row);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="Laporan_Data_' . date('Y-m-d_H-i-s') . '.csv"',
        ]);
    }
}

