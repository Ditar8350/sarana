import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@inertiajs/react";
import { Calendar, User, ArrowRight, ChevronDown } from "lucide-react";

export interface NewsItem {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    image: string;
    date: string;
    author: string;
}

interface BeritaSectionProps {
    news?: NewsItem[];
    bgImage?: string;
}

export function BeritaSection({
    news = [],
    bgImage = "/images/Hero.png",
}: BeritaSectionProps) {
    const [selectedYear, setSelectedYear] = useState<string>("2026");
    const [showAll, setShowAll] = useState<boolean>(false);

    const filteredNews = news.filter((item) =>
        item.date.includes(selectedYear),
    );

    // 1. Berita Utama (Kiri) - 1 Item
    const featuredNews = filteredNews[0];

    // 2. Berita Samping (Kanan) - Maksimal 4 Item
    const sideNews = filteredNews.slice(1, 5);

    // 3. Berita Lainnya (Bawah) - Muncul jika showAll aktif (Grid 3 Kolom)
    const moreNews = showAll ? filteredNews.slice(5) : [];

    const years = ["2026", "2025", "2024", "2023", "2022"];

    return (
        <section
            id="berita"
            className="relative py-16 lg:py-20 font-sans overflow-hidden min-h-[500px]"
        >
            {/* Background Image & Overlay */}
            <img
                src={bgImage}
                alt="Latar Belakang Berita"
                className="absolute inset-0 w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-primary/75 backdrop-blur-sm" />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className="text-sm font-bold text-accent uppercase tracking-widest mb-2">
                            Informasi Terkini
                        </h2>
                        <h3 className="text-3xl sm:text-4xl font-bold text-white font-serif">
                            Berita & Pengumuman
                        </h3>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="relative w-full sm:w-auto"
                    >
                        <select
                            value={selectedYear}
                            onChange={(e) => {
                                setSelectedYear(e.target.value);
                                setShowAll(false);
                            }}
                            className="w-full sm:w-48 appearance-none bg-white/10 border border-white/20 text-white font-medium rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-accent backdrop-blur-md cursor-pointer"
                        >
                            {years.map((year) => (
                                <option key={year} value={year} className="text-black">
                                    Tahun {year}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-white w-5 h-5 pointer-events-none" />
                    </motion.div>
                </div>

                {/* Konten Berita */}
                {filteredNews.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-20 text-center"
                    >
                        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                            <Calendar className="w-8 h-8 text-white/50" />
                        </div>
                        <p className="text-white/80 text-lg font-medium">
                            Belum ada berita atau pengumuman di tahun {selectedYear}.
                        </p>
                    </motion.div>
                ) : (
                    <>
                        {/* --- BAGIAN ATAS (Kiri 1 Berita, Kanan 4 Berita dibungkus Card) --- */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                            {/* KIRI: Berita Utama (Featured) */}
                            <div className={sideNews.length > 0 ? "lg:col-span-7" : "lg:col-span-12"}>
                                <AnimatePresence mode="wait">
                                    {featuredNews && (
                                        <motion.div
                                            key={featuredNews.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.4 }}
                                            className="group bg-primary/75 rounded-2xl overflow-hidden shadow-lg border border-white/10 transition-all duration-300 flex flex-col h-full"
                                        >
                                            <div className="relative h-64 sm:h-80 overflow-hidden bg-slate-950/20 flex items-center justify-center p-2">
                                                <div
                                                    className="absolute inset-0 bg-cover bg-center blur-xl opacity-30 scale-110 pointer-events-none"
                                                    style={{ backgroundImage: `url(${featuredNews.image})` }}
                                                />
                                                <img
                                                    src={featuredNews.image}
                                                    alt={featuredNews.title}
                                                    className="relative z-10 max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500 rounded-lg"
                                                    onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/600x400?text=Berita"; }}
                                                />
                                                <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-bold text-primary shadow-sm flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {featuredNews.date}
                                                </div>
                                            </div>

                                            <div className="p-6 sm:p-8 flex flex-col flex-grow">
                                                <div className="flex items-center gap-2 text-xs text-white mb-3 font-medium">
                                                    <User className="w-3.5 h-3.5" />
                                                    <span>{featuredNews.author}</span>
                                                </div>
                                                <Link href={`/berita/${featuredNews.slug}`} className="block group-hover:text-[#FCB900] transition-colors">
                                                    <h4 className="text-xl sm:text-2xl font-bold text-white mb-4 line-clamp-2 leading-snug">
                                                        {featuredNews.title}
                                                    </h4>
                                                </Link>
                                                <p className="text-base text-white/80 line-clamp-3 mb-6 flex-grow">
                                                    {featuredNews.excerpt}
                                                </p>
                                                <Link href={`/berita/${featuredNews.slug}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[#FCB900] group-hover:text-white transition-colors mt-auto">
                                                    Baca Selengkapnya
                                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                </Link>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* KANAN: Daftar 4 Berita di dalam Card Pembungkus */}
                            {sideNews.length > 0 && (
                                <div className="lg:col-span-5 flex flex-col">
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 h-full flex flex-col gap-4 shadow-xl"
                                    >
                                        <h4 className="text-white font-bold text-lg mb-2 border-b border-white/20 pb-3">
                                            Berita Lainnya
                                        </h4>
                                        <AnimatePresence mode="popLayout">
                                            {sideNews.map((item, index) => (
                                                <motion.div
                                                    key={item.id}
                                                    layout
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                                    className="group bg-primary/60 hover:bg-primary/80 rounded-xl overflow-hidden shadow-sm border border-white/10 transition-all duration-300 flex h-28 sm:h-32"
                                                >
                                                    <div className="relative w-1/3 h-full shrink-0 overflow-hidden bg-slate-100">
                                                        <img
                                                            src={item.image}
                                                            alt={item.title}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                            onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/150x150?text=Berita"; }}
                                                        />
                                                    </div>

                                                    <div className="p-3 sm:p-4 flex flex-col flex-grow justify-center w-2/3">
                                                        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-white/80 mb-1.5 font-medium">
                                                            <Calendar className="w-3 h-3" />
                                                            <span>{item.date}</span>
                                                        </div>
                                                        <Link href={`/berita/${item.slug}`} className="block group-hover:text-[#FCB900] transition-colors mb-1">
                                                            <h4 className="text-sm font-bold text-white line-clamp-2 leading-snug">
                                                                {item.title}
                                                            </h4>
                                                        </Link>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </motion.div>
                                </div>
                            )}
                        </div>

                        {/* --- BAGIAN BAWAH (Berita sisa dalam Grid 3 Kolom) --- */}
                        <AnimatePresence>
                            {showAll && moreNews.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8 border-t border-white/20"
                                >
                                    {moreNews.map((item, index) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.4, delay: index * 0.1 }}
                                            className="group bg-primary/75 rounded-2xl overflow-hidden shadow-lg border border-white/10 transition-all duration-300 flex flex-col h-full"
                                        >
                                            <div className="relative h-48 overflow-hidden bg-slate-950/20 flex items-center justify-center p-2">
                                                <div
                                                    className="absolute inset-0 bg-cover bg-center blur-lg opacity-30 scale-110 pointer-events-none"
                                                    style={{ backgroundImage: `url(${item.image})` }}
                                                />
                                                <img
                                                    src={item.image}
                                                    alt={item.title}
                                                    className="relative z-10 max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500 rounded-md"
                                                    onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x300?text=Berita"; }}
                                                />
                                                <div className="absolute top-3 left-3 z-20 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] font-bold text-primary shadow-sm flex items-center gap-1.5">
                                                    <Calendar className="w-3 h-3" />
                                                    {item.date}
                                                </div>
                                            </div>

                                            <div className="p-5 flex flex-col flex-grow">
                                                <Link href={`/berita/${item.slug}`} className="block group-hover:text-[#FCB900] transition-colors mb-2">
                                                    <h4 className="text-lg font-bold text-white line-clamp-2 leading-snug">
                                                        {item.title}
                                                    </h4>
                                                </Link>
                                                <p className="text-sm text-white/80 line-clamp-2 mb-4 flex-grow">
                                                    {item.excerpt}
                                                </p>
                                                <Link href={`/berita/${item.slug}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FCB900] group-hover:text-white transition-colors mt-auto">
                                                    Baca Selengkapnya
                                                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                                </Link>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Tombol Lihat Semua */}
                        {filteredNews.length > 5 && (
                            <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-12 text-center">
                                <button
                                    onClick={() => setShowAll(!showAll)}
                                    className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl shadow-md transition-all active:scale-95"
                                >
                                    {showAll ? "Tampilkan Lebih Sedikit" : `Lihat Semua Berita (${filteredNews.length})`}
                                </button>
                            </motion.div>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}