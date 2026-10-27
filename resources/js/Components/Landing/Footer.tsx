import { usePage } from "@inertiajs/react";
import {
    MapPin,
    Phone,
    Mail,
    Earth,
    Share2,
    Rss,
    Landmark,
} from "lucide-react";

const quickLinks = [
    { label: "Beranda", href: "#beranda" },
    { label: "Profil", href: "#sambutan" },
    { label: "Berita & Pengumuman", href: "#berita" },
    { label: "Dokumen Unduhan", href: "/dokumen" },
    { label: "Hubungi Kami", href: "#kontak" },
];

const socials = [
    { icon: Earth, label: "Website", href: "https://unuha.ac.id" },
    { icon: Share2, label: "Share", href: "#" },
    { icon: Rss, label: "RSS", href: "#" },
];

export function Footer() {
    const { contact } = usePage().props as any;

    const address =
        contact?.address ||
        "Gedung Rektorat Lt. 1, Kampus A & B, Jl. Kota Baru Desa Sukaraja, Kec. Buay Madang, Kab. OKU Timur, Sumatera Selatan 32312";
    const phone = contact?.phone || "0821-8466-0898";
    const email = contact?.email || "sarpras@unuha.ac.id";
    const telHref = `tel:${phone.replace(/[^0-9+]/g, "")}`;

    return (
        <footer id="kontak" className="bg-[#006039] text-white">
            {/* Main footer */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                    {/* Brand */}
                    <div className="lg:col-span-1">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-[#FCB900] flex items-center justify-center shadow-lg">
                                <Landmark className="w-5 h-5 text-[#111C2D]" />
                            </div>
                            <div>
                                <div
                                    className="text-white font-bold text-sm"
                                    style={{ fontFamily: "var(--font-sans)" }}
                                >
                                    Biro Sarana & Prasarana
                                </div>
                                <div
                                    className="text-[#FCB900] font-extrabold text-sm"
                                    style={{ fontFamily: "var(--font-sans)" }}
                                >
                                    Universitas Nurul Huda
                                </div>
                            </div>
                        </div>
                        <p
                            className="text-white/80 text-sm leading-relaxed mb-6"
                            style={{ fontFamily: "var(--font-sans)" }}
                        >
                            Menyelenggarakan penyediaan dan pemeliharaan
                            fasilitas kampus yang transparan, akuntabel, dan
                            profesional untuk mendukung visi, misi, dan
                            Tridharma Perguruan Tinggi.
                        </p>
                        <div className="flex gap-3">
                            {socials.map((s) => (
                                <a
                                    key={s.label}
                                    href={s.href}
                                    aria-label={s.label}
                                    className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center hover:bg-[#FCB900] hover:text-[#111C2D] transition-colors"
                                >
                                    <s.icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick links */}
                    <div>
                        <h4
                            className="text-sm text-white mb-4"
                            style={{
                                fontFamily: "var(--font-sans)",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                            }}
                        >
                            Navigasi Utama
                        </h4>
                        <ul className="space-y-2.5">
                            {quickLinks.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        className="text-sm text-white/80 hover:text-[#FCB900] transition-colors"
                                        style={{
                                            fontFamily: "var(--font-sans)",
                                        }}
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4
                            className="text-sm text-white mb-4"
                            style={{
                                fontFamily: "var(--font-sans)",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                            }}
                        >
                            Hubungi Kami
                        </h4>
                        <ul className="space-y-4">
                            <li className="flex gap-3">
                                <MapPin className="w-4 h-4 text-[#FCB900] flex-shrink-0 mt-0.5" />
                                <span
                                    className="text-sm text-white/80"
                                    style={{ fontFamily: "var(--font-sans)" }}
                                >
                                    {address}
                                </span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="w-4 h-4 text-[#FCB900] flex-shrink-0" />
                                <a
                                    href={telHref}
                                    className="text-sm text-white/80 hover:text-[#FCB900] transition-colors"
                                    style={{ fontFamily: "var(--font-sans)" }}
                                >
                                    {phone}
                                </a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-[#FCB900] flex-shrink-0" />
                                <a
                                    href={`mailto:${email}`}
                                    className="text-sm text-white/80 hover:text-[#FCB900] transition-colors"
                                    style={{ fontFamily: "var(--font-sans)" }}
                                >
                                    {email}
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Layanan Sarpras */}
                    <div>
                        <h4
                            className="text-sm text-white mb-4"
                            style={{
                                fontFamily: "var(--font-sans)",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                            }}
                        >
                            Layanan
                        </h4>
                        <div className="mt-6 p-4 bg-white/10 rounded-2xl border border-white/15">
                            <p
                                className="text-sm text-[#FCB900] mb-1"
                                style={{
                                    fontFamily: "var(--font-sans)",
                                    fontWeight: 600,
                                }}
                            >
                                Jam Layanan Operasional
                            </p>
                            <p
                                className="text-xs text-white/85"
                                style={{ fontFamily: "var(--font-sans)" }}
                            >
                                Senin – Jumat: 08.00 – 16.00 WIB
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-white/15">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p
                        className="text-xs text-white/75"
                        style={{ fontFamily: "var(--font-sans)" }}
                    >
                        © {new Date().getFullYear()} Biro Sarana & Prasarana Universitas
                        Nurul Huda. Hak Cipta Dilindungi.
                    </p>
                    <div className="flex items-center gap-4">
                        {[
                            "Kebijakan Privasi",
                            "Syarat & Ketentuan",
                            "Sitemap",
                        ].map((link) => (
                            <a
                                key={link}
                                href="#"
                                className="text-xs text-white/75 hover:text-[#FCB900] transition-colors"
                                style={{ fontFamily: "var(--font-sans)" }}
                            >
                                {link}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
