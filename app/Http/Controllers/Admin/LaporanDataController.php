<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Record;
use App\Models\Unit;
use App\Models\SubUnit;
use App\Models\OrgDivisi;
use App\Models\User;
use App\Models\Campaign;
use App\Models\PaymentMethod;
use App\Models\FormField;

class LaporanDataController extends Controller
{
    private function applyFilters($baseQuery, Request $request, $defaultYear = false)
    {
        $year = $defaultYear ? $request->input('year', date('Y')) : $request->input('year');
        $month = $request->input('month');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $unitId = $request->input('unit_id');
        $subUnitId = $request->input('sub_unit_id');
        $status = $request->input('status');
        $divisiId = $request->input('divisi_id');
        $donaturSearch = $request->input('donatur_search');
        $jumlahMin = $request->input('jumlah_min');
        $jumlahMax = $request->input('jumlah_max');
        $fundraiserId = $request->input('fundraiser_id');
        $campaignId = $request->input('campaign_id');
        $metodeBayarId = $request->input('metode_bayar');

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
        if ($donaturSearch) {
            $baseQuery->whereHas('donatur', function ($q) use ($donaturSearch) {
                $q->where('nama_lengkap', 'like', '%' . $donaturSearch . '%');
            });
        }
        if ($jumlahMin !== null && $jumlahMin !== '') {
            $baseQuery->where('tickets.jumlah_donasi', '>=', $jumlahMin);
        }
        if ($jumlahMax !== null && $jumlahMax !== '') {
            $baseQuery->where('tickets.jumlah_donasi', '<=', $jumlahMax);
        }
        if ($fundraiserId) {
            $baseQuery->where('tickets.user_id', $fundraiserId);
        }
        if ($campaignId) {
            $baseQuery->where('tickets.campaign_id', $campaignId);
        }
        if ($metodeBayarId) {
            $metodeFieldIds = FormField::where('tipe_field', 'metode_bayar')->pluck('id');
            if ($metodeFieldIds->isNotEmpty()) {
                $baseQuery->where(function ($q) use ($metodeFieldIds, $metodeBayarId) {
                    foreach ($metodeFieldIds as $fid) {
                        $q->orWhereJsonContains('tickets.form_data', [(string) $fid => (string) $metodeBayarId]);
                        $q->orWhereJsonContains('tickets.form_data', [(string) $fid => (int) $metodeBayarId]);
                    }
                });
            }
        }

        return [
            'year' => $year,
            'month' => $month,
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'unit_id' => $unitId,
            'sub_unit_id' => $subUnitId,
            'status' => $status,
            'divisi_id' => $divisiId,
            'donatur_search' => $donaturSearch,
            'jumlah_min' => $jumlahMin,
            'jumlah_max' => $jumlahMax,
            'fundraiser_id' => $fundraiserId,
            'campaign_id' => $campaignId,
            'metode_bayar' => $metodeBayarId,
        ];
    }

    private function resolveMetodeId(array $formData, array $metodeFieldIds)
    {
        foreach ($metodeFieldIds as $fid) {
            if (isset($formData[$fid]) && $formData[$fid] !== null && $formData[$fid] !== '') {
                return $formData[$fid];
            }
        }
        return null;
    }

    public function index(Request $request)
    {
        $baseQuery = Record::query();
        $filters = $this->applyFilters($baseQuery, $request, true);

        // References for Dropdowns
        $units = Unit::where('aktif', true)->orderBy('nama_unit')->get();
        $subUnits = $filters['unit_id'] ? SubUnit::where('unit_id', $filters['unit_id'])->orderBy('nama_layanan')->get() : [];
        $divisiList = OrgDivisi::orderBy('nama_divisi')->get();
        $userList = User::orderBy('name')->get(['id', 'name', 'username']);
        $campaignList = Campaign::orderBy('nama_campaign')->get(['id', 'nama_campaign']);
        $paymentMethodList = PaymentMethod::orderBy('nama_bank')->get(['id', 'nama_bank', 'nomor_rekening', 'kategori']);

        $metodeFieldIds = FormField::where('tipe_field', 'metode_bayar')->pluck('id')->toArray();
        $paymentMethodMap = PaymentMethod::all()->keyBy('id');

        // 1. KPI Cards
        $kpi = (clone $baseQuery)->selectRaw('
            COUNT(*) as total_transaksi,
            COALESCE(SUM(CASE WHEN status NOT IN ("reject", "dibatalkan") THEN jumlah_donasi ELSE 0 END), 0) as total_donasi,
            COUNT(CASE WHEN status NOT IN ("reject", "dibatalkan") AND donatur_id IS NOT NULL THEN 1 END) as total_donatur
        ')->first();

        $totalTransaksi = (int) ($kpi->total_transaksi ?? 0);
        $totalDonasi = (float) ($kpi->total_donasi ?? 0);
        $totalDonatur = (int) ($kpi->total_donatur ?? 0);
        $fundraiserAktif = (clone $baseQuery)
            ->whereNotIn('tickets.status', ['reject', 'dibatalkan'])
            ->distinct()
            ->count('tickets.user_id');

        // 2. Tren Donasi per Bulan (Nominal Rp)
        $monthlyRaw = (clone $baseQuery)
            ->whereNotIn('tickets.status', ['reject', 'dibatalkan'])
            ->selectRaw('MONTH(tickets.created_at) as bulan, COALESCE(SUM(tickets.jumlah_donasi), 0) as total_nominal')
            ->groupBy('bulan')
            ->get();
        $monthlyTrend = collect(range(1, 12))->map(function ($b) use ($monthlyRaw) {
            return [
                'bulan' => date('M', mktime(0, 0, 0, $b, 1)),
                'total' => (float) ($monthlyRaw->firstWhere('bulan', $b)?->total_nominal ?? 0)
            ];
        });

        // 3. Distribusi Transaksi per Unit
        $ticketsByUnitRaw = (clone $baseQuery)->selectRaw('sub_units.unit_id, units.nama_unit, COUNT(tickets.id) as total')
            ->join('sub_units', 'tickets.sub_unit_id', '=', 'sub_units.id')
            ->join('units', 'sub_units.unit_id', '=', 'units.id')
            ->groupBy('sub_units.unit_id', 'units.nama_unit')
            ->get();

        $ticketsByUnit = $ticketsByUnitRaw->map(function ($item) {
            return [
                'name' => $item->nama_unit,
                'value' => $item->total,
            ];
        });

        // 4. Paginated Records (Histori Transaksi)
        $records = (clone $baseQuery)->with(['user.divisi', 'subUnit.unit', 'donatur', 'campaign'])
            ->latest('tickets.created_at')
            ->paginate(15, ['*'], 'page')
            ->withQueryString();

        $records->getCollection()->transform(function ($record) use ($metodeFieldIds, $paymentMethodMap) {
            $mid = $this->resolveMetodeId($record->form_data ?? [], $metodeFieldIds);
            $record->metode_pembayaran = $mid !== null && isset($paymentMethodMap[$mid])
                ? $paymentMethodMap[$mid]->nama_bank
                : null;
            return $record;
        });

        // 5. Paginated Donatur Data
        $donaturList = (clone $baseQuery)
            ->join('donaturs', 'tickets.donatur_id', '=', 'donaturs.id')
            ->selectRaw('donaturs.nama_lengkap as nama_donatur, count(tickets.id) as total_transaksi, sum(tickets.jumlah_donasi) as total_rupiah')
            ->whereNotNull('tickets.donatur_id')
            ->whereNotIn('tickets.status', ['reject', 'dibatalkan'])
            ->groupBy('donaturs.id', 'donaturs.nama_lengkap')
            ->orderByDesc('total_rupiah')
            ->paginate(15, ['*'], 'donatur_page')
            ->withQueryString();

        // 6. Paginated Kinerja Fundraiser
        $fundraiserStats = (clone $baseQuery)
            ->whereNotIn('tickets.status', ['reject', 'dibatalkan'])
            ->selectRaw('tickets.user_id, users.name, users.username, org_divisi.nama_divisi as divisi,
                COUNT(tickets.id) as total_transaksi,
                COALESCE(SUM(tickets.jumlah_donasi), 0) as total_nominal,
                COUNT(DISTINCT tickets.donatur_id) as total_donatur')
            ->join('users', 'tickets.user_id', '=', 'users.id')
            ->leftJoin('org_divisi', 'users.divisi_id', '=', 'org_divisi.id')
            ->groupBy('tickets.user_id', 'users.name', 'users.username', 'org_divisi.nama_divisi')
            ->orderByDesc('total_nominal')
            ->paginate(15, ['*'], 'fundraiser_page')
            ->withQueryString();

        return Inertia::render('Admin/Laporan/Data', [
            'filters' => $filters,
            'units' => $units,
            'subUnits' => $subUnits,
            'divisiList' => $divisiList,
            'userList' => $userList,
            'campaignList' => $campaignList,
            'paymentMethodList' => $paymentMethodList,
            'totalDonasi' => $totalDonasi,
            'totalTransaksi' => $totalTransaksi,
            'totalDonatur' => $totalDonatur,
            'fundraiserAktif' => $fundraiserAktif,
            'monthlyTrend' => $monthlyTrend,
            'ticketsByUnit' => $ticketsByUnit,
            'records' => $records,
            'donaturList' => $donaturList,
            'fundraiserStats' => $fundraiserStats,
        ]);
    }

    public function export(Request $request)
    {
        $baseQuery = Record::query()->with(['user.divisi', 'subUnit.unit', 'donatur', 'campaign']);
        $this->applyFilters($baseQuery, $request);

        $records = $baseQuery->orderBy('tickets.created_at', 'desc')->get();

        $metodeFieldIds = FormField::where('tipe_field', 'metode_bayar')->pluck('id')->toArray();
        $paymentMethodMap = PaymentMethod::all()->keyBy('id');

        // Cari semua kunci dinamis dari form_data (kecuali field metode bayar)
        $dynamicKeys = [];
        foreach ($records as $record) {
            $formData = is_string($record->form_data) ? json_decode($record->form_data, true) : $record->form_data;
            if (is_array($formData)) {
                foreach (array_keys($formData) as $key) {
                    if (!in_array($key, $metodeFieldIds) && !in_array($key, $dynamicKeys)) {
                        $dynamicKeys[] = $key;
                    }
                }
            }
        }

        $headers = array_merge([
            'Nomor Data',
            'Tanggal Transaksi',
            'Cabang / Divisi',
            'Fundraiser',
            'Nama Donatur',
            'Nominal Donasi (Rp)',
            'Jenis Donasi',
            'Campaign',
            'Metode Pembayaran',
            'Status'
        ], $dynamicKeys);

        $callback = function () use ($records, $headers, $dynamicKeys, $metodeFieldIds, $paymentMethodMap) {
            $file = fopen('php://output', 'w');
            fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));
            fputcsv($file, $headers);

            foreach ($records as $record) {
                $formData = is_string($record->form_data) ? json_decode($record->form_data, true) : $record->form_data;
                if (!is_array($formData)) $formData = [];

                $mid = $this->resolveMetodeId($formData, $metodeFieldIds);

                $row = [
                    $record->formatted_id,
                    $record->created_at->format('Y-m-d H:i:s'),
                    $record->user->divisi->nama_divisi ?? '-',
                    $record->user->name ?? $record->user->username ?? '-',
                    $record->donatur->nama_lengkap ?? '-',
                    $record->jumlah_donasi ?? 0,
                    $record->subUnit->nama_layanan ?? '-',
                    $record->campaign->nama_campaign ?? '-',
                    $mid !== null && isset($paymentMethodMap[$mid]) ? $paymentMethodMap[$mid]->nama_bank : '-',
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
