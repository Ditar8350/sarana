import React, { useState, useMemo } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { PageProps } from '@/types';
import {
    Newspaper,
    Search,
    Calendar,
    User,
    ArrowRight,
    Megaphone,
    X,
} from 'lucide-react';

interface BeritaItem {
    id: number;
    title: string;
    slug: string;
    excerpt?: string;
    image: string;
    date: string;
    author?: string;
}

interface Props {
    berita: BeritaItem[];
}

export default function MahasiswaBeritaIndex({ berita = [] }: Props) {
    const { auth } = usePage<PageProps>().props;
    const isUmum = !auth?.user?.nomor_induk || (auth?.user?.role as string) === 'umum';
    const [cari, setCari] = useState('');

    const filteredBerita = useMemo(() => {
        const q = cari.trim().toLowerCase();
        if (!q) return berita;
        return berita.filter(
            (b) =>
                b.title.toLowerCase().includes(q) ||
                (b.excerpt && b.excerpt.toLowerCase().includes(q)) ||
                (b.author && b.author.toLowerCase().includes(q))
        );
    }, [berita, cari]);

    return (
        <AdminLayout showGlobalSearch={false}>
            <Head
                title={`${
                    isUmum ? 'Informasi & Berita (Layanan Umum)' : 'Informasi & Berita Kampus'
                } - Biro Sarpras UNUHA`}
            />

            <div className="max-w-7xl mx-auto space-y-6 pb-16 px-2 sm:px-4 font-sans text-slate-800 text-xs">
                {/* Header Halaman Informasi & Berita */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#006039] to-emerald-700 text-white flex items-center justify-center shadow-xs shrink-0">
                            <Newspaper className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-[#006039] px-2.5 py-0.5 rounded-full">
                                {isUmum
                                    ? 'PUSAT INFORMASI & PENGUMUMAN (UMUM)'
                                    : 'PUSAT INFORMASI & PENGUMUMAN KAMPUS'}
                            </span>
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                                Informasi &amp; Berita Biro Sarpras
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {isUmum
                                    ? 'Ikuti pengumuman terbaru, jadwal operasional loket, dan informasi layanan sarana prasarana untuk umum.'
                                    : 'Ikuti pengumuman terbaru, pembaruan fasilitas kampus, dan informasi layanan Biro Sarana & Prasarana.'}
                            </p>
                        </div>
                    </div>

                    {/* Kolom Pencarian Berita */}
                    <div className="relative w-full md:w-80 shrink-0">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={cari}
                            onChange={(e) => setCari(e.target.value)}
                            placeholder="Cari judul berita atau pengumuman..."
                            className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] outline-hidden transition"
                        />
                        {cari && (
                            <button
                                type="button"
                                onClick={() => setCari('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Daftar Kartu Berita */}
                {filteredBerita.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredBerita.map((item, idx) => (
                            <Link
                                key={item.id}
                                href={`/berita/${item.slug}`}
                                className="group bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#006039] hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between cursor-pointer"
                            >
                                <div>
                                    {/* Gambar Thumbnail Proporsional Tanpa Terpotong */}
                                    <div className="relative aspect-16/10 w-full bg-slate-900/5 overflow-hidden border-b border-slate-100 flex items-center justify-center p-1">
                                        <div
                                            className="absolute inset-0 bg-cover bg-center blur-lg opacity-25 scale-110 pointer-events-none"
                                            style={{ backgroundImage: `url(${item.image || '/images/Hero.png'})` }}
                                        />
                                        <img
                                            src={item.image || '/images/Hero.png'}
                                            alt={item.title}
                                            className="relative z-10 max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500 rounded-md"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/images/Hero.png';
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent pointer-events-none z-10" />
                                        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-20">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#006039]/95 text-white backdrop-blur-xs shadow-2xs">
                                                <Megaphone className="w-3 h-3" />
                                                <span>{idx === 0 && !cari ? 'Terbaru' : 'Pengumuman'}</span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Isi Ringkasan */}
                                    <div className="p-5 space-y-2.5">
                                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-medium">
                                            <span className="inline-flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5 text-[#006039]" />
                                                <span>{item.date}</span>
                                            </span>
                                            {item.author && (
                                                <>
                                                    <span>•</span>
                                                    <span className="inline-flex items-center gap-1 truncate">
                                                        <User className="w-3.5 h-3.5 text-slate-400" />
                                                        <span className="truncate">{item.author}</span>
                                                    </span>
                                                </>
                                            )}
                                        </div>

                                        <h2 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-[#006039] transition-colors">
                                            {item.title}
                                        </h2>

                                        <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                                            {item.excerpt ||
                                                'Klik untuk membaca informasi dan pengumuman selengkapnya dari Biro Sarana & Prasarana Universitas Nurul Huda.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between text-xs font-bold text-[#006039]">
                                    <span>Baca Selengkapnya</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-14 text-center space-y-3 shadow-xs">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006039] border border-emerald-100 flex items-center justify-center mx-auto">
                            <Newspaper className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-sm">
                                {cari ? 'Berita Tidak Ditemukan' : 'Belum Ada Informasi & Berita'}
                            </h3>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                                {cari
                                    ? 'Coba gunakan kata kunci pencarian lain.'
                                    : 'Pengumuman resmi dari Biro Sarana & Prasarana akan ditampilkan pada halaman ini.'}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
