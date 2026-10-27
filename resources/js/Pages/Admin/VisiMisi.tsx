import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Target, Plus, Trash2, Save, CheckCircle2, Eye } from 'lucide-react';

interface VisiMisiProps {
    visiMisi: {
        id: number | null;
        visi: string;
        misi: string[];
    };
}

export default function VisiMisi({ visiMisi }: VisiMisiProps) {
    const { flash } = usePage().props as any;

    const { data, setData, post, processing, errors } = useForm<{
        visi: string;
        misi: string[];
    }>({
        visi:
            visiMisi?.visi ||
            'Menjadi pusat layanan sarana dan prasarana yang unggul, modern, dan berkelanjutan dalam menyediakan infrastruktur kampus yang aman dan nyaman guna mendukung mutu Tridharma Perguruan Tinggi.',
        misi:
            visiMisi?.misi && visiMisi.misi.length > 0
                ? visiMisi.misi
                : [
                      'Menyelenggarakan sistem pengelolaan, pemeliharaan, dan inventarisasi sarana prasarana yang tertib, transparan, dan akuntabel sesuai dengan peraturan yang berlaku.',
                  ],
    });

    const handleAddMisi = () => {
        setData('misi', [...data.misi, '']);
    };

    const handleRemoveMisi = (index: number) => {
        if (data.misi.length <= 1) return;
        setData(
            'misi',
            data.misi.filter((_, i) => i !== index)
        );
    };

    const handleMisiChange = (index: number, value: string) => {
        const updated = [...data.misi];
        updated[index] = value;
        setData('misi', updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/visi-misi', {
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout>
            <Head title="Kelola Visi & Misi - Admin Biro Sarpras" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-ink font-serif">
                        Pengaturan Visi & Misi
                    </h1>
                    <p className="text-sm text-muted mt-1">
                        Kelola pernyataan Visi dan daftar poin Misi Biro Sarana & Prasarana Universitas Nurul Huda.
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
                    {/* Form Visi & Misi */}
                    <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-surface-container shadow-sm">
                        <h2 className="text-lg font-bold text-ink mb-5 flex items-center gap-2">
                            <Target className="w-5 h-5 text-primary" />
                            Form Visi & Misi
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Input Visi */}
                            <div>
                                <label className="block text-sm font-semibold text-ink mb-1.5">
                                    Visi Biro Sarana & Prasarana
                                </label>
                                <textarea
                                    rows={4}
                                    value={data.visi}
                                    onChange={(e) => setData('visi', e.target.value)}
                                    placeholder="Tuliskan visi Biro Sarana & Prasarana..."
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    required
                                />
                                {errors.visi && (
                                    <p className="text-xs text-red-600 mt-1">{errors.visi}</p>
                                )}
                            </div>

                            {/* Input Daftar Misi */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-semibold text-ink">
                                        Daftar Poin Misi ({data.misi.length} Poin)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleAddMisi}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-soft text-primary hover:bg-primary hover:text-white text-xs font-semibold transition-colors"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Tambah Poin Misi
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {data.misi.map((item, index) => (
                                        <div key={index} className="flex items-start gap-2.5">
                                            <div className="w-7 h-7 rounded-lg bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0 mt-1.5">
                                                {index + 1}
                                            </div>
                                            <textarea
                                                rows={2}
                                                value={item}
                                                onChange={(e) =>
                                                    handleMisiChange(index, e.target.value)
                                                }
                                                placeholder={`Poin misi ke-${index + 1}...`}
                                                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                required
                                            />
                                            {data.misi.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveMisi(index)}
                                                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors mt-1"
                                                    title="Hapus poin misi"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {errors.misi && (
                                    <p className="text-xs text-red-600 mt-1">{errors.misi}</p>
                                )}
                            </div>

                            <div className="pt-2 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm shadow-sm transition-all disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    {processing ? 'Menyimpan...' : 'Simpan Visi & Misi'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Pratinjau Visi & Misi */}
                    <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-surface-container shadow-sm space-y-5 h-fit">
                        <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                            <Eye className="w-5 h-5 text-primary" />
                            Pratinjau Visi & Misi
                        </h2>

                        <div className="p-5 rounded-2xl bg-surface border border-primary-soft relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
                            <h3 className="text-base font-bold text-ink font-serif mb-2 text-center">
                                Visi
                            </h3>
                            <p className="text-xs sm:text-sm text-muted text-center italic leading-relaxed">
                                "{data.visi || 'Visi belum diisi...'}"
                            </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-surface border border-surface-container">
                            <h3 className="text-base font-bold text-ink font-serif mb-4 text-center pb-2 border-b border-surface-container">
                                Misi
                            </h3>
                            <ul className="space-y-3">
                                {data.misi.map((poin, idx) => (
                                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-muted">
                                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                        <span>{poin || `Poin misi ${idx + 1}...`}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
