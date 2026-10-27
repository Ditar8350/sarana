import { useState, useEffect } from "react";
import { Head } from "@inertiajs/react";
import { motion } from "framer-motion";
import { Users } from "lucide-react";

interface HeroProps {
    image?: string;
    title?: string;
    subtitle?: string;
    visitorCount?: number;
}

export function Hero({
    image = "/Images/Hero.png",
    title = "Biro Sarana & Prasarana Universitas Nurul Huda",
    subtitle = "Mewujudkan tata kelola sarana dan prasarana yang transparan, akuntabel, serta profesional guna mendukung visi dan misi perguruan tinggi.",
    visitorCount = 2000,
}: HeroProps) {
    // State untuk animasi hitung angka pengunjung
    const [count, setCount] = useState(0);

    useEffect(() => {
        const duration = 1500; // durasi animasi 1.5 detik
        const steps = 60;
        const interval = duration / steps;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            const progress = step / steps;
            const ease = 1 - Math.pow(1 - progress, 3); // ease-out effect
            setCount(Math.round(ease * visitorCount));

            if (step >= steps) clearInterval(timer);
        }, interval);

        return () => clearInterval(timer);
    }, [visitorCount]);

    const renderTitle = () => {
        const highlight = "Universitas Nurul Huda";
        if (title.includes(highlight)) {
            const parts = title.split(highlight);
            return (
                <>
                    {parts[0].trim()}{" "}
                    <br className="hidden sm:inline" />
                    <span className="italic text-accent">{highlight}</span>
                    {parts[1] ? ` ${parts[1]}` : ""}
                </>
            );
        }
        return title;
    };

    return (
        <>
            <Head title="Beranda" />
            <section id="beranda" className="relative bg-white">
                <div className="relative overflow-hidden min-h-[420px] lg:min-h-[520px] flex items-center">
                    {/* Background Image Dinamis */}
                    <img
                        src={image || "/Images/Hero.png"}
                        alt="Biro Sarana & Prasarana Universitas Nurul Huda"
                        className="absolute inset-0 w-full h-full object-cover object-right lg:object-center"
                    />

                    {/* Gradient Overlay */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background:
                                "linear-gradient(90deg, rgba(0, 74, 44, 0.95) 0%, rgba(0, 96, 57, 0.85) 50%, rgba(0, 96, 57, 0.35) 85%, rgba(0, 96, 57, 0.0) 100%)",
                        }}
                    />

                    {/* Konten Teks */}
                    <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-18 font-sans">
                        <motion.div
                            initial={{ opacity: 0, y: 28 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, ease: "easeOut" }}
                            className="max-w-2xl"
                        >
                            {/* Pill Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-primary shadow-md mb-6">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                <span className="text-xs sm:text-sm font-semibold tracking-wide">
                                    Portal Informasi Resmi
                                </span>
                            </div>

                            {/* Judul Hero */}
                            <h1 className="font-serif text-4xl sm:text-5xl lg:text-[56px] font-bold text-white leading-[1.15] mb-6 drop-shadow-sm">
                                {renderTitle()}
                            </h1>

                            {/* Sub Judul / Deskripsi */}
                            <p className="text-base sm:text-lg text-white/90 max-w-xl leading-relaxed mb-8">
                                {subtitle}
                            </p>

                            {/* Section Counter Pengunjung */}
                            <div className="mt-8 pt-6 border-t border-white/25 max-w-lg">
                                <div className="flex items-center gap-4">
                                    {/* Kotak Ikon Kiri */}
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                                        <Users className="w-3 h-3 sm:w-6 sm:h-6 text-white" />
                                    </div>

                                    {/* Teks Kanan */}
                                    <div>
                                        <p className="text-xs sm:text-sm font-medium text-white/90 leading-snug">
                                            Website telah dikunjungi
                                        </p>
                                        <p className="text-1xl sm:text-2xl font-bold text-white tracking-tight leading-tight my-0.5">
                                            {count.toLocaleString("id-ID")}{" "}
                                            pengunjung
                                        </p>
                                        <p className="text-xs sm:text-[13px] text-white/80 leading-snug">
                                            Total kunjungan website Biro
                                            Sarpras
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>
        </>
    );
}
