import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
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
  Sparkles,
  MessageSquare
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

import NotificationBell from '@/Components/NotificationBell';
import ProfileModal from '@/Components/ProfileModal';
import { BottomNav } from '@/Components/BottomNav';
import type { BottomNavItem } from '@/Components/BottomNav';
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
  { label: 'Pesan', icon: MessageSquare, route: '/pesan' },
  { label: 'Data Saya', icon: History, route: '/data/saya' },
];

function isRouteActive(url: string, routePath?: string): boolean {
  if (!routePath) return false;
  const pathOnly = url.split('?')[0].split('#')[0];
  return pathOnly === routePath || pathOnly.startsWith(routePath + '/');
}

function NavLink({ item, active, isCollapsed }: { item: NavItem; active: boolean; isCollapsed: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.route}
      title={isCollapsed ? item.label : undefined}
      className={`group relative flex items-center justify-center ${isCollapsed
        ? 'h-10 w-10 rounded-xl mx-auto'
        : 'gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium w-full'
      } ${active
        ? 'text-slate-900 font-semibold'
        : 'text-muted-foreground hover:text-slate-900'
      }`}
    >
      {/* Animated Active Sliding Indicator Pill */}
      {active && (
        <motion.div
          layoutId="user-active-nav-pill"
          className="absolute inset-0 bg-slate-100/90 rounded-xl z-0 border border-slate-200/50 shadow-xs"
          transition={{ type: 'spring', stiffness: 450, damping: 32 }}
        />
      )}

      <div className={`relative z-10 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 w-full'}`}>
        <Icon className={`h-4 w-4 shrink-0 transition-transform duration-200 ${active ? 'scale-110 text-slate-900' : 'group-hover:scale-110'}`} />
        {!isCollapsed && <span className="truncate">{item.label}</span>}
      </div>
    </Link>
  );
}

export default function UserLayout({ children, title }: UserLayoutProps) {
  const { auth, flash, appConfig } = usePage<any>().props;
  const user = auth.user;
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { subscribe } = useWebPush(user);

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

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('user_sidebar_collapsed') === 'true';
    }
    return false;
  });

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_sidebar_collapsed', String(nextState));
    }
  };

  useEffect(() => {
    if (flash?.success) {
      toast.success(flash.success);
    }
    if (flash?.error) {
      toast.error(flash.error);
    }
  }, [flash]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && user) {
      const permission = Notification.permission;
      const lastAsked = localStorage.getItem('notif_last_asked');
      const now = Date.now();
      const oneWeek = 7 * 24 * 60 * 60 * 1000;

      if (permission === 'default' && (!lastAsked || now - parseInt(lastAsked, 10) > oneWeek)) {
        toast((t) => (
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-sm">Aktifkan Notifikasi Realtime?</span>
            <span className="text-xs text-muted-foreground">Dapatkan pemberitahuan tiket baru langsung di browser Anda.</span>
            <div className="flex gap-2 justify-end mt-1">
              <Button size="sm" variant="ghost" onClick={() => {
                localStorage.setItem('notif_last_asked', Date.now().toString());
                toast.dismiss(t.id);
              }}>Nanti</Button>
              <Button size="sm" onClick={() => {
                localStorage.setItem('notif_last_asked', Date.now().toString());
                toast.dismiss(t.id);
                Notification.requestPermission().then((perm) => {
                  if (perm === 'granted') {
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
          toast.success(notification.title || 'Pemberitahuan Baru', { id: `notif-${Date.now()}` });
        });

      return () => {
        window.Echo.leave(channel);
      };
    }
  }, [flash, user]);

  const url = usePage().url;
  const isActive = (routePath: string) => isRouteActive(url, routePath);

  const systemName = appConfig?.nama_sistem || 'Fundata';
  const faviconUrl = appConfig?.favicon_path ? `/storage/${appConfig.favicon_path}` : '/favicon.ico';
  const logoUrl = appConfig?.logo_path ? `/storage/${appConfig.logo_path}` : null;

  const renderSidebar = (collapsed: boolean) => (
    <div className="flex h-full min-h-0 flex-col justify-between">
      {/* Header / Brand Logo */}
      <div className={`flex h-14 shrink-0 items-center border-b px-4 lg:h-[60px] transition-all duration-300 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
          {collapsed ? (
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100/80 p-1.5 shadow-xs"
            >
              <img
                src={faviconUrl}
                alt="Favicon"
                className="h-full w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </motion.div>
          ) : (
            logoUrl ? (
              <img id="displayBannerImg" src={logoUrl} alt="Banner Logo" className="h-10 max-w-[180px] object-contain transition-all" />
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="text-base font-bold tracking-tight text-foreground">{systemName}</span>
              </div>
            )
          )}
        </Link>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 min-h-0 overflow-y-auto py-4 px-2 sidebar-scroll">
        <nav className={`flex flex-col gap-1 pb-6 ${collapsed ? 'items-center' : ''}`}>
          {userNavItems.map((item, index) => (
            <NavLink
              key={index}
              item={item}
              active={isActive(item.route)}
              isCollapsed={collapsed}
            />
          ))}
        </nav>
      </div>

      {/* Footer Profile Box */}
      <div className="border-t border-border/60 p-2.5">
        {collapsed ? (
          <div className="flex justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setProfileOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 overflow-hidden outline-none border border-slate-200/60"
              title={user?.name || user?.username}
            >
              {user?.avatar_path ? (
                <img src={`/storage/${user.avatar_path}`} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <User className="h-4 w-4 text-slate-600" />
              )}
            </motion.button>
          </div>
        ) : (
          <div
            onClick={() => setProfileOpen(true)}
            className="flex items-center justify-between gap-2.5 rounded-xl p-2 transition-all hover:bg-slate-100/80 cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 overflow-hidden">
                {user?.avatar_path ? (
                  <img src={`/storage/${user.avatar_path}`} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-4 w-4 text-slate-600" />
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
    { label: 'Pesan', icon: MessageSquare, route: '/pesan' },
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
        <motion.div
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          className="absolute -right-3.5 top-5 z-30 hidden md:flex"
        >
          <Button
            variant="outline"
            size="icon"
            onClick={toggleCollapse}
            className="h-7 w-7 rounded-full border bg-background shadow-md hover:bg-accent text-foreground"
            title={isCollapsed ? "Buka Sidebar" : "Tutup Sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5 text-primary" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5 text-primary" />
            )}
          </Button>
        </motion.div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col min-w-0 overflow-hidden bg-slate-50/40">
        <header className="relative z-40 flex h-14 shrink-0 items-center gap-3 border-b border-slate-200/60 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 px-4 lg:h-[60px] lg:px-6 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
          <div className="flex-1" />

          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 border overflow-hidden">
                  {user?.avatar_path ? (
                    <img src={`/storage/${user.avatar_path}`} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </Button>
              </motion.div>
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
              <div className="border-t my-1" />
              <DropdownMenuItem onClick={() => setProfileOpen(true)} className="cursor-pointer">
                <User className="h-4 w-4 mr-2" />
                Ubah Profil
              </DropdownMenuItem>
              <DropdownMenuItem className="p-0">
                <Link href="/logout" method="post" as="button" className="flex items-center w-full px-2 py-1.5 text-sm text-red-600 hover:text-red-700">
                  <LogOut className="h-4 w-4 mr-2" />
                  Keluar
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page Body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 mb-16 md:mb-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav items={bottomNavItems} />

      {/* Profile Modal */}
      {profileOpen && (
        <ProfileModal
          open={profileOpen}
          onOpenChange={setProfileOpen}
          user={user}
          isAdmin={false}
        />
      )}
    </div>
  );
}
