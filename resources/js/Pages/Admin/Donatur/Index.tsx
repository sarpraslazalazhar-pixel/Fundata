import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useForm, Link } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/Components/ui/dialog';
import { SearchInput } from '@/Components/SearchInput';
import { Pagination } from '@/Components/Pagination';
import Swal from 'sweetalert2';
import { Pencil, Trash2, History, CheckCircle } from 'lucide-react';
import { Textarea } from '@/Components/ui/textarea';
import { ImportDialog } from './ImportDialog';
import { router } from '@inertiajs/react';

interface Donatur {
    id: number;
    tipe: 'Individu' | 'Organisasi';
    nama_lengkap: string;
    no_telp?: string;
    alamat?: string;
    email?: string;
    jenis_kelamin?: 'L' | 'P';
    is_approved?: boolean;
    created_at: string;
}

export default function DonaturIndex({ donaturs, filters }: { donaturs: any; filters?: { search?: string } }) {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [editDonatur, setEditDonatur] = useState<Donatur | null>(null);

    const { data, setData, post, put, delete: destroy, reset, errors } = useForm({
        tipe: 'Individu',
        nama_lengkap: '',
        no_telp: '',
        alamat: '',
        email: '',
        jenis_kelamin: 'L',
    });

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.donatur.store'), {
            onSuccess: () => {
                setIsAddOpen(false);
                reset();
            }
        });
    };

    const handleEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editDonatur) {
            put(route('admin.donatur.update', editDonatur.id), {
                onSuccess: () => {
                    setEditDonatur(null);
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
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                destroy(route('admin.donatur.destroy', id));
            }
        });
    };

    const handleApprove = (id: number) => {
        Swal.fire({
            title: 'Setujui Donatur?',
            text: 'Donatur ini akan menjadi data resmi.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Ya, Setujui',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                router.patch(route('admin.donatur.approve', id));
            }
        });
    };

    const openEdit = (donatur: Donatur) => {
        setEditDonatur(donatur);
        setData({
            tipe: donatur.tipe,
            nama_lengkap: donatur.nama_lengkap || '',
            no_telp: donatur.no_telp || '',
            alamat: donatur.alamat || '',
            email: donatur.email || '',
            jenis_kelamin: donatur.jenis_kelamin || 'L',
        });
    };

    return (
        <AdminLayout title="Data Donatur">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Data Donatur</h2>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="w-full sm:w-72">
                        <SearchInput placeholder="Cari nama, no hp, email..." />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsImportOpen(true)}>
                            Import Data
                        </Button>
                        <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if(!open) reset(); }}>
                            <DialogTrigger asChild>
                                <Button className="w-full sm:w-auto" onClick={() => reset()}>Tambah Donatur</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Tambah Data Donatur</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Tipe Donatur</Label>
                                <select 
                                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                    value={data.tipe} 
                                    onChange={e => setData('tipe', e.target.value)}
                                >
                                    <option value="Individu">Individu</option>
                                    <option value="Organisasi">Organisasi</option>
                                </select>
                                {errors.tipe && <p className="text-red-500 text-sm">{errors.tipe}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Nama Lengkap / Instansi <span className="text-red-500">*</span></Label>
                                <Input value={data.nama_lengkap} onChange={e => setData('nama_lengkap', e.target.value)} required />
                                {errors.nama_lengkap && <p className="text-red-500 text-sm">{errors.nama_lengkap}</p>}
                            </div>

                            {data.tipe === 'Individu' && (
                                <div className="space-y-2">
                                    <Label>Jenis Kelamin</Label>
                                    <select 
                                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                        value={data.jenis_kelamin} 
                                        onChange={e => setData('jenis_kelamin', e.target.value)}
                                    >
                                        <option value="L">Laki-Laki</option>
                                        <option value="P">Perempuan</option>
                                    </select>
                                    {errors.jenis_kelamin && <p className="text-red-500 text-sm">{errors.jenis_kelamin}</p>}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>No. Telepon / HP <span className="text-red-500">*</span></Label>
                                <Input value={data.no_telp} onChange={e => setData('no_telp', e.target.value)} placeholder="0812..." required />
                                {errors.no_telp && <p className="text-red-500 text-sm">{errors.no_telp}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input type="email" value={data.email} onChange={e => setData('email', e.target.value)} placeholder="email@contoh.com" />
                                {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Alamat Lengkap <span className="text-red-500">*</span></Label>
                                <Textarea value={data.alamat} onChange={e => setData('alamat', e.target.value)} rows={3} required />
                                {errors.alamat && <p className="text-red-500 text-sm">{errors.alamat}</p>}
                            </div>

                            <div className="flex justify-end pt-4"><Button type="submit">Simpan</Button></div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>No</TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead>Tipe</TableHead>
                        <TableHead>Kontak</TableHead>
                        <TableHead>Alamat</TableHead>
                        <TableHead>Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {donaturs.data?.length > 0 ? donaturs.data.map((donatur: Donatur, i: number) => (
                        <TableRow key={donatur.id}>
                            <TableCell>{donaturs.from + i}</TableCell>
                            <TableCell>
                                <div className="font-medium flex items-center gap-2">
                                    {donatur.nama_lengkap}
                                    {donatur.is_approved === false && (
                                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                                            Menunggu Approval
                                        </span>
                                    )}
                                </div>
                                {donatur.tipe === 'Individu' && donatur.jenis_kelamin && (
                                    <div className="text-xs text-slate-500">{donatur.jenis_kelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}</div>
                                )}
                            </TableCell>
                            <TableCell>
                                <span className={`text-xs px-2 py-1 rounded-full ${donatur.tipe === 'Individu' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                    {donatur.tipe}
                                </span>
                            </TableCell>
                            <TableCell>
                                <div className="text-sm">
                                    {donatur.no_telp && <div>📞 {donatur.no_telp}</div>}
                                    {donatur.email && <div>✉️ {donatur.email}</div>}
                                    {!donatur.no_telp && !donatur.email && <span className="text-slate-400 italic">Belum ada kontak</span>}
                                </div>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate" title={donatur.alamat}>{donatur.alamat || '-'}</TableCell>
                            <TableCell className="space-x-2 whitespace-nowrap">
                                {donatur.is_approved === false && (
                                    <Button variant="outline" size="icon" title="Setujui Donatur" className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 border-emerald-200" onClick={() => handleApprove(donatur.id)}>
                                        <CheckCircle className="w-4 h-4" />
                                    </Button>
                                )}
                                <Link href={route('admin.donatur.history', donatur.id)}>
                                    <Button variant="outline" size="icon" title="Riwayat Donasi" className="text-blue-500 hover:text-blue-600">
                                        <History className="w-4 h-4" />
                                    </Button>
                                </Link>
                                <Button variant="outline" size="icon" onClick={() => openEdit(donatur)}>
                                    <Pencil className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(donatur.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-4 text-slate-500">
                                Tidak ada data donatur
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            
            <div className="p-4 border-t border-slate-200">
                <Pagination links={donaturs.links} />
            </div>
        </div>

        <Dialog open={!!editDonatur} onOpenChange={(open) => !open && setEditDonatur(null)}>
                <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Data Donatur</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEdit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Tipe Donatur</Label>
                            <select 
                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                value={data.tipe} 
                                onChange={e => setData('tipe', e.target.value)}
                            >
                                <option value="Individu">Individu</option>
                                <option value="Organisasi">Organisasi</option>
                            </select>
                            {errors.tipe && <p className="text-red-500 text-sm">{errors.tipe}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Nama Lengkap / Instansi <span className="text-red-500">*</span></Label>
                            <Input value={data.nama_lengkap} onChange={e => setData('nama_lengkap', e.target.value)} required />
                            {errors.nama_lengkap && <p className="text-red-500 text-sm">{errors.nama_lengkap}</p>}
                        </div>

                        {data.tipe === 'Individu' && (
                            <div className="space-y-2">
                                <Label>Jenis Kelamin</Label>
                                <select 
                                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                    value={data.jenis_kelamin} 
                                    onChange={e => setData('jenis_kelamin', e.target.value)}
                                >
                                    <option value="L">Laki-Laki</option>
                                    <option value="P">Perempuan</option>
                                </select>
                                {errors.jenis_kelamin && <p className="text-red-500 text-sm">{errors.jenis_kelamin}</p>}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>No. Telepon / HP <span className="text-red-500">*</span></Label>
                            <Input value={data.no_telp} onChange={e => setData('no_telp', e.target.value)} placeholder="0812..." required />
                            {errors.no_telp && <p className="text-red-500 text-sm">{errors.no_telp}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input type="email" value={data.email} onChange={e => setData('email', e.target.value)} placeholder="email@contoh.com" />
                            {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Alamat Lengkap <span className="text-red-500">*</span></Label>
                            <Textarea value={data.alamat} onChange={e => setData('alamat', e.target.value)} rows={3} required />
                            {errors.alamat && <p className="text-red-500 text-sm">{errors.alamat}</p>}
                        </div>

                        <div className="flex justify-end pt-4"><Button type="submit">Update</Button></div>
                    </form>
                </DialogContent>
            </Dialog>

            <ImportDialog 
                open={isImportOpen} 
                onOpenChange={setIsImportOpen} 
                onSuccess={() => window.location.reload()} 
            />
        </AdminLayout>
    );
}
