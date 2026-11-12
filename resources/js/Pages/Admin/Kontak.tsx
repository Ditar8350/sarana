import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { MapPin, Mail, Phone, Save, CheckCircle2, AlertCircle, Eye, Check } from 'lucide-react';

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
            <Head title="Pengaturan Kontak - Admin Biro Sarpras" />

            <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-slate-800 text-xs">
                {/* Header Banner */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-[#006039] text-white flex items-center justify-center shadow-xs shrink-0">
                            <Phone className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-[#006039] px-2.5 py-0.5 rounded-full">
                                    PELAYANAN PUBLIK
                                </span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                                Informasi Kontak &amp; Loket Pelayanan
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Atur alamat kantor, email resmi, dan nomor telepon hotline helpdesk Biro Sarana &amp; Prasarana UNUHA.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Alert Sukses */}
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

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Form Input Kontak */}
                    <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                        <div className="pb-3 border-b border-slate-100">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Phone className="w-4 h-4 text-[#006039]" />
                                <span>Formulir Kontak Biro Sarpras</span>
                            </h2>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                Data yang dimasukkan akan tampil di footer website dan halaman kontak publik.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                            {/* Alamat Lengkap */}
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    Alamat Kantor Lengkap <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    rows={4}
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    placeholder="Masukkan alamat kantor Biro Sarana &amp; Prasarana..."
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] outline-hidden leading-relaxed"
                                    required
                                />
                                {errors.address && (
                                    <p className="text-rose-600 text-[11px] mt-1">{errors.address}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Email */}
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">
                                        Email Resmi <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="sarpras@unuha.ac.id"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] outline-hidden"
                                        required
                                    />
                                    {errors.email && (
                                        <p className="text-rose-600 text-[11px] mt-1">{errors.email}</p>
                                    )}
                                </div>

                                {/* Nomor HP / Hotline */}
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">
                                        Nomor HP / Hotline WhatsApp <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        placeholder="0821-8466-0898"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] outline-hidden"
                                        required
                                    />
                                    {errors.phone && (
                                        <p className="text-rose-600 text-[11px] mt-1">{errors.phone}</p>
                                    )}
                                </div>
                            </div>

                            {/* Tombol Simpan */}
                            <div className="pt-3 flex justify-end border-t border-slate-100">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2.5 rounded-xl bg-[#006039] hover:bg-[#0f4c3a] text-white font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 text-xs"
                                >
                                    <Check className="w-4 h-4" />
                                    <span>{processing ? 'Menyimpan...' : 'Simpan Perubahan Kontak'}</span>
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Pratinjau Tampilan Footer / Publik */}
                    <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Eye className="w-4 h-4 text-[#006039]" />
                                <span>Pratinjau Widget Publik</span>
                            </h2>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                                Live Preview
                            </span>
                        </div>

                        <div className="p-5 rounded-2xl bg-[#006039] text-white space-y-3.5 shadow-sm">
                            <div className="flex items-center gap-2 border-b border-white/15 pb-2.5">
                                <div className="w-2 h-2 rounded-full bg-[#FCB900]"></div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                                    Biro Sarana &amp; Prasarana UNUHA
                                </h4>
                            </div>

                            <ul className="space-y-3 text-xs">
                                <li className="flex gap-2.5">
                                    <MapPin className="w-4 h-4 text-[#FCB900] shrink-0 mt-0.5" />
                                    <span className="text-white/90 leading-relaxed text-[11px]">
                                        {data.address || 'Alamat kantor belum ditentukan.'}
                                    </span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <Phone className="w-4 h-4 text-[#FCB900] shrink-0" />
                                    <span className="text-white/90 text-[11px] font-semibold">
                                        {data.phone || 'Nomor telepon belum diisi.'}
                                    </span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <Mail className="w-4 h-4 text-[#FCB900] shrink-0" />
                                    <span className="text-white/90 text-[11px]">
                                        {data.email || 'Email belum diisi.'}
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
