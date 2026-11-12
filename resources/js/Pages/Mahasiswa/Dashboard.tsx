import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { PageProps } from '@/types';
import {
    GraduationCap,
    Users,
    Package,
    Box,
    Calendar,
    Building2,
    Clock,
    ArrowRight,
    MapPin,
    RotateCcw,
    ChevronRight,
    FileText,
    Plus,
    Newspaper,
    CheckCircle2,
    Camera,
    ClipboardList,
    User,
} from 'lucide-react';

interface BeritaItem {
    id: number;
    title: string;
    slug: string;
    image: string;
    date: string;
    excerpt?: string;
    author?: string;
}

interface InventarisItem {
    id: number;
    kode: string;
    nama: string;
    jenis: 'sarana' | 'prasarana';
    kategori: string;
    lokasi: string;
    stok_total: number;
    stok_tersedia: number;
    satuan: string;
    kondisi_umum: string;
    foto_url?: string | null;
}

interface PeminjamanItem {
    id: number;
    kode: string;
    status: string;
    tanggal_mulai: string;
    tanggal_kembali_rencana: string;
    barang: string;
}

interface Props {
    berita: BeritaItem[];
    inventaris: InventarisItem[];
    peminjamanSaya: PeminjamanItem[];
    ringkasan?: {
        menunggu: number;
        aktif: number;
        selesai: number;
        item_tersedia: number;
    };
}

const statusStyle: Record<string, { label: string; className: string; dotColor: string }> = {
    menunggu_validasi: {
        label: 'Menunggu Approval',
        className: 'bg-amber-50 text-amber-700 border-amber-200',
        dotColor: 'bg-amber-500',
    },
    ditunda: {
        label: 'Ditunda',
        className: 'bg-amber-100 text-amber-800 border-amber-300',
        dotColor: 'bg-amber-600',
    },
    disetujui: {
        label: 'Pilih Staf',
        className: 'bg-blue-50 text-blue-700 border-blue-200',
        dotColor: 'bg-blue-500',
    },
    siap_diambil: {
        label: 'Upload Bukti',
        className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        dotColor: 'bg-indigo-500',
    },
    sedang_dipinjam: {
        label: 'Dipinjam',
        className: 'bg-emerald-50 text-[#006039] border-emerald-200',
        dotColor: 'bg-[#006039]',
    },
    menunggu_kembali: {
        label: 'Cek Fisik',
        className: 'bg-purple-50 text-purple-700 border-purple-200',
        dotColor: 'bg-purple-500',
    },
    selesai: {
        label: 'Selesai',
        className: 'bg-slate-100 text-slate-700 border-slate-200',
        dotColor: 'bg-slate-500',
    },
    ditolak: {
        label: 'Ditolak',
        className: 'bg-rose-50 text-rose-700 border-rose-200',
        dotColor: 'bg-rose-500',
    },
};

export default function MahasiswaDashboard({
    berita = [],
    inventaris = [],
    peminjamanSaya = [],
    ringkasan,
}: Props) {
    const { auth } = usePage<PageProps>().props;
    const isUmum = !auth.user.nomor_induk || (auth.user.role as string) === 'umum';

    const inventarisSiap = inventaris.filter((item) => item.stok_tersedia > 0).slice(0, 3);

    const stats = {
        item_tersedia: ringkasan?.item_tersedia ?? inventaris.filter((i) => i.stok_tersedia > 0).length,
        menunggu:
            ringkasan?.menunggu ??
            peminjamanSaya.filter((p) => ['menunggu_validasi', 'disetujui', 'siap_diambil'].includes(p.status)).length,
        aktif:
            ringkasan?.aktif ??
            peminjamanSaya.filter((p) => ['sedang_dipinjam', 'menunggu_kembali'].includes(p.status)).length,
        berita_total: berita.length,
    };

    return (
        <AdminLayout showGlobalSearch={false}>
            <Head title={`${isUmum ? 'Portal Layanan Umum' : 'Portal Layanan Mahasiswa'} - Biro Sarpras UNUHA`} />

            <div className="w-full space-y-5 pb-14 text-xs text-slate-800 font-sans">
                {/* 1. Banner Sambutan Modern & Proporsional */}
                <div className="relative overflow-hidden bg-gradient-to-r from-[#006039] via-[#0d5438] to-[#004629] text-white p-5 sm:p-6 rounded-2xl shadow-xs border border-emerald-900/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-white/5 blur-2xl pointer-events-none" />

                    <div className="relative z-10 space-y-1">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider bg-white/15 text-emerald-100 px-2.5 py-0.5 rounded-full border border-white/20">
                            {isUmum ? (
                                <>
                                    <Users className="w-3 h-3" />
                                    <span>Portal Layanan Umum</span>
                                </>
                            ) : (
                                <>
                                    <GraduationCap className="w-3 h-3" />
                                    <span>Portal Layanan Mahasiswa</span>
                                </>
                            )}
                        </span>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                            Halo, {auth.user.name}
                        </h1>
                        <p className="text-emerald-100/90 text-xs">
                            {isUmum
                                ? 'Pinjam sarana prasarana kampus untuk kegiatan umum secara mudah.'
                                : 'Pinjam fasilitas kampus dengan mudah dan pantau progres pengajuan Anda.'}
                        </p>
                    </div>

                    <div className="relative z-10 flex flex-wrap items-center gap-2.5 shrink-0">
                        <Link
                            href="/layanan/pengembalian"
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-bold text-xs transition cursor-pointer"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Pengembalian</span>
                        </Link>
                        <Link
                            href="/layanan/sarpras"
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-[#006039] hover:bg-emerald-50 rounded-xl font-extrabold text-xs shadow-sm transition cursor-pointer"
                        >
                            <Plus className="w-4 h-4 stroke-[2.5]" />
                            <span>Ajukan Pinjam</span>
                        </Link>
                    </div>
                </div>

                {/* 2. Empat Kartu Navigasi & Ringkasan (Seimbang & Konsisten dengan Menu Sidebar) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Link
                        href="/layanan/sarpras"
                        className="group bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-[#006039] hover:shadow-sm transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer"
                    >
                        <div className="space-y-1 min-w-0">
                            <span className="text-[11px] font-semibold text-slate-500 block truncate">
                                Sarana &amp; Prasarana
                            </span>
                            <div className="flex flex-wrap items-baseline gap-2">
                                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 group-hover:text-[#006039] transition-colors">
                                    {stats.item_tersedia}
                                </span>
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70">
                                    Siap Dipinjam
                                </span>
                            </div>
                        </div>
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#006039] to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-900/15 group-hover:scale-105 transition-transform">
                            <Box className="w-5 h-5" strokeWidth={2} />
                        </div>
                    </Link>

                    <Link
                        href="/layanan/peminjaman"
                        className="group bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-[#006039] hover:shadow-sm transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer"
                    >
                        <div className="space-y-1 min-w-0">
                            <span className="text-[11px] font-semibold text-slate-500 block truncate">
                                Peminjaman
                            </span>
                            <div className="flex flex-wrap items-baseline gap-2">
                                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 group-hover:text-[#006039] transition-colors">
                                    {stats.menunggu}
                                </span>
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/70">
                                    Dalam Proses
                                </span>
                            </div>
                        </div>
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-900/15 group-hover:scale-105 transition-transform">
                            <Calendar className="w-5 h-5" strokeWidth={2} />
                        </div>
                    </Link>

                    <Link
                        href="/layanan/pengembalian"
                        className="group bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-[#006039] hover:shadow-sm transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer"
                    >
                        <div className="space-y-1 min-w-0">
                            <span className="text-[11px] font-semibold text-slate-500 block truncate">
                                Pengembalian
                            </span>
                            <div className="flex flex-wrap items-baseline gap-2">
                                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 group-hover:text-[#006039] transition-colors">
                                    {stats.aktif}
                                </span>
                                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/70">
                                    Aktif Dipakai
                                </span>
                            </div>
                        </div>
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-900/15 group-hover:scale-105 transition-transform">
                            <RotateCcw className="w-5 h-5" strokeWidth={2} />
                        </div>
                    </Link>

                    <Link
                        href="/layanan/berita"
                        className="group bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-[#006039] hover:shadow-sm transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer"
                    >
                        <div className="space-y-1 min-w-0">
                            <span className="text-[11px] font-semibold text-slate-500 block truncate">
                                Berita &amp; Warta
                            </span>
                            <div className="flex flex-wrap items-baseline gap-2">
                                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 group-hover:text-[#006039] transition-colors">
                                    {stats.berita_total}
                                </span>
                                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/70">
                                    Warta Kampus
                                </span>
                            </div>
                        </div>
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-teal-900/15 group-hover:scale-105 transition-transform">
                            <Newspaper className="w-5 h-5" strokeWidth={2} />
                        </div>
                    </Link>
                </div>

                {/* 3. Tabel Status & Aktivitas Peminjaman Saya (Full-Width, Rapi & Tidak Timpang) */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#006039] border border-emerald-200/60 flex items-center justify-center shrink-0">
                                <ClipboardList className="w-4 h-4" />
                            </div>
                            <div>
                                <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                                    Peminjaman Saya
                                </h2>
                                <p className="text-[11px] text-slate-400">
                                    Daftar pengajuan aktif dan riwayat peminjaman fasilitas
                                </p>
                            </div>
                        </div>

                        <Link
                            href="/layanan/peminjaman"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-emerald-50 text-[#006039] border border-slate-200/80 hover:border-emerald-200 font-bold text-xs transition self-start sm:self-auto shrink-0"
                        >
                            <span>Lihat Semua ({peminjamanSaya.length})</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    {peminjamanSaya.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                                        <th className="py-3.5 px-4 sm:px-5">Fasilitas</th>
                                        <th className="py-3.5 px-4 w-[190px]">Jadwal</th>
                                        <th className="py-3.5 px-4 w-[195px]">Status</th>
                                        <th className="py-3.5 px-4 sm:px-5 text-right w-[160px]">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                    {peminjamanSaya.slice(0, 5).map((p) => {
                                        const s = statusStyle[p.status] ?? {
                                            label: p.status,
                                            className: 'bg-slate-100 text-slate-700 border-slate-200',
                                            dotColor: 'bg-slate-400',
                                        };
                                        const needsReceiptUpload = p.status === 'siap_diambil';
                                        const canReturn = p.status === 'sedang_dipinjam';

                                        return (
                                            <tr
                                                key={p.id}
                                                className="hover:bg-slate-50/70 transition-colors align-middle"
                                            >
                                                <td className="py-3.5 px-4 sm:px-5 min-w-[220px]">
                                                    <p className="font-bold text-slate-900 text-xs leading-snug">
                                                        {p.barang}
                                                    </p>
                                                </td>

                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                                                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                        <span>
                                                            {p.tanggal_mulai} – {p.tanggal_kembali_rencana}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${s.className}`}
                                                    >
                                                        <span className={`w-1.5 h-1.5 rounded-full ${s.dotColor}`} />
                                                        <span>{s.label}</span>
                                                    </span>
                                                </td>

                                                <td className="py-3.5 px-4 sm:px-5 text-right whitespace-nowrap">
                                                    {needsReceiptUpload ? (
                                                        <Link
                                                            href="/layanan/peminjaman"
                                                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#006039] hover:bg-[#0f4c3a] text-white rounded-xl text-[11px] font-bold transition shadow-2xs"
                                                        >
                                                            <Camera className="w-3.5 h-3.5" />
                                                            <span>Upload Bukti</span>
                                                        </Link>
                                                    ) : canReturn ? (
                                                        <Link
                                                            href="/layanan/pengembalian"
                                                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#006039] hover:bg-[#0f4c3a] text-white rounded-xl text-[11px] font-bold transition shadow-2xs"
                                                        >
                                                            <RotateCcw className="w-3.5 h-3.5" />
                                                            <span>Kembalikan</span>
                                                        </Link>
                                                    ) : (
                                                        <Link
                                                            href="/layanan/peminjaman"
                                                            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-[11px] font-bold transition"
                                                        >
                                                            <span>Detail</span>
                                                            <ChevronRight className="w-3.5 h-3.5" />
                                                        </Link>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-10 px-4 space-y-2.5">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-700">Belum Ada Riwayat Peminjaman</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    Pilih sarana atau ruangan yang Anda butuhkan melalui katalog di bawah ini.
                                </p>
                            </div>
                            <Link
                                href="/layanan/sarpras"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#006039] hover:bg-[#0f4c3a] text-white rounded-xl text-xs font-bold transition"
                            >
                                <Box className="w-3.5 h-3.5" />
                                <span>Buka Katalog Sarpras</span>
                            </Link>
                        </div>
                    )}
                </div>

                {/* 4. Fasilitas Siap Dipinjam (Grid 3 Kolom Penuh Tanpa Slot Kosong) */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#006039] border border-emerald-200/60 flex items-center justify-center shrink-0">
                                <Box className="w-4 h-4" />
                            </div>
                            <div>
                                <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                                    Fasilitas Siap Pinjam
                                </h2>
                                <p className="text-[11px] text-slate-400">
                                    Pilih fasilitas untuk langsung mengajukan peminjaman
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/layanan/sarpras"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50/80 hover:bg-emerald-100/80 text-[#006039] border border-emerald-200/70 text-xs font-bold transition self-start sm:self-auto"
                        >
                            <span>Katalog Sarpras ({inventaris.length})</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {inventarisSiap.map((item) => {
                            const JenisIcon = item.jenis === 'prasarana' ? Building2 : Box;
                            return (
                                <Link
                                    key={item.id}
                                    href={`/layanan/sarpras/ajukan?sarpras_id=${item.id}`}
                                    className="group p-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-[#006039] hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-3.5 cursor-pointer"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#006039] to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs shadow-emerald-900/15 group-hover:scale-105 transition-transform">
                                                <JenisIcon className="w-4 h-4" strokeWidth={2} />
                                            </div>
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-[#006039] border border-emerald-200">
                                                <CheckCircle2 className="w-3 h-3" />
                                                <span>
                                                    Tersedia {item.stok_tersedia} {item.satuan}
                                                </span>
                                            </span>
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-mono text-slate-500 font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200/80">
                                                    {item.kode}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-semibold truncate">
                                                    {item.kategori}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug line-clamp-2 mt-1.5 group-hover:text-[#006039] transition-colors">
                                                {item.nama}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
                                        <span className="flex items-center gap-1 text-slate-500 truncate">
                                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            <span className="truncate">{item.lokasi}</span>
                                        </span>
                                        <span className="inline-flex items-center gap-1 font-extrabold text-[#006039] shrink-0 group-hover:translate-x-0.5 transition-transform">
                                            <span>Pinjam</span>
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}

                        {inventarisSiap.length === 0 && (
                            <div className="col-span-full text-center py-8 text-slate-400 space-y-2">
                                <Package className="w-7 h-7 text-slate-300 mx-auto" />
                                <p className="text-xs">Saat ini seluruh fasilitas sedang digunakan.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 5. Informasi & Berita Kampus (Gaya Landing Page: 1 Berita Utama Kiri & List Berita Lainnya Kanan) */}
                {berita && berita.length > 0 ? (() => {
                    const featuredNews = berita[0];
                    const sideNews = berita.slice(1, 5);

                    return (
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#006039] flex items-center justify-center border border-emerald-200/60 shadow-2xs">
                                        <Newspaper className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                                            Informasi &amp; Berita Kampus
                                        </h2>
                                        <p className="text-[11px] text-slate-400">
                                            Pengumuman dan warta resmi seputar fasilitas kampus
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    href="/layanan/berita"
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-emerald-50 text-[#006039] border border-slate-200/80 hover:border-emerald-200 text-xs font-bold transition self-start sm:self-auto"
                                >
                                    <span>Semua Berita</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
                                {/* KIRI: Berita Utama (Featured Story seperti Landing Page) */}
                                <div className={sideNews.length > 0 ? "lg:col-span-7 flex flex-col" : "lg:col-span-12"}>
                                    <Link
                                        href={`/berita/${featuredNews.slug}`}
                                        className="group bg-slate-50/60 hover:bg-white rounded-2xl border border-slate-200/90 hover:border-[#006039]/50 hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full cursor-pointer"
                                    >
                                        <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-slate-950/10 flex items-center justify-center">
                                            <img
                                                src={featuredNews.image || '/images/Hero.png'}
                                                alt={featuredNews.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = '/images/Hero.png';
                                                }}
                                            />
                                            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[10px] font-bold text-[#006039] shadow-xs flex items-center gap-1.5 border border-emerald-100">
                                                <Calendar className="w-3 h-3 text-[#006039]" />
                                                <span>{featuredNews.date}</span>
                                            </div>
                                        </div>

                                        <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between space-y-3">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                                                    <User className="w-3 h-3 text-slate-400" />
                                                    <span>{featuredNews.author || 'Humas Sarpras'}</span>
                                                </div>
                                                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-[#006039] transition-colors line-clamp-2 leading-snug">
                                                    {featuredNews.title}
                                                </h3>
                                                {featuredNews.excerpt && (
                                                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                                        {featuredNews.excerpt}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#006039] group-hover:underline pt-2">
                                                <span>Baca Selengkapnya</span>
                                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    </Link>
                                </div>

                                {/* KANAN: Daftar Berita Samping (Side Stories di dalam Card Pembungkus seperti Landing Page) */}
                                {sideNews.length > 0 && (
                                    <div className="lg:col-span-5 flex flex-col">
                                        <div className="bg-slate-50/50 rounded-2xl border border-slate-200/90 p-4 h-full flex flex-col justify-between space-y-3">
                                            <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                                                <span className="font-bold text-xs text-slate-800">
                                                    Berita Lainnya
                                                </span>
                                                <span className="text-[10px] font-semibold text-slate-400">
                                                    {sideNews.length} Publikasi
                                                </span>
                                            </div>

                                            <div className="space-y-2.5 flex-1">
                                                {sideNews.map((item) => (
                                                    <Link
                                                        key={item.id}
                                                        href={`/berita/${item.slug}`}
                                                        className="group bg-white hover:bg-slate-50/80 rounded-xl border border-slate-200/80 hover:border-[#006039]/40 p-2.5 transition flex items-center gap-3 shadow-2xs hover:shadow-xs cursor-pointer"
                                                    >
                                                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden shrink-0 bg-slate-100 border border-slate-200/70">
                                                            <img
                                                                src={item.image || '/images/Hero.png'}
                                                                alt={item.title}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = '/images/Hero.png';
                                                                }}
                                                            />
                                                        </div>

                                                        <div className="flex-1 min-w-0 space-y-1">
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                                                                <Calendar className="w-3 h-3 text-[#006039]" />
                                                                <span>{item.date}</span>
                                                            </span>
                                                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-[#006039] transition-colors line-clamp-2 leading-tight">
                                                                {item.title}
                                                            </h4>
                                                        </div>

                                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#006039] shrink-0 transition-colors" />
                                                    </Link>
                                                ))}
                                            </div>

                                            <Link
                                                href="/layanan/berita"
                                                className="w-full py-2 bg-white hover:bg-emerald-50 text-[#006039] border border-slate-200/80 hover:border-emerald-200 rounded-xl text-center text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
                                            >
                                                <span>Lihat Seluruh Arsip Berita</span>
                                                <ArrowRight className="w-3.5 h-3.5" />
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })() : (
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 text-center py-8 text-slate-400 space-y-1.5 shadow-2xs">
                        <Newspaper className="w-7 h-7 text-slate-300 mx-auto" />
                        <p className="text-xs">Belum ada pengumuman terbaru.</p>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
