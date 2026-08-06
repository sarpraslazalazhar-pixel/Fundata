<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Record;
use App\Models\User;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Models\Campaign;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $userId = $user->id;
        $orgUnitId = $user->org_unit_id;
        
        $period = $request->input('period', 'bulan_ini');

        $query = Record::query();
        $queryLeaderboard = Record::query();
        
        $now = Carbon::now();
        $startDate = null;
        $endDate = null;
        $trendFormat = 'day'; // 'day' or 'month'

        if ($period === 'bulan_ini') {
            $startDate = $now->copy()->startOfMonth();
            $endDate = $now->copy()->endOfMonth();
        } elseif ($period === 'bulan_lalu') {
            $startDate = $now->copy()->subMonth()->startOfMonth();
            $endDate = $now->copy()->subMonth()->endOfMonth();
        } elseif ($period === 'tahun_ini') {
            $startDate = $now->copy()->startOfYear();
            $endDate = $now->copy()->endOfYear();
            $trendFormat = 'month';
        }

        if ($startDate && $endDate) {
            $query->whereBetween('created_at', [$startDate, $endDate]);
            $queryLeaderboard->whereBetween('created_at', [$startDate, $endDate]);
        }

        // --- Metrik Pribadi ---
        $personalRecords = (clone $query)->where('user_id', $userId)->get();
        $totalDonasi = $personalRecords->sum('jumlah_donasi');
        $totalData = $personalRecords->count();

        // --- Leaderboard Cabang ---
        $leaderboard = [];
        $peringkat = null;
        $totalOrangCabang = 0;
        
        if ($orgUnitId) {
            // Ambil semua records dari user di cabang yang sama
            $branchUserIds = User::where('org_unit_id', $orgUnitId)->pluck('id');
            $totalOrangCabang = $branchUserIds->count();
            
            $branchRecords = (clone $queryLeaderboard)
                ->whereIn('user_id', $branchUserIds)
                ->select('user_id', DB::raw('SUM(jumlah_donasi) as total_donasi'), DB::raw('COUNT(id) as total_data'))
                ->groupBy('user_id')
                ->orderBy('total_donasi', 'desc')
                ->with('user:id,name,username')
                ->get();
                
            $rank = 1;
            foreach ($branchRecords as $record) {
                if ($record->user_id == $userId) {
                    $peringkat = $rank;
                }
                $rank++;
            }
            
            // Limit top 5
            $leaderboard = $branchRecords->take(5);
        }

        // --- Tren Donasi ---
        $trenQuery = (clone $query)->where('user_id', $userId);
        
        if ($trendFormat === 'month') {
            // Group by month
            $trenDonasi = $trenQuery->select(
                DB::raw('MONTH(created_at) as period'),
                DB::raw('SUM(jumlah_donasi) as total_donasi'),
                DB::raw('COUNT(id) as total_data')
            )->groupBy('period')->get()->map(function($item) {
                return [
                    'label' => Carbon::create()->month($item->period)->translatedFormat('M'),
                    'total_donasi' => $item->total_donasi,
                    'total_data' => $item->total_data,
                ];
            });
        } else {
            // Group by day
            $trenDonasi = $trenQuery->select(
                DB::raw('DATE(created_at) as period'),
                DB::raw('SUM(jumlah_donasi) as total_donasi'),
                DB::raw('COUNT(id) as total_data')
            )->groupBy('period')->get()->map(function($item) {
                return [
                    'label' => Carbon::parse($item->period)->format('d M'),
                    'total_donasi' => $item->total_donasi,
                    'total_data' => $item->total_data,
                ];
            });
        }

        // Data existing (Stats & Recent)
        $recentTickets = Record::where('user_id', $userId)
            ->with(['subUnit:id,nama_layanan'])
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        $ticketCounts = Record::where('user_id', $userId)
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status')
            ->mapWithKeys(fn ($item, $key) => [strtolower($key) => $item]);

        $stats = [
            'aktif' => collect($ticketCounts)->except(['solve', 'selesai', 'reject', 'dibatalkan'])->sum(),
            'diproses' => $ticketCounts['on_proses'] ?? 0,
            'selesai' => ($ticketCounts['solve'] ?? 0) + ($ticketCounts['selesai'] ?? 0),
            'ditolak' => $ticketCounts['reject'] ?? 0,
        ];

        // ── Campaign Progress ──
        $campaigns = Campaign::where('is_active', true)->orderBy('nama_campaign')->get();
        $campaignProgress = $campaigns->map(function($campaign) {
            $terkumpul = Record::where('campaign_id', $campaign->id)
                ->whereNotIn('status', ['reject', 'dibatalkan'])
                ->sum('jumlah_donasi') ?? 0;
            return [
                'id' => $campaign->id,
                'nama_campaign' => $campaign->nama_campaign,
                'deskripsi' => $campaign->deskripsi,
                'banner_url' => $campaign->banner_url,
                'tgl_mulai' => $campaign->tgl_mulai ? $campaign->tgl_mulai->format('Y-m-d') : null,
                'tgl_selesai' => $campaign->tgl_selesai ? $campaign->tgl_selesai->format('Y-m-d') : null,
                'target_dana' => (float) $campaign->target_dana,
                'terkumpul' => (float) $terkumpul,
                'persentase' => $campaign->target_dana > 0 ? min(100, round(($terkumpul / $campaign->target_dana) * 100, 2)) : 0,
            ];
        });

        // ── Akad Progress ──
        $akads = \App\Models\Akad::where('is_show_on_dashboard', true)->orderBy('nama_akad')->get();
        $akadProgress = $akads->map(function($akad) {
            $terkumpul = Record::where('akad_id', $akad->id)
                ->whereNotIn('status', ['reject', 'dibatalkan'])
                ->sum('jumlah_donasi') ?? 0;
            return [
                'id' => $akad->id,
                'nama_akad' => $akad->nama_akad,
                'banner_url' => $akad->banner_url,
                'target_dana' => (float) ($akad->target_dana ?? 0),
                'terkumpul' => (float) $terkumpul,
                'persentase' => ($akad->target_dana && $akad->target_dana > 0) ? min(100, round(($terkumpul / $akad->target_dana) * 100, 2)) : 0,
            ];
        });

        return inertia('User/Dashboard', [
            'recentTickets' => $recentTickets,
            'stats' => $stats,
            'totalDonasi' => $totalDonasi,
            'totalData' => $totalData,
            'peringkat' => $peringkat,
            'totalOrangCabang' => $totalOrangCabang,
            'leaderboard' => $leaderboard,
            'trenDonasi' => $trenDonasi,
            'filters' => ['period' => $period],
            'trendFormat' => $trendFormat,
            'campaignProgress' => $campaignProgress,
            'akadProgress' => $akadProgress,
        ]);
    }
}


