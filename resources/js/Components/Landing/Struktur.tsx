import { Head } from "@inertiajs/react";
import { motion } from "framer-motion";
import { Image as ImageIcon } from "lucide-react";

interface StrukturProps {
  image?: string | null;
}

export function StrukturOrganisasi({ image }: StrukturProps) {
  return (
    <>
      <Head title="Struktur Organisasi" />

      {/* HERO SECTION */}
      <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 font-sans overflow-hidden">
        {/* Latar Belakang Gambar */}
        <img
          src="/images/Hero.png"
          alt="Latar Belakang Struktur Organisasi"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        
        {/* Overlay Hijau Transparan */}
        <div className="absolute inset-0 bg-primary/75 backdrop-blur-sm" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-serif mb-4 drop-shadow-sm">
              Struktur Organisasi
            </h1>
            <p className="text-white/80 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Susunan pimpinan dan staf Biro Sarana & Prasarana yang berdedikasi untuk menyediakan infrastruktur dan kenyamanan fasilitas kampus terbaik bagi seluruh civitas akademika Universitas Nurul Huda.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CONTENT SECTION - MENAMPILKAN 1 GAMBAR STRUKTUR ORGANISASI */}
      <section className="py-6 lg:py-6 bg-surface font-sans min-h-[50vh]">
        <div >
          {image ? (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              
            >
              <img
                src={image}
                alt="Bagan Struktur Organisasi Biro Sarana & Prasarana"
                className="w-full h-auto max-h-[100vh] object-contain rounded-2xl"
              />
            </motion.div>
          ) : (
            <div className="bg-white border border-surface-container rounded-3xl shadow-sm p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary-soft text-primary flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-8 h-8" />
              </div>
              <p className="text-muted text-base font-medium">
                Gambar struktur organisasi belum tersedia.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
