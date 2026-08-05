import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { StatusBadge } from '@/Components/StatusBadge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { DataTable } from '@/Components/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Coins, Users, Receipt, UserCheck, TrendingUp, PieChart, Calendar, Eye, AlertTriangle, Loader2, CheckCircle } from 'lucide-react';
import LazyECharts from '@/Components/Charts/LazyECharts';
import { formatTicketId } from '@/lib/utils';

const PIE_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#14b8a6'];

const rupiah = (v: any) =>
 new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(v) || 0);

const rupiahCompact = (v: number) =>
 new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(v || 0);

export default function DashboardIndex({
 filters, totalDonasi, totalTransaksi, totalDonatur, fundraiserAktif,
 monthlyTrend, distribusiMetode, topFundraiser, topDonatur, riwayatTransaksi,
 followUpTickets, donasiPerCabang, campaignProgress = []
}: any) {
 const [month, setMonth] = useState(filters?.month !== null && filters?.month !== undefined ? String(filters.month) : '');
 const [year, setYear] = useState(filters?.year !== null && filters?.year !== undefined ? String(filters.year) : '');
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [selectedDonasiCabang, setSelectedDonasiCabang] = useState<any>(null);
 const [donaturDetails, setDonaturDetails] = useState<any[]>([]);
 const [isFetchingDonatur, setIsFetchingDonatur] = useState(false);
 const [selectedCampaign, setSelectedCampaign] = useState<any>(null);

 const applyFilter = () => {
  const params: any = {};
  if (month) params.month = month;
  if (year) params.year = year;
  router.get(route('admin.dashboard'), params, {});
 };

 const handleCabangClick = async (cabang: any) => {
  setSelectedDonasiCabang(cabang);
  setIsModalOpen(true);
  setIsFetchingDonatur(true);
  setDonaturDetails([]);
  try {
   const response = await fetch(`/admin/dashboard/donasi-cabang/${cabang.divisi_id === null ? 'null' : cabang.divisi_id}/${cabang.org_unit_id === null ? 'null' : cabang.org_unit_id}?month=${month}&year=${year}`);
   const data = await response.json();
   setDonaturDetails(data);
  } catch (error) {
   console.error('Error fetching donatur details:', error);
  } finally {
   setIsFetchingDonatur(false);
  }
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
  { label: 'Total Donasi (Rp)', value: rupiah(totalDonasi), icon: Coins, bg: 'from-emerald-500 to-emerald-600' },
  { label: 'Total Transaksi', value: totalTransaksi, icon: Receipt, bg: 'from-blue-500 to-blue-600' },
  { label: 'Total Donatur', value: totalDonatur, icon: Users, bg: 'from-indigo-500 to-indigo-600' },
  { label: 'Fundraiser Aktif', value: fundraiserAktif, icon: UserCheck, bg: 'from-violet-500 to-violet-600' },
 ];

 const cabangColumns = [
  { key: 'nama_cabang', header: 'Cabang / Sub Divisi', render: (row: any) => <span className="font-medium text-slate-900">{row.nama_cabang}</span> },
  { key: 'total_transaksi', header: 'Transaksi', render: (row: any) => <span className="tabular-nums">{row.total_transaksi}</span> },
  { key: 'total_donasi', header: 'Total Donasi (Rp)', render: (row: any) => <span className="font-semibold text-emerald-600 tabular-nums">{rupiah(row.total_donasi)}</span> },
  {
   key: 'aksi',
   header: 'Aksi',
   className: 'w-[110px]',
   render: (row: any) => (
    <Button variant="outline" size="sm" onClick={() => handleCabangClick(row)}>
     <Eye className="w-4 h-4 mr-1.5" /> Detail
    </Button>
   ),
  },
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
  { key: 'total_tiket', header: 'Total Transaksi', render: (row: any) => <span className="tabular-nums">{row.total_tiket}</span> },
  { key: 'total_donasi', header: 'Total Donasi (Rp)', render: (row: any) => <span className="font-semibold text-emerald-600 tabular-nums">{rupiah(row.total_donasi)}</span> },
 ];

 const donaturColumns = [
  { key: 'nama_donatur', header: 'Nama Donatur', render: (row: any) => <span className="font-medium text-slate-900">{row.nama_donatur}</span> },
  { key: 'total_transaksi', header: 'Total Transaksi', render: (row: any) => `${row.total_transaksi}x` },
  { key: 'total_donasi', header: 'Total Donasi (Rp)', render: (row: any) => <span className="font-semibold text-emerald-600 tabular-nums">{rupiah(row.total_donasi)}</span> },
 ];

 const riwayatColumns = [
  {
   key: 'created_at',
   header: 'Waktu Transaksi',
   render: (row: any) => new Date(row.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
  },
  {
   key: 'user',
   header: 'Fundraiser',
   render: (row: any) => <span className="font-medium text-slate-900">{row.user?.name || row.user?.username || '-'}</span>,
  },
  { key: 'donatur', header: 'Donatur', render: (row: any) => <span>{row.donatur?.nama_lengkap || '-'}</span> },
  { key: 'status', header: 'Status', render: (row: any) => <StatusBadge status={row.status} /> },
  { key: 'jumlah_donasi', header: 'Nominal', render: (row: any) => <span className="font-semibold text-emerald-600 tabular-nums">{rupiah(row.jumlah_donasi)}</span> },
 ];


 return (
  <AdminLayout title="Dashboard">
   <Head title="Dashboard" />
   <div className="space-y-6">

    {/* Header */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
     <div>
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      <p className="text-sm text-muted-foreground mt-1">Ringkasan donasi, kinerja fundraiser, dan progress campaign.</p>
     </div>
     <div className="flex items-center gap-2">
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
      <Button onClick={applyFilter} size="sm">Terapkan</Button>
     </div>
    </div>

    {/* KPI Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
     {kpiCards.map(({ label, value, icon: Icon, bg }) => (
      <div key={label} className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${bg} shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5`}>
       <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/20 blur-xl pointer-events-none transition-transform duration-500 group-hover:scale-150" />
       <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/5 blur-lg pointer-events-none" />
       <div className="relative p-5 text-white">
        <div className="flex items-start justify-between">
         <span className="text-sm font-medium text-white/80">{label}</span>
         <Icon className="h-6 w-6 text-white opacity-70 transition-all duration-300 group-hover:-translate-y-2 group-hover:rotate-12 group-hover:opacity-100" />
        </div>
        <p className="mt-3 text-2xl lg:text-3xl font-bold truncate">{value}</p>
       </div>
      </div>
     ))}
     </div>

    {/* Data Perlu Ditindak Lanjuti */}
    {followUpTickets?.length > 0 ? (
     <Card className="border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
       <CardTitle className="text-base font-semibold flex items-center gap-2.5 text-amber-950">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 shadow-sm">
         <AlertTriangle className="h-5 w-5 text-white" />
        </div>
        <span>Data Perlu Ditindak Lanjuti</span>
        <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
         {followUpTickets.length} item
        </span>
       </CardTitle>
       <Button variant="outline" size="sm" className="shrink-0 border-amber-400 bg-white/70 text-amber-800 hover:bg-white hover:text-amber-900" onClick={() => router.get(route('admin.laporan.data'))}>
        Lihat Semua
       </Button>
      </CardHeader>
      <CardContent>
       <div className="space-y-2">
        {followUpTickets.map((t: any) => (
         <div key={t.id} className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-white p-3 text-sm shadow-sm transition-all hover:border-amber-400 hover:shadow-md">
          <div className="flex items-center gap-3 min-w-0">
           <span className="shrink-0 rounded-md bg-amber-100 px-2 py-1 font-mono font-semibold text-amber-800">#DAT-{formatTicketId(t.id)}</span>
           <StatusBadge status={t.status} />
           <div className="min-w-0">
            <span className="block truncate font-medium text-slate-900">{t.user?.name || t.user?.username || '-'}</span>
            <span className="block truncate text-xs text-slate-500">{t.unit?.nama_unit}{t.sub_unit ? ` / ${t.sub_unit.nama_layanan}` : ''}</span>
           </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
           <span className="font-bold text-emerald-600 tabular-nums">{rupiah(t.jumlah_donasi)}</span>
           <Button variant="ghost" size="icon" className="h-8 w-8 border border-slate-200" onClick={() => router.get(route('admin.data.show', t.id))}>
            <Eye className="h-4 w-4" />
           </Button>
          </div>
         </div>
        ))}
       </div>
      </CardContent>
     </Card>
    ) : (
     <Card className="border-green-200 bg-green-50/50">
      <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
       <CheckCircle className="h-10 w-10 text-green-400" />
       <p className="text-sm font-medium text-green-800">Semua data sudah ditindak lanjuti.</p>
       <p className="text-xs text-muted-foreground">Tidak ada transaksi dengan status open atau pending.</p>
      </CardContent>
     </Card>
    )}

    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
     <Card>
      <CardHeader className="pb-2">
       <CardTitle className="text-base flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-emerald-600" /> Tren Donasi per Bulan
       </CardTitle>
      </CardHeader>
      <CardContent>
       {monthlyTrend?.some((d: any) => d.total > 0) ? (
        <LazyECharts option={{
         tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          valueFormatter: (v: any) => 'Rp ' + new Intl.NumberFormat('id-ID').format(Number(v) || 0),
         },
         grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
         xAxis: { type: 'category', data: monthlyTrend.map((d: any) => d.bulan) },
         yAxis: { type: 'value', axisLabel: { formatter: (v: number) => rupiahCompact(v) } },
         series: [{
          name: 'Nominal Donasi',
          type: 'bar',
          barMaxWidth: 28,
          itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] },
          data: monthlyTrend.map((d: any) => d.total),
         }],
        }} height={280} />
       ) : (
        <p className="text-sm text-muted-foreground text-center py-8">Belum ada data donasi.</p>
       )}
      </CardContent>
     </Card>

     <Card>
      <CardHeader className="pb-2">
       <CardTitle className="text-base flex items-center gap-2">
        <PieChart className="w-4 h-4 text-blue-600" /> Distribusi Donasi per Metode Pembayaran
       </CardTitle>
      </CardHeader>
      <CardContent>
       {distribusiMetode?.length > 0 ? (
        <LazyECharts option={{
         tooltip: {
          trigger: 'item',
          valueFormatter: (v: any) => 'Rp ' + new Intl.NumberFormat('id-ID').format(Number(v) || 0),
         },
         legend: { bottom: 0, type: 'scroll', itemWidth: 12, itemHeight: 12, textStyle: { fontSize: 11 } },
         series: [{
          name: 'Metode Pembayaran',
          type: 'pie',
          radius: ['40%', '68%'],
          center: ['50%', '44%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          emphasis: { label: { show: true, fontSize: 12, fontWeight: 'bold' } },
          data: distribusiMetode.map((d: any, i: number) => ({ name: d.name, value: d.value, itemStyle: { color: PIE_COLORS[i % PIE_COLORS.length] } })),
         }],
        }} height={280} />
       ) : (
        <p className="text-sm text-muted-foreground text-center py-8">Belum ada data distribusi.</p>
       )}
      </CardContent>
     </Card>
    </div>

    {/* Campaign Progress */}
    {campaignProgress?.length > 0 && (
     <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-800">Progress Program Fundraising</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
       {campaignProgress.map((camp: any) => (
        <Card
         key={camp.id}
         className="shadow-sm border-slate-200 cursor-pointer hover:shadow-md transition-all duration-200 group hover:-translate-y-0.5"
         onClick={() => setSelectedCampaign(camp)}
        >
         <CardContent className="p-4 space-y-3">
          <div className="flex justify-between items-start">
           <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">{camp.nama_campaign}</h3>
           <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded-md whitespace-nowrap">{camp.persentase}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
           <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${camp.persentase}%` }} />
          </div>
          <div className="flex justify-between text-xs text-slate-500">
           <span>Terkumpul: <b className="text-slate-700">{rupiah(camp.terkumpul)}</b></span>
           <span>Target: {rupiah(camp.target_dana)}</span>
          </div>
         </CardContent>
        </Card>
       ))}
      </div>
     </div>
    )}

    {/* Donasi per Cabang */}
    <Card>
     <CardHeader className="pb-3 border-b border-slate-100">
      <CardTitle className="text-base font-bold flex items-center gap-2">
       <span className="h-4 w-1 rounded-full bg-indigo-500"></span>
       Distribusi Donasi per Cabang
      </CardTitle>
     </CardHeader>
     <CardContent className="p-4">
      <div className="overflow-x-auto rounded-md border">
       <DataTable columns={cabangColumns} data={donasiPerCabang || []} keyExtractor={(r: any) => r.identifier} columnBorders emptyMessage="Belum ada data donasi cabang." />
      </div>
     </CardContent>
    </Card>

    {/* Top Fundraiser & Top Donatur */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
     <Card>
      <CardHeader className="pb-3">
       <CardTitle className="text-sm font-semibold">Top 10 Fundraiser</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
       <div className="overflow-x-auto rounded-md border">
        <DataTable columns={fundraiserColumns} data={topFundraiser || []} keyExtractor={(r: any) => r.username} columnBorders emptyMessage="Belum ada data fundraiser." />
       </div>
      </CardContent>
     </Card>

     <Card>
      <CardHeader className="pb-3">
       <CardTitle className="text-sm font-semibold">Top 10 Donatur</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
       <div className="overflow-x-auto rounded-md border">
        <DataTable columns={donaturColumns} data={topDonatur || []} keyExtractor={(r: any) => `${r.nama_donatur}-${r.total_transaksi}-${r.total_donasi}`} columnBorders emptyMessage="Belum ada data donatur." />
       </div>
      </CardContent>
     </Card>
    </div>

    {/* Riwayat Transaksi */}
    <Card>
     <CardHeader className="pb-3">
      <CardTitle className="text-sm font-semibold">Riwayat Transaksi Terbaru</CardTitle>
     </CardHeader>
     <CardContent className="p-4">
      <div className="overflow-x-auto rounded-md border">
       <DataTable columns={riwayatColumns} data={riwayatTransaksi || []} keyExtractor={(r: any) => r.id} columnBorders emptyMessage="Belum ada transaksi donasi." />
      </div>
      </CardContent>
     </Card>

    {/* Modal Detail Donatur per Cabang */}
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
     <DialogContent className="sm:max-w-3xl">
      <DialogHeader>
       <DialogTitle>Rincian Donatur: {selectedDonasiCabang?.nama_cabang}</DialogTitle>
      </DialogHeader>
      <div className="mt-4">
       <div className="flex flex-col sm:flex-row gap-4 mb-4 justify-between text-sm">
        <div className="p-3 bg-slate-50 border rounded-md flex-1">
         <p className="text-slate-500 mb-1">Total Donasi Cabang</p>
         <p className="font-bold text-emerald-600 text-lg">{rupiah(selectedDonasiCabang?.total_donasi)}</p>
        </div>
        <div className="p-3 bg-slate-50 border rounded-md flex-1">
         <p className="text-slate-500 mb-1">Total Transaksi</p>
         <p className="font-bold text-slate-800 text-lg">{selectedDonasiCabang?.total_transaksi || 0} Transaksi</p>
        </div>
       </div>
       <div className="max-h-[60vh] overflow-y-auto rounded-md border">
        {isFetchingDonatur ? (
         <div className="flex flex-col items-center justify-center py-12 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin mb-2 text-indigo-500" />
          <span>Memuat data...</span>
         </div>
        ) : donaturDetails.length > 0 ? (
         <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 sticky top-0">
           <tr>
            <th className="py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider border-l border-slate-200">Nama Donatur</th>
            <th className="py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider text-center border-l border-slate-200">Total Transaksi</th>
            <th className="py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider text-right border-l border-slate-200">Total Nominal (Rp)</th>
           </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
           {donaturDetails.map((donatur, idx) => (
            <tr key={idx} className="border-l border-slate-200 first:border-l-0">
             <td className="py-3 px-4 font-medium border-l border-slate-200">{donatur.nama_donatur}</td>
             <td className="py-3 px-4 text-center border-l border-slate-200">{donatur.total_transaksi}x</td>
             <td className="py-3 px-4 text-right font-semibold text-emerald-600 border-l border-slate-200">{rupiah(donatur.total_donasi)}</td>
            </tr>
           ))}
          </tbody>
         </table>
        ) : (
         <p className="py-12 text-center text-slate-500 text-sm">Tidak ada rincian data donatur (semua donatur anonim/kosong).</p>
        )}
       </div>
      </div>
     </DialogContent>
    </Dialog>

    {/* Modal Detail Campaign */}
    <Dialog open={!!selectedCampaign} onOpenChange={(open) => !open && setSelectedCampaign(null)}>
     <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0 border-0">
      {selectedCampaign && (
       <div className="flex flex-col bg-white rounded-2xl overflow-hidden">
        {selectedCampaign.banner_url ? (
         <img src={selectedCampaign.banner_url} alt="Banner" className="w-full h-56 object-cover" />
        ) : (
         <div className="w-full h-48 bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center">
          <span className="text-white text-lg font-bold opacity-50">Fundata Campaign</span>
         </div>
        )}
        <div className="p-6 space-y-4">
         <div className="flex items-start justify-between gap-4">
          <div>
           <h2 className="text-2xl font-bold text-slate-800 leading-tight">{selectedCampaign.nama_campaign}</h2>
           {(selectedCampaign.tgl_mulai || selectedCampaign.tgl_selesai) && (
            <p className="text-sm text-slate-500 mt-1">
             Periode: {selectedCampaign.tgl_mulai ? new Date(selectedCampaign.tgl_mulai).toLocaleDateString('id-ID') : '-'} {selectedCampaign.tgl_selesai ? `s/d ${new Date(selectedCampaign.tgl_selesai).toLocaleDateString('id-ID')}` : ''}
            </p>
           )}
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${selectedCampaign.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
           {selectedCampaign.is_active !== false ? 'Aktif' : 'Nonaktif'}
          </span>
         </div>
         {selectedCampaign.deskripsi && (
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedCampaign.deskripsi}</p>
         )}
         <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3 mt-4">
          <div className="flex justify-between text-sm font-semibold text-slate-700">
           <span>Progress Fundraising: {selectedCampaign.persentase}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
           <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${selectedCampaign.persentase}%` }} />
          </div>
          <div className="flex justify-between text-xs text-slate-500 font-medium pt-1">
           <span className="text-slate-700">Terkumpul: <b className="text-emerald-600">{rupiah(selectedCampaign.terkumpul || selectedCampaign.records_sum_jumlah_donasi)}</b></span>
           <span>Target: {rupiah(selectedCampaign.target_dana)}</span>
          </div>
         </div>
        </div>
       </div>
      )}
     </DialogContent>
    </Dialog>
   </div>
  </AdminLayout>
 );
}
