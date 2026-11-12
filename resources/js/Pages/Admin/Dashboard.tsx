import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { PageProps } from '@/types';
import {
    RotateCcw,
    Building2,
    Wrench,
    Inbox,
    Check,
    Calendar,
    Layers,
    ArrowRight,
    ExternalLink,
} from 'lucide-react';

interface AntreanValidasiItem {
    id: number;
    kode: string;
    pemohon: string;
    nim_nip: string;
    instansi_prodi: string;
    tanggal_mulai: string;
    tanggal_kembali: string;
    items: string;
}

interface AntreanPengembalianItem {
    id: number;
    kode: string;
    kode_peminjaman: string;
    peminjam: string;
    nim_nip: string;
    tanggal_kembali: string;
    foto_bukti: string | null;
    items: string;
}

interface MaintenanceItem {
    id: number;
    kode_tiket: string;
    nama_sarpras: string;
    lokasi_ruang: string;
    tingkat_urgensi: string;
    status: string;
    nama_teknisi: string | null;
    deskripsi: string;
}

interface NewsItem {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    image: string;
    date: string;
    author: string;
    status: string;
}

interface DashboardProps {
    stats: {
        butuh_validasi: number;
        butuh_inspeksi: number;
        sedang_dipinjam: number;
        total_aset: number;
        siap_pakai: number;
        tiket_servis: number;
        total_berita: number;
        total_dokumen: number;
        total_pengunjung: number;
    };
    antreanValidasi: AntreanValidasiItem[];
    antreanPengembalian: AntreanPengembalianItem[];
    laporanMaintenance: MaintenanceItem[];
    recentNews: NewsItem[];
}

export default function AdminDashboard({
    stats = {
        butuh_validasi: 0,
        butuh_inspeksi: 0,
        sedang_dipinjam: 0,
        total_aset: 0,
        siap_pakai: 0,
        tiket_servis: 0,
        total_berita: 0,
        total_dokumen: 0,
        total_pengunjung: 2044,
    },
    antreanValidasi = [],
    antreanPengembalian = [],
    laporanMaintenance = [],
    recentNews = [],
}: DashboardProps) {
    const { auth } = usePage<PageProps>().props;
    const [tabAntrean, setTabAntrean] = useState<'pinjam' | 'kembali'>('pinjam');

    const newsItems = recentNews.slice(0, 3);

    const getMaintenanceStatusBadge = (status: string) => {
        const s = status?.toLowerCase() || '';
        if (s === 'menunggu_tinjauan' || s === 'menunggu') {
            return {
                dotColor: 'bg-rose-500',
                badgeBg: 'bg-rose-50 text-rose-700 border-rose-200/80',
                label: 'Menunggu',
            };
        }
        if (s === 'selesai') {
            return {
                dotColor: 'bg-emerald-500',
                badgeBg: 'bg-emerald-50 text-[#006039] border-emerald-200/80',
                label: 'Selesai',
            };
        }
        // status disetujui / dalam_pengerjaan / dalam_antrian
        return {
            dotColor: 'bg-amber-500',
            badgeBg: 'bg-amber-50 text-amber-800 border-amber-200/80',
            label: 'Dalam Antrian',
        };
    };

    return (
        <AdminLayout>
            <Head title="Dashboard Layanan Sarpras - Biro Sarpras UNUHA" />

            <div className="w-full space-y-4 pb-10 font-sans text-slate-800 text-xs">
                {/* 1. HEADER: PROPORSI PAS, TIDAK TERLALU BESAR */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                            Halo, {auth?.user?.name || 'Administrator Sarpras'}
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Selamat datang kembali di dashboard Anda.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                        <Link
                            href="/admin/peminjaman"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 hover:border-slate-400 rounded-xl font-bold text-xs transition cursor-pointer shadow-2xs"
                        >
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>Cek Peminjaman</span>
                        </Link>
                        <Link
                            href="/layanan/sarpras"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#006039] hover:bg-[#0f4c3a] text-white rounded-xl font-bold text-xs shadow-xs transition cursor-pointer"
                        >
                            <Layers className="w-3.5 h-3.5 text-emerald-200" />
                            <span>Sarana &amp; Prasarana</span>
                        </Link>
                    </div>
                </div>

                {/* 2. EMPAT KARTU METRIK KPI (RINGKAS, RAPI, NYAMAN DILIHAT) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* Kartu 1: Peminjaman Masuk */}
                    <Link
                        href="/admin/peminjaman"
                        className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-2xs hover:border-amber-300 hover:shadow-xs transition flex flex-col justify-between cursor-pointer group"
                    >
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-700 truncate">
                                Peminjaman Masuk
                            </span>
                            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 group-hover:scale-105 transition-transform">
                                <Inbox className="w-3.5 h-3.5" strokeWidth={2} />
                            </div>
                        </div>
                        <div className="text-2xl sm:text-3xl font-black text-slate-900 my-1 leading-tight group-hover:text-amber-600 transition-colors">
                            {stats.butuh_validasi}
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">
                            Permohonan baru
                        </span>
                    </Link>

                    {/* Kartu 2: Pengembalian Loket */}
                    <Link
                        href="/admin/pengembalian"
                        className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-2xs hover:border-blue-300 hover:shadow-xs transition flex flex-col justify-between cursor-pointer group"
                    >
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-700 truncate">
                                Pengembalian Loket
                            </span>
                            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 group-hover:scale-105 transition-transform">
                                <RotateCcw className="w-3.5 h-3.5" strokeWidth={2} />
                            </div>
                        </div>
                        <div className="text-2xl sm:text-3xl font-black text-slate-900 my-1 leading-tight group-hover:text-blue-600 transition-colors">
                            {stats.butuh_inspeksi}
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">
                            Proses hari ini
                        </span>
                    </Link>

                    {/* Kartu 3: Sarana & Prasarana */}
                    <Link
                        href="/admin/stok-sarpras"
                        className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-2xs hover:border-[#006039] hover:shadow-xs transition flex flex-col justify-between cursor-pointer group"
                    >
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-700 truncate">
                                Sarana &amp; Prasarana
                            </span>
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#006039] flex items-center justify-center shrink-0 border border-emerald-100 group-hover:scale-105 transition-transform">
                                <Building2 className="w-3.5 h-3.5" strokeWidth={2} />
                            </div>
                        </div>
                        <div className="text-2xl sm:text-3xl font-black text-slate-900 my-1 leading-tight group-hover:text-[#006039] transition-colors">
                            {stats.total_aset}
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">
                            Aset terdaftar
                        </span>
                    </Link>

                    {/* Kartu 4: Pemeliharaan & Servis */}
                    <Link
                        href="/admin/maintenance"
                        className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-2xs hover:border-purple-300 hover:shadow-xs transition flex flex-col justify-between cursor-pointer group"
                    >
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-700 truncate">
                                Pemeliharaan &amp; Servis
                            </span>
                            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100 group-hover:scale-105 transition-transform">
                                <Wrench className="w-3.5 h-3.5" strokeWidth={2} />
                            </div>
                        </div>
                        <div className="text-2xl sm:text-3xl font-black text-slate-900 my-1 leading-tight group-hover:text-purple-600 transition-colors">
                            {stats.tiket_servis}
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">
                            Sedang diperbaiki
                        </span>
                    </Link>
                </div>

                {/* 3. BARIS DUA KOLOM: ANTREAN PRIORITAS LOKET & PERBAIKAN FASILITAS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                    {/* Kartu Kiri: Antrean Prioritas Loket */}
                    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-4.5 flex flex-col justify-between">
                        <div>
                            {/* Header Antrean dengan Pill Switcher */}
                            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
                                <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                                    Antrean Prioritas Loket
                                </h2>

                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setTabAntrean('pinjam')}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                            tabAntrean === 'pinjam'
                                                ? 'bg-amber-100/90 text-amber-900 border border-amber-200/80 shadow-2xs'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        Peminjaman ({antreanValidasi.length})
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setTabAntrean('kembali')}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                            tabAntrean === 'kembali'
                                                ? 'bg-blue-100/90 text-blue-900 border border-blue-200/80 shadow-2xs'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        Pengembalian ({antreanPengembalian.length})
                                    </button>
                                </div>
                            </div>

                            {/* Konten Antrean: Jika Kosong Tampilkan Elegan & Pas */}
                            {((tabAntrean === 'pinjam' && antreanValidasi.length === 0) ||
                                (tabAntrean === 'kembali' && antreanPengembalian.length === 0)) ? (
                                <div className="py-7 sm:py-8 flex flex-col items-center justify-center space-y-2.5">
                                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                                        <Check className="w-5 h-5 stroke-[3]" />
                                    </div>
                                    <p className="text-xs sm:text-sm font-bold text-slate-800 text-center">
                                        Semua Permohonan Selesai Diproses
                                    </p>
                                </div>
                            ) : tabAntrean === 'pinjam' ? (
                                <div className="divide-y divide-slate-100 mt-1">
                                    {antreanValidasi.map((item) => (
                                        <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                                            <div className="min-w-0 space-y-0.5">
                                                <div className="flex items-center gap-1.5 truncate">
                                                    <h4 className="font-bold text-slate-900 text-xs truncate">
                                                        {item.pemohon}
                                                    </h4>
                                                    {item.instansi_prodi && (
                                                        <span className="text-[10px] text-slate-400 truncate">• {item.instansi_prodi}</span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-slate-600 truncate">
                                                    {item.items} • <span className="text-slate-400">{item.tanggal_mulai}</span>
                                                </p>
                                            </div>
                                            <Link
                                                href="/admin/peminjaman"
                                                className="px-3 py-1 bg-[#006039] hover:bg-[#0f4c3a] text-white rounded-lg text-[11px] font-bold transition shrink-0 shadow-2xs"
                                            >
                                                Tinjau
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 mt-1">
                                    {antreanPengembalian.map((item) => (
                                        <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                                            <div className="min-w-0 space-y-0.5">
                                                <h4 className="font-bold text-slate-900 text-xs truncate">
                                                    {item.peminjam}
                                                </h4>
                                                <p className="text-[11px] text-slate-600 truncate">
                                                    {item.items} • <span className="text-slate-400">{item.tanggal_kembali}</span>
                                                </p>
                                            </div>
                                            <Link
                                                href="/admin/pengembalian"
                                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition shrink-0 shadow-2xs"
                                            >
                                                Cek Fisik
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Kartu Kanan: Perbaikan Fasilitas */}
                    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-4.5 flex flex-col justify-between">
                        <div>
                            <div className="pb-2.5 border-b border-slate-100 flex items-center justify-between gap-2">
                                <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                                    Perbaikan Fasilitas
                                </h2>
                                <Link
                                    href="/admin/maintenance"
                                    className="text-xs font-bold text-[#006039] hover:underline inline-flex items-center gap-0.5"
                                >
                                    <span>Kelola</span>
                                    <ArrowRight className="w-3 h-3" />
                                </Link>
                            </div>

                            <div className="divide-y divide-slate-100 mt-1">
                                {laporanMaintenance.length === 0 ? (
                                    <div className="py-7 sm:py-8 text-center text-slate-400">
                                        <p className="text-xs font-bold text-slate-700">Seluruh Fasilitas Berfungsi Baik</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">Tidak ada laporan kerusakan aktif.</p>
                                    </div>
                                ) : (
                                    laporanMaintenance.map((m) => {
                                        const badge = getMaintenanceStatusBadge(m.status);
                                        return (
                                            <Link
                                                key={m.id}
                                                href="/admin/maintenance"
                                                className="py-2.5 px-2 flex items-center justify-between gap-2 hover:bg-slate-50/80 rounded-xl transition cursor-pointer"
                                            >
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    <span className={`w-2 h-2 rounded-full shrink-0 ${badge.dotColor}`} />
                                                    <span className="font-semibold text-xs text-slate-800 truncate" title={`${m.nama_sarpras} ${m.lokasi_ruang ? ` - ${m.lokasi_ruang}` : ''}`}>
                                                        {m.nama_sarpras}{m.lokasi_ruang ? ` - ${m.lokasi_ruang}` : ''}
                                                    </span>
                                                </div>

                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${badge.badgeBg}`}>
                                                    {badge.label}
                                                </span>
                                            </Link>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. BARIS KETIGA: BERITA & WARTA (SEIMBANG & PROPORSIONAL) */}
                <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-4.5">
                    <div className="pb-2.5 border-b border-slate-100 flex items-center justify-between gap-2">
                        <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                            Berita &amp; Warta
                        </h2>
                        <Link
                            href="/admin/berita"
                            className="text-xs font-bold text-[#006039] hover:underline inline-flex items-center gap-0.5"
                        >
                            <span>Lihat Semua</span>
                            <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>

                    {newsItems.length === 0 ? (
                        <div className="py-6 text-center text-slate-400">
                            <p className="text-xs font-bold text-slate-700">Belum Ada Berita yang Diterbitkan</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 mt-3">
                            {newsItems.map((item) => (
                                <Link
                                    key={item.id}
                                    href={`/berita/${item.slug}`}
                                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50/80 border border-transparent hover:border-slate-200/80 transition group cursor-pointer"
                                >
                                    <div className="w-16 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200/80">
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/images/Hero.png';
                                            }}
                                        />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-bold text-slate-900 text-xs line-clamp-1 leading-snug group-hover:text-[#006039] transition">
                                            {item.title}
                                        </h4>
                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                            {item.date}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
