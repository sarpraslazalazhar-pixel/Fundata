import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { DataTable } from '@/Components/DataTable';
import { StatusBadge } from '@/Components/StatusBadge';
import { Pagination } from '@/Components/Pagination';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/Components/ui/tabs';
import { DateRangePicker } from '@/Components/ui/date-range-picker';
import { Coins, Users, Receipt, UserCheck, Printer, Download, Search, ChevronDown, Eye, TrendingUp, Filter, X } from 'lucide-react';
import LazyECharts from '@/Components/Charts/LazyECharts';
import { formatTicketId } from '@/lib/utils';

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

const PRESETS = [
 { key: '7d', label: '7 Hari Ini' },
 { key: '30d', label: '30 Hari Ini' },
 { key: 'bulan', label: 'Bulan Ini' },
 { key: 'tahun', label: 'Tahun Ini' },
];

const rupiah = (v: any) =>
 new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(v) || 0);

const toDateInput = (d: Date) =>
 `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function LaporanData({
 filters, units, subUnits: initialSubUnits, divisiList, userList, campaignList, paymentMethodList,
 totalDonasi, totalTransaksi, totalDonatur, fundraiserAktif,
 monthlyTrend, ticketsByUnit, records, donaturList, fundraiserStats
}: any) {
 const [dateFrom, setDateFrom] = useState(filters?.date_from || '');
 const [dateTo, setDateTo] = useState(filters?.date_to || '');
 const [unitId, setUnitId] = useState(filters?.unit_id || '');
 const [subUnitId, setSubUnitId] = useState(filters?.sub_unit_id || '');
 const [status, setStatus] = useState(filters?.status || '');
 const [divisiId, setDivisiId] = useState(filters?.divisi_id || '');
 const [fundraiserId, setFundraiserId] = useState(filters?.fundraiser_id || '');
 const [campaignId, setCampaignId] = useState(filters?.campaign_id || '');
 const [metodeBayar, setMetodeBayar] = useState(filters?.metode_bayar || '');
 const [donaturSearch, setDonaturSearch] = useState(filters?.donatur_search || '');
 const [jumlahMin, setJumlahMin] = useState(filters?.jumlah_min || '');
 const [jumlahMax, setJumlahMax] = useState(filters?.jumlah_max || '');
 const [subUnits, setSubUnits] = useState<any[]>(initialSubUnits || []);
 const [exportOpen, setExportOpen] = useState(false);
 const [showFilter, setShowFilter] = useState(true);

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
  if (dateFrom) params.date_from = dateFrom;
  if (dateTo) params.date_to = dateTo;
  if (unitId) params.unit_id = unitId;
  if (subUnitId) params.sub_unit_id = subUnitId;
  if (status) params.status = status;
  if (divisiId) params.divisi_id = divisiId;
  if (fundraiserId) params.fundraiser_id = fundraiserId;
  if (campaignId) params.campaign_id = campaignId;
  if (metodeBayar) params.metode_bayar = metodeBayar;
  if (donaturSearch) params.donatur_search = donaturSearch;
  if (jumlahMin) params.jumlah_min = jumlahMin;
  if (jumlahMax) params.jumlah_max = jumlahMax;
  router.get(route('admin.laporan.data'), params, { preserveState: true });
 };

 const exportParams = () => {
  const params: any = {};
  if (dateFrom) params.date_from = dateFrom;
  if (dateTo) params.date_to = dateTo;
  if (unitId) params.unit_id = unitId;
  if (subUnitId) params.sub_unit_id = subUnitId;
  if (status) params.status = status;
  if (divisiId) params.divisi_id = divisiId;
  if (fundraiserId) params.fundraiser_id = fundraiserId;
  if (campaignId) params.campaign_id = campaignId;
  if (metodeBayar) params.metode_bayar = metodeBayar;
  if (donaturSearch) params.donatur_search = donaturSearch;
  if (jumlahMin) params.jumlah_min = jumlahMin;
  if (jumlahMax) params.jumlah_max = jumlahMax;
  return params;
 };

 const handleExportExcel = () => {
  const queryString = new URLSearchParams(exportParams()).toString();
  window.location.href = `/admin/laporan/data/export?${queryString}`;
 };

 const handlePrint = () => {
  window.print();
 };

 const applyPreset = (key: string) => {
  const now = new Date();
  let from = new Date(now);
  let to = new Date(now);
  if (key === '7d') from.setDate(now.getDate() - 6);
  else if (key === '30d') from.setDate(now.getDate() - 29);
  else if (key === 'bulan') from = new Date(now.getFullYear(), now.getMonth(), 1);
  else if (key === 'tahun') { from = new Date(now.getFullYear(), 0, 1); to = new Date(now.getFullYear(), 11, 31); }
  setDateFrom(toDateInput(from));
  setDateTo(toDateInput(to));
 };

 const clearFilter = () => {
  router.get(route('admin.laporan.data'));
 };

 const transaksiColumns = [
  {
   key: 'id',
   header: 'ID',
   render: (row: any) => <span className="font-mono font-semibold text-slate-600">#TKT-{formatTicketId(row.id)}</span>,
  },
  {
   key: 'created_at',
   header: 'Tanggal Transaksi',
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
   key: 'donatur',
   header: 'Donatur',
   render: (row: any) => row.donatur ? (
    <span className="font-medium text-slate-900">{row.donatur.nama_lengkap}</span>
   ) : '-',
  },
  {
   key: 'jumlah_donasi',
   header: 'Jumlah Donasi',
   render: (row: any) => <span className="font-semibold text-emerald-600 tabular-nums">{rupiah(row.jumlah_donasi)}</span>,
  },
  {
   key: 'user',
   header: 'Fundraiser',
   render: (row: any) => row.user ? (
    <div className="flex flex-col">
     <span className="font-semibold text-slate-900">{row.user.name || row.user.username}</span>
     <span className="text-xs text-slate-500">{row.user.username}{row.user.divisi?.nama_divisi ? ` \u00b7 ${row.user.divisi.nama_divisi}` : ''}</span>
    </div>
   ) : '-',
  },
  {
   key: 'sub_unit',
   header: 'Jenis Donasi',
   render: (row: any) => row.sub_unit ? (
    <div className="flex flex-col">
     <span className="font-medium text-slate-900">{row.sub_unit.nama_layanan}</span>
     <span className="text-xs text-slate-500">{row.sub_unit.unit?.nama_unit}</span>
    </div>
   ) : '-',
  },
  {
   key: 'campaign',
   header: 'Campaign',
   render: (row: any) => row.campaign ? <span className="text-slate-900">{row.campaign.nama_campaign}</span> : '-',
  },
  {
   key: 'metode_pembayaran',
   header: 'Metode',
   render: (row: any) => row.metode_pembayaran ? <span className="text-slate-900">{row.metode_pembayaran}</span> : '-',
  },
  {
   key: 'status',
   header: 'Status',
   render: (row: any) => <StatusBadge status={row.status} />,
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
  { key: 'total_rupiah', header: 'Total Donasi (Rp)', render: (row: any) => <span className="font-semibold text-emerald-600 tabular-nums">{rupiah(row.total_rupiah)}</span> },
 ];

 const fundraiserColumns = [
  {
   key: 'user',
   header: 'Fundraiser',
   render: (row: any) => (
    <div className="flex flex-col">
     <span className="font-semibold text-slate-900">{row.name || row.username}</span>
     <span className="text-xs text-slate-500">{row.username}{row.divisi ? ` \u00b7 ${row.divisi}` : ''}</span>
    </div>
   ),
  },
  { key: 'total_transaksi', header: 'Total Transaksi', render: (row: any) => `${row.total_transaksi} kali` },
  { key: 'total_donatur', header: 'Total Donatur', render: (row: any) => row.total_donatur || 0 },
  { key: 'total_nominal', header: 'Total Donasi (Rp)', render: (row: any) => <span className="font-semibold text-emerald-600 tabular-nums">{rupiah(row.total_nominal)}</span> },
 ];

 const kpiCards = [
  { label: 'Total Donasi (Rp)', value: rupiah(totalDonasi), icon: Coins, bg: 'from-emerald-500 to-emerald-600' },
  { label: 'Total Transaksi', value: totalTransaksi, icon: Receipt, bg: 'from-blue-500 to-blue-600' },
  { label: 'Total Donatur', value: totalDonatur, icon: Users, bg: 'from-indigo-500 to-indigo-600' },
  { label: 'Fundraiser Aktif', value: fundraiserAktif, icon: UserCheck, bg: 'from-violet-500 to-violet-600' },
 ];

 const selectCls = 'w-full rounded-md border-input bg-background text-sm h-9';
 const inputCls = 'w-full rounded-md border-input bg-background text-sm h-9 px-3';

 return (
  <AdminLayout title="Semua Data">
   <Head title="Semua Data" />
   <div className="space-y-6">

    {/* Header & Actions */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
     <div>
      <h1 className="text-2xl font-bold tracking-tight">Semua Data</h1>
      <p className="text-sm text-muted-foreground mt-1">
       Riwayat dan analitik transaksi donasi berdasarkan filter.
      </p>
     </div>
     <div className="relative flex items-center gap-2">
      <Button variant="outline" onClick={() => setShowFilter(!showFilter)}>
       <Filter className="w-4 h-4 mr-2" />
       {showFilter ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
      </Button>
      <Button variant="default" onClick={() => setExportOpen(!exportOpen)}>
       <Download className="w-4 h-4 mr-2" /> Export
       <ChevronDown className="w-4 h-4 ml-1" />
      </Button>
      {exportOpen && (
       <>
        <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} />
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border bg-white shadow-lg py-1 print:hidden">
         <button
          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 text-left"
          onClick={() => { setExportOpen(false); handlePrint(); }}
         >
          <Printer className="w-4 h-4 text-slate-500" /> Export PDF (Cetak)
         </button>
         <button
          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 text-left"
          onClick={() => { setExportOpen(false); handleExportExcel(); }}
         >
          <Download className="w-4 h-4 text-slate-500" /> Export Excel (CSV)
         </button>
        </div>
       </>
      )}
     </div>
    </div>

    {/* Filter Panel */}
    {showFilter && (
    <Card className="print:hidden">
     <CardContent className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-y-4 md:[&>*]:pl-4 md:[&>*]:border-l md:[&>*]:border-slate-200 md:[&>*:first-child]:border-l-0 md:[&>*:first-child]:pl-0">
       <div className="space-y-1.5 md:col-span-2">
        <label className="text-xs font-semibold flex items-center justify-between">
         <span>Rentang Tanggal Transaksi</span>
         <span className="flex gap-1">
          {PRESETS.map(p => (
           <button
            key={p.key}
            type="button"
            onClick={() => applyPreset(p.key)}
            className="text-[11px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full px-2 py-0.5 transition-colors"
           >
            {p.label}
           </button>
          ))}
         </span>
        </label>
        <DateRangePicker
         dateFrom={dateFrom}
         dateTo={dateTo}
         onDateFromChange={setDateFrom}
         onDateToChange={setDateTo}
        />
       </div>
       <div className="space-y-1.5">
        <label className="text-xs font-semibold">Status Donasi</label>
        <select className={selectCls} value={status} onChange={e => setStatus(e.target.value)}>
         <option value="">Semua Status</option>
         {STATUS_LIST.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
       </div>
       <div className="space-y-1.5">
        <label className="text-xs font-semibold">Unit Layanan</label>
        <select className={selectCls} value={unitId} onChange={e => setUnitId(e.target.value)}>
         <option value="">Semua Unit</option>
         {units?.map((u: any) => <option key={u.id} value={u.id}>{u.nama_unit}</option>)}
        </select>
       </div>
       <div className="space-y-1.5">
        <label className="text-xs font-semibold">Jenis Donasi</label>
        <select className={selectCls} value={subUnitId} onChange={e => setSubUnitId(e.target.value)}>
         <option value="">Semua Jenis</option>
         {subUnits?.map((su: any) => <option key={su.id} value={su.id}>{su.nama_layanan}</option>)}
        </select>
       </div>
       <div className="space-y-1.5">
        <label className="text-xs font-semibold">Divisi</label>
        <select className={selectCls} value={divisiId} onChange={e => setDivisiId(e.target.value)}>
         <option value="">Semua Divisi</option>
         {divisiList?.map((d: any) => <option key={d.id} value={d.id}>{d.nama_divisi}</option>)}
        </select>
       </div>
       <div className="space-y-1.5">
        <label className="text-xs font-semibold">Fundraiser (Input)</label>
        <select className={selectCls} value={fundraiserId} onChange={e => setFundraiserId(e.target.value)}>
         <option value="">Semua Fundraiser</option>
         {userList?.map((u: any) => <option key={u.id} value={u.id}>{u.name || u.username}</option>)}
        </select>
       </div>
       <div className="space-y-1.5">
        <label className="text-xs font-semibold">Campaign / Program</label>
        <select className={selectCls} value={campaignId} onChange={e => setCampaignId(e.target.value)}>
         <option value="">Semua Campaign</option>
         {campaignList?.map((c: any) => <option key={c.id} value={c.id}>{c.nama_campaign}</option>)}
        </select>
       </div>
       <div className="space-y-1.5">
        <label className="text-xs font-semibold">Metode Pembayaran</label>
        <select className={selectCls} value={metodeBayar} onChange={e => setMetodeBayar(e.target.value)}>
         <option value="">Semua Metode</option>
         {paymentMethodList?.map((m: any) => (
          <option key={m.id} value={m.id}>{m.nama_bank}{m.nomor_rekening ? ` - ${m.nomor_rekening}` : ''}</option>
         ))}
        </select>
       </div>
       <div className="space-y-1.5 md:col-span-2">
        <label className="text-xs font-semibold">Nama Donatur</label>
        <input type="text" className={inputCls} placeholder="Cari nama donatur..." value={donaturSearch} onChange={e => setDonaturSearch(e.target.value)} />
       </div>
       <div className="space-y-1.5 md:col-span-2">
        <label className="text-xs font-semibold">Jumlah Donasi (Rp)</label>
        <div className="flex items-center gap-2">
         <input type="text" className={inputCls} placeholder="Dari" value={jumlahMin ? new Intl.NumberFormat('id-ID').format(Number(jumlahMin)) : ''} onChange={e => setJumlahMin(e.target.value.replace(/\D/g, ''))} />
         <span className="text-slate-400">-</span>
         <input type="text" className={inputCls} placeholder="Sampai" value={jumlahMax ? new Intl.NumberFormat('id-ID').format(Number(jumlahMax)) : ''} onChange={e => setJumlahMax(e.target.value.replace(/\D/g, ''))} />
        </div>
       </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
       <Button variant="outline" size="sm" onClick={clearFilter}>Reset</Button>
       <Button variant="default" size="sm" onClick={applyFilter}>
        <Search className="w-4 h-4 mr-2" /> Terapkan Filter
       </Button>
      </div>
     </CardContent>
    </Card>
    )}

    {/* KPI Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
     {kpiCards.map(({ label, value, icon: Icon, bg }) => (
      <div key={label} className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${bg} shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 print:break-inside-avoid print:shadow-none`}>
       <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/20 blur-xl pointer-events-none transition-transform duration-500 group-hover:scale-150" />
       <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/5 blur-lg pointer-events-none" />
       <div className="relative p-5 text-white">
        <div className="flex items-start justify-between">
         <span className="text-sm font-medium text-white/80">{label}</span>
         <Icon className="h-6 w-6 text-white opacity-70 transition-all duration-300 group-hover:-translate-y-2 group-hover:rotate-12 group-hover:opacity-100 print:hidden" />
        </div>
        <p className="mt-3 text-2xl lg:text-3xl font-bold truncate">{value}</p>
       </div>
      </div>
     ))}
    </div>

    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
     <Card className="print:break-inside-avoid">
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
         yAxis: {
          type: 'value',
          axisLabel: {
           formatter: (v: number) => new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(v),
          },
         },
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

     <Card className="print:break-inside-avoid">
      <CardHeader className="pb-2">
       <CardTitle className="text-base flex items-center gap-2">
        <Receipt className="w-4 h-4 text-blue-600" /> Distribusi Transaksi per Unit
       </CardTitle>
      </CardHeader>
      <CardContent>
       {ticketsByUnit?.length > 0 ? (
        <LazyECharts option={{
         tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
         grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
         xAxis: { type: 'category', data: ticketsByUnit.map((d: any) => d.name), axisLabel: { interval: 0, rotate: 15 } },
         yAxis: { type: 'value' },
         series: [{
          name: 'Total Transaksi',
          type: 'bar',
          barMaxWidth: 28,
          itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
          data: ticketsByUnit.map((d: any) => d.value),
         }],
        }} height={280} />
       ) : (
        <p className="text-sm text-muted-foreground text-center py-8">Belum ada data distribusi.</p>
       )}
      </CardContent>
     </Card>
    </div>

    {/* Tabs */}
    <div className="mt-4 space-y-4 print:break-before-page">
     <h2 className="text-xl font-bold tracking-tight">Rincian Data</h2>
     <Tabs defaultValue="histori" className="w-full">
      <TabsList className="mb-4">
       <TabsTrigger value="histori">Histori Transaksi</TabsTrigger>
       <TabsTrigger value="donatur">Data Donatur</TabsTrigger>
       <TabsTrigger value="fundraiser">Kinerja Fundraiser</TabsTrigger>
      </TabsList>
      <TabsContent value="histori">
       <div className="overflow-x-auto rounded-md border">
        <DataTable columns={transaksiColumns} data={records?.data || []} keyExtractor={(t: any) => t.id} columnBorders />
       </div>
       <div className="print:hidden mt-4">
        <Pagination links={records?.links} />
       </div>
      </TabsContent>
      <TabsContent value="donatur">
       <div className="overflow-x-auto rounded-md border">
        <DataTable columns={donaturColumns} data={donaturList?.data || []} keyExtractor={(t: any) => t.nama_donatur} columnBorders />
       </div>
       <div className="print:hidden mt-4">
        <Pagination links={donaturList?.links} />
       </div>
      </TabsContent>
      <TabsContent value="fundraiser">
       <div className="overflow-x-auto rounded-md border">
        <DataTable columns={fundraiserColumns} data={fundraiserStats?.data || []} keyExtractor={(t: any) => t.user_id} columnBorders />
       </div>
       <div className="print:hidden mt-4">
        <Pagination links={fundraiserStats?.links} />
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
