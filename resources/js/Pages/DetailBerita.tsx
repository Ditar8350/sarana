import { Navbar } from "@/Components/Landing/Navbar";
import { Footer } from "@/Components/Landing/Footer";
import { DetailBerita } from "@/Components/Landing/DetailBerita";

export default function DetailBeritaPage({ news }: { news?: any }) {
    return (
        <div className="min-h-screen bg-white text-[#111C2D] overflow-x-hidden font-sans">
            <Navbar />
            <DetailBerita news={news || undefined} />
            <Footer />
        </div>
    );
}
