import { motion } from "framer-motion";
import { Quote } from "lucide-react";

// Mendefinisikan tipe data props agar dinamis dari database admin
interface SambutanProps {
    photo?: string;
    judul_kepala_biro?: string;
    name?: string;
    title?: string;
    message?: string;
}

export function Sambutan({
    photo = "/images/Kepala-sarpras.jpeg", // Fallback gambar default
    judul_kepala_biro = "Kepala Biro Sarana & Prasarana",
    name = "Bpk Agus Darmawan, S.Pd.",
    title = "Kepala Biro Sarana & Prasarana",
    message = "Selamat datang di portal resmi Biro Sarana dan Prasarana Universitas Nurul Huda. Kami hadir untuk menyediakan infrastruktur dan layanan fasilitas yang berkualitas, transparan, dan profesional demi mendukung kenyamanan seluruh civitas akademika dalam mewujudkan visi dan misi perguruan tinggi. Melalui sistem informasi ini, kami berharap pengelolaan sarana prasarana menjadi lebih terpadu, efektif, dan efisien.",
}: SambutanProps) {
    return (
        <section
            id="sambutan"
            className="py-14 lg:py-18 bg-surface font-sans overflow-hidden"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
                    {/* Bagian Kiri - Foto Kepala Biro */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                        className="w-full lg:w-5/12 flex justify-center lg:justify-end"
                    >
                        <div className="relative w-64 sm:w-80 lg:w-full max-w-sm">
                            {/* Ornamen dekorasi di belakang foto */}
                            <div className="absolute inset-0 translate-x-4 translate-y-4 sm:translate-x-6 sm:translate-y-6 rounded-2xl bg-primary-soft -z-10" />
                            <div className="absolute inset-0 -translate-x-3 -translate-y-3 sm:-translate-x-4 sm:-translate-y-4 rounded-2xl bg-accent-soft border border-accent/20 -z-10" />

                            {/* Gambar utama */}
                            <img
                                src={photo}
                                alt={`Foto ${name}`}
                                className="w-full h-auto aspect-[4/5] object-cover rounded-2xl shadow-xl shadow-ink/5 border border-white"
                            />
                        </div>
                    </motion.div>

                    {/* Bagian Kanan - Teks Sambutan */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{
                            duration: 0.7,
                            ease: "easeOut",
                            delay: 0.2,
                        }}
                        className="w-full lg:w-7/12"
                    >
                        {/* Header Judul */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-primary-soft flex items-center justify-center text-primary shrink-0">
                                <Quote className="w-6 h-6 fill-primary/20" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-primary uppercase tracking-widest">
                                    Sambutan
                                </h2>
                                <h3 className="text-2xl sm:text-3xl font-bold text-ink mt-1 font-serif">
                                    {judul_kepala_biro}
                                </h3>
                            </div>
                        </div>

                        {/* Isi Pesan */}
                        <div className="text-muted mb-8 leading-relaxed text-base sm:text-lg text-justify">
                            <p className="pb-2">
                                <i>Assalamualaikum wr.wb.</i>
                            </p>
                            <p>{message}</p>
                        </div>

                        {/* Nama dan Jabatan */}
                        <div className="border-l-4 border-accent pl-4">
                            <p className="text-xl font-bold text-ink font-serif">
                                {name}
                            </p>
                            <p className="text-sm text-primary font-medium mt-0.5">
                                {title}
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
