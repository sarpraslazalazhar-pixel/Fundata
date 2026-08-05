import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Link } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Pagination } from '@/Components/Pagination';
import { ArrowLeft, FileText, Eye } from 'lucide-react';
import { StatusBadge } from '@/Components/StatusBadge';

interface Record {
    id: number;
    formatted_id: string;
    judul: string;
    jumlah_donasi?: number;
    created_at: string;
    status: string;
    user?: {
        name: string;
    };
    campaign?: {
        nama_campaign: string;
    };
    sub_unit?: {
        nama_layanan: string;
    };
}

export default function DonaturHistory({ donatur, records }: { donatur: any; records: any }) {
    const totalDonasi = records.data.reduce((sum: number, record: Record) => sum + (Number(record.jumlah_donasi) || 0), 0);

    return (
        <AdminLayout title={`Riwayat Donasi - ${donatur.nama_lengkap}`}>
            <div className="flex items-center gap-4 mb-6">
                <Link href={route('admin.donatur.index')}>
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-2xl font-bold">Riwayat Donasi: {donatur.nama_lengkap}</h2>
                    <p className="text-sm text-slate-500">
                        {donatur.tipe} • {donatur.no_telp || 'Tidak ada kontak'}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-700">Total Donasi di Halaman Ini</h3>
                    <p className="text-2xl font-bold text-emerald-600">
                        Rp {new Intl.NumberFormat('id-ID').format(totalDonasi)}
                    </p>
                </div>
                
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>No</TableHead>
                            <TableHead>No. Tiket</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Layanan / Program</TableHead>
                            <TableHead>Penginput</TableHead>
                            <TableHead className="text-right">Jumlah Donasi</TableHead>
                            <TableHead className="text-center">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {records.data?.length > 0 ? records.data.map((record: Record, i: number) => (
                            <TableRow key={record.id}>
                                <TableCell>{records.from + i}</TableCell>
                                <TableCell>
                                    <span className="font-medium">#{record.formatted_id || record.id}</span>
                                    <div className="text-xs text-slate-500 mt-1">
                                        {new Date(record.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <StatusBadge status={record.status} />
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm">
                                        <div className="font-medium">{record.sub_unit?.nama_layanan || 'Tiket Layanan'}</div>
                                        {record.campaign && (
                                            <div className="text-xs text-blue-600 bg-blue-50 inline-block px-1.5 py-0.5 rounded mt-1">
                                                {record.campaign.nama_campaign}
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm font-medium">{record.user?.name || '-'}</div>
                                </TableCell>
                                <TableCell className="text-right font-semibold text-emerald-600">
                                    {record.jumlah_donasi ? `Rp ${new Intl.NumberFormat('id-ID').format(record.jumlah_donasi)}` : '-'}
                                </TableCell>
                                <TableCell className="text-center">
                                    <Link href={route('data.show', record.id)}>
                                        <Button variant="outline" size="sm" className="h-8 gap-1" title="Lihat Detail">
                                            <Eye className="w-3.5 h-3.5" />
                                            <span className="sr-only sm:not-sr-only sm:text-xs">Detail</span>
                                        </Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <FileText className="w-12 h-12 text-slate-300 mb-2" />
                                        <p>Belum ada riwayat donasi untuk donatur ini.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {records.data?.length > 0 && (
                    <div className="border-t border-slate-200">
                        <Pagination links={records.links} />
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
