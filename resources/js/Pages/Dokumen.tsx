import { Navbar } from "@/Components/Landing/Navbar";
import { Footer } from "@/Components/Landing/Footer";
import { Dokumen, DocumentItem } from "@/Components/Landing/Dok";

export default function DokumenPage({ documents }: { documents?: DocumentItem[] | null }) {
    return (
        <div className="min-h-screen bg-white text-[#111C2D] overflow-x-hidden font-sans">
            <Navbar />
            <Dokumen documents={documents ?? []} />
            <Footer />
        </div>
    );
}
