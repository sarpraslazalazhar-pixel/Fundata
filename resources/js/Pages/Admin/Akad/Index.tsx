import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/Components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Plus, Edit, Trash2, History } from 'lucide-react';

interface Akad {
  id: number;
  parent_id: number | null;
  nama_akad: string;
  is_campaign_required: boolean;
  is_active: boolean;
  target_dana: number | null;
  is_show_on_dashboard: boolean;
  banner_url?: string | null;
  children?: Akad[];
}

export default function AkadIndex({ akads, parentOptions }: { akads: Akad[], parentOptions: Akad[] }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editAkad, setEditAkad] = useState<Akad | null>(null);

  const { data, setData, post, put, delete: destroy, processing, errors, reset, transform } = useForm({
    parent_id: '',
    nama_akad: '',
    is_campaign_required: false,
    is_active: true,
    target_dana: '' as string | number,
    is_show_on_dashboard: false,
    banner: null as File | null,
    _method: 'POST',
  });

  const openCreate = () => {
    reset();
    setIsCreateOpen(true);
  };

  const openEdit = (akad: Akad) => {
    setEditAkad(akad);
    setData({
      parent_id: akad.parent_id ? String(akad.parent_id) : '',
      nama_akad: akad.nama_akad,
      is_campaign_required: akad.is_campaign_required,
      is_active: akad.is_active,
      target_dana: akad.target_dana || '',
      is_show_on_dashboard: akad.is_show_on_dashboard,
      banner: null,
      _method: 'PUT',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editAkad) {
      transform((data) => ({ ...data, _method: 'PUT' }));
      post(route('admin.master.akad.update', editAkad.id), {
        forceFormData: true,
        onSuccess: () => setEditAkad(null),
      });
    } else {
      transform((data) => ({ ...data, _method: 'POST' }));
      post(route('admin.master.akad.store'), {
        forceFormData: true,
        onSuccess: () => {
          setIsCreateOpen(false);
          reset();
        },
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus Akad ini?')) {
      destroy(route('admin.master.akad.destroy', id));
    }
  };

  const renderAkadRow = (akad: Akad, isChild = false) => (
    <TableRow key={akad.id}>
      <TableCell className={isChild ? "pl-8" : "font-semibold"}>
        {isChild && <span className="mr-2 text-slate-300">↳</span>}
        {akad.nama_akad}
      </TableCell>
      <TableCell>
        {akad.is_campaign_required ? (
          <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-medium">Ya</span>
        ) : (
          <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-medium">Tidak</span>
        )}
      </TableCell>
      <TableCell>
        {akad.is_active ? (
          <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-medium">Aktif</span>
        ) : (
          <span className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-medium">Nonaktif</span>
        )}
      </TableCell>
      <TableCell className="text-right space-x-2">
        <Link href={route('admin.master.akad.log-audit', akad.id)}>
          <Button variant="outline" size="icon" title="Log Audit (siapa saja yang input)" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
            <History className="h-4 w-4" />
          </Button>
        </Link>
        <Button variant="outline" size="icon" title="Edit" onClick={() => openEdit(akad)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="text-red-500" title="Hapus" onClick={() => handleDelete(akad.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );

  return (
    <AdminLayout title="Master Data Akad">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Master Data Akad</h2>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Tambah Akad
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Akad</TableHead>
              <TableHead>Wajib Campaign?</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {akads.length > 0 ? (
              akads.map(parent => (
                <React.Fragment key={`parent-${parent.id}`}>
                  {renderAkadRow(parent, false)}
                  {parent.children?.map(child => renderAkadRow(child, true))}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                  Tidak ada data akad.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isCreateOpen || !!editAkad} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setEditAkad(null);
          reset();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editAkad ? 'Edit Akad' : 'Tambah Akad'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Induk Akad (Opsional)</Label>
              <select
                className="w-full mt-1.5 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={data.parent_id}
                onChange={e => setData('parent_id', e.target.value)}
              >
                <option value="">-- Kategori Utama --</option>
                {parentOptions.map(p => (
                  <option key={p.id} value={p.id}>{p.nama_akad}</option>
                ))}
              </select>
              {errors.parent_id && <p className="text-red-500 text-sm mt-1">{errors.parent_id}</p>}
            </div>

            <div>
              <Label>Nama Akad</Label>
              <Input
                value={data.nama_akad}
                onChange={e => setData('nama_akad', e.target.value)}
                required
                className="mt-1.5"
                placeholder="Misal: Zakat Maal"
              />
              {errors.nama_akad && <p className="text-red-500 text-sm mt-1">{errors.nama_akad}</p>}
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="is_campaign"
                className="rounded border-gray-300 text-primary shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 h-4 w-4"
                checked={data.is_campaign_required}
                onChange={e => setData('is_campaign_required', e.target.checked)}
              />
              <Label htmlFor="is_campaign" className="cursor-pointer">Wajib Pilih Campaign</Label>
            </div>

            <div>
              <Label>Target Dana (Opsional)</Label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">Rp</span>
                <input
                  type="text"
                  className="w-full rounded-md border border-input bg-transparent py-2 pl-9 pr-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={data.target_dana ? new Intl.NumberFormat('id-ID').format(Number(data.target_dana)) : ''}
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setData('target_dana', raw ? Number(raw) : '');
                  }}
                  placeholder="0"
                />
              </div>
              {errors.target_dana && <p className="text-red-500 text-sm mt-1">{errors.target_dana}</p>}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_show_on_dashboard"
                className="rounded border-gray-300 text-primary shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 h-4 w-4"
                checked={data.is_show_on_dashboard}
                onChange={e => setData('is_show_on_dashboard', e.target.checked)}
              />
              <Label htmlFor="is_show_on_dashboard" className="cursor-pointer">Tampilkan di Dashboard Progress</Label>
            </div>

            <div>
              <Label>Gambar Banner (Opsional)</Label>
              {editAkad?.banner_url && (
                <div className="mb-2">
                  <img src={editAkad.banner_url} alt="Current Banner" className="h-20 w-auto rounded border" />
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={e => setData('banner', e.target.files ? e.target.files[0] : null)}
                className="mt-1.5 cursor-pointer file:cursor-pointer"
              />
              {errors.banner && <p className="text-red-500 text-sm mt-1">{errors.banner}</p>}
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t mt-4">
              <input
                type="checkbox"
                id="is_active"
                className="rounded border-gray-300 text-primary shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 h-4 w-4"
                checked={data.is_active}
                onChange={e => setData('is_active', e.target.checked)}
              />
              <Label htmlFor="is_active" className="cursor-pointer">Aktif</Label>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => { setIsCreateOpen(false); setEditAkad(null); reset(); }}>Batal</Button>
              <Button type="submit" disabled={processing}>{processing ? 'Menyimpan...' : 'Simpan'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
