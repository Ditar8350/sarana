import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Newspaper, FileText, Users, ArrowRight, Clock } from 'lucide-react';

// Tipe Data Props
type NewsItem = { id: number; title: string; date: string; status: 'Aktif' | 'Draft' };
type DocumentItem = { id: number; title: string; type: string; category: string };

interface DashboardProps {
    stats: {
        total_berita: number;
        total_dokumen: number;
        total_pengunjung: number;
    };
    recentNews: NewsItem[];
    recentDocuments: DocumentItem[];
}

// Komponen Card KPI Internal
function KpiCard({ title, value, icon: Icon }: { title: string; value: string | number; icon: any }) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-surface-container shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-soft flex items-center justify-center text-primary shrink-0">
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-sm font-semibold text-muted">{title}</p>
                <h3 className="text-2xl font-bold text-ink">{value}</h3>
            </div>
        </div>
    );
}

// Komponen Header Seksi
function SectionHeader({ title, href, linkLabel }: { title: string; href: string; linkLabel: string }) {
    return (
        <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-ink">{title}</h3>
            <Link href={href} className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors flex items-center gap-1">
                {linkLabel}
                <ArrowRight className="w-4 h-4" />
            </Link>
        </div>
    );
}

export default function Dashboard({ 
    stats = { total_berita: 0, total_dokumen: 0, total_pengunjung: 0 },
    recentNews = [], 
    recentDocuments = [] 
}: DashboardProps) {
    
    return (
        <AdminLayout>
            <Head title="Dashboard - Admin Biro Sarpras" />
            
            <div className="space-y-6">
                
                {/* Header Title */}
                <div>
                    <h1 className="text-2xl font-bold text-ink font-serif">Dashboard Admin</h1>
                    <p className="text-sm text-muted mt-1">Ringkasan data informasi publik Biro Sarana & Prasarana Universitas Nurul Huda.</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <KpiCard title="Total Berita" value={stats.total_berita} icon={Newspaper} />
                    <KpiCard title="Total Dokumen" value={stats.total_dokumen} icon={FileText} />
                    <KpiCard title="Total Pengunjung" value={stats.total_pengunjung.toLocaleString('id-ID')} icon={Users} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Seksi Berita Terbaru */}
                    <div className="bg-white p-6 rounded-2xl border border-surface-container shadow-sm">
                        <SectionHeader title="Berita Terbaru" href="/admin/berita" linkLabel="Kelola Berita" />
                        
                        {recentNews.length === 0 ? (
                            <div className="text-center py-8 text-muted text-sm border-2 border-dashed border-surface-container rounded-xl">
                                Belum ada berita yang dipublikasikan.
                            </div>
                        ) : (
                            <ul className="divide-y divide-surface-container">
                                {recentNews.map((news) => (
                                    <li key={news.id} className="py-3 flex items-start justify-between gap-3">
                                        <div>
                                            <h4 className="font-semibold text-ink text-sm mb-1 line-clamp-1">{news.title}</h4>
                                            <div className="flex items-center gap-2 text-xs text-muted">
                                                <Clock className="w-3.5 h-3.5" />
                                                {news.date}
                                            </div>
                                        </div>
                                        <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold ${news.status === 'Aktif' ? 'bg-[#E3F1EA] text-[#006039]' : 'bg-slate-100 text-muted'}`}>
                                            {news.status}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Seksi Dokumen Terbaru */}
                    <div className="bg-white p-6 rounded-2xl border border-surface-container shadow-sm">
                        <SectionHeader title="Dokumen Unduhan" href="/admin/dokumen" linkLabel="Kelola Dokumen" />
                        
                        {recentDocuments.length === 0 ? (
                            <div className="text-center py-8 text-muted text-sm border-2 border-dashed border-surface-container rounded-xl">
                                Belum ada dokumen yang diunggah.
                            </div>
                        ) : (
                            <ul className="divide-y divide-surface-container">
                                {recentDocuments.map((doc) => (
                                    <li key={doc.id} className="py-3 flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-surface-low flex items-center justify-center text-primary shrink-0">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-ink text-sm mb-1 line-clamp-1">{doc.title}</h4>
                                                <div className="flex items-center gap-2 text-xs font-medium text-muted">
                                                    <span className="bg-surface-container px-2 py-0.5 rounded uppercase">{doc.type}</span>
                                                    <span>•</span>
                                                    <span>{doc.category}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                </div>
            </div>
        </AdminLayout>
    );
}