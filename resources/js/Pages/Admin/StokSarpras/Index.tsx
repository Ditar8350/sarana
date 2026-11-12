import React, { useState, useEffect, useMemo } from "react";
import { Head, useForm, router, usePage, Link } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import DeleteConfirmModal from "@/Components/Admin/DeleteConfirmModal";
import {
    Boxes,
    Box,
    Plus,
    Pencil,
    Trash2,
    Search,
    CheckCircle2,
    AlertCircle,
    X,
    Building2,
    UploadCloud,
    Image as ImageIcon,
    Check,
    CheckCircle,
    MapPin,
    Eye,
    Lock,
    Unlock,
    Layers,
    Info,
    ChevronDown,
    Laptop,
    Tag,
} from "lucide-react";

interface SarprasItem {
    id: number;
    kode: string;
    nama: string;
    jenis: "sarana" | "prasarana";
    kategori: string;
    lokasi: string;
    stok_total: number;
    stok_tersedia: number;
    stok_dipinjam: number;
    satuan: string;
    kondisi_umum: "baik" | "rusak_ringan" | "rusak_berat";
    dapat_dipinjam: boolean;
    deskripsi: string | null;
    foto_url: string | null;
}

interface StokSarprasProps {
    sarpras: SarprasItem[];
    kategoriSarana?: string[];
    kategoriPrasarana?: string[];
}

const DEFAULT_KATEGORI_SARANA = [
    "IT & Informatika",
    "Elektronik & Multimedia",
    "Furnitur & Mebel",
    "Peralatan & Perkakas",
    "Olahraga & Seni",
    "Perlengkapan Acara & Protokoler",
    "Lainnya",
];

const DEFAULT_KATEGORI_PRASARANA = [
    "Gedung & Ruangan",
    "Laboratorium",
    "Aula & Auditorium",
    "Fasilitas Olahraga & Lapangan",
    "Lainnya",
];

export const getKategoriBadge = (kategori: string) => {
    const k = (kategori || "").toLowerCase();
    if (k.includes("it") || k.includes("informatika") || k.includes("komputer") || k.includes("pc")) {
        return {
            bg: "bg-blue-50 text-blue-700 border-blue-200/90",
            dot: "bg-blue-500",
            label: kategori || "IT & Informatika",
        };
    }
    if (k.includes("elektronik") || k.includes("multimedia") || k.includes("audio") || k.includes("kamera") || k.includes("proyektor")) {
        return {
            bg: "bg-purple-50 text-purple-700 border-purple-200/90",
            dot: "bg-purple-500",
            label: kategori,
        };
    }
    if (k.includes("furnitur") || k.includes("mebel") || k.includes("meja") || k.includes("kursi") || k.includes("lemari")) {
        return {
            bg: "bg-amber-50 text-amber-700 border-amber-200/90",
            dot: "bg-amber-500",
            label: kategori,
        };
    }
    if (k.includes("perkakas") || k.includes("peralatan") || k.includes("alat") || k.includes("genset") || k.includes("tangga")) {
        return {
            bg: "bg-orange-50 text-orange-700 border-orange-200/90",
            dot: "bg-orange-500",
            label: kategori,
        };
    }
    if (k.includes("olahraga") || k.includes("seni") || k.includes("tenda") || k.includes("matras")) {
        return {
            bg: "bg-emerald-50 text-emerald-700 border-emerald-200/90",
            dot: "bg-emerald-500",
            label: kategori,
        };
    }
    if (k.includes("lab") || k.includes("laboratorium")) {
        return {
            bg: "bg-cyan-50 text-cyan-700 border-cyan-200/90",
            dot: "bg-cyan-500",
            label: kategori,
        };
    }
    if (k.includes("aula") || k.includes("auditorium")) {
        return {
            bg: "bg-indigo-50 text-indigo-700 border-indigo-200/90",
            dot: "bg-indigo-500",
            label: kategori,
        };
    }
    if (k.includes("gedung") || k.includes("ruangan") || k.includes("senat")) {
        return {
            bg: "bg-violet-50 text-violet-700 border-violet-200/90",
            dot: "bg-violet-500",
            label: kategori,
        };
    }
    return {
        bg: "bg-slate-100 text-slate-700 border-slate-200/90",
        dot: "bg-slate-400",
        label: kategori || "Umum",
    };
};

export default function IndexStokSarpras({
    sarpras = [],
    kategoriSarana = DEFAULT_KATEGORI_SARANA,
    kategoriPrasarana = DEFAULT_KATEGORI_PRASARANA,
}: StokSarprasProps) {
    const { flash } = usePage().props as any;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<SarprasItem | null>(null);
    const [detailItem, setDetailItem] = useState<SarprasItem | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [jenisFilter, setJenisFilter] = useState<"semua" | "sarana" | "prasarana" | "siap_pinjam">("semua");
    const [kategoriFilter, setKategoriFilter] = useState<string>("semua");
    const [deleteTarget, setDeleteTarget] = useState<SarprasItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCustomKategori, setIsCustomKategori] = useState(false);

    // Popup notifikasi sementara (auto-close dalam 4 detik + tombol Close)
    const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

    useEffect(() => {
        if (flash?.success) {
            setToast({ type: "success", message: flash.success });
        } else if (flash?.error) {
            setToast({ type: "error", message: flash.error });
        }
    }, [flash?.success, flash?.error]);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => {
            setToast(null);
        }, 4000);
        return () => clearTimeout(timer);
    }, [toast]);

    // Lightbox Modal
    const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

    // Preview lokal foto baru
    const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        kode: "",
        nama: "",
        jenis: "sarana" as "sarana" | "prasarana",
        kategori: "IT & Informatika",
        lokasi: "Gedung A Lt. 1 Sukaraja",
        stok_total: "" as number | string,
        satuan: "Unit",
        kondisi_umum: "baik" as "baik" | "rusak_ringan" | "rusak_berat",
        dapat_dipinjam: true,
        deskripsi: "",
        foto: null as File | null,
    });

    const activeKategoriPresets = useMemo(() => {
        return data.jenis === "sarana"
            ? (kategoriSarana?.length ? kategoriSarana : DEFAULT_KATEGORI_SARANA)
            : (kategoriPrasarana?.length ? kategoriPrasarana : DEFAULT_KATEGORI_PRASARANA);
    }, [data.jenis, kategoriSarana, kategoriPrasarana]);

    // Daftar semua kategori yang ada di sarpras untuk filter
    const availableCategories = useMemo(() => {
        const set = new Set<string>();
        sarpras.forEach((item) => {
            if (item.kategori) set.add(item.kategori.trim());
        });
        return Array.from(set).sort();
    }, [sarpras]);

    const handleOpenCreateModal = () => {
        clearErrors();
        reset();
        setEditingItem(null);
        setLocalPreviewUrl(null);
        setIsCustomKategori(false);
        setData({
            kode: "",
            nama: "",
            jenis: "sarana",
            kategori: "IT & Informatika",
            lokasi: "Gedung A Lt. 1 Sukaraja",
            stok_total: "",
            satuan: "Unit",
            kondisi_umum: "baik",
            dapat_dipinjam: true,
            deskripsi: "",
            foto: null,
        });
        setIsModalOpen(true);
    };

    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            if (params.get("action") === "create") {
                handleOpenCreateModal();
            }
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setData("foto", file);
        if (file && file.type.startsWith("image/")) {
            setLocalPreviewUrl(URL.createObjectURL(file));
        } else {
            setLocalPreviewUrl(null);
        }
    };

    const handleRemoveFile = () => {
        setData("foto", null);
        setLocalPreviewUrl(null);
    };

    const handleEdit = (item: SarprasItem) => {
        clearErrors();
        setDetailItem(null);
        setEditingItem(item);
        setLocalPreviewUrl(null);

        const currentPresets = item.jenis === "sarana" ? DEFAULT_KATEGORI_SARANA : DEFAULT_KATEGORI_PRASARANA;
        const isPreset = currentPresets.includes(item.kategori || "");
        setIsCustomKategori(!isPreset && Boolean(item.kategori));

        setData({
            kode: item.kode,
            nama: item.nama,
            jenis: item.jenis,
            kategori: item.kategori || (item.jenis === "sarana" ? "IT & Informatika" : "Gedung & Ruangan"),
            lokasi: item.lokasi,
            stok_total: item.stok_total,
            satuan: item.satuan,
            kondisi_umum: item.kondisi_umum,
            dapat_dipinjam: item.dapat_dipinjam,
            deskripsi: item.deskripsi ?? "",
            foto: null,
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setLocalPreviewUrl(null);
        setIsCustomKategori(false);
        clearErrors();
        reset();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            post(`/admin/stok-sarpras/${editingItem.id}`, {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: (page: any) => {
                    const msg = page?.props?.flash?.success || `Data ${data.nama} berhasil diperbarui.`;
                    setToast({ type: "success", message: msg });
                    handleCloseModal();
                },
            });
        } else {
            post("/admin/stok-sarpras", {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: (page: any) => {
                    const msg = page?.props?.flash?.success || `Item ${data.nama} berhasil ditambahkan ke stok.`;
                    setToast({ type: "success", message: msg });
                    handleCloseModal();
                },
            });
        }
    };

    const handleConfirmDelete = () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete(`/admin/stok-sarpras/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: (page: any) => {
                const msg = page?.props?.flash?.success;
                const err = page?.props?.flash?.error;
                if (err) {
                    setToast({ type: "error", message: err });
                } else if (msg) {
                    setToast({ type: "success", message: msg });
                }
            },
            onFinish: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    const filtered = sarpras.filter((item) => {
        const matchesFilter =
            jenisFilter === "semua"
                ? true
                : jenisFilter === "siap_pinjam"
                  ? item.dapat_dipinjam && item.stok_tersedia > 0
                  : item.jenis === jenisFilter;

        const matchesKategori =
            kategoriFilter === "semua" || item.kategori === kategoriFilter;

        const q = searchQuery.toLowerCase();
        const matchesSearch =
            item.nama.toLowerCase().includes(q) ||
            item.kode.toLowerCase().includes(q) ||
            item.lokasi.toLowerCase().includes(q) ||
            (item.kategori && item.kategori.toLowerCase().includes(q));

        return matchesFilter && matchesKategori && matchesSearch;
    });

    const totalSarana = sarpras.filter((i) => i.jenis === "sarana").length;
    const totalPrasarana = sarpras.filter((i) => i.jenis === "prasarana").length;
    const totalSiapPinjam = sarpras.filter((i) => i.dapat_dipinjam && i.stok_tersedia > 0).length;

    return (
        <AdminLayout>
            <Head title="Sarana &amp; Prasarana - Biro Sarpras UNUHA" />

            <div className="space-y-5 w-full pb-14 font-sans text-slate-800 text-xs">
                {/* 1. Header Banner Hijau UNUHA - Responsif Rapi Baik Saat Sidebar Terbuka Maupun Tertutup */}
                <div className="bg-[#006039] rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-white shadow-xs relative overflow-hidden flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    {/* Kiri: Judul + Deskripsi */}
                    <div className="min-w-0">
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                                Sarana &amp; Prasarana
                            </h1>
                            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-bold text-emerald-200 border border-white/15">
                                Stok &amp; Aset
                            </span>
                        </div>
                        <p className="text-xs text-emerald-100/90 mt-1 font-normal max-w-xl">
                            Kelola sarpras, lokasi penyimpanan, dan ketersediaan stok pinjam.
                        </p>
                    </div>

                    {/* Kanan: Search Input + Tampilan Katalog + Tambah Sarpras - Selalu Sejajar Rapi */}
                    <div className="flex items-center gap-2.5 sm:gap-3 w-full xl:w-auto flex-wrap sm:flex-nowrap">
                        {/* Search Input */}
                        <div className="relative flex-1 sm:w-52 md:w-60 lg:w-64 min-w-[180px]">
                            <Search className="absolute inset-y-0 left-3 my-auto w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari kode, nama, lokasi..."
                                className="w-full pl-9 pr-8 h-10 bg-white text-slate-800 placeholder-slate-400 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-amber-400 font-medium shadow-xs transition"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="absolute inset-y-0 right-2.5 my-auto text-slate-400 hover:text-slate-600 cursor-pointer"
                                    title="Hapus pencarian"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Tombol Tampilan Katalog */}
                        <Link
                            href="/layanan/sarpras"
                            className="h-10 px-4 bg-[#004e2f] hover:bg-[#003d24] text-white font-bold rounded-xl text-xs transition border border-white/20 flex items-center justify-center shrink-0 cursor-pointer whitespace-nowrap"
                        >
                            <span>Tampilan Katalog</span>
                        </Link>

                        {/* Tombol Tambah Sarpras */}
                        <button
                            type="button"
                            onClick={handleOpenCreateModal}
                            className="h-10 px-4 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4 stroke-[2.5]" />
                            <span>Tambah Sarpras</span>
                        </button>
                    </div>
                </div>

                {/* Popup Notifikasi Sementara */}
                {toast && (
                    <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-md w-full sm:w-auto animate-in fade-in slide-in-from-top-3 duration-200">
                        <div
                            className={`flex items-center justify-between gap-3.5 px-4 py-3.5 rounded-2xl shadow-xl border backdrop-blur-xs ${
                                toast.type === "success"
                                    ? "bg-white border-emerald-200 text-slate-800"
                                    : "bg-white border-rose-200 text-slate-800"
                            }`}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div
                                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                        toast.type === "success"
                                            ? "bg-emerald-50 text-[#006039]"
                                            : "bg-rose-50 text-rose-600"
                                    }`}
                                >
                                    {toast.type === "success" ? (
                                        <CheckCircle2 className="w-4 h-4" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p
                                        className={`text-[10px] font-extrabold uppercase tracking-wider ${
                                            toast.type === "success" ? "text-[#006039]" : "text-rose-600"
                                        }`}
                                    >
                                        {toast.type === "success" ? "Berhasil" : "Perhatian"}
                                    </p>
                                    <p className="text-xs font-semibold text-slate-800 leading-snug">
                                        {toast.message}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setToast(null)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-[11px] font-bold transition cursor-pointer shrink-0"
                            >
                                <span>Close</span>
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* 2. 4 Kartu Filter Ringkasan */}
                <div className="mt-3 sm:mt-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                        {[
                            {
                                key: "semua",
                                title: "TOTAL ASET",
                                count: sarpras.length,
                                subtitle: "semua sarpras",
                            },
                            {
                                key: "sarana",
                                title: "SARANA",
                                count: totalSarana,
                                subtitle: "barang & peralatan",
                            },
                            {
                                key: "prasarana",
                                title: "PRASARANA",
                                count: totalPrasarana,
                                subtitle: "gedung & ruangan",
                            },
                            {
                                key: "siap_pinjam",
                                title: "SIAP PINJAM",
                                count: totalSiapPinjam,
                                subtitle: "status tersedia",
                            },
                        ].map((card) => {
                            const isActive = jenisFilter === card.key;
                            return (
                                <button
                                    key={card.key}
                                    type="button"
                                    onClick={() => setJenisFilter(card.key as any)}
                                    className={`min-h-[98px] sm:min-h-[104px] rounded-2xl p-4 sm:p-4.5 border text-left transition-all duration-200 cursor-pointer shadow-2xs flex flex-col justify-between ${
                                        isActive
                                            ? "bg-[#006039] text-white border-[#006039] shadow-md ring-2 ring-[#006039]/25"
                                            : "bg-white hover:bg-slate-50/90 text-slate-900 border-slate-200/90 hover:-translate-y-0.5"
                                    }`}
                                >
                                    <span
                                        className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider truncate block leading-normal ${
                                            isActive ? "text-emerald-100" : "text-slate-500"
                                        }`}
                                    >
                                        {card.title}
                                    </span>
                                    <div className="mt-2">
                                        <span
                                            className={`text-2xl sm:text-3xl font-black tracking-tight leading-none block ${
                                                isActive ? "text-white" : "text-slate-900"
                                            }`}
                                        >
                                            {card.count}
                                        </span>
                                        <p
                                            className={`text-[10px] sm:text-[11px] font-normal mt-1 ${
                                                isActive ? "text-emerald-100/90" : "text-slate-400"
                                            }`}
                                        >
                                            {card.subtitle}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 3. Kontainer Tabel Utama - Sejajar Presisi dari Header Hingga Baris Data */}
                <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden mt-5 sm:mt-6">
                    {/* Bar Header Tabel: Judul Filter Aktif + Badge + Subtitle + Reset Filter + Dropdown Kategori */}
                    <div className="px-5 sm:px-6 py-4 border-b border-slate-100/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-50/50 via-white to-slate-50/30">
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#006039] ring-4 ring-emerald-100 shrink-0" />
                                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                                    {jenisFilter === "semua"
                                        ? "Semua Aset"
                                        : jenisFilter === "sarana"
                                          ? "Aset Sarana"
                                          : jenisFilter === "prasarana"
                                            ? "Aset Prasarana"
                                            : "Aset Siap Pinjam"}
                                </h2>
                                <span className="inline-flex items-center justify-center px-3 py-0.5 rounded-full bg-emerald-50 text-[#006039] text-xs font-black border border-emerald-200/90 shadow-2xs shrink-0">
                                    {filtered.length}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium mt-1 pl-5.5">
                                Daftar sarana dan prasarana kampus yang terdata aktif di sistem.
                            </p>
                        </div>

                        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap sm:flex-nowrap">
                            {/* Tombol Reset Filter jika sedang memfilter */}
                            {(jenisFilter !== "semua" || kategoriFilter !== "semua" || searchQuery) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setJenisFilter("semua");
                                        setKategoriFilter("semua");
                                        setSearchQuery("");
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#006039] bg-emerald-50/90 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition cursor-pointer shadow-2xs shrink-0"
                                >
                                    <span>Reset Filter</span>
                                </button>
                            )}

                            {/* Dropdown Kategori */}
                            <div className="relative min-w-[150px] sm:min-w-[170px]">
                                <select
                                    value={kategoriFilter}
                                    onChange={(e) => setKategoriFilter(e.target.value)}
                                    className="w-full pl-3.5 pr-8 h-9.5 bg-white border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-700 focus:border-[#006039] focus:ring-1 focus:ring-[#006039] outline-hidden cursor-pointer transition appearance-none shadow-2xs"
                                >
                                    <option value="semua">Semua Kategori</option>
                                    {availableCategories.map((kat) => (
                                        <option key={kat} value={kat}>
                                            {kat}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Tabel Data Sarpras (100% Penuh Pas di Layar, Sejajar dengan Header) */}
                    <div className="w-full overflow-hidden">
                        <table className="w-full table-fixed text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                                    <th className="py-3.5 pl-5 sm:pl-6 pr-2 w-[24%]">NAMA SARPRAS</th>
                                    <th className="py-3.5 px-2 w-[9%]">JENIS</th>
                                    <th className="py-3.5 px-2 w-[14%]">KATEGORI</th>
                                    <th className="py-3.5 px-2 w-[15%]">LOKASI</th>
                                    <th className="py-3.5 px-2 w-[12%]">STOK</th>
                                    <th className="py-3.5 px-2 w-[9%]">STATUS</th>
                                    <th className="py-3.5 pl-1 pr-5 sm:pr-6 text-right w-[17%]">AKSI</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((item) => {
                                    const isOutOfStock = item.stok_tersedia === 0;

                                    return (
                                        <tr
                                            key={item.id}
                                            className="hover:bg-slate-50/70 transition-colors align-middle"
                                        >
                                            {/* Kolom 1: Foto Thumbnail + Nama */}
                                            <td className="py-3.5 pl-5 sm:pl-6 pr-2">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    {item.foto_url ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setPreviewImage({
                                                                    url: item.foto_url!,
                                                                    title: item.nama,
                                                                })
                                                            }
                                                            className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100 cursor-pointer hover:opacity-90 transition shadow-2xs"
                                                            title="Lihat foto"
                                                        >
                                                            <img
                                                                src={item.foto_url}
                                                                alt={item.nama}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </button>
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-lg border border-slate-200/90 bg-slate-50 flex items-center justify-center shrink-0 text-slate-400 shadow-2xs">
                                                            <ImageIcon className="w-3.5 h-3.5 stroke-[1.75]" />
                                                        </div>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={() => setDetailItem(item)}
                                                        className="font-bold text-slate-900 hover:text-[#006039] text-xs leading-snug text-left truncate block transition-colors cursor-pointer"
                                                        title={item.nama}
                                                    >
                                                        {item.nama}
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Kolom 2: Jenis */}
                                            <td className="py-3.5 px-2 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                                        item.jenis === "prasarana"
                                                            ? "bg-purple-100/70 text-purple-700"
                                                            : "bg-blue-100/70 text-blue-700"
                                                    }`}
                                                >
                                                    {item.jenis === "prasarana" ? "Prasarana" : "Sarana"}
                                                </span>
                                            </td>

                                            {/* Kolom 3: Kategori */}
                                            <td className="py-3.5 px-2">
                                                <span
                                                    className="text-slate-700 text-xs font-normal truncate block"
                                                    title={item.kategori}
                                                >
                                                    {item.kategori || "Umum"}
                                                </span>
                                            </td>

                                            {/* Kolom 4: Lokasi */}
                                            <td className="py-3.5 px-2">
                                                <span
                                                    className="text-slate-700 text-xs font-normal truncate block"
                                                    title={item.lokasi}
                                                >
                                                    {item.lokasi}
                                                </span>
                                            </td>

                                            {/* Kolom 5: Stok */}
                                            <td className="py-3.5 px-2 whitespace-nowrap text-left">
                                                <div className="flex items-center gap-1">
                                                    <span className="font-extrabold text-slate-900 text-xs">
                                                        {item.stok_tersedia}/{item.stok_total}
                                                    </span>
                                                    <span className="text-slate-500 font-medium text-[11px] truncate">
                                                        {item.satuan}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Kolom 6: Status */}
                                            <td className="py-3.5 px-2 whitespace-nowrap text-left">
                                                {!item.dapat_dipinjam ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                                        Terkunci
                                                    </span>
                                                ) : isOutOfStock ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100/80 text-amber-800">
                                                        Dipinjam
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100/80 text-emerald-800">
                                                        Tersedia
                                                    </span>
                                                )}
                                            </td>

                                            {/* Kolom 7: Aksi */}
                                            <td className="py-3.5 pl-1 pr-5 sm:pr-6 whitespace-nowrap text-right">
                                                <div className="inline-flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => setDetailItem(item)}
                                                        className="w-7 h-7 rounded-lg bg-white hover:bg-slate-50 border border-slate-200/90 text-emerald-600 flex items-center justify-center transition cursor-pointer shadow-2xs"
                                                        title="Detail Sarpras"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleEdit(item)}
                                                        className="w-7 h-7 rounded-lg bg-white hover:bg-slate-50 border border-slate-200/90 text-emerald-600 flex items-center justify-center transition cursor-pointer shadow-2xs"
                                                        title="Edit Sarpras"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteTarget(item)}
                                                        className="w-7 h-7 rounded-lg bg-white hover:bg-rose-50 border border-slate-200/90 text-rose-500 hover:text-rose-600 hover:border-rose-200 flex items-center justify-center transition cursor-pointer shadow-2xs"
                                                        title="Hapus Sarpras"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="py-12 px-4 text-center text-slate-400">
                                            <p className="font-bold text-slate-700 text-xs">
                                                Tidak ada data sarpras ditemukan
                                            </p>
                                            <p className="text-[11px] text-slate-400 mt-1">
                                                Coba gunakan kata kunci pencarian atau filter yang berbeda.
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* MODAL DETAIL SARPRAS */}
            {detailItem && (
                <div
                    className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
                    onClick={() => setDetailItem(null)}
                >
                    <div
                        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-[#006039] px-5 py-3.5 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <Info className="w-4 h-4 text-emerald-200" />
                                <h3 className="text-sm font-bold">Detail Sarpras</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDetailItem(null)}
                                className="p-1 text-white/80 hover:text-white rounded-lg transition cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4 text-xs">
                            {detailItem.foto_url ? (
                                <div className="w-full h-44 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                                    <img
                                        src={detailItem.foto_url}
                                        alt={detailItem.nama}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="w-full h-28 rounded-xl border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 gap-1">
                                    <ImageIcon className="w-5 h-5 text-slate-300" />
                                    <span className="text-[11px]">Belum ada foto</span>
                                </div>
                            )}

                            <div>
                                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                    <span className="font-mono font-bold text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                                        {detailItem.kode}
                                    </span>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-[#006039]">
                                        {detailItem.jenis === "sarana" ? "Sarana" : "Prasarana"}
                                    </span>
                                    {(() => {
                                        const b = getKategoriBadge(detailItem.kategori);
                                        return (
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border ${b.bg}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${b.dot}`} />
                                                <span>{detailItem.kategori || "Umum"}</span>
                                            </span>
                                        );
                                    })()}
                                </div>
                                <h4 className="text-sm font-extrabold text-slate-900">{detailItem.nama}</h4>
                                {detailItem.deskripsi && (
                                    <p className="text-xs text-slate-500 mt-1">{detailItem.deskripsi}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                                <div>
                                    <span className="text-[10px] text-slate-400 block">Kategori</span>
                                    <span className="font-bold text-slate-800 mt-0.5 block truncate" title={detailItem.kategori}>
                                        {detailItem.kategori || "Umum"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 block">Lokasi</span>
                                    <span className="font-bold text-slate-800 mt-0.5 block truncate" title={detailItem.lokasi}>
                                        {detailItem.lokasi}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 block">Stok</span>
                                    <span className="font-bold text-[#006039] mt-0.5 block">
                                        {detailItem.stok_tersedia} / {detailItem.stok_total} {detailItem.satuan}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setDetailItem(null)}
                                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer"
                                >
                                    Tutup
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleEdit(detailItem)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#006039] hover:bg-[#0f4c3a] text-white font-bold transition cursor-pointer"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                    <span>Edit</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL INPUT / EDIT STOK SARPRAS */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
                    onClick={handleCloseModal}
                >
                    <div
                        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header Modal */}
                        <div className="flex items-center justify-between px-5 py-3.5 bg-[#006039] text-white shrink-0">
                            <div className="flex items-center gap-2.5">
                                {editingItem ? (
                                    <Pencil className="w-4 h-4 text-emerald-200" />
                                ) : (
                                    <Plus className="w-4 h-4 text-emerald-200" />
                                )}
                                <h2 className="text-sm font-bold text-white">
                                    {editingItem ? "Edit Sarana & Prasarana" : "Tambah Sarana & Prasarana Baru"}
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="p-1 text-white/80 hover:text-white rounded-lg transition cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Isi Form */}
                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                            <div className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
                                {/* Pilihan Jenis: Sarana / Prasarana */}
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1.5">
                                        Jenis Sarpras <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsCustomKategori(false);
                                                setData((prev) => ({
                                                    ...prev,
                                                    jenis: "sarana",
                                                    satuan: prev.satuan === "Ruangan" ? "Unit" : prev.satuan,
                                                    kategori: "IT & Informatika",
                                                }));
                                            }}
                                            className={`px-3.5 py-2.5 rounded-xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                                                data.jenis === "sarana"
                                                    ? "border-[#006039] bg-emerald-50/70 shadow-2xs"
                                                    : "border-slate-200 bg-slate-50/60 hover:bg-slate-100/70"
                                            }`}
                                        >
                                            <div
                                                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                                    data.jenis === "sarana"
                                                        ? "bg-[#006039] text-white"
                                                        : "bg-white text-slate-500 border border-slate-200"
                                                }`}
                                            >
                                                <Box className="w-3.5 h-3.5" />
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-900 block leading-tight">Sarana</span>
                                                <span className="text-[10px] text-slate-500">Alat / Barang</span>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsCustomKategori(false);
                                                setData((prev) => ({
                                                    ...prev,
                                                    jenis: "prasarana",
                                                    satuan: "Ruangan",
                                                    kategori: "Gedung & Ruangan",
                                                }));
                                            }}
                                            className={`px-3.5 py-2.5 rounded-xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                                                data.jenis === "prasarana"
                                                    ? "border-[#006039] bg-emerald-50/70 shadow-2xs"
                                                    : "border-slate-200 bg-slate-50/60 hover:bg-slate-100/70"
                                            }`}
                                        >
                                            <div
                                                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                                    data.jenis === "prasarana"
                                                        ? "bg-[#006039] text-white"
                                                        : "bg-white text-slate-500 border border-slate-200"
                                                }`}
                                            >
                                                <Building2 className="w-3.5 h-3.5" />
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-900 block leading-tight">Prasarana</span>
                                                <span className="text-[10px] text-slate-500">Gedung / Ruangan</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Kode & Nama */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">
                                            Kode Barang <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={data.kode}
                                            onChange={(e) => setData("kode", e.target.value)}
                                            placeholder="Contoh: SR-INV-001"
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:border-[#006039] focus:ring-2 focus:ring-[#006039]/15 outline-hidden uppercase transition"
                                        />
                                        {errors.kode && <p className="text-rose-600 text-[11px] mt-1">{errors.kode}</p>}
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="block font-bold text-slate-700 mb-1">
                                            Nama Sarpras <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={data.nama}
                                            onChange={(e) => setData("nama", e.target.value)}
                                            placeholder="Contoh: Komputer PC Lab / Aula Utama"
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] focus:ring-2 focus:ring-[#006039]/15 outline-hidden font-semibold transition"
                                        />
                                        {errors.nama && <p className="text-rose-600 text-[11px] mt-1">{errors.nama}</p>}
                                    </div>
                                </div>

                                {/* Kategori Sarpras */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block font-bold text-slate-700">
                                            Kategori {data.jenis === "sarana" ? "Sarana" : "Prasarana"}{" "}
                                            <span className="text-rose-500">*</span>
                                        </label>
                                        <span className="text-[10px] text-slate-400 font-medium">
                                            {data.jenis === "sarana" ? "Contoh: Komputer/PC masuk IT & Informatika" : "Kategori Ruang/Gedung"}
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="relative">
                                            <select
                                                value={isCustomKategori ? "Lainnya" : (activeKategoriPresets.includes(data.kategori) ? data.kategori : "Lainnya")}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === "Lainnya") {
                                                        setIsCustomKategori(true);
                                                        setData("kategori", "");
                                                    } else {
                                                        setIsCustomKategori(false);
                                                        setData("kategori", val);
                                                    }
                                                }}
                                                className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#006039] focus:ring-2 focus:ring-[#006039]/15 outline-hidden transition appearance-none cursor-pointer"
                                            >
                                                {activeKategoriPresets.map((opt) => (
                                                    <option key={opt} value={opt}>
                                                        {opt}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        </div>

                                        {isCustomKategori && (
                                            <input
                                                type="text"
                                                required
                                                value={data.kategori}
                                                onChange={(e) => setData("kategori", e.target.value)}
                                                placeholder="Ketik nama kategori kustom..."
                                                className="w-full px-3 py-2 bg-white border border-[#006039] rounded-xl text-xs focus:ring-2 focus:ring-[#006039]/15 outline-hidden transition font-semibold"
                                            />
                                        )}
                                    </div>
                                    {errors.kategori && <p className="text-rose-600 text-[11px] mt-1">{errors.kategori}</p>}
                                </div>

                                {/* Lokasi */}
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">
                                        Lokasi Penempatan <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={data.lokasi}
                                        onChange={(e) => setData("lokasi", e.target.value)}
                                        placeholder="Contoh: Gedung A Lt. 1 Sukaraja"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] focus:ring-2 focus:ring-[#006039]/15 outline-hidden transition"
                                    />
                                    {errors.lokasi && <p className="text-rose-600 text-[11px] mt-1">{errors.lokasi}</p>}
                                </div>

                                {/* Stok Total & Satuan */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">
                                            Stok Total <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            required
                                            value={data.stok_total}
                                            onChange={(e) => {
                                                const raw = e.target.value.replace(/\D/g, "");
                                                setData("stok_total", raw === "" ? "" : parseInt(raw, 10));
                                            }}
                                            placeholder="Contoh: 21"
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#006039] focus:ring-2 focus:ring-[#006039]/15 outline-hidden transition"
                                        />
                                        {errors.stok_total && (
                                            <p className="text-rose-600 text-[11px] mt-1">{errors.stok_total}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">
                                            Satuan <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={data.satuan}
                                            onChange={(e) => setData("satuan", e.target.value)}
                                            placeholder="Unit / Set / Ruangan"
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] focus:ring-2 focus:ring-[#006039]/15 outline-hidden transition"
                                        />
                                    </div>
                                </div>

                                {/* Foto Sarpras */}
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Foto Sarpras</label>
                                    {localPreviewUrl ? (
                                        <div className="p-2.5 bg-emerald-50/40 border border-emerald-200 rounded-xl flex items-center gap-3">
                                            <img
                                                src={localPreviewUrl}
                                                alt="Preview"
                                                className="w-11 h-11 object-cover rounded-lg border border-slate-200 shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-slate-800 text-xs truncate">
                                                    {data.foto?.name}
                                                </p>
                                                <p className="text-[10px] text-[#006039]">Siap disimpan</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleRemoveFile}
                                                className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : editingItem?.foto_url ? (
                                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                                            <img
                                                src={editingItem.foto_url}
                                                alt="Foto"
                                                className="w-11 h-11 object-cover rounded-lg border border-slate-200 shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-slate-800 text-xs">Foto Terpasang</p>
                                            </div>
                                            <label className="px-3 py-1.5 bg-white border border-slate-200 hover:border-[#006039] rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer">
                                                Ganti Foto
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                />
                                            </label>
                                        </div>
                                    ) : (
                                        <label className="flex items-center justify-center gap-2 py-3.5 px-4 border border-dashed border-slate-300 hover:border-[#006039] rounded-xl bg-slate-50/70 hover:bg-emerald-50/20 transition cursor-pointer">
                                            <UploadCloud className="w-4 h-4 text-slate-400 shrink-0" />
                                            <span className="text-[11px] font-semibold text-slate-600">
                                                Pilih Foto Barang (Opsional)
                                            </span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>

                                {/* Toggle Izin Pinjam */}
                                <label
                                    htmlFor="dapat_dipinjam"
                                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100/60 transition cursor-pointer"
                                >
                                    <div className="flex items-center gap-2.5">
                                        {data.dapat_dipinjam ? (
                                            <Unlock className="w-4 h-4 text-[#006039]" />
                                        ) : (
                                            <Lock className="w-4 h-4 text-slate-400" />
                                        )}
                                        <span className="font-bold text-slate-800">
                                            Izinkan Dipinjam di Katalog
                                        </span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        id="dapat_dipinjam"
                                        checked={data.dapat_dipinjam}
                                        onChange={(e) => setData("dapat_dipinjam", e.target.checked)}
                                        className="w-4 h-4 text-[#006039] rounded border-slate-300 focus:ring-[#006039]"
                                    />
                                </label>
                            </div>

                            {/* Footer Tombol Simpan & Batal (Selalu Terlihat) */}
                            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end gap-2.5 shrink-0">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-100 transition cursor-pointer text-xs"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2 rounded-xl bg-[#006039] hover:bg-[#0f4c3a] text-white font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60 text-xs shadow-xs"
                                >
                                    <Check className="w-4 h-4" />
                                    <span>{processing ? "Menyimpan..." : "Simpan Sarpras"}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Hapus */}
            <DeleteConfirmModal
                show={Boolean(deleteTarget)}
                title="Hapus Sarpras"
                itemName={deleteTarget?.nama}
                processing={isDeleting}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleConfirmDelete}
            />

            {/* Lightbox Preview Foto */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
                    onClick={() => setPreviewImage(null)}
                >
                    <div
                        className="relative max-w-3xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between text-xs">
                            <span className="font-bold truncate pr-4">{previewImage.title}</span>
                            <button
                                onClick={() => setPreviewImage(null)}
                                className="p-1 hover:bg-white/20 rounded-lg transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-2 overflow-auto max-h-[80vh] flex items-center justify-center bg-slate-950">
                            <img
                                src={previewImage.url}
                                alt="Sarpras"
                                className="max-w-full max-h-[75vh] object-contain rounded-lg"
                            />
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
