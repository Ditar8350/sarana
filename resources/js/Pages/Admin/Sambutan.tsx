import React, { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { MessageSquare, Upload, Save, CheckCircle2, Eye, Quote } from 'lucide-react';

interface SambutanProps {
    sambutan: {
        id: number | null;
        photo: string;
        judul_kepala_biro: string;
        name: string;
        title: string;
        message: string;
    };
}

export default function Sambutan({ sambutan }: SambutanProps) {
    const { flash } = usePage().props as any;
    const [previewUrl, setPreviewUrl] = useState<string>(
        sambutan?.photo || '/images/Kepala-sarpras.jpeg'
    );

    const { data, setData, post, processing, errors } = useForm<{
        judul_kepala_biro: string;
        name: string;
        title: string;
        message: string;
        photo: File | null;
    }>({
        judul_kepala_biro: sambutan?.judul_kepala_biro || 'Kepala Biro Sarana & Prasarana',
        name: sambutan?.name || 'Bpk Agus Darmawan, S.Pd.',
        title: sambutan?.title || 'Kepala Biro Sarana & Prasarana',
        message:
            sambutan?.message ||
            'Selamat datang di portal resmi Biro Sarana dan Prasarana Universitas Nurul Huda. Kami hadir untuk menyediakan infrastruktur dan layanan fasilitas yang berkualitas, transparan, dan profesional demi mendukung kenyamanan seluruh civitas akademika dalam mewujudkan visi dan misi perguruan tinggi. Melalui sistem informasi ini, kami berharap pengelolaan sarana prasarana menjadi lebih terpadu, efektif, dan efisien.',
        photo: null,
    });

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('photo', file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/sambutan', {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout>
            <Head title="Kelola Sambutan Ketua - Admin Biro Sarpras" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-ink font-serif">
                        Pengaturan Sambutan Kepala Biro
                    </h1>
                    <p className="text-sm text-muted mt-1">
                        Kelola foto ketua/kepala biro, judul kepala biro, nama, jabatan (title), dan isi sambutan.
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
                    {/* Form Input */}
                    <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-surface-container shadow-sm">
                        <h2 className="text-lg font-bold text-ink mb-5 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-primary" />
                            Form Sambutan Kepala Biro
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Upload Foto Ketua */}
                            <div>
                                <label className="block text-sm font-semibold text-ink mb-2">
                                    Foto Ketua / Kepala Biro
                                </label>
                                <div className="border-2 border-dashed border-slate-200 hover:border-primary rounded-2xl p-5 text-center transition-colors bg-surface">
                                    <input
                                        type="file"
                                        id="sambutan-photo"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handlePhotoChange}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="sambutan-photo"
                                        className="cursor-pointer flex flex-col items-center justify-center gap-2"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
                                            <Upload className="w-6 h-6" />
                                        </div>
                                        <div className="text-sm font-semibold text-ink">
                                            Klik untuk mengunggah foto baru
                                        </div>
                                        <p className="text-xs text-muted">
                                            Disarankan rasio potret 4:5 (JPG, PNG, WEBP maks. 5MB)
                                        </p>
                                        {data.photo && (
                                            <span className="mt-1 px-3 py-1 bg-primary text-white text-xs rounded-full font-medium">
                                                File dipilih: {data.photo.name}
                                            </span>
                                        )}
                                    </label>
                                </div>
                                {errors.photo && (
                                    <p className="text-xs text-red-600 mt-1.5">{errors.photo}</p>
                                )}
                            </div>

                            {/* Judul Kepala Biro */}
                            <div>
                                <label className="block text-sm font-semibold text-ink mb-1.5">
                                    Judul Kepala Biro (Heading Sambutan)
                                </label>
                                <input
                                    type="text"
                                    value={data.judul_kepala_biro}
                                    onChange={(e) => setData('judul_kepala_biro', e.target.value)}
                                    placeholder="Contoh: Kepala Biro Sarana & Prasarana"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    required
                                />
                                {errors.judul_kepala_biro && (
                                    <p className="text-xs text-red-600 mt-1.5">
                                        {errors.judul_kepala_biro}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Nama Kepala Biro */}
                                <div>
                                    <label className="block text-sm font-semibold text-ink mb-1.5">
                                        Nama Kepala Biro
                                    </label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Contoh: Bpk Iwan, S.Pd."
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        required
                                    />
                                    {errors.name && (
                                        <p className="text-xs text-red-600 mt-1.5">{errors.name}</p>
                                    )}
                                </div>

                                {/* Title / Jabatan Kepala Biro */}
                                <div>
                                    <label className="block text-sm font-semibold text-ink mb-1.5">
                                        Title / Jabatan
                                    </label>
                                    <input
                                        type="text"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        placeholder="Contoh: Kepala Biro Sarana & Prasarana"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        required
                                    />
                                    {errors.title && (
                                        <p className="text-xs text-red-600 mt-1.5">{errors.title}</p>
                                    )}
                                </div>
                            </div>

                            {/* Isi Teks Sambutan */}
                            <div>
                                <label className="block text-sm font-semibold text-ink mb-1.5">
                                    Isi Pesan Sambutan
                                </label>
                                <textarea
                                    rows={5}
                                    value={data.message}
                                    onChange={(e) => setData('message', e.target.value)}
                                    placeholder="Tuliskan isi sambutan kepala biro..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                                {errors.message && (
                                    <p className="text-xs text-red-600 mt-1.5">{errors.message}</p>
                                )}
                            </div>

                            {/* Tombol Simpan */}
                            <div className="pt-2 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm shadow-sm transition-all disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Live Preview */}
                    <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-surface-container shadow-sm">
                        <h2 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
                            <Eye className="w-5 h-5 text-primary" />
                            Pratinjau Sambutan
                        </h2>

                        <div className="p-5 rounded-2xl bg-surface border border-surface-container space-y-5">
                            <div className="flex justify-center">
                                <img
                                    src={previewUrl}
                                    alt={data.name}
                                    className="w-40 aspect-[4/5] object-cover rounded-2xl shadow-md border border-white"
                                />
                            </div>

                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-9 h-9 rounded-lg bg-primary-soft flex items-center justify-center text-primary shrink-0">
                                        <Quote className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-primary uppercase tracking-wider">
                                            Sambutan
                                        </p>
                                        <h3 className="text-lg font-bold text-ink font-serif">
                                            {data.judul_kepala_biro || 'Kepala Biro Sarana & Prasarana'}
                                        </h3>
                                    </div>
                                </div>

                                <p className="text-xs text-muted italic mb-2">
                                    Assalamualaikum wr.wb.
                                </p>
                                <p className="text-xs text-muted leading-relaxed mb-4 line-clamp-5">
                                    {data.message}
                                </p>

                                <div className="border-l-4 border-accent pl-3">
                                    <p className="text-sm font-bold text-ink font-serif">
                                        {data.name || 'Nama Kepala Biro'}
                                    </p>
                                    <p className="text-xs text-primary font-medium">
                                        {data.title || 'Title / Jabatan'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
