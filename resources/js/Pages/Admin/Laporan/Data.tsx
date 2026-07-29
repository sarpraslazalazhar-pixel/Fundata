import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { DataTable } from '@/Components/DataTable';
import { StatusBadge } from '@/Components/StatusBadge';
import SlaBadge from '@/Components/SlaBadge';
import { Pagination } from '@/Components/Pagination';
import { DateRangePicker } from '@/Components/ui/date-range-picker';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/Components/ui/tabs';
import { Eye, Folder, Clock, Hourglass, CheckCircle, XCircle, Ban, Printer, Download, Filter, Search, Coins, Users } from 'lucide-react';
import LazyECharts from '@/Components/Charts/LazyECharts';
import { formatTicketId } from '@/lib/utils';

const STATUS_META: Record<string, { label: string; bg: string; icon: React.ElementType; anim: string }> = {
 open: { label: 'Data Masuk', bg: 'from-blue-500 to-blue-600', icon: Folder, anim: 'group-hover:-translate-y-2 group-hover:rotate-12 group-hover:opacity-100' },
 on_proses: { label: 'Diproses', bg: 'from-orange-500 to-orange-600', icon: Clock, anim: 'group-hover:-rotate-12 group-hover:scale-110 group-hover:opacity-100' },
 pending: { label: 'Tertunda', bg: 'from-zinc-500 to-zinc-600', icon: Hourglass, anim: 'group-hover:rotate-180 transition-transform duration-500 group-hover:opacity-100' },
 solve: { label: 'Selesai', bg: 'from-green-500 to-green-600', icon: CheckCircle, anim: 'group-hover:scale-125 group-hover:opacity-100' },
 reject: { label: 'Ditolak', bg: 'from-red-500 to-red-600', icon: XCircle, anim: 'group-hover:rotate-90 group-hover:scale-110 group-hover:opacity-100' },
 dibatalkan: { label: 'Dibatalkan', bg: 'from-rose-500 to-rose-600', icon: Ban, anim: 'group-hover:scale-90 group-hover:opacity-100' },
};

const STATUS_LIST = [
 { value: 'open', label: 'Baru' },
 { value: 'on_proses', label: 'Diproses' },
 { value: 'pending', label: 'Tertunda' },
 { value: 'waiting_approval', label: 'Menunggu Review' },
 { value: 'need_revision', label: 'Butuh Revisi' },
 { value: 'solve', label: 'Selesai' },
 { value: 'reject', label: 'Ditolak' },
 { value: 'dibatalkan', label: 'Dibatalkan' },
];

export default function LaporanTiket({ 
 filters, units, subUnits: initialSubUnits, divisiList, 
 totalTickets, statusCounts, slaStats, slaPieChartData, 
 monthlyTrend, ticketsByUnit, ticketsByStatus, ticketsByLayanan, records, totalDonasi, totalDonatur, donaturList
}: any) {
 const getStatusLabel = (status: string) => {
 const map: Record<string, string> = {
 'open': 'Baru',
 'on_proses': 'Diproses',
 'pending': 'Tertunda',
 'waiting_approval': 'Menunggu Review',
 'need_revision': 'Butuh Revisi',
 'solve': 'Selesai',
 'reject': 'Ditolak',
 'dibatalkan': 'Dibatalkan',
 };
 return map[status] || status;
 };

 const getStatusStyle = (status: string) => {
 const map: Record<string, any> = {
 'open': { text: 'text-blue-600 ', bg: 'bg-blue-100 ', dot: 'bg-blue-500' },
 'on_proses': { text: 'text-orange-600 ', bg: 'bg-orange-100 ', dot: 'bg-orange-500' },
 'pending': { text: 'text-zinc-600 ', bg: 'bg-zinc-100 ', dot: 'bg-zinc-500' },
 'waiting_approval': { text: 'text-purple-600 ', bg: 'bg-purple-100 ', dot: 'bg-purple-500' },
 'need_revision': { text: 'text-amber-600 ', bg: 'bg-amber-100 ', dot: 'bg-amber-500' },
 'solve': { text: 'text-green-600 ', bg: 'bg-green-100 ', dot: 'bg-green-500' },
 'reject': { text: 'text-red-600 ', bg: 'bg-red-100 ', dot: 'bg-red-500' },
 'dibatalkan': { text: 'text-rose-600 ', bg: 'bg-rose-100 ', dot: 'bg-rose-500' },
 };
 return map[status] || { text: 'text-slate-600 ', bg: 'bg-slate-100 ', dot: 'bg-slate-500' };
 };

 const maxLayanan = ticketsByLayanan?.length > 0 ? Math.max(...ticketsByLayanan.map((t: any) => t.count)) : 1;

 const [month, setMonth] = useState(filters?.month || '');
 const [year, setYear] = useState(filters?.year || new Date().getFullYear().toString());
 const [dateFrom, setDateFrom] = useState(filters?.date_from || '');
 const [dateTo, setDateTo] = useState(filters?.date_to || '');
 const [unitId, setUnitId] = useState(filters?.unit_id || '');
 const [subUnitId, setSubUnitId] = useState(filters?.sub_unit_id || '');
 const [status, setStatus] = useState(filters?.status || '');
 const [divisiId, setDivisiId] = useState(filters?.divisi_id || '');
 const [subUnits, setSubUnits] = useState<any[]>(initialSubUnits || []);
 const [showFilter, setShowFilter] = useState(false);

 useEffect(() => {
 if (unitId && (!initialSubUnits || initialSubUnits.length === 0)) {
 fetch(`/api/sub-units/${unitId}`).then(r => r.json()).then(setSubUnits);
 } else if (!unitId) {
 setSubUnits([]);
 setSubUnitId('');
 }
 }, [unitId, initialSubUnits]);

 const applyFilter = () => {
 const params: any = {};
 if (month) params.month = month;
 if (year) params.year = year;
 if (dateFrom) params.date_from = dateFrom;
 if (dateTo) params.date_to = dateTo;
 if (unitId) params.unit_id = unitId;
 if (subUnitId) params.sub_unit_id = subUnitId;
 if (status) params.status = status;
 if (divisiId) params.divisi_id = divisiId;
 router.get(route('admin.laporan.tiket'), params, { preserveState: true });
 };

 const handlePrint = () => {
 window.print();
 };

 const handleExportExcel = () => {
 // Implementasi Export Excel bisa memanggil URL backend yang mereturn response CSV/Excel
 alert('Fitur Export Excel akan diproses oleh server berdasarkan filter aktif.');
 };

 const columns = [
 {
 key: 'id',
 header: 'ID',
 render: (row: any) => <span className="font-mono font-semibold text-slate-600">#TKT-{formatTicketId(row.id)}</span>,
 },
 {
 key: 'user',
 header: 'Pengaju',
 render: (row: any) => row.user ? (
 <div className="flex flex-col">
 <span className="font-semibold text-slate-900">{row.user.username}</span>
 <span className="text-xs text-slate-500">{row.user.divisi?.nama_divisi || '-'}</span>
 </div>
 ) : '-',
 },
 {
 key: 'sub_unit',
 header: 'Data',
 render: (row: any) => row.sub_unit ? (
 <div className="flex flex-col">
 <span className="font-medium text-slate-900">{row.sub_unit.nama_layanan}</span>
 <span className="text-xs text-slate-500">{row.sub_unit.unit?.nama_unit}</span>
 </div>
 ) : '-',
 },
 {
 key: 'status',
 header: 'Status',
 render: (row: any) => (
 <div className="flex flex-col gap-1 items-start">
 <StatusBadge status={row.status} />
 <SlaBadge slaTracking={row.sla_tracking} status={row.status} />
 </div>
 )
 },
 {
 key: 'created_at',
 header: 'Waktu Dibuat',
 render: (row: any) => {
 const date = new Date(row.created_at);
 return (
 <div className="flex flex-col">
 <span className="font-medium text-slate-900">{date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
 <span className="text-xs text-slate-500">{date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
 </div>
 );
 }
 },
 {
 key: 'aksi',
 header: 'Aksi',
 className: 'w-[100px] print:hidden',
 render: (row: any) => (
 <Button variant="outline" size="sm" onClick={() => router.get(route('admin.data.show', row.id))}>
 <Eye className="w-4 h-4 mr-1" /> Detail
 </Button>
 ),
 },
 ];

 const donaturColumns = [
 { key: 'nama_donatur', header: 'Nama Donatur', render: (row: any) => <span className="font-medium text-slate-900">{row.nama_donatur}</span> },
 { key: 'total_transaksi', header: 'Total Transaksi', render: (row: any) => `${row.total_transaksi} kali` },
 { key: 'total_rupiah', header: 'Total Donasi (Rp)', render: (row: any) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(row.total_rupiah) || 0) },
 ];

 const months = [
 { value: '', label: 'Semua Bulan' },
 ...Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: new Date(0, i).toLocaleString('id', { month: 'long' }) })),
 ];

 const years = [
 ...Array.from({ length: 5 }, (_, i) => ({ value: String(new Date().getFullYear() - i), label: String(new Date().getFullYear() - i) })),
 ];

 return (
 <AdminLayout title="Laporan Data">
 <Head title="Laporan Data" />
 <div className="space-y-6">
 
 {/* Header & Actions */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
 <div>
 <h1 className="text-2xl font-bold tracking-tight">Laporan Data</h1>
 <p className="text-sm text-muted-foreground mt-1">
 Analitik dan statistik ringkasan data masuk berdasarkan filter.
 </p>
 </div>
 <div className="flex items-center gap-2">
 <Button variant="outline" onClick={() => setShowFilter(!showFilter)}>
 <Filter className="w-4 h-4 mr-2" />
 {showFilter ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
 </Button>
 <Button variant="outline" onClick={handlePrint}>
 <Printer className="w-4 h-4 mr-2" /> Export PDF
 </Button>
 <Button variant="default" onClick={handleExportExcel}>
 <Download className="w-4 h-4 mr-2" /> Export Excel
 </Button>
 </div>
 </div>

 {/* Filter Bar */}
 {showFilter && (
 <Card className="bg-slate-50/50 border-dashed print:hidden">
 <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
 <div className="space-y-1.5">
 <label className="text-xs font-semibold">Tahun</label>
 <select className="w-full rounded-md border-input bg-background text-sm h-9" value={year} onChange={e => setYear(e.target.value)}>
 {years.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
 </select>
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-semibold">Bulan</label>
 <select className="w-full rounded-md border-input bg-background text-sm h-9" value={month} onChange={e => setMonth(e.target.value)}>
 {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
 </select>
 </div>
 <div className="space-y-1.5 md:col-span-2">
 <label className="text-xs font-semibold">Rentang Tanggal (Opsional)</label>
 <div className="flex items-center gap-2">
 <input type="date" className="w-full rounded-md border-input bg-background text-sm h-9" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
 <span>-</span>
 <input type="date" className="w-full rounded-md border-input bg-background text-sm h-9" value={dateTo} onChange={e => setDateTo(e.target.value)} />
 </div>
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-semibold">Unit Layanan</label>
 <select className="w-full rounded-md border-input bg-background text-sm h-9" value={unitId} onChange={e => setUnitId(e.target.value)}>
 <option value="">Semua Unit</option>
 {units?.map((u: any) => <option key={u.id} value={u.id}>{u.nama_unit}</option>)}
 </select>
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-semibold">Sub Unit</label>
 <select className="w-full rounded-md border-input bg-background text-sm h-9" value={subUnitId} onChange={e => setSubUnitId(e.target.value)}>
 <option value="">Semua Sub Unit</option>
 {subUnits?.map((su: any) => <option key={su.id} value={su.id}>{su.nama_layanan}</option>)}
 </select>
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-semibold">Status Data</label>
 <select className="w-full rounded-md border-input bg-background text-sm h-9" value={status} onChange={e => setStatus(e.target.value)}>
 <option value="">Semua Status</option>
 {STATUS_LIST.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
 </select>
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-semibold">Divisi Pengaju</label>
 <select className="w-full rounded-md border-input bg-background text-sm h-9" value={divisiId} onChange={e => setDivisiId(e.target.value)}>
 <option value="">Semua Divisi</option>
 {divisiList?.map((d: any) => <option key={d.id} value={d.id}>{d.nama_divisi}</option>)}
 </select>
 </div>
 <div className="col-span-full flex justify-end mt-2 gap-2">
 <Button variant="outline" size="sm" onClick={() => router.get(route('admin.laporan.tiket'))}>Reset</Button>
 <Button variant="default" size="sm" onClick={applyFilter}>
 <Search className="w-4 h-4 mr-2" /> Terapkan Filter
 </Button>
 </div>
 </CardContent>
 </Card>
 )}

 {/* Summary Cards (Donasi & Donatur) */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
 <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 print:break-inside-avoid print:shadow-none">
 <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/20 blur-xl pointer-events-none transition-transform duration-500 group-hover:scale-150" />
 <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/5 blur-lg pointer-events-none" />
 <div className="relative p-5 text-white">
 <div className="flex items-start justify-between">
 <span className="text-sm font-medium text-white/80">Total Donasi (Rp)</span>
 <Coins className="h-6 w-6 text-white opacity-70 transition-all duration-300 group-hover:-translate-y-2 group-hover:rotate-12 group-hover:opacity-100 print:hidden" />
 </div>
 <p className="mt-3 text-3xl font-bold">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalDonasi || 0)}</p>
 </div>
 </div>

 <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 print:break-inside-avoid print:shadow-none">
 <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/20 blur-xl pointer-events-none transition-transform duration-500 group-hover:scale-150" />
 <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/5 blur-lg pointer-events-none" />
 <div className="relative p-5 text-white">
 <div className="flex items-start justify-between">
 <span className="text-sm font-medium text-white/80">Total Donatur</span>
 <Users className="h-6 w-6 text-white opacity-70 transition-all duration-300 group-hover:scale-110 group-hover:opacity-100 print:hidden" />
 </div>
 <p className="mt-3 text-3xl font-bold">{totalDonatur || 0}</p>
 </div>
 </div>
 </div>

 {/* Status Cards */}
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
 {Object.entries(STATUS_META).map(([key, meta]) => {
 const Icon = meta.icon;
 return (
 <div key={key} className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${meta.bg} shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 print:break-inside-avoid print:shadow-none`}>
 <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/20 blur-xl pointer-events-none transition-transform duration-500 group-hover:scale-150" />
 <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/5 blur-lg pointer-events-none" />
 <div className="relative p-5 text-white">
 <div className="flex items-start justify-between">
 <span className="text-sm font-medium text-white/80">{meta.label}</span>
 <Icon className={`h-6 w-6 text-white opacity-70 transition-all duration-300 ${meta.anim} print:hidden`} />
 </div>
 <p className="mt-3 text-3xl font-bold">{statusCounts?.[key] ?? 0}</p>
 </div>
 </div>
 );
 })}
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* SLA Stats Card (HIDDEN FOR FUNDATA) */}

 {/* Tren Bulanan */}
 <Card className="lg:col-span-2 print:break-inside-avoid">
 <CardHeader className="pb-2">
 <CardTitle className="text-base">Tren Data Berdasarkan Bulan</CardTitle>
 </CardHeader>
 <CardContent>
 {monthlyTrend?.length > 0 ? (
 <LazyECharts option={{
 tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
 grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
 xAxis: { type: 'category', data: monthlyTrend.map((d: any) => d.bulan) },
 yAxis: { type: 'value' },
 series: [{
 name: 'Total Data',
 type: 'line',
 smooth: true,
 areaStyle: {
 color: {
 type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
 colorStops: [{ offset: 0, color: 'rgba(59, 130, 246, 0.5)' }, { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }]
 }
 },
 itemStyle: { color: '#3b82f6' },
 data: monthlyTrend.map((d: any) => d.total)
 }]
 }} height={280} />
 ) : (
 <p className="text-sm text-muted-foreground text-center py-8">Belum ada data tren.</p>
 )}
 </CardContent>
 </Card>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* SLA Pie Chart (HIDDEN FOR FUNDATA) */}

 {/* Top Divisi / Layanan (Diganti Tabel) */}
 </div>

 <div className="grid gap-4 grid-cols-1">
 <Card className="print:break-inside-avoid shadow-sm hover:shadow-md transition-shadow">
 <CardHeader className="pb-3 border-b border-slate-100 ">
 <CardTitle className="text-base font-bold flex items-center gap-2">
 <span className="h-4 w-1 rounded-full bg-blue-500"></span>
 Data Berdasarkan Jenis Layanan
 </CardTitle>
 </CardHeader>
 <CardContent className="p-0">
 {/* Custom scrollbar via tailwind utilities + smooth scrolling */}
 <div className="overflow-x-auto max-h-[350px] relative scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent hover:scrollbar-thumb-slate-300 transition-all">
 <table className="w-full text-sm text-left">
 <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm z-10">
 <tr>
 <th className="py-3 px-4 font-semibold text-slate-600 ">Jenis Layanan</th>
 <th className="py-3 px-4 font-semibold text-right text-slate-600 w-1/3 md:w-1/4">Distribusi Data</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 ">
 {ticketsByLayanan?.map((t: any, idx: number) => {
 const percent = (t.count / maxLayanan) * 100;
 return (
 <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
 <td className="py-3 px-4 font-medium">{t.layanan}</td>
 <td className="py-3 px-4">
 <div className="flex items-center justify-end gap-3">
 <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-[200px]">
 <div 
 className="h-full bg-blue-500 rounded-full group-hover:bg-blue-400 transition-all duration-500 ease-out" 
 style={{ width:`${percent}%`}}
 ></div>
 </div>
 <span className="font-bold min-w-[2rem] text-right">{t.count}</span>
 </div>
 </td>
 </tr>
 );
 })}
 {(!ticketsByLayanan || ticketsByLayanan.length === 0) && (
 <tr>
 <td colSpan={2} className="py-8 text-center text-muted-foreground">Tidak ada data layanan.</td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </CardContent>
 </Card>
 </div>
 
 {/* Distribusi per Unit */}
 <Card className="print:break-inside-avoid">
 <CardHeader className="pb-2">
 <CardTitle className="text-base">Distribusi Data Berdasarkan Unit Layanan</CardTitle>
 </CardHeader>
 <CardContent>
 {ticketsByUnit?.length > 0 ? (
 <LazyECharts option={{
 tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
 grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
 xAxis: { type: 'category', data: ticketsByUnit.map((d: any) => d.name), axisLabel: { interval: 0, rotate: 15 } },
 yAxis: { type: 'value' },
 series: [{
 name: 'Total Data',
 type: 'bar',
 itemStyle: { color: '#0ea5e9', borderRadius: [4, 4, 0, 0] },
 data: ticketsByUnit.map((d: any) => d.value)
 }]
 }} height={300} />
 ) : (
 <p className="text-sm text-muted-foreground text-center py-8">Belum ada data Distribusi Unit.</p>
 )}
 </CardContent>
 </Card>

 {/* Rincian Tiket Table */}
 <div className="mt-8 space-y-4 print:break-before-page">
 <h2 className="text-xl font-bold tracking-tight">Rincian Data</h2>
 <Tabs defaultValue="tiket" className="w-full">
 <TabsList className="mb-4">
 <TabsTrigger value="tiket">Histori Data Transaksi</TabsTrigger>
 <TabsTrigger value="donatur">Data Donatur</TabsTrigger>
 </TabsList>
 <TabsContent value="tiket">
 <div className="overflow-x-auto rounded-md border">
 <DataTable columns={columns} data={records?.data || []} keyExtractor={(t: any) => t.id} />
 </div>
 <div className="print:hidden mt-4">
 <Pagination links={records?.links} />
 </div>
 </TabsContent>
 <TabsContent value="donatur">
 <div className="overflow-x-auto rounded-md border">
 <DataTable columns={donaturColumns} data={donaturList?.data || []} keyExtractor={(t: any) => t.nama_donatur} />
 </div>
 <div className="print:hidden mt-4">
 <Pagination links={donaturList?.links} />
 </div>
 </TabsContent>
 </Tabs>
 </div>
 </div>

 {/* Print Styles */}
 <style>{`
 @media print {
 @page { size: landscape; margin: 10mm; }
 body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
 .print\\:hidden { display: none !important; }
 .print\\:break-inside-avoid { break-inside: avoid; }
 .print\\:break-before-page { break-before: page; }
 .print\\:shadow-none { box-shadow: none !important; border: 1px solid #e2e8f0; }
 main { padding: 0 !important; margin: 0 !important; background: transparent !important; }
 header, nav, footer { display: none !important; }
 .card { border: 1px solid #e2e8f0 !important; box-shadow: none !important; }
 }
`}</style>
 </AdminLayout>
 );
}
