import React, { useState, useEffect, useRef } from 'react';
import { usePage, Head } from '@inertiajs/react';
import axios from 'axios';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Send, Search, Users, ChevronLeft, Paperclip, FileText, Download, X, Loader2, Link2, Bell, CheckCheck, Check, Info } from 'lucide-react';
import { Button } from '@/Components/ui/button';

// Helper for date formatting in Indonesian
const formatIndonesianDate = (date: Date) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const dayName = days[date.getDay()];
    const dayNum = date.getDate();
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();
    return `${dayName}, ${dayNum} ${monthName} ${year}`;
};

const getDateLabel = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Hari ini';
    if (d.toDateString() === yesterday.toDateString()) return 'Kemarin';
    return formatIndonesianDate(d);
};

const formatSidebarTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
        return format(d, 'HH:mm');
    }
    if (d.toDateString() === yesterday.toDateString()) {
        return 'Kemarin';
    }
    return format(d, 'dd/MM/yy');
};

const playChimeSound = () => {
    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
        console.error('Audio chime error:', e);
    }
};

export default function ChatInterface({ guard }: { guard?: 'user' | 'admin' }) {
    const { auth } = usePage<any>().props;
    const isExplicitAdmin = guard === 'admin';
    const user = isExplicitAdmin ? auth?.admin : auth?.user;
    const userModelType = isExplicitAdmin ? 'App\\Models\\Admin' : 'App\\Models\\User';

    const [contacts, setContacts] = useState<any[]>([]);
    const [contactFilter, setContactFilter] = useState<'all' | 'unread'>('all');
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
    const activeChatRef = useRef<any | null>(null);

    // Keep activeChatRef synced
    useEffect(() => {
        activeChatRef.current = activeChat;
    }, [activeChat]);

    const formatRupiah = (val?: number | string) => {
        if (val === null || val === undefined || val === '') return null;
        const num = Number(val);
        if (isNaN(num) || num === 0) return typeof val === 'string' && val.trim() !== '' ? val : null;
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
    };

    const renderContextCard = (context: any, isMe: boolean) => {
        if (!context) return null;

        const getStatusInfo = (status?: string) => {
            const s = (status || '').toLowerCase();
            if (s === 'approved' || s === 'selesai' || s === 'completed' || s === 'accepted') {
                return { label: 'Disetujui', bg: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
            }
            if (s === 'rejected' || s === 'ditolak' || s === 'canceled') {
                return { label: 'Ditolak', bg: 'bg-rose-100 text-rose-700 border-rose-200' };
            }
            if (s === 'in_progress' || s === 'proses' || s === 'diproses') {
                return { label: 'Dalam Proses', bg: 'bg-blue-100 text-blue-700 border-blue-200' };
            }
            return { label: 'Menunggu', bg: 'bg-amber-100 text-amber-700 border-amber-200' };
        };

        const ticketId = context.formatted_id ? `Tiket #${context.formatted_id}` : (context.id ? `Tiket #${context.id}` : 'Tautan Data');
        const serviceName = context.sub_unit_nama || context.sub_unit?.nama_layanan || '';
        const title = context.judul || (serviceName ? `Pengajuan ${serviceName}` : `Tiket #${context.id}`);
        const donaturName = context.donatur_nama || context.donatur?.nama_lengkap || context.form_data?.nama_donatur || context.form_data?.donatur_nama || context.form_data?.nama_lengkap;
        const rawNominal = context.jumlah_donasi || context.nominal_void || context.form_data?.jumlah_donasi || context.form_data?.nominal;
        const nominalFormatted = formatRupiah(rawNominal);

        const statusInfo = getStatusInfo(context.status);
        const dateFormatted = context.created_at ? format(new Date(context.created_at), 'dd MMM yyyy, HH:mm') : '';

        const href = userModelType === 'App\\Models\\Admin'
            ? `/admin/verifikasi-data/${context.id}`
            : `/data/${context.id}`;

        return (
            <a
                href={href}
                className={`block w-full rounded-2xl p-3.5 mb-1.5 border shadow-sm transition-all group overflow-hidden ${
                    isMe
                        ? 'bg-white/95 text-slate-800 border-white/40 hover:bg-white hover:shadow-md'
                        : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-primary/30 hover:shadow-md'
                }`}
            >
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2 mb-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                            <span className="font-bold text-xs text-primary truncate block">{ticketId}</span>
                            {serviceName && (
                                <span className="text-[11px] text-slate-500 truncate block font-medium">{serviceName}</span>
                            )}
                        </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${statusInfo.bg}`}>
                        {statusInfo.label}
                    </span>
                </div>

                {/* Info Donatur & Nominal */}
                {donaturName && (
                    <div className="text-xs text-slate-600 font-medium truncate mb-1">
                        👤 Donatur: <span className="font-semibold text-slate-900">{donaturName}</span>
                    </div>
                )}

                {nominalFormatted ? (
                    <div className="text-sm font-bold text-slate-900 mb-2">
                        {nominalFormatted}
                    </div>
                ) : (
                    <div className="text-xs font-semibold text-slate-800 line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                        {title}
                    </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-1.5 border-t border-slate-100">
                    <span>{dateFormatted}</span>
                    <span className="text-primary font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        Lihat Detail &rarr;
                    </span>
                </div>
            </a>
        );
    };

    // Initial contacts load and context from URL
    useEffect(() => {
        fetchContacts(true);

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

    // When activeChat changes, fetch messages and mark as read
    useEffect(() => {
        setContextOptions([]);
        if (activeChat) {
            fetchMessages(activeChat);
            markAsRead(activeChat);
        }
    }, [activeChat]);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const fetchContacts = async (showLoading = false) => {
        if (showLoading) setLoading(true);
        try {
            const res = await axios.get(`/api/messages/contacts?sender_type=${userModelType === 'App\\Models\\Admin' ? 'admin' : 'user'}`);
            // Force active chat unread count to be 0 to prevent race condition/delay notification bugs
            const active = activeChatRef.current;
            const updatedContacts = res.data.map((c: any) => {
                if (active && String(c.id) === String(active.id) && c.model_type === active.model_type) {
                    return { ...c, unread_count: 0 };
                }
                return c;
            });
            setContacts(updatedContacts);
        } catch (error) {
            console.error(error);
        }
        if (showLoading) setLoading(false);
    };

    const fetchMessages = async (chat: any, silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await axios.get(`/api/messages/${chat.id}?receiver_type=${encodeURIComponent(chat.model_type)}&sender_type=${userModelType === 'App\\Models\\Admin' ? 'admin' : 'user'}`);
            setMessages(res.data);

            // Also reset active chat unread count locally when fetching messages
            setContacts(prev => prev.map(c => {
                if (String(c.id) === String(chat.id) && c.model_type === chat.model_type) {
                    return { ...c, unread_count: 0 };
                }
                return c;
            }));
        } catch (error) {
            console.error(error);
        }
        if (!silent) setLoading(false);
    };

    const markAsRead = async (chat: any) => {
        try {
            await axios.post(`/api/messages/${chat.id}/read`, {
                receiver_type: chat.model_type,
                sender_type: userModelType === 'App\\Models\\Admin' ? 'admin' : 'user'
            });
            // Update contacts state: reset unread_count to 0 for this contact
            setContacts(prev => prev.map(c => {
                if (String(c.id) === String(chat.id) && c.model_type === chat.model_type) {
                    return { ...c, unread_count: 0 };
                }
                return c;
            }));
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    // WebSocket listener via Echo
    useEffect(() => {
        if (!user || !(window as any).Echo) return;

        const channelName = userModelType === 'App\\Models\\Admin'
            ? `App.Models.Admin.${user.id}`
            : `App.Models.User.${user.id}`;

        const channel = (window as any).Echo.private(channelName);

        channel.listen('MessageSent', (e: any) => {
            const msg = e.message;
            const currentActive = activeChatRef.current;

            const isCurrentActiveMsg = currentActive &&
                String(currentActive.id) === String(msg.sender_id) &&
                currentActive.model_type === msg.sender_type;

            if (isCurrentActiveMsg) {
                // Append message to active chat
                setMessages(prev => {
                    if (prev.some(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
                // Auto mark as read
                markAsRead(currentActive);
            } else {
                // Incoming message from non-active contact
                playChimeSound();

                // Find sender name from contacts
                const senderContact = contacts.find(c => String(c.id) === String(msg.sender_id) && c.model_type === msg.sender_type);
                const senderName = senderContact?.name || 'Pesan Baru';
                toast(`💬 ${senderName}: ${msg.body || '[Lampiran]'}`, {
                    duration: 4000,
                    style: {
                        borderRadius: '12px',
                        background: '#333',
                        color: '#fff',
                    },
                });
            }

            // Update contact list sidebar (last_message, last_message_at, unread_count, sort)
            setContacts(prevContacts => {
                const senderKey = `${msg.sender_type}-${msg.sender_id}`;
                let updated = false;

                const newContacts = prevContacts.map(c => {
                    const key = `${c.model_type}-${c.id}`;
                    if (key === senderKey) {
                        updated = true;
                        return {
                            ...c,
                            last_message: msg.body || (msg.attachment_path ? '[Lampiran]' : ''),
                            last_message_at: msg.created_at || new Date().toISOString(),
                            unread_count: isCurrentActiveMsg ? 0 : ((c.unread_count || 0) + 1),
                        };
                    }
                    return c;
                });

                if (!updated) {
                    // Refresh contact list if sender was not in initial list
                    fetchContacts(false);
                    return prevContacts;
                }

                // Sort by last_message_at descending
                return [...newContacts].sort((a, b) => {
                    const timeA = new Date(a.last_message_at || 0).getTime();
                    const timeB = new Date(b.last_message_at || 0).getTime();
                    return timeB - timeA;
                });
            });
        });

        channel.listen('MessagesRead', (e: any) => {
            const currentActive = activeChatRef.current;
            if (currentActive && String(currentActive.id) === String(e.reader_id) && currentActive.model_type === e.reader_type) {
                // The recipient read our sent messages -> turn sent messages to is_read = true!
                setMessages(prev => prev.map(m => ({ ...m, is_read: true })));
            }
        });

        return () => {
            (window as any).Echo.leave(channelName);
        };
    }, [user, userModelType, contacts]);

    // Fallback auto-polling every 6 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchContacts(false);
            if (activeChatRef.current) {
                fetchMessages(activeChatRef.current, true);
            }
        }, 6000);

        return () => clearInterval(interval);
    }, []);

    // Dispatch custom event when contacts list changes (unread counts updated)
    useEffect(() => {
        if (contacts.length > 0 || !loading) {
            const total = contacts.reduce((acc, c) => acc + (c.unread_count || 0), 0);
            window.dispatchEvent(new CustomEvent('messages-read', { detail: { unreadCount: total } }));
        }
    }, [contacts, loading]);

    const handleOpenContextModal = async () => {
        setShowContextModal(true);
        if (contextOptions.length === 0) {
            setLoadingContext(true);
            try {
                let url = `/api/messages/context-options?sender_type=${userModelType === 'App\\Models\\Admin' ? 'admin' : 'user'}`;
                if (activeChat) {
                    url += `&receiver_id=${activeChat.id}&receiver_type=${encodeURIComponent(activeChat.model_type)}`;
                }
                const res = await axios.get(url);
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
            is_read: false,
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

        // Optimistically update contact sidebar for sent message
        setContacts(prev => {
            const activeKey = `${activeChat.model_type}-${activeChat.id}`;
            const updated = prev.map(c => {
                if (`${c.model_type}-${c.id}` === activeKey) {
                    return {
                        ...c,
                        last_message: text || (currentAttachment ? '[Lampiran]' : ''),
                        last_message_at: tempMsg.created_at,
                    };
                }
                return c;
            });
            return [...updated].sort((a, b) => new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime());
        });

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

    const totalUnreadCount = contacts.reduce((acc, c) => acc + (c.unread_count || 0), 0);

    const filteredContacts = contacts
        .filter(c => (c.name || c.username || 'Unknown').toLowerCase().includes(search.toLowerCase()))
        .filter(c => contactFilter === 'all' || (c.unread_count || 0) > 0);

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
                                    <p>{activeChat?.name ? `Tidak ada data tiket untuk ${activeChat.name}.` : 'Tidak ada data ditemukan.'}</p>
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
                                                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                                    <span className="font-bold text-sm text-primary">{ctx.ticket_number || `Tiket #${ctx.id}`}</span>
                                                    {ctx.donatur_name ? (
                                                        <span className="font-semibold text-sm text-slate-800 truncate">- {ctx.donatur_name}</span>
                                                    ) : (
                                                        <span className="font-semibold text-sm text-slate-700 truncate">- {ctx.title}</span>
                                                    )}
                                                </div>
                                                {(ctx.unit_name || ctx.sub_unit_name) && (
                                                    <div className="text-xs text-slate-600 font-medium truncate mb-1">
                                                        {ctx.unit_name && <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[11px] font-semibold mr-1">{ctx.unit_name}</span>}
                                                        {ctx.sub_unit_name && <span className="text-slate-500">{ctx.sub_unit_name}</span>}
                                                    </div>
                                                )}
                                                <div className="text-[11px] text-slate-400">{format(new Date(ctx.created_at), 'dd MMM yyyy HH:mm')}</div>
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
                    <h2 className="font-bold text-xl mb-3">Pesan</h2>
                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Cari kontak..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-100 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>

                    {/* Filter Tabs (Semua & Belum Dibaca) */}
                    <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => setContactFilter('all')}
                            className={`flex-1 py-1.5 px-3 rounded-lg transition-all text-center ${contactFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            Semua
                        </button>
                        <button
                            type="button"
                            onClick={() => setContactFilter('unread')}
                            className={`flex-1 py-1.5 px-3 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${contactFilter === 'unread' ? 'bg-white text-primary shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            <span>Belum Dibaca</span>
                            {totalUnreadCount > 0 && (
                                <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {loading && contacts.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-2 py-10">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <span>Memuat kontak...</span>
                        </div>
                    ) : filteredContacts.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground flex flex-col items-center gap-2 py-10">
                            <Users className="h-8 w-8 text-slate-300" />
                            <p>{contactFilter === 'unread' ? 'Tidak ada pesan belum dibaca.' : 'Tidak ada kontak ditemukan.'}</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1">
                            {filteredContacts.map(contact => {
                                const isActive = activeChat?.id === contact.id && activeChat?.model_type === contact.model_type;
                                const unreadCount = contact.unread_count || 0;
                                return (
                                    <button
                                        key={`${contact.model_type}-${contact.id}`}
                                        onClick={() => setActiveChat(contact)}
                                        className={`flex items-center gap-3 p-3 w-full rounded-xl transition-all text-left ${isActive ? 'bg-primary/10 shadow-xs' : 'hover:bg-slate-100/80'}`}
                                    >
                                        <div className="relative shrink-0">
                                            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                                                {contact.avatar_path ? (
                                                    <img src={`/storage/${contact.avatar_path}`} alt="" className="h-full w-full rounded-full object-cover" />
                                                ) : (
                                                    <span className="font-semibold text-primary text-base">{(contact.name || 'U').charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-baseline justify-between mb-0.5">
                                                <p className={`text-sm truncate ${unreadCount > 0 ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>
                                                    {contact.name}
                                                </p>
                                                <span className={`text-[11px] shrink-0 ml-1.5 ${unreadCount > 0 ? 'font-semibold text-primary' : 'text-slate-400'}`}>
                                                    {formatSidebarTime(contact.last_message_at)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <p className={`text-xs truncate ${unreadCount > 0 ? 'font-medium text-slate-900' : 'text-slate-500'}`}>
                                                    {contact.last_message || 'Belum ada pesan'}
                                                </p>
                                                {unreadCount > 0 && (
                                                    <span className="bg-primary text-primary-foreground font-bold text-[10px] min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center shrink-0 shadow-xs animate-pulse">
                                                        {unreadCount > 99 ? '99+' : unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Area Kanan - Percakapan */}
            <div className={`flex-1 flex-col bg-[#F0F2F5] ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
                {!activeChat ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 p-6 text-center">
                        <div className="h-24 w-24 bg-slate-100 rounded-full flex items-center justify-center mb-4 shadow-xs">
                            <Send className="h-10 w-10 text-slate-300 ml-1" />
                        </div>
                        <p className="font-semibold text-lg text-slate-700">Mulai Percakapan</p>
                        <p className="text-sm text-slate-500 max-w-sm mt-1">Pilih kontak di sebelah kiri untuk melihat percakapan dan berkirim pesan secara real-time.</p>
                    </div>
                ) : (
                    <>
                        {/* Header Chat */}
                        <div className="h-16 px-4 bg-white border-b flex items-center gap-3 shrink-0 shadow-xs z-10">
                            <Button variant="ghost" size="icon" onClick={() => setActiveChat(null)} className="md:hidden shrink-0">
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                                {activeChat.avatar_path ? (
                                    <img src={`/storage/${activeChat.avatar_path}`} alt="" className="h-full w-full rounded-full object-cover" />
                                ) : (
                                    <span className="font-semibold text-primary">{(activeChat.name || 'U').charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-slate-800 truncate text-sm md:text-base">{activeChat.name}</h3>
                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">{activeChat.type}</span>
                                </div>
                            </div>
                            <div className="ml-auto">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`text-slate-500 hover:text-primary ${Notification.permission === 'granted' ? 'text-primary' : ''}`}
                                    onClick={() => {
                                        Notification.requestPermission().then(async (perm) => {
                                            if (perm === 'granted') {
                                                toast.success('Notifikasi desktop diaktifkan!');
                                            } else {
                                                alert('Izin notifikasi ditolak oleh browser.');
                                            }
                                        });
                                    }}
                                    title="Aktifkan Notifikasi Desktop"
                                >
                                    <Bell className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Warning Banner */}
                        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-2.5 shrink-0 z-0">
                            <div className="bg-amber-100 rounded-full p-1 shrink-0">
                                <Info className="h-4 w-4 text-amber-600" />
                            </div>
                            <p className="text-xs text-amber-800 font-medium">
                                Pesan dan lampiran yang lebih dari 7 hari akan dihapus secara otomatis oleh sistem.
                            </p>
                        </div>

                        {/* List Pesan dengan Pemisah Tanggal */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-3">
                            {(() => {
                                let lastDateLabel = '';
                                return messages.map((msg, idx) => {
                                    const isMe = String(msg.sender_id) === String(user.id) && msg.sender_type === userModelType;
                                    const currentDateLabel = getDateLabel(msg.created_at);
                                    const showDateSeparator = currentDateLabel && currentDateLabel !== lastDateLabel;
                                    if (showDateSeparator) {
                                        lastDateLabel = currentDateLabel;
                                    }

                                    return (
                                        <React.Fragment key={msg.id || `msg-${idx}`}>
                                            {showDateSeparator && (
                                                <div className="flex items-center justify-center my-3">
                                                    <span className="bg-white/90 backdrop-blur border border-slate-200 text-slate-600 text-xs font-semibold px-3 py-1 rounded-full shadow-xs tracking-wide">
                                                        {currentDateLabel}
                                                    </span>
                                                </div>
                                            )}
                                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} gap-1 max-w-[85%] md:max-w-[70%] ${isMe ? 'self-end' : 'self-start'}`}>
                                                {msg.context && renderContextCard(msg.context, isMe)}
                                                <div className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm leading-relaxed ${isMe ? 'bg-primary text-primary-foreground rounded-tr-xs' : 'bg-white text-slate-800 rounded-tl-xs'}`}>
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
                                                <div className="flex items-center gap-1.5 mx-2 font-medium">
                                                    <span className="text-[10px] text-slate-500">
                                                        {msg.created_at ? format(new Date(msg.created_at), 'HH:mm') : ''}
                                                    </span>
                                                    {isMe && (
                                                        <span title={msg.is_read ? "Sudah dibaca" : "Terkirim (Belum dibaca)"}>
                                                            <CheckCheck className={`h-3.5 w-3.5 shrink-0 ${msg.is_read ? 'text-sky-500' : 'text-slate-400'}`} />
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    );
                                });
                            })()}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input pesan */}
                        <div className="p-3 md:p-4 bg-white border-t shrink-0 flex flex-col gap-2">
                            {(attachment || selectedContext) && (
                                <div className="flex flex-wrap gap-2">
                                    {selectedContext && (
                                        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 p-2 rounded-lg border border-blue-200 w-max max-w-full">
                                            <Link2 className="h-4 w-4 shrink-0" />
                                            <span className="text-sm font-medium truncate flex-1">
                                                {selectedContext.ticket_number
                                                    ? `${selectedContext.ticket_number}${selectedContext.donatur_name ? ` - ${selectedContext.donatur_name}` : ''}`
                                                    : selectedContext.title}
                                            </span>
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
