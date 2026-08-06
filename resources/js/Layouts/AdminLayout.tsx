import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import {
  LayoutDashboard,
  Ticket,
  Database,
  FileEdit,
  Settings,
  Users,
  Shield,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  User,
  MoreHorizontal,
  Sparkles,
  MessageSquare,
  ChevronsUpDown,
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

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

interface NavSubItem {
  label: string;
  icon?: any;
  route: string;
  permissionGroup?: string;
}

interface NavItem {
  type: 'link' | 'header' | 'dropdown';
  label: string;
  icon?: any;
  route?: string;
  permissionGroup?: string;
  children?: NavSubItem[];
}

function isRouteActive(url: string, routePath?: string): boolean {
  if (!routePath) return false;
  const pathOnly = url.split('?')[0].split('#')[0];
  return pathOnly === routePath || pathOnly.startsWith(routePath + '/');
}

const adminNavItems: NavItem[] = [
  { type: 'link', label: 'Dashboard', icon: LayoutDashboard, route: '/admin/dashboard' },
  { type: 'link', label: 'Verifikasi Data', icon: Ticket, route: '/admin/verifikasi-data' },
  { type: 'link', label: 'Pesan', icon: MessageSquare, route: '/admin/pesan' },

  { type: 'header', label: 'PENGATURAN', permissionGroup: 'akses-konfigurasi' },
  {
    type: 'dropdown',
    label: 'Sistem',
    icon: Settings,
    permissionGroup: 'akses-konfigurasi',
    children: [
      { label: 'Form Builder', icon: FileEdit, route: '/admin/peraturan-form', permissionGroup: 'akses-konfigurasi' },
      { label: 'Konfigurasi Sistem', icon: Settings, route: '/admin/konfigurasi', permissionGroup: 'akses-konfigurasi' },
    ]
  },

  { type: 'header', label: 'LAPORAN', permissionGroup: 'akses-laporan' },
  { type: 'link', label: 'Semua Data', icon: Database, route: '/admin/laporan/data', permissionGroup: 'akses-laporan' },

  { type: 'header', label: 'PENGGUNA & AKSES', permissionGroup: 'akses-manajemen-akun' },
  { type: 'link', label: 'Hak Akses', icon: Shield, route: '/admin/manajemen-peran', permissionGroup: 'akses-manajemen-akun' },
  { type: 'link', label: 'Verifikator', icon: Shield, route: '/admin/manajemen-operator', permissionGroup: 'akses-manajemen-akun' },
  { type: 'link', label: 'Pengguna', icon: Users, route: '/admin/manajemen-user', permissionGroup: 'akses-manajemen-akun' },

  { type: 'header', label: 'DONASI & DONATUR' },
  { type: 'link', label: 'Data Donatur', icon: Users, route: '/admin/donatur' },

  { type: 'header', label: 'MASTER DATA' },
  {
    type: 'dropdown',
    label: 'Struktur',
    icon: Users,
    permissionGroup: 'akses-struktur',
    children: [
      { label: 'Wilayah', icon: Users, route: '/admin/master/divisi', permissionGroup: 'akses-struktur' },
      { label: 'Cabang', icon: Users, route: '/admin/master/unit-organisasi', permissionGroup: 'akses-struktur' },
      { label: 'Jabatan', icon: Users, route: '/admin/master/jabatan', permissionGroup: 'akses-struktur' },
    ]
  },
  {
    type: 'dropdown',
    label: 'Kategori Data',
    icon: Database,
    permissionGroup: 'akses-layanan',
    children: [
      { label: 'Kategori', icon: Database, route: '/admin/master/unit', permissionGroup: 'akses-layanan' },
      { label: 'Jenis Data', icon: Database, route: '/admin/master/sub-unit', permissionGroup: 'akses-layanan' },
      { label: 'Metode Pembayaran', icon: Database, route: '/admin/master/metode-pembayaran', permissionGroup: 'akses-layanan' },
      { label: 'Campaign/Program', icon: Database, route: '/admin/master/campaigns', permissionGroup: 'akses-layanan' },
      { label: 'Akad', icon: Database, route: '/admin/master/akad', permissionGroup: 'akses-layanan' },
    ]
  },
];

/* ─── Premium NavLink with sliding active pill ─── */
function NavLink({ item, active, isCollapsed }: { item: NavItem; active: boolean; isCollapsed: boolean }) {
  const Icon = item.icon;

  return (
    <motion.div
      whileHover={{ x: isCollapsed ? 0 : 3 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <Link
        href={item.route!}
        title={isCollapsed ? item.label : undefined}
        className={`group relative flex items-center justify-center transition-all duration-200 ${isCollapsed
          ? 'h-10 w-10 rounded-xl mx-auto'
          : 'gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium w-full'
        } ${active
          ? 'text-primary font-semibold'
          : 'text-muted-foreground hover:text-slate-900'
        }`}
      >
        {/* Active Indicator Pill */}
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-primary/[0.08] rounded-xl z-0 border border-primary/20 shadow-[0_0_12px_-3px_rgba(15,123,70,0.15)]"
            transition={{ duration: 0.15 }}
          />
        )}

        <div className={`relative z-10 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 w-full'}`}>
          <motion.div
            animate={active ? { scale: 1.12 } : { scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          >
            <Icon className={`h-4 w-4 shrink-0 transition-colors duration-200 ${active ? 'text-primary' : 'group-hover:text-slate-700'}`} />
          </motion.div>
          {!isCollapsed && <span className="truncate">{item.label}</span>}
        </div>
      </Link>
    </motion.div>
  );
}

/* ─── Premium NavDropdown with animated sub-menu ─── */
function NavDropdown({ item, isCollapsed, url, permissions, auth }: { item: NavItem; isCollapsed: boolean; url: string; permissions?: string[]; auth?: any }) {
  const visibleChildren = item.children?.filter(child =>
    !child.permissionGroup || auth?.is_superadmin || (permissions && permissions.includes(child.permissionGroup))
  ) || [];

  if (visibleChildren.length === 0) return null;

  const isChildActive = visibleChildren.some(child => isRouteActive(url, child.route));
  const [isOpen, setIsOpen] = useState(isChildActive);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isChildActive) {
      setIsOpen(true);
    }
  }, [url]);

  useEffect(() => {
    if (!popoverOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [popoverOpen]);

  const Icon = item.icon;

  /* ── Collapsed: Popover dropdown ── */
  if (isCollapsed) {
    return (
      <div className="relative flex justify-center w-full">
        <DropdownMenu open={popoverOpen} onOpenChange={setPopoverOpen}>
          <DropdownMenuTrigger
            aria-label={item.label}
            className={`group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 cursor-pointer outline-none ${isChildActive || popoverOpen
              ? 'text-primary font-semibold'
              : 'text-muted-foreground hover:text-slate-900'
            }`}
          >
            {(isChildActive || popoverOpen) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-primary/[0.08] rounded-xl z-0 border border-primary/20 shadow-[0_0_12px_-3px_rgba(15,123,70,0.15)]"
                transition={{ duration: 0.15 }}
              />
            )}
            <div className="relative z-10 flex items-center justify-center">
              <Icon className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isChildActive || popoverOpen ? 'scale-110 text-primary' : 'group-hover:scale-110'}`} />
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent side="right" align="start" sideOffset={10} className="w-52 p-1.5 z-[100] shadow-xl border bg-popover">
            <div className="text-xs font-bold text-primary px-2.5 py-1.5 border-b mb-1 flex items-center gap-2">
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </div>
            <div className="space-y-0.5">
              {visibleChildren.map((child, idx) => {
                const active = isRouteActive(url, child.route);
                const ChildIcon = child.icon || Icon;
                return (
                  <Link
                    key={idx}
                    href={child.route}
                    onClick={() => setPopoverOpen(false)}
                    className={`flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg cursor-pointer transition-colors w-full outline-none ${active
                      ? 'bg-primary/[0.08] text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <ChildIcon className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-primary' : ''}`} />
                    <span className="truncate">{child.label}</span>
                  </Link>
                );
              })}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  /* ── Expanded: Collapsible sub-menu ── */
  return (
    <div className="flex flex-col gap-0.5">
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        whileHover={{ x: 3 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium w-full transition-colors duration-150 ${isChildActive
          ? 'text-primary font-semibold'
          : 'text-muted-foreground hover:text-slate-900'
        }`}
      >
        {isChildActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-primary/[0.06] rounded-xl z-0 border border-primary/15"
            transition={{ duration: 0.15 }}
          />
        )}
        <div className="relative z-10 flex items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-3 min-w-0">
            <motion.div
              animate={isChildActive ? { scale: 1.12 } : { scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            >
              <Icon className={`h-4 w-4 shrink-0 transition-colors duration-200 ${isChildActive ? 'text-primary' : 'group-hover:text-slate-700'}`} />
            </motion.div>
            <span className="truncate">{item.label}</span>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          >
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground/60" />
          </motion.div>
        </div>
      </motion.button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-0.5 ml-4 pl-3 border-l-2 border-primary/10 py-1">
              {visibleChildren.map((child, idx) => {
                const active = isRouteActive(url, child.route);
                const ChildIcon = child.icon;
                return (
                  <div key={idx}>
                    <Link
                      href={child.route}
                      className={`relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors duration-150 ${active
                        ? 'text-primary font-semibold'
                        : 'text-muted-foreground hover:text-slate-900'
                      }`}
                    >
                      {active && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute inset-0 bg-primary/[0.07] rounded-lg z-0 border border-primary/15"
                          transition={{ duration: 0.15 }}
                        />
                      )}
                      <div className="relative z-10 flex items-center gap-2.5 w-full">
                        {ChildIcon ? (
                          <motion.div
                            animate={active ? { scale: 1.1 } : { scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                          >
                            <ChildIcon className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-primary' : ''}`} />
                          </motion.div>
                        ) : (
                          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${active ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                        )}
                        <span className="truncate">{child.label}</span>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const { auth, flash, appConfig } = usePage<any>().props;
  const admin = auth.admin || auth.user;
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { subscribe } = useWebPush(admin);
  const sidebarScrollRef = useRef<HTMLDivElement>(null);

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
      return localStorage.getItem('admin_sidebar_collapsed') === 'true';
    }
    return false;
  });

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_sidebar_collapsed', String(nextState));
    }
  };

  /* ── Scroll Preservation: save on scroll, restore on page load ── */
  const url = usePage().url;

  useEffect(() => {
    const el = sidebarScrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      sessionStorage.setItem('admin_sidebar_scroll', String(el.scrollTop));
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [isCollapsed]); // re-attach when collapse state changes

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_sidebar_scroll');
    if (saved && sidebarScrollRef.current) {
      requestAnimationFrame(() => {
        if (sidebarScrollRef.current) {
          sidebarScrollRef.current.scrollTop = parseInt(saved, 10);
        }
      });
    }
  }, [url]);

  useEffect(() => {
    if (flash?.success) {
      toast.success(flash.success);
    }
    if (flash?.error) {
      toast.error(flash.error);
    }
  }, [flash]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && admin) {
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

      const channel = admin.hasOwnProperty('username') && !admin.hasOwnProperty('divisi_id')
        ? `App.Models.Admin.${admin.id}`
        : `App.Models.User.${admin.id}`;

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
  }, [flash, admin]);

  const isActive = (routePath: string) => isRouteActive(url, routePath);

  const systemName = appConfig?.nama_sistem || 'Fundata';
  const faviconUrl = appConfig?.favicon_path ? `/storage/${appConfig.favicon_path}` : '/favicon.ico';
  const logoUrl = appConfig?.logo_path ? `/storage/${appConfig.logo_path}` : null;

  const renderSidebar = (collapsed: boolean, isDesktop: boolean) => (
    <div className="flex h-full min-h-0 flex-col justify-between">
      {/* ── Header / Brand Logo ── */}
      <div className={`flex h-14 shrink-0 items-center border-b border-slate-200/60 px-4 lg:h-[60px] transition-all duration-300 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        <Link href="/admin/dashboard" className="flex items-center gap-2.5 min-w-0">
          <AnimatePresence mode="wait">
            {collapsed ? (
              <motion.div
                key="collapsed-logo"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                whileHover={{ scale: 1.08 }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-1.5 ring-1 ring-primary/20 shadow-sm"
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
              <motion.div
                key="expanded-logo"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="flex items-center gap-2.5 min-w-0"
              >
                {logoUrl ? (
                  <img id="displayBannerImg" src={logoUrl} alt="Banner Logo" className="h-12 lg:h-14 max-w-[290px] w-auto object-contain object-left transition-all" />
                ) : (
                  <>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-600 shadow-md shadow-primary/25">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold tracking-tight text-foreground truncate">{systemName}</span>
                      <span className="text-[10px] text-muted-foreground/60 truncate">Management System</span>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* ── Navigation Items ── */}
      <div
        ref={isDesktop ? sidebarScrollRef : undefined}
        className="flex-1 min-h-0 overflow-y-auto py-4 px-2 sidebar-scroll"
      >
        <nav className={`flex flex-col gap-0.5 pb-6 ${collapsed ? 'items-center' : ''}`}>
          {adminNavItems.map((item, index) => {
            if (!auth.is_superadmin && item.permissionGroup && auth.permissions && !auth.permissions.includes(item.permissionGroup)) {
              return null;
            }

            if (item.type === 'header') {
              if (collapsed) {
                return (
                  <div key={index} className="my-2.5 border-t border-border/50 w-6 mx-auto" />
                );
              }
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02, duration: 0.3 }}
                  className="px-3.5 pt-5 pb-1.5"
                >
                  <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.14em]">
                    {item.label}
                  </p>
                </motion.div>
              );
            }

            if (item.type === 'dropdown') {
              return (
                <NavDropdown
                  key={index}
                  item={item}
                  isCollapsed={collapsed}
                  url={url}
                  permissions={auth.permissions}
                  auth={auth}
                />
              );
            }

            return (
              <NavLink
                key={index}
                item={item}
                active={isActive(item.route!)}
                isCollapsed={collapsed}
              />
            );
          })}
        </nav>
      </div>

      {/* ── Footer Profile Box ── */}
      <div className="border-t border-slate-200/60 p-2.5">
        {collapsed ? (
          <div className="flex justify-center">
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setProfileOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden outline-none ring-1 ring-slate-200/80 shadow-sm"
              title={admin?.name || admin?.username}
            >
              {admin?.avatar_path ? (
                <img src={`/storage/${admin.avatar_path}`} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <User className="h-4 w-4 text-slate-500" />
              )}
            </motion.button>
          </div>
        ) : (
          <motion.div
            whileHover={{ backgroundColor: 'rgba(241, 245, 249, 0.8)' }}
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-2.5 rounded-xl p-2.5 transition-all cursor-pointer"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden ring-1 ring-slate-200/80 shadow-sm">
              {admin?.avatar_path ? (
                <img src={`/storage/${admin.avatar_path}`} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <User className="h-4 w-4 text-slate-500" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground truncate">{admin?.name || admin?.username || 'Admin'}</p>
              <p className="text-[10px] text-muted-foreground/70 truncate">{admin?.email || ''}</p>
            </div>
            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
          </motion.div>
        )}
      </div>
    </div>
  );

  const bottomNavItems: BottomNavItem[] = [
    { label: 'Dashboard', icon: LayoutDashboard, route: '/admin/dashboard' },
    { label: 'Verifikasi', icon: Ticket, route: '/admin/verifikasi-data' },
    { label: 'Pesan', icon: MessageSquare, route: '/admin/pesan' },
    { label: 'Lainnya', icon: MoreHorizontal, onClick: () => setSidebarOpen(true) },
  ];

  return (
    <div className={`grid h-screen w-full overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'md:grid-cols-[72px_1fr]' : 'md:grid-cols-[250px_1fr]'}`}>
      <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
      {title && <Head title={title} />}

      {/* Mobile Sheet Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="flex flex-col p-0 w-72">
          {renderSidebar(false, false)}
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="relative hidden border-r border-slate-200/60 bg-white md:flex flex-col h-full max-h-screen overflow-visible transition-all duration-300 ease-in-out">
        {renderSidebar(isCollapsed, true)}

        {/* Floating Collapse/Expand Toggle */}
        <motion.div
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          className="absolute -right-3.5 top-5 z-30 hidden md:flex"
        >
          <Button
            variant="outline"
            size="icon"
            onClick={toggleCollapse}
            className="h-7 w-7 rounded-full border bg-background shadow-md hover:bg-accent text-foreground hover:shadow-lg transition-shadow"
            title={isCollapsed ? "Buka Sidebar" : "Tutup Sidebar"}
          >
            <motion.div
              animate={{ rotate: isCollapsed ? 0 : 180 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            >
              <ChevronRight className="h-3.5 w-3.5 text-primary" />
            </motion.div>
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
                  {admin?.avatar_path ? (
                    <img src={`/storage/${admin.avatar_path}`} alt="Avatar" className="h-full w-full object-cover" />
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
                    <span className="text-sm font-medium">{admin?.name || admin?.username || 'Admin'}</span>
                    <span className="text-xs font-normal text-muted-foreground">{admin?.email || ''}</span>
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
          user={admin}
          isAdmin={true}
        />
      )}
    </div>
  );
}
