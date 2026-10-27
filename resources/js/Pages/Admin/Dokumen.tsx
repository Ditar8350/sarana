import React, { useState } from "react";
import { Head, useForm, router, usePage } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import DeleteConfirmModal from "@/Components/Admin/DeleteConfirmModal";
import {
    FileText,
    FileSpreadsheet,
    Plus,
    Pencil,
    Trash2,
    Upload,
    Download,
    CheckCircle2,
    Search,
    X,
} from "lucide-react";

interface AdminDocumentItem {
    id: number;
    title: string;
    category: string;
    size: string;
    type: "pdf" | "excel" | "word";
    date: string;
    formatted_date: string;
    fileUrl: string;
}

interface DokumenProps {
    documents: AdminDocumentItem[];
}

const CATEGORIES = [
    "Pedoman",
    "Formulir",
    "Laporan",
    "Surat Keputusan",
    "Lainnya",
];

export default function Dokumen({ documents = [] }: DokumenProps) {
    const { flash } = usePage().props as any;
    const [editingDoc, setEditingDoc] = useState<AdminDocumentItem | null>(
        null,
    );
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteTarget, setDeleteTarget] = useState<AdminDocumentItem | null>(
        null,
    );
    const [isDeleting, setIsDeleting] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm<{
        title: string;
        category: string;
        file: File | null;
    }>({
        title: "",
        category: "Pedoman",
        file: null,
    });

    const handleEdit = (doc: AdminDocumentItem) => {
        setEditingDoc(doc);
        setData({
            title: doc.title,
            category: doc.category,
            file: null,
        });
    };

    const handleCancelEdit = () => {
        setEditingDoc(null);
        reset();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingDoc) {
            post(`/admin/dokumen/${editingDoc.id}`, {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => handleCancelEdit(),
            });
        } else {
            post("/admin/dokumen", {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => reset(),
            });
        }
    };

    const handleConfirmDelete = () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete(`/admin/dokumen/${deleteTarget.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    const filteredDocs = documents.filter(
        (doc) =>
            doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.category.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return (
        <AdminLayout>
            <Head title="Kelola Dokumen - Admin Biro Sarpras" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-ink font-serif">
                        Kelola Dokumen Resmi & Unduhan
                    </h1>
                    <p className="text-sm text-muted mt-1">
                        Unggah dan kelola berkas dokumen resmi (PDF, Word,
                        Excel) untuk pusat unduhan publik.
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
                    {/* Form Upload / Edit Dokumen */}
                    <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-surface-container shadow-sm h-fit">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" />
                                {editingDoc
                                    ? "Edit Dokumen"
                                    : "Tambah Dokumen Baru"}
                            </h2>
                            {editingDoc && (
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
                            {/* Judul Dokumen */}
                            <div>
                                <label className="block text-sm font-semibold text-ink mb-1">
                                    Judul Dokumen
                                </label>
                                <input
                                    type="text"
                                    value={data.title}
                                    onChange={(e) =>
                                        setData("title", e.target.value)
                                    }
                                    placeholder="Contoh: SOP Pencairan Dana 2026"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    required
                                />
                                {errors.title && (
                                    <p className="text-xs text-red-600 mt-1">
                                        {errors.title}
                                    </p>
                                )}
                            </div>

                            {/* Kategori Dokumen */}
                            <div>
                                <label className="block text-sm font-semibold text-ink mb-1">
                                    Kategori Dokumen
                                </label>
                                <select
                                    value={data.category}
                                    onChange={(e) =>
                                        setData("category", e.target.value)
                                    }
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                >
                                    {CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                                {errors.category && (
                                    <p className="text-xs text-red-600 mt-1">
                                        {errors.category}
                                    </p>
                                )}
                            </div>

                            {/* Upload File Berkas */}
                            <div>
                                <label className="block text-sm font-semibold text-ink mb-1">
                                    File Dokumen{" "}
                                    {editingDoc &&
                                        "(Kosongkan jika tidak diganti)"}
                                </label>
                                <div className="border-2 border-dashed border-slate-200 hover:border-primary rounded-2xl p-5 text-center transition-colors bg-surface">
                                    <input
                                        type="file"
                                        id="dokumen-file"
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
                                        onChange={(e) =>
                                            setData(
                                                "file",
                                                e.target.files?.[0] || null,
                                            )
                                        }
                                        className="hidden"
                                        required={!editingDoc}
                                    />
                                    <label
                                        htmlFor="dokumen-file"
                                        className="cursor-pointer flex flex-col items-center justify-center gap-2"
                                    >
                                        <div className="w-11 h-11 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
                                            <Upload className="w-5 h-5" />
                                        </div>
                                        <span className="text-xs font-semibold text-ink">
                                            Klik untuk memilih berkas dokumen
                                        </span>
                                        <span className="text-[11px] text-muted">
                                            PDF, Word (.doc/.docx), atau Excel
                                            (.xls/.xlsx) maks. 2MB
                                        </span>
                                        {data.file && (
                                            <span className="mt-1 px-3 py-1 bg-primary text-white text-xs rounded-full font-medium">
                                                {data.file.name}
                                            </span>
                                        )}
                                    </label>
                                </div>
                                {errors.file && (
                                    <p className="text-xs text-red-600 mt-1">
                                        {errors.file}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm shadow-sm transition-all disabled:opacity-50"
                            >
                                <Plus className="w-4 h-4" />
                                {processing
                                    ? "Mengunggah..."
                                    : editingDoc
                                      ? "Simpan Perubahan Dokumen"
                                      : "Unggah Dokumen"}
                            </button>
                        </form>
                    </div>

                    {/* Daftar Dokumen */}
                    <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-surface-container shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                            <h2 className="text-lg font-bold text-ink">
                                Daftar Dokumen ({filteredDocs.length})
                            </h2>
                            <div className="relative w-full sm:w-64">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    placeholder="Cari dokumen atau kategori..."
                                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-surface text-xs text-ink focus:outline-none focus:border-primary"
                                />
                                <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>

                        {filteredDocs.length === 0 ? (
                            <div className="text-center py-12 text-muted text-sm border-2 border-dashed border-surface-container rounded-2xl">
                                Belum ada dokumen yang diunggah.
                            </div>
                        ) : (
                            <div className="divide-y divide-surface-container">
                                {filteredDocs.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                    >
                                        <div className="flex items-start gap-3.5">
                                            <div className="w-11 h-11 rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
                                                {doc.type === "excel" ? (
                                                    <FileSpreadsheet className="w-5 h-5" />
                                                ) : (
                                                    <FileText className="w-5 h-5" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-ink mb-1">
                                                    {doc.title}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted font-medium">
                                                    <span className="px-2 py-0.5 rounded bg-surface-container text-ink">
                                                        {doc.category}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="uppercase">
                                                        {doc.type}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{doc.size}</span>
                                                    <span>•</span>
                                                    <span>
                                                        {doc.formatted_date}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <a
                                                href={doc.fileUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container text-ink hover:bg-slate-200 text-xs font-semibold transition-colors"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                Unduh
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(doc)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-soft text-primary hover:bg-primary hover:text-white text-xs font-semibold transition-colors"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setDeleteTarget(doc)
                                                }
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white text-xs font-semibold transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Hapus
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Konfirmasi Hapus Dokumen */}
            <DeleteConfirmModal
                show={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleConfirmDelete}
                title="Hapus Dokumen"
                message="Apakah Anda yakin ingin menghapus berkas dokumen ini?"
                itemName={deleteTarget?.title}
                processing={isDeleting}
            />
        </AdminLayout>
    );
}
