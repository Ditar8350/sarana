import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { PageProps } from '@/types';
import {
    CheckCircle2,
    Calendar,
    ChevronRight,
    Package,
    ClipboardCheck,
    User,
    ArrowRight,
} from 'lucide-react';

interface InventarisItem {
    id: number;
    kode: string;
    nama: string;
    kategori: string;
    lokasi: string;
    stok_total: number;
    stok_tersedia: number;
    satuan: string;
    kondisi_umum: string;
}

interface PengecekanItem {
    id: number;
    kode: string;
    tanggal: string;
    kondisi_sarpras: string;
    kondisi_kebersihan: string;
    status_tinjauan: string;
    catatan: string;
    catatan_admin: string | null;
    jumlah_item?: number;
}

interface MaintenanceItem {
    id: number;
    kode_tiket: string;
    nama_sarpras: string;
    tingkat_urgensi: string;
    status: string;
    tanggal_lapor: string;
}

interface PengadaanItem {
    id: number;
    kode: string;
    nama_barang: string;
    jumlah: string;
    status: string;
    tanggal: string;
}

interface BeritaItem {
    id: number;
    title: string;
    slug: string;
    image: string;
    date: string;
    excerpt?: string;
    author?: string;
}

interface Props {
    ruanganNama: string;
    stats: {
        total_sarana: number;
        total_pengecekan: number;
        maintenance_aktif: number;
        pengadaan_diajukan: number;
    };
    inventaris?: InventarisItem[];
    pengecekanTerakhir: PengecekanItem[];
    maintenanceTerkini: MaintenanceItem[];
    pengadaanTerkini: PengadaanItem[];
    berita?: BeritaItem[];
}

export default function StafRuanganDashboard({
    ruanganNama,
    stats,
    inventaris = [],
    pengecekanTerakhir = [],
    maintenanceTerkini = [],
    pengadaanTerkini = [],
    berita = [],
}: Props) {
    const { auth } = usePage<PageProps>().props;
    const [selectedCard, setSelectedCard] = useState<'inventaris' | 'inspeksi' | 'perbaikan' | 'pengadaan'>('inventaris');
    const [leftTab, setLeftTab] = useState<'inventaris' | 'laporan'>('inventaris');
    const [rightTab, setRightTab] = useState<'perbaikan' | 'pengadaan'>('perbaikan');

    const cleanUserName = (auth.user.name || 'PIC Ruangan')
        .replace(/\s*\(Kepala Bagian\)\s*/gi, '')
        .replace(/\s*\(PIC Ruangan\)\s*/gi, '')
        .trim();

    const formatUrgensi = (urgensi: string) => {
        switch (urgensi) {
            case 'darurat':
                return { label: 'Darurat', color: 'bg-rose-50 text-rose-700 border-rose-200' };
            case 'tinggi':
                return { label: 'Tinggi', color: 'bg-amber-50 text-amber-700 border-amber-200' };
            case 'sedang':
                return { label: 'Sedang', color: 'bg-sky-50 text-sky-700 border-sky-200' };
            default:
                return { label: 'Rendah', color: 'bg-slate-100 text-slate-700 border-slate-200' };
        }
    };

    const formatStatusMaintenance = (status: string) => {
        switch (status) {
            case 'selesai':
                return { label: 'Selesai', color: 'bg-emerald-50 text-[#006039] border-emerald-200' };
            case 'dalam_pengerjaan':
                return { label: 'Dikerjakan', color: 'bg-purple-50 text-purple-700 border-purple-200' };
            case 'disetujui':
                return { label: 'Disetujui', color: 'bg-blue-50 text-blue-700 border-blue-200' };
            default:
                return { label: 'Menunggu', color: 'bg-amber-50 text-amber-700 border-amber-200' };
        }
    };

    const formatStatusPengadaan = (status: string) => {
        switch (status) {
            case 'selesai':
                return { label: 'Selesai', color: 'bg-emerald-50 text-[#006039] border-emerald-200' };
            case 'disetujui':
                return { label: 'Disetujui', color: 'bg-blue-50 text-blue-700 border-blue-200' };
            case 'ditolak':
                return { label: 'Ditolak', color: 'bg-rose-50 text-rose-700 border-rose-200' };
            default:
                return { label: 'Diajukan', color: 'bg-amber-50 text-amber-700 border-amber-200' };
        }
    };

    return (
        <AdminLayout>
            <Head title={`Dashboard PIC Ruangan - ${ruanganNama} - Biro Sarpras UNUHA`} />

            <div className="w-full space-y-5 pb-12 font-sans text-slate-800 text-xs">
                {/* 1. Banner Sambutan Hijau Tua Elegan */}
                <div className="relative overflow-hidden bg-gradient-to-r from-[#005530] via-[#006039] to-[#004726] text-white p-5 sm:p-6 rounded-2xl shadow-xs">
                    <div className="relative z-10 space-y-2 max-w-4xl">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center text-[10px] font-extrabold uppercase tracking-wider bg-white/10 text-white px-3 py-1 rounded-full border border-white/15">
                                UNIT PENUGASAN: {ruanganNama.toUpperCase()}
                            </span>
                            <span className="text-[10px] font-black bg-[#F59E0B] text-slate-900 px-3 py-1 rounded-full shadow-2xs">
                                PIC Ruangan
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                            Halo, {cleanUserName}
                        </h1>
                        <p className="text-emerald-50/90 text-xs sm:text-[13px] leading-relaxed">
                            Kelola inventaris fasilitas <strong>{ruanganNama}</strong>, laporan pengecekan, serta status perbaikan dan pengadaan.
                        </p>
                    </div>
                </div>

                {/* 2. 4 Kartu Ringkasan Interaktif */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                    {/* Kartu 1: Inventaris */}
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedCard('inventaris');
                            setLeftTab('inventaris');
                        }}
                        className={`p-4 sm:p-5 rounded-2xl text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-w-0 ${
                            selectedCard === 'inventaris'
                                ? 'bg-[#006039] text-white shadow-md ring-2 ring-[#006039]'
                                : 'bg-white text-slate-800 border border-slate-200/85 hover:border-slate-300 shadow-2xs'
                        }`}
                    >
                        <div>
                            <div className="w-8 h-1 bg-[#F59E0B] rounded-full mb-3" />
                            <span className={`text-xs font-bold truncate block ${selectedCard === 'inventaris' ? 'text-white/90' : 'text-slate-600'}`}>
                                Inventaris
                            </span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-1.5">
                            <span className={`text-2xl sm:text-3xl font-black ${selectedCard === 'inventaris' ? 'text-white' : 'text-slate-900'}`}>
                                {stats.total_sarana}
                            </span>
                            <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                                    selectedCard === 'inventaris'
                                        ? 'bg-[#004d2e] text-emerald-200 border-emerald-500/30'
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
                                }`}
                            >
                                Terdata
                            </span>
                        </div>
                    </button>

                    {/* Kartu 2: Inspeksi Terkirim */}
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedCard('inspeksi');
                            setLeftTab('laporan');
                        }}
                        className={`p-4 sm:p-5 rounded-2xl text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-w-0 ${
                            selectedCard === 'inspeksi'
                                ? 'bg-[#006039] text-white shadow-md ring-2 ring-[#006039]'
                                : 'bg-white text-slate-800 border border-slate-200/85 hover:border-slate-300 shadow-2xs'
                        }`}
                    >
                        <div>
                            <div className="w-8 h-1 bg-blue-600 rounded-full mb-3" />
                            <span className={`text-xs font-bold truncate block ${selectedCard === 'inspeksi' ? 'text-white/90' : 'text-slate-600'}`}>
                                Inspeksi Terkirim
                            </span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-1.5">
                            <span className={`text-2xl sm:text-3xl font-black ${selectedCard === 'inspeksi' ? 'text-white' : 'text-slate-900'}`}>
                                {stats.total_pengecekan}
                            </span>
                            <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                                    selectedCard === 'inspeksi'
                                        ? 'bg-[#004d2e] text-emerald-200 border-emerald-500/30'
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
                                }`}
                            >
                                Terkirim
                            </span>
                        </div>
                    </button>

                    {/* Kartu 3: Perbaikan */}
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedCard('perbaikan');
                            setRightTab('perbaikan');
                        }}
                        className={`p-4 sm:p-5 rounded-2xl text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-w-0 ${
                            selectedCard === 'perbaikan'
                                ? 'bg-[#006039] text-white shadow-md ring-2 ring-[#006039]'
                                : 'bg-white text-slate-800 border border-slate-200/85 hover:border-slate-300 shadow-2xs'
                        }`}
                    >
                        <div>
                            <div className="w-8 h-1 bg-orange-500 rounded-full mb-3" />
                            <span className={`text-xs font-bold truncate block ${selectedCard === 'perbaikan' ? 'text-white/90' : 'text-slate-600'}`}>
                                Perbaikan
                            </span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-1.5">
                            <span className={`text-2xl sm:text-3xl font-black ${selectedCard === 'perbaikan' ? 'text-white' : 'text-slate-900'}`}>
                                {stats.maintenance_aktif}
                            </span>
                            <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                                    selectedCard === 'perbaikan'
                                        ? 'bg-[#004d2e] text-emerald-200 border-emerald-500/30'
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
                                }`}
                            >
                                Aktif
                            </span>
                        </div>
                    </button>

                    {/* Kartu 4: Pengadaan */}
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedCard('pengadaan');
                            setRightTab('pengadaan');
                        }}
                        className={`p-4 sm:p-5 rounded-2xl text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-w-0 ${
                            selectedCard === 'pengadaan'
                                ? 'bg-[#006039] text-white shadow-md ring-2 ring-[#006039]'
                                : 'bg-white text-slate-800 border border-slate-200/85 hover:border-slate-300 shadow-2xs'
                        }`}
                    >
                        <div>
                            <div className="w-8 h-1 bg-purple-600 rounded-full mb-3" />
                            <span className={`text-xs font-bold truncate block ${selectedCard === 'pengadaan' ? 'text-white/90' : 'text-slate-600'}`}>
                                Pengadaan
                            </span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-1.5">
                            <span className={`text-2xl sm:text-3xl font-black ${selectedCard === 'pengadaan' ? 'text-white' : 'text-slate-900'}`}>
                                {stats.pengadaan_diajukan}
                            </span>
                            <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                                    selectedCard === 'pengadaan'
                                        ? 'bg-[#004d2e] text-emerald-200 border-emerald-500/30'
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
                                }`}
                            >
                                Diajukan
                            </span>
                        </div>
                    </button>
                </div>

                {/* 3. Baris Utama Seimbang 2 Kolom (Kiri: Inventaris & Laporan, Kanan: Perbaikan & Pengadaan) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-stretch">
                    {/* Kolom Kiri: Card Kotak Putih Inventaris & Laporan Pengecekan */}
                    <div className="bg-white rounded-2xl border border-slate-200/85 shadow-2xs p-4 sm:p-5 flex flex-col h-[340px] sm:h-[360px] min-w-0 overflow-hidden">
                        {/* Segmented Control / Tab Switcher Pill */}
                        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 shrink-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setLeftTab('inventaris');
                                        setSelectedCard('inventaris');
                                    }}
                                    className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                                        leftTab === 'inventaris'
                                            ? 'bg-[#006039] text-white shadow-xs'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                >
                                    Inventaris ({stats.total_sarana})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setLeftTab('laporan');
                                        setSelectedCard('inspeksi');
                                    }}
                                    className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                                        leftTab === 'laporan'
                                            ? 'bg-[#006039] text-white shadow-xs'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                >
                                    Laporan Selesai ({pengecekanTerakhir.length})
                                </button>
                            </div>

                            <Link
                                href={
                                    leftTab === 'inventaris'
                                        ? '/staf-ruangan/inventaris'
                                        : '/staf-ruangan/inventaris?tab=pengecekan'
                                }
                                className="text-xs font-bold text-[#006039] hover:underline inline-flex items-center gap-1 shrink-0 whitespace-nowrap"
                            >
                                <span>Lihat Semua</span>
                                <span>→</span>
                            </Link>
                        </div>

                        {/* Konten Scrollable Tab Kiri */}
                        <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0 pt-2 custom-scrollbar">
                            {/* Tab 1: Tabel Inventaris */}
                            {leftTab === 'inventaris' && (
                                inventaris.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2">
                                        <Package className="w-8 h-8 text-slate-300" />
                                        <p className="text-xs font-bold text-slate-600">Belum Ada Inventaris Terdata</p>
                                        <Link
                                            href="/staf-ruangan/inventaris"
                                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#006039] text-white rounded-xl text-xs font-bold mt-1"
                                        >
                                            <span>Tambah Inventaris</span>
                                        </Link>
                                    </div>
                                ) : (
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead className="sticky top-0 bg-white text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100 z-10">
                                            <tr>
                                                <th className="py-2.5 pr-3">NAMA ALAT / SARANA</th>
                                                <th className="py-2.5 px-2 text-center whitespace-nowrap">STOK</th>
                                                <th className="py-2.5 px-2 text-center whitespace-nowrap">KONDISI</th>
                                                <th className="py-2.5 pl-2 pr-1 text-right whitespace-nowrap">AKSI</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {inventaris.map((item) => (
                                                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                                                    <td className="py-3 pr-3 font-bold text-slate-900 text-xs min-w-[120px]">
                                                        <span className="line-clamp-2" title={item.nama}>
                                                            {item.nama}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-2 text-center whitespace-nowrap font-bold text-slate-800 text-xs">
                                                        {item.stok_total} {item.satuan}
                                                    </td>
                                                    <td className="py-3 px-2 text-center whitespace-nowrap">
                                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            {item.kondisi_umum ? item.kondisi_umum.toLowerCase() : 'baik'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 pl-2 pr-1 text-right whitespace-nowrap">
                                                        <Link
                                                            href={`/staf-ruangan/maintenance?sarpras_id=${item.id}&nama_sarpras=${encodeURIComponent(
                                                                item.nama
                                                            )}`}
                                                            className="inline-block px-3 py-1 bg-[#FEF3C7]/80 hover:bg-[#FEF3C7] text-amber-900 border border-amber-200/90 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
                                                        >
                                                            Servis
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )
                            )}

                            {/* Tab 2: Tabel Riwayat Laporan Selesai */}
                            {leftTab === 'laporan' && (
                                pengecekanTerakhir.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2">
                                        <ClipboardCheck className="w-8 h-8 text-slate-300" />
                                        <p className="text-xs font-bold text-slate-600">Belum Ada Laporan Terkirim</p>
                                        <Link
                                            href="/staf-ruangan/inventaris"
                                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#006039] text-white rounded-xl text-xs font-bold mt-1"
                                        >
                                            <span>Kirim Laporan Inventaris</span>
                                        </Link>
                                    </div>
                                ) : (
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead className="sticky top-0 bg-white text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100 z-10">
                                            <tr>
                                                <th className="py-2.5 pr-3">TANGGAL</th>
                                                <th className="py-2.5 px-2">RINGKASAN LAPORAN</th>
                                                <th className="py-2.5 pl-2 pr-1 text-right whitespace-nowrap">STATUS</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {pengecekanTerakhir.map((p) => (
                                                <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                                                    <td className="py-3 pr-3 whitespace-nowrap text-slate-700 font-bold text-xs">
                                                        {p.tanggal}
                                                    </td>
                                                    <td className="py-3 px-2 max-w-xs">
                                                        <p className="text-slate-700 font-medium truncate">
                                                            {p.catatan || 'Laporan inspeksi sarpras'}
                                                        </p>
                                                    </td>
                                                    <td className="py-3 pl-2 pr-1 text-right whitespace-nowrap">
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#006039] border border-emerald-200">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            <span>Selesai</span>
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )
                            )}
                        </div>
                    </div>

                    {/* Kolom Kanan: Card Kotak Putih Perbaikan & Pengadaan */}
                    <div className="bg-white rounded-2xl border border-slate-200/85 shadow-2xs p-4 sm:p-5 flex flex-col h-[340px] sm:h-[360px] min-w-0 overflow-hidden">
                        {/* Segmented Control / Tab Switcher Pill */}
                        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 shrink-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setRightTab('perbaikan');
                                        setSelectedCard('perbaikan');
                                    }}
                                    className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                                        rightTab === 'perbaikan'
                                            ? 'bg-[#006039] text-white shadow-xs'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                >
                                    Perbaikan ({maintenanceTerkini.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setRightTab('pengadaan');
                                        setSelectedCard('pengadaan');
                                    }}
                                    className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                                        rightTab === 'pengadaan'
                                            ? 'bg-[#006039] text-white shadow-xs'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                >
                                    Pengadaan ({pengadaanTerkini.length})
                                </button>
                            </div>

                            <Link
                                href={
                                    rightTab === 'perbaikan'
                                        ? '/staf-ruangan/maintenance'
                                        : '/staf-ruangan/pengadaan'
                                }
                                className="text-xs font-bold text-[#006039] hover:underline inline-flex items-center gap-1 shrink-0 whitespace-nowrap"
                            >
                                <span>Kelola</span>
                                <span>→</span>
                            </Link>
                        </div>

                        {/* Konten Scrollable Tab Kanan */}
                        <div className="flex-1 overflow-y-auto min-h-0 pt-2 custom-scrollbar">
                            {/* Tab 1: Perbaikan */}
                            {rightTab === 'perbaikan' && (
                                maintenanceTerkini.length === 0 ? (
                                    <div className="p-5 sm:p-6 bg-emerald-50/40 rounded-2xl border border-emerald-100/90 text-left h-full flex flex-col justify-center">
                                        <h4 className="font-extrabold text-sm text-slate-900">
                                            Tidak Ada Perbaikan Aktif
                                        </h4>
                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                            Seluruh fasilitas di {ruanganNama} dalam kondisi baik.
                                        </p>
                                        <div className="mt-4">
                                            <Link
                                                href="/staf-ruangan/maintenance"
                                                className="inline-block px-4 py-2 bg-[#006039] hover:bg-[#004d2e] text-white rounded-xl text-xs font-bold shadow-xs transition"
                                            >
                                                Ajukan Perbaikan Barang
                                            </Link>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2.5 pr-1">
                                        {maintenanceTerkini.map((m) => {
                                            const urgensiInfo = formatUrgensi(m.tingkat_urgensi);
                                            const statusInfo = formatStatusMaintenance(m.status);
                                            return (
                                                <div
                                                    key={m.id}
                                                    className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white transition flex items-center justify-between gap-3"
                                                >
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${urgensiInfo.color}`}
                                                            >
                                                                {urgensiInfo.label}
                                                            </span>
                                                        </div>
                                                        <h4 className="font-bold text-slate-900 truncate mt-0.5">
                                                            {m.nama_sarpras}
                                                        </h4>
                                                        <span className="text-[10px] text-slate-400 block mt-0.5">
                                                            Dilaporkan: {m.tanggal_lapor}
                                                        </span>
                                                    </div>

                                                    <span
                                                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border shrink-0 ${statusInfo.color}`}
                                                    >
                                                        {statusInfo.label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                        <div className="pt-2">
                                            <Link
                                                href="/staf-ruangan/maintenance"
                                                className="inline-block px-4 py-2 bg-[#006039] hover:bg-[#004d2e] text-white rounded-xl text-xs font-bold shadow-xs transition"
                                            >
                                                Ajukan Perbaikan Barang
                                            </Link>
                                        </div>
                                    </div>
                                )
                            )}

                            {/* Tab 2: Pengadaan */}
                            {rightTab === 'pengadaan' && (
                                pengadaanTerkini.length === 0 ? (
                                    <div className="p-5 sm:p-6 bg-emerald-50/40 rounded-2xl border border-emerald-100/90 text-left h-full flex flex-col justify-center">
                                        <h4 className="font-extrabold text-sm text-slate-900">
                                            Belum Ada Usulan Pengadaan
                                        </h4>
                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                            Ajukan kebutuhan alat atau fasilitas baru untuk {ruanganNama}.
                                        </p>
                                        <div className="mt-4">
                                            <Link
                                                href="/staf-ruangan/pengadaan"
                                                className="inline-block px-4 py-2 bg-[#006039] hover:bg-[#004d2e] text-white rounded-xl text-xs font-bold shadow-xs transition"
                                            >
                                                Ajukan Pengadaan Barang
                                            </Link>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2.5 pr-1">
                                        {pengadaanTerkini.map((p) => {
                                            const statusInfo = formatStatusPengadaan(p.status);
                                            return (
                                                <div
                                                    key={p.id}
                                                    className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white transition flex items-center justify-between gap-3"
                                                >
                                                    <div className="min-w-0">
                                                        <h4 className="font-bold text-slate-900 truncate">
                                                            {p.nama_barang}
                                                        </h4>
                                                        <p className="text-[10px] text-slate-500 mt-0.5">
                                                            Jumlah: <strong>{p.jumlah}</strong> • {p.tanggal}
                                                        </p>
                                                    </div>

                                                    <span
                                                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border shrink-0 ${statusInfo.color}`}
                                                    >
                                                        {statusInfo.label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                        <div className="pt-2">
                                            <Link
                                                href="/staf-ruangan/pengadaan"
                                                className="inline-block px-4 py-2 bg-[#006039] hover:bg-[#004d2e] text-white rounded-xl text-xs font-bold shadow-xs transition"
                                            >
                                                Ajukan Pengadaan Barang
                                            </Link>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>

                {/* 4. Informasi & Berita Kampus */}
                {berita && berita.length > 0 && (() => {
                    const featuredNews = berita[0];
                    const sideNews = berita.slice(1, 5);

                    return (
                        <div className="bg-white rounded-2xl border border-slate-200/85 shadow-2xs p-4 sm:p-5 lg:p-6 space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div>
                                    <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                                        Informasi &amp; Berita Terkini
                                    </h2>
                                    <p className="text-[11px] text-slate-500">
                                        Kabar warta, pengumuman, dan publikasi resmi seputar fasilitas kampus
                                    </p>
                                </div>

                                <Link
                                    href="/layanan/berita"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-2xs"
                                >
                                    <span>Semua Berita</span>
                                    <span>→</span>
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
                                {/* KIRI: Berita Utama */}
                                <div className={sideNews.length > 0 ? "lg:col-span-7 flex flex-col" : "lg:col-span-12"}>
                                    <Link
                                        href={`/berita/${featuredNews.slug}`}
                                        className="group bg-slate-50/60 hover:bg-white rounded-2xl border border-slate-200/90 hover:border-[#006039]/50 hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full cursor-pointer"
                                    >
                                        <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-slate-950/10 flex items-center justify-center">
                                            <img
                                                src={featuredNews.image || '/images/Hero.png'}
                                                alt={featuredNews.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = '/images/Hero.png';
                                                }}
                                            />
                                            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[10px] font-bold text-[#006039] shadow-xs flex items-center gap-1.5 border border-emerald-100">
                                                <Calendar className="w-3 h-3 text-[#006039]" />
                                                <span>{featuredNews.date}</span>
                                            </div>
                                        </div>

                                        <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between space-y-3">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                                                    <User className="w-3 h-3 text-slate-400" />
                                                    <span>{featuredNews.author || 'Humas Sarpras'}</span>
                                                </div>
                                                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-[#006039] transition-colors line-clamp-2 leading-snug">
                                                    {featuredNews.title}
                                                </h3>
                                                {featuredNews.excerpt && (
                                                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                                        {featuredNews.excerpt}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#006039] group-hover:underline pt-2">
                                                <span>Baca Selengkapnya</span>
                                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    </Link>
                                </div>

                                {/* KANAN: Berita Lainnya */}
                                {sideNews.length > 0 && (
                                    <div className="lg:col-span-5 flex flex-col">
                                        <div className="bg-slate-50/50 rounded-2xl border border-slate-200/90 p-4 h-full flex flex-col justify-between space-y-3">
                                            <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                                                <span className="font-bold text-xs text-slate-800">
                                                    Berita Lainnya
                                                </span>
                                                <span className="text-[10px] font-semibold text-slate-400">
                                                    {sideNews.length} Publikasi
                                                </span>
                                            </div>

                                            <div className="space-y-2.5 flex-1">
                                                {sideNews.map((item) => (
                                                    <Link
                                                        key={item.id}
                                                        href={`/berita/${item.slug}`}
                                                        className="group bg-white hover:bg-slate-50/80 rounded-xl border border-slate-200/80 hover:border-[#006039]/40 p-2.5 transition flex items-center gap-3 shadow-2xs hover:shadow-xs cursor-pointer"
                                                    >
                                                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden shrink-0 bg-slate-100 border border-slate-200/70">
                                                            <img
                                                                src={item.image || '/images/Hero.png'}
                                                                alt={item.title}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = '/images/Hero.png';
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="min-w-0 flex-1 space-y-1">
                                                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
                                                                <Calendar className="w-2.5 h-2.5 text-[#006039]" />
                                                                <span>{item.date}</span>
                                                            </div>
                                                            <h4 className="font-bold text-xs text-slate-900 group-hover:text-[#006039] transition-colors line-clamp-2 leading-snug">
                                                                {item.title}
                                                            </h4>
                                                        </div>
                                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#006039] shrink-0 transition-transform group-hover:translate-x-0.5" />
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}
            </div>
        </AdminLayout>
    );
}
