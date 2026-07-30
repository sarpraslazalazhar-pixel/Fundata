import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import toast, { Toaster } from 'react-hot-toast';
import { 
 LayoutDashboard, 
 PlusCircle, 
 History, 
 LogOut,
 User,
 ChevronLeft,
 ChevronRight,
 MoreHorizontal,
 Sparkles
} from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Sheet, SheetContent } from '@/Components/ui/sheet';
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuGroup,
 DropdownMenuItem,
 DropdownMenuLabel,
 DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import {
 Tooltip,
 TooltipContent,
 TooltipTrigger
} from "@/Components/ui/tooltip";

import ProfileModal from '@/Components/ProfileModal';
import { BottomNav } from '@/Components/BottomNav';
import type { BottomNavItem } from '@/Components/BottomNav';
import { useIdleTimer } from '@/hooks/useIdleTimer';
import { useWebPush } from '@/hooks/useWebPush';
import { useNotificationSound } from '@/hooks/useNotificationSound';

interface UserLayoutProps {
 children: React.ReactNode;
 title?: string;
}

interface NavItem {
 label: string;
 icon: any;
 route: string;
}

const userNavItems: NavItem[] = [
 { label: 'Dashboard', icon: LayoutDashboard, route: '/dashboard' },
 { label: 'Input Data', icon: PlusCircle, route: '/data/buat' },
 { label: 'Data Saya', icon: History, route: '/data/saya' },
];

function NavLink({ item, active, isCollapsed }: { item: NavItem; active: boolean; isCollapsed: boolean }) {
 const Icon = item.icon;
 return (
 <Link
 href={item.route}
 title={isCollapsed ? item.label : undefined}
 className={`group relative flex items-center transition-all duration-200 ${isCollapsed
 ? 'h-10 w-10 justify-center rounded-xl mx-auto'
 : 'gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium w-full'
 } ${active
 ? 'bg-slate-100/80 text-slate-900 font-semibold shadow-sm'
 : 'text-muted-foreground hover:bg-slate-50 hover:text-slate-900'
 }`}
 >
 <Icon className={`h-4 w-4 shrink-0 transition-transform duration-200 ${active ? 'scale-110 text-slate-900' : 'group-hover:scale-110'}`} />
 {!isCollapsed && <span className="truncate">{item.label}</span>}
 </Link>
 );
}

export default function UserLayout({ children, title }: UserLayoutProps) {
 const { auth, flash, appConfig } = usePage<any>().props;
 const user = auth.user;
 const [profileOpen, setProfileOpen] = useState(false);
 const [sidebarOpen, setSidebarOpen] = useState(false);
 const { subscribe } = useWebPush(user);

 // Sound URL (Optional, but added for consistency)
 const soundUrl = appConfig?.notification_sound_path
   ? `/system/notification-sound?v=${encodeURIComponent(appConfig.notification_sound_path)}`
   : '/sounds/ting-ting-ting.wav';

 const { isMuted, play } = useNotificationSound({ soundUrl });
 const isMutedRef = useRef(isMuted);

 useEffect(() => {
   isMutedRef.current = isMuted;
 }, [isMuted]);

 const playNotificationSound = useCallback(() => {
   if (!isMutedRef.current) {
       play();
   }
 }, [play]);

 // Collapsed sidebar state
 const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
 if (typeof window !== 'undefined') {
 return localStorage.getItem('user_sidebar_collapsed') === 'true';
 }
 return false;
 });

 const toggleCollapse = () => {
 setIsCollapsed(prev => {
 const next = !prev;
 if (typeof window !== 'undefined') {
 localStorage.setItem('user_sidebar_collapsed', String(next));
 }
 return next;
 });
 };

 useIdleTimer('/logout');

 useEffect(() => {
 if (flash?.success) toast.success(flash.success, { id: 'flash-success' });
 if (flash?.error) toast.error(flash.error, { id: 'flash-error' });
 if (flash?.message) toast(flash.message, { id: 'flash-message' });

 // Listen for Echo notifications
 if (window.Echo && user) {
 const lastAskedStr = localStorage.getItem('notif_last_asked');
 const lastAsked = lastAskedStr ? parseInt(lastAskedStr, 10) : 0;
 const now = Date.now();
 const oneDay = 24 * 60 * 60 * 1000;
 const shouldAsk = (now - lastAsked) > oneDay;

 if ('Notification' in window && Notification.permission === 'default' && shouldAsk) {
 toast((t) => (
 <div className="flex flex-col gap-2">
 <span className="text-sm font-medium">Aktifkan Notifikasi Browser</span>
 <span className="text-xs text-muted-foreground">Terima pemberitahuan saat status tiket Anda diperbarui.</span>
 <div className="flex gap-2 justify-end mt-1">
 <Button size="sm" variant="outline" onClick={() => {
 localStorage.setItem('notif_last_asked', Date.now().toString());
 toast.dismiss(t.id);
 }}>Nanti</Button>
 <Button size="sm" onClick={() => {
 localStorage.setItem('notif_last_asked', Date.now().toString());
 toast.dismiss(t.id);
 Notification.requestPermission().then((permission) => {
 if (permission === 'granted') {
 subscribe();
 toast.success('Notifikasi diaktifkan!');
 }
 });
 }}>Aktifkan</Button>
 </div>
 </div>
 ), { duration: Infinity, id: 'notif-request', position: 'bottom-right' });
 }

 const channel = `App.Models.User.${user.id}`;
 
 window.Echo.private(channel)
 .notification((notification: any) => {
 playNotificationSound();
 if ('Notification' in window && Notification.permission === 'granted') {
 new Notification(notification.title || 'Pemberitahuan Baru', {
 body: notification.message || '',
 });
 }
 toast.success(notification.title || 'Pemberitahuan Baru', { id: `notif-${Date.now()}`});
 });
 
 return () => {
 window.Echo.leave(channel);
 };
 }
 }, [flash, user]);
 
 const url = usePage().url;
 const systemName = appConfig?.nama_sistem || 'Fundata';
 const faviconUrl = appConfig?.favicon_path ? `/storage/${appConfig.favicon_path}` : '/favicon.ico';
 const logoUrl = appConfig?.logo_path ? `/storage/${appConfig.logo_path}` : null;

 const renderSidebar = (collapsed: boolean) => (
 <div className="flex h-full min-h-0 flex-col justify-between">
 {/* Header / Brand Logo */}
 <div className={`flex h-14 shrink-0 items-center border-b border-slate-200/60 px-4 lg:h-[60px] transition-all duration-300 ${collapsed ? 'justify-center' : 'justify-between'
 }`}>
 <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
 {collapsed ? (
 <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100/80 p-1.5 transition-all hover:scale-105 shadow-sm">
 <img
 src={faviconUrl}
 alt="Favicon"
 className="h-full w-full object-contain"
 onError={(e) => {
 (e.target as HTMLElement).style.display = 'none';
 }}
 />
 </div>
 ) : (
 logoUrl ? (
 <img id="displayBannerImg" src={logoUrl} alt="Banner Logo" className="h-10 max-w-[180px] object-contain transition-all" />
 ) : (
 <div className="flex items-center gap-2">
 <Sparkles className="h-5 w-5 text-slate-900" />
 <span className="text-base font-bold tracking-tight text-foreground">{systemName}</span>
 </div>
 )
 )}
 </Link>
 </div>

 {/* Navigation Items */}
 <div className="flex-1 min-h-0 overflow-y-auto py-4 px-2.5 sidebar-scroll">
 <nav className="flex flex-col gap-1 pb-6">
 {userNavItems.map((item) => (
 <NavLink
 key={item.route}
 item={item}
 active={url.startsWith(item.route) && item.route !== '#'}
 isCollapsed={collapsed}
 />
 ))}
 </nav>
 </div>

 {/* Footer User Info */}
 <div className="shrink-0 border-t border-slate-200/60 p-2.5 bg-background">
 {collapsed ? (
 <Tooltip>
 <TooltipTrigger className="mx-auto">
 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer border border-slate-200 shadow-sm transition-all" onClick={() => setProfileOpen(true)}>
 {user?.avatar_path ? (
 <img src={`/storage/${user.avatar_path}`} alt="Avatar" className="h-full w-full rounded-xl object-cover" />
 ) : (
 <User className="h-4 w-4 text-slate-600 " />
 )}
 </div>
 </TooltipTrigger>
 <TooltipContent side="right" className="flex flex-col gap-0.5 text-xs bg-zinc-900 text-white ">
 <span className="font-semibold">{user?.name || user?.username || 'User'}</span>
 <span className="text-[10px] text-zinc-400 ">{user?.email || ''}</span>
 </TooltipContent>
 </Tooltip>
 ) : (
 <div className="rounded-xl bg-slate-50/50 hover:bg-slate-50 border border-slate-200/60 p-2.5 transition-colors cursor-pointer" onClick={() => setProfileOpen(true)}>
 <div className="flex items-center gap-2.5">
 <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 overflow-hidden">
 {user?.avatar_path ? (
 <img src={`/storage/${user.avatar_path}`} alt="Avatar" className="h-full w-full object-cover" />
 ) : (
 <User className="h-4 w-4 text-slate-600 " />
 )}
 </div>
 <div className="min-w-0">
 <p className="text-xs font-semibold text-foreground truncate">{user?.name || user?.username || 'User'}</p>
 <p className="text-[10px] text-muted-foreground truncate">{user?.email || ''}</p>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 );

 const bottomNavItems: BottomNavItem[] = [
 { label: 'Dashboard', icon: LayoutDashboard, route: '/dashboard' },
 { label: 'Input Data', icon: PlusCircle, route: '/data/buat' },
 { label: 'Data Saya', icon: History, route: '/data/saya' },
 { label: 'Lainnya', icon: MoreHorizontal, onClick: () => setSidebarOpen(true) },
 ];

 return (
 <div className={`grid h-screen w-full overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'md:grid-cols-[72px_1fr]' : 'md:grid-cols-[250px_1fr]'}`}>
 <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
 {title && <Head title={title} />}
 
 {/* Mobile Sheet Sidebar */}
 <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
 <SheetContent side="left" className="flex flex-col p-0 w-72">
 {renderSidebar(false)}
 </SheetContent>
 </Sheet>

 {/* Desktop Sidebar (Collapsible) */}
 <div className="relative hidden border-r border-slate-200/60 bg-white md:flex flex-col h-full max-h-screen overflow-visible transition-all duration-300 ease-in-out">
 {renderSidebar(isCollapsed)}

 {/* Floating Collapse/Expand Toggle Button */}
 <Button
 variant="outline"
 size="icon"
 onClick={toggleCollapse}
 className="absolute -right-3.5 top-5 z-30 hidden md:flex h-7 w-7 rounded-full border bg-background shadow-md hover:bg-accent text-foreground transition-transform hover:scale-110"
 title={isCollapsed ? "Buka Sidebar" : "Tutup Sidebar"}
 >
 {isCollapsed ? (
 <ChevronRight className="h-3.5 w-3.5 text-slate-900" />
 ) : (
 <ChevronLeft className="h-3.5 w-3.5 text-slate-900" />
 )}
 </Button>
 </div>
 
 {/* Main Content Area */}
 <div className="flex flex-col min-w-0 overflow-hidden bg-slate-50/40 ">
 <header className="relative z-40 flex h-14 shrink-0 items-center gap-3 border-b border-slate-200/60 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 px-4 lg:h-[60px] lg:px-6 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
 <div className="flex-1" />
 
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 border overflow-hidden">
 {user?.avatar_path ? (
 <img src={`/storage/${user.avatar_path}`} alt="Avatar" className="h-full w-full object-cover" />
 ) : (
 <User className="h-4 w-4 text-slate-600" />
 )}
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="w-56">
 <DropdownMenuGroup>
 <DropdownMenuLabel>
 <div className="flex flex-col gap-0.5">
 <span className="text-sm font-medium">{user?.name || user?.username || 'User'}</span>
 <span className="text-xs font-normal text-muted-foreground">{user?.email || ''}</span>
 </div>
 </DropdownMenuLabel>
 </DropdownMenuGroup>
 <div className="border-t my-1 border-slate-200/60" />
 <DropdownMenuItem onClick={() => setProfileOpen(true)} className="cursor-pointer">
 <User className="h-4 w-4 mr-2 text-slate-600" />
 Ubah Profil
 </DropdownMenuItem>
 <DropdownMenuItem className="p-0">
 <Link href="/logout" method="post" as="button" className="flex w-full cursor-pointer items-center gap-2 px-2 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50 rounded-md">
 <LogOut className="h-4 w-4" />
 Keluar
 </Link>
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>

 <ProfileModal open={profileOpen} onOpenChange={setProfileOpen} user={user} isAdmin={false} />
 </header>
 <main className="flex-1 overflow-y-auto">
 <div key={url} className="animate-page-in mx-auto w-full max-w-7xl p-4 lg:p-6 xl:p-8 pb-[calc(64px+env(safe-area-inset-bottom,16px))] md:pb-0">
 {children}
 </div>
 </main>
 </div>

 <BottomNav items={bottomNavItems} />
 </div>
 );
}
