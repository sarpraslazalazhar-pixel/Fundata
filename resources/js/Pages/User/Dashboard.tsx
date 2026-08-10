import React, { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { FolderOpen, Clock, CheckCircle2, XCircle, PlusCircle, History, ArrowRight, Trophy, Coins, Target } from 'lucide-react';
import LazyECharts from '@/Components/Charts/LazyECharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Dialog, DialogContent } from '@/Components/ui/dialog';

export default function Dashboard({ 
 recentTickets = [], 
 stats, 
 totalDonasi = 0, 
 totalData = 0, 
 peringkat, 
 totalOrangCabang = 0, 
 leaderboard = [], 
 trenDonasi = [], 
 filters = {}, 
 trendFormat,
 campaignProgress = [],
 akadProgress = []
}: any) {
 const { auth } = usePage<any>().props;
 const user = auth?.user;
 const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
 const [selectedAkad, setSelectedAkad] = useState<any>(null);

 const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
 router.get(route('dashboard'), { period: e.target.value }, { preserveState: true });
 };

 const STATUS_CARDS = [
 { label: 'Data Aktif', icon: FolderOpen, count: stats?.aktif || 0, bg: 'from-blue-500 to-blue-600', anim: 'group-hover:-translate-y-2 group-hover:rotate-12 group-hover:opacity-100' },
 { label: 'Sedang Diproses', icon: Clock, count: stats?.diproses || 0, bg: 'from-orange-500 to-orange-600', anim: 'group-hover:-rotate-12 group-hover:scale-110 group-hover:opacity-100' },
 { label: 'Selesai', icon: CheckCircle2, count: stats?.selesai || 0, bg: 'from-green-500 to-green-600', anim: 'group-hover:scale-125 group-hover:opacity-100' },
 { label: 'Ditolak', icon: XCircle, count: stats?.ditolak || 0, bg: 'from-red-500 to-red-600', anim: 'group-hover:rotate-90 group-hover:scale-110 group-hover:opacity-100' },
 ];

 const QUICK_ACTIONS = [
 { label: 'Input Data', desc: 'Buat entri donasi baru', icon: PlusCircle, href: '/data/buat', color: 'text-primary bg-primary/10' },
 { label: 'Data Saya', desc: 'Lihat semua data Kamu', icon: History, href: '/data/saya', color: 'text-emerald-600 bg-emerald-50 ' },
 ];

 const timeGreeting = () => {
 const hour = new Date().getHours();
 if (hour < 12) return 'Selamat pagi';
 if (hour < 15) return 'Selamat siang';
 if (hour < 18) return 'Selamat sore';
 return 'Selamat malam';
 };

 return (
 <UserLayout title="Dashboard">
 <div className="space-y-6">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div className="flex flex-col gap-1">
 <h1 className="text-2xl font-semibold tracking-tight">
 {timeGreeting()}, <span className="text-primary">{user?.name || user?.username || 'User'}</span>
 </h1>
 <p className="text-sm text-muted-foreground">
 Semangat menghimpun ya guys. Berikut ringkasan performa kamu.
 </p>
 </div>
 <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
 <select 
 value={filters.period || 'bulan_ini'} 
 onChange={handleFilterChange}
 className="border-0 bg-transparent text-sm font-medium focus:ring-0 cursor-pointer"
 >
 <option value="bulan_ini">Bulan Ini</option>
 <option value="bulan_lalu">Bulan Lalu</option>
 <option value="tahun_ini">Tahun Ini</option>
 <option value="semua_waktu">Semua Waktu</option>
 </select>
 </div>
 </div>

 {/* HERO METRICS */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md transition-all duration-300 hover:shadow-lg p-5 text-white">
 <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/20 blur-xl pointer-events-none transition-transform duration-500 group-hover:scale-150" />
 <div className="flex items-start justify-between">
 <div className="space-y-2">
 <p className="text-sm font-medium text-emerald-50">Total Donasi Dihimpun</p>
 <p className="text-3xl font-bold tracking-tight">Rp {new Intl.NumberFormat('id-ID').format(totalDonasi)}</p>
 </div>
 <Coins className="h-8 w-8 text-white opacity-70 group-hover:rotate-12 transition-transform" />
 </div>
 </div>

 <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md transition-all duration-300 hover:shadow-lg p-5 text-white">
 <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/20 blur-xl pointer-events-none transition-transform duration-500 group-hover:scale-150" />
 <div className="flex items-start justify-between">
 <div className="space-y-2">
 <p className="text-sm font-medium text-blue-100">Total Transaksi</p>
 <p className="text-3xl font-bold tracking-tight">{totalData} <span className="text-lg font-medium opacity-80 text-blue-200">Data</span></p>
 </div>
 <Target className="h-8 w-8 text-white opacity-70 group-hover:scale-110 transition-transform" />
 </div>
 </div>

 <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-md transition-all duration-300 hover:shadow-lg p-5 text-white">
 <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/20 blur-xl pointer-events-none transition-transform duration-500 group-hover:scale-150" />
 <div className="flex items-start justify-between">
 <div className="space-y-2">
 <p className="text-sm font-medium text-amber-100">Peringkat</p>
 <div className="flex items-baseline gap-2">
 <p className="text-3xl font-bold tracking-tight">#{peringkat || '-'}</p>
 <span className="text-sm font-medium opacity-80 text-amber-100">dari {totalOrangCabang} Amil</span>
 </div>
 </div>
 <Trophy className="h-8 w-8 text-white opacity-70 group-hover:-translate-y-1 transition-transform" />
 </div>
 </div>
 </div>

 {/* AKAD PROGRESS */}
 {akadProgress?.length > 0 && (
 <div className="space-y-4">
 <h2 className="text-lg font-semibold text-slate-800">Progress Akad</h2>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {akadProgress.map((akad: any) => (
 <Card 
 key={akad.id} 
 className="shadow-sm border-slate-200 cursor-pointer hover:shadow-md transition-shadow group"
 onClick={() => setSelectedAkad(akad)}
 >
 <CardContent className="p-4 space-y-3">
 <div className="flex justify-between items-start">
 <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">{akad.nama_akad}</h3>
 {akad.target_dana > 0 && (
 <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded-md whitespace-nowrap">
 {akad.persentase}%
 </span>
 )}
 </div>
 {akad.target_dana > 0 && (
 <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
 <div 
 className="bg-primary h-2 rounded-full transition-all duration-500" 
 style={{ width: `${akad.persentase}%` }} 
 />
 </div>
 )}
 <div className="flex justify-between text-xs text-slate-500">
 <span>Terkumpul: <b className="text-slate-700">Rp {new Intl.NumberFormat('id-ID').format(akad.terkumpul)}</b></span>
 {akad.target_dana > 0 && (
 <span>Target: Rp {new Intl.NumberFormat('id-ID').format(akad.target_dana)}</span>
 )}
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 </div>
 )}

 {/* CAMPAIGN PROGRESS */}
 {campaignProgress?.length > 0 && (
 <div className="space-y-4">
 <h2 className="text-lg font-semibold text-slate-800">Progress Program Fundraising</h2>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {campaignProgress.map((camp: any) => (
 <Card 
 key={camp.id} 
 className="shadow-sm border-slate-200 cursor-pointer hover:shadow-md transition-shadow group"
 onClick={() => setSelectedCampaign(camp)}
 >
 <CardContent className="p-4 space-y-3">
 <div className="flex justify-between items-start">
 <h3 className="font-semibold text-sm line-clamp-2">{camp.nama_campaign}</h3>
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

 {/* TREN & LEADERBOARD */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <Card className="lg:col-span-2 shadow-sm">
 <CardHeader>
 <CardTitle className="text-base font-semibold text-slate-800">
 Tren Donasi ({filters.period === 'tahun_ini' || filters.period === 'semua_waktu' ? 'Bulanan' : 'Harian'})
 </CardTitle>
 </CardHeader>
 <CardContent>
 {trenDonasi?.length > 0 ? (
 <LazyECharts option={{
 tooltip: { trigger: 'axis' },
 grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
 xAxis: { type: 'category', boundaryGap: false, data: trenDonasi.map((d: any) => d.label) },
 yAxis: { type: 'value' },
 series: [{
 name: 'Nominal Donasi (Rp)',
 type: 'line',
 smooth: true,
 areaStyle: {
 color: {
 type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
 colorStops: [{ offset: 0, color: 'rgba(16, 185, 129, 0.5)' }, { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }]
 }
 },
 itemStyle: { color: '#10b981' },
 data: trenDonasi.map((d: any) => d.total_donasi)
 }]
 }} height={300} />
 ) : (
 <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg bg-slate-50">
 <p className="text-sm text-slate-500">Belum ada data untuk periode ini.</p>
 </div>
 )}
 </CardContent>
 </Card>

 <Card className="shadow-sm">
 <CardHeader>
 <CardTitle className="text-base font-semibold text-slate-800">
 Leaderboard
 </CardTitle>
 </CardHeader>
 <CardContent className="p-0">
 <div className="overflow-x-auto">
 <Table>
 <TableHeader className="bg-slate-50">
 <TableRow>
 <TableHead className="w-[50px]">#</TableHead>
 <TableHead>Amil</TableHead>
 <TableHead className="text-right">Donasi</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {leaderboard?.length > 0 ? leaderboard.map((amil: any, idx: number) => {
 const isCurrentUser = amil.user_id === user?.id;
 return (
 <TableRow key={idx} className={isCurrentUser ? "bg-amber-50/50" : ""}>
 <TableCell className="font-semibold">{idx + 1}</TableCell>
 <TableCell>
 <div className="font-medium text-slate-800 text-sm">{amil.user?.name || amil.user?.username}</div>
 {isCurrentUser && <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Anda</span>}
 </TableCell>
 <TableCell className="text-right text-xs font-semibold text-emerald-600">
 Rp {new Intl.NumberFormat('id-ID').format(amil.total_donasi)}
 </TableCell>
 </TableRow>
 );
 }) : (
 <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">Belum ada data.</TableCell></TableRow>
 )}
 </TableBody>
 </Table>
 </div>
 </CardContent>
 </Card>
 </div>

 {/* QUICK ACTIONS & STATUS */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="space-y-4 lg:col-span-1">
 <h2 className="text-lg font-semibold">Aksi Cepat</h2>
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
 {QUICK_ACTIONS.map((action) => {
 const Icon = action.icon;
 return (
 <Link key={action.label} href={action.href}>
 <Card className="group cursor-pointer border-border/50 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
 <CardContent className="p-5">
 <div className="flex items-start gap-4">
 <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${action.color}`}>
 <Icon className="h-5 w-5" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-medium text-foreground">{action.label}</p>
 <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
 </div>
 <ArrowRight className="h-4 w-4 text-muted-foreground/40 transition-all duration-200 group-hover:text-primary group-hover:translate-x-0.5 mt-1" />
 </div>
 </CardContent>
 </Card>
 </Link>
 );
 })}
 </div>
 </div>

 <div className="space-y-4 lg:col-span-2">
 <div className="flex items-center justify-between">
 <h2 className="text-lg font-semibold">Status Data Anda</h2>
 </div>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
 {STATUS_CARDS.map((card) => {
 const Icon = card.icon;
 return (
 <div
 key={card.label}
 className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${card.bg} shadow-sm transition-all duration-300 hover:shadow-md p-4 text-white`}
 >
 <div className="absolute -bottom-4 -left-4 h-12 w-12 rounded-full bg-white/10 blur-lg pointer-events-none" />
 <div className="relative flex flex-col items-center text-center space-y-2">
 <Icon className={`h-6 w-6 text-white opacity-80 ${card.anim}`} />
 <p className="text-2xl font-bold">{card.count}</p>
 <p className="text-xs font-medium text-white/90">{card.label}</p>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 </div>

 </div>

  <Dialog open={!!selectedCampaign} onOpenChange={(open) => !open && setSelectedCampaign(null)}>
    <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0 border-0">
      {selectedCampaign && (
        <div className="flex flex-col bg-white rounded-xl overflow-hidden">
          {selectedCampaign.banner_url ? (
            <img src={selectedCampaign.banner_url} alt="Banner" className="w-full h-56 object-cover" />
          ) : (
            <div className="w-full h-48 bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center">
              <span className="text-white text-lg font-bold opacity-50">Fundata Campaign</span>
            </div>
          )}
          <div className="p-6 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 leading-tight">{selectedCampaign.nama_campaign}</h2>
              {selectedCampaign.tgl_mulai && (
                <p className="text-sm text-slate-500 mt-1">
                  Periode: {selectedCampaign.tgl_mulai} {selectedCampaign.tgl_selesai ? `s/d ${selectedCampaign.tgl_selesai}` : ''}
                </p>
              )}
            </div>
            {selectedCampaign.deskripsi && (
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedCampaign.deskripsi}</p>
            )}
            
            <div className="bg-slate-50 p-4 rounded-lg border space-y-3 mt-4">
              <div className="flex justify-between text-sm font-semibold text-slate-700">
                <span>Progress: {selectedCampaign.persentase}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-500" 
                  style={{ width: `${selectedCampaign.persentase}%` }} 
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500 font-medium pt-1">
                <span className="text-slate-700">Terkumpul: Rp {new Intl.NumberFormat('id-ID').format(selectedCampaign.terkumpul)}</span>
                <span>Target: Rp {new Intl.NumberFormat('id-ID').format(selectedCampaign.target_dana)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </DialogContent>
  </Dialog>

  {/* Modal Detail Akad */}
  <Dialog open={!!selectedAkad} onOpenChange={(open) => !open && setSelectedAkad(null)}>
    <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0 border-0">
      {selectedAkad && (
        <div className="flex flex-col bg-white rounded-xl overflow-hidden">
          {selectedAkad.banner_url ? (
            <img src={selectedAkad.banner_url} alt="Banner" className="w-full h-56 object-cover" />
          ) : (
            <div className="w-full h-48 bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center">
              <span className="text-white text-lg font-bold opacity-50">Fundata Akad</span>
            </div>
          )}
          <div className="p-6 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 leading-tight">{selectedAkad.nama_akad}</h2>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-lg border space-y-3 mt-4">
              {selectedAkad.target_dana > 0 && (
                <>
                  <div className="flex justify-between text-sm font-semibold text-slate-700">
                    <span>Progress: {selectedAkad.persentase}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-primary h-full rounded-full transition-all duration-500" 
                      style={{ width: `${selectedAkad.persentase}%` }} 
                    />
                  </div>
                </>
              )}
              <div className="flex justify-between text-xs text-slate-500 font-medium pt-1">
                <span className="text-slate-700">Terkumpul: Rp {new Intl.NumberFormat('id-ID').format(selectedAkad.terkumpul)}</span>
                {selectedAkad.target_dana > 0 && (
                  <span>Target: Rp {new Intl.NumberFormat('id-ID').format(selectedAkad.target_dana)}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DialogContent>
  </Dialog>
 </UserLayout>
 );
}
