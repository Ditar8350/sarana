import React, { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Image as ImageIcon, Upload, Save, CheckCircle2, Eye } from 'lucide-react';

interface HeroSectionProps {
    hero: {
        id: number | null;
        title: string;
        subtitle: string;
        image: string;
    };
}

export default function HeroSection({ hero }: HeroSectionProps) {
    const { flash } = usePage().props as any;
    const [previewUrl, setPreviewUrl] = useState<string>(hero?.image || '/images/Hero.png');

    const { data, setData, post, processing, errors } = useForm<{
        title: string;
        subtitle: string;
        image: File | null;
    }>({
        title: hero?.title || 'Biro Sarana & Prasarana Universitas Nurul Huda',
        subtitle:
            hero?.subtitle ||
            'Mewujudkan tata kelola sarana dan prasarana yang transparan, akuntabel, serta profesional guna mendukung visi dan misi perguruan tinggi.',
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
        post('/admin/hero', {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout>
            <Head title="Kelola Hero Section - Admin Biro Sarpras" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-ink font-serif">Pengaturan Hero Section</h1>
                    <p className="text-sm text-muted mt-1">
                        Kelola gambar latar utama, judul, dan sub judul yang tampil pada halaman depan website.
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
                            <ImageIcon className="w-5 h-5 text-primary" />
                            Form Data Hero
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Upload Gambar Hero */}
                            <div>
                                <label className="block text-sm font-semibold text-ink mb-2">
                                    Gambar Hero (Banner Utama)
                                </label>
                                <div className="border-2 border-dashed border-slate-200 hover:border-primary rounded-2xl p-5 text-center transition-colors bg-surface">
                                    <input
                                        type="file"
                                        id="hero-image"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="hero-image"
                                        className="cursor-pointer flex flex-col items-center justify-center gap-2"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
                                            <Upload className="w-6 h-6" />
                                        </div>
                                        <div className="text-sm font-semibold text-ink">
                                            Klik untuk memilih gambar baru
                                        </div>
                                        <p className="text-xs text-muted">
                                            Format JPG, PNG, atau WEBP (Maks. 5MB)
                                        </p>
                                        {data.image && (
                                            <span className="mt-1 px-3 py-1 bg-primary text-white text-xs rounded-full font-medium">
                                                File dipilih: {data.image.name}
                                            </span>
                                        )}
                                    </label>
                                </div>
                                {errors.image && (
                                    <p className="text-xs text-red-600 mt-1.5">{errors.image}</p>
                                )}
                            </div>

                            {/* Judul Hero */}
                            <div>
                                <label className="block text-sm font-semibold text-ink mb-1.5">
                                    Judul Hero
                                </label>
                                <input
                                    type="text"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="Masukkan judul utama hero..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    required
                                />
                                {errors.title && (
                                    <p className="text-xs text-red-600 mt-1.5">{errors.title}</p>
                                )}
                            </div>

                            {/* Sub Judul Hero */}
                            <div>
                                <label className="block text-sm font-semibold text-ink mb-1.5">
                                    Sub Judul / Deskripsi Hero
                                </label>
                                <textarea
                                    rows={4}
                                    value={data.subtitle}
                                    onChange={(e) => setData('subtitle', e.target.value)}
                                    placeholder="Masukkan sub judul atau deskripsi singkat..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    required
                                />
                                {errors.subtitle && (
                                    <p className="text-xs text-red-600 mt-1.5">{errors.subtitle}</p>
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
                    <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-surface-container shadow-sm flex flex-col">
                        <h2 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
                            <Eye className="w-5 h-5 text-primary" />
                            Pratinjau Tampilan Hero
                        </h2>

                        <div className="relative rounded-2xl overflow-hidden min-h-[300px] flex items-center p-6 border border-surface-container">
                            <img
                                src={previewUrl}
                                alt="Preview Hero"
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                            <div
                                className="absolute inset-0"
                                style={{
                                    background:
                                        'linear-gradient(90deg, rgba(0, 74, 44, 0.95) 0%, rgba(0, 96, 57, 0.85) 55%, rgba(0, 96, 57, 0.25) 100%)',
                                }}
                            />
                            <div className="relative z-10 max-w-md">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-primary text-xs font-semibold mb-3 shadow-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    Portal Informasi Resmi
                                </div>
                                <h3 className="font-serif text-xl sm:text-2xl font-bold text-white leading-snug mb-2">
                                    {data.title || 'Judul Hero'}
                                </h3>
                                <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                                    {data.subtitle || 'Sub judul akan tampil di sini...'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
