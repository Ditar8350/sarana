import { Home, Image as ImageIcon, MessageSquare, Newspaper, Phone, Target, FileText, Network, LogOut, Landmark } from "lucide-react";
import { Link, usePage } from "@inertiajs/react";

const items = [
    { label: "Dashboard", icon: Home, href: "/dashboard" },
    { label: "Hero Section", icon: ImageIcon, href: "/admin/hero" },
    { label: "Sambutan Ketua", icon: MessageSquare, href: "/admin/sambutan" },
    { label: "Berita", icon: Newspaper, href: "/admin/berita" },
    { label: "Visi & Misi", icon: Target, href: "/admin/visi-misi" },
    { label: "Dokumen", icon: FileText, href: "/admin/dokumen" },
    { label: "Struktur Organisasi", icon: Network, href: "/admin/struktur" },
    { label: "Kontak & Layanan", icon: Phone, href: "/admin/kontak" },
];

export default function Sidebar() {
    const { url } = usePage();

    const isItemActive = (href: string) => {
        if (href === "/dashboard") {
            return url === "/dashboard" || url.startsWith("/dashboard/");
        }
        return url === href || url.startsWith(`${href}/`) || url.startsWith(`${href}?`);
    };

    return (
        <div className="flex flex-col min-h-full bg-[#006039] py-6 text-white font-sans">
            {/* Header Sidebar */}
            <div className="mb-8 px-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-lg shrink-0">
                        <Landmark className="w-6 h-6 text-[#006039]" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white leading-tight">Biro Sarana & Prasarana</h3>
                        <p className="text-xs font-medium text-[#FCB900] mt-0.5">Universitas Nurul Huda</p>
                    </div>
                </div>
            </div>

            {/* Menu Navigasi */}
            <nav className="flex-1 space-y-1.5 px-4">
                {items.map((it) => {
                    const Icon = it.icon;
                    const isActive = isItemActive(it.href);
                    return (
                        <Link
                            key={it.label}
                            href={it.href}
                            className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 ${
                                isActive ? "bg-white text-[#006039] shadow-md font-semibold" : "text-white/80 hover:bg-white/10 hover:text-white font-medium"
                            }`}
                        >
                            <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? "text-[#FCB900]" : "text-white/70"}`} />
                            <span className="text-sm">{it.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Area Bawah: Profil & Logout */}
            <div className="mt-6 pt-5 border-t border-white/20 space-y-4 px-6 mx-2">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-white/10">
                    <div className="w-10 h-10 rounded-full bg-[#FCB900] flex items-center justify-center text-[#111C2D] font-bold text-lg shadow-sm shrink-0">A</div>
                    <div className="min-w-0">
                        <div className="text-sm font-bold text-white">Admin Sarana & Prasarana</div>
                        <div className="text-xs text-white/70 truncate">admin@unuha.ac.id</div>
                    </div>
                </div>

                <Link
                    href={typeof route === "function" ? route("logout") : "/logout"}
                    method="post"
                    as="button"
                    className="group flex w-full items-center justify-center gap-2 rounded-xl border border-red-500 bg-red-200 hover:bg-red-300 px-3 py-3 text-sm font-bold text-red-600 shadow-md transition-all active:scale-95"
                >
                    <LogOut className="h-4 w-4 transition group-hover:-translate-x-0.5" />
                    <span>Keluar Sistem</span>
                </Link>
            </div>
        </div>
    );
}
