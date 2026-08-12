<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Record;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class VoidController extends Controller
{
    private array $approvedStatuses;

    public function __construct()
    {
        // ponytail: approved voids = sudah disetujui manajer dan belum dibatalkan/ditolak
        $this->approvedStatuses = ['open', 'on_proses', 'pending', 'solve', 'need_revision', 'waiting_approval'];
    }

    public function index(Request $request)
    {
        $month = $request->input('month', '');
        $year = $request->input('year', '');
        $statusFilter = $request->input('status', 'all');

        $baseQuery = Record::withoutEagerLoads()->where('nominal_void', '>', 0);
        if ($year) $baseQuery->whereYear('created_at', $year);
        if ($month) $baseQuery->whereMonth('created_at', $month);

        $approvedQuery = (clone $baseQuery)->whereIn('status', $this->approvedStatuses);

        // ── KPI ──
        $kpi = (clone $approvedQuery)->selectRaw('
            COUNT(*) as total_transaksi,
            COALESCE(SUM(nominal_void), 0) as total_nominal
        ')->first();

        $totalNominalVoid = (float) ($kpi->total_nominal ?? 0);
        $totalTransaksiVoid = (int) ($kpi->total_transaksi ?? 0);
        $menungguPersetujuan = (clone $baseQuery)->where('status', 'menunggu_manager')->count();
        $fundraiserVoidAktif = (clone $approvedQuery)->distinct()->count('user_id');

        // ── List Fundraiser (approved only) ──
        $fundraisersQuery = DB::table('tickets')
            ->join('users', 'tickets.user_id', '=', 'users.id')
            ->select(
                'users.id',
                'users.username',
                'users.name',
                DB::raw('COUNT(*) as total_tiket'),
                DB::raw('SUM(tickets.nominal_void) as total_nominal_void')
            )
            ->where('tickets.nominal_void', '>', 0)
            ->whereIn('tickets.status', $this->approvedStatuses);

        if ($year) $fundraisersQuery->whereYear('tickets.created_at', $year);
        if ($month) $fundraisersQuery->whereMonth('tickets.created_at', $month);

        $fundraisers = $fundraisersQuery->groupBy('users.id', 'users.username', 'users.name')
            ->orderByDesc('total_nominal_void')
            ->paginate(10)
            ->withQueryString();

        // ── List Tiket Void ──
        $ticketsQuery = Record::with(['user.divisi', 'unit', 'subUnit', 'donatur'])
            ->where('nominal_void', '>', 0);

        if ($year) $ticketsQuery->whereYear('created_at', $year);
        if ($month) $ticketsQuery->whereMonth('created_at', $month);

        if ($statusFilter === 'menunggu') {
            $ticketsQuery->where('status', 'menunggu_manager');
        } elseif ($statusFilter === 'approved') {
            $ticketsQuery->whereIn('status', $this->approvedStatuses);
        } elseif ($statusFilter === 'rejected') {
            $ticketsQuery->where('status', 'reject');
        }

        $tickets = $ticketsQuery->latest()->paginate(10)->withQueryString();

        return Inertia::render('Admin/Void/Index', [
            'voidStats' => [
                'totalNominalVoid' => $totalNominalVoid,
                'totalTransaksiVoid' => $totalTransaksiVoid,
                'menungguPersetujuan' => $menungguPersetujuan,
                'fundraiserVoidAktif' => $fundraiserVoidAktif,
            ],
            'fundraisers' => $fundraisers,
            'tickets' => $tickets,
            'filters' => [
                'month' => $month,
                'year' => $year,
                'status' => $statusFilter,
            ],
        ]);
    }
}