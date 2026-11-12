import React, { useState, useEffect } from "react";
import {
    LayoutGrid,
    Calendar,
    RotateCcw,
    ShoppingCart,
    Wrench,
    Box,
    Layers,
    CheckSquare,
    Compass,
    Newspaper,
    FileText,
    Phone,
    Settings,
    Users,
    ChevronDown,
    Award,
    Network,
    FileSpreadsheet,
    Image as ImageIcon,
    MessageSquareQuote,
    UserCheck,
} from "lucide-react";
import { Link, usePage } from "@inertiajs/react";
import { PageProps } from "@/types";

interface SubMenuItem {
    label: string;
    icon: any;
    href: string;
}

interface MenuItem {
    label: string;
    icon: any;
    href?: string;
    children?: SubMenuItem[];
}

const adminMenuItems: MenuItem[] = [
    {
        label: "Layanan & Sirkulasi",
        icon: Box,
        children: [
            { label: "Sarana & Prasarana", icon: Layers, href: "/admin/stok-sarpras" },
            { label: "Peminjaman", icon: Calendar, href: "/admin/peminjaman" },
            { label: "Pengembalian", icon: RotateCcw, href: "/admin/pengembalian" },
        ],
    },
    {
        label: "Manajemen Aset & Laporan",
        icon: FileSpreadsheet,
        children: [
            { label: "Inventaris", icon: CheckSquare, href: "/admin/inventaris" },
            { label: "Pengadaan", icon: ShoppingCart, href: "/staf/pengadaan" },
            { label: "Perbaikan", icon: Wrench, href: "/admin/maintenance" },
            { label: "Laporan", icon: FileSpreadsheet, href: "/admin/laporan" },
        ],
    },
    {
        label: "Publikasi Web",
        icon: Newspaper,
        children: [
            { label: "Berita & Warta", icon: Newspaper, href: "/admin/berita" },
            { label: "Banner Web", icon: ImageIcon, href: "/admin/hero-section" },
            { label: "Sambutan", icon: MessageSquareQuote, href: "/admin/sambutan" },
            { label: "Dokumen & SK", icon: FileText, href: "/admin/dokumen" },
            { label: "Struktur", icon: Network, href: "/admin/struktur" },
            { label: "Visi & Misi", icon: Award, href: "/admin/visi-misi" },
            { label: "Kontak", icon: Phone, href: "/admin/kontak" },
        ],
    },
];

const stafMenuItems: MenuItem[] = [
    {
        label: "Layanan & Sirkulasi",
        icon: Box,
        children: [
            { label: "Sarana & Prasarana", icon: Layers, href: "/admin/stok-sarpras" },
            { label: "Peminjaman", icon: Calendar, href: "/admin/peminjaman" },
            { label: "Pengembalian", icon: RotateCcw, href: "/admin/pengembalian" },
        ],
    },
    {
        label: "Manajemen Aset & Laporan",
        icon: FileSpreadsheet,
        children: [
            { label: "Inventaris", icon: CheckSquare, href: "/admin/inventaris" },
            { label: "Pengadaan", icon: ShoppingCart, href: "/staf/pengadaan" },
            { label: "Perbaikan", icon: Wrench, href: "/admin/maintenance" },
            { label: "Laporan", icon: FileSpreadsheet, href: "/admin/laporan" },
        ],
    },
    {
        label: "Publikasi Web",
        icon: Newspaper,
        children: [
            { label: "Berita & Warta", icon: Newspaper, href: "/admin/berita" },
        ],
    },
];

const kepalaBagianMenuItems: MenuItem[] = [
    {
        label: "Layanan & Sirkulasi",
        icon: Box,
        children: [
            { label: "Sarana & Prasarana", icon: Layers, href: "/layanan/sarpras" },
            { label: "Peminjaman", icon: Calendar, href: "/layanan/peminjaman" },
            { label: "Pengembalian", icon: RotateCcw, href: "/layanan/pengembalian" },
        ],
    },
    {
        label: "Manajemen Aset & Laporan",
        icon: FileSpreadsheet,
        children: [
            { label: "Inventaris", icon: CheckSquare, href: "/admin/inventaris" },
            { label: "Perbaikan", icon: Wrench, href: "/staf-ruangan/maintenance" },
            { label: "Pengadaan", icon: ShoppingCart, href: "/staf/pengadaan" },
        ],
    },
    {
        label: "Publikasi Web",
        icon: Newspaper,
        children: [
            { label: "Berita & Warta", icon: Newspaper, href: "/layanan/berita" },
        ],
    },
];

const stafRuanganMenuItems: MenuItem[] = kepalaBagianMenuItems;

const peminjamMenuItems: MenuItem[] = [
    {
        label: "Layanan & Sirkulasi",
        icon: Box,
        children: [
            { label: "Sarana & Prasarana", icon: Layers, href: "/layanan/sarpras" },
            { label: "Peminjaman", icon: Calendar, href: "/layanan/peminjaman" },
            { label: "Pengembalian", icon: RotateCcw, href: "/layanan/pengembalian" },
        ],
    },
    {
        label: "Publikasi Web",
        icon: Newspaper,
        children: [
            { label: "Berita & Warta", icon: Newspaper, href: "/layanan/berita" },
        ],
    },
];

interface SidebarProps {
    isCollapsed?: boolean;
    onExpand?: () => void;
}

export default function Sidebar({ isCollapsed = false, onExpand }: SidebarProps) {
    const { url, props } = usePage<PageProps>();
    const role = props.auth?.user?.role || "mahasiswa";

    let navItems = peminjamMenuItems;
    if (role === "admin") {
        navItems = adminMenuItems;
    } else if (role === "staf") {
        navItems = stafMenuItems;
    } else if (role === "staf_ruangan" || role === "kepala_bagian") {
        navItems = kepalaBagianMenuItems;
    }

    const isItemActive = (href: string) => {
        if (href === "/dashboard" || href === "/staf-ruangan/dashboard") {
            return url === "/dashboard" || url.startsWith("/dashboard/") || url.startsWith("/staf-ruangan/dashboard");
        }
        if (href === "/layanan/sarpras" || href === "/admin/stok-sarpras") {
            return (
                url.startsWith("/layanan/sarpras") ||
                url.startsWith("/admin/stok-sarpras") ||
                url.startsWith("/layanan/peminjaman/ajukan")
            );
        }
        if (href === "/layanan/peminjaman") {
            if (url.startsWith("/layanan/sarpras/ajukan") || url.startsWith("/layanan/peminjaman/ajukan")) {
                return false;
            }
            return (
                url === "/layanan/peminjaman" ||
                url.startsWith("/layanan/peminjaman?")
            );
        }
        if (href === "/layanan/pengembalian") {
            return (
                url === "/layanan/pengembalian" ||
                url.startsWith("/layanan/pengembalian/") ||
                url.startsWith("/layanan/pengembalian?")
            );
        }
        if (href === "/layanan/berita") {
            return (
                url === "/layanan/berita" ||
                url.startsWith("/layanan/berita/") ||
                url.startsWith("/layanan/berita?") ||
                url.startsWith("/berita/")
            );
        }
        if (href === "/admin/stok-sarpras") {
            return url.startsWith("/admin/stok-sarpras");
        }
        if (href === "/admin/inventaris" || href === "/staf-ruangan/inventaris") {
            return (
                url.startsWith("/admin/inventaris") ||
                url.startsWith("/staf-ruangan/inventaris") ||
                url.startsWith("/staf-ruangan/pengecekan")
            );
        }
        return url === href || url.startsWith(`${href}/`) || url.startsWith(`${href}?`);
    };

    const dashboardHref = role === "staf_ruangan" || role === "kepala_bagian" ? "/staf-ruangan/dashboard" : "/dashboard";
    const isDashboardActive = isItemActive(dashboardHref);

    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        let hasOperasionalActive = false;
        navItems.forEach((item) => {
            if (item.children) {
                const hasActiveChild = item.children.some((child) => isItemActive(child.href));
                if (hasActiveChild) {
                    initial[item.label] = true;
                    if (item.label === "Layanan & Sirkulasi" || item.label === "Manajemen Aset & Laporan") {
                        hasOperasionalActive = true;
                    }
                }
            }
        });
        // Sesuai Gambar 3: Secara default Layanan & Sirkulasi terbuka
        if (!hasOperasionalActive) {
            initial["Layanan & Sirkulasi"] = true;
        }
        return initial;
    });

    useEffect(() => {
        setOpenMenus((prev) => {
            const next = { ...prev };
            let activeOperasional: string | null = null;
            navItems.forEach((item) => {
                if (item.children) {
                    const hasActiveChild = item.children.some((child) => isItemActive(child.href));
                    if (hasActiveChild) {
                        next[item.label] = true;
                        if (item.label === "Layanan & Sirkulasi" || item.label === "Manajemen Aset & Laporan") {
                            activeOperasional = item.label;
                        }
                    }
                }
            });
            if (activeOperasional === "Layanan & Sirkulasi") {
                next["Manajemen Aset & Laporan"] = false;
            } else if (activeOperasional === "Manajemen Aset & Laporan") {
                next["Layanan & Sirkulasi"] = false;
            }
            return next;
        });
    }, [url]);

    const toggleMenu = (label: string) => {
        setOpenMenus((prev) => {
            const nextIsOpen = !prev[label];
            const nextState = { ...prev, [label]: nextIsOpen };

            // Sesuai Gambar 3: Membuka salah satu otomatis menutup modul operasional lainnya
            if (nextIsOpen) {
                if (label === "Layanan & Sirkulasi") {
                    nextState["Manajemen Aset & Laporan"] = false;
                } else if (label === "Manajemen Aset & Laporan") {
                    nextState["Layanan & Sirkulasi"] = false;
                }
            }
            return nextState;
        });
    };

    // Ketika ikon diklik saat sidebar tertutup, buka kembali sidebar seperti awal dan buka kategori yang dipilih
    const handleCategoryClick = (label: string) => {
        if (isCollapsed) {
            if (onExpand) {
                onExpand();
            }
            setOpenMenus((prev) => {
                const nextState = { ...prev, [label]: true };
                if (label === "Layanan & Sirkulasi") {
                    nextState["Manajemen Aset & Laporan"] = false;
                } else if (label === "Manajemen Aset & Laporan") {
                    nextState["Layanan & Sirkulasi"] = false;
                }
                return nextState;
            });
        } else {
            toggleMenu(label);
        }
    };

    return (
        <div
            className={`relative z-30 flex flex-col h-full bg-gradient-to-b from-[#006039] via-[#005834] to-[#004629] py-5 text-white font-sans select-none transition-all duration-300 ${
                isCollapsed ? "items-center" : ""
            }`}
        >
            {/* Header Sidebar Brand */}
            <div
                className={`mb-4 ${isCollapsed ? "px-2 cursor-pointer" : "px-4"} w-full transition-all duration-300`}
                onClick={() => isCollapsed && onExpand?.()}
                title={isCollapsed ? "Buka Sidebar" : undefined}
            >
                <div
                    className={`flex items-center ${
                        isCollapsed ? "justify-center py-2" : "gap-3 py-2.5 px-2.5"
                    } rounded-2xl bg-white/8 border border-white/10 transition-all duration-300`}
                >
                    <div className="w-9 h-9 flex items-center justify-center shrink-0">
                        <img
                            src="/images/Logo-Unuha.png"
                            alt="Logo Universitas Nurul Huda"
                            className="w-9 h-9 object-contain drop-shadow-sm"
                            onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                            }}
                        />
                    </div>
                    <div className={`logo-text min-w-0 ${isCollapsed ? "hidden" : "block"}`}>
                        <h3 className="text-xs font-extrabold text-white leading-tight truncate">
                            <span>Biro Sarana &amp; Prasarana</span>
                        </h3>
                        <p className="text-[10px] font-bold text-[#FCB900] truncate mt-0.5">
                            <span>Universitas Nurul Huda</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Menu Navigasi dengan Kategori yang Bisa Dibuka / Ditutup */}
            <nav
                className={`flex-1 space-y-2 ${
                    isCollapsed ? "px-2 w-full" : "px-3"
                } relative z-40 overflow-y-auto custom-scrollbar transition-all duration-300`}
            >
                {/* 1. Dashboard Langsung Mandiri di Bagian Paling Atas */}
                <div className="mb-2">
                    <Link
                        href={dashboardHref}
                        onClick={() => isCollapsed && onExpand?.()}
                        title={isCollapsed ? "Dashboard" : undefined}
                        className={`menu-button relative group w-full flex items-center ${
                            isCollapsed
                                ? "justify-center px-0 h-10 w-10 mx-auto"
                                : "gap-3 px-3 py-2.5"
                        } rounded-xl transition-all duration-200 cursor-pointer text-xs ${
                            isDashboardActive
                                ? "bg-white text-[#006039] font-extrabold shadow-sm"
                                : "text-white/85 hover:bg-white/10 hover:text-white font-semibold"
                        }`}
                    >
                        <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                isDashboardActive
                                    ? "bg-[#006039] text-white"
                                    : "bg-white/10 text-white/85 group-hover:bg-white/15"
                            }`}
                        >
                            <LayoutGrid strokeWidth={2} className="w-4 h-4 shrink-0" />
                        </div>
                        <span className={`menu-text truncate ${isCollapsed ? "hidden" : "inline"}`}>
                            Dashboard
                        </span>
                        {!isCollapsed && isDashboardActive && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#006039]" />
                        )}
                    </Link>
                </div>

                {/* Label Kategori: MODUL OPERASIONAL */}
                {!isCollapsed && (
                    <div className="px-3 pt-1 pb-1 text-[10px] font-extrabold text-white/50 uppercase tracking-wider">
                        Modul Operasional
                    </div>
                )}

                {/* Daftar Kategori Accordion (Layanan & Sirkulasi, Manajemen Aset & Laporan, Publikasi Web) */}
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isOpen = Boolean(openMenus[item.label]);
                    const hasActiveChild = Boolean(
                        item.children?.some((child) => isItemActive(child.href))
                    );

                    return (
                        <div key={item.label} className="space-y-1">
                            {/* Tombol Kategori Induk */}
                            <button
                                type="button"
                                onClick={() => handleCategoryClick(item.label)}
                                title={isCollapsed ? item.label : undefined}
                                className={`menu-button relative group w-full flex items-center ${
                                    isCollapsed
                                        ? "justify-center px-0 h-10 w-10 mx-auto"
                                        : "gap-3 px-3 py-2.5"
                                } rounded-xl transition-all duration-200 cursor-pointer text-xs text-left ${
                                    hasActiveChild
                                        ? "bg-white/15 text-white font-extrabold border border-white/20 shadow-2xs"
                                        : isOpen
                                          ? "bg-white/10 text-white font-bold"
                                          : "text-white/80 hover:bg-white/10 hover:text-white font-semibold"
                                }`}
                            >
                                <div
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                        hasActiveChild
                                            ? "bg-[#FCB900] text-slate-900 shadow-2xs"
                                            : isOpen
                                              ? "bg-white/20 text-white"
                                              : "bg-white/10 text-white/85 group-hover:bg-white/15"
                                    }`}
                                >
                                    <Icon strokeWidth={2} className="w-4 h-4 shrink-0" />
                                </div>
                                <span className={`menu-text truncate ${isCollapsed ? "hidden" : "inline"}`}>
                                    {item.label}
                                </span>
                                {!isCollapsed && (
                                    <ChevronDown
                                        strokeWidth={2.25}
                                        className={`submenu-indicator w-4 h-4 ml-auto text-white/70 transition-transform duration-200 shrink-0 ${
                                            isOpen ? "rotate-180 text-white" : ""
                                        }`}
                                    />
                                )}
                            </button>

                            {/* Submenu Biasa Saat Sidebar Terbuka */}
                            {isOpen && item.children && !isCollapsed && (
                                <div className="submenu-list ml-3.5 pl-3 border-l border-white/20 space-y-1 pt-0.5 pb-1 animate-in fade-in duration-150">
                                    {item.children.map((child) => {
                                        const ChildIcon = child.icon;
                                        const isChildActive = isItemActive(child.href);
                                        return (
                                            <Link
                                                key={child.label}
                                                href={child.href}
                                                className={`relative group flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer text-xs ${
                                                    isChildActive
                                                        ? "bg-white text-[#006039] font-extrabold shadow-xs"
                                                        : "text-white/80 hover:bg-white/10 hover:text-white font-medium"
                                                }`}
                                            >
                                                <ChildIcon
                                                    strokeWidth={2}
                                                    className={`w-4 h-4 shrink-0 transition-colors ${
                                                        isChildActive
                                                            ? "text-[#006039]"
                                                            : "text-white/70 group-hover:text-white"
                                                    }`}
                                                />
                                                <span className="truncate">{child.label}</span>
                                                {isChildActive && (
                                                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#006039]" />
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Bagian Paling Bawah: Pinned Manajemen Pengguna (khusus Admin - Tidak Perlu Di-scroll) */}
            {role === "admin" && (
                <div className={`mt-auto pt-2 border-t border-white/15 ${isCollapsed ? "px-2" : "px-3"}`}>
                    <Link
                        href="/admin/pengguna"
                        onClick={() => isCollapsed && onExpand?.()}
                        title={isCollapsed ? "Manajemen Pengguna" : undefined}
                        className={`group w-full flex items-center ${
                            isCollapsed
                                ? "justify-center px-0 h-10 w-10 mx-auto"
                                : "gap-3 px-3 py-2.5"
                        } rounded-xl transition-all duration-200 cursor-pointer text-xs ${
                            isItemActive("/admin/pengguna")
                                ? "bg-white text-[#006039] font-extrabold shadow-sm"
                                : "text-white/85 hover:bg-white/10 hover:text-white font-semibold"
                        }`}
                    >
                        <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                isItemActive("/admin/pengguna")
                                    ? "bg-[#006039] text-white"
                                    : "bg-white/10 text-white/85 group-hover:bg-white/15"
                            }`}
                        >
                            <Users strokeWidth={2} className="w-4 h-4 shrink-0" />
                        </div>
                        <span className={`truncate ${isCollapsed ? "hidden" : "inline"}`}>
                            Manajemen Pengguna
                        </span>
                        {!isCollapsed && isItemActive("/admin/pengguna") && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#006039]" />
                        )}
                    </Link>
                </div>
            )}
        </div>
    );
}
