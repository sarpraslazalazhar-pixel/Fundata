import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useForm, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/Components/ui/dialog';
import { SearchInput } from '@/Components/SearchInput';
import { Pagination } from '@/Components/Pagination';
import Swal from 'sweetalert2';
import { Pencil, Trash2, Image as ImageIcon } from 'lucide-react';

interface PaymentMethod {
  id: number;
  nama_bank: string;
  nomor_rekening: string | null;
  nama_pemilik: string | null;
  logo_qris: string | null;
  instruksi: string | null;
  kategori: string;
  is_active: boolean;
}

export default function PaymentMethodIndex({ paymentMethods, filters }: { paymentMethods: any; filters?: { search?: string } }) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editMethod, setEditMethod] = useState<PaymentMethod | null>(null);

  const { data, setData, post, reset, errors, progress } = useForm({
    nama_bank: '',
    nomor_rekening: '',
    nama_pemilik: '',
    instruksi: '',
    kategori: 'transfer_bank',
    is_active: true,
    logo_qris: null as File | null,
    _method: 'POST', // Default for add
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setData('_method', 'POST');
    post(route('admin.master.metode-pembayaran.store'), {
      onSuccess: () => {
        setIsAddOpen(false);
        reset();
      },
      forceFormData: true,
    });
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editMethod) {
      post(route('admin.master.metode-pembayaran.update', editMethod.id), {
        onSuccess: () => {
          setEditMethod(null);
          reset();
        },
        forceFormData: true,
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
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        router.delete(route('admin.master.metode-pembayaran.destroy', id));
      }
    });
  };

  const openEdit = (method: PaymentMethod) => {
    setEditMethod(method);
    setData({
      nama_bank: method.nama_bank,
      nomor_rekening: method.nomor_rekening || '',
      nama_pemilik: method.nama_pemilik || '',
      instruksi: method.instruksi || '',
      kategori: method.kategori,
      is_active: method.is_active,
      logo_qris: null,
      _method: 'PUT',
    });
  };

  const kategoriLabels: Record<string, string> = {
    'transfer_bank': 'Transfer Bank',
    'e_wallet': 'E-Wallet',
    'qris': 'QRIS',
    'cash': 'Tunai (Cash)',
  };

  const formContent = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Kategori Pembayaran</Label>
        <select 
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={data.kategori}
          onChange={e => setData('kategori', e.target.value)}
        >
          <option value="transfer_bank">Transfer Bank</option>
          <option value="e_wallet">E-Wallet</option>
          <option value="qris">QRIS</option>
          <option value="cash">Tunai (Cash)</option>
        </select>
        {errors.kategori && <p className="text-red-500 text-sm">{errors.kategori}</p>}
      </div>
      
      <div className="space-y-2">
        <Label>Nama Bank / E-Wallet</Label>
        <Input 
          value={data.nama_bank} 
          onChange={e => setData('nama_bank', e.target.value)} 
          placeholder="Misal: BCA, Dana, dll" 
        />
        {errors.nama_bank && <p className="text-red-500 text-sm">{errors.nama_bank}</p>}
      </div>

      {data.kategori !== 'cash' && (
        <>
          <div className="space-y-2">
            <Label>Nomor Rekening / No. HP</Label>
            <Input 
              value={data.nomor_rekening} 
              onChange={e => setData('nomor_rekening', e.target.value)} 
            />
            {errors.nomor_rekening && <p className="text-red-500 text-sm">{errors.nomor_rekening}</p>}
          </div>

          <div className="space-y-2">
            <Label>Nama Pemilik Rekening</Label>
            <Input 
              value={data.nama_pemilik} 
              onChange={e => setData('nama_pemilik', e.target.value)} 
            />
            {errors.nama_pemilik && <p className="text-red-500 text-sm">{errors.nama_pemilik}</p>}
          </div>

          <div className="space-y-2">
            <Label>Logo Bank / Kode QRIS (Opsional)</Label>
            <Input 
              type="file" 
              accept="image/*" 
              onChange={e => setData('logo_qris', e.target.files ? e.target.files[0] : null)} 
            />
            {errors.logo_qris && <p className="text-red-500 text-sm">{errors.logo_qris}</p>}
            {progress && (
              <progress value={progress.percentage} max="100">
                {progress.percentage}%
              </progress>
            )}
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label>Instruksi Pembayaran (Opsional)</Label>
        <textarea 
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={data.instruksi}
          onChange={e => setData('instruksi', e.target.value)}
          placeholder="Cara melakukan pembayaran..."
        />
        {errors.instruksi && <p className="text-red-500 text-sm">{errors.instruksi}</p>}
      </div>

      <div className="space-y-2">
        <Label>Aktif</Label>
        <select 
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          value={data.is_active ? '1' : '0'} 
          onChange={e => setData('is_active', e.target.value === '1')}
        >
          <option value="1">Ya</option>
          <option value="0">Tidak</option>
        </select>
      </div>
    </div>
  );

  return (
    <AdminLayout title="Metode Pembayaran">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Metode Pembayaran</h2>
        <Dialog open={isAddOpen} onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) reset();
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              reset();
              setData('_method', 'POST');
            }}>Tambah Metode</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tambah Metode Pembayaran</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd}>
              {formContent}
              <div className="flex justify-end pt-4"><Button type="submit">Simpan</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <SearchInput placeholder="Cari bank, nama pemilik..." />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kategori</TableHead>
            <TableHead>Nama Bank/Metode</TableHead>
            <TableHead>No. Rekening</TableHead>
            <TableHead>Atas Nama</TableHead>
            <TableHead>Logo/QRIS</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paymentMethods.data?.length > 0 ? paymentMethods.data.map((item: PaymentMethod) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium text-slate-700">{kategoriLabels[item.kategori]}</TableCell>
              <TableCell>{item.nama_bank}</TableCell>
              <TableCell>{item.nomor_rekening || '-'}</TableCell>
              <TableCell>{item.nama_pemilik || '-'}</TableCell>
              <TableCell>
                {item.logo_qris ? (
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-500" />
                    <a href={`/storage/${item.logo_qris}`} target="_blank" className="text-xs text-blue-500 hover:underline">Lihat</a>
                  </div>
                ) : '-'}
              </TableCell>
              <TableCell>{item.is_active ? <span className="text-emerald-600 font-medium">Aktif</span> : <span className="text-rose-500 font-medium">Nonaktif</span>}</TableCell>
              <TableCell className="space-x-2">
                <Button variant="outline" size="icon" onClick={() => openEdit(item)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-4 text-slate-500">
                Tidak ada data
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Pagination links={paymentMethods.links} />

      <Dialog open={!!editMethod} onOpenChange={(open) => {
        if (!open) {
          setEditMethod(null);
          reset();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Metode Pembayaran</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit}>
            {formContent}
            {editMethod?.logo_qris && (
              <div className="mt-2 text-sm text-slate-500">
                Gambar saat ini: <a href={`/storage/${editMethod.logo_qris}`} target="_blank" className="text-blue-500 hover:underline">Lihat Gambar</a>
                <br />
                <span className="text-xs italic">(Kosongkan file jika tidak ingin mengubah gambar)</span>
              </div>
            )}
            <div className="flex justify-end pt-4"><Button type="submit">Update</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
