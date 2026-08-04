import React, { useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { StatusBadge } from '@/Components/StatusBadge';
import { Button } from '@/Components/ui/button';
import { TicketTimeline } from '@/Components/TicketTimeline';
import { TicketAttachmentList } from '@/Components/TicketAttachmentList';
import { formatDateId, formatTicketId } from '@/lib/utils';
import { AttachmentViewer } from '@/Components/AttachmentViewer';
import { FileText, ArrowLeft, AlertTriangle, CheckCircle2, XCircle, Download, Eye, Edit2, MessageSquareShare } from 'lucide-react';
import ImageEditorModal from '@/Components/FormBuilder/ImageEditorModal';
import ShareToChatModal from '@/Components/Chat/ShareToChatModal';

const validTransitions: Record<string, string[]> = {
 open: ['on_proses', 'reject', 'pending'],
 on_proses: ['solve', 'pending', 'reject'],
 pending: ['on_proses'],
 need_revision: ['solve', 'pending', 'reject'],
};

const statusLabels: Record<string, string> = {
 open: 'Baru', on_proses: 'Diproses', pending: 'Tertunda', solve: 'Selesai', reject: 'Ditolak', dibatalkan: 'Dibatalkan', need_revision: 'Butuh Revisi', accepted: 'Diterima User',
};

export default function TicketDetail({ ticket, formFields, operators }: any) {
 const { auth } = usePage().props as any;
 const canAssignOperator = auth?.permissions?.includes('akses-assign-operator');

 const [editorOpen, setEditorOpen] = useState(false);
 const [shareOpen, setShareOpen] = useState(false);
 const [fileToEdit, setFileToEdit] = useState<{file: File, index: number, form: 'admin'} | null>(null);

 const { data: statusData, setData: setStatusData, post: postStatus, processing: processingStatus, errors: errorsStatus, reset: resetStatus } = useForm({ status: '', catatan: '', general_attachments: [] as File[], _method: 'patch' });
 const { data: assignData, setData: setAssignData, patch: patchAssign, processing: processingAssign, errors: errorsAssign } = useForm({ assigned_admin_id: ticket.assigned_admin_id || '' });

 const transitions = validTransitions[ticket.status] || [];

 const handleStatusSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 postStatus(route('admin.data.status', ticket.id), {
 onSuccess: () => {
 resetStatus();
 }
 });
 };

 const handleAssignSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 patchAssign(route('admin.data.assign', ticket.id));
 };

 const renderFormValue = (field: any) => {
 if (field.tipe_field === 'upload_gambar' || field.tipe_field === 'upload_file') {
 const fieldAttachments = ticket.attachments?.filter((a: any) => a.field_id == field.id);
 return fieldAttachments && fieldAttachments.length > 0 ? (
 <div className="flex flex-col gap-2 mt-1">
 {fieldAttachments.map((attachment: any, idx: number) => (
 <AttachmentViewer key={idx} attachment={attachment} viewRoute="admin.data.view" downloadRoute="admin.data.download">
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
 <AdminLayout title={`Detail Tiket #TKT-${formatTicketId(ticket.id)}`}>
 <Head title={`Tiket #TKT-${formatTicketId(ticket.id)}`} />

 <div className="flex items-center gap-3 mb-6">
 <Button variant="outline" size="sm" onClick={() => router.get(route('admin.data.index'))}>
 <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
 </Button>
 <Button variant="default" size="sm" onClick={() => router.get(route('admin.pesan.index'), { context_id: ticket.id, context_title: ticket.judul || ticket.nama_pemohon || `Tiket #${formatTicketId(ticket.id)}` })}>
 <MessageSquareShare className="h-4 w-4 mr-1" /> Tanyakan Data Ini
 </Button>
 <h1 className="text-2xl font-bold flex items-center gap-3">
 #TKT-{formatTicketId(ticket.id)} <StatusBadge status={ticket.status} />
 </h1>
 </div>



 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="lg:col-span-2 space-y-6">
 <Card>
 <CardHeader><CardTitle>Data Pengaju</CardTitle></CardHeader>
 <CardContent className="grid grid-cols-2 gap-4">
 <div><span className="text-sm text-slate-500">Nama</span><p className="font-medium">{ticket.user?.username || '-'}</p></div>
 <div><span className="text-sm text-slate-500">Email</span><p className="font-medium">{ticket.user?.email || '-'}</p></div>
 <div><span className="text-sm text-slate-500">No. WA</span><p className="font-medium">{ticket.user?.no_wa || '-'}</p></div>
 <div><span className="text-sm text-slate-500">Divisi</span><p className="font-medium">{ticket.org_divisi?.nama_divisi || '-'}</p></div>
 <div><span className="text-sm text-slate-500">Unit Organisasi</span><p className="font-medium">{ticket.org_unit?.nama_unit_organisasi || '-'}</p></div>
 <div><span className="text-sm text-slate-500">Jabatan</span><p className="font-medium">{ticket.jabatan?.nama_jabatan || '-'}</p></div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader><CardTitle>Data Pengajuan</CardTitle></CardHeader>
 <CardContent className="space-y-3">
 <div className="grid grid-cols-2 gap-3 pb-3 border-b">
 <div><span className="text-sm text-slate-500">Unit</span><p className="font-medium">{ticket.unit?.nama_unit || '-'}</p></div>
 <div><span className="text-sm text-slate-500">Sub Unit</span><p className="font-medium">{ticket.sub_unit?.nama_layanan || '-'}</p></div>
 {ticket.campaign && (
 <div className="col-span-2"><span className="text-sm text-slate-500">Campaign / Program</span><p className="font-medium text-blue-700">{ticket.campaign.nama_campaign}</p></div>
 )}
 </div>
 {formFields?.map((field: any) => (
 <div key={field.id}>
 <span className="text-sm text-slate-500">{field.label}:</span>
 <p className="font-medium mt-0.5">{renderFormValue(field)}</p>
 </div>
 ))}
 </CardContent>
 </Card>

 {(ticket.nama_donatur || ticket.jumlah_donasi) && (
  <Card>
  <CardHeader><CardTitle>Informasi Donatur</CardTitle></CardHeader>
  <CardContent className="grid grid-cols-2 gap-4">
  <div><span className="text-sm text-slate-500">Nama Donatur</span><p className="font-medium">{ticket.nama_donatur || '-'}</p></div>
  <div><span className="text-sm text-slate-500">Jumlah Donasi</span><p className="font-medium">
  {ticket.jumlah_donasi 
  ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(ticket.jumlah_donasi))
  : '-'}
  </p></div>
  </CardContent>
  </Card>
  )}

 {ticket.attachments?.length > 0 && (
 <Card>
 <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Lampiran</CardTitle></CardHeader>
 <CardContent>
 <TicketAttachmentList attachments={ticket.attachments} downloadRoute="admin.data.download" />
 </CardContent>
 </Card>
 )}

 {ticket.logs?.length > 0 && (
 <Card>
 <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Timeline</CardTitle></CardHeader>
 <CardContent>
 <TicketTimeline logs={ticket.logs} downloadRoute="admin.data.download" />
 </CardContent>
 </Card>
 )}
 </div>

 <div className="space-y-6">
 {canAssignOperator && (
 <Card>
 <CardHeader><CardTitle>Penugasan Operator</CardTitle></CardHeader>
 <CardContent>
 <form onSubmit={handleAssignSubmit} className="space-y-4">
 <div className="space-y-2">
 <label className="text-sm font-medium">Tugaskan ke Operator</label>
 <select className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={assignData.assigned_admin_id} onChange={e => setAssignData('assigned_admin_id', e.target.value)}>
 <option value="">-- Pilih Operator --</option>
 {operators?.map((op: any) => (
 <option key={op.id} value={op.id}>{op.name || op.username}</option>
 ))}
 </select>
 {errorsAssign.assigned_admin_id && <p className="text-red-500 text-sm">{errorsAssign.assigned_admin_id}</p>}
 </div>
 <Button type="submit" variant="secondary" className="w-full" disabled={processingAssign}>
 Tugaskan
 </Button>
 {ticket.assigned_admin && (
 <div className="text-sm text-slate-500 mt-2 text-center">
 Saat ini ditugaskan ke: <span className="font-semibold text-slate-800">{ticket.assigned_admin.name || ticket.assigned_admin.username}</span>
 </div>
 )}
 </form>
 </CardContent>
 </Card>
 )}

 <Card>
 <CardHeader><CardTitle>Aksi Status</CardTitle></CardHeader>
 <CardContent>
 {transitions.length > 0 ? (
 <form onSubmit={handleStatusSubmit} className="space-y-4">
 <div className="space-y-2">
 <span className="text-sm text-slate-500">Status Saat Ini:</span>
 <div><StatusBadge status={ticket.status} /></div>
 </div>
 <div className="space-y-2">
 <label className="text-sm font-medium">Ubah ke</label>
 <select className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={statusData.status} onChange={e => setStatusData('status', e.target.value)}>
 <option value="">Pilih status</option>
 {transitions.map((s: string) => (
 <option key={s} value={s}>{statusLabels[s] || s}</option>
 ))}
 </select>
 {errorsStatus.status && <p className="text-red-500 text-sm">{errorsStatus.status}</p>}
 </div>
 <div className="space-y-2">
 <label className="text-sm font-medium">Catatan Admin <span className="text-red-500">*</span></label>
 <textarea className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[100px]" value={statusData.catatan} onChange={e => setStatusData('catatan', e.target.value)} placeholder="Wajib diisi..." />
 {errorsStatus.catatan && <p className="text-red-500 text-sm">{errorsStatus.catatan}</p>}
 </div>
 <div className="space-y-2">
 <label className="text-sm font-medium">Lampiran Tambahan (Opsional)</label>
 <p className="text-xs text-slate-500">Maks. 3 file, 3MB/file (JPG, PNG, PDF, DOC, DOCX).</p>
 <input
 type="file"
 multiple
 accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
 className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
 onChange={e => {
 const files = Array.from(e.target.files || []);
 if (statusData.general_attachments.length + files.length > 3) {
 alert('Maksimal hanya 3 lampiran.');
 return;
 }
 const validFiles = files.filter(f => {
 if (f.size > 3 * 1024 * 1024) { alert(`${f.name} melebihi 3MB.`); return false; }
 return true;
 });
 setStatusData('general_attachments', [...statusData.general_attachments, ...validFiles]);
 e.target.value = '';
 }}
 />
 {errorsStatus.general_attachments && <p className="text-red-500 text-sm">{errorsStatus.general_attachments}</p>}
 {statusData.general_attachments.length > 0 && (
 <div className="mt-2 space-y-2">
 {statusData.general_attachments.map((file, idx) => (
 <div key={idx} className="flex justify-between items-center text-sm p-2 bg-slate-50 border rounded">
 <span className="truncate max-w-[200px]">{file.name}</span>
 <div className="flex items-center gap-3">
 {file.type.startsWith('image/') && (
 <button type="button" onClick={() => { setFileToEdit({file, index: idx, form: 'admin'}); setEditorOpen(true); }} className="text-blue-600 hover:underline flex items-center gap-1"><Edit2 className="w-4 h-4"/> Edit</button>
 )}
 <button type="button" onClick={() => setStatusData('general_attachments', statusData.general_attachments.filter((_, i) => i !== idx))} className="text-red-500 hover:underline">Hapus</button>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 <Button type="submit" className="w-full" disabled={processingStatus}>Simpan Perubahan Status</Button>
 </form>
 ) : (
 <p className="text-sm text-slate-500">Tidak ada transisi status yang tersedia.</p>
 )}
 </CardContent>
 </Card>


 </div>
 </div>
 
 {fileToEdit && (
 <ImageEditorModal
 isOpen={editorOpen}
 onClose={() => setEditorOpen(false)}
 imageFile={fileToEdit.file}
 onSave={(editedFile) => {
 if (fileToEdit.form === 'admin') {
 const newFiles = [...statusData.general_attachments];
 newFiles[fileToEdit.index] = editedFile;
 setStatusData('general_attachments', newFiles);
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
 </AdminLayout>
 );
}
