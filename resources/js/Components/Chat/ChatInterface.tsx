import React, { useState, useEffect, useRef } from 'react';
import { usePage, Head } from '@inertiajs/react';
import axios from 'axios';
import { format } from 'date-fns';
import { Send, Search, Users, ChevronLeft, Paperclip, FileText, Download, X, Loader2, Link2 } from 'lucide-react';
import { Button } from '@/Components/ui/button';

export default function ChatInterface({ guard }: { guard?: 'user' | 'admin' }) {
    const { auth } = usePage<any>().props;
    const isExplicitAdmin = guard === 'admin';
    const user = isExplicitAdmin ? auth?.admin : auth?.user;
    const userModelType = isExplicitAdmin ? 'App\\Models\\Admin' : 'App\\Models\\User';

    
    const [contacts, setContacts] = useState<any[]>([]);
    const [activeChat, setActiveChat] = useState<any | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    
    const [selectedContext, setSelectedContext] = useState<any | null>(null);
    const [showContextModal, setShowContextModal] = useState(false);
    const [contextOptions, setContextOptions] = useState<any[]>([]);
    const [loadingContext, setLoadingContext] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchContacts();
        
        const urlParams = new URLSearchParams(window.location.search);
        const ctxId = urlParams.get('context_id');
        const ctxTitle = urlParams.get('context_title');
        
        if (ctxId && ctxTitle) {
            setSelectedContext({
                id: ctxId,
                title: ctxTitle,
                model_type: 'App\\Models\\Record'
            });
        }
    }, []);

    useEffect(() => {
        if (activeChat) {
            fetchMessages(activeChat);
        }
    }, [activeChat]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    useEffect(() => {
        if (user) {
            const channel = userModelType === 'App\\Models\\Admin'
                ? `App.Models.Admin.${user.id}`
                : `App.Models.User.${user.id}`;
                
            window.Echo.private(channel)
                .listen('MessageSent', (e: any) => {
                    const msg = e.message;
                    // If chat is open and we are talking to the sender, append it
                    if (activeChat && activeChat.id === msg.sender_id && activeChat.model_type === msg.sender_type) {
                        setMessages(prev => [...prev, msg]);
                    }
                    // Web push handles background notifications
                });
            return () => {
                window.Echo.leave(channel);
            }
        }
    }, [user, activeChat]);

    const fetchContacts = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/messages/contacts?sender_type=${userModelType === 'App\\Models\\Admin' ? 'admin' : 'user'}`);
            setContacts(res.data);
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    const fetchMessages = async (chat: any) => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/messages/${chat.id}?receiver_type=${encodeURIComponent(chat.model_type)}&sender_type=${userModelType === 'App\\Models\\Admin' ? 'admin' : 'user'}`);
            setMessages(res.data);
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    const handleOpenContextModal = async () => {
        setShowContextModal(true);
        if (contextOptions.length === 0) {
            setLoadingContext(true);
            try {
                const res = await axios.get(`/api/messages/context-options?sender_type=${userModelType === 'App\\Models\\Admin' ? 'admin' : 'user'}`);
                setContextOptions(res.data);
            } catch (error) {
                console.error(error);
            }
            setLoadingContext(false);
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !attachment) || !activeChat) return;

        const text = newMessage;
        const currentAttachment = attachment;
        const currentContext = selectedContext;
        setNewMessage('');
        setAttachment(null);
        setSelectedContext(null);
        
        const tempMsg = {
            id: Date.now(),
            sender_id: user.id,
            sender_type: userModelType,
            body: text,
            created_at: new Date().toISOString(),
            context_type: currentContext?.model_type || null,
            context_id: currentContext?.id || null,
            context: currentContext ? { id: currentContext.id, judul: currentContext.title } : null,
            attachment_name: currentAttachment?.name,
            attachment_type: currentAttachment?.type,
            is_uploading: !!currentAttachment,
            upload_progress: 0,
            attachment_preview: currentAttachment && currentAttachment.type.startsWith('image/')
                ? URL.createObjectURL(currentAttachment)
                : null
        };
        setMessages(prev => [...prev, tempMsg]);

        try {
            let base64Attachment = null;
            if (currentAttachment) {
                base64Attachment = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = error => reject(error);
                    reader.readAsDataURL(currentAttachment);
                });
            }

            const payload = {
                receiver_id: activeChat.id,
                receiver_type: activeChat.model_type,
                body: text,
                context_type: currentContext?.model_type || null,
                context_id: currentContext?.id || null,
                sender_type: userModelType === 'App\\Models\\Admin' ? 'admin' : 'user',
                attachment_base64: base64Attachment,
                attachment_name: currentAttachment?.name,
            };

            const res = await axios.post('/api/messages', payload, {
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setMessages(prev => prev.map(m => m.id === tempMsg.id ? { ...m, upload_progress: percentCompleted } : m));
                    }
                }
            });
            setMessages(prev => prev.map(m => m.id === tempMsg.id ? res.data : m));
        } catch (error: any) {
            console.error(error);
            setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
            alert(error.response?.data?.error || error.response?.data?.message || 'Gagal mengirim pesan.');
        }
    };

    const filteredContacts = contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="flex h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] border rounded-2xl bg-white overflow-hidden shadow-sm relative">
            <Head title="Pesan" />
            
            {/* Context Modal */}
            {showContextModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
                        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg">Tautkan Data / Tiket</h3>
                            <button onClick={() => setShowContextModal(false)} className="text-slate-500 hover:text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-full p-1 transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1">
                            {loadingContext ? (
                                <div className="text-center py-8 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Memuat data...</div>
                            ) : contextOptions.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-2">
                                    <FileText className="h-8 w-8 text-slate-300" />
                                    <p>Tidak ada data ditemukan.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {contextOptions.map(ctx => (
                                        <button 
                                            key={ctx.id} 
                                            onClick={() => { setSelectedContext(ctx); setShowContextModal(false); }}
                                            className="text-left p-3 border rounded-xl hover:border-primary hover:bg-primary/5 transition-colors flex items-center justify-between group"
                                        >
                                            <div className="min-w-0 flex-1 pr-4">
                                                <div className="font-semibold text-sm text-slate-800 truncate group-hover:text-primary transition-colors">{ctx.title}</div>
                                                <div className="text-xs text-slate-500 mt-1">{format(new Date(ctx.created_at), 'dd MMM yyyy HH:mm')}</div>
                                            </div>
                                            <Link2 className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Sidebar Kiri - Daftar Kontak */}
            <div className={`w-full md:w-[350px] flex-shrink-0 flex flex-col border-r bg-slate-50/50 ${activeChat ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b bg-white">
                    <h2 className="font-bold text-xl mb-4">Pesan</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Cari kontak..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-100 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2">
                    {loading && contacts.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">Memuat kontak...</div>
                    ) : filteredContacts.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                            <Users className="h-8 w-8 text-slate-300" />
                            <p>Tidak ada kontak ditemukan.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1">
                            {filteredContacts.map(contact => (
                                <button
                                    key={contact.id}
                                    onClick={() => setActiveChat(contact)}
                                    className={`flex items-center gap-3 p-3 w-full rounded-xl transition-colors text-left ${activeChat?.id === contact.id ? 'bg-primary/10' : 'hover:bg-slate-100'}`}
                                >
                                    <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                                        {contact.avatar_path ? (
                                            <img src={`/storage/${contact.avatar_path}`} alt="" className="h-full w-full rounded-full object-cover" />
                                        ) : (
                                            <span className="font-semibold text-primary">{contact.name.charAt(0)}</span>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-baseline gap-2 mb-0.5">
                                            <p className="font-semibold text-sm truncate">{contact.name}</p>
                                            <span className="text-[10px] bg-slate-200/50 text-slate-500 px-1.5 py-0.5 rounded-md uppercase tracking-wider">{contact.type}</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Area Kanan - Percakapan */}
            <div className={`flex-1 flex-col bg-[#F0F2F5] ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
                {!activeChat ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                        <div className="h-24 w-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <Send className="h-10 w-10 text-slate-300 ml-1" />
                        </div>
                        <p className="font-medium text-lg text-slate-500">Mulai Percakapan</p>
                        <p className="text-sm">Pilih kontak di samping untuk mulai berkirim pesan.</p>
                    </div>
                ) : (
                    <>
                        <div className="h-16 px-4 bg-white border-b flex items-center gap-3 shrink-0">
                            <Button variant="ghost" size="icon" onClick={() => setActiveChat(null)} className="md:hidden shrink-0">
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                                {activeChat.avatar_path ? (
                                    <img src={`/storage/${activeChat.avatar_path}`} alt="" className="h-full w-full rounded-full object-cover" />
                                ) : (
                                    <span className="font-semibold text-primary">{activeChat.name.charAt(0)}</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{activeChat.name}</h3>
                                <span className="text-[10px] bg-slate-200/50 text-slate-500 px-1.5 py-0.5 rounded-md uppercase tracking-wider">{activeChat.type}</span>
                            </div>
                            <div className="ml-auto">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className={`text-slate-500 hover:text-primary ${Notification.permission === 'granted' ? 'text-primary' : ''}`}
                                    onClick={() => {
                                        Notification.requestPermission().then(async (perm) => {
                                            if (perm === 'granted') {
                                                const { useWebPush } = await import('@/hooks/useWebPush');
                                                // We can just rely on the layout's useWebPush if it handles it on load, 
                                                // but let's force a reload to trigger the layout hook to subscribe
                                                window.location.reload();
                                            } else {
                                                alert('Izin notifikasi ditolak oleh browser.');
                                            }
                                        });
                                    }}
                                    title="Aktifkan Notifikasi Desktop"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4">
                            {messages.map((msg, idx) => {
                                const isMe = msg.sender_id === user.id && msg.sender_type === userModelType;
                                return (
                                    <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} gap-1 max-w-[85%] md:max-w-[70%] ${isMe ? 'self-end' : 'self-start'}`}>
                                        {msg.context && (
                                            <a href={`/data/${msg.context_id}`} className="block w-full text-xs bg-white/90 backdrop-blur border shadow-sm rounded-xl p-3 mb-1 hover:bg-slate-50 transition-colors">
                                                <div className="font-bold text-primary mb-1 border-b pb-1">Terkait Data:</div>
                                                <div className="truncate text-slate-700 font-medium">{msg.context.nama_pemohon || msg.context.judul || 'Data Context'}</div>
                                            </a>
                                        )}
                                        <div className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-white text-foreground rounded-tl-sm'}`}>
                                            {(msg.attachment_path || msg.is_uploading) && (
                                                <div className="mb-2 relative">
                                                    {msg.attachment_type?.startsWith('image/') ? (
                                                        <a href={msg.attachment_path ? `/storage/${msg.attachment_path}` : '#'} target={msg.attachment_path ? "_blank" : undefined} rel="noreferrer" className="block relative">
                                                            <img src={msg.attachment_path ? `/storage/${msg.attachment_path}` : msg.attachment_preview} alt="Attachment" className={`max-w-[200px] md:max-w-[300px] rounded-lg object-contain border border-white/20 bg-white/5 transition-all ${msg.is_uploading ? 'opacity-50 blur-sm' : ''}`} />
                                                            {msg.is_uploading && (
                                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                                    <Loader2 className="h-8 w-8 text-white animate-spin drop-shadow-md" />
                                                                    <span className="text-white text-xs font-bold mt-1 drop-shadow-md">{msg.upload_progress}%</span>
                                                                </div>
                                                            )}
                                                        </a>
                                                    ) : (
                                                        <a href={msg.attachment_path ? `/storage/${msg.attachment_path}` : '#'} target={msg.attachment_path ? "_blank" : undefined} rel="noreferrer" className={`flex items-center gap-2 p-2 rounded-lg border text-sm hover:opacity-80 transition-all relative overflow-hidden ${isMe ? 'bg-primary-foreground/10 text-white border-white/30' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                                                            {msg.is_uploading && (
                                                                <div className="absolute left-0 bottom-0 top-0 bg-black/10 transition-all duration-200" style={{ width: `${msg.upload_progress}%` }} />
                                                            )}
                                                            <FileText className="h-4 w-4 shrink-0 relative z-10" />
                                                            <span className="truncate max-w-[150px] relative z-10">{msg.attachment_name || 'Document'}</span>
                                                            {msg.is_uploading ? (
                                                                <Loader2 className="h-4 w-4 shrink-0 animate-spin relative z-10 ml-1" />
                                                            ) : (
                                                                <Download className="h-4 w-4 shrink-0 opacity-70 ml-1 relative z-10" />
                                                            )}
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                            {msg.body && <div>{msg.body}</div>}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground mx-2 font-medium">
                                            {msg.created_at ? format(new Date(msg.created_at), 'HH:mm') : ''}
                                        </span>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-3 md:p-4 bg-white border-t shrink-0 flex flex-col gap-2">
                            {(attachment || selectedContext) && (
                                <div className="flex flex-wrap gap-2">
                                    {selectedContext && (
                                        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 p-2 rounded-lg border border-blue-200 w-max max-w-full">
                                            <Link2 className="h-4 w-4 shrink-0" />
                                            <span className="text-sm font-medium truncate flex-1">{selectedContext.title}</span>
                                            <button type="button" onClick={() => setSelectedContext(null)} className="text-blue-500 hover:bg-blue-200 rounded p-0.5 ml-2 transition-colors">
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}
                                    {attachment && (
                                        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border w-max max-w-full">
                                            <Paperclip className="h-4 w-4 text-slate-500 shrink-0" />
                                            <span className="text-sm text-slate-700 truncate">{attachment.name}</span>
                                            <button type="button" onClick={() => setAttachment(null)} className="text-red-500 hover:bg-red-50 rounded p-0.5 ml-2 transition-colors">
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                            <form onSubmit={sendMessage} className="flex items-center gap-2 w-full">
                                <Button type="button" variant="ghost" size="icon" className="shrink-0 text-slate-500 hover:text-primary hover:bg-primary/10" onClick={handleOpenContextModal} title="Tautkan Data">
                                    <Link2 className="h-5 w-5" />
                                </Button>
                                <input
                                    type="file"
                                    id="chat-attachment"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            if (file.size > 3 * 1024 * 1024) {
                                                alert(`File ${file.name} melebihi batas 3MB.`);
                                                return;
                                            }
                                            setAttachment(file);
                                        }
                                        e.target.value = '';
                                    }}
                                />
                                <Button type="button" variant="ghost" size="icon" className="shrink-0 text-slate-500" onClick={() => document.getElementById('chat-attachment')?.click()}>
                                    <Paperclip className="h-5 w-5" />
                                </Button>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Ketik pesan Anda..."
                                    className="flex-1 bg-slate-100 border-transparent rounded-full px-5 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-w-0"
                                />
                                <Button type="submit" size="icon" className="h-11 w-11 rounded-full shrink-0 shadow-sm" disabled={!newMessage.trim() && !attachment}>
                                    <Send className="h-5 w-5" />
                                </Button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
