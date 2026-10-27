import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { MapPin, Mail, Phone, Save, CheckCircle2, Eye } from 'lucide-react';

interface KontakProps {
    contact: {
        id: number | null;
        address: string;
        email: string;
        phone: string;
    };
}

export default function Kontak({ contact }: KontakProps) {
    const { flash } = usePage().props as any;

    const { data, setData, post, processing, errors } = useForm<{
        address: string;
        email: string;
        phone: string;
    }>({
        address:
            contact?.address ||
            'Gedung Rektorat Lt. 1, Kampus A & B, Jl. Kota Baru Desa Sukaraja, Kec. Buay Madang, Kab. OKU Timur, Sumatera Selatan 32312',
        email: contact?.email || 'sarpras@unuha.ac.id',
        phone: contact?.phone || '0821-8466-0898',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/kontak', {
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout>
            <Head title="Kelola Kontak - Admin Biro Sarpras" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-ink font-serif">
                        Pengaturan Kontak
                    </h1>
                    <p className="text-sm text-muted mt-1">
                        Kelola informasi alamat kantor, alamat email resmi, dan nomor telepon/HP Biro Sarana & Prasarana.
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
                    {/* Form Input Kontak */}
                    <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-surface-container shadow-sm">
                        <h2 className="text-lg font-bold text-ink mb-5 flex items-center gap-2">
                            <Phone className="w-5 h-5 text-primary" />
                            Form Hubungi Kami
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Alamat */}
                            <div>
                                <label className="block text-sm font-semibold text-ink mb-1.5">
                                    Alamat Lengkap
                                </label>
                                <textarea
                                    rows={4}
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    placeholder="Masukkan alamat kantor Biro Sarana & Prasarana..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    required
                                />
                                {errors.address && (
                                    <p className="text-xs text-red-600 mt-1.5">{errors.address}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-semibold text-ink mb-1.5">
                                        Email Resmi
                                    </label>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="Contoh: sarpras@unuha.ac.id"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        required
                                    />
                                    {errors.email && (
                                        <p className="text-xs text-red-600 mt-1.5">{errors.email}</p>
                                    )}
                                </div>

                                {/* Nomor HP / Telepon */}
                                <div>
                                    <label className="block text-sm font-semibold text-ink mb-1.5">
                                        Nomor HP Hotline
                                    </label>
                                    <input
                                        type="text"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        placeholder="Contoh: 0821-8466-0898"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        required
                                    />
                                    {errors.phone && (
                                        <p className="text-xs text-red-600 mt-1.5">{errors.phone}</p>
                                    )}
                                </div>
                            </div>

                            {/* Tombol Simpan */}
                            <div className="pt-2 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm shadow-sm transition-all disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    {processing ? 'Menyimpan...' : 'Simpan Kontak'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Pratinjau Kontak  */}
                    <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-surface-container shadow-sm h-fit">
                        <h2 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
                            <Eye className="w-5 h-5 text-primary" />
                            Pratinjau Tampilan Footer
                        </h2>

                        <div className="p-6 rounded-2xl bg-[#006039] text-white space-y-4 shadow-md">
                            <h4 className="text-sm font-bold uppercase tracking-wider text-white border-b border-white/15 pb-3">
                                Hubungi Kami
                            </h4>

                            <ul className="space-y-4">
                                <li className="flex gap-3">
                                    <MapPin className="w-4 h-4 text-[#FCB900] shrink-0 mt-0.5" />
                                    <span className="text-sm text-white/85 leading-relaxed">
                                        {data.address || 'Alamat belum diisi...'}
                                    </span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Phone className="w-4 h-4 text-[#FCB900] shrink-0" />
                                    <span className="text-sm text-white/85">
                                        {data.phone || 'Nomor HP belum diisi...'}
                                    </span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Mail className="w-4 h-4 text-[#FCB900] shrink-0" />
                                    <span className="text-sm text-white/85">
                                        {data.email || 'Email belum diisi...'}
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
