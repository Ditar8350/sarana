import React, { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Network, Upload, Save, CheckCircle2, Eye, Image as ImageIcon } from 'lucide-react';

interface StrukturAdminProps {
    struktur: {
        id: number;
        image: string;
    } | null;
}

export default function Struktur({ struktur }: StrukturAdminProps) {
    const { flash } = usePage().props as any;
    const [previewUrl, setPreviewUrl] = useState<string | null>(struktur?.image || null);

    const { data, setData, post, processing, errors } = useForm<{
        image: File | null;
    }>({
        image: null,
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('image', file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/struktur', {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout>
            <Head title="Kelola Struktur Organisasi - Admin Biro Sarpras" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-ink font-serif">
                        Pengaturan Struktur Organisasi
                    </h1>
                    <p className="text-sm text-muted mt-1">
                        Unggah gambar bagan Struktur Organisasi Biro Sarana & Prasarana yang akan ditampilkan pada halaman publik.
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
                    {/* Form Upload Gambar Struktur */}
                    <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-surface-container shadow-sm h-fit">
                        <h2 className="text-lg font-bold text-ink mb-5 flex items-center gap-2">
                            <Network className="w-5 h-5 text-primary" />
                            Unggah Gambar Struktur
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-ink mb-2">
                                    File Gambar Struktur Organisasi
                                </label>
                                <div className="border-2 border-dashed border-slate-200 hover:border-primary rounded-2xl p-6 text-center transition-colors bg-surface">
                                    <input
                                        type="file"
                                        id="struktur-image"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleImageChange}
                                        className="hidden"
                                        required
                                    />
                                    <label
                                        htmlFor="struktur-image"
                                        className="cursor-pointer flex flex-col items-center justify-center gap-2"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
                                            <Upload className="w-6 h-6" />
                                        </div>
                                        <div className="text-sm font-semibold text-ink">
                                            Klik untuk memilih gambar struktur organisasi
                                        </div>
                                        <p className="text-xs text-muted">
                                            Format JPG, PNG, atau WEBP (Maks. 2MB)
                                        </p>
                                        {data.image && (
                                            <span className="mt-2 px-3 py-1 bg-primary text-white text-xs rounded-full font-medium">
                                                File dipilih: {data.image.name}
                                            </span>
                                        )}
                                    </label>
                                </div>
                                {errors.image && (
                                    <p className="text-xs text-red-600 mt-1.5">{errors.image}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={processing || !data.image}
                                className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm shadow-sm transition-all disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {processing ? 'Menyimpan...' : 'Simpan Gambar Struktur'}
                            </button>
                        </form>
                    </div>

                    {/* Pratinjau Gambar Struktur Organisasi */}
                    <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-surface-container shadow-sm">
                        <h2 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
                            <Eye className="w-5 h-5 text-primary" />
                            Pratinjau Struktur Organisasi
                        </h2>

                        {previewUrl ? (
                            <div className="p-4 rounded-2xl bg-surface border border-surface-container flex justify-center">
                                <img
                                    src={previewUrl}
                                    alt="Pratinjau Struktur Organisasi"
                                    className="w-full h-auto max-h-[500px] object-contain rounded-xl"
                                />
                            </div>
                        ) : (
                            <div className="py-16 text-center border-2 border-dashed border-surface-container rounded-2xl bg-surface">
                                <div className="w-12 h-12 rounded-xl bg-primary-soft text-primary flex items-center justify-center mx-auto mb-3">
                                    <ImageIcon className="w-6 h-6" />
                                </div>
                                <p className="text-sm font-medium text-muted">
                                    Belum ada gambar struktur organisasi yang diunggah.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
