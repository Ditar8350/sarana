import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    Building2,
    ClipboardCheck,
    Plus,
    Clock,
    CheckCircle2,
    AlertCircle,
    Calendar,
    Camera,
    X,
    Eye,
    MessageSquare,
    Search,
    ShieldAlert,
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

interface TemplateItem {
    sarpras_id: number;
    nama: string;
    kondisi: string;
    catatan: string;
}

interface Props {
    ruanganNama: string;
    laporanList: LaporanItem[];
    inventarisTemplate: TemplateItem[];
}

export default function PengecekanRuanganIndex({
    ruanganNama,
    laporanList = [],
    inventarisTemplate = [],
}: Props) {
    const { flash } = usePage().props as any;

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState<LaporanItem | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Form State
    const [tanggalPengecekan, setTanggalPengecekan] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });
    const [kondisiKebersihan, setKondisiKebersihan] = useState('bersih');
    const [kondisiSarpras, setKondisiSarpras] = useState('semua_baik');
    const [catatanPemeriksaan, setCatatanPemeriksaan] = useState('');
    const [fotoFile, setFotoFile] = useState<File | null>(null);
    const [fotoPreview, setFotoPreview] = useState<string | null>(null);
    const [itemsChecklist, setItemsChecklist] = useState<CheckedItem[]>(() => {
        return inventarisTemplate.slice(0, 10).map((item) => ({
            sarpras_id: item.sarpras_id,
            nama: item.nama,
            kondisi: item.kondisi || 'Baik',
            catatan: 'Kondisi fisik sesuai standar',
        }));
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFotoFile(file);
            setFotoPreview(URL.createObjectURL(file));
        }
    };

    const handleItemKondisiChange = (index: number, newKondisi: string) => {
        const updated = [...itemsChecklist];
        updated[index].kondisi = newKondisi;
        setItemsChecklist(updated);
    };

    const handleItemCatatanChange = (index: number, newCatatan: string) => {
        const updated = [...itemsChecklist];
        updated[index].catatan = newCatatan;
        setItemsChecklist(updated);
    };

    const handleAddItemManual = () => {
        setItemsChecklist([
            ...itemsChecklist,
            {
                nama: '',
                kondisi: 'Baik',
                catatan: '',
            },
        ]);
    };

    const handleRemoveItem = (index: number) => {
        setItemsChecklist(itemsChecklist.filter((_, i) => i !== index));
    };

    const handleSubmitPengecekan = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('tanggal_pengecekan', tanggalPengecekan);
        formData.append('kondisi_kebersihan', kondisiKebersihan);
        formData.append('kondisi_sarpras', kondisiSarpras);
        formData.append('catatan_pemeriksaan', catatanPemeriksaan);
        if (fotoFile) {
            formData.append('foto_ruangan', fotoFile);
        }

        itemsChecklist.forEach((item, index) => {
            if (item.nama.trim() !== '') {
                if (item.sarpras_id) {
                    formData.append(`items_checked[${index}][sarpras_id]`, String(item.sarpras_id));
                }
                formData.append(`items_checked[${index}][nama]`, item.nama);
                formData.append(`items_checked[${index}][kondisi]`, item.kondisi);
                formData.append(`items_checked[${index}][catatan]`, item.catatan || '');
            }
        });

        router.post('/staf-ruangan/pengecekan', formData, {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateModalOpen(false);
                setIsSubmitting(false);
                setCatatanPemeriksaan('');
                setFotoFile(null);
                setFotoPreview(null);
            },
            onError: () => {
                setIsSubmitting(false);
            },
        });
    };

    const filteredLaporan = laporanList.filter((item) => {
        return (
            item.kode_pengecekan.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.catatan_pemeriksaan.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.tanggal_pengecekan.toLowerCase().includes(searchQuery.toLowerCase())
        );
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
                    label: 'Menunggu Review Kepala Biro / Admin',
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
                    label: 'Ditindaklanjuti (Jadwal Maintenance)',
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
            <Head title={`Laporan Pengecekan Ruangan - ${ruanganNama}`} />

            <div className="max-w-7xl mx-auto space-y-6 pb-16 px-2 sm:px-4 font-sans text-slate-800 text-xs">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-[#006039] to-[#0b4d35] text-white p-6 sm:p-8 rounded-3xl shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                        <div className="space-y-2">
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-white/15 px-3 py-1 rounded-full border border-white/20 text-emerald-100">
                                <Building2 className="w-3.5 h-3.5 text-emerald-200" />
                                <span>Laporan Langsung Kepala Biro & Admin</span>
                            </span>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                                Laporan Hasil Pengecekan Ruangan
                            </h1>
                            <p className="text-emerald-100/90 text-xs sm:text-sm max-w-2xl leading-relaxed">
                                Ruang Pengawasan: <strong>{ruanganNama}</strong>. Setiap hasil inspeksi inventaris dan kebersihan yang Anda laporkan akan langsung tersampaikan kepada pimpinan Biro Sarpras untuk ditinjau.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                            <div className="relative w-full sm:w-64">
                                <Search className="w-4 h-4 text-emerald-900/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Cari laporan..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-white text-slate-800 rounded-xl text-xs font-medium placeholder-slate-400 shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-300 transition"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(true)}
                                className="px-4 py-2.5 bg-white text-[#006039] hover:bg-emerald-50 rounded-xl text-xs font-extrabold shadow-sm flex items-center justify-center gap-2 transition cursor-pointer shrink-0"
                            >
                                <Plus className="w-4 h-4 text-[#006039]" />
                                <span>Buat Laporan Baru</span>
                            </button>
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

                {/* List Laporan */}
                {filteredLaporan.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                            <ClipboardCheck className="w-8 h-8" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-800">Belum Ada Laporan Hasil Pengecekan</h4>
                        <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto mb-4">
                            Mulai inspeksi fisik inventaris ruangan Anda sekarang untuk memastikan fasilitas kampus dalam kondisi prima.
                        </p>
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-4 py-2 bg-[#006039] text-white rounded-xl text-xs font-extrabold hover:bg-[#004d2e] transition inline-flex items-center gap-2 cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Input Laporan Pengecekan</span>
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredLaporan.map((item) => {
                            const statusInfo = formatStatusTinjauan(item.status_tinjauan);
                            const kebersihanInfo = formatKebersihan(item.kondisi_kebersihan);
                            const sarprasInfo = formatSarprasKondisi(item.kondisi_sarpras);
                            const StatusIcon = statusInfo.icon;

                            return (
                                <div
                                    key={item.id}
                                    className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:border-emerald-200 transition"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                    <span>{item.tanggal_pengecekan}</span>
                                                </span>
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${statusInfo.color}`}
                                                >
                                                    <StatusIcon className="w-3 h-3" />
                                                    <span>{statusInfo.label}</span>
                                                </span>
                                            </div>

                                            <p className="text-slate-800 text-xs font-semibold leading-relaxed">
                                                {item.catatan_pemeriksaan}
                                            </p>

                                            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                                                <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${kebersihanInfo.color}`}>
                                                    Kebersihan: {kebersihanInfo.label}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${sarprasInfo.color}`}>
                                                    Sarpras: {sarprasInfo.label}
                                                </span>
                                                <span className="text-slate-500 text-[10px]">
                                                    {item.items_checked?.length || 0} Aset Dicek
                                                </span>
                                            </div>

                                            {/* Feedback dari Admin */}
                                            {item.catatan_admin && (
                                                <div className="mt-2 p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-[11px] text-emerald-900 flex items-start gap-2">
                                                    <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                                    <div>
                                                        <span className="font-bold">Catatan Pimpinan (Kepala Biro): </span>
                                                        <span>{item.catatan_admin}</span>
                                                        {item.ditinjau_pada && (
                                                            <span className="block text-[10px] text-emerald-700 mt-0.5">
                                                                Ditinjau pada: {item.ditinjau_pada}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                                            {item.foto_ruangan && (
                                                <a
                                                    href={item.foto_ruangan}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 hover:opacity-80 transition"
                                                    title="Lihat Foto Bukti"
                                                >
                                                    <img
                                                        src={item.foto_ruangan}
                                                        alt="Foto Ruangan"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </a>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setSelectedDetail(item)}
                                                className="p-2 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-[#006039] border border-slate-200 rounded-xl transition inline-flex items-center justify-center shadow-2xs cursor-pointer"
                                                title="Lihat Detail Hasil Cek"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Modal Detail Hasil Pengecekan */}
                {selectedDetail && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                        <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto text-xs">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        Detail Laporan Inspeksi
                                    </span>
                                    <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                                        {selectedDetail.nama_ruangan}
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

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 text-[11px]">
                                    <div>
                                        <p className="text-slate-500">Tanggal Pemeriksaan:</p>
                                        <p className="font-extrabold text-slate-900 mt-0.5">
                                            {selectedDetail.tanggal_pengecekan}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">Status Tinjauan:</p>
                                        <p className="font-extrabold text-emerald-700 mt-0.5">
                                            {formatStatusTinjauan(selectedDetail.status_tinjauan).label}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">Kondisi Kebersihan:</p>
                                        <p className="font-extrabold text-slate-900 mt-0.5">
                                            {formatKebersihan(selectedDetail.kondisi_kebersihan).label}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">Kondisi Fisik Sarpras:</p>
                                        <p className="font-extrabold text-slate-900 mt-0.5">
                                            {formatSarprasKondisi(selectedDetail.kondisi_sarpras).label}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-extrabold text-slate-800 text-xs mb-1">
                                        Catatan Pemeriksaan Staf Ruangan:
                                    </h4>
                                    <p className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-slate-700 leading-relaxed text-xs">
                                        {selectedDetail.catatan_pemeriksaan}
                                    </p>
                                </div>

                                {/* Items Checked */}
                                <div>
                                    <h4 className="font-extrabold text-slate-800 text-xs mb-2">
                                        Checklist Barang / Fasilitas yang Diperiksa:
                                    </h4>
                                    {selectedDetail.items_checked && selectedDetail.items_checked.length > 0 ? (
                                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                                            <table className="w-full text-left text-[11px]">
                                                <thead className="bg-slate-100 text-slate-600 font-bold">
                                                    <tr>
                                                        <th className="p-2.5">Nama Fasilitas</th>
                                                        <th className="p-2.5">Kondisi Fisik</th>
                                                        <th className="p-2.5">Keterangan</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {selectedDetail.items_checked.map((item, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50/50">
                                                            <td className="p-2.5 font-bold text-slate-800">
                                                                {item.nama}
                                                            </td>
                                                            <td className="p-2.5">
                                                                <span
                                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                                                        item.kondisi === 'Baik'
                                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                            : 'bg-amber-50 text-amber-700 border-amber-200'
                                                                    }`}
                                                                >
                                                                    {item.kondisi}
                                                                </span>
                                                            </td>
                                                            <td className="p-2.5 text-slate-500">
                                                                {item.catatan || '-'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-slate-400 italic text-xs">Tidak ada checklist barang terperinci.</p>
                                    )}
                                </div>

                                {selectedDetail.foto_ruangan && (
                                    <div>
                                        <h4 className="font-extrabold text-slate-800 text-xs mb-1.5">
                                            Foto Bukti Kondisi Ruangan:
                                        </h4>
                                        <div className="rounded-2xl border border-slate-200 overflow-hidden max-h-60">
                                            <img
                                                src={selectedDetail.foto_ruangan}
                                                alt="Foto Ruangan"
                                                className="w-full h-full object-contain bg-slate-900"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setSelectedDetail(null)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                                >
                                    Tutup Detail
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Tambah Laporan Pengecekan Baru */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                        <div className="bg-white rounded-3xl max-w-3xl w-full p-6 space-y-5 border border-slate-200 shadow-xl max-h-[92vh] overflow-y-auto text-xs">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div>
                                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                                        Formulir Inspeksi Inventaris
                                    </span>
                                    <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                                        Buat Laporan Pengecekan - {ruanganNama}
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

                            <form onSubmit={handleSubmitPengecekan} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                            Tanggal Pengecekan *
                                        </label>
                                        <input
                                            type="date"
                                            value={tanggalPengecekan}
                                            onChange={(e) => setTanggalPengecekan(e.target.value)}
                                            required
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#006039] focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                            Kondisi Kebersihan *
                                        </label>
                                        <select
                                            value={kondisiKebersihan}
                                            onChange={(e) => setKondisiKebersihan(e.target.value)}
                                            required
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#006039] focus:outline-none"
                                        >
                                            <option value="sangat_bersih">Sangat Bersih & Rapi</option>
                                            <option value="bersih">Bersih & Terawat</option>
                                            <option value="cukup">Cukup Rapi</option>
                                            <option value="kotor">Perlu Pembersihan Total</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                            Status Fisik Sarpras *
                                        </label>
                                        <select
                                            value={kondisiSarpras}
                                            onChange={(e) => setKondisiSarpras(e.target.value)}
                                            required
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#006039] focus:outline-none"
                                        >
                                            <option value="semua_baik">Semua Berfungsi Baik</option>
                                            <option value="ada_kerusakan">Ada Kerusakan Ringan</option>
                                            <option value="butuh_penggantian">Butuh Perbaikan / Penggantian</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        Catatan Hasil Pemeriksaan Ruangan *
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={catatanPemeriksaan}
                                        onChange={(e) => setCatatanPemeriksaan(e.target.value)}
                                        placeholder="Tuliskan catatan kondisi ruangan, lampu, AC, kebersihan lantai, kerapian meja, kendala fasilitas..."
                                        required
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#006039] focus:outline-none"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        Catatan ini akan langsung dibaca oleh Kepala Biro Sarpras. Minimal 5 karakter.
                                    </p>
                                </div>

                                {/* Checklist Inventaris */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-[11px] font-bold text-slate-700">
                                            Checklist Barang & Sarana Ruangan
                                        </label>
                                        <button
                                            type="button"
                                            onClick={handleAddItemManual}
                                            className="text-[10px] font-bold text-[#006039] hover:underline flex items-center gap-1 cursor-pointer"
                                        >
                                            <Plus className="w-3 h-3" />
                                            <span>Tambah Fasilitas Lain</span>
                                        </button>
                                    </div>

                                    <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                                        <table className="w-full text-left text-[11px]">
                                            <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0">
                                                <tr>
                                                    <th className="p-2.5">Fasilitas / Aset</th>
                                                    <th className="p-2.5 w-36">Kondisi</th>
                                                    <th className="p-2.5">Catatan Fisik</th>
                                                    <th className="p-2.5 w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {itemsChecklist.map((item, index) => (
                                                    <tr key={index} className="hover:bg-slate-50">
                                                        <td className="p-2">
                                                            <input
                                                                type="text"
                                                                value={item.nama}
                                                                onChange={(e) => {
                                                                    const updated = [...itemsChecklist];
                                                                    updated[index].nama = e.target.value;
                                                                    setItemsChecklist(updated);
                                                                }}
                                                                placeholder="Nama Sarpras..."
                                                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                                                            />
                                                        </td>
                                                        <td className="p-2">
                                                            <select
                                                                value={item.kondisi}
                                                                onChange={(e) =>
                                                                    handleItemKondisiChange(index, e.target.value)
                                                                }
                                                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                                                            >
                                                                <option value="Baik">Baik</option>
                                                                <option value="Sedang">Sedang</option>
                                                                <option value="Rusak">Rusak</option>
                                                            </select>
                                                        </td>
                                                        <td className="p-2">
                                                            <input
                                                                type="text"
                                                                value={item.catatan || ''}
                                                                onChange={(e) =>
                                                                    handleItemCatatanChange(index, e.target.value)
                                                                }
                                                                placeholder="Keterangan..."
                                                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                                                            />
                                                        </td>
                                                        <td className="p-2 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveItem(index)}
                                                                className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Upload Foto */}
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        Unggah Foto Bukti Kondisi Ruangan (Opsional)
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <label className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer transition">
                                            <Camera className="w-4 h-4 text-slate-600" />
                                            <span>Pilih Foto Bukti</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handlePhotoChange}
                                                className="hidden"
                                            />
                                        </label>
                                        {fotoPreview && (
                                            <div className="w-12 h-12 rounded-xl border border-slate-200 overflow-hidden shrink-0">
                                                <img
                                                    src={fotoPreview}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                    </div>
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
                                        {isSubmitting ? 'Mengirim Laporan...' : 'Kirim Laporan ke Kepala Biro'}
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
