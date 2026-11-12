import React, { useMemo, useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    Search,
    MapPin,
    Building2,
    Package,
    CheckCircle2,
    ArrowRight,
    Maximize2,
    X,
    Boxes,
    SlidersHorizontal,
    AlertCircle,
    Tag,
    ChevronDown,
    Info,
    Plus,
} from 'lucide-react';

interface SarprasItem {
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
    dapat_dipinjam: boolean;
    deskripsi: string | null;
    foto_url: string | null;
}

interface StatusKelayakan {
    eligible: boolean;
    alasan: string;
    pesan: string;
    kode?: string;
    nominal?: number;
}

interface Props {
    sarpras: SarprasItem[];
    statusKelayakan?: StatusKelayakan | null;
}

type TabFilter = 'semua' | 'tersedia' | 'sarana' | 'prasarana';

export const getKategoriBadge = (kategori: string) => {
    const k = (kategori || '').toLowerCase();
    if (k.includes('it') || k.includes('informatika') || k.includes('komputer') || k.includes('pc')) {
        return {
            bg: 'bg-blue-50 text-blue-700 border-blue-200/90',
            dot: 'bg-blue-500',
        };
    }
    if (k.includes('elektronik') || k.includes('multimedia') || k.includes('audio') || k.includes('kamera') || k.includes('proyektor')) {
        return {
            bg: 'bg-purple-50 text-purple-700 border-purple-200/90',
            dot: 'bg-purple-500',
        };
    }
    if (k.includes('furnitur') || k.includes('mebel') || k.includes('meja') || k.includes('kursi') || k.includes('lemari')) {
        return {
            bg: 'bg-amber-50 text-amber-700 border-amber-200/90',
            dot: 'bg-amber-500',
        };
    }
    if (k.includes('perkakas') || k.includes('peralatan') || k.includes('alat') || k.includes('genset') || k.includes('tangga')) {
        return {
            bg: 'bg-orange-50 text-orange-700 border-orange-200/90',
            dot: 'bg-orange-500',
        };
    }
    if (k.includes('olahraga') || k.includes('seni') || k.includes('tenda') || k.includes('matras')) {
        return {
            bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/90',
            dot: 'bg-emerald-500',
        };
    }
    if (k.includes('lab') || k.includes('laboratorium')) {
        return {
            bg: 'bg-cyan-50 text-cyan-700 border-cyan-200/90',
            dot: 'bg-cyan-500',
        };
    }
    if (k.includes('aula') || k.includes('auditorium')) {
        return {
            bg: 'bg-indigo-50 text-indigo-700 border-indigo-200/90',
            dot: 'bg-indigo-500',
        };
    }
    if (k.includes('gedung') || k.includes('ruangan')) {
        return {
            bg: 'bg-violet-50 text-violet-700 border-violet-200/90',
            dot: 'bg-violet-500',
        };
    }
    return {
        bg: 'bg-slate-100 text-slate-700 border-slate-200/90',
        dot: 'bg-slate-400',
    };
};

export default function MahasiswaSarprasIndex({ sarpras = [], statusKelayakan = null }: Props) {
    const { auth, flash } = usePage().props as any;
    const userRole = (auth?.user?.role as string) || '';
    const isAdmin = userRole === 'admin';
    const isStaf = userRole === 'staf';
    const isPengelola = isAdmin || isStaf;

    const [dismissFlash, setDismissFlash] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<TabFilter>('semua');
    const [selectedKategori, setSelectedKategori] = useState<string>('semua');
    const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
    const [detailItem, setDetailItem] = useState<SarprasItem | null>(null);

    const isItemReady = (item: SarprasItem) => item.dapat_dipinjam && item.stok_tersedia > 0;

    const totalSarana = useMemo(() => sarpras.filter((s) => s.jenis === 'sarana').length, [sarpras]);
    const totalPrasarana = useMemo(() => sarpras.filter((s) => s.jenis === 'prasarana').length, [sarpras]);
    const totalReady = useMemo(() => sarpras.filter(isItemReady).length, [sarpras]);

    // Daftar Kategori Unik
    const availableCategories = useMemo(() => {
        const set = new Set<string>();
        sarpras.forEach((item) => {
            if (item.kategori) set.add(item.kategori.trim());
        });
        return Array.from(set).sort();
    }, [sarpras]);

    const tabs: { id: TabFilter; label: string; count: number; icon?: React.ReactNode }[] = [
        { id: 'semua', label: 'Semua', count: sarpras.length },
        { id: 'tersedia', label: 'Siap Pinjam', count: totalReady },
        { id: 'sarana', label: 'Sarana', count: totalSarana, icon: <Package className="w-3.5 h-3.5" /> },
        { id: 'prasarana', label: 'Prasarana', count: totalPrasarana, icon: <Building2 className="w-3.5 h-3.5" /> },
    ];

    const filtered = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return sarpras
            .filter((item) => {
                const matchesSearch =
                    !q ||
                    item.nama.toLowerCase().includes(q) ||
                    item.kode.toLowerCase().includes(q) ||
                    item.lokasi.toLowerCase().includes(q) ||
                    (item.kategori && item.kategori.toLowerCase().includes(q));

                let matchesTab = true;
                if (activeTab === 'tersedia') {
                    matchesTab = isItemReady(item);
                } else if (activeTab === 'sarana') {
                    matchesTab = item.jenis === 'sarana';
                } else if (activeTab === 'prasarana') {
                    matchesTab = item.jenis === 'prasarana';
                }

                const matchesKategori =
                    selectedKategori === 'semua' || item.kategori === selectedKategori;

                return matchesSearch && matchesTab && matchesKategori;
            })
            .sort((a, b) => Number(isItemReady(b)) - Number(isItemReady(a)));
    }, [sarpras, searchQuery, activeTab, selectedKategori]);

    return (
        <AdminLayout>
            <Head title="Sarana &amp; Prasarana - Biro Sarpras UNUHA" />

            <div className="w-full space-y-5 pb-14 font-sans text-slate-800 text-xs">
                {/* Notifikasi Flash Sukses */}
                {flash?.success && !dismissFlash && (
                    <div className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 animate-in fade-in duration-200">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-bold text-emerald-950">{flash.success}</p>
                                {!isPengelola && (
                                    <Link
                                        href="/layanan/peminjaman"
                                        className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline"
                                    >
                                        Pantau status di menu Layanan Peminjaman <ArrowRight className="w-3 h-3" />
                                    </Link>
                                )}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setDismissFlash(true)}
                            className="p-1 rounded-lg text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
                            aria-label="Tutup notifikasi"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}

                {/* Banner Peringatan Belum Mengembalikan / Ada Tanggungan Denda */}
                {statusKelayakan && !statusKelayakan.eligible && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 p-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-amber-900 shadow-2xs animate-in fade-in duration-200">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5 text-amber-700">
                                <AlertCircle className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="font-bold text-xs text-amber-950">
                                    Pengajuan Peminjaman Baru Ditangguhkan
                                </p>
                                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                                    {statusKelayakan.pesan}
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/layanan/pengembalian"
                            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 transition"
                        >
                            {statusKelayakan.alasan === 'tanggungan_denda' ? 'Lihat Denda & Selesaikan' : 'Ke Menu Pengembalian'}
                        </Link>
                    </div>
                )}

                {/* 1. Header Banner Hijau UNUHA - Tampilan Selaras di Semua Role */}
                <div className="bg-[#006039] rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-white shadow-xs relative overflow-hidden flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    {/* Kiri: Judul + Badge + Deskripsi */}
                    <div className="min-w-0">
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                                Sarana &amp; Prasarana
                            </h1>
                            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-bold text-emerald-200 border border-white/15">
                                {isPengelola ? 'Stok & Aset' : 'Katalog Fasilitas'}
                            </span>
                        </div>
                        <p className="text-xs text-emerald-100/90 mt-1 font-normal max-w-xl">
                            {isPengelola
                                ? 'Kelola sarpras, lokasi penyimpanan, dan ketersediaan stok pinjam.'
                                : 'Pilih sarana atau prasarana kampus yang ingin Anda pinjam untuk kebutuhan kegiatan.'}
                        </p>
                    </div>

                    {/* Kanan: Search Input + Action Buttons */}
                    <div className="flex items-center gap-2.5 sm:gap-3 w-full xl:w-auto flex-wrap sm:flex-nowrap">
                        {/* Search Input */}
                        <div className="relative flex-1 sm:w-52 md:w-60 lg:w-64 min-w-[180px]">
                            <Search className="absolute inset-y-0 left-3 my-auto w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari kode, nama, lokasi..."
                                className="w-full pl-9 pr-8 h-10 bg-white text-slate-800 placeholder-slate-400 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-amber-400 font-medium shadow-xs transition"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute inset-y-0 right-2.5 my-auto text-slate-400 hover:text-slate-600 cursor-pointer"
                                    title="Hapus pencarian"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Action Buttons Sesuai Role */}
                        {isPengelola ? (
                            <>
                                <Link
                                    href="/admin/stok-sarpras"
                                    className="h-10 px-4 bg-[#004e2f] hover:bg-[#003d24] text-white font-bold rounded-xl text-xs transition border border-white/20 flex items-center justify-center shrink-0 cursor-pointer whitespace-nowrap"
                                >
                                    <span>Tampilan Tabel</span>
                                </Link>

                                <Link
                                    href="/admin/stok-sarpras?action=create"
                                    className="h-10 px-4 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap"
                                >
                                    <Plus className="w-4 h-4 stroke-[2.5]" />
                                    <span>Tambah Sarpras</span>
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/layanan/peminjaman"
                                    className="h-10 px-4 bg-[#004e2f] hover:bg-[#003d24] text-white font-bold rounded-xl text-xs transition border border-white/20 flex items-center justify-center shrink-0 cursor-pointer whitespace-nowrap"
                                >
                                    <span>Riwayat Pinjam</span>
                                </Link>

                                <Link
                                    href="/layanan/sarpras/ajukan"
                                    className="h-10 px-4 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap"
                                >
                                    <Plus className="w-4 h-4 stroke-[2.5]" />
                                    <span>Ajukan Pinjam</span>
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* 2. 4 Kartu Filter Ringkasan */}
                <div className="mt-3 sm:mt-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                        {[
                            {
                                key: 'semua',
                                title: 'TOTAL ASET',
                                count: sarpras.length,
                                subtitle: 'semua sarpras',
                            },
                            {
                                key: 'sarana',
                                title: 'SARANA',
                                count: totalSarana,
                                subtitle: 'barang & peralatan',
                            },
                            {
                                key: 'prasarana',
                                title: 'PRASARANA',
                                count: totalPrasarana,
                                subtitle: 'gedung & ruangan',
                            },
                            {
                                key: 'tersedia',
                                title: 'SIAP PINJAM',
                                count: totalReady,
                                subtitle: 'status tersedia',
                            },
                        ].map((card) => {
                            const isActive = activeTab === card.key;
                            return (
                                <button
                                    key={card.key}
                                    type="button"
                                    onClick={() => setActiveTab(card.key as TabFilter)}
                                    className={`min-h-[98px] sm:min-h-[104px] rounded-2xl p-4 sm:p-4.5 border text-left transition-all duration-200 cursor-pointer shadow-2xs flex flex-col justify-between ${
                                        isActive
                                            ? 'bg-[#006039] text-white border-[#006039] shadow-md ring-2 ring-[#006039]/25'
                                            : 'bg-white hover:bg-slate-50/90 text-slate-900 border-slate-200/90 hover:-translate-y-0.5'
                                    }`}
                                >
                                    <span
                                        className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider truncate block leading-normal ${
                                            isActive ? 'text-emerald-100' : 'text-slate-500'
                                        }`}
                                    >
                                        {card.title}
                                    </span>
                                    <div className="mt-2">
                                        <span
                                            className={`text-2xl sm:text-3xl font-black tracking-tight leading-none block ${
                                                isActive ? 'text-white' : 'text-slate-900'
                                            }`}
                                        >
                                            {card.count}
                                        </span>
                                        <p
                                            className={`text-[10px] sm:text-[11px] font-normal mt-1 ${
                                                isActive ? 'text-emerald-100/90' : 'text-slate-400'
                                            }`}
                                        >
                                            {card.subtitle}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 3. Bar Filter Kategori & Info Aktif */}
                <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#006039] ring-4 ring-emerald-100 shrink-0" />
                            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                                {activeTab === 'semua'
                                    ? 'Semua Fasilitas Kampus'
                                    : activeTab === 'sarana'
                                      ? 'Aset Sarana (Barang & Peralatan)'
                                      : activeTab === 'prasarana'
                                        ? 'Aset Prasarana (Gedung & Ruangan)'
                                        : 'Fasilitas Siap Pinjam'}
                            </h2>
                            <span className="inline-flex items-center justify-center px-3 py-0.5 rounded-full bg-emerald-50 text-[#006039] text-xs font-black border border-emerald-200/90 shadow-2xs shrink-0">
                                {filtered.length}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-1 pl-5.5">
                            {isPengelola
                                ? 'Daftar sarana dan prasarana kampus yang terdata aktif di sistem.'
                                : 'Pilih fasilitas yang tersedia untuk melihat rincian atau mengajukan peminjaman.'}
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap sm:flex-nowrap">
                        {/* Tombol Reset Filter jika sedang memfilter */}
                        {(activeTab !== 'semua' || selectedKategori !== 'semua' || searchQuery) && (
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveTab('semua');
                                    setSelectedKategori('semua');
                                    setSearchQuery('');
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#006039] bg-emerald-50/90 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition cursor-pointer shadow-2xs shrink-0"
                            >
                                <span>Reset Filter</span>
                            </button>
                        )}

                        {/* Dropdown Kategori dengan Spasi Ikon Presisi */}
                        <div className="relative min-w-[160px] sm:min-w-[185px]">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                                <Tag className="w-3.5 h-3.5" />
                            </div>
                            <select
                                value={selectedKategori}
                                onChange={(e) => setSelectedKategori(e.target.value)}
                                className="w-full pl-9 pr-8 h-10 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:border-[#006039] focus:ring-1 focus:ring-[#006039] outline-hidden cursor-pointer transition appearance-none shadow-2xs"
                            >
                                <option value="semua">Semua Kategori</option>
                                {availableCategories.map((kat) => (
                                    <option key={kat} value={kat}>
                                        {kat}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-slate-400">
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grid Fasilitas Sarpras (Responsif Nyaman: 2 Kolom di Tablet/Laptop Kecil, 3 di Laptop Standar, 4 di Layar Besar) */}
                {filtered.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 min-[1800px]:grid-cols-5 gap-4.5 sm:gap-5">
                        {filtered.map((item) => {
                            const isReady = isItemReady(item);
                            const isPrasarana = item.jenis === 'prasarana';
                            const isClickable = !isPengelola && isReady;

                            return (
                                <div
                                    key={item.id}
                                    className={`group flex flex-col rounded-2xl border bg-white overflow-hidden transition-all duration-300 shadow-2xs hover:shadow-md ${
                                        isClickable
                                            ? 'border-slate-200/90 hover:border-[#006039]/60'
                                            : 'border-slate-200/80'
                                    }`}
                                >
                                    {/* Thumbnail Gambar Proporsional 16:10 */}
                                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-50 flex items-center justify-center border-b border-slate-100">
                                        {item.foto_url ? (
                                            <img
                                                src={item.foto_url}
                                                alt={item.nama}
                                                loading="lazy"
                                                className={`w-full h-full object-cover transition-transform duration-500 ${
                                                    isReady ? 'group-hover:scale-105' : 'grayscale'
                                                }`}
                                            />
                                        ) : (
                                            /* Placeholder Halus & Elegan */
                                            <div
                                                className={`w-full h-full flex items-center justify-center relative ${
                                                    isPrasarana
                                                        ? 'bg-gradient-to-br from-purple-50/40 via-slate-50 to-slate-100/60'
                                                        : 'bg-gradient-to-br from-emerald-50/40 via-slate-50 to-slate-100/60'
                                                }`}
                                            >
                                                <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-200/70 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                                                    {isPrasarana ? (
                                                        <Building2 className="w-6 h-6 text-purple-600" strokeWidth={1.75} />
                                                    ) : (
                                                        <Package className="w-6 h-6 text-[#006039]" strokeWidth={1.75} />
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Badge Jenis Fasilitas (Glassmorphism) */}
                                        <div className="absolute top-2.5 left-2.5">
                                            <span className="backdrop-blur-md bg-white/95 text-slate-800 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs inline-flex items-center gap-1.5">
                                                <span
                                                    className={`w-1.5 h-1.5 rounded-full ${
                                                        isPrasarana ? 'bg-purple-500' : 'bg-emerald-500'
                                                    }`}
                                                />
                                                <span>{isPrasarana ? 'Prasarana' : 'Sarana'}</span>
                                            </span>
                                        </div>

                                        {/* Badge Status Ketersediaan */}
                                        <div className="absolute top-2.5 right-2.5">
                                            {isReady ? (
                                                <span className="backdrop-blur-md bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-2xs inline-flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                    <span>Tersedia</span>
                                                </span>
                                            ) : (
                                                <span className="backdrop-blur-md bg-slate-900/85 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-lg shadow-2xs">
                                                    {item.dapat_dipinjam ? 'Stok Habis' : 'Khusus Internal'}
                                                </span>
                                            )}
                                        </div>

                                        {/* Tombol Perbesar Foto */}
                                        {item.foto_url && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setPreviewImage({ url: item.foto_url!, title: item.nama });
                                                }}
                                                className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition cursor-pointer backdrop-blur-xs shadow-xs"
                                                title="Perbesar foto"
                                            >
                                                <Maximize2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Informasi Rincian Kartu */}
                                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                        <div className="space-y-1.5">
                                            {/* Baris Kategori & Kode */}
                                            <div className="flex items-center justify-between gap-1.5 text-[10px]">
                                                {item.kategori ? (
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold border truncate max-w-[140px] ${
                                                            getKategoriBadge(item.kategori).bg
                                                        }`}
                                                        title={item.kategori}
                                                    >
                                                        <span
                                                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                                                getKategoriBadge(item.kategori).dot
                                                            }`}
                                                        />
                                                        <span className="truncate">{item.kategori}</span>
                                                    </span>
                                                ) : <div />}
                                                <span
                                                    className="font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60 shrink-0"
                                                    title={item.kode}
                                                >
                                                    #{item.kode}
                                                </span>
                                            </div>

                                            {/* Nama Sarpras (Tinggi Konsisten min-h-[36px] agar Baris Bawah Rata) */}
                                            <h3
                                                className="font-extrabold text-xs sm:text-[13px] text-slate-900 leading-snug line-clamp-2 min-h-[36px] group-hover:text-[#006039] transition-colors"
                                                title={item.nama}
                                            >
                                                {item.nama}
                                            </h3>

                                            {/* Lokasi Fasilitas */}
                                            <p className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate pt-0.5">
                                                <MapPin className="w-3.5 h-3.5 text-[#006039] shrink-0" />
                                                <span className="truncate font-medium">{item.lokasi || 'Lokasi belum diatur'}</span>
                                            </p>
                                        </div>

                                        {/* Bagian Bawah: Stok & Tombol Aksi (Tidak Akan Terpotong / Bungkus) */}
                                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
                                            {/* Info Stok */}
                                            {isPrasarana ? (
                                                <div className="text-[11px] text-slate-500 min-w-0">
                                                    <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">
                                                        Kapasitas
                                                    </span>
                                                    <strong className="text-slate-900 text-xs font-black truncate block">
                                                        {item.stok_tersedia > 0 ? 'Siap Pakai' : 'Dipakai'}
                                                    </strong>
                                                </div>
                                            ) : (
                                                <div className="text-[11px] text-slate-500 min-w-0">
                                                    <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">
                                                        Stok Pinjam
                                                    </span>
                                                    <div className="text-slate-900 text-xs truncate">
                                                        <span className="font-black">{item.stok_tersedia}</span>
                                                        <span className="text-slate-400 font-bold">
                                                            {' '}/ {item.stok_total} {item.satuan}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Tombol Aksi & Info */}
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => setDetailItem(item)}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0"
                                                    title="Lihat rincian spesifikasi fasilitas"
                                                >
                                                    <Info className="w-4 h-4" />
                                                </button>

                                                {!isPengelola && (
                                                    isReady ? (
                                                        statusKelayakan && !statusKelayakan.eligible ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => alert(statusKelayakan.pesan)}
                                                                className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200 font-bold text-xs inline-flex items-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0"
                                                            >
                                                                <span>Ajukan</span>
                                                                <ArrowRight className="w-3.5 h-3.5" />
                                                            </button>
                                                        ) : (
                                                            <Link
                                                                href={`/layanan/sarpras/ajukan?sarpras_id=${item.id}`}
                                                                className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-[#006039] text-[#006039] hover:text-white border border-emerald-200 hover:border-[#006039] font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-2xs group/btn cursor-pointer whitespace-nowrap shrink-0"
                                                            >
                                                                <span>Ajukan</span>
                                                                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                                                            </Link>
                                                        )
                                                    ) : (
                                                        <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-semibold border border-slate-200/70 inline-block whitespace-nowrap shrink-0">
                                                            Tidak Tersedia
                                                        </span>
                                                    )
                                                )}

                                                {isPengelola && (
                                                    <span
                                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap shrink-0 ${
                                                            isReady
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                                                : 'bg-slate-100 text-slate-500 border border-slate-200/60'
                                                        }`}
                                                    >
                                                        {isReady ? 'Tersedia' : 'Habis'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-16 px-4 text-center bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                            <SlidersHorizontal className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-sm">Tidak ada fasilitas yang cocok</h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Coba ubah kata kunci pencarian atau ganti pilihan tab filter di atas.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setSearchQuery('');
                                setActiveTab('semua');
                                setSelectedKategori('semua');
                            }}
                            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                        >
                            Reset Filter
                        </button>
                    </div>
                )}
            </div>

            {/* Modal Detail Fasilitas Sarpras */}
            {detailItem && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 overflow-y-auto"
                    onClick={() => setDetailItem(null)}
                >
                    <div
                        className="relative max-w-lg w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 space-y-4 p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/70">
                                    #{detailItem.kode}
                                </span>
                                <h3 className="text-base font-extrabold text-slate-900 mt-1">
                                    {detailItem.nama}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDetailItem(null)}
                                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Foto / Placeholder di Modal */}
                        <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200/70">
                            {detailItem.foto_url ? (
                                <img
                                    src={detailItem.foto_url}
                                    alt={detailItem.nama}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="text-center p-6 space-y-2 text-slate-400">
                                    {detailItem.jenis === 'prasarana' ? (
                                        <Building2 className="w-10 h-10 mx-auto text-purple-400" />
                                    ) : (
                                        <Package className="w-10 h-10 mx-auto text-emerald-500" />
                                    )}
                                    <p className="text-xs font-semibold">Foto fasilitas belum diunggah</p>
                                </div>
                            )}
                        </div>

                        {/* Grid Spesifikasi Singkat */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                                <span className="text-[10px] text-slate-400 uppercase font-bold">Kategori</span>
                                <p className="font-extrabold text-slate-900">{detailItem.kategori || '-'}</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                                <span className="text-[10px] text-slate-400 uppercase font-bold">Jenis</span>
                                <p className="font-extrabold text-slate-900 uppercase">{detailItem.jenis}</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                                <span className="text-[10px] text-slate-400 uppercase font-bold">Lokasi Penempatan</span>
                                <p className="font-extrabold text-slate-900">{detailItem.lokasi || '-'}</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                                <span className="text-[10px] text-slate-400 uppercase font-bold">Ketersediaan Stok</span>
                                <p className="font-extrabold text-slate-900">
                                    {detailItem.stok_tersedia} / {detailItem.stok_total} {detailItem.satuan}
                                </p>
                            </div>
                        </div>

                        {/* Deskripsi Tambahan */}
                        {detailItem.deskripsi && (
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                                <span className="text-[10px] text-slate-400 uppercase font-bold">Keterangan / Catatan</span>
                                <p className="text-slate-700 leading-relaxed">{detailItem.deskripsi}</p>
                            </div>
                        )}

                        {/* Footer Modal Aksi */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setDetailItem(null)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                            >
                                Tutup
                            </button>

                            {!isPengelola && isItemReady(detailItem) && (
                                <Link
                                    href={`/layanan/sarpras/ajukan?sarpras_id=${detailItem.id}`}
                                    className="px-4 py-2 bg-[#006039] hover:bg-[#004d2e] text-white rounded-xl text-xs font-bold shadow-xs transition inline-flex items-center gap-1.5"
                                >
                                    <span>Ajukan Peminjaman</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Lightbox Foto */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
                    onClick={() => setPreviewImage(null)}
                >
                    <div
                        className="relative max-w-3xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-3 bg-slate-900 text-white flex items-center justify-between text-xs border-b border-slate-800">
                            <span className="font-bold truncate pr-3">{previewImage.title}</span>
                            <button
                                type="button"
                                onClick={() => setPreviewImage(null)}
                                className="p-1 hover:bg-white/10 rounded-lg transition cursor-pointer"
                                aria-label="Tutup foto"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-2 flex items-center justify-center bg-black">
                            <img
                                src={previewImage.url}
                                alt={previewImage.title}
                                className="max-w-full max-h-[75vh] object-contain rounded-lg"
                            />
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
