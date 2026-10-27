import { Navbar } from "@/Components/Landing/Navbar";
import { Footer } from "@/Components/Landing/Footer";
import { Hero } from "@/Components/Landing/Hero";
import { Sambutan } from "@/Components/Landing/Sambutan";
import { BeritaSection, NewsItem } from "@/Components/Landing/Berita";
import { VisiMisiSection } from "@/Components/Landing/VisiMisi";

interface LandingProps {
    visitorCount?: number;
    hero?: {
        title?: string;
        subtitle?: string;
        image?: string;
    } | null;
    sambutan?: {
        photo?: string;
        judul_kepala_biro?: string;
        name?: string;
        title?: string;
        message?: string;
    } | null;
    news?: NewsItem[] | null;
    visiMisi?: {
        visi?: string;
        misi?: string[];
    } | null;
}

export default function Landing({ visitorCount, hero, sambutan, news, visiMisi }: LandingProps) {
    return (
        <div className="min-h-screen bg-white text-[#111C2D] overflow-x-hidden font-sans">
            <Navbar />
            <Hero
                title={hero?.title}
                subtitle={hero?.subtitle}
                image={hero?.image}
                visitorCount={visitorCount}
            />
            <Sambutan
                photo={sambutan?.photo}
                judul_kepala_biro={sambutan?.judul_kepala_biro}
                name={sambutan?.name}
                title={sambutan?.title}
                message={sambutan?.message}
            />
            <BeritaSection news={news ?? []} />
            <VisiMisiSection
                visi={visiMisi?.visi}
                misi={visiMisi?.misi}
            />
            <Footer />
        </div>
    );
}
