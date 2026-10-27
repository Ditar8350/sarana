import { motion } from "framer-motion";
import { Eye, Target, CheckCircle2 } from "lucide-react";

interface VisiMisiProps {
    visi?: string;
    misi?: string[];
}

export function VisiMisiSection({
    visi = "Menjadi pusat layanan sarana dan prasarana yang unggul, modern, dan berkelanjutan dalam menyediakan infrastruktur kampus yang aman dan nyaman guna mendukung mutu Tridharma Perguruan Tinggi.",
    misi = [
        "Menyelenggarakan sistem pengelolaan, pemeliharaan, dan inventarisasi sarana prasarana yang tertib, transparan, dan akuntabel sesuai dengan peraturan yang berlaku.",
        "Memberikan layanan penyediaan dan pemeliharaan fasilitas kampus yang prima, cepat, dan responsif untuk mendukung kenyamanan seluruh civitas akademika.",
        "Mengembangkan sistem informasi tata kelola sarana prasarana yang terintegrasi dan berbasis teknologi modern guna meningkatkan efektivitas pengawasan aset.",
        "Meningkatkan kualitas, keamanan, dan keandalan infrastruktur fisik serta fasilitas penunjang kegiatan akademik maupun non-akademik secara berkelanjutan.",
    ],
}: VisiMisiProps) {
    return (
        <section
            id="visi-misi"
            className="py-16 lg:py-20 bg-[#F9F9FF] font-sans relative overflow-hidden"
        >
            {/* Ornamen Latar Belakang */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-soft rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent-soft rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-x-1/2 translate-y-1/2" />

            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="text-center mb-12">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-sm font-bold text-primary uppercase tracking-widest mb-2"
                    >
                        Arah & Tujuan
                    </motion.h2>
                    <motion.h3
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl sm:text-4xl font-bold text-ink font-serif"
                    >
                        Visi & Misi Biro Sarana & Prasarana
                    </motion.h3>
                </div>

                <div className="flex flex-col gap-8 lg:gap-12">
                    {/* Card Visi */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.6 }}
                        className="bg-white rounded-3xl p-8 sm:p-10 shadow-lg shadow-ink/5 border border-primary-soft relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
                        <div className="flex flex-col items-center text-center">
                            <h4 className="text-2xl font-bold text-ink font-serif mb-4">
                                Visi
                            </h4>
                            <p className="text-lg sm:text-xl text-muted leading-relaxed font-medium">
                                "{visi}"
                            </p>
                        </div>
                    </motion.div>

                    {/* Wrapper Misi */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="bg-white rounded-3xl p-8 sm:p-10 shadow-lg shadow-ink/5 border border-surface-container"
                    >
                        <div className="flex flex-col text-center items-center gap-4 mb-8 border-b border-surface-container pb-6">
                            <h4 className="text-2xl font-bold text-ink font-serif">
                                Misi
                            </h4>
                        </div>

                        {/* List Misi Vertikal */}
                        <div className="space-y-6">
                            {misi.map((item, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{
                                        duration: 0.5,
                                        delay: 0.3 + index * 0.1,
                                    }}
                                    className="flex gap-4 group"
                                >
                                    <div className="shrink-0 mt-1">
                                        <CheckCircle2 className="w-6 h-6 text-primary group-hover:text-accent-dark transition-colors duration-300" />
                                    </div>
                                    <p className="text-base sm:text-lg text-muted leading-relaxed">
                                        {item}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
