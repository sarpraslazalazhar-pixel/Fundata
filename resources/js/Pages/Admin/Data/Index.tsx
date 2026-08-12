import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { DataTable } from '@/Components/DataTable';
import { StatusBadge } from '@/Components/StatusBadge';
import SlaBadge from '@/Components/SlaBadge';
import { Pagination } from '@/Components/Pagination';
import { Button } from '@/Components/ui/button';
import { DateRangePicker } from '@/Components/ui/date-range-picker';
import VoidDecisionButtons from '@/Components/VoidDecisionButtons';
import { Eye, Filter, ExternalLink } from 'lucide-react';
import { formatTicketId } from '@/lib/utils';

const STATUS_LIST = [
 { value: 'open', label: 'Baru' },
 { value: 'on_proses', label: 'Diproses' },
 { value: 'pending', label: 'Tertunda' },
 { value: 'menunggu_manager', label: 'Menunggu Manajer' },
 { value: 'waiting_approval', label: 'Menunggu Review' },
 { value: 'need_revision', label: 'Butuh Revisi' },
];

interface Ticket {
 id: number;
 user: { id: number; username: string; divisi?: { nama_divisi: string } };
 unit?: { nama_unit: string };
 sub_unit?: { nama_layanan: string };
 assigned_admin?: { id: number; name: string; username: string };
 donatur?: any;
 jumlah_donasi?: number;
 nominal_void?: number;
 status: string;
 created_at: string;
 link_kwitansi?: string;
 nomor_kwitansi?: string;
 is_result_accepted?: boolean;
}

export default function DataIndex({ records, filters, units, divisiList, orgUnitList }: any) {
 const { auth } = usePage().props as any;
 const isManager = auth?.is_superadmin || auth?.permissions?.includes('akses-void-approval');
 const [showFilter, setShowFilter] = useState(() => {
 return !!(filters?.unit_id || filters?.sub_unit_id || filters?.status || filters?.date_from || filters?.date_to || filters?.divisi_id || filters?.org_unit_id);
 });
 const [unitId, setUnitId] = useState(filters?.unit_id || '');
 const [subUnitId, setSubUnitId] = useState(filters?.sub_unit_id || '');
 const [selectedStatuses, setSelectedStatuses] = useState<string[]>(() => {
 const s = filters?.status;
 return Array.isArray(s) ? s : s ? [s] : [];
 });
 const [dateFrom, setDateFrom] = useState(filters?.date_from || '');
 const [dateTo, setDateTo] = useState(filters?.date_to || '');
 const [divisiId, setDivisiId] = useState(filters?.divisi_id || '');
 const [orgUnitId, setOrgUnitId] = useState(filters?.org_unit_id || '');
 const [subUnits, setSubUnits] = useState<any[]>([]);

 useEffect(() => {
 if (unitId) {
 fetch(`/api/sub-units/${unitId}`).then(r => r.json()).then(setSubUnits);
 }
 }, []);

 const toggleStatus = (val: string) => {
 setSelectedStatuses(prev =>
 prev.includes(val) ? prev.filter(s => s !== val) : [...prev, val]
 );
 };

 const applyFilter = () => {
 const params: any = {};
 if (unitId) params.unit_id = unitId;
 if (subUnitId) params.sub_unit_id = subUnitId;
 if (selectedStatuses.length > 0) params.status = selectedStatuses;
 if (dateFrom) params.date_from = dateFrom;
 if (dateTo) params.date_to = dateTo;
 if (divisiId) params.divisi_id = divisiId;
 if (orgUnitId) params.org_unit_id = orgUnitId;
 router.get(route('admin.data.index'), params, { });
 };

 const columns = [
 /* HIDDEN FOR FUNDATA
 {
 key: 'sla_tracking',
 header: 'SLA',
 ...
 },
 */
 { key: 'id', header: 'ID Data', render: (t: Ticket) =>`#DT-${formatTicketId(t.id)}`},
 { key: 'created_at', header: 'Tgl Pengajuan', render: (t: Ticket) => new Date(t.created_at).toLocaleDateString('id-ID') },
 {
 key: 'user',
 header: 'Pengaju',
 render: (t: Ticket) => (
 <div>
 <p className="font-medium">{t.user?.username || '-'}</p>
 <p className="text-xs text-slate-500">{t.user?.divisi?.nama_divisi || '-'}</p>
 </div>
 ),
 },
 {
 key: 'layanan',
 header: 'Layanan',
 render: (t: Ticket) => (
 <div>
 <p className="font-medium">{t.unit?.nama_unit || '-'}</p>
 <p className="text-xs text-slate-500">{t.sub_unit?.nama_layanan || '-'}</p>
 </div>
 ),
 },
 {
 key: 'operator',
 header: 'Operator',
 render: (t: Ticket) => (
 <p className="font-medium">{t.assigned_admin?.name || t.assigned_admin?.username || '-'}</p>
 ),
 },
 { key: 'donatur', header: 'Nama Donatur', render: (t: Ticket) => t.donatur?.nama_lengkap || '-' },
 { key: 'donasi', header: 'Donasi / Nominal (Rp)', render: (t: Ticket) => t.jumlah_donasi ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(t.jumlah_donasi)) : (t.nominal_void ? `(Void) ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(t.nominal_void))}` : '-') },
 { key: 'status', header: 'Status', render: (t: Ticket) => <StatusBadge status={t.status} /> },
 {
 key: 'kwitansi',
 header: 'Kwitansi',
 render: (t: Ticket) => {
   if ((t.status === 'solve' || t.is_result_accepted) && t.link_kwitansi) {
     return (
       <a href={t.link_kwitansi} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded border border-blue-200 hover:bg-blue-100 transition-colors whitespace-nowrap">
         <ExternalLink className="w-3.5 h-3.5" />
         {t.nomor_kwitansi || 'Lihat Kwitansi'}
       </a>
     );
   }
   return '-';
 }
 },
 {
key: 'aksi',
  header: 'Aksi',
  className: 'w-[220px]',
  render: (t: Ticket) => (
   t.status === 'menunggu_manager' && isManager ? (
    <VoidDecisionButtons ticket={t} />
   ) : (
    <Button variant="outline" size="sm" onClick={() => router.get(route('admin.data.show', t.id))}>
     <Eye className="w-4 h-4 mr-1" /> Detail
    </Button>
   )
  ),
  },
 ];

 return (
 <AdminLayout title="Daftar Data">
 <Head title="Daftar Data" />

 <div className="flex justify-end mb-4">
 <Button onClick={() => setShowFilter(!showFilter)} variant="outline" className="flex items-center gap-2">
 <Filter className="w-4 h-4" />
 {showFilter ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
 </Button>
 </div>

 {showFilter && (
 <div className="bg-white rounded-lg border p-4 mb-4 space-y-4">
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 <select className="rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={unitId} onChange={e => { setUnitId(e.target.value); setSubUnitId(''); setSubUnits([]); if (e.target.value) fetch(`/api/sub-units/${e.target.value}`).then(r => r.json()).then(setSubUnits); }}>
 <option value="">Semua Unit</option>
 {units.map((u: any) => <option key={u.id} value={u.id}>{u.nama_unit}</option>)}
 </select>
 <select className="rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={subUnitId} onChange={e => setSubUnitId(e.target.value)}>
 <option value="">Semua Sub Unit</option>
 {subUnits.map((s: any) => <option key={s.id} value={s.id}>{s.nama_layanan}</option>)}
 </select>
 <select className="rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={divisiId} onChange={e => setDivisiId(e.target.value)}>
 <option value="">Semua Divisi</option>
 {divisiList.map((d: any) => <option key={d.id} value={d.id}>{d.nama_divisi}</option>)}
 </select>
 <select className="rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={orgUnitId} onChange={e => setOrgUnitId(e.target.value)}>
 <option value="">Semua Unit Organisasi</option>
 {orgUnitList.map((o: any) => <option key={o.id} value={o.id}>{o.nama_unit_organisasi}</option>)}
 </select>
 </div>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="flex flex-col gap-1.5">
 <span className="text-sm font-medium text-slate-700 ">Status</span>
 <div className="flex flex-wrap items-center gap-3 p-2.5 border rounded-md bg-slate-50/50 ">
 {STATUS_LIST.map(s => (
 <label key={s.value} className="flex items-center gap-1.5 text-sm cursor-pointer">
 <input type="checkbox" checked={selectedStatuses.includes(s.value)} onChange={() => toggleStatus(s.value)} className="rounded border-slate-300 text-primary focus:ring-primary" />
 {s.label}
 </label>
 ))}
 </div>
 </div>
 
 <div className="flex flex-col gap-1.5">
 <span className="text-sm font-medium text-slate-700 ">Tanggal</span>
 <DateRangePicker dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={setDateFrom} onDateToChange={setDateTo} />
 </div>
 </div>

 <div className="flex justify-end pt-2">
 <Button onClick={applyFilter} className="w-full md:w-auto">Terapkan Filter</Button>
 </div>
 </div>
 )}

 <DataTable columns={columns} data={records?.data || []} keyExtractor={(t: Ticket) => t.id} />
 <Pagination links={records?.links} />
 </AdminLayout>
 );
}
