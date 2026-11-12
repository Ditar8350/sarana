import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Menu,
  CheckCircle2,
  Clock,
  Wrench,
  ShoppingCart,
  Calendar,
  RotateCcw,
  X,
  ExternalLink,
  Megaphone,
  FileText,
  AlertTriangle,
  CheckSquare,
  CheckCheck,
  ChevronRight,
  User,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { usePage, router, Link, usePoll } from '@inertiajs/react';
import { PageProps } from '@/types';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  url: string;
  type: string;
  icon?: string;
  unread: boolean;
}

export default function Topbar({
  onMenuClick,
  isCollapsed = false,
  showSearch = false,
}: {
  onMenuClick?: () => void;
  isCollapsed?: boolean;
  showSearch?: boolean;
}) {
  const { url, props } = usePage<PageProps & {
    notifications?: {
      unread_count: number;
      list: NotificationItem[];
    }
  }>();
  const { auth, notifications } = props;

  const getPageBreadcrumb = (currentUrl: string) => {
    if (currentUrl.startsWith('/admin/stok-sarpras')) {
      return { section: 'Manajemen Aset & Laporan', title: 'Stok Barang' };
    }
    if (currentUrl.startsWith('/layanan/sarpras')) {
      return { section: 'Layanan & Sirkulasi', title: 'Sarana & Prasarana' };
    }
    if (currentUrl.startsWith('/admin/peminjaman') || currentUrl.startsWith('/layanan/peminjaman')) {
      return { section: 'Layanan & Sirkulasi', title: 'Peminjaman' };
    }
    if (currentUrl.startsWith('/admin/pengembalian') || currentUrl.startsWith('/layanan/pengembalian')) {
      return { section: 'Layanan & Sirkulasi', title: 'Pengembalian' };
    }
    if (currentUrl.startsWith('/admin/laporan')) {
      return { section: 'Manajemen Aset & Laporan', title: 'Laporan' };
    }
    if (currentUrl.startsWith('/staf/pengadaan') || currentUrl.startsWith('/staf-ruangan/pengadaan')) {
      return { section: 'Manajemen Aset & Laporan', title: 'Pengadaan' };
    }
    if (currentUrl.startsWith('/admin/maintenance') || currentUrl.startsWith('/staf-ruangan/maintenance')) {
      return { section: 'Manajemen Aset & Laporan', title: 'Perbaikan' };
    }
    if (currentUrl.startsWith('/admin/inventaris') || currentUrl.startsWith('/staf-ruangan/inventaris') || currentUrl.startsWith('/staf-ruangan/pengecekan')) {
      return { section: 'Manajemen Aset & Laporan', title: 'Inventaris' };
    }
    if (currentUrl.startsWith('/admin/berita') || currentUrl.startsWith('/layanan/berita') || currentUrl.startsWith('/berita/')) {
      return { section: 'Publikasi Web', title: 'Berita & Warta' };
    }
    if (currentUrl.startsWith('/admin/dokumen')) {
      return { section: 'Publikasi Web', title: 'Dokumen & SK' };
    }
    if (currentUrl.startsWith('/admin/struktur')) {
      return { section: 'Publikasi Web', title: 'Struktur' };
    }
    if (currentUrl.startsWith('/admin/visi-misi')) {
      return { section: 'Publikasi Web', title: 'Visi & Misi' };
    }
    if (currentUrl.startsWith('/admin/kontak')) {
      return { section: 'Publikasi Web', title: 'Kontak' };
    }
    if (currentUrl.startsWith('/admin/pengguna')) {
      return { section: 'Pengaturan', title: 'Manajemen Pengguna' };
    }
    if (currentUrl.startsWith('/profile')) {
      return { section: 'Pengaturan', title: 'Profil' };
    }
    return { section: 'Modul Operasional', title: 'Dashboard' };
  };

  const breadcrumb = getPageBreadcrumb(url);
  const formattedToday = new Intl.DateTimeFormat('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const roleLabel = (() => {
    const role = auth?.user?.role as string | undefined;
    if (role === 'admin') return 'Admin Sarpras';
    if (role === 'staf') return 'Staf Sarpras';
    if (role === 'kepala_bagian') return 'PIC Ruangan';
    if (role === 'staf_ruangan') return 'PIC Ruangan';
    if (role === 'umum' || (role === 'mahasiswa' && !auth?.user?.nomor_induk)) return 'Umum';
    if (role === 'mahasiswa') return 'Mahasiswa';
    return 'Pengguna';
  })();

  const [openNotif, setOpenNotif] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Tab filter notifikasi: 'semua' | 'unread' | 'read'
  const [notifFilter, setNotifFilter] = useState<'semua' | 'unread' | 'read'>('semua');

  // State lokal notifikasi yang selalu tersinkronisasi akurat dengan database
  const [localUnreadCount, setLocalUnreadCount] = useState<number>(notifications?.unread_count || 0);
  const [localNotifList, setLocalNotifList] = useState<NotificationItem[]>(notifications?.list || []);

  // Polling otomatis setiap 20 detik untuk mendeteksi adanya notifikasi / aktivitas baru
  usePoll(20000, { only: ['notifications'] }, { keepAlive: false, autoStart: true });

  // Sinkronkan state lokal saat server mengirim data notifikasi baru
  useEffect(() => {
    setLocalUnreadCount(notifications?.unread_count || 0);
    setLocalNotifList(notifications?.list || []);
  }, [notifications]);

  // Tutup dropdown jika klik di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setOpenNotif(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setOpenProfile(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Saat tombol lonceng diklik, buka/tutup dropdown tanpa mengubah status read/unread
  const handleToggleNotif = () => {
    setOpenNotif((prev) => !prev);
    setOpenProfile(false);
  };

  // Tandai semua notifikasi sebagai telah dibaca (tersimpan permanen ke database)
  const handleMarkAllRead = () => {
    setLocalUnreadCount(0);
    setLocalNotifList((prev) => prev.map((item) => ({ ...item, unread: false })));
    router.post(
      '/notifications/mark-all-read',
      { silent: true },
      {
        preserveScroll: true,
        preserveState: true,
        only: ['notifications'],
      }
    );
  };

  // Tandai satu notifikasi tertentu sebagai telah dibaca secara cepat tanpa buka detail
  const handleQuickMarkRead = (e: React.MouseEvent, notif: NotificationItem) => {
    e.stopPropagation();
    e.preventDefault();
    if (!notif.unread) return;

    setLocalNotifList((prev) =>
      prev.map((item) => (item.id === notif.id ? { ...item, unread: false } : item))
    );
    setLocalUnreadCount((prev) => Math.max(0, prev - 1));

    router.post(
      `/notifications/${notif.id}/read`,
      { stay: true },
      {
        preserveScroll: true,
        preserveState: true,
        only: ['notifications'],
      }
    );
  };

  const getIcon = (type: string, iconName?: string) => {
    if (iconName === 'megaphone' || type === 'berita') {
      return <Megaphone className="w-4 h-4 text-emerald-700" strokeWidth={1.75} />;
    }
    if (iconName === 'document' || type === 'dokumen') {
      return <FileText className="w-4 h-4 text-slate-700" strokeWidth={1.75} />;
    }
    if (iconName === 'alert') {
      return <AlertTriangle className="w-4 h-4 text-amber-600" strokeWidth={1.75} />;
    }
    switch (type) {
      case 'peminjaman':
        return <Calendar className="w-4 h-4 text-slate-700" strokeWidth={1.75} />;
      case 'pengembalian':
        return <RotateCcw className="w-4 h-4 text-slate-700" strokeWidth={1.75} />;
      case 'maintenance':
        return <Wrench className="w-4 h-4 text-slate-700" strokeWidth={1.75} />;
      case 'pengecekan':
        return <CheckSquare className="w-4 h-4 text-emerald-700" strokeWidth={1.75} />;
      case 'pengadaan':
        return <ShoppingCart className="w-4 h-4 text-slate-700" strokeWidth={1.75} />;
      default:
        return <Bell className="w-4 h-4 text-slate-700" strokeWidth={1.75} />;
    }
  };

  const handleItemClick = (e: React.MouseEvent, notif: NotificationItem) => {
    e.preventDefault();
    setSelectedNotif(notif);
    setOpenNotif(false);

    if (notif.unread) {
      setLocalNotifList((prev) =>
        prev.map((item) => (item.id === notif.id ? { ...item, unread: false } : item))
      );
      setLocalUnreadCount((prev) => Math.max(0, prev - 1));

      router.post(
        `/notifications/${notif.id}/read`,
        { stay: true },
        {
          preserveScroll: true,
          preserveState: true,
          only: ['notifications'],
        }
      );
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 h-16 relative">
      {/* Kiri: Tombol Toggle Sidebar + Breadcrumb Halaman Aktif */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          type="button"
          id="hamburger-btn"
          className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-200 transition flex items-center justify-center cursor-pointer text-slate-600 hover:text-[#006039] shrink-0 shadow-2xs"
          onClick={onMenuClick}
          aria-label="Toggle menu sidebar"
          title={isCollapsed ? "Buka Sidebar" : "Perkecil Sidebar"}
        >
          <Menu className="w-4 h-4 stroke-[2.25]" />
        </button>

        {/* Breadcrumb & Judul Halaman */}
        <div className="hidden sm:flex items-center gap-2 min-w-0">
          <span className="text-[11px] font-semibold text-slate-400 truncate">
            {breadcrumb.section}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-800 bg-emerald-50/70 text-[#006039] px-2.5 py-1 rounded-lg border border-emerald-200/60 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-[#006039]" />
            <span>{breadcrumb.title}</span>
          </span>
        </div>

        {showSearch && (
          <div className="relative min-w-0 flex-1 max-w-xs ml-2">
            <input
              placeholder="Cari fitur, data, atau laporan..."
              className="pl-9 pr-4 py-1.5 rounded-xl w-full bg-slate-50 border border-slate-200/80 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#006039] transition"
            />
            <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-400" />
          </div>
        )}
      </div>

      {/* Kanan: Tanggal Hari Ini, Notifikasi, & Kartu Profil */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Badge Tanggal Hari Ini */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] font-semibold text-slate-600">
          <Calendar className="w-3.5 h-3.5 text-[#006039]" />
          <span>{formattedToday}</span>
        </div>

        {/* DROPDOWN NOTIFIKASI REAL-TIME */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={handleToggleNotif}
            className={`w-9 h-9 rounded-xl border relative cursor-pointer transition flex items-center justify-center shadow-2xs ${
              openNotif
                ? 'bg-emerald-50 border-emerald-200 text-[#006039]'
                : 'bg-slate-50 hover:bg-emerald-50/60 border-slate-200/80 hover:border-emerald-200 text-slate-600 hover:text-[#006039]'
            }`}
            aria-label="Notifikasi Aktivitas"
          >
            <span className="relative inline-flex items-center justify-center">
              <Bell className="w-4 h-4 stroke-[2]" />
              {localUnreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] bg-rose-600 text-white text-[9px] font-black leading-none rounded-full flex items-center justify-center px-1 ring-2 ring-white shadow-xs pointer-events-none">
                  {localUnreadCount > 9 ? '9+' : localUnreadCount}
                </span>
              )}
            </span>
          </button>

          {/* Panel Notifikasi Popup Dropdown */}
          {openNotif && (() => {
            const unreadItemsCount = localNotifList.filter((n) => n.unread).length;
            const readItemsCount = localNotifList.filter((n) => !n.unread).length;
            const displayedNotifList = localNotifList.filter((n) => {
              if (notifFilter === 'unread') return n.unread;
              if (notifFilter === 'read') return !n.unread;
              return true;
            });

            return (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden font-sans">
                {/* Header Dropdown */}
                <div className="p-4 bg-[#006039] text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-emerald-200" />
                    <span className="font-bold text-sm">Notifikasi &amp; Aktivitas</span>
                  </div>
                  {unreadItemsCount > 0 ? (
                    <span className="text-[11px] bg-rose-500 text-white px-2.5 py-0.5 rounded-full font-bold shadow-xs">
                      {unreadItemsCount} Belum Dibaca
                    </span>
                  ) : (
                    <span className="text-[11px] bg-white/20 text-emerald-100 px-2.5 py-0.5 rounded-full font-medium">
                      Semua Terbaca
                    </span>
                  )}
                </div>

                {/* Filter Tab Notifikasi: Semua, Belum Dibaca, Terbaca */}
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-200/80 flex items-center gap-1.5 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setNotifFilter('semua')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 text-[11px] ${
                      notifFilter === 'semua'
                        ? 'bg-white text-[#006039] shadow-xs border border-slate-200/60'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Semua</span>
                    <span className="text-[10px] bg-slate-200/70 text-slate-700 px-1.5 py-0.2 rounded-full font-bold">
                      {localNotifList.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNotifFilter('unread')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 text-[11px] ${
                      notifFilter === 'unread'
                        ? 'bg-white text-[#006039] shadow-xs border border-slate-200/60'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Belum Dibaca</span>
                    {unreadItemsCount > 0 && (
                      <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.2 rounded-full font-bold">
                        {unreadItemsCount}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setNotifFilter('read')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 text-[11px] ${
                      notifFilter === 'read'
                        ? 'bg-white text-[#006039] shadow-xs border border-slate-200/60'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Terbaca</span>
                    <span className="text-[10px] bg-slate-200/70 text-slate-600 px-1.5 py-0.2 rounded-full">
                      {readItemsCount}
                    </span>
                  </button>
                </div>

                {/* List Notifikasi */}
                <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {displayedNotifList.map((notif) => (
                    <a
                      key={notif.id}
                      href={notif.url}
                      onClick={(e) => handleItemClick(e, notif)}
                      className={`p-3.5 flex items-start gap-3 hover:bg-slate-50/80 transition block cursor-pointer group border-l-4 ${
                        notif.unread
                          ? 'bg-emerald-50/40 hover:bg-emerald-50/70 border-l-[#006039]'
                          : 'bg-white hover:bg-slate-50 border-l-transparent'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                          notif.unread
                            ? 'bg-emerald-100/70 text-[#006039] border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200/80 group-hover:bg-slate-200/70'
                        }`}
                      >
                        {getIcon(notif.type, notif.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <h4
                              className={`text-xs truncate ${
                                notif.unread
                                  ? 'font-extrabold text-slate-900'
                                  : 'font-semibold text-slate-600'
                              }`}
                            >
                              {notif.title}
                            </h4>
                            {notif.unread ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-[#006039] shrink-0 border border-emerald-200/60">
                                Belum Dibaca
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-100 text-slate-400 shrink-0">
                                Terbaca
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                              {notif.time}
                            </span>
                            {notif.unread && (
                              <button
                                type="button"
                                onClick={(e) => handleQuickMarkRead(e, notif)}
                                className="w-5 h-5 rounded-md hover:bg-emerald-100 text-slate-400 hover:text-[#006039] flex items-center justify-center transition cursor-pointer"
                                title="Tandai telah dibaca"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p
                          className={`text-[11px] mt-0.5 line-clamp-2 leading-relaxed ${
                            notif.unread ? 'text-slate-700 font-medium' : 'text-slate-500'
                          }`}
                        >
                          {notif.message}
                        </p>
                      </div>
                    </a>
                  ))}

                  {displayedNotifList.length === 0 && (
                    <div className="p-8 text-center text-slate-400 space-y-1.5">
                      <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="font-bold text-slate-700 text-xs">
                        {notifFilter === 'unread'
                          ? 'Tidak Ada Notifikasi Belum Dibaca'
                          : notifFilter === 'read'
                          ? 'Belum Ada Notifikasi Terbaca'
                          : 'Semua Beres!'}
                      </p>
                      <p className="text-[11px]">
                        {notifFilter === 'unread'
                          ? 'Seluruh laporan dan aktivitas sudah selesai Anda tinjau.'
                          : 'Belum ada aktivitas atau pengumuman baru yang memerlukan tindakan.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Dropdown: Tombol Tandai Semua Telah Dibaca */}
                <div className="p-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-500">
                    {unreadItemsCount > 0 ? `${unreadItemsCount} belum dibaca` : 'Semua telah dibaca'}
                  </span>
                  {unreadItemsCount > 0 ? (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-xs font-bold text-[#006039] hover:text-[#004d2e] hover:underline cursor-pointer flex items-center gap-1.5 transition"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Tandai semua telah dibaca</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Tersinkronisasi</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        <div className="hidden sm:block h-6 w-px bg-slate-200/80" />

        {/* Profil Pengguna Interaktif (Klik untuk membuka Popup Profil User & Logout seperti Gambar 2) */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => {
              setOpenProfile(!openProfile);
              setOpenNotif(false);
            }}
            className={`flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-xl border transition cursor-pointer shadow-2xs ${
              openProfile
                ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-100'
                : 'bg-slate-50/90 hover:bg-emerald-50/40 border-slate-200/80 hover:border-emerald-200'
            }`}
            aria-label="Buka Menu Profil User"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#006039] to-emerald-600 text-white text-xs font-extrabold flex items-center justify-center shrink-0 shadow-xs ring-2 ring-emerald-50">
              {auth?.user?.name ? auth.user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="hidden sm:block text-left min-w-0">
              <div className="text-xs font-extrabold text-slate-900 truncate max-w-[150px] leading-tight">
                {auth?.user?.name || 'Administrator'}
              </div>
              <div className="text-[10px] font-bold text-[#006039] leading-tight mt-0.5">
                {roleLabel}
              </div>
            </div>
            <ChevronDown
              className={`hidden sm:block w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                openProfile ? 'rotate-180 text-[#006039]' : ''
              }`}
            />
          </button>

          {/* Popup Panel "Profil User" (Sesuai Referensi Gambar 2) */}
          {openProfile && (
            <div className="absolute right-0 mt-2.5 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 p-5 font-sans animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Header: Profil User + Tombol Close (X) */}
              <div className="flex items-center justify-between pb-4">
                <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">
                  Profil User
                </h3>
                <button
                  type="button"
                  onClick={() => setOpenProfile(false)}
                  className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-500 flex items-center justify-center transition cursor-pointer"
                  title="Tutup"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* Kartu Identitas User (Kotak Avatar Besar di Kiri + Nama Uppercase & Role di Kanan) */}
              <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
                <div className="w-20 h-20 rounded-2xl bg-slate-200/80 text-slate-700 font-extrabold text-2xl flex items-center justify-center shrink-0 select-none border border-slate-300/50 shadow-inner">
                  {auth?.user?.name ? auth.user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-extrabold text-slate-900 uppercase leading-snug break-words">
                    {auth?.user?.name || 'PENGGUNA'}
                  </h4>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    {roleLabel}
                  </p>
                  {auth?.user?.email && (
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {auth.user.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Menu Aksi: Profil (Pengaturan Akun) & Logout */}
              <div className="pt-4 space-y-2.5">
                <Link
                  href="/profile"
                  onClick={() => setOpenProfile(false)}
                  className="group flex items-center gap-3.5 p-2 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-blue-50 group-hover:bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 transition">
                    <User className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-slate-800 group-hover:text-blue-600 transition">
                      Profil
                    </p>
                    <p className="text-[11px] font-medium text-slate-500">
                      Pengaturan Akun
                    </p>
                  </div>
                </Link>

                <Link
                  href={typeof route === 'function' ? route('logout') : '/logout'}
                  method="post"
                  as="button"
                  onClick={() => setOpenProfile(false)}
                  className="w-full group flex items-center gap-3.5 p-2 rounded-xl hover:bg-rose-50/60 transition cursor-pointer text-left"
                >
                  <div className="w-11 h-11 rounded-xl bg-rose-50 group-hover:bg-rose-100 text-rose-500 flex items-center justify-center shrink-0 transition">
                    <LogOut className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-slate-800 group-hover:text-rose-600 transition">
                      Logout
                    </p>
                    <p className="text-[11px] font-medium text-slate-500">
                      Keluar dari Sistem
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Detail Notifikasi yang Dapat Diklik & Dibuka */}
      {selectedNotif && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100 font-sans text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#006039] border border-emerald-200/80 flex items-center justify-center shrink-0">
                  {getIcon(selectedNotif.type, selectedNotif.icon)}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Detail Notifikasi
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {selectedNotif.time}
                    </span>
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                      {selectedNotif.type}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNotif(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer transition"
                aria-label="Tutup Detail"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm leading-snug">
                  {selectedNotif.title}
                </h4>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-xs">
                  {selectedNotif.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedNotif(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                Tutup
              </button>
              {selectedNotif.url && selectedNotif.url !== '#' && selectedNotif.url !== '/' && (
                <button
                  type="button"
                  onClick={() => {
                    const destUrl = selectedNotif.url;
                    setSelectedNotif(null);
                    router.visit(destUrl);
                  }}
                  className="px-4 py-2 bg-[#006039] hover:bg-[#004e2e] text-white rounded-xl font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Halaman Terkait</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
