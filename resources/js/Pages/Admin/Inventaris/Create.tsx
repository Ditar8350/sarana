import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Package, ArrowLeft, Save, Upload, CheckCircle } from 'lucide-react';

export default function CreateInventaris() {
    // Menggunakan Inertia useForm untuk menangani pengiriman data & file upload
    const { data, setData, post, processing, errors } = useForm({
        kode_barang: '',
        nama_barang: '',
        kategori: 'sarana', // sarana / prasarana
        ruang: '',
        jumlah_baik: 0,
        jumlah_sedang: 0,
        jumlah_buruk: 0,
        harga_perolehan: 0,
        sumber_dana: '',
        tahun_pengadaan: new Date().getFullYear(),
        file_bukti: null as File | null,
    });

    // Kalkulasi otomatis jumlah total dan total harga
    const totalJumlah = Number(data.jumlah_baik) + Number(data.jumlah_sedang) + Number(data.jumlah_buruk);
    const totalHarga = totalJumlah * Number(data.harga_perolehan);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Arahkan ke rute store inventaris backend Laravel kamu nanti
        post('/admin/inventaris', {
            forceFormData: true,
        });
    };

    return (
        <AdminLayout>
            <Head title="Input Inventaris Baru - SINAPRA UNUHA" />

            <div className="max-w-4xl mx-auto space-y-6 pb-12 px-2 sm:px-4">
                {/* Header Navigasi Kembali */}
                <div className="flex items-center justify-between">
                    <div>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#0f4c3a] transition mb-1"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Kembali ke Dashboard</span>
                        </Link>
                        <h1 className="text-2xl font-extrabold text-slate-900">Form Upload / Input Inventaris Aset</h1>
                        <p className="text-xs text-slate-500">
                            Tambahkan data sarana atau prasarana baru lengkap dengan rincian kondisi dan nilai perolehan.
                        </p>
                    </div>
                </div>

                {/* Form Utama */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                    <div className="bg-[#0f4c3a] px-6 py-4 text-white flex items-center gap-3">
                        <Package className="w-5 h-5 text-emerald-300" />
                        <div>
                            <h2 className="text-sm font-bold">Formulir Pendataan Aset Sarana & Prasarana</h2>
                            <p className="text-[11px] text-emerald-100/80">Pastikan field dengan tanda bintang (*) terisi dengan benar.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs">
                        {/* Baris 1: Kode, Kategori, Nama Barang */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block font-bold text-slate-700 mb-1.5">
                                    Kode Barang / Aset <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.kode_barang}
                                    onChange={(e) => setData('kode_barang', e.target.value)}
                                    placeholder="Contoh: BRG-014 atau A.16"
                                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0f4c3a]"
                                    required
                                />
                                {errors.kode_barang && <p className="text-rose-600 mt-1 font-medium">{errors.kode_barang}</p>}
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1.5">
                                    Kategori Aset <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={data.kategori}
                                    onChange={(e) => setData('kategori', e.target.value)}
                                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white font-semibold"
                                >
                                    <option value="sarana">Sarana (Peralatan / Mesin / Alat)</option>
                                    <option value="prasarana">Prasarana (Gedung / Ruangan / Tanah)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1.5">
                                    Lokasi Ruang / Gedung <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.ruang}
                                    onChange={(e) => setData('ruang', e.target.value)}
                                    placeholder="Contoh: R. Kelas 201 / Lab Komputer"
                                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block font-bold text-slate-700 mb-1.5">
                                Nama Lengkap Barang / Fasilitas <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.nama_barang}
                                onChange={(e) => setData('nama_barang', e.target.value)}
                                placeholder="Contoh: Proyektor Epson EB-X500 / AC Split Daikin 2 PK"
                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl"
                                required
                            />
                        </div>

                        {/* Rincian Kondisi (Sesuai Buku Panduan SINAPRA) */}
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                            <label className="block font-bold text-slate-800 text-sm">
                                Rincian Kondisi Fisik & Jumlah Unit
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div>
                                    <span className="block text-[11px] font-bold text-[#0f4c3a] mb-1">Kondisi Baik</span>
                                    <input
                                        type="number"
                                        min={0}
                                        value={data.jumlah_baik}
                                        onChange={(e) => setData('jumlah_baik', Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold"
                                    />
                                </div>
                                <div>
                                    <span className="block text-[11px] font-bold text-amber-700 mb-1">Kondisi Sedang</span>
                                    <input
                                        type="number"
                                        min={0}
                                        value={data.jumlah_sedang}
                                        onChange={(e) => setData('jumlah_sedang', Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold"
                                    />
                                </div>
                                <div>
                                    <span className="block text-[11px] font-bold text-rose-600 mb-1">Kondisi Buruk</span>
                                    <input
                                        type="number"
                                        min={0}
                                        value={data.jumlah_buruk}
                                        onChange={(e) => setData('jumlah_buruk', Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold"
                                    />
                                </div>
                                <div>
                                    <span className="block text-[11px] font-extrabold text-slate-900 mb-1">TOTAL JUMLAH</span>
                                    <input
                                        type="number"
                                        value={totalJumlah}
                                        readOnly
                                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-200 font-extrabold text-slate-900"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Harga & Sumber Dana */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block font-bold text-slate-700 mb-1.5">Harga Perolehan Satuan (Rp)</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={data.harga_perolehan}
                                    onChange={(e) => setData('harga_perolehan', Number(e.target.value))}
                                    placeholder="5500000"
                                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl"
                                />
                            </div>
                            <div>
                                <label className="block font-bold text-slate-700 mb-1.5">TOTAL Nilai Aset (Otomatis)</label>
                                <input
                                    type="text"
                                    readOnly
                                    value={`Rp ${totalHarga.toLocaleString('id-ID')}`}
                                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-emerald-50 font-extrabold text-[#0f4c3a]"
                                />
                            </div>
                            <div>
                                <label className="block font-bold text-slate-700 mb-1.5">Tahun Pengadaan</label>
                                <input
                                    type="number"
                                    value={data.tahun_pengadaan}
                                    onChange={(e) => setData('tahun_pengadaan', Number(e.target.value))}
                                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl"
                                />
                            </div>
                        </div>

                        {/* Upload Berkas / Bukti Foto (Sesuai Panduan Sinapra) */}
                        <div>
                            <label className="block font-bold text-slate-700 mb-1.5">
                                Unggah Dokumen / Foto Bukti Aset (PDF / JPG / PNG, Maks. 10MB)
                            </label>
                            <div className="flex items-center gap-3 p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl">
                                <Upload className="w-8 h-8 text-slate-400 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png,.gif"
                                        onChange={(e) => setData('file_bukti', e.target.files ? e.target.files[0] : null)}
                                        className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#0f4c3a] file:text-white hover:file:bg-[#0a382a]"
                                    />
                                    <p className="text-[11px] text-slate-400 mt-1">Pilih file sertifikat, nota, atau foto fisik barang.</p>
                                </div>
                            </div>
                        </div>

                        {/* Tombol Aksi */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                            <Link
                                href="/dashboard"
                                className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition"
                            >
                                Batal
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2.5 bg-[#0f4c3a] hover:bg-[#0a382a] disabled:bg-emerald-400 text-white rounded-xl font-bold shadow-sm flex items-center gap-2 transition"
                            >
                                <Save className="w-4 h-4" />
                                <span>{processing ? 'Menyimpan...' : 'Simpan Data Inventaris'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}