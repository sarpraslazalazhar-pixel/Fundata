import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { DataTable } from '@/Components/DataTable';
import { Pagination } from '@/Components/Pagination';
import { StatusBadge } from '@/Components/StatusBadge';
import { Button } from '@/Components/ui/button';
import { DateRangePicker } from '@/Components/ui/date-range-picker';
import {
  ArrowLeft,
  Download,
  Receipt,
  Coins,
  Users,
  UserRound,
  ScrollText,
  Info,
  CheckCircle2,
  Calendar,
  FolderTree,
} from 'lucide-react';

interface LatestLog {
  aksi: string;
  summary: string;
  timestamp: string;
}

interface AuditRecord {
  id: number;
  formatted_id: string;
  created_at: string;
  user: { id: number; name: string; username: string; divisi: string | null; org_unit: string | null } | null;
  donatur: string | null;
  jumlah_donasi: number | null;
  status: string;
  campaign: string | null;
  akad: string | null;
  latest_log: LatestLog | null;
}

interface Filters {
  status?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
}

interface Props {
  entityType: 'campaign' | 'akad';
  entity: {
    id: number;
    nama: string;
    deskripsi?: string | null;
    target_dana?: number | string | null;
    is_active?: boolean;
    tgl_mulai?: string | null;
    tgl_selesai?: string | null;
    banner_url?: string | null;
    parent?: string | null;
    children?: string[];
    is_campaign_required?: boolean;
    total_terkumpul: number;
    total_records: number;
  };
  summary: { total_records: number; total_nominal: number; total_users: number; total_donaturs: number };
  records: { data: AuditRecord[]; links: any[] };
  users: { id: number; name: string; username: string }[];
  filters: Filters;
  pageUrl: string;
  exportUrl: string;
  statusOptions: { value: string; label: string }[];
}

const rupiah = (v: number | string | null | undefined) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(v || 0));

export default function LogAuditShow({
  entityType,
  entity,
  summary,
  records,
  users,
  filters,
  pageUrl,
  exportUrl,
  statusOptions,
}: Props) {
  const [tab, setTab] = useState<'info' | 'log'>('log');
  const [status, setStatus] = useState(filters?.status || '');
  const [userId, setUserId] = useState(filters?.user_id || '');
  const [dateFrom, setDateFrom] = useState(filters?.date_from || '');
  const [dateTo, setDateTo] = useState(filters?.date_to || '');

  const applyFilter = () => {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (userId) params.user_id = userId;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    router.get(pageUrl, params, { preserveState: true, replace: true });
  };

  const resetFilter = () => {
    setStatus('');
    setUserId('');
    setDateFrom('');
    setDateTo('');
    router.get(pageUrl, {}, { preserveState: true, replace: true });
  };

  const exportHref = (() => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (userId) params.set('user_id', userId);
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    const qs = params.toString();
    return qs ? `${exportUrl}?${qs}` : exportUrl;
  })();

  const backUrl = entityType === 'campaign'
    ? route('admin.master.campaigns.index')
    : route('admin.master.akad.index');

  const progress = (() => {
    const target = Number(entity.target_dana || 0);
    if (!target) return null;
    return Math.min(100, Math.round((entity.total_terkumpul / target) * 100));
  })();

  const columns = [
    {
      key: 'created_at',
      header: 'Tanggal Input',
      render: (t: AuditRecord) => (
        <div>
          <p className="font-medium text-slate-800">
            {t.created_at ? new Date(t.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
          </p>
          <p className="text-xs text-slate-500">#{t.formatted_id}</p>
        </div>
      ),
    },
    {
      key: 'user',
      header: 'User (Penginput)',
      render: (t: AuditRecord) => (
        <div>
          <p className="font-medium">{t.user ? (t.user.name || t.user.username) : '-'}</p>
          <p className="text-xs text-slate-500">
            {[t.user?.divisi, t.user?.org_unit].filter(Boolean).join(' • ') || (t.user ? '@' + t.user.username : '-')}
          </p>
        </div>
      ),
    },
    { key: 'donatur', header: 'Donatur', render: (t: AuditRecord) => t.donatur || '-' },
    { key: 'jumlah_donasi', header: 'Nominal', render: (t: AuditRecord) => (t.jumlah_donasi ? <span className="font-semibold text-emerald-700">{rupiah(t.jumlah_donasi)}</span> : '-') },
    { key: 'status', header: 'Status', render: (t: AuditRecord) => <StatusBadge status={t.status} /> },
    ...(entityType === 'akad'
      ? [{ key: 'campaign', header: 'Campaign', render: (t: AuditRecord) => t.campaign || <span className="text-slate-400">-</span> }]
      : []),
    {
      key: 'latest_log',
      header: 'Jejak Terakhir',
      render: (t: AuditRecord) =>
        t.latest_log ? (
          <div className="flex items-start gap-1.5 max-w-[260px]">
            <ScrollText className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
            <span className="text-xs text-slate-600 leading-snug">{t.latest_log.summary}</span>
          </div>
        ) : (
          <span className="text-slate-400 text-xs">-</span>
        ),
    },
  ];

  const stats = [
    { label: 'Total Transaksi', value: summary.total_records.toLocaleString('id-ID'), icon: Receipt, color: 'text-blue-600 bg-blue-50' },
    { label: 'Total Nominal', value: rupiah(summary.total_nominal), icon: Coins, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'User Penginput', value: summary.total_users.toLocaleString('id-ID'), icon: Users, color: 'text-violet-600 bg-violet-50' },
    { label: 'Donatur', value: summary.total_donaturs.toLocaleString('id-ID'), icon: UserRound, color: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <AdminLayout title={`${entity.nama} — Log Audit`}>
      <Head title={`${entity.nama} — Log Audit`} />

      <div className="mb-5">
        <Link href={backUrl} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke daftar {entityType === 'campaign' ? 'campaign' : 'akad'}
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4 min-w-0">
          {entity.banner_url ? (
            <img src={entity.banner_url} alt={entity.nama} className="w-14 h-14 rounded-xl object-cover border shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shrink-0">
              <FolderTree className="w-6 h-6 text-white" />
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-2xl font-bold text-slate-800 truncate">{entity.nama}</h2>
            <p className="text-sm text-slate-500">
              {entityType === 'akad' && entity.parent ? `${entity.parent} → ` : ''}
              Log Audit Input Data
            </p>
          </div>
        </div>
        <a href={exportHref} title="Ekspor data sesuai filter aktif ke Excel">
          <Button variant="outline" className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800">
            <Download className="w-4 h-4" />
            Ekspor Excel
          </Button>
        </a>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-6">
        <button
          onClick={() => setTab('log')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === 'log' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Log Audit
        </button>
        <button
          onClick={() => setTab('info')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === 'info' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Informasi
        </button>
      </div>

      {tab === 'info' ? (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden max-w-3xl">
          {entity.banner_url && <img src={entity.banner_url} alt="Banner" className="w-full h-48 object-cover" />}
          <div className="p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{entity.nama}</h3>
                {entityType === 'akad' && entity.parent && (
                  <p className="text-sm text-slate-500 mt-1">Induk akad: {entity.parent}</p>
                )}
                {entityType === 'akad' && entity.is_campaign_required && (
                  <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" /> Wajib pilih campaign
                  </p>
                )}
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${
                entity.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {entity.is_active ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>

            {entity.deskripsi && (
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{entity.deskripsi}</p>
            )}

            {entityType === 'campaign' && (entity.tgl_mulai || entity.tgl_selesai) && (
              <p className="text-sm text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Periode: {entity.tgl_mulai ? new Date(entity.tgl_mulai).toLocaleDateString('id-ID') : '-'} s/d{' '}
                {entity.tgl_selesai ? new Date(entity.tgl_selesai).toLocaleDateString('id-ID') : '-'}
              </p>
            )}

            {entityType === 'akad' && entity.children && entity.children.length > 0 && (
              <div className="text-sm text-slate-600 flex items-center gap-1.5 flex-wrap">
                <FolderTree className="w-4 h-4 text-slate-400" />
                Mencakup: {entity.children.join(', ')}
              </div>
            )}

            {progress !== null && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2.5">
                <div className="flex justify-between text-sm font-semibold text-slate-700">
                  <span>Progress Fundraising: {progress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex justify-between text-xs text-slate-500 font-medium pt-0.5">
                  <span className="text-slate-700">
                    Terkumpul: <b className="text-emerald-600">{rupiah(entity.total_terkumpul)}</b>
                  </span>
                  <span>Target: {rupiah(entity.target_dana)}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="rounded-lg border p-4">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total Transaksi</p>
                <p className="text-xl font-bold text-slate-800 mt-1">{entity.total_records.toLocaleString('id-ID')}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total Terkumpul</p>
                <p className="text-xl font-bold text-emerald-700 mt-1">{rupiah(entity.total_terkumpul)}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((s) => (
              <div key={s.label} className="bg-white rounded-xl border shadow-sm p-4 flex items-center gap-3.5">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                  <p className="text-lg font-bold text-slate-800 truncate">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl border shadow-sm p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Status</label>
                <select
                  className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">Semua Status</option>
                  {statusOptions.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">User Penginput</label>
                <select
                  className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                >
                  <option value="">Semua User</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name || u.username}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Rentang Tanggal</label>
                <DateRangePicker dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={setDateFrom} onDateToChange={setDateTo} />
              </div>
              <div className="flex gap-2">
                <Button onClick={applyFilter} className="flex-1">Terapkan</Button>
                <Button variant="outline" onClick={resetFilter}>Reset</Button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Daftar Transaksi ({entityType === 'campaign' ? 'Campaign' : 'Akad'} {entity.nama})
              </div>
            </div>
            <DataTable columns={columns} data={records.data} keyExtractor={(t: AuditRecord) => t.id} emptyMessage="Tidak ada transaksi yang cocok dengan filter." />
            <Pagination links={records.links} />
          </div>
        </>
      )}
    </AdminLayout>
  );
}
