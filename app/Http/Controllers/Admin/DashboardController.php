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

        // ponytail: prevent global eager loads from triggering useless queries on aggregates
        $baseQuery = Record::withoutEagerLoads();
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
            // ponytail: extract JSON dynamically in DB to avoid massive PHP memory usage
            $jsonExtracts = array_map(function($fid) {
                return 'JSON_UNQUOTE(JSON_EXTRACT(form_data, \'$."' . $fid . '"\'))';
            }, $metodeFieldIds);
            
            $coalesceExpr = 'COALESCE(' . implode(', ', $jsonExtracts) . ')';
            
            $metodeRaw = clone $validBase;
            $aggregated = $metodeRaw
                ->select(\Illuminate\Support\Facades\DB::raw("{$coalesceExpr} as metode_id"), \Illuminate\Support\Facades\DB::raw('SUM(jumlah_donasi) as total_donasi'))
                ->whereRaw("{$coalesceExpr} IS NOT NULL")
                ->groupBy('metode_id')
                ->get();

            foreach ($aggregated as $row) {
                $mid = $row->metode_id;
                if (isset($paymentMethodMap[$mid])) {
                    $name = $paymentMethodMap[$mid]->nama_bank;
                    $distribusiMetode[$name] = ($distribusiMetode[$name] ?? 0) + (float) $row->total_donasi;
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

        // ponytail: avoid N+1 by using withSum
        $campaigns = Campaign::withSum(['records as terkumpul' => function($q) {
            $q->whereNotIn('status', ['reject', 'dibatalkan']);
        }], 'jumlah_donasi')->where('is_active', true)->orderBy('nama_campaign')->get();
        
        $campaignProgress = $campaigns->map(function ($campaign) {
            $terkumpul = $campaign->terkumpul ?? 0;
            return [
                'id' => $campaign->id,
                'nama_campaign' => $campaign->nama_campaign,
                'deskripsi' => $campaign->deskripsi,
                'banner_url' => $campaign->banner_url,
                'tgl_mulai' => $campaign->tgl_mulai ? $campaign->tgl_mulai->format('Y-m-d') : null,
                'tgl_selesai' => $campaign->tgl_selesai ? $campaign->tgl_selesai->format('Y-m-d') : null,
                'is_active' => $campaign->is_active,
                'target_dana' => (float) $campaign->target_dana,
                'terkumpul' => (float) $terkumpul,
                'persentase' => $campaign->target_dana > 0 ? min(100, round(($terkumpul / $campaign->target_dana) * 100, 2)) : 0,
            ];
        });

        // ── Akad Progress ──
        if (\Illuminate\Support\Facades\Schema::hasColumn('akads', 'is_show_on_dashboard')) {
            // ponytail: avoid N+1 by using withSum
            $akads = \App\Models\Akad::withSum(['records as terkumpul' => function($q) {
                $q->whereNotIn('status', ['reject', 'dibatalkan']);
            }], 'jumlah_donasi')->where('is_show_on_dashboard', true)->orderBy('nama_akad')->get();
        } else {
            $akads = collect();
        }

        $akadProgress = $akads->map(function ($akad) {
            $terkumpul = $akad->terkumpul ?? 0;
            return [
                'id' => $akad->id,
                'nama_akad' => $akad->nama_akad,
                'banner_url' => $akad->banner_url ?? null,
                'target_dana' => (float) ($akad->target_dana ?? 0),
                'terkumpul' => (float) $terkumpul,
                'persentase' => ($akad->target_dana && $akad->target_dana > 0) ? min(100, round(($terkumpul / $akad->target_dana) * 100, 2)) : 0,
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
            'akadProgress' => $akadProgress,
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

        // ponytail: lazy fix for OOM on dashboard by using LazyCollection
        $records = $query->cursor();

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
