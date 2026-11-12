import React, { useState } from "react";
import { Head, useForm, router, usePage } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import DeleteConfirmModal from "@/Components/Admin/DeleteConfirmModal";
import {
    Newspaper,
    Plus,
    Pencil,
    Trash2,
    Calendar,
    User,
    UploadCloud,
    X,
    CheckCircle2,
    AlertCircle,
    Search,
    Check,
    Image as ImageIcon,
} from "lucide-react";

interface AdminNewsItem {
    id: number;
    title: string;
    slug: string;
    author: string;
    date: string;
    formatted_date: string;
    image: string;
    description: string;
    status: "Aktif" | "Draft";
}

interface BeritaProps {
    newsList: AdminNewsItem[];
}

export default function Berita({ newsList = [] }: BeritaProps) {
    const { auth, flash } = usePage().props as any;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<AdminNewsItem | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteTarget, setDeleteTarget] = useState<AdminNewsItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const today = new Date().toISOString().split("T")[0];
    const defaultAuthor = auth?.user?.name || "Biro Sarana & Prasarana";

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm<{
        title: string;
        author: string;
        date: string;
        description: string;
        status: "Aktif" | "Draft";
        image: File | null;
    }>({
        title: "",
        author: defaultAuthor,
        date: today,
        description: "",
        status: "Aktif",
        image: null,
    });

    const handleOpenCreateModal = () => {
        clearErrors();
        reset();
        setData("author", defaultAuthor);
        setEditingItem(null);
        setPreviewUrl(null);
        setIsModalOpen(true);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData("image", file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleEdit = (item: AdminNewsItem) => {
        clearErrors();
        setEditingItem(item);
        setData({
            title: item.title,
            author: item.author,
            date: item.date,
            description: item.description,
            status: item.status,
            image: null,
        });
        setPreviewUrl(item.image);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setPreviewUrl(null);
        clearErrors();
        reset();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            post(`/admin/berita/${editingItem.id}`, {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => handleCloseModal(),
            });
        } else {
            post("/admin/berita", {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    handleCloseModal();
                },
            });
        }
    };

    const handleConfirmDelete = () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete(`/admin/berita/${deleteTarget.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    const filteredNews = newsList.filter(
        (item) =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.author.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return (
        <AdminLayout>
            <Head title="Kelola Berita - Admin Biro Sarpras" />

            <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-slate-800 text-xs">
                {/* Header Banner */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-[#006039] text-white flex items-center justify-center shadow-xs shrink-0">
                            <Newspaper className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-[#006039] px-2.5 py-0.5 rounded-full">
                                    PUBLIKASI INFORMASI
                                </span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                                Informasi &amp; Berita
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Publikasikan kabar terbaru, pengumuman fasilitas, dan artikel kegiatan Biro Sarpras UNUHA.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute inset-y-0 left-3 my-auto w-3.5 h-3.5 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari judul atau penulis..."
                                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:border-[#006039] outline-hidden bg-slate-50 focus:bg-white transition"
                            />
                        </div>

                        <button
                            onClick={handleOpenCreateModal}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#006039] hover:bg-[#0f4c3a] text-white rounded-xl font-bold text-xs shadow-xs transition cursor-pointer shrink-0"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Tulis Berita Baru</span>
                        </button>
                    </div>
                </div>

                {/* Alert Notifikasi */}
                {flash?.success && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-[#006039] text-xs font-semibold shadow-xs">
                        <CheckCircle2 className="w-5 h-5 shrink-0 text-[#006039]" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash?.error && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold shadow-xs">
                        <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                        <span>{flash.error}</span>
                    </div>
                )}

                {/* TABEL DATA BERITA FULL-WIDTH */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div>
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Newspaper className="w-4 h-4 text-[#006039]" />
                                <span>Daftar Artikel &amp; Pengumuman ({filteredNews.length})</span>
                            </h2>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                Seluruh berita yang tayang di halaman publik portal sarpras.
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                                <tr>
                                    <th className="p-3.5 text-center">Sampul</th>
                                    <th className="p-3.5">Judul Berita &amp; Cuplikan</th>
                                    <th className="p-3.5">Penulis</th>
                                    <th className="p-3.5">Tanggal Terbit</th>
                                    <th className="p-3.5 text-center">Status</th>
                                    <th className="p-3.5 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredNews.map((news) => (
                                    <tr key={news.id} className="hover:bg-slate-50/80 transition">
                                        <td className="p-3.5 text-center whitespace-nowrap">
                                            {news.image ? (
                                                <img
                                                    src={news.image}
                                                    alt={news.title}
                                                    className="w-16 h-12 object-cover rounded-xl border border-slate-200 shadow-2xs mx-auto"
                                                />
                                            ) : (
                                                <div className="w-16 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-300 mx-auto">
                                                    <ImageIcon className="w-5 h-5" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-3.5">
                                            <div className="font-bold text-slate-900 text-xs">{news.title}</div>
                                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                                {news.description}
                                            </p>
                                        </td>
                                        <td className="p-3.5 font-medium text-slate-700 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                <User className="w-3.5 h-3.5 text-slate-400" />
                                                <span>{news.author}</span>
                                            </div>
                                        </td>
                                        <td className="p-3.5 text-slate-600 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                <span>{news.formatted_date || news.date}</span>
                                            </div>
                                        </td>
                                        <td className="p-3.5 text-center whitespace-nowrap">
                                            <span
                                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                                    news.status === "Aktif"
                                                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                                        : "bg-slate-100 text-slate-600"
                                                }`}
                                            >
                                                {news.status}
                                            </span>
                                        </td>
                                        <td className="p-3.5 text-center whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    onClick={() => handleEdit(news)}
                                                    className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-lg transition cursor-pointer"
                                                    title="Edit berita"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(news)}
                                                    className="p-1.5 text-slate-600 hover:text-rose-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-lg transition cursor-pointer"
                                                    title="Hapus berita"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredNews.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-slate-400">
                                            Belum ada berita yang sesuai dengan pencarian.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* MODAL FORM TULIS / EDIT BERITA */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
                    onClick={handleCloseModal}
                >
                    <div
                        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <div>
                                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    {editingItem ? (
                                        <>
                                            <Pencil className="w-4 h-4 text-[#006039]" />
                                            <span>Edit Berita &amp; Informasi</span>
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4 text-[#006039]" />
                                            <span>Tulis Berita Baru</span>
                                        </>
                                    )}
                                </h2>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    {editingItem ? `Memperbarui artikel "${editingItem.title}"` : "Isi rincian informasi dan unggah foto sampul artikel."}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    Judul Berita <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.title}
                                    onChange={(e) => setData("title", e.target.value)}
                                    placeholder="Masukkan judul berita yang menarik..."
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] outline-hidden font-medium"
                                    required
                                />
                                {errors.title && <p className="text-rose-600 text-[11px] mt-1">{errors.title}</p>}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">
                                        Tanggal Publikasi <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={data.date}
                                        onChange={(e) => setData("date", e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] outline-hidden"
                                        required
                                    />
                                    {errors.date && <p className="text-rose-600 text-[11px] mt-1">{errors.date}</p>}
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">
                                        Penulis <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.author}
                                        onChange={(e) => setData("author", e.target.value)}
                                        placeholder="Admin Sarpras"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] outline-hidden"
                                        required
                                    />
                                    {errors.author && <p className="text-rose-600 text-[11px] mt-1">{errors.author}</p>}
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Status Publikasi</label>
                                    <select
                                        value={data.status}
                                        onChange={(e) => setData("status", e.target.value as "Aktif" | "Draft")}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-[#006039] outline-hidden"
                                    >
                                        <option value="Aktif">Aktif (Tayang)</option>
                                        <option value="Draft">Draft (Arsip)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                                    <span>Gambar Sampul Berita</span>
                                    <span className="text-[10px] font-normal text-slate-400">JPG, PNG, WebP (Maks 5MB)</span>
                                </label>
                                {previewUrl ? (
                                    <div className="relative p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                                        <img
                                            src={previewUrl}
                                            alt="Preview Sampul"
                                            className="w-16 h-12 object-cover rounded-lg border border-slate-200 shadow-2xs shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 text-xs truncate">
                                                {data.image ? data.image.name : "Foto sampul terpasang"}
                                            </p>
                                            <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                                                {data.image ? "Gambar baru siap diunggah" : "Klik ganti untuk memperbarui"}
                                            </p>
                                        </div>
                                        <label className="px-3 py-1.5 bg-white border border-slate-200 hover:border-[#006039] rounded-lg text-xs font-bold text-slate-700 cursor-pointer transition">
                                            Ganti
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 hover:border-[#006039] rounded-2xl bg-slate-50/70 hover:bg-emerald-50/30 transition cursor-pointer text-center">
                                        <UploadCloud className="w-6 h-6 text-slate-400 mb-1" />
                                        <span className="text-xs font-bold text-slate-700">Pilih Foto Sampul Berita</span>
                                        <span className="text-[10px] text-slate-400 mt-0.5">Unggah gambar landscape beresolusi jelas</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                                {errors.image && <p className="text-rose-600 text-[11px] mt-1">{errors.image}</p>}
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    Isi Konten / Deskripsi <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    rows={4}
                                    value={data.description}
                                    onChange={(e) => setData("description", e.target.value)}
                                    placeholder="Tuliskan isi artikel atau pengumuman secara rinci..."
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] outline-hidden leading-relaxed"
                                    required
                                />
                                {errors.description && (
                                    <p className="text-rose-600 text-[11px] mt-1">{errors.description}</p>
                                )}
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition cursor-pointer text-xs"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2.5 rounded-xl bg-[#006039] hover:bg-[#0f4c3a] text-white font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 text-xs"
                                >
                                    <Check className="w-4 h-4" />
                                    <span>
                                        {processing
                                            ? "Menyimpan..."
                                            : editingItem
                                            ? "Perbarui Berita"
                                            : "Terbitkan Berita"}
                                    </span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Hapus */}
            <DeleteConfirmModal
                show={Boolean(deleteTarget)}
                title="Hapus Berita"
                itemName={deleteTarget?.title}
                processing={isDeleting}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleConfirmDelete}
            />
        </AdminLayout>
    );
}
