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
    Upload,
    X,
    CheckCircle2,
    Search,
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
    const { flash } = usePage().props as any;
    const [editingItem, setEditingItem] = useState<AdminNewsItem | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteTarget, setDeleteTarget] = useState<AdminNewsItem | null>(
        null,
    );
    const [isDeleting, setIsDeleting] = useState(false);

    const today = new Date().toISOString().split("T")[0];

    const { data, setData, post, processing, errors, reset } = useForm<{
        title: string;
        author: string;
        date: string;
        description: string;
        status: "Aktif" | "Draft";
        image: File | null;
    }>({
        title: "",
        author: "Admin Sarana & Prasarana",
        date: today,
        description: "",
        status: "Aktif",
        image: null,
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData("image", file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleEdit = (item: AdminNewsItem) => {
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
    };

    const handleCancelEdit = () => {
        setEditingItem(null);
        setPreviewUrl(null);
        reset();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            post(`/admin/berita/${editingItem.id}`, {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => handleCancelEdit(),
            });
        } else {
            post("/admin/berita", {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    setPreviewUrl(null);
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

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-ink font-serif">
                        Kelola Berita & Pengumuman
                    </h1>
                    <p className="text-sm text-muted mt-1">
                        Tambahkan, perbarui, atau hapus berita dengan mengatur
                        tanggal, gambar, penulis, judul, dan deskripsi.
                    </p>
                </div>

                {/* Alert Sukses */}
                {flash?.success && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-primary-soft border border-primary/20 text-primary text-sm font-semibold">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Form Tambah / Edit Berita */}
                    <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-surface-container shadow-sm h-fit">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                                <Newspaper className="w-5 h-5 text-primary" />
                                {editingItem
                                    ? "Edit Berita"
                                    : "Tambah Berita Baru"}
                            </h2>
                            {editingItem && (
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="text-xs font-semibold text-red-600 hover:underline flex items-center gap-1"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    Batal Edit
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Judul Berita */}
                            <div>
                                <label className="block text-sm font-semibold text-ink mb-1">
                                    Judul Berita
                                </label>
                                <input
                                    type="text"
                                    value={data.title}
                                    onChange={(e) =>
                                        setData("title", e.target.value)
                                    }
                                    placeholder="Masukkan judul berita..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    required
                                />
                                {errors.title && (
                                    <p className="text-xs text-red-600 mt-1">
                                        {errors.title}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Tanggal */}
                                <div>
                                    <label className="block text-sm font-semibold text-ink mb-1">
                                        Tanggal
                                    </label>
                                    <input
                                        type="date"
                                        value={data.date}
                                        onChange={(e) =>
                                            setData("date", e.target.value)
                                        }
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        required
                                    />
                                    {errors.date && (
                                        <p className="text-xs text-red-600 mt-1">
                                            {errors.date}
                                        </p>
                                    )}
                                </div>

                                {/* Penulis */}
                                <div>
                                    <label className="block text-sm font-semibold text-ink mb-1">
                                        Penulis
                                    </label>
                                    <input
                                        type="text"
                                        value={data.author}
                                        onChange={(e) =>
                                            setData("author", e.target.value)
                                        }
                                        placeholder="Nama penulis..."
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        required
                                    />
                                    {errors.author && (
                                        <p className="text-xs text-red-600 mt-1">
                                            {errors.author}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Gambar Berita */}
                            <div>
                                <label className="block text-sm font-semibold text-ink mb-1">
                                    Gambar Berita
                                </label>
                                <div className="border-2 border-dashed border-slate-200 hover:border-primary rounded-2xl p-4 text-center transition-colors bg-surface">
                                    <input
                                        type="file"
                                        id="berita-image"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="berita-image"
                                        className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
                                    >
                                        {previewUrl ? (
                                            <img
                                                src={previewUrl}
                                                alt="Preview"
                                                className="w-full h-36 object-cover rounded-xl mb-2"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
                                                <Upload className="w-5 h-5" />
                                            </div>
                                        )}
                                        <span className="text-xs font-semibold text-primary">
                                            {previewUrl
                                                ? "Ganti Gambar"
                                                : "Pilih Gambar Berita"}
                                        </span>
                                        <span className="text-[11px] text-muted">
                                            JPG, PNG, WEBP (Maks. 5MB)
                                        </span>
                                    </label>
                                </div>
                                {errors.image && (
                                    <p className="text-xs text-red-600 mt-1">
                                        {errors.image}
                                    </p>
                                )}
                            </div>

                            {/* Deskripsi Berita */}
                            <div>
                                <label className="block text-sm font-semibold text-ink mb-1">
                                    Deskripsi Berita
                                </label>
                                <textarea
                                    rows={5}
                                    value={data.description}
                                    onChange={(e) =>
                                        setData("description", e.target.value)
                                    }
                                    placeholder="Tuliskan isi atau deskripsi berita secara lengkap..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    required
                                />
                                {errors.description && (
                                    <p className="text-xs text-red-600 mt-1">
                                        {errors.description}
                                    </p>
                                )}
                            </div>

                            {/* Status Publikasi */}
                            <div>
                                <label className="block text-sm font-semibold text-ink mb-1">
                                    Status Publikasi
                                </label>
                                <select
                                    value={data.status}
                                    onChange={(e) =>
                                        setData(
                                            "status",
                                            e.target.value as "Aktif" | "Draft",
                                        )
                                    }
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                >
                                    <option value="Aktif">
                                        Aktif (Tampil di Publik)
                                    </option>
                                    <option value="Draft">
                                        Draft (Disembunyikan)
                                    </option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm shadow-sm transition-all disabled:opacity-50"
                            >
                                <Plus className="w-4 h-4" />
                                {processing
                                    ? "Menyimpan..."
                                    : editingItem
                                      ? "Simpan Perubahan Berita"
                                      : "Tambahkan Berita"}
                            </button>
                        </form>
                    </div>

                    {/* Daftar Berita */}
                    <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-surface-container shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                            <h2 className="text-lg font-bold text-ink">
                                Daftar Berita ({filteredNews.length})
                            </h2>
                            <div className="relative w-full sm:w-64">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    placeholder="Cari judul atau penulis..."
                                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-surface text-xs text-ink focus:outline-none focus:border-primary"
                                />
                                <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>

                        {filteredNews.length === 0 ? (
                            <div className="text-center py-12 text-muted text-sm border-2 border-dashed border-surface-container rounded-2xl">
                                Belum ada data berita. Silakan tambahkan berita
                                baru melalui formulir di samping.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredNews.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl border border-surface-container hover:bg-surface/60 transition-colors"
                                    >
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className="w-full sm:w-28 h-24 rounded-xl object-cover shrink-0 bg-slate-100"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="font-bold text-ink text-sm line-clamp-1">
                                                    {item.title}
                                                </h3>
                                                <span
                                                    className={`shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                                        item.status === "Aktif"
                                                            ? "bg-primary-soft text-primary"
                                                            : "bg-slate-100 text-muted"
                                                    }`}
                                                >
                                                    {item.status}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted mt-1 mb-2">
                                                <span className="inline-flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5 text-primary" />
                                                    {item.formatted_date}
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <User className="w-3.5 h-3.5 text-primary" />
                                                    {item.author}
                                                </span>
                                            </div>

                                            <p className="text-xs text-muted line-clamp-2 mb-3">
                                                {item.description}
                                            </p>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleEdit(item)
                                                    }
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-soft text-primary hover:bg-primary hover:text-white text-xs font-semibold transition-colors"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setDeleteTarget(item)
                                                    }
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white text-xs font-semibold transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    Hapus
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Konfirmasi Hapus Berita */}
            <DeleteConfirmModal
                show={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleConfirmDelete}
                title="Hapus Berita"
                message="Apakah Anda yakin ingin menghapus berita ini?"
                itemName={deleteTarget?.title}
                processing={isDeleting}
            />
        </AdminLayout>
    );
}
