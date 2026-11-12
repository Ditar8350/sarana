import React, { useState } from "react";
import { Head, useForm, router, usePage } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import DeleteConfirmModal from "@/Components/Admin/DeleteConfirmModal";
import {
    FileText,
    Plus,
    Pencil,
    Trash2,
    UploadCloud,
    Download,
    CheckCircle2,
    AlertCircle,
    Search,
    X,
    Check,
    FileSpreadsheet,
    File,
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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDoc, setEditingDoc] = useState<AdminDocumentItem | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("semua");
    const [deleteTarget, setDeleteTarget] = useState<AdminDocumentItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm<{
        title: string;
        category: string;
        file: File | null;
    }>({
        title: "",
        category: "Pedoman",
        file: null,
    });

    const handleOpenCreateModal = () => {
        clearErrors();
        reset();
        setEditingDoc(null);
        setIsModalOpen(true);
    };

    const handleEdit = (doc: AdminDocumentItem) => {
        clearErrors();
        setEditingDoc(doc);
        setData({
            title: doc.title,
            category: doc.category,
            file: null,
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingDoc(null);
        clearErrors();
        reset();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingDoc) {
            post(`/admin/dokumen/${editingDoc.id}`, {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => handleCloseModal(),
            });
        } else {
            post("/admin/dokumen", {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => handleCloseModal(),
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

    const filteredDocs = documents.filter((doc) => {
        const matchesCategory = categoryFilter === "semua" || doc.category === categoryFilter;
        const matchesSearch =
            doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.category.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <AdminLayout>
            <Head title="Kelola Dokumen - Admin Biro Sarpras" />

            <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-slate-800 text-xs">
                {/* Header Banner */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-[#006039] text-white flex items-center justify-center shadow-xs shrink-0">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-[#006039] px-2.5 py-0.5 rounded-full">
                                    PELAYANAN PUBLIK
                                </span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                                Kelola Dokumen Resmi &amp; Unduhan
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Unggah dan kelola berkas SOP, formulir, SK, dan panduan fasilitas kampus bagi mahasiswa dan dosen.
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
                                placeholder="Cari judul dokumen..."
                                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:border-[#006039] outline-hidden bg-slate-50 focus:bg-white transition"
                            />
                        </div>

                        <button
                            onClick={handleOpenCreateModal}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#006039] hover:bg-[#0f4c3a] text-white rounded-xl font-bold text-xs shadow-xs transition cursor-pointer shrink-0"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Unggah Dokumen Baru</span>
                        </button>
                    </div>
                </div>

                {/* Alert Sukses / Error */}
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

                {/* TABEL DATA DOKUMEN FULL-WIDTH */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div>
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-[#006039]" />
                                <span>Daftar Dokumen Publik ({filteredDocs.length})</span>
                            </h2>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                Berkas resmi yang dapat diakses dan diunduh di portal Biro Sarpras.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#006039] outline-hidden bg-slate-50"
                            >
                                <option value="semua">Semua Kategori</option>
                                {CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                                <tr>
                                    <th className="p-3.5">Judul Dokumen</th>
                                    <th className="p-3.5">Kategori</th>
                                    <th className="p-3.5 text-center">Format &amp; Ukuran</th>
                                    <th className="p-3.5">Tanggal Diunggah</th>
                                    <th className="p-3.5 text-center">Unduhan</th>
                                    <th className="p-3.5 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredDocs.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-slate-50/80 transition">
                                        <td className="p-3.5">
                                            <div className="flex items-start gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#006039] flex items-center justify-center shrink-0 border border-emerald-100 mt-0.5">
                                                    {doc.type === "excel" ? (
                                                        <FileSpreadsheet className="w-4 h-4" />
                                                    ) : (
                                                        <FileText className="w-4 h-4" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 text-xs">{doc.title}</div>
                                                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                                                        Koleksi Biro Sarpras UNUHA
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3.5 whitespace-nowrap">
                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                                {doc.category}
                                            </span>
                                        </td>
                                        <td className="p-3.5 text-center whitespace-nowrap">
                                            <span className="font-mono font-bold uppercase text-[10px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-700">
                                                {doc.type}
                                            </span>
                                            <span className="text-slate-400 text-[11px] ml-1.5">{doc.size}</span>
                                        </td>
                                        <td className="p-3.5 text-slate-600 whitespace-nowrap font-medium">
                                            {doc.formatted_date || doc.date}
                                        </td>
                                        <td className="p-3.5 text-center whitespace-nowrap">
                                            <a
                                                href={doc.fileUrl}
                                                download
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#006039] rounded-lg font-bold text-xs transition border border-emerald-200"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                <span>Unduh</span>
                                            </a>
                                        </td>
                                        <td className="p-3.5 text-center whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    onClick={() => handleEdit(doc)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                                    title="Edit dokumen"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(doc)}
                                                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                                    title="Hapus dokumen"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredDocs.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-slate-400">
                                            Belum ada dokumen yang sesuai dengan pencarian.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* MODAL UNGGAH / EDIT DOKUMEN */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
                    onClick={handleCloseModal}
                >
                    <div
                        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <div>
                                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    {editingDoc ? (
                                        <>
                                            <Pencil className="w-4 h-4 text-[#006039]" />
                                            <span>Edit Dokumen Resmi</span>
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4 text-[#006039]" />
                                            <span>Unggah Dokumen Baru</span>
                                        </>
                                    )}
                                </h2>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    {editingDoc ? `Memperbarui rincian berkas "${editingDoc.title}"` : "Pilih file PDF, Word, atau Excel untuk diunggah ke sistem."}
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
                                    Judul Dokumen <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.title}
                                    onChange={(e) => setData("title", e.target.value)}
                                    placeholder="Contoh: SOP Peminjaman Fasilitas Laboratorium 2026"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] outline-hidden font-medium"
                                    required
                                />
                                {errors.title && <p className="text-rose-600 text-[11px] mt-1">{errors.title}</p>}
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    Kategori Dokumen <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={data.category}
                                    onChange={(e) => setData("category", e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-[#006039] outline-hidden"
                                >
                                    {CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                                {errors.category && <p className="text-rose-600 text-[11px] mt-1">{errors.category}</p>}
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                                    <span>Pilih Berkas Dokumen {editingDoc && <span className="text-slate-400 font-normal">(Opsional ganti)</span>}</span>
                                    <span className="text-[10px] font-normal text-slate-400">PDF, DOC, DOCX, XLS (Maks 10MB)</span>
                                </label>
                                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 hover:border-[#006039] rounded-2xl bg-slate-50/70 hover:bg-emerald-50/30 transition cursor-pointer text-center">
                                    <UploadCloud className="w-6 h-6 text-slate-400 mb-1" />
                                    <span className="text-xs font-bold text-slate-700">
                                        {data.file ? data.file.name : "Klik untuk memilih file dokumen"}
                                    </span>
                                    <span className="text-[10px] text-slate-400 mt-0.5">
                                        {data.file ? `${(data.file.size / 1024 / 1024).toFixed(2)} MB • Siap diunggah` : "Pastikan berkas berformat standar"}
                                    </span>
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.xls,.xlsx"
                                        onChange={(e) => setData("file", e.target.files?.[0] || null)}
                                        className="hidden"
                                        required={!editingDoc}
                                    />
                                </label>
                                {errors.file && <p className="text-rose-600 text-[11px] mt-1">{errors.file}</p>}
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
                                            ? "Mengunggah..."
                                            : editingDoc
                                            ? "Perbarui Dokumen"
                                            : "Simpan & Publikasikan"}
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
                title="Hapus Dokumen"
                itemName={deleteTarget?.title}
                processing={isDeleting}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleConfirmDelete}
            />
        </AdminLayout>
    );
}
