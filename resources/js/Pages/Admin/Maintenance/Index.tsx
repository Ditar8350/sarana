import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    Wrench,
    Search,
    CheckCircle2,
    Clock,
    AlertTriangle,
    AlertCircle,
    ExternalLink,
    X,
    Filter,
    UserCheck,
    ShieldCheck,
    Phone,
    Play,
    Check,
    Camera,
    Coins,
    FileText,
    Eye,
    MapPin,
    Building2,
    Layers,
    ChevronDown,
    Folder,
    SlidersHorizontal,
} from 'lucide-react';

interface StafUser {
    id: number;
    name: string;
    no_hp: string | null;
    role_label: string;
}

interface MaintenanceItem {
    id: number;
    kode_tiket: string;
    pelapor_nama: string;
    pelapor_role: string;
    pelapor_ruangan?: string;
    sarpras_nama: string;
    lokasi_ruang: string;
    tingkat_urgensi: 'rendah' | 'sedang' | 'tinggi' | 'darurat';
    deskripsi_kerusakan: string;
    foto_kerusakan: string | null;
    status: 'menunggu_tinjauan' | 'disetujui' | 'dalam_pengerjaan' | 'selesai' | 'ditolak';
    staf_id?: number | null;
    staf_nama?: string | null;
    nama_teknisi: string | null;
    estimasi_biaya: number;
    denda_kerusakan?: number;
    is_from_pengembalian?: boolean;
    biaya_aktual?: number;
    catatan_admin: string | null;
    catatan_staf?: string | null;
    foto_perbaikan_selesai?: string | null;
    tanggal_lapor: string;
    tanggal_mulai: string | null;
    tanggal_selesai: string | null;
    is_assigned_to_me?: boolean;
}

interface Props {
    laporanList: MaintenanceItem[];
    sarprasKatalog: Array<{ id: number; nama: string; lokasi: string }>;
    stafUsers?: StafUser[];
    currentUserId?: number;
    currentUserRole?: string;
}

const formatRupiahInput = (val: number | string) => {
    if (val === '' || val === null || val === undefined || val === 0 || val === '0') return '';
    const num = typeof val === 'string' ? parseInt(val.replace(/\D/g, ''), 10) : val;
    if (isNaN(num) || num === 0) return '';
    return num.toLocaleString('id-ID');
};

const parseRupiahInput = (str: string): number => {
    const raw = str.replace(/\D/g, '');
    return raw ? parseInt(raw, 10) : 0;
};

export default function MaintenanceAdminIndex({
    laporanList = [],
    sarprasKatalog = [],
    stafUsers = [],
    currentUserId,
    currentUserRole = 'admin',
}: Props) {
    const { flash } = usePage().props as any;
    const isStaf = currentUserRole === 'staf';
    const [cari, setCari] = useState('');
    const [tabFilter, setTabFilter] = useState<string>(isStaf ? 'tugas_saya' : 'semua');
    const [statusFilter, setStatusFilter] = useState<string>('semua');
    const [urgensiFilter, setUrgensiFilter] = useState<string>('semua');
    const [isUrgensiOpen, setIsUrgensiOpen] = useState(false);
    const [stafCardFilter, setStafCardFilter] = useState<'semua' | 'disetujui' | 'dalam_pengerjaan' | 'selesai'>('semua');

    // Detail Modal
    const [viewDetailItem, setViewDetailItem] = useState<MaintenanceItem | null>(null);

    // Modal Admin Validasi & Penugasan
    const [selectedItem, setSelectedItem] = useState<MaintenanceItem | null>(null);
    const [statusBaru, setStatusBaru] = useState<string>('disetujui');
    const [selectedStaf, setSelectedStaf] = useState<string>('');
    const [customTeknisi, setCustomTeknisi] = useState<string>('');
    const [estimasiBiaya, setEstimasiBiaya] = useState<number>(0);
    const [catatanAdmin, setCatatanAdmin] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Modal Staf Selesaikan Perbaikan
    const [stafItemToFinish, setStafItemToFinish] = useState<MaintenanceItem | null>(null);
    const [stafCatatan, setStafCatatan] = useState('');
    const [stafBiayaAktual, setStafBiayaAktual] = useState<number>(0);
    const [stafFotoSelesai, setStafFotoSelesai] = useState<File | null>(null);
    const [stafFotoPreview, setStafFotoPreview] = useState<string | null>(null);
    const [isSubmittingStaf, setIsSubmittingStaf] = useState(false);

    const handleOpenAdminModal = (item: MaintenanceItem) => {
        setSelectedItem(item);
        setStatusBaru(item.status === 'menunggu_tinjauan' ? 'disetujui' : item.status);
        setEstimasiBiaya(item.estimasi_biaya || 0);
        setCatatanAdmin(
            item.catatan_admin ||
                (item.status === 'menunggu_tinjauan'
                    ? 'Permintaan perbaikan disetujui. Harap staf sarpras yang ditugaskan segera mengecek dan menindaklanjuti.'
                    : '')
        );

        if (item.staf_id) {
            setSelectedStaf(String(item.staf_id));
            setCustomTeknisi('');
        } else {
            const matched = stafUsers.find((s) => item.nama_teknisi && item.nama_teknisi.includes(s.name));
            if (matched) {
                setSelectedStaf(String(matched.id));
                setCustomTeknisi('');
            } else if (item.nama_teknisi) {
                setSelectedStaf('__custom__');
                setCustomTeknisi(item.nama_teknisi);
            } else if (stafUsers.length > 0) {
                setSelectedStaf(String(stafUsers[0].id));
                setCustomTeknisi('');
            } else {
                setSelectedStaf('');
                setCustomTeknisi('');
            }
        }
    };

    const handleSimpanTindakLanjutAdmin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem) return;
        setIsProcessing(true);

        let finalStafId: number | null = null;
        let finalTeknisi = selectedStaf;

        if (selectedStaf === '__custom__') {
            finalTeknisi = customTeknisi.trim();
        } else {
            const found = stafUsers.find((s) => String(s.id) === selectedStaf || s.name === selectedStaf);
            if (found) {
                finalStafId = found.id;
                finalTeknisi = `${found.name} (${found.role_label}${found.no_hp ? ' • ' + found.no_hp : ''})`;
            }
        }

        router.post(
            `/admin/maintenance/${selectedItem.id}/status`,
            {
                status: statusBaru,
                staf_id: finalStafId,
                nama_teknisi: finalTeknisi,
                estimasi_biaya: estimasiBiaya,
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

    const handleMulaiPengerjaanStaf = (item: MaintenanceItem) => {
        if (!confirm(`Mulai proses pengerjaan perbaikan untuk ${item.sarpras_nama}?`)) return;

        router.post(
            `/admin/maintenance/${item.id}/status`,
            {
                status: 'dalam_pengerjaan',
                staf_id: currentUserId,
            },
            { preserveScroll: true }
        );
    };

    const handleOpenStafFinishModal = (item: MaintenanceItem) => {
        setStafItemToFinish(item);
        setStafCatatan(item.catatan_staf || `Perbaikan fasilitas ${item.sarpras_nama} telah berhasil dilaksanakan dan kondisi sudah kembali berfungsi baik.`);
        setStafBiayaAktual(item.biaya_aktual || item.estimasi_biaya || 0);
        setStafFotoSelesai(null);
        setStafFotoPreview(null);
    };

    const handleSimpanPengerjaanSelesaiStaf = (e: React.FormEvent) => {
        e.preventDefault();
        if (!stafItemToFinish) return;
        setIsSubmittingStaf(true);

        const formData = new FormData();
        formData.append('status', 'selesai');
        if (currentUserId) {
            formData.append('staf_id', String(currentUserId));
        }
        formData.append('catatan_staf', stafCatatan);
        formData.append('biaya_aktual', String(stafBiayaAktual));
        if (stafFotoSelesai) {
            formData.append('foto_perbaikan_selesai', stafFotoSelesai);
        }

        router.post(`/admin/maintenance/${stafItemToFinish.id}/status`, formData, {
            preserveScroll: true,
            onFinish: () => {
                setIsSubmittingStaf(false);
                setStafItemToFinish(null);
            },
        });
    };

    const myTasks = laporanList.filter((i) => i.is_assigned_to_me);
    const stafTasks = myTasks.length > 0 ? myTasks : laporanList.filter((i) => i.status !== 'menunggu_tinjauan');
    const countSemuaStaf = stafTasks.length;
    const countPerluDikerjakan = stafTasks.filter((i) => i.status === 'disetujui').length;
    const countDalamPengerjaan = stafTasks.filter((i) => i.status === 'dalam_pengerjaan').length;
    const countSelesaiDikerjakan = stafTasks.filter((i) => i.status === 'selesai').length;

    const filteredStafTasks = stafTasks.filter((item) => {
        const matchesCard =
            stafCardFilter === 'semua'
                ? true
                : stafCardFilter === 'disetujui'
                ? item.status === 'disetujui'
                : stafCardFilter === 'dalam_pengerjaan'
                ? item.status === 'dalam_pengerjaan'
                : stafCardFilter === 'selesai'
                ? item.status === 'selesai'
                : true;
        const matchesUrgensi = urgensiFilter === 'semua' || item.tingkat_urgensi === urgensiFilter;
        const q = cari.toLowerCase();
        const matchesSearch =
            item.sarpras_nama.toLowerCase().includes(q) ||
            item.pelapor_nama.toLowerCase().includes(q) ||
            item.lokasi_ruang.toLowerCase().includes(q) ||
            item.deskripsi_kerusakan.toLowerCase().includes(q) ||
            item.kode_tiket.toLowerCase().includes(q);
        return matchesCard && matchesUrgensi && matchesSearch;
    });

    const myTaskCount = laporanList.filter((i) => i.is_assigned_to_me).length;
    const countMenunggu = laporanList.filter((i) => i.status === 'menunggu_tinjauan').length;
    const countDisetujui = laporanList.filter((i) => i.status === 'disetujui').length;
    const countPengerjaan = laporanList.filter((i) => i.status === 'dalam_pengerjaan').length;
    const countSelesai = laporanList.filter((i) => i.status === 'selesai').length;

    const filtered = laporanList.filter((item) => {
        if (tabFilter === 'tugas_saya' && !item.is_assigned_to_me) return false;
        const matchesStatus = statusFilter === 'semua' || item.status === statusFilter;
        const matchesUrgensi = urgensiFilter === 'semua' || item.tingkat_urgensi === urgensiFilter;
        const q = cari.toLowerCase();
        const matchesSearch =
            item.kode_tiket.toLowerCase().includes(q) ||
            item.sarpras_nama.toLowerCase().includes(q) ||
            item.pelapor_nama.toLowerCase().includes(q) ||
            (item.nama_teknisi && item.nama_teknisi.toLowerCase().includes(q)) ||
            item.lokasi_ruang.toLowerCase().includes(q);
        return matchesStatus && matchesUrgensi && matchesSearch;
    });

    const cleanKerusakanText = (deskripsi: string) => {
        if (!deskripsi) return '-';
        let text = deskripsi;

        if (text.includes('Catatan:')) {
            const parts = text.split('Catatan:');
            const catatan = parts.slice(1).join('Catatan:').trim();
            if (catatan) {
                const cleanCatatan = catatan.split('| Lunas:')[0].trim();
                if (cleanCatatan) {
                    return cleanCatatan;
                }
                return catatan;
            }
        }

        text = text.replace(/^Terdeteksi rusak saat\s*(pengembalian transaksi\s*[#A-Za-z0-9-]+\s*(\([^\)]+\))?)?(\.|\:)?\s*/i, '').trim();

        return text || '-';
    };

    const renderUrgensiButton = () => (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsUrgensiOpen(!isUrgensiOpen)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition cursor-pointer shadow-2xs ${
                    urgensiFilter !== 'semua' || isUrgensiOpen
                        ? 'bg-amber-50/80 border-amber-300 text-amber-900 ring-1 ring-amber-300'
                        : 'bg-white border-slate-200/90 hover:bg-slate-50 hover:border-slate-300 text-slate-700'
                }`}
                title="Pilih Tingkat Urgensi"
            >
                <SlidersHorizontal className={`w-3.5 h-3.5 ${urgensiFilter !== 'semua' ? 'text-amber-600' : 'text-slate-400'}`} />
                <span>
                    {urgensiFilter === 'semua'
                        ? 'Semua Urgensi'
                        : `Urgensi: ${urgensiFilter.charAt(0).toUpperCase() + urgensiFilter.slice(1)}`}
                </span>
                <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                        isUrgensiOpen ? 'rotate-180' : ''
                    }`}
                />
            </button>

            {isUrgensiOpen && (
                <>
                    <div
                        className="fixed inset-0 z-20"
                        onClick={() => setIsUrgensiOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-slate-200 shadow-xl z-30 p-1.5 space-y-1">
                        <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                            <span>Tingkat Urgensi</span>
                            {urgensiFilter !== 'semua' && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setUrgensiFilter('semua');
                                        setIsUrgensiOpen(false);
                                    }}
                                    className="text-[10px] font-bold text-amber-600 hover:underline cursor-pointer"
                                >
                                    Reset
                                </button>
                            )}
                        </div>

                        {[
                            { value: 'semua', label: 'Semua Urgensi', dot: 'bg-slate-300', activeClass: 'bg-slate-100 text-slate-900' },
                            { value: 'rendah', label: 'Rendah', dot: 'bg-emerald-500', activeClass: 'bg-emerald-50 text-emerald-800' },
                            { value: 'sedang', label: 'Sedang', dot: 'bg-amber-500', activeClass: 'bg-amber-50 text-amber-800' },
                            { value: 'tinggi', label: 'Tinggi', dot: 'bg-orange-500', activeClass: 'bg-orange-50 text-orange-800' },
                            { value: 'darurat', label: 'Darurat', dot: 'bg-rose-500 animate-pulse', activeClass: 'bg-rose-50 text-rose-800' },
                        ].map((option) => {
                            const isSelected = urgensiFilter === option.value;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        setUrgensiFilter(option.value);
                                        setIsUrgensiOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                                        isSelected
                                            ? `${option.activeClass} font-bold`
                                            : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${option.dot}`} />
                                        <span>{option.label}</span>
                                    </span>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );

    return (
        <AdminLayout>
            <Head title={isStaf ? "Tugas Perbaikan Saya - Biro Sarpras" : "Validasi & Penugasan Perbaikan Sarpras - Biro Sarpras"} />

            <div className="max-w-7xl mx-auto space-y-6 pb-12 px-2 sm:px-4 font-sans text-slate-800 text-xs">
                {/* Alerts */}
                {flash?.success && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-[#006039] text-sm font-semibold">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}

                {isStaf ? (
                    <>
                        {/* Header Staf - Sesuai Gambar 2 */}
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                                Tugas Perbaikan Saya
                            </h1>
                            <p className="text-xs text-slate-500 mt-1">
                                Daftar penugasan perbaikan fasilitas yang ditugaskan kepada Anda.
                            </p>
                        </div>

                        {/* 4 Cards Staf - Sesuai Gambar 2 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Card 1: Semua Tugas Saya */}
                            <button
                                type="button"
                                onClick={() => setStafCardFilter('semua')}
                                className={`bg-white p-4 rounded-2xl flex items-center gap-3.5 text-left transition cursor-pointer shadow-2xs ${
                                    stafCardFilter === 'semua'
                                        ? 'border-2 border-slate-900 shadow-xs'
                                        : 'border border-slate-200/90 hover:border-slate-300'
                                }`}
                            >
                                <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center shrink-0">
                                    <Folder className="w-5 h-5 text-amber-700" />
                                </div>
                                <div>
                                    <div className="text-xs font-semibold text-slate-700">Semua Tugas Saya</div>
                                    <div className="text-2xl font-black text-slate-900 mt-0.5">{countSemuaStaf}</div>
                                </div>
                            </button>

                            {/* Card 2: Perlu Dikerjakan */}
                            <button
                                type="button"
                                onClick={() => setStafCardFilter('disetujui')}
                                className={`bg-white p-4 rounded-2xl flex items-center gap-3.5 text-left transition cursor-pointer shadow-2xs ${
                                    stafCardFilter === 'disetujui'
                                        ? 'border-2 border-slate-900 shadow-xs'
                                        : 'border border-slate-200/90 hover:border-slate-300'
                                }`}
                            >
                                <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200/60 flex items-center justify-center shrink-0">
                                    <FileText className="w-5 h-5 text-rose-700" />
                                </div>
                                <div>
                                    <div className="text-xs font-semibold text-slate-700">Perlu Dikerjakan</div>
                                    <div className="text-2xl font-black text-slate-900 mt-0.5">{countPerluDikerjakan}</div>
                                </div>
                            </button>

                            {/* Card 3: Dalam Pengerjaan */}
                            <button
                                type="button"
                                onClick={() => setStafCardFilter('dalam_pengerjaan')}
                                className={`bg-white p-4 rounded-2xl flex items-center gap-3.5 text-left transition cursor-pointer shadow-2xs ${
                                    stafCardFilter === 'dalam_pengerjaan'
                                        ? 'border-2 border-slate-900 shadow-xs'
                                        : 'border border-slate-200/90 hover:border-slate-300'
                                }`}
                            >
                                <div className="w-11 h-11 rounded-xl bg-amber-50/80 border border-amber-200/60 flex items-center justify-center shrink-0">
                                    <Wrench className="w-5 h-5 text-amber-700" />
                                </div>
                                <div>
                                    <div className="text-xs font-semibold text-slate-700">Dalam Pengerjaan</div>
                                    <div className="text-2xl font-black text-slate-900 mt-0.5">{countDalamPengerjaan}</div>
                                </div>
                            </button>

                            {/* Card 4: Selesai Dikerjakan */}
                            <button
                                type="button"
                                onClick={() => setStafCardFilter('selesai')}
                                className={`bg-white p-4 rounded-2xl flex items-center gap-3.5 text-left transition cursor-pointer shadow-2xs ${
                                    stafCardFilter === 'selesai'
                                        ? 'border-2 border-slate-900 shadow-xs'
                                        : 'border border-slate-200/90 hover:border-slate-300'
                                }`}
                            >
                                <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <div className="text-xs font-semibold text-slate-700">Selesai Dikerjakan</div>
                                    <div className="text-2xl font-black text-slate-900 mt-0.5">{countSelesaiDikerjakan}</div>
                                </div>
                            </button>
                        </div>

                        {/* Table Card Staf */}
                        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                            {/* Toolbar Pencarian & Filter Urgensi */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="relative w-full sm:w-80">
                                    <Search className="absolute inset-y-0 left-3.5 my-auto w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={cari}
                                        onChange={(e) => setCari(e.target.value)}
                                        placeholder="Cari sarana, lokasi, kerusakan..."
                                        className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006039]"
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

                                {renderUrgensiButton()}
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto border border-slate-200/90 rounded-xl">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                                        <tr>
                                            <th className="py-3 px-4">TANGGAL</th>
                                            <th className="py-3 px-4">SARPRAS &amp; LOKASI</th>
                                            <th className="py-3 px-4">PIC PELAPOR</th>
                                            <th className="py-3 px-4">KERUSAKAN &amp; URGENSI</th>
                                            <th className="py-3 px-4 text-center">STATUS</th>
                                            <th className="py-3 px-4 text-center">AKSI</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredStafTasks.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/80 transition">
                                                {/* TANGGAL - HANYA TANGGAL TANPA KODE SESUAI PERMINTAAN USER */}
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <div className="font-bold text-slate-900 text-xs">
                                                        {item.tanggal_lapor.split(' ').slice(0, 3).join(' ')}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 mt-0.5">
                                                        {item.tanggal_lapor.split(' ').slice(3).join(' ')}
                                                    </div>
                                                </td>

                                                {/* SARPRAS & LOKASI */}
                                                <td className="py-3.5 px-4">
                                                    <div className="font-bold text-slate-900 text-xs">{item.sarpras_nama}</div>
                                                    <div className="text-[11px] text-slate-500 mt-0.5">{item.lokasi_ruang}</div>
                                                </td>

                                                {/* PIC PELAPOR */}
                                                <td className="py-3.5 px-4">
                                                    <div className="font-bold text-slate-900 text-xs">{item.pelapor_nama}</div>
                                                    <div className="text-[11px] text-slate-500 mt-0.5">{item.pelapor_role}</div>
                                                </td>

                                                {/* KERUSAKAN & URGENSI */}
                                                <td className="py-3.5 px-4">
                                                    <div className="text-slate-800 text-xs font-semibold">{cleanKerusakanText(item.deskripsi_kerusakan)}</div>
                                                    <div className="mt-1">
                                                        <span
                                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                item.tingkat_urgensi === 'darurat'
                                                                    ? 'bg-rose-50 text-rose-700 border border-rose-200/80'
                                                                    : item.tingkat_urgensi === 'tinggi'
                                                                    ? 'bg-amber-50 text-amber-700 border border-amber-200/80'
                                                                    : 'bg-slate-100 text-slate-700'
                                                            }`}
                                                        >
                                                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                                            <span>
                                                                {item.tingkat_urgensi === 'darurat'
                                                                    ? 'Darurat'
                                                                    : item.tingkat_urgensi === 'tinggi'
                                                                    ? 'Tinggi'
                                                                    : item.tingkat_urgensi === 'sedang'
                                                                    ? 'Sedang'
                                                                    : 'Rendah'}
                                                            </span>
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* STATUS */}
                                                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                                    {item.status === 'selesai' && (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                            <span>Selesai Normal</span>
                                                        </span>
                                                    )}
                                                    {item.status === 'dalam_pengerjaan' && (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                                                            <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                                                            <span>Dalam Pengerjaan</span>
                                                        </span>
                                                    )}
                                                    {item.status === 'disetujui' && (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                                            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                                                            <span>Perlu Dikerjakan</span>
                                                        </span>
                                                    )}
                                                    {item.status === 'menunggu_tinjauan' && (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                                                            <span>Menunggu Validasi</span>
                                                        </span>
                                                    )}
                                                    {item.status === 'ditolak' && (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
                                                            <X className="w-3.5 h-3.5 text-rose-600" />
                                                            <span>Ditolak</span>
                                                        </span>
                                                    )}
                                                </td>

                                                {/* AKSI - HANYA IKON SAJA SESUAI PERMINTAAN USER */}
                                                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                                    <div className="inline-flex items-center justify-center gap-1.5">
                                                        {item.status === 'disetujui' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleMulaiPengerjaanStaf(item)}
                                                                className="w-7 h-7 rounded-lg bg-white hover:bg-emerald-50 border border-slate-200/90 text-emerald-600 hover:text-emerald-700 hover:border-emerald-300 flex items-center justify-center transition cursor-pointer shadow-2xs"
                                                                title="Mulai Kerjakan Perbaikan"
                                                            >
                                                                <Play className="w-3.5 h-3.5 fill-current" />
                                                            </button>
                                                        )}

                                                        {item.status === 'dalam_pengerjaan' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenStafFinishModal(item)}
                                                                className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center transition cursor-pointer shadow-2xs"
                                                                title="Selesaikan &amp; Lapor Hasil Perbaikan"
                                                            >
                                                                <Check className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}

                                                        <button
                                                            type="button"
                                                            onClick={() => setViewDetailItem(item)}
                                                            className="w-7 h-7 rounded-lg bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-600 hover:text-emerald-700 hover:border-emerald-200 flex items-center justify-center transition cursor-pointer shadow-2xs"
                                                            title="Lihat Detail &amp; Bukti Perbaikan"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}

                                        {filteredStafTasks.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="py-12 px-4 text-center text-slate-400">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <Wrench className="w-8 h-8 text-slate-300 mb-2" />
                                                        <p className="font-bold text-slate-700 text-xs">
                                                            Tidak ada tugas perbaikan ditemukan
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 mt-1">
                                                            {cari || urgensiFilter !== 'semua' || stafCardFilter !== 'semua'
                                                                ? 'Coba sesuaikan kata kunci pencarian atau filter status Anda.'
                                                                : 'Saat ini belum ada tugas perbaikan yang dialokasikan kepada Anda.'}
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Header Bersih & Modern */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006039] border border-emerald-100 flex items-center justify-center shrink-0">
                            <Wrench className="w-6 h-6 text-[#006039]" strokeWidth={2} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-[#006039] border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
                                    {isStaf ? "EKSEKUSI PERBAIKAN STAF" : "LAYANAN PERBAIKAN BIRO"}
                                </span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                                {isStaf ? "Daftar Tugas Perbaikan Fasilitas" : "Validasi & Penugasan Perbaikan"}
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
                                {isStaf
                                    ? "Terima penugasan dari Admin, jalankan proses perbaikan fasilitas ruangan, dan laporkan hasil selesai beserta bukti."
                                    : "Validasi permintaan perbaikan dari PIC Ruangan dan tugaskan Staf Sarpras untuk mengeksekusi penanganan kerusakan."}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0 w-full sm:w-auto">
                        {/* Search Bar di Header Atas */}
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute inset-y-0 left-3.5 my-auto w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                value={cari}
                                onChange={(e) => setCari(e.target.value)}
                                placeholder="Cari sarana, pelapor, staf..."
                                className="w-full pl-9 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006039] font-medium"
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

                        {isStaf ? (
                            <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-[#006039] font-bold text-xs shrink-0">
                                <UserCheck className="w-4 h-4 text-emerald-600" />
                                <span>{myTaskCount} Tugas Ditugaskan ke Anda</span>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setStatusFilter(statusFilter === 'menunggu_tinjauan' ? 'semua' : 'menunggu_tinjauan')}
                                className="px-3.5 py-2 bg-amber-50 border border-amber-200 text-amber-900 font-bold text-xs rounded-xl flex items-center gap-2 shrink-0 cursor-pointer hover:bg-amber-100 transition shadow-2xs"
                            >
                                <Clock className="w-4 h-4 text-amber-600" />
                                <span>{countMenunggu} Permintaan Butuh Validasi</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Alerts */}
                {flash?.success && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-[#006039] text-sm font-semibold">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}

                {/* 5 Cards Ringkasan Status Interaktif, Rapi & Elegan */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
                    {/* Card 1: Semua Tiket */}
                    <button
                        type="button"
                        onClick={() => setStatusFilter('semua')}
                        className={`group p-4 rounded-2xl bg-white border border-slate-200/90 border-t-4 ${
                            statusFilter === 'semua'
                                ? 'border-t-[#006039] ring-2 ring-[#006039] bg-emerald-50/20'
                                : 'border-t-slate-300 hover:border-t-[#006039]'
                        } text-left transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-xs`}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                SEMUA TIKET
                            </span>
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                                <Layers className="w-4 h-4 text-[#006039]" />
                            </div>
                        </div>
                        <div className="my-2.5 flex items-baseline gap-1.5">
                            <span className="text-2xl font-black text-slate-900">{laporanList.length}</span>
                            <span className="text-xs font-semibold text-slate-400">Tiket</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                            <span className="w-2 h-2 rounded-full bg-[#006039] shrink-0"></span>
                            <span>Seluruh laporan kerusakan</span>
                        </div>
                    </button>

                    {/* Card 2: Menunggu Validasi */}
                    <button
                        type="button"
                        onClick={() => setStatusFilter(statusFilter === 'menunggu_tinjauan' ? 'semua' : 'menunggu_tinjauan')}
                        className={`group p-4 rounded-2xl bg-white border border-slate-200/90 border-t-4 border-t-amber-400 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-xs ${
                            statusFilter === 'menunggu_tinjauan' ? 'ring-2 ring-amber-400 bg-amber-50/20' : ''
                        }`}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                MENUNGGU VALIDASI
                            </span>
                            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                <Clock className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="my-2.5 flex items-baseline gap-1.5">
                            <span className="text-2xl font-black text-slate-900">{countMenunggu}</span>
                            <span className="text-xs font-semibold text-slate-400">Tiket</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                            <span>Laporan baru dari PIC Ruangan</span>
                        </div>
                    </button>

                    {/* Card 3: Disetujui / Ditugaskan */}
                    <button
                        type="button"
                        onClick={() => setStatusFilter(statusFilter === 'disetujui' ? 'semua' : 'disetujui')}
                        className={`group p-4 rounded-2xl bg-white border border-slate-200/90 border-t-4 border-t-blue-500 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-xs ${
                            statusFilter === 'disetujui' ? 'ring-2 ring-blue-400 bg-blue-50/20' : ''
                        }`}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                DISETUJUI / DITUGASKAN
                            </span>
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                <UserCheck className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="my-2.5 flex items-baseline gap-1.5">
                            <span className="text-2xl font-black text-slate-900">{countDisetujui}</span>
                            <span className="text-xs font-semibold text-slate-400">Tiket</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                            <span>Staf sarpras siap eksekusi</span>
                        </div>
                    </button>

                    {/* Card 4: Dalam Pengerjaan */}
                    <button
                        type="button"
                        onClick={() => setStatusFilter(statusFilter === 'dalam_pengerjaan' ? 'semua' : 'dalam_pengerjaan')}
                        className={`group p-4 rounded-2xl bg-white border border-slate-200/90 border-t-4 border-t-indigo-500 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-xs ${
                            statusFilter === 'dalam_pengerjaan' ? 'ring-2 ring-indigo-400 bg-indigo-50/20' : ''
                        }`}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                DALAM PENGERJAAN
                            </span>
                            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                                <Wrench className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="my-2.5 flex items-baseline gap-1.5">
                            <span className="text-2xl font-black text-slate-900">{countPengerjaan}</span>
                            <span className="text-xs font-semibold text-slate-400">Tiket</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                            <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0"></span>
                            <span>Sedang diperbaiki teknisi</span>
                        </div>
                    </button>

                    {/* Card 5: Selesai Normal */}
                    <button
                        type="button"
                        onClick={() => setStatusFilter(statusFilter === 'selesai' ? 'semua' : 'selesai')}
                        className={`group p-4 rounded-2xl bg-white border border-slate-200/90 border-t-4 border-t-emerald-500 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-xs ${
                            statusFilter === 'selesai' ? 'ring-2 ring-emerald-400 bg-emerald-50/20' : ''
                        }`}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                SELESAI NORMAL
                            </span>
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="my-2.5 flex items-baseline gap-1.5">
                            <span className="text-2xl font-black text-slate-900">{countSelesai}</span>
                            <span className="text-xs font-semibold text-slate-400">Tiket</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                            <span>Aset kembali berfungsi baik</span>
                        </div>
                    </button>
                </div>

                {/* Tabel Laporan Kerusakan */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
                    {/* Toolbar Header Bersih (Tanpa Duplikasi Status) */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div>
                            {isStaf ? (
                                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                                    <button
                                        onClick={() => setTabFilter('tugas_saya')}
                                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                                            tabFilter === 'tugas_saya'
                                                ? 'bg-white text-[#006039] shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        <UserCheck className="w-3.5 h-3.5" />
                                        <span>Tugas Saya ({myTaskCount})</span>
                                    </button>
                                    <button
                                        onClick={() => setTabFilter('semua')}
                                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                            tabFilter === 'semua'
                                                ? 'bg-white text-slate-900 shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        Semua Tiket ({laporanList.length})
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="font-extrabold text-sm text-slate-900">
                                        Daftar Laporan Kerusakan
                                    </h3>
                                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                                        {filtered.length} tiket
                                    </span>
                                    {statusFilter !== 'semua' ? (
                                        <button
                                            type="button"
                                            onClick={() => setStatusFilter('semua')}
                                            className="text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 transition cursor-pointer"
                                            title="Klik untuk tampilkan semua status"
                                        >
                                            <span>Status: {statusFilter.replace('_', ' ').toUpperCase()}</span>
                                            <span className="font-extrabold text-emerald-600">✕</span>
                                        </button>
                                    ) : (
                                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 rounded-full">
                                            Semua Status
                                        </span>
                                    )}
                                    {urgensiFilter !== 'semua' && (
                                        <button
                                            type="button"
                                            onClick={() => setUrgensiFilter('semua')}
                                            className="text-[10px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 transition cursor-pointer"
                                            title="Klik untuk reset filter urgensi"
                                        >
                                            <span>Urgensi: {urgensiFilter.toUpperCase()}</span>
                                            <span className="font-extrabold text-amber-600">✕</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {renderUrgensiButton()}
                        </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-200/90 rounded-2xl bg-white shadow-2xs">
                        <table className="w-full min-w-[960px] text-left text-xs border-collapse">
                            <thead className="bg-slate-50/90 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                                <tr>
                                    <th className="py-3.5 px-4 w-[12%]">Tanggal</th>
                                    <th className="py-3.5 px-3 w-[16%]">PIC Ruangan (Pelapor)</th>
                                    <th className="py-3.5 px-3 w-[22%]">Nama Barang yang Rusak &amp; Lokasi</th>
                                    <th className="py-3.5 px-3 w-[20%]">Kerusakan &amp; Urgensi</th>
                                    <th className="py-3.5 px-3 w-[14%]">Staf Pelaksana &amp; Denda</th>
                                    <th className="py-3.5 px-3 text-center w-[8%]">Status</th>
                                    <th className="py-3.5 px-4 text-center w-[8%]">{isStaf ? "Aksi Staf Pelaksana" : "Aksi Admin"}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((item) => {
                                    const borderLeftClass =
                                        item.status === 'selesai'
                                            ? 'border-l-4 border-l-emerald-500'
                                            : item.status === 'dalam_pengerjaan'
                                            ? 'border-l-4 border-l-indigo-500'
                                            : item.status === 'disetujui'
                                            ? 'border-l-4 border-l-blue-500'
                                            : item.status === 'menunggu_tinjauan'
                                            ? 'border-l-4 border-l-amber-400'
                                            : 'border-l-4 border-l-rose-500';

                                    return (
                                        <tr
                                            key={item.id}
                                            className={`hover:bg-slate-50/80 transition ${
                                                item.is_assigned_to_me ? 'bg-emerald-50/20' : ''
                                            }`}
                                        >
                                            <td className={`py-3.5 px-4 whitespace-nowrap ${borderLeftClass}`}>
                                                <div className="font-bold text-slate-900 text-xs">
                                                    {item.tanggal_lapor.split(' ').slice(0, 3).join(' ')}
                                                </div>
                                                <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                                                    {item.tanggal_lapor.split(' ').slice(3).join(' ')} WIB
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-3">
                                                <div className="font-bold text-slate-900 text-xs">{item.pelapor_nama}</div>
                                                <div className="inline-block mt-0.5 px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold text-[10px] rounded-md border border-slate-200/60">
                                                    {item.pelapor_role}
                                                </div>
                                                {item.pelapor_ruangan && (
                                                    <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[170px]" title={item.pelapor_ruangan}>
                                                        {item.pelapor_ruangan}
                                                    </div>
                                                )}
                                            </td>

                                            {/* 3. NAMA BARANG YANG RUSAK & LOKASI - Tanpa ikon obeng */}
                                            <td className="py-3.5 px-3">
                                                <div className="font-extrabold text-slate-900 text-xs leading-snug">
                                                    {item.sarpras_nama}
                                                </div>
                                                <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                                                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                                    <span className="truncate max-w-[190px]" title={item.lokasi_ruang}>{item.lokasi_ruang}</span>
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-3">
                                                <p className="text-slate-800 text-xs font-semibold line-clamp-2 leading-relaxed" title={cleanKerusakanText(item.deskripsi_kerusakan)}>
                                                    {cleanKerusakanText(item.deskripsi_kerusakan)}
                                                </p>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <span
                                                        className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold inline-flex items-center gap-1 ${
                                                            item.tingkat_urgensi === 'darurat'
                                                                 ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                                : item.tingkat_urgensi === 'tinggi'
                                                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                                : 'bg-slate-100 text-slate-800'
                                                        }`}
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                                        <span>{item.tingkat_urgensi.toUpperCase()}</span>
                                                    </span>
                                                    {item.foto_kerusakan && (
                                                        <a
                                                            href={item.foto_kerusakan}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 font-bold hover:underline"
                                                        >
                                                            <ExternalLink className="w-3 h-3" />
                                                            <span>Foto Kerusakan</span>
                                                        </a>
                                                    )}
                                                </div>
                                            </td>

                                            {/* 5. STAF PELAKSANA & DENDA - Tanpa ikon inisial */}
                                            <td className="py-3.5 px-3">
                                                {item.staf_nama || item.nama_teknisi ? (
                                                    <div className="space-y-0.5">
                                                        <div className="font-bold text-slate-900 text-xs">
                                                            {(item.staf_nama || item.nama_teknisi || '').split('(')[0].trim()}
                                                        </div>
                                                        {item.biaya_aktual && item.biaya_aktual > 0 ? (
                                                            <div className="text-[10px] text-emerald-700 font-bold">
                                                                Realisasi: Rp {item.biaya_aktual.toLocaleString('id-ID')}
                                                            </div>
                                                        ) : item.estimasi_biaya > 0 ? (
                                                            <div className="text-[10px] text-rose-700 font-bold">
                                                                Denda: Rp {item.estimasi_biaya.toLocaleString('id-ID')}
                                                            </div>
                                                        ) : (
                                                            <div className="text-[10px] text-slate-400">
                                                                Bebas Denda
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200/80 inline-block">
                                                            Belum Ditugaskan
                                                        </span>
                                                        {item.estimasi_biaya > 0 && (
                                                            <div className="text-[10px] text-rose-700 font-bold">
                                                                Denda: Rp {item.estimasi_biaya.toLocaleString('id-ID')}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>

                                            {/* 6. STATUS */}
                                            <td className="py-3.5 px-3 text-center whitespace-nowrap">
                                                {item.status === 'selesai' && (
                                                    <span className="px-3 py-1 rounded-full font-bold text-[11px] inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                        <span>Selesai</span>
                                                    </span>
                                                )}
                                                {item.status === 'menunggu_tinjauan' && (
                                                    <span className="px-3 py-1 rounded-full font-bold text-[11px] inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200">
                                                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                                                        <span>Menunggu Validasi</span>
                                                    </span>
                                                )}
                                                {item.status === 'disetujui' && (
                                                    <span className="px-3 py-1 rounded-full font-bold text-[11px] inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 border border-blue-200">
                                                        <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                                                        <span>Ditugaskan</span>
                                                    </span>
                                                )}
                                                {item.status === 'dalam_pengerjaan' && (
                                                    <span className="px-3 py-1 rounded-full font-bold text-[11px] inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-800 border border-indigo-200">
                                                        <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                                                        <span>Dalam Pengerjaan</span>
                                                    </span>
                                                )}
                                                {item.status === 'ditolak' && (
                                                    <span className="px-3 py-1 rounded-full font-bold text-[11px] inline-flex items-center gap-1.5 bg-rose-50 text-rose-800 border border-rose-200">
                                                        <X className="w-3.5 h-3.5 text-rose-600" />
                                                        <span>Ditolak</span>
                                                    </span>
                                                )}
                                            </td>

                                            {/* 7. AKSI ADMIN / STAF */}
                                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {/* Jika user adalah staf pelaksana */}
                                                    {isStaf ? (
                                                        <>
                                                            {item.status === 'disetujui' && (
                                                                <button
                                                                    onClick={() => handleMulaiPengerjaanStaf(item)}
                                                                    className="px-3.5 py-2 bg-[#006039] hover:bg-[#0f4c3a] text-white rounded-xl font-bold text-xs shadow-2xs transition cursor-pointer flex items-center gap-1.5"
                                                                >
                                                                    <Play className="w-3.5 h-3.5 fill-current" />
                                                                    <span>Mulai Kerjakan</span>
                                                                </button>
                                                            )}

                                                            {item.status === 'dalam_pengerjaan' && (
                                                                <button
                                                                    onClick={() => handleOpenStafFinishModal(item)}
                                                                    className="px-3.5 py-2 bg-[#006039] hover:bg-[#0f4c3a] text-white rounded-xl font-bold text-xs shadow-2xs transition cursor-pointer flex items-center gap-1.5"
                                                                >
                                                                    <Check className="w-3.5 h-3.5" />
                                                                    <span>Selesaikan &amp; Lapor</span>
                                                                </button>
                                                            )}

                                                            {item.status === 'selesai' && (
                                                                <button
                                                                    onClick={() => setViewDetailItem(item)}
                                                                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                                                >
                                                                    <CheckCircle2 className="w-3.5 h-3.5 text-[#006039]" />
                                                                    <span>Tinjau Hasil &amp; Bukti</span>
                                                                </button>
                                                            )}

                                                            <button
                                                                onClick={() => setViewDetailItem(item)}
                                                                className="p-2 border border-slate-200/80 bg-white hover:bg-slate-50 rounded-xl text-slate-600 hover:text-slate-900 transition cursor-pointer"
                                                                title="Lihat Detail Tiket"
                                                            >
                                                                <Eye className="w-3.5 h-3.5" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        /* Jika user adalah admin */
                                                        <>
                                                            {item.status === 'selesai' ? (
                                                                <button
                                                                    onClick={() => setViewDetailItem(item)}
                                                                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                                                >
                                                                    <CheckCircle2 className="w-3.5 h-3.5 text-[#006039]" />
                                                                    <span>Tinjau Hasil &amp; Bukti</span>
                                                                </button>
                                                            ) : item.status === 'dalam_pengerjaan' ? (
                                                                <div className="flex items-center gap-1.5">
                                                                    <button
                                                                        onClick={() => setViewDetailItem(item)}
                                                                        className="px-3.5 py-2 bg-[#006039] hover:bg-[#0f4c3a] text-white rounded-xl font-bold text-xs shadow-2xs transition cursor-pointer flex items-center gap-1.5"
                                                                    >
                                                                        <Wrench className="w-3.5 h-3.5" />
                                                                        <span>Pantau Pengerjaan</span>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleOpenAdminModal(item)}
                                                                        className="p-2 border border-slate-200/80 bg-white hover:bg-slate-50 rounded-xl text-slate-600 hover:text-slate-900 transition cursor-pointer"
                                                                        title="Update Status"
                                                                    >
                                                                        <Eye className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            ) : item.status === 'menunggu_tinjauan' ? (
                                                                <button
                                                                    onClick={() => handleOpenAdminModal(item)}
                                                                    className="px-3.5 py-2 bg-[#006039] hover:bg-[#0f4c3a] text-white rounded-xl font-bold text-xs shadow-2xs transition cursor-pointer flex items-center gap-1.5"
                                                                >
                                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                                    <span>Validasi &amp; Tugaskan</span>
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleOpenAdminModal(item)}
                                                                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-xl font-bold text-xs transition cursor-pointer shadow-2xs"
                                                                >
                                                                    Update Status
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
                                                <Wrench className="w-6 h-6 stroke-1 text-slate-400" />
                                            </div>
                                            <p className="font-extrabold text-slate-700 text-sm">Tidak Ada Tiket Perbaikan</p>
                                            <p className="text-slate-400 text-xs mt-0.5">Tidak ditemukan laporan kerusakan fasilitas yang sesuai dengan filter pencarian.</p>
                                            {(statusFilter !== 'semua' || urgensiFilter !== 'semua' || cari) && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setStatusFilter('semua');
                                                        setUrgensiFilter('semua');
                                                        setCari('');
                                                    }}
                                                    className="mt-3 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer inline-flex items-center gap-1.5"
                                                >
                                                    <Layers className="w-3.5 h-3.5 text-[#006039]" />
                                                    <span>Tampilkan Semua Tiket</span>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                    </>
                )}

                {/* MODAL VALIDASI & PENUGASAN STAF SARPRAS OLEH ADMIN */}
                {selectedItem && (
                    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
                        <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl border border-slate-200 my-auto max-h-[90vh] overflow-y-auto space-y-4">
                            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                                <div>
                                    <span className="text-[11px] font-semibold bg-slate-100 px-2.5 py-0.5 rounded text-slate-700 inline-flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-slate-400" />
                                        <span>{selectedItem.tanggal_lapor}</span>
                                    </span>
                                    <h3 className="text-base font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
                                        <ShieldCheck className="w-5 h-5 text-[#006039]" />
                                        <span>Validasi &amp; Penugasan Staf Sarpras</span>
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Setujui keluhan perbaikan dari Kepala Bagian dan tunjuk staf sarpras pelaksana.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs border border-slate-200/70">
                                <div>
                                    <strong>Pelapor:</strong> {selectedItem.pelapor_nama} ({selectedItem.pelapor_role})
                                </div>
                                <div>
                                    <strong>Nama Barang yang Rusak:</strong> <span className="font-extrabold text-slate-900">{selectedItem.sarpras_nama}</span> di {selectedItem.lokasi_ruang}
                                </div>
                                <div>
                                    <strong>Keluhan:</strong> {selectedItem.deskripsi_kerusakan}
                                </div>
                                {selectedItem.estimasi_biaya > 0 && (
                                    <div className="pt-0.5">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg font-bold text-[11px]">
                                            <span>Denda Kerusakan dari Peminjam:</span>
                                            <span className="font-extrabold">Rp {selectedItem.estimasi_biaya.toLocaleString('id-ID')}</span>
                                        </span>
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleSimpanTindakLanjutAdmin} className="space-y-3.5">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1 text-xs">
                                        Keputusan Validasi Admin:
                                    </label>
                                    <select
                                        value={statusBaru}
                                        onChange={(e) => setStatusBaru(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-xl font-bold text-xs bg-white focus:ring-2 focus:ring-[#006039]"
                                    >
                                        <option value="disetujui">✓ Setujui Permintaan &amp; Tugaskan Staf Sarpras</option>
                                        <option value="dalam_pengerjaan">Sedang Dalam Pengerjaan Staf</option>
                                        <option value="selesai">Selesai Diperbaiki (Kondisi Normal Kembali)</option>
                                        <option value="ditolak">✕ Tolak Permintaan Perbaikan</option>
                                    </select>
                                </div>

                                {statusBaru !== 'ditolak' && (
                                    <div className="space-y-1.5 p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
                                        <label className="block font-bold text-[#006039] text-xs flex items-center gap-1.5">
                                            <UserCheck className="w-4 h-4" />
                                            <span>Tugaskan Salah Satu Staf Sarpras Pelaksana:</span>
                                        </label>
                                        <select
                                            value={selectedStaf}
                                            onChange={(e) => setSelectedStaf(e.target.value)}
                                            className="w-full px-3 py-2 border border-emerald-300 rounded-xl text-xs font-semibold bg-white focus:ring-2 focus:ring-[#006039] cursor-pointer"
                                            required={statusBaru === 'disetujui'}
                                        >
                                            <option value="">-- Pilih Staf Sarpras Pelaksana --</option>
                                            {stafUsers.map((staf) => (
                                                <option key={staf.id} value={String(staf.id)}>
                                                    {staf.name} ({staf.role_label}
                                                    {staf.no_hp ? ` • WA: ${staf.no_hp}` : ''})
                                                </option>
                                            ))}
                                            <option value="__custom__">Teknisi / Vendor Rekanan Eksternal...</option>
                                        </select>

                                        {selectedStaf === '__custom__' && (
                                            <input
                                                type="text"
                                                value={customTeknisi}
                                                onChange={(e) => setCustomTeknisi(e.target.value)}
                                                placeholder="Tuliskan nama teknisi / vendor..."
                                                className="w-full px-3 py-2 border border-emerald-300 rounded-xl text-xs bg-white mt-1.5"
                                                required
                                            />
                                        )}
                                        <p className="text-[10px] text-emerald-800">
                                            Staf Sarpras yang ditugaskan akan langsung melihat tiket ini di menu "Tugas Perbaikan" mereka.
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1 text-xs flex items-center justify-between">
                                            <span>Denda Kerusakan Barang:</span>
                                            {selectedItem.estimasi_biaya > 0 && (
                                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                    Otomatis dari Denda
                                                </span>
                                            )}
                                        </label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-bold text-slate-500">
                                                Rp
                                            </span>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={formatRupiahInput(estimasiBiaya)}
                                                onChange={(e) => setEstimasiBiaya(parseRupiahInput(e.target.value))}
                                                placeholder="0 jika gratis"
                                                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#006039] focus:outline-none"
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-1">
                                            Denda kerusakan yang dibebankan kepada peminjam otomatis diteruskan ke staf sebagai anggaran perbaikan.
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1 text-xs">
                                            Arahan / Catatan Admin:
                                        </label>
                                        <input
                                            type="text"
                                            value={catatanAdmin}
                                            onChange={(e) => setCatatanAdmin(e.target.value)}
                                            placeholder="Arahan pengerjaan untuk staf..."
                                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#006039] focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedItem(null)}
                                        className="px-4 py-2 border rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer text-xs"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isProcessing}
                                        className="px-4 py-2 bg-[#006039] hover:bg-[#0f4c3a] text-white rounded-xl font-bold shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5 text-xs"
                                    >
                                        <Check className="w-4 h-4" />
                                        <span>{isProcessing ? 'Menyimpan...' : 'Setujui & Tugaskan Staf'}</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL SELESAIKAN PERBAIKAN & LAPOR OLEH STAF SARPRAS */}
                {stafItemToFinish && (
                    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
                        <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl border border-slate-200 my-auto max-h-[90vh] overflow-y-auto space-y-3.5">
                            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                                <div>
                                    <span className="text-[11px] font-semibold bg-slate-100 px-2.5 py-0.5 rounded text-slate-700 inline-flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-slate-400" />
                                        <span>{stafItemToFinish.tanggal_lapor}</span>
                                    </span>
                                    <h3 className="text-base font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
                                        <CheckCircle2 className="w-5 h-5 text-[#006039]" />
                                        <span>Laporan Penyelesaian Perbaikan</span>
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Laporkan bahwa fasilitas telah selesai diperbaiki dan siap digunakan kembali.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setStafItemToFinish(null)}
                                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-3 bg-emerald-50/60 rounded-xl space-y-1.5 text-xs border border-emerald-200/70">
                                <div>
                                    <strong>Nama Barang yang Rusak:</strong> <span className="font-extrabold text-slate-900">{stafItemToFinish.sarpras_nama}</span> di {stafItemToFinish.lokasi_ruang}
                                </div>
                                <div>
                                    <strong>Kerusakan yang Dilaporkan:</strong> {stafItemToFinish.deskripsi_kerusakan}
                                </div>
                                {stafItemToFinish.estimasi_biaya > 0 && (
                                    <div className="pt-0.5">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-200 rounded-lg font-bold text-[11px]">
                                            <span>Denda Kerusakan / Anggaran Diterima:</span>
                                            <span className="text-rose-700 font-extrabold">Rp {stafItemToFinish.estimasi_biaya.toLocaleString('id-ID')}</span>
                                        </span>
                                    </div>
                                )}
                                {stafItemToFinish.catatan_admin && (
                                    <div className="text-emerald-900 font-medium pt-0.5">
                                        <strong>Arahan Admin:</strong> {stafItemToFinish.catatan_admin}
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleSimpanPengerjaanSelesaiStaf} className="space-y-3.5">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1 text-xs">
                                        Catatan / Laporan Pengerjaan Staf:
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={stafCatatan}
                                        onChange={(e) => setStafCatatan(e.target.value)}
                                        placeholder="Tuliskan tindakan yang telah dilakukan (misal: penggantian komponen, pembersihan unit, pengetesan normal)..."
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#006039] focus:outline-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1 text-xs">
                                        Biaya Aktual / Realisasi Pengeluaran:
                                    </label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-bold text-slate-500">
                                            Rp
                                        </span>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={formatRupiahInput(stafBiayaAktual)}
                                            onChange={(e) => setStafBiayaAktual(parseRupiahInput(e.target.value))}
                                            placeholder="0 jika tidak ada pembelian suku cadang"
                                            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#006039] focus:outline-none"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-1">
                                        Realisasi biaya yang digunakan dari alokasi denda kerusakan barang di atas.
                                    </p>
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1 text-xs">
                                        Upload Foto Bukti Hasil Perbaikan (Opsional):
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0] || null;
                                                setStafFotoSelesai(file);
                                                if (file) {
                                                    setStafFotoPreview(URL.createObjectURL(file));
                                                } else {
                                                    setStafFotoPreview(null);
                                                }
                                            }}
                                            className="flex-1 text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-[#006039] hover:file:bg-emerald-100 cursor-pointer"
                                        />

                                        {stafFotoPreview && (
                                            <div className="relative flex-shrink-0 group">
                                                <img
                                                    src={stafFotoPreview}
                                                    alt="Preview Bukti Perbaikan"
                                                    className="w-12 h-12 rounded-xl object-cover border border-emerald-300 shadow-xs"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setStafFotoSelesai(null);
                                                        setStafFotoPreview(null);
                                                    }}
                                                    className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 shadow-sm hover:bg-rose-600 cursor-pointer"
                                                    title="Hapus foto"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="sticky bottom-0 bg-white pt-3 pb-0.5 border-t border-slate-100 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setStafItemToFinish(null)}
                                        className="px-4 py-2 border rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer text-xs"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmittingStaf}
                                        className="px-4 py-2 bg-[#006039] hover:bg-[#0f4c3a] text-white rounded-xl font-bold shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5 text-xs"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>{isSubmittingStaf ? 'Menyimpan...' : 'Selesaikan & Laporkan'}</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL DETAIL TIKET LENGKAP */}
                {viewDetailItem && (
                    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
                        <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl border border-slate-200 my-auto space-y-4 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                                <div>
                                    <span className="text-[11px] font-semibold bg-slate-100 px-2.5 py-0.5 rounded text-slate-700 inline-flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-slate-400" />
                                        <span>{viewDetailItem.tanggal_lapor}</span>
                                    </span>
                                    <h3 className="text-base font-extrabold text-slate-900 mt-1">
                                        Detail Laporan Perbaikan
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setViewDetailItem(null)}
                                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl">
                                    <div>
                                        <span className="text-[10px] text-slate-400 block uppercase">Fasilitas</span>
                                        <strong className="text-slate-800">{viewDetailItem.sarpras_nama}</strong>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 block uppercase">Lokasi Ruang</span>
                                        <strong className="text-slate-800">{viewDetailItem.lokasi_ruang}</strong>
                                    </div>
                                    <div className="mt-2">
                                        <span className="text-[10px] text-slate-400 block uppercase">Pelapor</span>
                                        <span className="font-semibold text-slate-700">{viewDetailItem.pelapor_nama} ({viewDetailItem.pelapor_role})</span>
                                    </div>
                                    <div className="mt-2">
                                        <span className="text-[10px] text-slate-400 block uppercase">Tanggal Dilaporkan</span>
                                        <span className="text-slate-600">{viewDetailItem.tanggal_lapor}</span>
                                    </div>
                                </div>

                                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Keluhan / Kerusakan</span>
                                    <p className="text-slate-800">{viewDetailItem.deskripsi_kerusakan}</p>
                                    {viewDetailItem.foto_kerusakan && (
                                        <div className="pt-2">
                                            <a
                                                href={viewDetailItem.foto_kerusakan}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:underline"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                <span>Buka Foto Kerusakan Awal</span>
                                            </a>
                                        </div>
                                    )}
                                </div>

                                <div className="p-3 bg-emerald-50/60 border border-emerald-200/70 rounded-xl space-y-2">
                                    <span className="text-[10px] text-emerald-800 block uppercase font-bold">Penugasan &amp; Eksekusi Staf</span>
                                    <div>
                                        <strong>Staf Pelaksana:</strong> {viewDetailItem.staf_nama || viewDetailItem.nama_teknisi || 'Belum ditugaskan'}
                                    </div>
                                    {viewDetailItem.catatan_admin && (
                                        <div>
                                            <strong>Catatan Admin:</strong> {viewDetailItem.catatan_admin}
                                        </div>
                                    )}
                                    {viewDetailItem.catatan_staf && (
                                        <div>
                                            <strong>Laporan Hasil Pengerjaan Staf:</strong> {viewDetailItem.catatan_staf}
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-200/50">
                                        <div>
                                            <span className="text-[10px] text-slate-500">Denda Kerusakan Barang:</span>
                                            <div className="font-bold text-slate-800">
                                                Rp {viewDetailItem.estimasi_biaya.toLocaleString('id-ID')}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-500">Biaya Realisasi:</span>
                                            <div className="font-bold text-emerald-700">
                                                Rp {(viewDetailItem.biaya_aktual || 0).toLocaleString('id-ID')}
                                            </div>
                                        </div>
                                    </div>
                                    {viewDetailItem.foto_perbaikan_selesai && (
                                        <div className="pt-2 space-y-1.5">
                                            <span className="text-[10px] text-emerald-800 font-bold block">
                                                Foto Bukti Hasil Pengerjaan Staf:
                                            </span>
                                            <div className="rounded-xl overflow-hidden border border-emerald-300 bg-slate-900 max-h-56 flex items-center justify-center">
                                                <img
                                                    src={viewDetailItem.foto_perbaikan_selesai}
                                                    alt="Bukti Selesai"
                                                    className="w-full h-full object-contain max-h-56"
                                                />
                                            </div>
                                            <a
                                                href={viewDetailItem.foto_perbaikan_selesai}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 text-xs text-[#006039] font-bold hover:underline mt-1"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                <span>Buka Gambar Ukuran Penuh</span>
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end pt-3 border-t border-slate-100">
                                <button
                                    onClick={() => setViewDetailItem(null)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
