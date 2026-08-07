import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Link, useForm } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/Components/ui/dialog';
import Swal from 'sweetalert2';
import { Pencil, Trash2, Eye, History } from 'lucide-react';

interface Campaign {
 id: number;
 nama_campaign: string;
 deskripsi: string | null;
 target_dana: number;
 is_active: boolean;
 tgl_mulai: string | null;
 tgl_selesai: string | null;
 created_at: string;
 records_sum_jumlah_donasi?: number;
 banner_url?: string;
}

export default function CampaignIndex({ campaigns }: { campaigns: Campaign[] }) {
 const [isAddOpen, setIsAddOpen] = useState(false);
 const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);
 const [viewCampaign, setViewCampaign] = useState<Campaign | null>(null);

 const { data, setData, post, put, delete: destroy, reset, errors } = useForm({
 nama_campaign: '',
 deskripsi: '',
 target_dana: 0,
 is_active: true,
 tgl_mulai: '',
 tgl_selesai: '',
 banner: null as File | null,
 _method: 'post',
 });

 const handleAdd = (e: React.FormEvent) => {
 e.preventDefault();
 post(route('admin.master.campaigns.store'), {
 onSuccess: () => {
 setIsAddOpen(false);
 reset();
 }
 });
 };

 const handleEdit = (e: React.FormEvent) => {
 e.preventDefault();
 if (editCampaign) {
 setData('_method', 'put');
 post(route('admin.master.campaigns.update', editCampaign.id), {
 onSuccess: () => {
 setEditCampaign(null);
 reset();
 }
 });
 }
 };

 const handleDelete = (id: number) => {
 Swal.fire({
 title: 'Yakin hapus?',
 icon: 'warning',
 showCancelButton: true,
 confirmButtonColor: '#3085d6',
 cancelButtonColor: '#d33',
 confirmButtonText: 'OK',
 cancelButtonText: 'Batal'
 }).then((result) => {
 if (result.isConfirmed) {
 destroy(route('admin.master.campaigns.destroy', id));
 }
 });
 };

 const openEdit = (campaign: Campaign) => {
 setEditCampaign(campaign);
 setData({
 nama_campaign: campaign.nama_campaign,
 deskripsi: campaign.deskripsi || '',
 target_dana: Math.floor(Number(campaign.target_dana)),
 is_active: campaign.is_active,
 tgl_mulai: campaign.tgl_mulai ? campaign.tgl_mulai.split('T')[0] : '',
 tgl_selesai: campaign.tgl_selesai ? campaign.tgl_selesai.split('T')[0] : '',
 banner: null,
 _method: 'put',
 });
 };

 return (
 <AdminLayout title="Campaign / Program">
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-2xl font-bold">Campaign / Program</h2>
 <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) reset(); }}>
 <DialogTrigger asChild>
 <Button>Tambah Campaign</Button>
 </DialogTrigger>
 <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
 <DialogHeader>
 <DialogTitle>Tambah Campaign</DialogTitle>
 </DialogHeader>
 <form onSubmit={handleAdd} className="space-y-4">
 <div className="space-y-2">
 <Label>Nama Campaign/Program</Label>
 <Input value={data.nama_campaign} onChange={e => setData('nama_campaign', e.target.value)} required />
 {errors.nama_campaign && <p className="text-red-500 text-sm">{errors.nama_campaign}</p>}
 </div>
 <div className="space-y-2">
 <Label>Deskripsi</Label>
 <Input value={data.deskripsi} onChange={e => setData('deskripsi', e.target.value)} />
 {errors.deskripsi && <p className="text-red-500 text-sm">{errors.deskripsi}</p>}
 </div>
 <div className="space-y-2">
 <Label>Target Dana</Label>
 <div className="relative">
 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">Rp</span>
 <input
 type="text"
 className="w-full rounded-md border border-input bg-transparent py-2 pl-9 pr-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
 value={data.target_dana ? new Intl.NumberFormat('id-ID').format(Number(data.target_dana)) : ''}
 onChange={e => {
 const raw = e.target.value.replace(/\D/g, '');
 setData('target_dana', Number(raw));
 }}
 required
 />
 </div>
 {errors.target_dana && <p className="text-red-500 text-sm">{errors.target_dana}</p>}
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label>Tanggal Mulai (Opsional)</Label>
 <Input type="date" value={data.tgl_mulai} onChange={e => setData('tgl_mulai', e.target.value)} />
 </div>
 <div className="space-y-2">
 <Label>Tanggal Selesai (Opsional)</Label>
 <Input type="date" value={data.tgl_selesai} onChange={e => setData('tgl_selesai', e.target.value)} />
 </div>
 </div>
 <div className="space-y-2">
 <Label>Status</Label>
 <select className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50" value={data.is_active ? '1' : '0'} onChange={e => setData('is_active', e.target.value === '1')}>
 <option value="1">Aktif</option>
 <option value="0">Nonaktif</option>
 </select>
 </div>
 <div className="space-y-2">
 <Label>Banner / Gambar Utama</Label>
 <Input type="file" accept="image/*" onChange={e => setData('banner', e.target.files?.[0] || null)} />
 {errors.banner && <p className="text-red-500 text-sm">{errors.banner}</p>}
 </div>
 <div className="flex justify-end pt-4"><Button type="submit">Simpan</Button></div>
 </form>
 </DialogContent>
 </Dialog>
 </div>

 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>No</TableHead>
 <TableHead>Nama Campaign</TableHead>
 <TableHead>Target Dana</TableHead>
 <TableHead>Terkumpul</TableHead>
 <TableHead>Tgl Pelaksanaan</TableHead>
 <TableHead>Status</TableHead>
 <TableHead>Aksi</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {campaigns.length > 0 ? campaigns.map((campaign, i) => (
 <TableRow key={campaign.id}>
 <TableCell>{i + 1}</TableCell>
 <TableCell className="font-medium text-foreground">
  <div className="flex items-center gap-3">
  {campaign.banner_url ? (
  <img src={campaign.banner_url} alt="Banner" className="w-10 h-10 object-cover rounded-md border" />
  ) : (
  <div className="w-10 h-10 bg-slate-100 rounded-md border flex items-center justify-center text-xs text-slate-400">No Img</div>
  )}
  {campaign.nama_campaign}
  </div>
  </TableCell>
 <TableCell>Rp {new Intl.NumberFormat('id-ID').format(campaign.target_dana)}</TableCell>
 <TableCell className="font-semibold text-blue-600">Rp {new Intl.NumberFormat('id-ID').format(campaign.records_sum_jumlah_donasi || 0)}</TableCell>
 <TableCell>
 {campaign.tgl_mulai ? new Date(campaign.tgl_mulai).toLocaleDateString('id-ID') : '-'} s/d {campaign.tgl_selesai ? new Date(campaign.tgl_selesai).toLocaleDateString('id-ID') : '-'}
 </TableCell>
 <TableCell>
 <span className={`px-2 py-1 rounded-full text-xs font-semibold ${campaign.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
 {campaign.is_active ? 'Aktif' : 'Nonaktif'}
 </span>
 </TableCell>
  <TableCell className="space-x-2">
    <Link href={route('admin.master.campaigns.log-audit', campaign.id)}>
      <Button variant="outline" size="icon" title="Log Audit (siapa saja yang input)" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
        <History className="w-4 h-4" />
      </Button>
    </Link>
    <Button variant="outline" size="icon" title="Lihat Detail" onClick={() => setViewCampaign(campaign)}>
      <Eye className="w-4 h-4 text-blue-600" />
    </Button>
    <Button variant="outline" size="icon" title="Edit" onClick={() => openEdit(campaign)}>
      <Pencil className="w-4 h-4" />
    </Button>
    <Button variant="outline" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" title="Hapus" onClick={() => handleDelete(campaign.id)}>
      <Trash2 className="w-4 h-4" />
    </Button>
  </TableCell>
 </TableRow>
 )) : (
 <TableRow>
 <TableCell colSpan={7} className="text-center py-4 text-slate-500">
 Tidak ada data campaign.
 </TableCell>
 </TableRow>
 )}
 </TableBody>
 </Table>

 <Dialog open={!!editCampaign} onOpenChange={(open) => !open && setEditCampaign(null)}>
 <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
 <DialogHeader>
 <DialogTitle>Edit Campaign</DialogTitle>
 </DialogHeader>
 <form onSubmit={handleEdit} className="space-y-4">
 <div className="space-y-2">
 <Label>Nama Campaign/Program</Label>
 <Input value={data.nama_campaign} onChange={e => setData('nama_campaign', e.target.value)} required />
 {errors.nama_campaign && <p className="text-red-500 text-sm">{errors.nama_campaign}</p>}
 </div>
 <div className="space-y-2">
 <Label>Deskripsi</Label>
 <Input value={data.deskripsi} onChange={e => setData('deskripsi', e.target.value)} />
 {errors.deskripsi && <p className="text-red-500 text-sm">{errors.deskripsi}</p>}
 </div>
 <div className="space-y-2">
  <Label>Target Dana (Rp)</Label>
  <div className="relative">
  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">Rp</span>
  <input
  type="text"
  className="w-full rounded-md border border-input bg-transparent py-2 pl-9 pr-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
  value={data.target_dana ? new Intl.NumberFormat('id-ID').format(Number(data.target_dana)) : ''}
  onChange={e => {
  const raw = e.target.value.replace(/\D/g, '');
  setData('target_dana', Number(raw));
  }}
  required
  />
  </div>
  {errors.target_dana && <p className="text-red-500 text-sm">{errors.target_dana}</p>}
  </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label>Tanggal Mulai (Opsional)</Label>
 <Input type="date" value={data.tgl_mulai} onChange={e => setData('tgl_mulai', e.target.value)} />
 </div>
 <div className="space-y-2">
 <Label>Tanggal Selesai (Opsional)</Label>
 <Input type="date" value={data.tgl_selesai} onChange={e => setData('tgl_selesai', e.target.value)} />
 </div>
 </div>
 <div className="space-y-2">
 <Label>Status</Label>
 <select className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50" value={data.is_active ? '1' : '0'} onChange={e => setData('is_active', e.target.value === '1')}>
 <option value="1">Aktif</option>
 <option value="0">Nonaktif</option>
 </select>
 </div>
 <div className="space-y-2">
  <Label>Banner / Gambar Utama</Label>
  {editCampaign?.banner_url && (
  <div className="mb-2">
  <img src={editCampaign.banner_url} alt="Banner" className="h-20 rounded border object-cover" />
  </div>
  )}
  <Input type="file" accept="image/*" onChange={e => setData('banner', e.target.files?.[0] || null)} />
  {errors.banner && <p className="text-red-500 text-sm">{errors.banner}</p>}
  </div>
 <div className="flex justify-end pt-4"><Button type="submit">Update</Button></div>
 </form>
 </DialogContent>
 </Dialog>

  {/* DETAIL CAMPAIGN MODAL */}
  <Dialog open={!!viewCampaign} onOpenChange={(open) => !open && setViewCampaign(null)}>
    <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0 border-0">
      {viewCampaign && (
        <div className="flex flex-col bg-white rounded-2xl overflow-hidden">
          {viewCampaign.banner_url ? (
            <img src={viewCampaign.banner_url} alt="Banner" className="w-full h-56 object-cover" />
          ) : (
            <div className="w-full h-48 bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center">
              <span className="text-white text-lg font-bold opacity-50">Fundata Campaign</span>
            </div>
          )}
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 leading-tight">{viewCampaign.nama_campaign}</h2>
                {(viewCampaign.tgl_mulai || viewCampaign.tgl_selesai) && (
                  <p className="text-sm text-slate-500 mt-1">
                    Periode: {viewCampaign.tgl_mulai ? new Date(viewCampaign.tgl_mulai).toLocaleDateString('id-ID') : '-'} {viewCampaign.tgl_selesai ? `s/d ${new Date(viewCampaign.tgl_selesai).toLocaleDateString('id-ID')}` : ''}
                  </p>
                )}
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${viewCampaign.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {viewCampaign.is_active ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
            
            {viewCampaign.deskripsi && (
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{viewCampaign.deskripsi}</p>
            )}
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3 mt-4">
              {(() => {
                const terkumpul = viewCampaign.records_sum_jumlah_donasi || 0;
                const target = viewCampaign.target_dana || 1;
                const persentase = Math.min(100, Math.round((terkumpul / target) * 100));
                return (
                  <>
                    <div className="flex justify-between text-sm font-semibold text-slate-700">
                      <span>Progress Fundraising: {persentase}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-primary h-full rounded-full transition-all duration-500" 
                        style={{ width: `${persentase}%` }} 
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 font-medium pt-1">
                      <span className="text-slate-700">Terkumpul: <b className="text-emerald-600">Rp {new Intl.NumberFormat('id-ID').format(terkumpul)}</b></span>
                      <span>Target: Rp {new Intl.NumberFormat('id-ID').format(target)}</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </DialogContent>
  </Dialog>
 </AdminLayout>
 );
}
