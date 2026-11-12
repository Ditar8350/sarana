import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    ClipboardCheck,
    Search,
    CheckCircle2,
    Clock,
    AlertTriangle,
    AlertCircle,
    Building2,
    Eye,
    X,
    Filter,
    MessageSquare,
    User,
    Calendar,
    Camera,
    Check,
} from 'lucide-react';

interface CheckedItem {
    sarpras_id?: number;
    nama: string;
    kondisi: string;
    catatan?: string;
}

interface LaporanItem {
    id: number;
    kode_pengecekan: string;
    nama_ruangan: string;
    staf_nama: string;
    staf_nip: string;
    tanggal_pengecekan: string;
    kondisi_kebersihan: string;
    kondisi_sarpras: string;
    catatan_pemeriksaan: string;
    foto_ruangan: string | null;
    items_checked: CheckedItem[];
    status_tinjauan: string;
    catatan_admin: string | null;
    admin_nama: string | null;
    ditinjau_pada: string | null;
    created_at: string;
}

interface Props {
    laporanList: LaporanItem[];
    stats: {
        total: number;
        menunggu: number;
        diverifikasi: number;
        ditindaklanjuti: number;
    };
    statusFilter: string;
}

export default function AdminPengecekanRuanganIndex({
    laporanList = [],
    stats = { total: 0, menunggu: 0, diverifikasi: 0, ditindaklanjuti: 0 },
    statusFilter = 'semua',
}: Props) {
    const { flash } = usePage().props as any;

    const [cari, setCari] = useState('');
    const [selectedItem, setSelectedItem] = useState<LaporanItem | null>(null);

    // Form Verifikasi
    const [statusTinjauanBaru, setStatusTinjauanBaru] = useState<'diverifikasi_admin' | 'ditindaklanjuti'>('diverifikasi_admin');
    const [catatanAdmin, setCatatanAdmin] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleOpenVerifikasi = (item: LaporanItem) => {
        setSelectedItem(item);
        setStatusTinjauanBaru(
            item.status_tinjauan === 'ditindaklanjuti' ? 'ditindaklanjuti' : 'diverifikasi_admin'
        );
        setCatatanAdmin(item.catatan_admin || '');
    };

    const handleSimpanVerifikasi = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem) return;
        setIsProcessing(true);

        router.post(
            `/admin/pengecekan-ruangan/${selectedItem.id}/verifikasi`,
            {
                status_tinjauan: statusTinjauanBaru,
                catatan_admin: catatanAdmin,
            },
            {
                preserveScroll: true,
                onFinish: () => {
                    setIsProcessing(false);
                    setSelectedItem(null);
                },
            }
        );
    };

    const handleTabFilter = (status: string) => {
        router.get(
            '/admin/pengecekan-ruangan',
            status === 'semua' ? {} : { status },
            { preserveState: true, preserveScroll: true }
        );
    };

    const filteredLaporan = laporanList.filter((item) => {
        const matchesSearch =
            item.kode_pengecekan.toLowerCase().includes(cari.toLowerCase()) ||
            item.nama_ruangan.toLowerCase().includes(cari.toLowerCase()) ||
            item.staf_nama.toLowerCase().includes(cari.toLowerCase()) ||
            item.catatan_pemeriksaan.toLowerCase().includes(cari.toLowerCase());
        return matchesSearch;
    });

    const formatKebersihan = (val: string) => {
        switch (val) {
            case 'sangat_bersih':
                return { label: 'Sangat Bersih & Rapi', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
            case 'bersih':
                return { label: 'Bersih & Terawat', color: 'bg-teal-50 text-teal-700 border-teal-200' };
            case 'cukup':
                return { label: 'Cukup Rapi', color: 'bg-amber-50 text-amber-700 border-amber-200' };
            case 'kotor':
                return { label: 'Perlu Pembersihan Total', color: 'bg-rose-50 text-rose-700 border-rose-200' };
            default:
                return { label: val, color: 'bg-slate-100 text-slate-700 border-slate-200' };
        }
    };

    const formatSarprasKondisi = (val: string) => {
        switch (val) {
            case 'semua_baik':
                return { label: 'Semua Sarana Berfungsi Baik', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
            case 'ada_kerusakan':
                return { label: 'Ada Kerusakan Ringan', color: 'bg-amber-50 text-amber-700 border-amber-200' };
            case 'butuh_penggantian':
                return { label: 'Perlu Penggantian / Servis', color: 'bg-rose-50 text-rose-700 border-rose-200' };
            default:
                return { label: val, color: 'bg-slate-100 text-slate-700 border-slate-200' };
        }
    };

    const formatStatusTinjauan = (val: string) => {
        switch (val) {
            case 'menunggu_tinjauan':
                return {
                    label: 'Menunggu Tinjauan',
                    color: 'bg-amber-50 text-amber-700 border-amber-200',
                    icon: Clock,
                };
            case 'diverifikasi_admin':
                return {
                    label: 'Verified',
                    color: 'bg-emerald-50 text-[#006039] border-emerald-200',
                    icon: CheckCircle2,
                };
            case 'ditindaklanjuti':
                return {
                    label: 'Ditindaklanjuti (Maintenance)',
                    color: 'bg-blue-50 text-blue-700 border-blue-200',
                    icon: CheckCircle2,
                };
            default:
                return {
                    label: val,
                    color: 'bg-slate-100 text-slate-700 border-slate-200',
                    icon: AlertCircle,
                };
        }
    };

    return (
        <AdminLayout>
            <Head title="Monitoring & Verifikasi Pengecekan Ruangan - Biro Sarpras UNUHA" />

            <div className="max-w-7xl mx-auto space-y-6 pb-16 px-2 sm:px-4 font-sans text-slate-800 text-xs">
                {/* Header Bersih & Modern */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#006039] to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <ClipboardCheck className="w-5 h-5" strokeWidth={2} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#006039] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                                    Pusat Kendali Pengawasan
                                </span>
                            </div>
                            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
                                Monitoring &amp; Verifikasi Pengecekan Ruangan
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Tinjau laporan berkala fisik sarpras dari PIC Ruangan dan berikan verifikasi atau tindak lanjut.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 shrink-0 w-full sm:w-auto">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute inset-y-0 left-3.5 my-auto w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Cari ruangan, staf, kode..."
                                value={cari}
                                onChange={(e) => setCari(e.target.value)}
                                className="w-full pl-9 pr-8 py-2 border border-slate-200/90 rounded-xl text-xs focus:border-[#006039] outline-hidden bg-slate-50/70 focus:bg-white shadow-2xs transition font-medium"
                            />
                            {cari && (
                                <button
                                    type="button"
                                    onClick={() => setCari('')}
                                    className="absolute inset-y-0 right-2.5 my-auto text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200/80 text-[#006039] font-bold text-xs flex items-center gap-2 shrink-0 self-start sm:self-auto">
                            <ClipboardCheck className="w-4 h-4 text-[#006039]" />
                            <span>{filteredLaporan.length} Laporan Masuk</span>
                        </div>
                    </div>
                </div>

                {/* Flash Success Message */}
                {flash?.success && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span className="font-semibold text-xs">{flash.success}</span>
                    </div>
                )}

                {/* Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <button
                        type="button"
                        onClick={() => handleTabFilter('semua')}
                        className={`p-4 rounded-2xl border text-left transition ${
                            statusFilter === 'semua'
                                ? 'bg-white border-[#006039] ring-2 ring-[#006039]/20 shadow-sm'
                                : 'bg-white border-slate-200/80 hover:border-slate-300'
                        }`}
                    >
                        <p className="text-[11px] font-medium text-slate-500">Semua Laporan</p>
                        <h3 className="text-xl font-extrabold text-slate-900 mt-1">{stats.total}</h3>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleTabFilter('menunggu_tinjauan')}
                        className={`p-4 rounded-2xl border text-left transition ${
                            statusFilter === 'menunggu_tinjauan'
                                ? 'bg-amber-50/50 border-amber-400 ring-2 ring-amber-400/20 shadow-sm'
                                : 'bg-white border-slate-200/80 hover:border-amber-300'
                        }`}
                    >
                        <p className="text-[11px] font-medium text-amber-700">Butuh Tinjauan</p>
                        <h3 className="text-xl font-extrabold text-amber-700 mt-1">{stats.menunggu}</h3>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleTabFilter('diverifikasi_admin')}
                        className={`p-4 rounded-2xl border text-left transition ${
                            statusFilter === 'diverifikasi_admin'
                                ? 'bg-emerald-50/50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                                : 'bg-white border-slate-200/80 hover:border-emerald-300'
                        }`}
                    >
                        <p className="text-[11px] font-medium text-emerald-700">Verified</p>
                        <h3 className="text-xl font-extrabold text-emerald-700 mt-1">{stats.diverifikasi}</h3>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleTabFilter('ditindaklanjuti')}
                        className={`p-4 rounded-2xl border text-left transition ${
                            statusFilter === 'ditindaklanjuti'
                                ? 'bg-blue-50/50 border-blue-400 ring-2 ring-blue-400/20 shadow-sm'
                                : 'bg-white border-slate-200/80 hover:border-blue-300'
                        }`}
                    >
                        <p className="text-[11px] font-medium text-blue-700">Ditindaklanjuti</p>
                        <h3 className="text-xl font-extrabold text-blue-700 mt-1">{stats.ditindaklanjuti}</h3>
                    </button>
                </div>

                {/* Table / List Laporan Masuk */}
                {filteredLaporan.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                            <ClipboardCheck className="w-8 h-8" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-800">Tidak ada laporan pengecekan yang sesuai</h4>
                        <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
                            Laporan dari PIC Ruangan akan langsung muncul di sini setelah mereka melakukan inspeksi berkala.
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                                    <tr>
                                        <th className="p-4">Ruangan &amp; Pelapor</th>
                                        <th className="p-4">Tanggal Pengecekan</th>
                                        <th className="p-4">Catatan PIC Ruangan</th>
                                        <th className="p-4">Status &amp; Verifikasi</th>
                                        <th className="p-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredLaporan.map((item) => {
                                        const statusInfo = formatStatusTinjauan(item.status_tinjauan);
                                        const StatusIcon = statusInfo.icon;

                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/50 transition">
                                                <td className="p-4">
                                                    <div>
                                                        <h4 className="font-extrabold text-slate-900 text-xs">
                                                            {item.nama_ruangan}
                                                        </h4>
                                                        <p className="text-slate-500 text-[11px] mt-0.5">
                                                            {item.staf_nama}
                                                        </p>
                                                    </div>
                                                </td>

                                                <td className="p-4 whitespace-nowrap">
                                                    <p className="font-semibold text-slate-700 text-xs">
                                                        {item.tanggal_pengecekan}
                                                    </p>
                                                </td>

                                                <td className="p-4 max-w-sm">
                                                    <p className="text-slate-700 text-xs line-clamp-2 leading-relaxed">
                                                        {item.catatan_pemeriksaan}
                                                    </p>
                                                    {item.items_checked && item.items_checked.length > 0 && (
                                                        <p className="text-emerald-700 font-semibold text-[10px] mt-1">
                                                            {item.items_checked.length} item fisik diperiksa
                                                        </p>
                                                    )}
                                                </td>

                                                <td className="p-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${statusInfo.color}`}
                                                    >
                                                        {statusInfo.label}
                                                    </span>
                                                    {item.admin_nama && (
                                                        <p className="text-slate-400 text-[10px] mt-1">
                                                            Oleh: {item.admin_nama}
                                                        </p>
                                                    )}
                                                </td>

                                                <td className="p-4 text-right whitespace-nowrap">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenVerifikasi(item)}
                                                        className="p-2 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-[#006039] border border-slate-200 rounded-xl transition cursor-pointer shadow-2xs inline-flex items-center justify-center"
                                                        title="Verifikasi & Detail Laporan"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Modal Detail & Verifikasi Laporan */}
                {selectedItem && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                        <div className="bg-white rounded-3xl max-w-3xl w-full p-6 space-y-5 border border-slate-200 shadow-xl max-h-[92vh] overflow-y-auto text-xs">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div>
                                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                                        Tinjauan & Disposisi Kepala Biro
                                    </span>
                                    <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                                        {selectedItem.nama_ruangan}
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedItem(null)}
                                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Informasi Hasil Pemeriksaan PIC Ruangan */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 text-[11px]">
                                    <div>
                                        <p className="text-slate-500">PIC Ruangan Pemeriksa:</p>
                                        <p className="font-extrabold text-slate-900 mt-0.5">{selectedItem.staf_nama}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">Tanggal Cek:</p>
                                        <p className="font-extrabold text-slate-900 mt-0.5">
                                            {selectedItem.tanggal_pengecekan}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">Jumlah Sarana Diperiksa:</p>
                                        <p className="font-extrabold text-emerald-800 mt-0.5">
                                            {selectedItem.items_checked?.length || 0} Sarana / Alat
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-extrabold text-slate-800 text-xs mb-1">
                                        Catatan Pemeriksaan dari PIC Ruangan:
                                    </h4>
                                    <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed text-xs">
                                        {selectedItem.catatan_pemeriksaan}
                                    </p>
                                </div>

                                {/* Items Checked */}
                                {selectedItem.items_checked && selectedItem.items_checked.length > 0 && (
                                    <div>
                                        <h4 className="font-extrabold text-slate-800 text-xs mb-1.5">
                                            Fasilitas / Sarana yang Diperiksa ({selectedItem.items_checked.length} Item):
                                        </h4>
                                        <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                                            <table className="w-full text-left text-[11px]">
                                                <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0">
                                                    <tr>
                                                        <th className="p-2.5">Nama Fasilitas</th>
                                                        <th className="p-2.5">Kondisi</th>
                                                        <th className="p-2.5">Keterangan</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {selectedItem.items_checked.map((it, idx) => {
                                                        const isGood = it.kondisi === 'Baik';
                                                        const isMedium = it.kondisi === 'Sedang';
                                                        return (
                                                            <tr key={idx} className="hover:bg-slate-50">
                                                                <td className="p-2.5 font-bold text-slate-800">{it.nama}</td>
                                                                <td className="p-2.5">
                                                                    <span
                                                                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                                                            isGood
                                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                                : isMedium
                                                                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                                                : 'bg-rose-50 text-rose-700 border-rose-200'
                                                                        }`}
                                                                    >
                                                                        {it.kondisi}
                                                                    </span>
                                                                </td>
                                                                <td className="p-2.5 text-slate-500">{it.catatan || '-'}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {selectedItem.foto_ruangan && (
                                    <div>
                                        <h4 className="font-extrabold text-slate-800 text-xs mb-1.5">
                                            Foto Bukti Kondisi Ruangan:
                                        </h4>
                                        <div className="rounded-2xl border border-slate-200 overflow-hidden max-h-52">
                                            <img
                                                src={selectedItem.foto_ruangan}
                                                alt="Foto Ruangan"
                                                className="w-full h-full object-contain bg-slate-900"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Form Verifikasi oleh Admin / Kepala Biro */}
                            <form onSubmit={handleSimpanVerifikasi} className="pt-4 border-t border-slate-200 space-y-4">
                                <h4 className="font-extrabold text-slate-900 text-xs">
                                    Keputusan Verifikasi Kepala Biro / Admin:
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <label
                                        className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition ${
                                            statusTinjauanBaru === 'diverifikasi_admin'
                                                ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                                                : 'bg-white border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="status_tinjauan"
                                            value="diverifikasi_admin"
                                            checked={statusTinjauanBaru === 'diverifikasi_admin'}
                                            onChange={() => setStatusTinjauanBaru('diverifikasi_admin')}
                                            className="mt-0.5 text-[#006039]"
                                        />
                                        <div>
                                            <p className="font-bold text-slate-900 text-xs">Diverifikasi & Disetujui</p>
                                            <p className="text-[11px] text-slate-500 mt-0.5">
                                                Kondisi ruangan sesuai standar, laporan diarsipkan.
                                            </p>
                                        </div>
                                    </label>

                                    <label
                                        className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition ${
                                            statusTinjauanBaru === 'ditindaklanjuti'
                                                ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20'
                                                : 'bg-white border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="status_tinjauan"
                                            value="ditindaklanjuti"
                                            checked={statusTinjauanBaru === 'ditindaklanjuti'}
                                            onChange={() => setStatusTinjauanBaru('ditindaklanjuti')}
                                            className="mt-0.5 text-blue-600"
                                        />
                                        <div>
                                            <p className="font-bold text-slate-900 text-xs">Perlu Tindak Lanjut</p>
                                            <p className="text-[11px] text-slate-500 mt-0.5">
                                                Ada kerusakan/kebersihan yang perlu dijadwalkan teknisi.
                                            </p>
                                        </div>
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        Catatan / Instruksi Pimpinan ke PIC Ruangan
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={catatanAdmin}
                                        onChange={(e) => setCatatanAdmin(e.target.value)}
                                        placeholder="Berikan arahan untuk PIC Ruangan atau konfirmasi jadwal perbaikan..."
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#006039] focus:outline-none"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-2.5 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedItem(null)}
                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isProcessing}
                                        className="px-5 py-2 bg-[#006039] hover:bg-[#004d2e] text-white rounded-xl text-xs font-extrabold shadow-sm transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                                    >
                                        {isProcessing ? 'Menyimpan...' : 'Simpan Verifikasi'}
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
