import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Navbar } from '@/Components/Landing/Navbar';
import { Footer } from '@/Components/Landing/Footer';
import { DetailBerita } from '@/Components/Landing/DetailBerita';
import { PageProps } from '@/types';
import { ArrowLeft, Calendar, User, Newspaper, Edit3 } from 'lucide-react';
import { sanitizeHtml, sanitizeUrl } from '@/utils/sanitize';

interface NewsData {
    id: number;
    title: string;
    slug: string;
    content: string;
    image: string;
    date: string;
    author: string;
    status?: string;
}

export default function DetailBeritaPage({ news }: { news?: NewsData | null }) {
    const { auth } = usePage<PageProps>().props;
    const isAuthenticated = Boolean(auth?.user);
    const userRole = (auth?.user?.role as string) || '';
    const canManageNews = userRole === 'admin' || userRole === 'staf';

    // Jika diakses dari dalam Dashboard (semua role yang sudah login), tetap gunakan AdminLayout agar tidak keluar ke Landing Page
    if (isAuthenticated) {
        const safeContent = news ? sanitizeHtml(news.content) : '';
        const safeImage = news ? sanitizeUrl(news.image, '/images/Hero.png') : '/images/Hero.png';

        return (
            <AdminLayout showGlobalSearch={false}>
                <Head title={news ? `${news.title} - Biro Sarpras UNUHA` : 'Berita Tidak Ditemukan'} />

                <div className="max-w-4xl mx-auto space-y-5 pb-16 px-2 sm:px-4 font-sans text-slate-800">
                    {/* Bar Navigasi Atas */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <Link
                                href={canManageNews ? '/dashboard' : '/layanan/berita'}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-[#006039] rounded-xl border border-slate-200/90 font-bold text-xs shadow-2xs transition cursor-pointer"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>{canManageNews ? 'Kembali ke Dashboard' : 'Kembali ke Informasi & Berita'}</span>
                            </Link>
                            {!canManageNews && (
                                <Link
                                    href="/dashboard"
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
                                >
                                    <span>Ke Dashboard</span>
                                </Link>
                            )}
                        </div>

                        {canManageNews && (
                            <Link
                                href="/admin/berita"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#006039] rounded-xl border border-emerald-200 font-bold text-xs transition cursor-pointer"
                            >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Kelola Berita</span>
                            </Link>
                        )}
                    </div>

                    {!news ? (
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center space-y-3 shadow-xs">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                                <Newspaper className="w-6 h-6" />
                            </div>
                            <h1 className="text-lg font-extrabold text-slate-900">Berita Tidak Ditemukan</h1>
                            <p className="text-xs text-slate-500 max-w-md mx-auto">
                                Informasi atau pengumuman yang Anda cari tidak tersedia atau telah dihapus.
                            </p>
                            <div className="pt-2">
                                <Link
                                    href="/dashboard"
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#006039] hover:bg-[#0f4c3a] text-white rounded-xl font-bold text-xs transition"
                                >
                                    <span>Kembali ke Dashboard</span>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <article className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
                            {/* Gambar Cover Artikel Tanpa Terpotong */}
                            <div className="relative w-full overflow-hidden bg-slate-950/5 border-b border-slate-100 flex items-center justify-center p-2 sm:p-4 min-h-[260px]">
                                <div
                                    className="absolute inset-0 bg-cover bg-center blur-2xl opacity-20 scale-110 pointer-events-none"
                                    style={{ backgroundImage: `url(${safeImage})` }}
                                />
                                <img
                                    src={safeImage}
                                    alt={news.title}
                                    className="relative z-10 max-h-[520px] w-auto max-w-full object-contain rounded-2xl shadow-sm transition"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/images/Hero.png';
                                    }}
                                />
                                <div className="absolute top-4 left-4 z-20">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-[#006039]/95 text-white shadow-sm backdrop-blur-xs">
                                        <Newspaper className="w-3.5 h-3.5" />
                                        <span>Informasi &amp; Pengumuman Kampus</span>
                                    </span>
                                </div>
                            </div>

                            {/* Isi Artikel */}
                            <div className="p-6 sm:p-8 lg:p-10 space-y-6">
                                <header className="space-y-4 pb-5 border-b border-slate-100">
                                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 leading-snug">
                                        {news.title}
                                    </h1>

                                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-emerald-50 text-[#006039] border border-emerald-200/70 flex items-center justify-center">
                                                <User className="w-3.5 h-3.5" />
                                            </div>
                                            <span>
                                                Oleh <strong className="text-slate-800">{news.author || 'Humas Biro Sarpras'}</strong>
                                            </span>
                                        </div>

                                        <span className="text-slate-300">•</span>

                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-[#006039]" />
                                            <span>Diterbitkan: {news.date}</span>
                                        </div>
                                    </div>
                                </header>

                                <div
                                    className="prose prose-sm sm:prose-base prose-slate max-w-none text-slate-700 leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: safeContent }}
                                />
                            </div>
                        </article>
                    )}
                </div>
            </AdminLayout>
        );
    }

    // Jika diakses oleh pengunjung publik (belum login) dari Landing Page
    return (
        <div className="min-h-screen bg-white text-[#111C2D] overflow-x-hidden font-sans">
            <Navbar />
            <DetailBerita news={news || undefined} />
            <Footer />
        </div>
    );
}
