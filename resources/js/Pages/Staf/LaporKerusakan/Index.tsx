import React, { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    Wrench,
    Plus,
    Clock,
    CheckCircle2,
    AlertCircle,
    Upload,
    Building2,
    FileText,
} from 'lucide-react';

interface RiwayatItem {
    id: number;
    kode_tiket: string;
    sarpras_nama: string;
    lokasi_ruang: string;
    tingkat_urgensi: string;
    deskripsi_kerusakan: string;
    foto_kerusakan: string | null;
    status: string;
    nama_teknisi: string | null;
    catatan_admin: string | null;
    tanggal_lapor: string;
}

interface Props {
    riwayatSaya: RiwayatItem[];
    sarprasKatalog: Array<{ id: number; nama: string; lokasi: string }>;
}

export default function LaporKerusakanIndex({ riwayatSaya = [], sarprasKatalog = [] }: Props) {
    const { flash, auth } = usePage().props as any;

    const { data, setData, post, processing, errors, reset } = useForm({
        sarpras_id: '' as string | number,
        nama_sarpras: '',
        lokasi_ruang: '',
        tingkat_urgensi: 'sedang',
        deskripsi_kerusakan: '',
        foto_kerusakan: null as File | null,
    });

    const handleSelectKatalog = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setData('sarpras_id', id);
        if (id) {
            const item = sarprasKatalog.find((k) => k.id === parseInt(id));
            if (item) {
                setData((prev) => ({
                    ...prev,
                    sarpras_id: id,
                    nama_sarpras: item.nama,
                    lokasi_ruang: item.lokasi,
                }));
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/staf/lapor-kerusakan', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset('nama_sarpras', 'lokasi_ruang', 'deskripsi_kerusakan', 'foto_kerusakan', 'sarpras_id');
            },
        });
    };

    return (
        <AdminLayout>
            <Head title="Lapor Maintenance & Kerusakan Fasilitas - PIC Ruangan" />

            <div className="max-w-7xl mx-auto space-y-6 pb-12 px-2 sm:px-4 font-sans text-slate-800 text-xs">
                {/* Header */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 border border-slate-200/80 flex items-center justify-center shrink-0">
                            <Wrench className="w-5 h-5" strokeWidth={1.75} />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                                Layanan Pengaduan Maintenance Fasilitas
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Formulir bagi PIC Ruangan untuk melaporkan kerusakan sarana &amp; prasarana kampus agar segera ditangani oleh Admin &amp; Teknisi.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Alerts */}
                {flash?.success && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-[#006039] text-sm font-semibold">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}

                {/* Form & Riwayat Pengaduan */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Form Lapor Kerusakan */}
                    <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                        <h2 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b flex items-center gap-2">
                            <Plus className="w-5 h-5 text-[#006039]" />
                            Formulir Pengaduan Kerusakan
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                            <div>
                                <label className="block font-semibold mb-1">
                                    Pilih dari Katalog Sarpras (Opsional jika terdaftar):
                                </label>
                                <select
                                    value={data.sarpras_id}
                                    onChange={handleSelectKatalog}
                                    className="w-full px-3 py-2 border rounded-xl"
                                >
                                    <option value="">-- Ketik manual jika barang kelas/ruang lain --</option>
                                    {sarprasKatalog.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.nama} ({item.lokasi})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold mb-1">Nama Fasilitas / Sarana</label>
                                    <input
                                        type="text"
                                        required
                                        value={data.nama_sarpras}
                                        onChange={(e) => setData('nama_sarpras', e.target.value)}
                                        placeholder="Misal: AC Split 2PK, LCD Proyektor"
                                        className="w-full px-3 py-2 border rounded-xl"
                                    />
                                    {errors.nama_sarpras && <p className="text-rose-600 mt-1">{errors.nama_sarpras}</p>}
                                </div>
                                <div>
                                    <label className="block font-semibold mb-1">Lokasi Ruang / Gedung</label>
                                    <input
                                        type="text"
                                        required
                                        value={data.lokasi_ruang}
                                        onChange={(e) => setData('lokasi_ruang', e.target.value)}
                                        placeholder="Misal: Ruang C-03 Kampus A"
                                        className="w-full px-3 py-2 border rounded-xl"
                                    />
                                    {errors.lokasi_ruang && <p className="text-rose-600 mt-1">{errors.lokasi_ruang}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block font-semibold mb-1">Tingkat Urgensi Kerusakan</label>
                                <select
                                    value={data.tingkat_urgensi}
                                    onChange={(e) => setData('tingkat_urgensi', e.target.value as any)}
                                    className="w-full px-3 py-2 border rounded-xl font-bold"
                                >
                                    <option value="rendah">Rendah (Masih bisa digunakan sementara)</option>
                                    <option value="sedang">Sedang (Perlu perbaikan berkala)</option>
                                    <option value="tinggi">Tinggi (Mengganggu proses belajar / rapat)</option>
                                    <option value="darurat">Darurat (Konsleting, kebocoran pipa parah, padam total)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-semibold mb-1">Deskripsi Kerusakan & Gejala</label>
                                <textarea
                                    rows={3}
                                    required
                                    value={data.deskripsi_kerusakan}
                                    onChange={(e) => setData('deskripsi_kerusakan', e.target.value)}
                                    placeholder="Jelaskan secara detail bagian mana yang rusak atau bunyi tidak normal..."
                                    className="w-full px-3 py-2 border rounded-xl"
                                />
                                {errors.deskripsi_kerusakan && <p className="text-rose-600 mt-1">{errors.deskripsi_kerusakan}</p>}
                            </div>

                            <div>
                                <label className="block font-semibold mb-1">Foto Bukti Kerusakan (Opsional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setData('foto_kerusakan', e.target.files?.[0] || null)}
                                    className="text-[11px]"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-2.5 rounded-xl bg-[#006039] hover:bg-[#0f4c3a] text-white font-bold transition shadow-xs disabled:opacity-60"
                            >
                                {processing ? 'Mengirim Pengaduan...' : 'Kirim Laporan Kerusakan'}
                            </button>
                        </form>
                    </div>

                    {/* Riwayat Pengaduan Saya */}
                    <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                        <h2 className="text-base font-bold text-slate-900 pb-2 border-b flex items-center gap-2">
                            <Clock className="w-5 h-5 text-[#006039]" />
                            Riwayat Laporan Kerusakan Saya ({riwayatSaya.length})
                        </h2>

                        <div className="space-y-3">
                            {riwayatSaya.map((r) => (
                                <div key={r.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-[11px] text-slate-500">
                                            {r.tanggal_lapor}
                                        </span>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                            r.status === 'selesai'
                                                ? 'bg-emerald-100 text-[#006039]'
                                                : r.status === 'dalam_pengerjaan'
                                                ? 'bg-blue-100 text-blue-800'
                                                : r.status === 'menunggu_tinjauan'
                                                ? 'bg-amber-100 text-amber-800'
                                                : 'bg-rose-100 text-rose-700'
                                        }`}>
                                            {r.status.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-slate-900 text-sm">{r.sarpras_nama}</h4>
                                        <p className="text-[11px] text-slate-500">{r.lokasi_ruang} • Urgensi: <strong className="uppercase">{r.tingkat_urgensi}</strong></p>
                                        <p className="text-xs text-slate-700 mt-1">{r.deskripsi_kerusakan}</p>
                                    </div>

                                    {r.nama_teknisi && (
                                        <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-900">
                                            <strong>Teknisi Ditunjuk:</strong> {r.nama_teknisi}
                                        </div>
                                    )}

                                    {r.catatan_admin && (
                                        <div className="p-2 bg-white border rounded-lg text-[11px] text-slate-600">
                                            <strong>Catatan Biro Sarpras:</strong> {r.catatan_admin}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {riwayatSaya.length === 0 && (
                                <p className="text-center py-8 text-slate-400">
                                    Belum ada laporan kerusakan yang pernah Anda kirimkan.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
