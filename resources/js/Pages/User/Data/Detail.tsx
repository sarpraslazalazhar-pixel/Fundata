import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { StatusBadge } from '@/Components/StatusBadge';
import { TicketTimeline } from '@/Components/TicketTimeline';
import { TicketAttachmentList } from '@/Components/TicketAttachmentList';
import { formatDateId, formatTicketId } from '@/lib/utils';
import { AttachmentViewer } from '@/Components/AttachmentViewer';
import { FileText, XCircle, Eye, CheckCircle2, Edit2 } from 'lucide-react';

import { ConfirmDialog } from '@/Components/ConfirmDialog';
import ImageEditorModal from '@/Components/FormBuilder/ImageEditorModal';
import ShareToChatModal from '@/Components/Chat/ShareToChatModal';
import { MessageSquareShare } from 'lucide-react';

interface DetailProps {
 ticket: any;
 formFields: any[];
 maxRevisions: number;
 akads?: any[];
 paymentMethods?: any[];
}

export default function Detail({ ticket, formFields, maxRevisions, akads, paymentMethods }: DetailProps) {
 const { data: revData, setData: setRevData, post: postRev, processing: processingRev, errors: errorsRev, reset: resetRev } = useForm({ catatan: '', general_attachments: [] as File[], _method: 'post' });
 const [showRevForm, setShowRevForm] = useState(false);
 const [showConfirm, setShowConfirm] = useState(false);
 const [editorOpen, setEditorOpen] = useState(false);
 const [shareOpen, setShareOpen] = useState(false);
 const [fileToEdit, setFileToEdit] = useState<{file: File, index: number, form: 'rev'} | null>(null);

 const canCancel = ticket.status === 'open';

 const handleCancel = () => {
 router.patch(route('data.batal', ticket.id));
 };

 const renderFormValue = (field: any) => {
 if (field.tipe_field === 'upload_gambar' || field.tipe_field === 'upload_file') {
 const fieldAttachments = ticket.attachments?.filter((a: any) => a.field_id == field.id);
 return fieldAttachments && fieldAttachments.length > 0 ? (
 <div className="flex flex-col gap-2 mt-1">
 {fieldAttachments.map((attachment: any, idx: number) => (
 <AttachmentViewer key={idx} attachment={attachment} viewRoute="data.view" downloadRoute="data.download">
 <button type="button" className="text-blue-600 hover:underline flex items-center gap-1 text-sm text-left">
 <Eye className="w-4 h-4 flex-shrink-0" /> <span className="truncate">{attachment.original_name}</span>
 </button>
 </AttachmentViewer>
 ))}
 </div>
 ) : '-';
 }

 const value = ticket.form_data?.[field.id];
 if (value === undefined || value === null || value === '') return '-';

 if (field.tipe_field === 'donatur_lookup') {
   return ticket.donatur ? `${ticket.donatur.nama_lengkap} (${ticket.donatur.no_telp})` : value;
 }
 if (field.tipe_field === 'akad') {
   const akad = akads?.find((a: any) => a.id == value);
   return akad ? akad.nama_akad : value;
 }
 if (field.tipe_field === 'metode_bayar') {
   const pm = paymentMethods?.find((p: any) => p.id == value);
   return pm ? pm.nama_bank : value;
 }

 if (field.tipe_field === 'nominal_rp') {
 return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value) || 0);
 }
 if (field.tipe_field === 'checkbox' && typeof value === 'boolean') return value ? 'Ya' : 'Tidak';
 if (field.tipe_field === 'multi_pilih' && Array.isArray(value)) return value.join(', ');
 
 const stringValue = String(value);
 const urlRegex = /(https?:\/\/[^\s]+)/g;
 if (urlRegex.test(stringValue)) {
 const parts = stringValue.split(urlRegex);
 return (
 <>
 {parts.map((part, i) => {
 if (part.match(/^https?:\/\//)) {
 return (
 <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
 {part}
 </a>
 );
 }
 return <span key={i}>{part}</span>;
 })}
 </>
 );
 }
 
 return stringValue;
 };

 return (
 <UserLayout title={`Tiket #TKT-${formatTicketId(ticket.id)}`}>
 <div className="max-w-4xl mx-auto py-8 px-4">
 <Head title={`Tiket #TKT-${formatTicketId(ticket.id)}`} />

 <div className="flex justify-between items-center mb-6">
 <div>
 <h1 className="text-2xl font-bold flex items-center gap-3">
 #TKT-{formatTicketId(ticket.id)}
 <StatusBadge status={ticket.status} />
 </h1>
 <p className="text-slate-500 mt-1">Dibuat pada {formatDateId(ticket.created_at)}</p>
 </div>
 <div className="flex items-center gap-2">
  <Button variant="default" onClick={() => {
    const donaturName = ticket.donatur?.nama_lengkap || ticket.donatur_nama || ticket.form_data?.nama_donatur || ticket.form_data?.donatur_nama || ticket.form_data?.nama_lengkap || ticket.nama_pemohon || '';
    const formattedTitle = donaturName ? `Tiket #${formatTicketId(ticket.id)} - ${donaturName}` : `Tiket #${formatTicketId(ticket.id)} - ${ticket.judul || 'Pengajuan'}`;
    router.get(route('pesan.index'), { context_id: ticket.id, context_title: formattedTitle });
  }}>
   <MessageSquareShare className="h-4 w-4 mr-1" /> Tanyakan Data Ini
  </Button>

 {canCancel && (
 <Button variant="destructive" onClick={() => setShowConfirm(true)}>
 <XCircle className="h-4 w-4 mr-1" /> Batalkan
 </Button>
 )}
 <Link href={route('data.riwayat')}>
 <Button variant="outline">Kembali</Button>
 </Link>
 </div>
 </div>

 <ConfirmDialog
 open={showConfirm}
 onOpenChange={setShowConfirm}
 title="Batalkan Tiket?"
 message="Tiket yang dibatalkan tidak bisa dikembalikan lagi. Yakin ingin membatalkan?"
 confirmText="Ya, Batalkan"
 cancelText="Tidak"
 onConfirm={handleCancel}
 />

 {ticket.status === 'solve' && ticket.sub_unit?.is_revision_enabled && !ticket.is_result_accepted && (
 <div className="mb-6 p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg flex flex-col gap-4">
 <div>
 <p className="font-semibold text-lg flex items-center gap-2"><Eye className="w-5 h-5"/> Review Hasil</p>
 <p className="text-sm">Tiket ini sudah diselesaikan. Silakan periksa hasil pekerjaan. Anda dapat menerima hasil akhir atau meminta revisi. Sisa revisi Anda: {maxRevisions - (ticket.revision_count || 0)} kali.</p>
 </div>
 <div className="flex gap-3">
 <Button 
 variant="default" 
 className="bg-green-600 hover:bg-green-700 text-white"
 onClick={() => {
 if(confirm('Yakin ingin menerima hasil akhir ini?')) {
 router.post(route('data.accept-result', ticket.id));
 }
 }}
 >
 Terima Hasil Akhir
 </Button>
 {(ticket.revision_count || 0) < maxRevisions && (
 <Button variant="outline" className="border-red-500 text-red-600 hover:bg-red-50" onClick={() => setShowRevForm(!showRevForm)}>
 Minta Revisi ({maxRevisions - (ticket.revision_count || 0)} sisa)
 </Button>
 )}
 </div>
 
 {showRevForm && (
 <div className="mt-4 p-4 bg-white border rounded-lg shadow-sm">
 <h3 className="font-semibold mb-2">Form Permintaan Revisi</h3>
 <form onSubmit={(e) => {
 e.preventDefault();
 postRev(route('data.request-revision', ticket.id), { onSuccess: () => { resetRev(); setShowRevForm(false); } });
 }} className="space-y-4">
 <div className="space-y-2">
 <label className="text-sm font-medium">Catatan Revisi <span className="text-red-500">*</span></label>
 <textarea className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[100px]" value={revData.catatan} onChange={e => setRevData('catatan', e.target.value)} placeholder="Tuliskan bagian mana yang perlu direvisi..." required />
 {errorsRev.catatan && <p className="text-red-500 text-sm">{errorsRev.catatan}</p>}
 </div>
 <div className="space-y-2">
 <label className="text-sm font-medium">Lampiran Pendukung Revisi (Opsional)</label>
 <p className="text-xs text-slate-500">Maks. 3 file, 3MB/file.</p>
 <input
 type="file" multiple accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
 className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
 onChange={e => {
 const files = Array.from(e.target.files || []);
 if (revData.general_attachments.length + files.length > 3) { alert('Maksimal hanya 3 lampiran.'); return; }
 const validFiles = files.filter(f => { if (f.size > 3 * 1024 * 1024) { alert(`${f.name} melebihi 3MB.`); return false; } return true; });
 setRevData('general_attachments', [...revData.general_attachments, ...validFiles]);
 e.target.value = '';
 }}
 />
 {errorsRev.general_attachments && <p className="text-red-500 text-sm">{errorsRev.general_attachments}</p>}
 {revData.general_attachments.length > 0 && (
 <div className="mt-2 space-y-2">
 {revData.general_attachments.map((file, idx) => (
 <div key={idx} className="flex justify-between items-center text-sm p-2 bg-slate-50 border rounded">
 <span className="truncate max-w-[200px]">{file.name}</span>
 <div className="flex items-center gap-3">
 {file.type.startsWith('image/') && (
 <button type="button" onClick={() => { setFileToEdit({file, index: idx, form: 'rev'}); setEditorOpen(true); }} className="text-blue-600 hover:underline flex items-center gap-1"><Edit2 className="w-4 h-4"/> Edit</button>
 )}
 <button type="button" onClick={() => setRevData('general_attachments', revData.general_attachments.filter((_, i) => i !== idx))} className="text-red-500 hover:underline">Hapus</button>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 <div className="flex justify-end gap-2">
 <Button type="button" variant="ghost" onClick={() => setShowRevForm(false)}>Batal</Button>
 <Button type="submit" disabled={processingRev}>Kirim Permintaan Revisi</Button>
 </div>
 </form>
 </div>
 )}
 </div>
 )}

 {ticket.status === 'solve' && ticket.sub_unit?.is_revision_enabled && ticket.is_result_accepted && (
 <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-3">
 <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
 <p className="font-medium">Anda telah menerima hasil akhir tiket ini.</p>
 </div>
 )}

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <Card>
 <CardHeader>
 <CardTitle>Data Pengaju</CardTitle>
 </CardHeader>
 <CardContent className="space-y-2">
 <div>
 <span className="text-sm text-slate-500">Divisi:</span>
 <p className="font-medium">{ticket.org_divisi?.nama_divisi || '-'}</p>
 </div>
 <div>
 <span className="text-sm text-slate-500">Unit Organisasi:</span>
 <p className="font-medium">{ticket.org_unit?.nama_unit_organisasi || '-'}</p>
 </div>
 <div>
 <span className="text-sm text-slate-500">Jabatan:</span>
 <p className="font-medium">{ticket.jabatan?.nama_jabatan || '-'}</p>
 </div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader>
 <CardTitle>Layanan Tujuan</CardTitle>
 </CardHeader>
 <CardContent className="space-y-2">
 <div>
 <span className="text-sm text-slate-500">Unit:</span>
 <p className="font-medium">{ticket.unit?.nama_unit || '-'}</p>
 </div>
 <div>
 <span className="text-sm text-slate-500">Sub Unit:</span>
 <p className="font-medium">{ticket.sub_unit?.nama_layanan || '-'}</p>
 </div>
 {ticket.campaign && (
 <div>
 <span className="text-sm text-slate-500">Campaign / Program:</span>
 <p className="font-medium text-blue-700">{ticket.campaign.nama_campaign}</p>
 </div>
 )}
 </CardContent>
 </Card>

 {(ticket.donatur || ticket.jumlah_donasi || ticket.nominal_void) && (
 <Card className="md:col-span-2">
 <CardHeader>
 <CardTitle>{ticket.nominal_void ? 'Informasi Pengajuan' : 'Informasi Donatur'}</CardTitle>
 </CardHeader>
 <CardContent className="space-y-2 grid grid-cols-1 md:grid-cols-2">
 <div>
 <span className="text-sm text-slate-500">Nama Donatur:</span>
 <p className="font-medium">{ticket.donatur?.nama_lengkap || '-'}</p>
 </div>
 <div>
 {ticket.jumlah_donasi ? (
  <>
   <span className="text-sm text-slate-500">Jumlah Donasi:</span>
   <p className="font-medium">
    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(ticket.jumlah_donasi))}
   </p>
  </>
 ) : ticket.nominal_void ? (
  <>
   <span className="text-sm text-slate-500">Nominal Void:</span>
   <p className="font-medium text-rose-600">
    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(ticket.nominal_void))}
   </p>
  </>
 ) : (
  <>
   <span className="text-sm text-slate-500">Jumlah Donasi:</span>
   <p className="font-medium">-</p>
  </>
 )}
 </div>
 </CardContent>
 </Card>
 )}

 <Card className="md:col-span-2">
 <CardHeader>
 <CardTitle>Isian Form</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 {formFields?.length > 0 ? (
 formFields.map((field) => (
 <div key={field.id}>
 <span className="text-sm text-slate-500">{field.label}:</span>
 <p className="font-medium mt-1">
 {renderFormValue(field)}
 </p>
 </div>
 ))
 ) : (
 <p className="text-slate-500">Tidak ada data form yang diisi.</p>
 )}
 </CardContent>
 </Card>



 {ticket.logs?.length > 0 && (
 <Card className="md:col-span-2">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <FileText className="h-5 w-5" />
 Timeline Respon
 </CardTitle>
 </CardHeader>
 <CardContent>
 <TicketTimeline logs={ticket.logs} />
 </CardContent>
 </Card>
 )}

 
 </div>
 </div>
 
 {fileToEdit && (
 <ImageEditorModal
 isOpen={editorOpen}
 onClose={() => setEditorOpen(false)}
 imageFile={fileToEdit.file}
 onSave={(editedFile) => {
 if (fileToEdit.form === 'rev') {
 const newFiles = [...revData.general_attachments];
 newFiles[fileToEdit.index] = editedFile;
 setRevData('general_attachments', newFiles);
 }
 setEditorOpen(false);
 }}
 />
 )}

 <ShareToChatModal
 open={shareOpen}
 onOpenChange={setShareOpen}
 contextType="App\Models\Record"
 contextId={ticket.id}
 contextTitle={`Tiket #TKT-${formatTicketId(ticket.id)} - ${ticket.sub_unit?.nama_layanan || 'Detail'}`}
 />
 </UserLayout>
 );
}
