import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { Upload, Download, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import Swal from 'sweetalert2';

interface PreviewData {
    valid: any[];
    duplicates: any[];
    invalid: any[];
    temp_file: string;
}

export function ImportDialog({ open, onOpenChange, onSuccess }: { open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<PreviewData | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setPreview(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await axios.post(route('admin.donatur.import.preview'), formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setPreview(res.data);
        } catch (error: any) {
            Swal.fire('Error', error.response?.data?.message || 'Gagal membaca file', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!preview?.temp_file) return;
        setLoading(true);
        try {
            await axios.post(route('admin.donatur.import.confirm'), { temp_file: preview.temp_file });
            Swal.fire('Sukses', 'Data valid berhasil diimpor', 'success');
            onOpenChange(false);
            setFile(null);
            setPreview(null);
            onSuccess();
        } catch (error: any) {
            Swal.fire('Error', error.response?.data?.message || 'Gagal mengimpor data', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if(!val) { setFile(null); setPreview(null); } }}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Import Data Donatur</DialogTitle>
                    <DialogDescription>
                        Unggah file Excel (.xlsx) atau CSV. Anda dapat mengunduh template terlebih dahulu.
                    </DialogDescription>
                </DialogHeader>

                {!preview ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <span className="text-sm text-blue-800">Gunakan template yang disediakan untuk format yang sesuai.</span>
                            <Button variant="outline" size="sm" onClick={() => window.open(route('admin.donatur.import.template'))}>
                                <Download className="w-4 h-4 mr-2" /> Download Template
                            </Button>
                        </div>
                        <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-slate-50 transition-colors">
                            <input 
                                type="file" 
                                id="file-upload" 
                                className="hidden" 
                                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                                onChange={handleFileChange}
                            />
                            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                <span className="font-medium text-slate-700">{file ? file.name : 'Pilih File Excel/CSV'}</span>
                                <span className="text-xs text-slate-500 mt-1">Maks. 5 MB</span>
                            </label>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
                            <Button onClick={handleUpload} disabled={!file || loading}>
                                {loading ? 'Memproses...' : 'Preview Data'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-1" />
                                <div className="text-2xl font-bold text-green-700">{preview.valid.length}</div>
                                <div className="text-xs text-green-600 font-medium">Valid (Siap Impor)</div>
                            </div>
                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                                <AlertCircle className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
                                <div className="text-2xl font-bold text-yellow-700">{preview.duplicates.length}</div>
                                <div className="text-xs text-yellow-600 font-medium">Duplikat (Dilewati)</div>
                            </div>
                            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                                <XCircle className="w-6 h-6 text-red-500 mx-auto mb-1" />
                                <div className="text-2xl font-bold text-red-700">{preview.invalid.length}</div>
                                <div className="text-xs text-red-600 font-medium">Tidak Valid (Dilewati)</div>
                            </div>
                        </div>

                        {preview.invalid.length > 0 && (
                            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                                Terdapat {preview.invalid.length} baris yang tidak lengkap (Nomor Telepon atau Alamat wajib diisi). Baris ini tidak akan diimpor.
                            </div>
                        )}
                        {preview.duplicates.length > 0 && (
                            <div className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                                Terdapat {preview.duplicates.length} baris dengan Nomor Telepon yang sudah terdaftar. Baris ini akan dilewati.
                            </div>
                        )}

                        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                            <Button variant="outline" onClick={() => setPreview(null)} disabled={loading}>Kembali</Button>
                            <Button onClick={handleConfirm} disabled={preview.valid.length === 0 || loading}>
                                {loading ? 'Menyimpan...' : `Impor ${preview.valid.length} Data`}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
