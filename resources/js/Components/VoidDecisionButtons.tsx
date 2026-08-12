import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/Components/ui/dialog';
import { CheckCircle2, XCircle } from 'lucide-react';
import { formatTicketId } from '@/lib/utils';

export default function VoidDecisionButtons({ ticket }: { ticket: any }) {
 const [rejectOpen, setRejectOpen] = useState(false);
 const { post: postApprove, processing: processingApprove } = useForm({ _method: 'patch' });
 const { data, setData, post: postReject, processing: processingReject, errors, reset } = useForm({ catatan: '', _method: 'patch' });

 const handleApprove = () => {
  if (!confirm(`Yakin ingin menyetujui transaksi Void #TKT-${formatTicketId(ticket.id)}?`)) return;
  postApprove(route('admin.data.approve-void', ticket.id));
 };

 const submitReject = (e: React.FormEvent) => {
  e.preventDefault();
  postReject(route('admin.data.reject-void', ticket.id), {
   onSuccess: () => {
    setRejectOpen(false);
    reset();
   },
  });
 };

 return (
  <>
   <div className="flex items-center gap-1.5">
    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={processingApprove} onClick={handleApprove}>
     <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
    </Button>
    <Button size="sm" variant="destructive" disabled={processingReject} onClick={() => { reset(); setRejectOpen(true); }}>
     <XCircle className="w-4 h-4 mr-1" /> Reject
    </Button>
   </div>

   <Dialog open={rejectOpen} onOpenChange={(open: boolean) => { if (!open) { setRejectOpen(false); reset(); } }}>
    <DialogContent className="sm:max-w-md">
     <DialogHeader>
      <DialogTitle>Tolak Transaksi Void #{`TKT-${formatTicketId(ticket.id)}`}</DialogTitle>
     </DialogHeader>
     <form onSubmit={submitReject} className="space-y-4">
      <div className="space-y-2">
       <label className="text-sm font-medium">Catatan Penolakan <span className="text-red-500">*</span></label>
       <textarea
        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[100px]"
        rows={3}
        value={data.catatan}
        onChange={e => setData('catatan', e.target.value)}
        placeholder="Alasan penolakan (wajib diisi)..."
        required
       />
       {errors.catatan && <p className="text-red-500 text-sm">{errors.catatan}</p>}
      </div>
      <DialogFooter>
       <Button type="button" variant="outline" disabled={processingReject} onClick={() => { setRejectOpen(false); reset(); }}>Batal</Button>
       <Button type="submit" variant="destructive" disabled={processingReject}>Tolak Void</Button>
      </DialogFooter>
     </form>
    </DialogContent>
   </Dialog>
  </>
 );
}