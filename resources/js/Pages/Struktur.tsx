import { Navbar } from "@/Components/Landing/Navbar";
import { Footer } from "@/Components/Landing/Footer";
import { StrukturOrganisasi } from "@/Components/Landing/Struktur";

interface StrukturPageProps {
    struktur?: {
        id: number;
        image: string;
    } | null;
}

export default function StrukturPage({ struktur }: StrukturPageProps) {
    return (
        <div className="min-h-screen bg-white text-[#111C2D] overflow-x-hidden font-sans">
            <Navbar />
            <StrukturOrganisasi image={struktur?.image} />
            <Footer />
        </div>
    );
}
