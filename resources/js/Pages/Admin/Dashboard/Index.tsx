import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { StatusBadge } from '@/Components/StatusBadge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import MonthlyUnitChart from '@/Components/Charts/MonthlyUnitChart';
import SubUnitChart from '@/Components/Charts/SubUnitChart';
import { AlertTriangle, Eye, Clock, Hourglass, Folder, Loader2, RotateCw, CheckCircle, XCircle, ChevronDown, Calendar, PlusCircle, Star, Coins, Users } from 'lucide-react';
import LazyECharts from '@/Components/Charts/LazyECharts';
import { formatTicketId } from '@/lib/utils';

const PIE_COLORS = ['#22c55e', '#ef4444', '#f97316'];

const STATUS_META: Record<string, { label: string; bg: string; icon: React.ElementType; anim: string }> = {
 open: { label: 'Data Masuk', bg: 'from-blue-500 to-blue-600', icon: Folder, anim: 'group-hover:-translate-y-2 group-hover:rotate-12 group-hover:opacity-100' },
 on_proses: { label: 'Diproses', bg: 'from-orange-500 to-orange-600', icon: Clock, anim: 'group-hover:-rotate-12 group-hover:scale-110 group-hover:opacity-100' },
 pending: { label: 'Tertunda', bg: 'from-zinc-500 to-zinc-600', icon: Hourglass, anim: 'group-hover:rotate-180 transition-transform duration-500 group-hover:opacity-100' },
 solve: { label: 'Selesai', bg: 'from-green-500 to-green-600', icon: CheckCircle, anim: 'group-hover:scale-125 group-hover:opacity-100' },
 reject: { label: 'Ditolak', bg: 'from-red-500 to-red-600', icon: XCircle, anim: 'group-hover:rotate-90 group-hover:scale-110 group-hover:opacity-100' },
};

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';

export default function DashboardIndex({ totalTickets, statusCounts, followUpTickets, monthlyChartData, yearlyChartData, dailyChartData, subUnitChartData, units, filters, slaStats, slaPieChartData, slaBarChartData, slaTrendData, slaFilters, csatTrend, tiketBulanan, totalDonasi, totalDonatur, donasiPerCabang, topAmil, topDonatur, riwayatTransaksi, campaignProgress = [] }: any) {
 const [month, setMonth] = useState(filters?.month !== null && filters?.month !== undefined ? String(filters.month) : '');
 const [year, setYear] = useState(filters?.year !== null && filters?.year !== undefined ? String(filters.year) : '');
 const [selectedUnit, setSelectedUnit] = useState('');
 const [chartMode, setChartMode] = useState<'bulanan' | 'tahunan'>('bulanan');

 const chartData = chartMode === 'tahunan' ? yearlyChartData : monthlyChartData;
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [selectedDonasiCabang, setSelectedDonasiCabang] = useState<any>(null);
 const [donaturDetails, setDonaturDetails] = useState<any[]>([]);
 const [isFetchingDonatur, setIsFetchingDonatur] = useState(false);
 const [selectedCampaign, setSelectedCampaign] = useState<any>(null);

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

 const applyFilter = () => {
 const params: any = {};
 if (month) params.month = month;
 if (year) params.year = year;
 router.get(route('admin.dashboard'), params, {});
 };

 const currentSubUnitData = selectedUnit
 ? (subUnitChartData?.[selectedUnit] || [])
 : (subUnitChartData?.['_all'] || []);

 const completionRate = totalTickets > 0 ? Math.round((statusCounts?.solve / totalTickets) * 100) : 0;

 const totalCsatReviews = csatTrend?.reduce((acc: number, curr: any) => acc + curr.total, 0) || 0;
 const avgCsatRaw = totalCsatReviews > 0 ? csatTrend?.reduce((acc: number, curr: any) => acc + (curr.rata_rata * curr.total), 0) / totalCsatReviews : 0;
 const avgCsat = Math.round(avgCsatRaw * 10) / 10;

 const bars = [
 { label: 'Data Masuk', count: statusCounts?.open || 0, color: 'bg-amber-400', icon: Folder },
 { label: 'Diproses', count: statusCounts?.on_proses || 0, color: 'bg-primary/100', icon: Clock },
 { label: 'Tertunda', count: statusCounts?.pending || 0, color: 'bg-cyan-400', icon: Hourglass },
 ];

 const months = [
 { value: '', label: 'Semua Bulan' },
 ...Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: new Date(0, i).toLocaleString('id', { month: 'long' }) })),
 ];

 const years = [
 { value: '', label: 'Semua Tahun' },
 ...Array.from({ length: 5 }, (_, i) => ({ value: String(new Date().getFullYear() - i), label: String(new Date().getFullYear() - i) })),
 ];

 return (
 <AdminLayout title="Dashboard Admin">
 <Head title="Dashboard Admin" />

 <div className="flex flex-col gap-1 mb-6">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h1 className="text-2xl font-semibold tracking-tight">Dashboard Admin</h1>
 <p className="text-sm text-muted-foreground mt-0.5">Ringkasan dan statistik sistem layanan.</p>
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
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
 <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 print:break-inside-avoid print:shadow-none">
 <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/20 blur-xl pointer-events-none transition-transform duration-500 group-hover:scale-150" />
 <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/5 blur-lg pointer-events-none" />
 <div className="relative p-5 text-white">
 <div className="flex items-start justify-between">
 <span className="text-sm font-medium text-white/80">Total Donasi (Rp)</span>
 <Coins className="h-6 w-6 text-white opacity-70 transition-all duration-300 group-hover:-translate-y-2 group-hover:rotate-12 group-hover:opacity-100" />
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
 <Users className="h-6 w-6 text-white opacity-70 transition-all duration-300 group-hover:scale-110 group-hover:opacity-100" />
 </div>
 <p className="mt-3 text-3xl font-bold">{totalDonatur || 0}</p>
 </div>
 </div>
 </div>

 <div className="mb-6">
 <Card className="print:break-inside-avoid shadow-sm hover:shadow-md transition-shadow">
 <CardHeader className="pb-3 border-b border-slate-100">
 <CardTitle className="text-base font-bold flex items-center gap-2">
 <span className="h-4 w-1 rounded-full bg-indigo-500"></span>
 Distribusi Donasi per Cabang
 </CardTitle>
 </CardHeader>
 <CardContent className="p-0">
 <div className="overflow-x-auto max-h-[300px] relative scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
 <table className="w-full text-sm text-left">
 <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm z-10">
 <tr>
 <th className="py-3 px-4 font-semibold text-slate-600">Cabang / Sub Divisi</th>
 <th className="py-3 px-4 font-semibold text-slate-600 text-center">Jumlah Transaksi</th>
 <th className="py-3 px-4 font-semibold text-right text-slate-600">Total Donasi (Rp)</th>
 <th className="py-3 px-4 font-semibold text-center text-slate-600 w-[100px]">Aksi</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {donasiPerCabang?.map((cabang: any, idx: number) => (
 <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
 <td className="py-3 px-4 font-medium">{cabang.nama_cabang}</td>
 <td className="py-3 px-4 text-center">{cabang.total_transaksi}</td>
 <td className="py-3 px-4 text-right font-semibold text-emerald-600">
 {new Intl.NumberFormat('id-ID').format(cabang.total_donasi)}
 </td>
 <td className="py-3 px-4 text-center">
 <Button variant="outline" size="sm" className="h-8" onClick={() => handleCabangClick(cabang)}>
 <Eye className="w-4 h-4 mr-1.5" /> Detail
 </Button>
 </td>
 </tr>
 ))}
 {(!donasiPerCabang || donasiPerCabang.length === 0) && (
 <tr>
 <td colSpan={4} className="py-8 text-center text-muted-foreground">Belum ada data donasi cabang.</td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </CardContent>
 </Card>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
 {Object.entries(STATUS_META).map(([key, meta]) => {
 const Icon = meta.icon;
 return (
 <div
 key={key}
 className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${meta.bg} shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5`}
 >
 <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/20 blur-xl pointer-events-none transition-transform duration-500 group-hover:scale-150" />
 <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/5 blur-lg pointer-events-none" />
 <div className="relative p-5 text-white">
 <div className="flex items-start justify-between">
 <span className="text-sm font-medium text-white/80">{meta.label}</span>
 <Icon className={`h-6 w-6 text-white opacity-70 transition-all duration-300 ${meta.anim}`} />
 </div>
 <p className="mt-3 text-3xl font-bold">{statusCounts?.[key] ?? 0}</p>
 </div>
 </div>
 );
 })}
 </div>

  {/* CAMPAIGN PROGRESS */}
  {campaignProgress?.length > 0 && (
    <div className="space-y-4 mb-8">
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
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded-md whitespace-nowrap">
                  {camp.persentase}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${camp.persentase}%` }} 
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Terkumpul: <b className="text-slate-700">Rp {new Intl.NumberFormat('id-ID').format(camp.terkumpul)}</b></span>
                <span>Target: Rp {new Intl.NumberFormat('id-ID').format(camp.target_dana)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )}

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
 <Card className="flex flex-col">
 <CardHeader className="flex flex-row items-center gap-2 pb-3">
 <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 ">
 <AlertTriangle className="h-4 w-4 text-orange-500" />
 </div>
 <CardTitle className="text-sm font-semibold">Data Perlu Ditindak Lanjuti</CardTitle>
 </CardHeader>
 <CardContent className="flex-1 overflow-auto">
 {followUpTickets?.length > 0 ? (
 <div className="space-y-2">
 {followUpTickets.map((t: any) => (
 <div key={t.id} className="flex items-center justify-between rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50">
 <div className="flex items-center gap-3 min-w-0">
 <span className="shrink-0 font-semibold text-foreground">#DAT-{formatTicketId(t.id)}</span>
 <StatusBadge status={t.status} />
 <span className="text-muted-foreground truncate">{t.user?.username || '-'}</span>
 <span className="hidden md:inline text-xs text-muted-foreground/60 truncate">{t.unit?.nama_unit} / {t.sub_unit?.nama_layanan}</span>
 </div>
 <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => router.get(route('admin.tiket.show', t.id))}>
 <Eye className="h-4 w-4" />
 </Button>
 </div>
 ))}
 </div>
 ) : (
 <div className="flex flex-col items-center gap-2 py-8 text-center">
 <CheckCircle className="h-8 w-8 text-green-400" />
 <p className="text-sm text-muted-foreground">Semua data sudah ditindak lanjuti.</p>
 </div>
 )}
 </CardContent>
 </Card>

 <Card className="flex flex-col">
 <CardHeader className="pb-3">
 <CardTitle className="text-lg font-bold">Ringkasan Status</CardTitle>
 </CardHeader>
 <CardContent className="flex-1 flex flex-col">
 <div className="flex items-center gap-4 rounded-lg border bg-slate-50/50 p-4 ">
 <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 shrink-0">
 <svg className="absolute h-full w-full -rotate-90 transform text-emerald-500" viewBox="0 0 100 100">
 <circle className="text-emerald-500/20" strokeWidth="10" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
 <circle className="text-emerald-500 transition-all duration-1000 ease-in-out" strokeWidth="10" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * completionRate) / 100} strokeLinecap="round" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
 </svg>
 <span className="text-sm font-bold text-emerald-600 ">{completionRate}%</span>
 </div>
 <div>
 <p className="font-semibold text-sm">Tingkat Penyelesaian</p>
 <p className="text-xs text-muted-foreground mt-0.5">Persentase permohonan selesai.</p>
 </div>
 </div>

 <div className="space-y-4 mt-6">
 {bars.map(bar => {
 const percent = totalTickets > 0 ? (bar.count / totalTickets) * 100 : 0;
 return (
 <div key={bar.label} className="space-y-2">
 <div className="flex items-center justify-between text-xs font-bold">
 <div className={`flex items-center gap-1.5 ${bar.color.replace('bg-', 'text-')}`}>
 <bar.icon className="w-3.5 h-3.5" />
 <span>{bar.label}</span>
 </div>
 <span className="text-foreground">{bar.count}</span>
 </div>
 <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 ">
 <div className={`h-full rounded-full ${bar.color}`} style={{ width:`${percent}%`}} />
 </div>
 </div>
 )
 })}
 </div>
 </CardContent>
 </Card>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
 <Card>
 <CardHeader className="pb-3">
 <div className="flex items-center justify-between">
 <CardTitle className="text-sm font-semibold">Grafik {chartMode === 'tahunan' ? 'Tahunan' :`Bulanan${year ?`(${year})`: ''}`}</CardTitle>
 <div className="flex gap-1">
 <Button variant={chartMode === 'bulanan' ? 'default' : 'outline'} size="sm" onClick={() => setChartMode('bulanan')}>Bulanan</Button>
 <Button variant={chartMode === 'tahunan' ? 'default' : 'outline'} size="sm" onClick={() => setChartMode('tahunan')}>Tahunan</Button>
 </div>
 </div>
 </CardHeader>
 <CardContent>
 {chartData?.length > 0
 ? <MonthlyUnitChart data={chartData} xKey={chartMode === 'tahunan' ? 'tahun' : 'bulan'} />
 : <p className="text-sm text-muted-foreground text-center py-8">{chartMode === 'tahunan' ? 'Belum ada data tahunan.' : 'Pilih tahun untuk menampilkan grafik bulanan.'}</p>
 }
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="pb-3">
 <div className="flex items-center justify-between">
 <CardTitle className="text-sm font-semibold">Grafik per Sub Unit</CardTitle>
 <select className="rounded-md border border-input bg-transparent px-2 py-1 text-xs" value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)}>
 <option value="">Semua Unit</option>
 {units?.map((u: any) => <option key={u.id} value={u.id}>{u.nama_unit}</option>)}
 </select>
 </div>
 </CardHeader>
 <CardContent>
 {currentSubUnitData?.length > 0
 ? <SubUnitChart data={currentSubUnitData} />
 : <p className="text-sm text-muted-foreground text-center py-8">Pilih unit untuk melihat grafik.</p>
 }
 </CardContent>
 </Card>
 </div>

 <Card className="mb-8">
 <CardHeader className="pb-3">
 <CardTitle className="text-sm font-semibold">Grafik Data Harian (7 Hari Terakhir)</CardTitle>
 </CardHeader>
 <CardContent>
 {dailyChartData?.length > 0 ? (
 <LazyECharts option={{
 tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
 legend: { bottom: 0 },
 grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
 xAxis: { type: 'category', data: dailyChartData.map((d: any) => d.date) },
 yAxis: { type: 'value' },
 series: units.map((u: any, i: number) => ({
 name: u.nama_unit,
 type: 'line',
 smooth: true,
 data: dailyChartData.map((d: any) => d[u.nama_unit] || 0)
 }))
 }} height={350} />
 ) : (
 <p className="text-sm text-muted-foreground text-center py-8">Belum ada data harian.</p>
 )}
 </CardContent>
 </Card>

 <section className="mb-8 space-y-6">
 <div className="flex items-center gap-2">
 <div className="h-5 w-1 rounded-full bg-primary" />
 <h2 className="text-lg font-semibold">Peringkat & Riwayat</h2>
 </div>
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 
 <Card>
 <CardHeader><CardTitle className="text-sm font-semibold">Kinerja Pengumpulan Donasi per Amil (Top 10)</CardTitle></CardHeader>
 <CardContent className="p-0">
 <div className="overflow-x-auto max-h-[350px] scrollbar-thin scrollbar-thumb-slate-200">
 <Table>
 <TableHeader className="sticky top-0 bg-white shadow-sm z-10">
 <TableRow>
 <TableHead>Amil / Staf</TableHead>
 <TableHead className="text-center">Total Data</TableHead>
 <TableHead className="text-right">Nominal Donasi</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {topAmil?.length > 0 ? topAmil.map((amil: any, idx: number) => (
 <TableRow key={idx}>
 <TableCell>
 <div className="font-medium text-slate-800">{amil.name}</div>
 <div className="text-xs text-slate-500">@{amil.username}</div>
 </TableCell>
 <TableCell className="text-center">{amil.total_tiket}</TableCell>
 <TableCell className="text-right font-semibold text-emerald-600">Rp {new Intl.NumberFormat('id-ID').format(amil.total_donasi)}</TableCell>
 </TableRow>
 )) : (
 <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">Belum ada data.</TableCell></TableRow>
 )}
 </TableBody>
 </Table>
 </div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader><CardTitle className="text-sm font-semibold">Top 10 Donatur</CardTitle></CardHeader>
 <CardContent className="p-0">
 <div className="overflow-x-auto max-h-[350px] scrollbar-thin scrollbar-thumb-slate-200">
 <Table>
 <TableHeader className="sticky top-0 bg-white shadow-sm z-10">
 <TableRow>
 <TableHead>Nama Donatur</TableHead>
 <TableHead className="text-center">Total Transaksi</TableHead>
 <TableHead className="text-right">Nominal Total</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {topDonatur?.length > 0 ? topDonatur.map((donatur: any, idx: number) => (
 <TableRow key={idx}>
 <TableCell className="font-medium text-slate-800">{donatur.nama_donatur}</TableCell>
 <TableCell className="text-center">{donatur.total_transaksi}x</TableCell>
 <TableCell className="text-right font-semibold text-emerald-600">Rp {new Intl.NumberFormat('id-ID').format(donatur.total_donasi)}</TableCell>
 </TableRow>
 )) : (
 <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">Belum ada data donatur.</TableCell></TableRow>
 )}
 </TableBody>
 </Table>
 </div>
 </CardContent>
 </Card>
 </div>
 </section>

 <section className="mb-8 space-y-6">
 <Card>
 <CardHeader><CardTitle className="text-sm font-semibold">Riwayat 10 Transaksi Terbaru</CardTitle></CardHeader>
 <CardContent className="p-0">
 <div className="overflow-x-auto max-h-[400px] scrollbar-thin scrollbar-thumb-slate-200">
 <Table>
 <TableHeader className="sticky top-0 bg-white shadow-sm z-10">
 <TableRow>
 <TableHead>Waktu Transaksi</TableHead>
 <TableHead>Penginput (Amil)</TableHead>
 <TableHead>Nama Donatur</TableHead>
 <TableHead>Status</TableHead>
 <TableHead className="text-right">Nominal</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {riwayatTransaksi?.length > 0 ? riwayatTransaksi.map((trx: any) => (
 <TableRow key={trx.id}>
 <TableCell className="text-sm">
 {new Date(trx.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
 </TableCell>
 <TableCell>
 <div className="font-medium text-slate-800">{trx.user?.name}</div>
 </TableCell>
 <TableCell className="font-medium">{trx.donatur?.nama_lengkap || '-'}</TableCell>
 <TableCell>
 <StatusBadge status={trx.status} />
 </TableCell>
 <TableCell className="text-right font-semibold text-emerald-600">
 Rp {new Intl.NumberFormat('id-ID').format(trx.jumlah_donasi)}
 </TableCell>
 </TableRow>
 )) : (
 <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Belum ada transaksi donasi.</TableCell></TableRow>
 )}
 </TableBody>
 </Table>
 </div>
 </CardContent>
 </Card>
 </section>

 <section className="mb-8 space-y-6">
 <Card className="w-full">
 <CardHeader><CardTitle className="text-sm font-semibold">Data Bulanan (12 Bulan)</CardTitle></CardHeader>
 <CardContent>
 {tiketBulanan?.length > 0 ? (
 <LazyECharts option={{
 tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
 legend: { bottom: 0 },
 grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
 xAxis: { type: 'category', data: tiketBulanan.map((d: any) => d.bulan) },
 yAxis: { type: 'value' },
 series: [
 { name: 'Total Data', type: 'bar', itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] }, data: tiketBulanan.map((d: any) => d.total) },
 { name: 'Selesai', type: 'bar', itemStyle: { color: '#22c55e', borderRadius: [4, 4, 0, 0] }, data: tiketBulanan.map((d: any) => d.selesai) },
 { name: 'Aktif', type: 'bar', itemStyle: { color: '#f97316', borderRadius: [4, 4, 0, 0] }, data: tiketBulanan.map((d: any) => d.aktif) }
 ]
 }} height={300} />
 ) : (
 <p className="text-sm text-muted-foreground text-center py-8">Belum ada data bulanan.</p>
 )}
 </CardContent>
 </Card>
 </section>

 <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
 <DialogContent className="sm:max-w-3xl">
 <DialogHeader>
 <DialogTitle>Rincian Donatur: {selectedDonasiCabang?.nama_cabang}</DialogTitle>
 </DialogHeader>
 
 <div className="mt-4">
 <div className="flex flex-col sm:flex-row gap-4 mb-4 justify-between text-sm">
 <div className="p-3 bg-slate-50 border rounded-md flex-1">
 <p className="text-slate-500 mb-1">Total Donasi Cabang</p>
 <p className="font-bold text-emerald-600 text-lg">Rp {new Intl.NumberFormat('id-ID').format(selectedDonasiCabang?.total_donasi || 0)}</p>
 </div>
 <div className="p-3 bg-slate-50 border rounded-md flex-1">
 <p className="text-slate-500 mb-1">Total Transaksi</p>
 <p className="font-bold text-slate-800 text-lg">{selectedDonasiCabang?.total_transaksi || 0} Transaksi</p>
 </div>
 </div>

 <div className="max-h-[60vh] overflow-y-auto rounded-md border">
 <Table>
 <TableHeader className="bg-slate-50 sticky top-0">
 <TableRow>
 <TableHead>Nama Donatur</TableHead>
 <TableHead className="text-center">Total Transaksi</TableHead>
 <TableHead className="text-right">Total Nominal (Rp)</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {isFetchingDonatur ? (
 <TableRow>
 <TableCell colSpan={3} className="h-24 text-center">
 <div className="flex flex-col items-center justify-center text-slate-500">
 <Loader2 className="h-6 w-6 animate-spin mb-2 text-indigo-500" />
 <span>Memuat data...</span>
 </div>
 </TableCell>
 </TableRow>
 ) : donaturDetails.length > 0 ? (
 donaturDetails.map((donatur, idx) => (
 <TableRow key={idx}>
 <TableCell className="font-medium">{donatur.nama_donatur}</TableCell>
 <TableCell className="text-center">{donatur.total_transaksi}x</TableCell>
 <TableCell className="text-right font-semibold text-emerald-600">
 {new Intl.NumberFormat('id-ID').format(donatur.total_donasi)}
 </TableCell>
 </TableRow>
 ))
 ) : (
 <TableRow>
 <TableCell colSpan={3} className="h-24 text-center text-slate-500">
 Tidak ada rincian data donatur (semua donatur anonim/kosong).
 </TableCell>
 </TableRow>
 )}
 </TableBody>
 </Table>
 </div>
 </div>
 </DialogContent>
 </Dialog>

  {/* DETAIL CAMPAIGN DIALOG FOR ADMIN */}
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
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-500" 
                  style={{ width: `${selectedCampaign.persentase}%` }} 
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500 font-medium pt-1">
                <span className="text-slate-700">Terkumpul: <b className="text-emerald-600">Rp {new Intl.NumberFormat('id-ID').format(selectedCampaign.terkumpul || selectedCampaign.records_sum_jumlah_donasi || 0)}</b></span>
                <span>Target: Rp {new Intl.NumberFormat('id-ID').format(selectedCampaign.target_dana)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </DialogContent>
  </Dialog>
 </AdminLayout>
 );
}
