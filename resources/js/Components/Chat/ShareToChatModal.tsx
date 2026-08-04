import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";
import axios from 'axios';
import toast from 'react-hot-toast';
import { Send } from 'lucide-react';

interface ShareToChatModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    contextType: string;
    contextId: number;
    contextTitle: string;
}

export default function ShareToChatModal({ open, onOpenChange, contextType, contextId, contextTitle }: ShareToChatModalProps) {
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(`Lihat data ini: ${contextTitle}`);

    useEffect(() => {
        if (open) {
            fetchContacts();
        }
    }, [open]);

    const fetchContacts = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/messages/contacts');
            setContacts(res.data);
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    const handleShare = async (contact: any) => {
        try {
            await axios.post('/api/messages', {
                receiver_id: contact.id,
                receiver_type: contact.model_type,
                body: message,
                context_type: contextType,
                context_id: contextId,
            });
            toast.success('Pesan dan data berhasil dibagikan!');
            onOpenChange(false);
        } catch (error) {
            toast.error('Gagal membagikan data.');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Bagikan ke Obrolan</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    <div>
                        <label className="text-sm font-medium mb-1 block">Data Terlampir</label>
                        <div className="p-3 bg-muted/50 rounded-xl text-sm truncate border">
                            {contextTitle}
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-sm font-medium mb-1 block">Pesan Tambahan (Opsional)</label>
                        <input
                            type="text"
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            className="w-full text-sm border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-primary outline-none"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-2 block">Pilih Penerima</label>
                        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                            {loading ? (
                                <div className="text-sm text-center text-muted-foreground p-4">Memuat kontak...</div>
                            ) : (
                                contacts.map(contact => (
                                    <div key={contact.id} className="flex items-center justify-between p-2 rounded-xl border bg-white hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                                                {contact.avatar_path ? (
                                                    <img src={`/storage/${contact.avatar_path}`} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    <span className="font-semibold text-xs text-primary">{contact.name.charAt(0)}</span>
                                                )}
                                            </div>
                                            <span className="font-medium text-sm">{contact.name}</span>
                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full ml-1 uppercase">{contact.type}</span>
                                        </div>
                                        <Button size="sm" variant="ghost" onClick={() => handleShare(contact)} className="h-8 gap-1.5 text-primary hover:text-primary hover:bg-primary/10">
                                            <Send className="h-3.5 w-3.5" />
                                            Kirim
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
