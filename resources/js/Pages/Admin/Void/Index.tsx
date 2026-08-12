import React, { useState } from 'react';
 import { Head, router, usePage } from '@inertiajs/react';
 import AdminLayout from '@/Layouts/AdminLayout';
 import { StatusBadge } from '@/Components/StatusBadge';
 import { Button } from '@/Components/ui/button';
 import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
 import { DataTable } from '@/Components/DataTable';
 import { Pagination } from '@/Components/Pagination';
 import VoidDecisionButtons from '@/Components/VoidDecisionButtons';
 import { AlertTriangle, Coins, Receipt, Users, Calendar, Eye } from 'lucide-react';
 import { formatTicketId } from '@/lib/utils';

const rupiah = (v: any) =>
 new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(v) || 0);

export default function VoidIndex({ voidStats, fundraisers, tickets, filters }: any) {
 const { auth } = usePage().props as any;
 const isManager = auth?.is_superadmin || auth?.permissions?.includes('akses-void-approval');

 const [month, setMonth] = useState(filters?.month || '');
 const [year, setYear] = useState(filters?.year || '');
 const [status, setStatus] = useState(filters?.status || 'all');

 const applyFilter = () => {
  const params: any = {};
  if (month) params.month = month;
  if (year) params.year = year;
  if (status !== 'all') params.status = status;
  router.get(route('admin.void.index'), params, {});
 };

 const months = [
  { value: '', label: 'Semua Bulan' },
  ...Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: new Date(0, i).toLocaleString('id', { month: 'long' }) })),
 ];

 const years = [
  { value: '', label: 'Semua Tahun' },
  ...Array.from({ length: 5 }, (_, i) => ({ value: String(new Date().getFullYear() - i), label: String(new Date().getFullYear() - i) })),
 ];

 const kpiCards = [
  { label: 'Total Nominal Void', value: rupiah(voidStats.totalNominalVoid), icon: Coins, note: 'Transaksi void yang sudah disetujui' },
  { label: 'Jumlah Transaksi Void', value: voidStats.totalTransaksiVoid, icon: Receipt, note: 'Transaksi void yang sudah disetujui' },
  { label: 'Menunggu Persetujuan', value: voidStats.menungguPersetujuan, icon: AlertTriangle, note: 'Menunggu keputusan Manajer' },
  { label: 'Fundraiser Void Aktif', value: voidStats.fundraiserVoidAktif, icon: Users, note: 'Fundraiser dengan void disetujui' },
 ];

 const fundraiserColumns = [
  {
   key: 'user',
   header: 'Fundraiser',
   render: (row: any) => (
    <div className="flex flex-col">
     <span className="font-semibold text-slate-900">{row.name}</span>
     <span className="text-xs text-slate-500">@{row.username}</span>
    </div>
   ),
  },
  { key: 'total_tiket', header: 'Jumlah Void', render: (row: any) => <span className="tabular-nums">{row.total_tiket}x</span> },
  { key: 'total_nominal_void', header: 'Nominal Void (Rp)', render: (row: any) => <span className="font-semibold text-red-600 tabular-nums">{rupiah(row.total_nominal_void)}</span> },
 ];

 const ticketColumns = [
  { key: 'id', header: 'ID Data', render: (t: any) => <span className="font-mono font-semibold">#DT-{formatTicketId(t.id)}</span> },
  { key: 'created_at', header: 'Tanggal', render: (t: any) => new Date(t.created_at).toLocaleDateString('id-ID') },
  {
   key: 'user',
   header: 'Fundraiser',
   render: (t: any) => (
    <div className="flex flex-col">
     <span className="font-medium">{t.user?.name || t.user?.username || '-'}</span>
     <span className="text-xs text-slate-500">{t.user?.divisi?.nama_divisi || '-'}</span>
    </div>
   ),
  },
  {
   key: 'layanan',
   header: 'Layanan',
   render: (t: any) => (
    <div>
     <p className="font-medium">{t.unit?.nama_unit || '-'}</p>
     <p className="text-xs text-slate-500">{t.sub_unit?.nama_layanan || '-'}</p>
    </div>
   ),
  },
  { key: 'donatur', header: 'Donatur', render: (t: any) => <span>{t.donatur?.nama_lengkap || '-'}</span> },
  { key: 'nominal_void', header: 'Nominal Void (Rp)', render: (t: any) => <span className="font-semibold text-red-600 tabular-nums">{rupiah(t.nominal_void)}</span> },
  { key: 'status', header: 'Status', render: (t: any) => <StatusBadge status={t.status} /> },
  {
   key: 'aksi',
   header: 'Aksi',
   className: 'w-[220px]',
   render: (t: any) => (
    t.status === 'menunggu_manager' && isManager ? (
     <VoidDecisionButtons ticket={t} />
    ) : (
     <Button size="sm" variant="outline" onClick={() => router.get(route('admin.data.show', t.id))}>
      <Eye className="w-4 h-4 mr-1" /> Detail
     </Button>
    )
   ),
  },
 ];

 return (
  <AdminLayout title="Dashboard Void">
   <Head title="Dashboard Void" />

   <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
     <div>
      <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
       <AlertTriangle className="h-6 w-6 text-red-500" />
       Dashboard Void
      </h1>
      <p className="text-sm text-muted-foreground mt-1">Pantauan transaksi void: persetujuan Manajer dan performa fundraiser.</p>
     </div>
     <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 rounded-lg border border-input bg-white px-3 py-1.5 text-sm shadow-sm">
       <Calendar className="h-4 w-4 text-muted-foreground" />
       <select className="bg-transparent border-0 p-0 text-sm focus:ring-0 outline-none" value={month} onChange={e => setMonth(e.target.value)}>
        {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
       </select>
       <span className="text-muted-foreground/40">/</span>
       <select className="bg-transparent border-0 p-0 text-sm focus:ring-0 outline-none" value={year} onChange={e => setYear(e.target.value)}>
        {years.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
       </select>
      </div>
      <select className="rounded-lg border border-input bg-white px-3 py-1.5 text-sm shadow-sm outline-none" value={status} onChange={e => setStatus(e.target.value)}>
       <option value="all">Semua Status</option>
       <option value="menunggu">Menunggu Manajer</option>
       <option value="approved">Disetujui</option>
       <option value="rejected">Ditolak</option>
      </select>
      <Button onClick={applyFilter} size="sm">Terapkan</Button>
     </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
     {kpiCards.map(({ label, value, icon: Icon, note }) => (
      <Card key={label} className="border-red-200 bg-red-50/30">
       <CardContent className="p-4">
        <div className="flex items-center justify-between">
         <div className="min-w-0">
          <p className="text-sm font-medium text-red-600 mb-1">{label}</p>
          <p className="text-xl lg:text-2xl font-bold text-slate-900 truncate">{value}</p>
          <p className="text-xs text-slate-500 mt-1">{note}</p>
         </div>
         <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-red-600" />
         </div>
        </div>
       </CardContent>
      </Card>
     ))}
    </div>

    <Card className="border-red-100">
     <CardHeader className="pb-3 border-b border-red-50">
      <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800">List Fundraiser (Void)</CardTitle>
     </CardHeader>
     <CardContent className="p-4">
      <div className="overflow-x-auto rounded-md border border-slate-100">
       <DataTable columns={fundraiserColumns} data={fundraisers?.data || []} keyExtractor={(r: any) => r.id} columnBorders />
      </div>
      <Pagination links={fundraisers?.links} />
     </CardContent>
    </Card>

    <Card className="border-red-100">
     <CardHeader className="pb-3 border-b border-red-50">
      <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800">List Transaksi Void</CardTitle>
     </CardHeader>
     <CardContent className="p-4">
      <div className="overflow-x-auto rounded-md border border-slate-100">
       <DataTable columns={ticketColumns} data={tickets?.data || []} keyExtractor={(t: any) => t.id} columnBorders />
      </div>
      <Pagination links={tickets?.links} />
     </CardContent>
    </Card>
   </div>
  </AdminLayout>
 );
}