<?php

namespace App\Http\Controllers\Admin;

use App\Exports\LogAuditExport;
use App\Http\Controllers\Controller;
use App\Models\Akad;
use App\Models\Campaign;
use App\Models\Record;
use App\Models\RecordLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class LogAuditController extends Controller
{
    private const STATUS_LABELS = [
        'open' => 'Baru',
        'on_proses' => 'Diproses',
        'pending' => 'Tertunda',
        'solve' => 'Selesai',
        'selesai' => 'Selesai',
        'reject' => 'Ditolak',
        'dibatalkan' => 'Dibatalkan',
        'waiting_approval' => 'Menunggu Review',
        'need_revision' => 'Butuh Revisi',
    ];

    /**
     * Halaman log audit untuk satu campaign (termasuk semua transaksinya).
     */
    public function campaign(Campaign $campaign, Request $request)
    {
        return $this->renderPage(
            'campaign',
            $campaign,
            $this->baseQuery()->where('campaign_id', $campaign->id),
            'admin.master.campaigns.log-audit',
            'admin.master.campaigns.log-audit.export',
            $request
        );
    }

    /**
     * Halaman log audit untuk satu akad (termasuk akad anaknya).
     */
    public function akad(Akad $akad, Request $request)
    {
        $akadIds = $this->collectAkadIds($akad);

        return $this->renderPage(
            'akad',
            $akad,
            $this->baseQuery()->whereIn('akad_id', $akadIds),
            'admin.master.akad.log-audit',
            'admin.master.akad.log-audit.export',
            $request
        );
    }

    /**
     * Ekspor Excel log audit campaign.
     */
    public function exportCampaign(Campaign $campaign, Request $request)
    {
        return $this->export(
            $this->baseQuery()->where('campaign_id', $campaign->id),
            'log-audit-campaign-' . Str::slug($campaign->nama_campaign) . '.xlsx',
            $request
        );
    }

    /**
     * Ekspor Excel log audit akad.
     */
    public function exportAkad(Akad $akad, Request $request)
    {
        $akadIds = $this->collectAkadIds($akad);

        return $this->export(
            $this->baseQuery()->whereIn('akad_id', $akadIds),
            'log-audit-akad-' . Str::slug($akad->nama_akad) . '.xlsx',
            $request
        );
    }

    // ------------------------------------------------------------------
    // Internal
    // ------------------------------------------------------------------

    private function renderPage(string $type, $entity, $query, string $showRoute, string $exportRoute, Request $request)
    {
        $this->applyFilters($query, $request);

        $summary = [
            'total_records' => (clone $query)->count(),
            'total_nominal' => (clone $query)->sum('jumlah_donasi'),
            'total_users' => (clone $query)->distinct()->count('user_id'),
            'total_donaturs' => (clone $query)->whereNotNull('donatur_id')->distinct()->count('donatur_id'),
        ];

        $users = User::whereIn('id', (clone $query)->distinct()->pluck('user_id'))
            ->orderBy('name')
            ->get(['id', 'name', 'username']);

        $records = $query
            ->latest('created_at')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Record $record) => $this->transform($record));

        return Inertia::render('Admin/LogAudit/Show', [
            'entityType' => $type,
            'entity' => $type === 'campaign' ? $this->campaignInfo($entity) : $this->akadInfo($entity),
            'summary' => $summary,
            'records' => $records,
            'users' => $users,
            'filters' => $request->only(['status', 'user_id', 'date_from', 'date_to']),
            'pageUrl' => route($showRoute, $entity->id),
            'exportUrl' => route($exportRoute, $entity->id),
            'statusOptions' => collect(self::STATUS_LABELS)
                ->map(fn ($label, $value) => ['value' => $value, 'label' => $label])
                ->values(),
        ]);
    }

    private function export($query, string $filename, Request $request)
    {
        $this->applyFilters($query, $request);

        // ponytail: cursor mapping to avoid loading all models to memory
        $rows = $query->latest('created_at')->cursor()->map(function (Record $record) {
            $t = $this->transform($record);
            return [
                $t['created_at'] ? Carbon::parse($t['created_at'])->format('d/m/Y H:i') : '-',
                $t['user'] ? ($t['user']['name'] ?: $t['user']['username']) : '-',
                collect([$t['user']['divisi'] ?? null, $t['user']['org_unit'] ?? null])->filter()->implode(' • ') ?: '-',
                $t['donatur'] ?? '-',
                $t['jumlah_donasi'] ?? 0,
                self::STATUS_LABELS[$t['status']] ?? $t['status'],
                $t['campaign'] ?? '-',
                $t['akad'] ?? '-',
                $t['latest_log']['summary'] ?? '-',
            ];
        })->toArray();

        return Excel::download(new LogAuditExport($rows), $filename);
    }

    private function applyFilters($query, Request $request): void
    {
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }
    }

    private function baseQuery()
    {
        return Record::query()->with([
            'user:id,name,username,divisi_id,org_unit_id',
            'user.divisi:id,nama_divisi',
            'user.orgUnit:id,nama_unit_organisasi',
            'donatur:id,nama_lengkap',
            'campaign:id,nama_campaign',
            'akad:id,nama_akad',
            'logs.admin:id,name,username',
        ]);
    }

    private function transform(Record $record): array
    {
        $latestLog = $record->logs?->sortByDesc('timestamp')->first();

        return [
            'id' => $record->id,
            'formatted_id' => $record->formatted_id,
            'created_at' => $record->created_at,
            'user' => $record->user ? [
                'id' => $record->user->id,
                'name' => $record->user->name,
                'username' => $record->user->username,
                'divisi' => $record->user->divisi?->nama_divisi,
                'org_unit' => $record->user->orgUnit?->nama_unit_organisasi,
            ] : null,
            'donatur' => $record->donatur?->nama_lengkap,
            'jumlah_donasi' => $record->jumlah_donasi,
            'nominal_void' => $record->nominal_void,
            'status' => $record->status,
            'campaign' => $record->campaign?->nama_campaign,
            'akad' => $record->akad?->nama_akad,
            'latest_log' => $latestLog ? [
                'aksi' => $latestLog->aksi,
                'summary' => $this->describeLog($latestLog),
                'timestamp' => $latestLog->timestamp,
            ] : null,
        ];
    }

    private function describeLog(RecordLog $log): string
    {
        $when = $log->timestamp ? $log->timestamp->format('d/m/Y H:i') : '';
        if ($log->aksi === 'dibuat') {
            return trim(($log->catatan ?: 'Data disimpan') . ' • ' . $when);
        }
        $actor = $log->admin ? ($log->admin->name ?? $log->admin->username) : null;
        $label = self::STATUS_LABELS[$log->aksi] ?? ucwords(str_replace('_', ' ', $log->aksi));
        return trim($label . ($actor ? ' oleh ' . $actor : '') . ' • ' . $when);
    }

    private function collectAkadIds(Akad $akad): array
    {
        $ids = [$akad->id];
        foreach ($akad->children as $child) {
            $ids[] = $child->id;
            foreach ($child->children as $grandChild) {
                $ids[] = $grandChild->id;
            }
        }
        return $ids;
    }

    private function campaignInfo(Campaign $campaign): array
    {
        return [
            'id' => $campaign->id,
            'nama' => $campaign->nama_campaign,
            'deskripsi' => $campaign->deskripsi,
            'target_dana' => $campaign->target_dana,
            'is_active' => $campaign->is_active,
            'tgl_mulai' => $campaign->tgl_mulai?->format('Y-m-d'),
            'tgl_selesai' => $campaign->tgl_selesai?->format('Y-m-d'),
            'banner_url' => $campaign->banner_url,
            'total_terkumpul' => (float) $campaign->records()->sum('jumlah_donasi'),
            'total_records' => $campaign->records()->count(),
        ];
    }

    private function akadInfo(Akad $akad): array
    {
        $akadIds = $this->collectAkadIds($akad);

        return [
            'id' => $akad->id,
            'nama' => $akad->nama_akad,
            'parent' => $akad->parent?->nama_akad,
            'children' => $akad->children()->pluck('nama_akad'),
            'is_campaign_required' => $akad->is_campaign_required,
            'is_active' => $akad->is_active,
            'target_dana' => $akad->target_dana,
            'banner_url' => $akad->banner_url,
            'total_terkumpul' => (float) Record::whereIn('akad_id', $akadIds)->sum('jumlah_donasi'),
            'total_records' => Record::whereIn('akad_id', $akadIds)->count(),
        ];
    }
}
