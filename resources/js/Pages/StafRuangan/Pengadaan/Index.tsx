import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    ShoppingCart,
    Plus,
    Search,
    Clock,
    CheckCircle2,
    AlertCircle,
    X,
    Eye,
    MessageSquare,
    Building2,
    Coins,
    Layers,
    FileText,
} from 'lucide-react';

interface PengadaanItem {
    id: number;
    kode_pengadaan: string;
    nama_barang: string;
    kategori: string;
    jumlah: number;
    satuan: string;
    estimasi_harga_satuan: number;
    total_biaya: number;
    lokasi_penempatan: string;
    ruangan_tujuan?: string;
    alasan_pengadaan: string;
    spesifikasi: string | null;
    status: string;
    catatan_admin: string | null;
    nama_toko_vendor?: string | null;
    foto_bukti_nota?: string | null;
    tanggal_pembelian?: string | null;
    staf_nama?: string | null;
    sarpras_id?: number | null;
    tanggal_diajukan: string;
}

interface Props {
    ruanganNama: string;
    pengadaanList: PengadaanItem[];
}

export default function StafRuanganPengadaanIndex({ ruanganNama, pengadaanList = [] }: Props) {
    const { flash } = usePage().props as any;

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState<PengadaanItem | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('semua');

    // Form State
    const [namaBarang, setNamaBarang] = useState('');
    const [kategori, setKategori] = useState('Elektronik & IT');
    const [jumlah, setJumlah] = useState<number | string>('');
    const [satuan, setSatuan] = useState('Unit');
    const [estimasiHargaSatuan, setEstimasiHargaSatuan] = useState<number | string>('');
    const [alasanPengadaan, setAlasanPengadaan] = useState('');
    const [spesifikasi, setSpesifikasi] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmitPengadaan = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.post(
            '/staf-ruangan/pengadaan',
            {
                nama_barang: namaBarang,
                kategori,
                jumlah,
                satuan,
                estimasi_harga_satuan: estimasiHargaSatuan,
                alasan_pengadaan: alasanPengadaan,
                spesifikasi,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsCreateModalOpen(false);
                    setIsSubmitting(false);
                    setNamaBarang('');
                    setJumlah('');
                    setEstimasiHargaSatuan('');
                    setAlasanPengadaan('');
                    setSpesifikasi('');
                },
                onError: () => {
                    setIsSubmitting(false);
                },
            }
        );
    };

    const filteredList = pengadaanList.filter((item) => {
        const matchesStatus = statusFilter === 'semua' || item.status === statusFilter;
        const matchesSearch =
            item.kode_pengadaan.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.nama_barang.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.alasan_pengadaan.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(val || 0);
    };

    const formatStatus = (status: string) => {
        switch (status) {
            case 'diajukan':
                return {
                    label: 'Diajukan ke Kepala Biro',
                    color: 'bg-amber-50 text-amber-700 border-amber-200',
                    icon: Clock,
                };
            case 'disetujui':
                return {
                    label: 'Disetujui untuk Diadakan',
                    color: 'bg-blue-50 text-blue-700 border-blue-200',
                    icon: CheckCircle2,
                };
            case 'selesai':
                return {
                    label: 'Barang Telah Tiba di Ruangan',
                    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    icon: CheckCircle2,
                };
            case 'ditolak':
                return {
                    label: 'Ditolak / Ditunda',
                    color: 'bg-rose-50 text-rose-700 border-rose-200',
                    icon: AlertCircle,
                };
            default:
                return {
                    label: status,
                    color: 'bg-slate-100 text-slate-700 border-slate-200',
                    icon: Clock,
                };
        }
    };

    return (
        <AdminLayout>
            <Head title={`Pengadaan Barang - ${ruanganNama}`} />

            <div className="max-w-7xl mx-auto space-y-6 pb-16 px-2 sm:px-4 font-sans text-slate-800 text-xs">
                {/* Header Banner - Rapi & Elegan */}
                <div className="bg-gradient-to-r from-[#006039] via-[#094c34] to-[#004225] text-white p-6 sm:p-7 rounded-3xl shadow-sm relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />

                    <div className="relative z-10 space-y-3.5 max-w-2xl">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider bg-white/15 px-3 py-1 rounded-full border border-white/20 text-emerald-100">
                                <Building2 className="w-3.5 h-3.5 text-emerald-200" />
                                <span>Unit Penugasan: {ruanganNama}</span>
                            </span>
                        </div>

                        <div className="space-y-1.5">
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-snug">
                                Usulan Pengadaan Barang &amp; Fasilitas
                            </h1>
                            <p className="text-emerald-100/90 text-xs sm:text-sm leading-relaxed">
                                Pantau riwayat dan perkembangan usulan pengadaan sarana/barang baru untuk kebutuhan unit {ruanganNama}.
                            </p>
                        </div>
                    </div>

                    <div className="relative z-10 w-full sm:w-80 shrink-0">
                        <Search className="w-4 h-4 text-emerald-900/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Cari kode, barang, atau alasan..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-white text-slate-800 rounded-xl text-xs font-medium placeholder-slate-400 shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-300 transition"
                        />
                    </div>
                </div>

                {/* Flash Success Message */}
                {flash?.success && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span className="font-semibold text-xs">{flash.success}</span>
                    </div>
                )}

                {/* Filter & Toolbar */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
                    <span className="text-slate-600 font-bold text-xs">
                        Daftar Usulan Barang ({filteredList.length})
                    </span>

                    <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-[11px]">Filter Status:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#006039] focus:outline-none"
                        >
                            <option value="semua">Semua Usulan</option>
                            <option value="diajukan">Diajukan</option>
                            <option value="disetujui">Disetujui</option>
                            <option value="selesai">Selesai / Tiba</option>
                            <option value="ditolak">Ditolak</option>
                        </select>
                    </div>
                </div>

                {/* List Pengadaan */}
                {filteredList.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                            <ShoppingCart className="w-8 h-8" strokeWidth={1.75} />
                        </div>
                        <h4 className="text-sm font-bold text-slate-800">Tidak Ada Usulan Pengadaan Barang</h4>
                        <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto mb-4">
                            Belum ada usulan pengadaan barang baru untuk ruangan ini. Ajukan jika sarana pendukung belum mencukupi.
                        </p>
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-4 py-2 bg-[#006039] text-white rounded-xl text-xs font-extrabold hover:bg-[#004d2e] transition cursor-pointer"
                        >
                            Ajukan Barang Baru
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredList.map((item) => {
                            const statusInfo = formatStatus(item.status);
                            const StatusIcon = statusInfo.icon;

                            return (
                                <div
                                    key={item.id}
                                    className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:border-emerald-200 transition"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg text-[11px] border border-slate-200">
                                                    {item.kode_pengadaan}
                                                </span>
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                                    {item.kategori}
                                                </span>
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${statusInfo.color}`}
                                                >
                                                    <span>{statusInfo.label}</span>
                                                </span>
                                                <span className="text-slate-400 text-[11px] ml-1">
                                                    Diajukan: {item.tanggal_diajukan}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <h3 className="text-sm font-extrabold text-slate-900">
                                                    {item.nama_barang}
                                                </h3>
                                                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                                    Jumlah: {item.jumlah} {item.satuan}
                                                </span>
                                                {item.total_biaya > 0 && (
                                                    <span className="text-xs font-bold text-slate-700">
                                                        Est. {formatCurrency(item.total_biaya)}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px]">
                                                <p className="font-bold text-slate-700 mb-0.5">Alasan Kebutuhan Pengadaan:</p>
                                                <p className="text-slate-600 leading-relaxed">
                                                    {item.alasan_pengadaan}
                                                </p>
                                            </div>

                                            {item.catatan_admin && (
                                                <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 text-[11px]">
                                                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                    <span>Catatan Pimpinan: {item.catatan_admin}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedDetail(item)}
                                                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                                            >
                                                Detail Usulan
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Modal Detail Usulan Pengadaan */}
                {selectedDetail && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                        <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-xl text-xs">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        Detail Usulan Pengadaan
                                    </span>
                                    <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                                        {selectedDetail.kode_pengadaan}
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedDetail(null)}
                                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <span className="text-slate-400 text-[10px] uppercase font-bold">Nama Barang</span>
                                    <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                                        {selectedDetail.nama_barang} ({selectedDetail.jumlah} {selectedDetail.satuan})
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                                    <div>
                                        <p className="text-slate-500 text-[11px]">Kategori:</p>
                                        <p className="font-bold text-slate-900 mt-0.5">
                                            {selectedDetail.kategori}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-[11px]">Status:</p>
                                        <p className="font-bold text-emerald-700 mt-0.5">
                                            {formatStatus(selectedDetail.status).label}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-[11px]">Harga Satuan (Est):</p>
                                        <p className="font-bold text-slate-900 mt-0.5">
                                            {formatCurrency(selectedDetail.estimasi_harga_satuan)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-[11px]">Total Estimasi:</p>
                                        <p className="font-extrabold text-emerald-800 mt-0.5">
                                            {formatCurrency(selectedDetail.total_biaya)}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <span className="text-slate-700 font-bold block mb-1">Alasan Pengadaan:</span>
                                    <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                                        {selectedDetail.alasan_pengadaan}
                                    </p>
                                </div>

                                {selectedDetail.spesifikasi && (
                                    <div>
                                        <span className="text-slate-700 font-bold block mb-1">Spesifikasi Tambahan:</span>
                                        <p className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                                            {selectedDetail.spesifikasi}
                                        </p>
                                    </div>
                                )}

                                {selectedDetail.catatan_admin && (
                                    <div>
                                        <span className="text-slate-700 font-bold block mb-1">Catatan Pimpinan / Biro:</span>
                                        <p className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-900">
                                            {selectedDetail.catatan_admin}
                                        </p>
                                    </div>
                                )}

                                {selectedDetail.status === 'selesai' && (
                                    <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2">
                                        <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                            <span>Realisasi Pembelian oleh Staf Sarpras</span>
                                        </div>
                                        <div className="text-[11px] text-slate-700 space-y-1">
                                            <div><strong>Staf Pelaksana:</strong> {selectedDetail.staf_nama || 'Staf Sarpras'}</div>
                                            {selectedDetail.nama_toko_vendor && <div><strong>Toko / Vendor:</strong> {selectedDetail.nama_toko_vendor}</div>}
                                            {selectedDetail.tanggal_pembelian && <div><strong>Tanggal Beli:</strong> {selectedDetail.tanggal_pembelian}</div>}
                                            <div className="text-emerald-800 font-semibold pt-1">
                                                ✓ Barang telah otomatis masuk ke daftar inventaris ruangan ({selectedDetail.ruangan_tujuan || selectedDetail.lokasi_penempatan}).
                                            </div>
                                        </div>
                                        {selectedDetail.foto_bukti_nota && (
                                            <div className="pt-2">
                                                <a
                                                    href={selectedDetail.foto_bukti_nota}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
                                                >
                                                    <FileText className="w-3.5 h-3.5" />
                                                    <span>Lihat Bukti Struk / Nota Pembelian</span>
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setSelectedDetail(null)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Buat Usulan Pengadaan Baru */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                        <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-xl text-xs">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div>
                                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                                        Formulir Usulan Baru
                                    </span>
                                    <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                                        Ajukan Pengadaan Barang - {ruanganNama}
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmitPengadaan} className="space-y-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        Nama Barang / Fasilitas yang Dibutuhkan *
                                    </label>
                                    <input
                                        type="text"
                                        value={namaBarang}
                                        onChange={(e) => setNamaBarang(e.target.value)}
                                        placeholder="Contoh: Kabel HDMI 10 Meter, Mikrofon Wireless, Lemari Arsip..."
                                        required
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#006039] focus:outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                            Kategori Barang *
                                        </label>
                                        <select
                                            value={kategori}
                                            onChange={(e) => setKategori(e.target.value)}
                                            required
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#006039] focus:outline-none"
                                        >
                                            <option value="Elektronik & IT">Elektronik & IT</option>
                                            <option value="Audio & Visual">Audio & Visual</option>
                                            <option value="Furnitur & Mebel">Furnitur & Mebel</option>
                                            <option value="Peralatan Kebersihan">Peralatan Kebersihan</option>
                                            <option value="Perlengkapan Ruangan">Perlengkapan Ruangan</option>
                                            <option value="Lainnya">Lainnya</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                                Jumlah *
                                            </label>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={jumlah}
                                                onChange={(e) => {
                                                    const raw = e.target.value.replace(/\D/g, '');
                                                    setJumlah(raw === '' ? '' : parseInt(raw, 10));
                                                }}
                                                placeholder="Contoh: 10"
                                                required
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#006039] focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                                Satuan *
                                            </label>
                                            <input
                                                type="text"
                                                value={satuan}
                                                onChange={(e) => setSatuan(e.target.value)}
                                                placeholder="Unit, Pcs, Set..."
                                                required
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#006039] focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        Estimasi Harga Satuan (Rp) *
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={estimasiHargaSatuan}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/\D/g, '');
                                            setEstimasiHargaSatuan(raw === '' ? '' : parseInt(raw, 10));
                                        }}
                                        placeholder="Contoh: 250000"
                                        required
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#006039] focus:outline-none"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        Estimasi total:{' '}
                                        <strong className="text-emerald-700 font-extrabold">
                                            {formatCurrency((Number(jumlah) || 0) * (Number(estimasiHargaSatuan) || 0))}
                                        </strong>
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        Alasan Pengadaan & Kebutuhan Mendesak *
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={alasanPengadaan}
                                        onChange={(e) => setAlasanPengadaan(e.target.value)}
                                        placeholder="Jelaskan alasan mengapa barang ini dibutuhkan di ruangan Anda (minimal 10 karakter)..."
                                        required
                                        minLength={10}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#006039] focus:outline-none"
                                    />
                                    <p className="text-[10px] text-emerald-800 font-semibold mt-1">
                                        * Alasan pengadaan wajib diisi secara rinci untuk persetujuan anggaran Kepala Biro.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        Spesifikasi Tambahan (Opsional)
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={spesifikasi}
                                        onChange={(e) => setSpesifikasi(e.target.value)}
                                        placeholder="Merek, dimensi, port konektor, tipe..."
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#006039] focus:outline-none"
                                    />
                                </div>

                                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-5 py-2 bg-[#006039] hover:bg-[#004d2e] text-white rounded-xl text-xs font-extrabold shadow-sm transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                                    >
                                        {isSubmitting ? 'Mengirim...' : 'Kirim Usulan Pengadaan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
