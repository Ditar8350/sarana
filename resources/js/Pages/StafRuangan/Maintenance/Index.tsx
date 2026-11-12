import React, { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    Wrench,
    Search,
    Clock,
    CheckCircle2,
    AlertTriangle,
    AlertCircle,
    X,
    Eye,
    MessageSquare,
    UserCheck,
    Building2,
    Camera,
    Info,
    Lock,
    Package,
    Filter,
    Send,
    Sparkles,
} from 'lucide-react';

interface MaintenanceItem {
    id: number;
    sarpras_id?: number | null;
    kode_tiket: string;
    nama_sarpras: string;
    lokasi_ruang: string;
    tingkat_urgensi: string;
    alasan_maintenance: string;
    foto_kerusakan: string | null;
    status: string;
    nama_teknisi: string | null;
    catatan_admin: string | null;
    catatan_staf?: string | null;
    foto_perbaikan_selesai?: string | null;
    biaya_aktual?: number;
    tanggal_mulai?: string | null;
    tanggal_selesai?: string | null;
    tanggal_lapor: string;
}

interface SarprasKatalogItem {
    id: number;
    kode: string;
    nama: string;
    kategori: string;
    lokasi: string;
    stok_total: number;
    stok_tersedia?: number;
    jumlah_baik?: number;
    jumlah_sedang?: number;
    jumlah_rusak?: number;
    deskripsi?: string | null;
    satuan: string;
    kondisi_umum?: string;
    foto_url?: string | null;
}

interface Props {
    ruanganNama: string;
    ruanganOptions?: string[];
    maintenanceList: MaintenanceItem[];
    sarprasKatalog: SarprasKatalogItem[];
    totalInventarisRuangan?: number;
    pendingVerificationCount?: number;
    unsentCount?: number;
}

export default function StafRuanganMaintenanceIndex({
    ruanganNama,
    ruanganOptions = [],
    maintenanceList = [],
    sarprasKatalog = [],
    totalInventarisRuangan = 0,
    pendingVerificationCount = 0,
    unsentCount = 0,
}: Props) {
    const { flash } = usePage().props as any;

    const [activeTab, setActiveTab] = useState<'inventaris' | 'riwayat'>('inventaris');
    const [filterRuangan, setFilterRuangan] = useState<string>('semua');
    const [filterKondisi, setFilterKondisi] = useState<string>('semua');
    const [searchInventaris, setSearchInventaris] = useState('');

    // Filter untuk tab riwayat
    const [searchRiwayat, setSearchRiwayat] = useState('');
    const [statusFilter, setStatusFilter] = useState('semua');

    // Modal state
    const [selectedItemForService, setSelectedItemForService] = useState<SarprasKatalogItem | null>(null);
    const [selectedDetail, setSelectedDetail] = useState<MaintenanceItem | null>(null);
    const [previewFoto, setPreviewFoto] = useState<{ url: string; nama: string } | null>(null);

    // Form State Pengajuan Servis
    const [tingkatUrgensi, setTingkatUrgensi] = useState<'rendah' | 'sedang' | 'tinggi' | 'darurat'>('sedang');
    const [alasanMaintenance, setAlasanMaintenance] = useState('');
    const [fotoFile, setFotoFile] = useState<File | null>(null);
    const [fotoPreview, setFotoPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Auto-open modal jika ada parameter sarpras_id di URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const paramId = params.get('sarpras_id');
        if (paramId && sarprasKatalog.length > 0) {
            const found = sarprasKatalog.find((s) => String(s.id) === paramId);
            if (found) {
                handleOpenServiceModal(found);
            }
        }
    }, []);

    const normalizeKondisi = (
        kondisi?: string | null
    ): { label: string; value: 'Baik' | 'Sedang' | 'Rusak'; badgeClass: string } => {
        const raw = (kondisi || 'Baik').toLowerCase().trim();
        if (raw === 'baik') {
            return {
                label: 'Baik',
                value: 'Baik',
                badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            };
        }
        if (raw === 'sedang' || raw === 'rusak_ringan' || raw === 'rusak ringan') {
            return {
                label: 'Sedang / Rusak Ringan',
                value: 'Sedang',
                badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
            };
        }
        return {
            label: 'Rusak Berat',
            value: 'Rusak',
            badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        };
    };

    // Cari tiket aktif untuk suatu item inventaris
    const getActiveTicketForItem = (item: SarprasKatalogItem): MaintenanceItem | undefined => {
        return maintenanceList.find(
            (m) =>
                (m.sarpras_id === item.id ||
                    (m.nama_sarpras.toLowerCase() === item.nama.toLowerCase() &&
                        m.lokasi_ruang.toLowerCase() === item.lokasi.toLowerCase())) &&
                ['menunggu_tinjauan', 'disetujui', 'dalam_pengerjaan'].includes(m.status)
        );
    };

    const handleOpenServiceModal = (item: SarprasKatalogItem) => {
        setSelectedItemForService(item);
        const cond = normalizeKondisi(item.kondisi_umum).value;
        setTingkatUrgensi(cond === 'Rusak' ? 'tinggi' : 'sedang');
        setAlasanMaintenance('');
        setFotoFile(null);
        setFotoPreview(null);
    };

    const handleCloseServiceModal = () => {
        if (isSubmitting) return;
        setSelectedItemForService(null);
        setAlasanMaintenance('');
        setFotoFile(null);
        setFotoPreview(null);
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFotoFile(file);
            setFotoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmitMaintenance = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItemForService) return;
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('sarpras_id', String(selectedItemForService.id));
        formData.append('tingkat_urgensi', tingkatUrgensi);
        formData.append('alasan_maintenance', alasanMaintenance);
        if (fotoFile) formData.append('foto_kerusakan', fotoFile);

        router.post('/staf-ruangan/maintenance', formData, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSubmitting(false);
                setSelectedItemForService(null);
                setAlasanMaintenance('');
                setFotoFile(null);
                setFotoPreview(null);
            },
            onError: () => {
                setIsSubmitting(false);
            },
        });
    };

    // Filter Inventaris Ruangan
    const filteredInventaris = sarprasKatalog.filter((item) => {
        const matchesRuangan =
            filterRuangan === 'semua' ||
            item.lokasi?.toLowerCase() === filterRuangan.toLowerCase();
        const condVal = normalizeKondisi(item.kondisi_umum).value;
        const matchesKondisi =
            filterKondisi === 'semua' || condVal.toLowerCase() === filterKondisi.toLowerCase();
        const matchesSearch =
            item.nama.toLowerCase().includes(searchInventaris.toLowerCase()) ||
            item.kode.toLowerCase().includes(searchInventaris.toLowerCase()) ||
            item.lokasi.toLowerCase().includes(searchInventaris.toLowerCase());
        return matchesRuangan && matchesKondisi && matchesSearch;
    });

    // Filter Riwayat Perbaikan
    const filteredMaintenance = maintenanceList.filter((item) => {
        const matchesRuangan =
            filterRuangan === 'semua' ||
            item.lokasi_ruang?.toLowerCase() === filterRuangan.toLowerCase();
        const matchesStatus = statusFilter === 'semua' || item.status === statusFilter;
        const matchesSearch =
            item.kode_tiket.toLowerCase().includes(searchRiwayat.toLowerCase()) ||
            item.nama_sarpras.toLowerCase().includes(searchRiwayat.toLowerCase()) ||
            item.alasan_maintenance.toLowerCase().includes(searchRiwayat.toLowerCase());
        return matchesRuangan && matchesStatus && matchesSearch;
    });

    // Statistik Ringkas
    const totalInventarisCount = sarprasKatalog.length;
    const perluServisCount = sarprasKatalog.filter(
        (i) => normalizeKondisi(i.kondisi_umum).value !== 'Baik'
    ).length;
    const sedangDiservisCount = maintenanceList.filter((m) =>
        ['menunggu_tinjauan', 'disetujui', 'dalam_pengerjaan'].includes(m.status)
    ).length;
    const selesaiDiservisCount = maintenanceList.filter((m) => m.status === 'selesai').length;

    const formatUrgensi = (urgensi: string) => {
        switch (urgensi) {
            case 'darurat':
                return { label: 'Darurat / Urgent', color: 'bg-rose-50 text-rose-700 border-rose-200' };
            case 'tinggi':
                return { label: 'Tinggi', color: 'bg-amber-50 text-amber-700 border-amber-200' };
            case 'sedang':
                return { label: 'Sedang', color: 'bg-sky-50 text-sky-700 border-sky-200' };
            default:
                return { label: 'Rendah', color: 'bg-slate-50 text-slate-700 border-slate-200' };
        }
    };

    const formatStatus = (status: string) => {
        switch (status) {
            case 'menunggu_tinjauan':
                return {
                    label: 'Menunggu Validasi Admin',
                    shortLabel: 'Menunggu Validasi',
                    color: 'bg-amber-50 text-amber-700 border-amber-200',
                    icon: Clock,
                };
            case 'disetujui':
                return {
                    label: 'Disetujui • Teknisi Ditugaskan',
                    shortLabel: 'Teknisi Ditugaskan',
                    color: 'bg-blue-50 text-blue-700 border-blue-200',
                    icon: CheckCircle2,
                };
            case 'dalam_pengerjaan':
                return {
                    label: 'Sedang Dikerjakan Teknisi',
                    shortLabel: 'Sedang Diservis',
                    color: 'bg-purple-50 text-purple-700 border-purple-200',
                    icon: Wrench,
                };
            case 'selesai':
                return {
                    label: 'Perbaikan Selesai',
                    shortLabel: 'Selesai',
                    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    icon: CheckCircle2,
                };
            case 'ditolak':
                return {
                    label: 'Ditolak / Ditunda',
                    shortLabel: 'Ditolak',
                    color: 'bg-rose-50 text-rose-700 border-rose-200',
                    icon: AlertCircle,
                };
            default:
                return {
                    label: status,
                    shortLabel: status,
                    color: 'bg-slate-100 text-slate-700 border-slate-200',
                    icon: Info,
                };
        }
    };

    return (
        <AdminLayout>
            <Head title={`Perbaikan Inventaris Ruangan - ${ruanganNama}`} />

            <div className="max-w-7xl mx-auto space-y-5 pb-16 px-2 sm:px-4 font-sans text-slate-800 text-xs">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-[#006039] via-[#094c34] to-[#004225] text-white p-5 sm:p-6 rounded-3xl shadow-xs relative overflow-hidden">
                    <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-56 h-56 rounded-full bg-white/5 blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2 max-w-2xl">
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider bg-white/15 px-3 py-1 rounded-full border border-white/20 text-emerald-100">
                                <Building2 className="w-3.5 h-3.5 text-emerald-200" />
                                <span>Unit Penugasan: {ruanganNama}</span>
                            </span>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
                                Perbaikan &amp; Servis Inventaris Ruangan
                            </h1>
                            <p className="text-emerald-100/90 text-xs sm:text-sm leading-relaxed">
                                Daftar di bawah ini terintegrasi langsung dari inventaris ruangan yang Anda kelola. Klik tombol <strong>Ajukan Servis</strong> pada barang yang mengalami kendala atau kerusakan.
                            </p>
                        </div>

                        <div className="w-full md:w-80 shrink-0">
                            {activeTab === 'inventaris' ? (
                                <div className="relative w-full">
                                    <Search className="w-4 h-4 text-emerald-900/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Cari kode aset atau nama..."
                                        value={searchInventaris}
                                        onChange={(e) => setSearchInventaris(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 bg-white text-slate-800 rounded-xl text-xs font-medium placeholder-slate-400 shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-300 transition"
                                    />
                                </div>
                            ) : (
                                <div className="relative w-full">
                                    <Search className="w-4 h-4 text-emerald-900/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Cari tiket, inventaris, keluhan..."
                                        value={searchRiwayat}
                                        onChange={(e) => setSearchRiwayat(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 bg-white text-slate-800 rounded-xl text-xs font-medium placeholder-slate-400 shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-300 transition"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 shadow-2xs">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span className="font-bold text-xs">{flash.success}</span>
                    </div>
                )}
                {flash?.error && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 shadow-2xs">
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        <span className="font-bold text-xs">{flash.error}</span>
                    </div>
                )}

                {/* 4 Kartu Statistik Ringkas */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab('inventaris');
                            setFilterKondisi('semua');
                        }}
                        className="text-left bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-emerald-300 transition cursor-pointer"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                                Inventaris Saya
                            </span>
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#006039] flex items-center justify-center">
                                <Package className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-1.5">
                            <span className="text-2xl font-extrabold text-slate-900">{totalInventarisCount}</span>
                            <span className="text-[11px] font-semibold text-slate-500">Aset Terdaftar</span>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab('inventaris');
                            setFilterKondisi(perluServisCount > 0 ? 'rusak' : 'semua');
                        }}
                        className="text-left bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-amber-300 transition cursor-pointer"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">
                                Kondisi Rusak / Sedang
                            </span>
                            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                <AlertTriangle className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-1.5">
                            <span className="text-2xl font-extrabold text-slate-900">{perluServisCount}</span>
                            <span className="text-[11px] font-semibold text-slate-500">Butuh Perhatian</span>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab('riwayat');
                            setStatusFilter('semua');
                        }}
                        className="text-left bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-blue-300 transition cursor-pointer"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
                                Sedang Diservis
                            </span>
                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Wrench className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-1.5">
                            <span className="text-2xl font-extrabold text-slate-900">{sedangDiservisCount}</span>
                            <span className="text-[11px] font-semibold text-slate-500">Tiket Aktif</span>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab('riwayat');
                            setStatusFilter('selesai');
                        }}
                        className="text-left bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-emerald-300 transition cursor-pointer"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                                Selesai Diperbaiki
                            </span>
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-1.5">
                            <span className="text-2xl font-extrabold text-slate-900">{selesaiDiservisCount}</span>
                            <span className="text-[11px] font-semibold text-slate-500">Tiket Selesai</span>
                        </div>
                    </button>
                </div>

                {/* Tab Navigasi & Filter Ruangan */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs inline-flex items-center gap-1.5 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => setActiveTab('inventaris')}
                            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                                activeTab === 'inventaris'
                                    ? 'bg-[#006039] text-white shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                        >
                            <Package className="w-3.5 h-3.5" />
                            <span>Inventaris Ruangan ({filteredInventaris.length})</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('riwayat')}
                            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                                activeTab === 'riwayat'
                                    ? 'bg-[#006039] text-white shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                        >
                            <Wrench className="w-3.5 h-3.5" />
                            <span>Riwayat &amp; Progres Servis ({filteredMaintenance.length})</span>
                        </button>
                    </div>

                    {ruanganOptions.length > 1 ? (
                        <div className="bg-white px-3.5 py-2 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
                            <Filter className="w-3.5 h-3.5 text-[#006039] shrink-0" />
                            <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap">
                                Pilih Ruangan Tugas Anda:
                            </span>
                            <select
                                value={filterRuangan}
                                onChange={(e) => setFilterRuangan(e.target.value)}
                                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#006039] focus:outline-none cursor-pointer"
                            >
                                <option value="semua">Semua Ruangan Saya ({ruanganOptions.length})</option>
                                {ruanganOptions.map((r) => (
                                    <option key={r} value={r}>
                                        {r}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : ruanganOptions.length === 1 ? (
                        <div className="bg-emerald-50/80 px-3.5 py-2 rounded-2xl border border-emerald-200 shadow-2xs flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-[#006039] shrink-0" />
                            <span className="text-[11px] font-bold text-slate-600">Ruangan Tugas:</span>
                            <span className="text-xs font-extrabold text-[#006039]">{ruanganOptions[0]}</span>
                        </div>
                    ) : null}
                </div>

                {/* TAB 1: TABEL INVENTARIS RUANGAN UNTUK PENGAJUAN SERVIS */}
                {activeTab === 'inventaris' && (
                    <div className="space-y-4">
                        {(pendingVerificationCount > 0 || unsentCount > 0) && (
                            <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-2xs">
                                <div className="flex items-start gap-3">
                                    <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                    <div className="space-y-0.5">
                                        <p className="font-extrabold text-xs">
                                            Informasi Verifikasi Inventaris untuk Perbaikan
                                        </p>
                                        <p className="text-[11px] text-amber-800/90 leading-relaxed">
                                            Data inventaris hanya muncul di tabel perbaikan setelah dikirim ke Admin dan diverifikasi oleh Admin.
                                            {pendingVerificationCount > 0 && (
                                                <span>
                                                    {' '}Terdapat <strong>{pendingVerificationCount} aset</strong> yang sedang menunggu verifikasi Admin.
                                                </span>
                                            )}
                                            {unsentCount > 0 && (
                                                <span>
                                                    {' '}Terdapat <strong>{unsentCount} aset</strong> di menu Inventaris yang belum dikirim ke Admin.
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    href="/admin/inventaris"
                                    className="px-3.5 py-2 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-[11px] font-extrabold transition shrink-0 text-center"
                                >
                                    Cek Menu Inventaris
                                </Link>
                            </div>
                        )}

                        {/* Toolbar Filter Kondisi */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
                            <span className="text-slate-600 font-bold text-xs">
                                Daftar Inventaris Ruangan ({filteredInventaris.length})
                            </span>

                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-slate-500">Filter Kondisi:</span>
                                <select
                                    value={filterKondisi}
                                    onChange={(e) => setFilterKondisi(e.target.value)}
                                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-[#006039] focus:outline-none cursor-pointer"
                                >
                                    <option value="semua">Semua Kondisi</option>
                                    <option value="baik">Baik</option>
                                    <option value="sedang">Sedang / Rusak Ringan</option>
                                    <option value="rusak">Rusak Berat</option>
                                </select>
                            </div>
                        </div>

                        {/* Tabel Inventaris */}
                        {filteredInventaris.length === 0 ? (
                            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center">
                                <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                                    <Package className="w-8 h-8" />
                                </div>
                                <h4 className="text-sm font-bold text-slate-800">
                                    {pendingVerificationCount > 0
                                        ? 'Menunggu Verifikasi Inventaris oleh Admin'
                                        : unsentCount > 0 || totalInventarisRuangan > 0
                                        ? 'Inventaris Belum Dikirim & Diverifikasi Admin'
                                        : 'Belum Ada Inventaris Terverifikasi pada Ruangan Ini'}
                                </h4>
                                <p className="text-slate-500 text-xs mt-1 max-w-md mx-auto mb-4">
                                    {pendingVerificationCount > 0
                                        ? `Laporan inventaris Anda (${pendingVerificationCount} aset) telah dikirim ke Admin dan sedang menunggu verifikasi. Tabel perbaikan akan otomatis muncul setelah diverifikasi Admin.`
                                        : 'Tabel perbaikan hanya menampilkan inventaris ruangan yang sudah Anda kirim ke Admin dan telah diverifikasi oleh Admin.'}
                                </p>
                                <Link
                                    href="/admin/inventaris"
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#006039] hover:bg-[#004d2e] text-white rounded-xl text-xs font-extrabold transition shadow-xs"
                                >
                                    <Package className="w-4 h-4" />
                                    <span>Ke Menu Inventaris Ruangan</span>
                                </Link>
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                                            <tr>
                                                <th className="p-3.5 text-center w-12">No</th>
                                                <th className="p-3.5 text-center w-16">Foto</th>
                                                <th className="p-3.5">Kode Aset</th>
                                                <th className="p-3.5">Nama Alat / Inventaris</th>
                                                <th className="p-3.5 text-center">Jumlah (Stok)</th>
                                                <th className="p-3.5">Kondisi Fisik</th>
                                                <th className="p-3.5">Lokasi Ruangan</th>
                                                <th className="p-3.5">Status Perbaikan</th>
                                                <th className="p-3.5 text-right">Aksi Perbaikan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredInventaris.map((item, idx) => {
                                                const kondisiInfo = normalizeKondisi(item.kondisi_umum);
                                                const baik =
                                                    typeof item.jumlah_baik === 'number'
                                                        ? item.jumlah_baik
                                                        : kondisiInfo.value === 'Baik'
                                                        ? item.stok_total
                                                        : 0;
                                                const sedang =
                                                    typeof item.jumlah_sedang === 'number'
                                                        ? item.jumlah_sedang
                                                        : kondisiInfo.value === 'Sedang'
                                                        ? item.stok_total
                                                        : 0;
                                                const rusak =
                                                    typeof item.jumlah_rusak === 'number'
                                                        ? item.jumlah_rusak
                                                        : kondisiInfo.value === 'Rusak'
                                                        ? item.stok_total
                                                        : 0;
                                                const activeTicket = getActiveTicketForItem(item);
                                                const activeStatusInfo = activeTicket
                                                    ? formatStatus(activeTicket.status)
                                                    : null;
                                                const ActiveStatusIcon = activeStatusInfo?.icon;

                                                return (
                                                    <tr
                                                        key={item.id}
                                                        className="hover:bg-slate-50/80 transition"
                                                    >
                                                        <td className="p-3.5 text-center font-bold text-slate-400">
                                                            {idx + 1}
                                                        </td>

                                                        <td className="p-3.5 text-center">
                                                            {item.foto_url ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setPreviewFoto({
                                                                            url: item.foto_url!,
                                                                            nama: item.nama,
                                                                        })
                                                                    }
                                                                    title="Klik untuk memperbesar foto"
                                                                    className="w-11 h-11 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 inline-flex items-center justify-center shadow-2xs hover:ring-2 hover:ring-[#006039] transition cursor-pointer"
                                                                >
                                                                    <img
                                                                        src={item.foto_url}
                                                                        alt={item.nama}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </button>
                                                            ) : (
                                                                <div
                                                                    title="Belum ada foto"
                                                                    className="w-11 h-11 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-300 inline-flex items-center justify-center"
                                                                >
                                                                    <Camera className="w-4 h-4" />
                                                                </div>
                                                            )}
                                                        </td>

                                                        <td className="p-3.5 whitespace-nowrap">
                                                            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-mono text-[11px] font-bold rounded-lg border border-slate-200">
                                                                {item.kode}
                                                            </span>
                                                        </td>

                                                        <td className="p-3.5">
                                                            <div className="font-extrabold text-slate-900 text-xs">
                                                                {item.nama}
                                                            </div>
                                                        </td>

                                                        <td className="p-3.5 text-center whitespace-nowrap">
                                                            <span className="font-extrabold text-xs bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-100">
                                                                {item.stok_total} {item.satuan || 'Unit'}
                                                            </span>
                                                        </td>

                                                        <td className="p-3.5 whitespace-nowrap">
                                                            <div className="flex flex-wrap items-center gap-1.5">
                                                                {baik > 0 && (
                                                                    <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                                                                        Baik: {baik}
                                                                    </span>
                                                                )}
                                                                {sedang > 0 && (
                                                                    <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                                                                        Sedang: {sedang}
                                                                    </span>
                                                                )}
                                                                {rusak > 0 && (
                                                                    <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-full border bg-rose-50 text-rose-700 border-rose-200">
                                                                        Rusak: {rusak}
                                                                    </span>
                                                                )}
                                                                {baik === 0 && sedang === 0 && rusak === 0 && (
                                                                    <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full border inline-flex items-center gap-1 ${kondisiInfo.badgeClass}`}>
                                                                        {kondisiInfo.label}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>

                                                        <td className="p-3.5 text-slate-700 whitespace-nowrap font-medium">
                                                            <div className="inline-flex items-center gap-1.5 text-slate-700">
                                                                <Building2 className="w-3.5 h-3.5 text-[#006039] shrink-0" />
                                                                <span>{item.lokasi || ruanganNama}</span>
                                                            </div>
                                                        </td>

                                                        <td className="p-3.5 whitespace-nowrap">
                                                            {activeTicket && activeStatusInfo ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSelectedDetail(activeTicket)}
                                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold border cursor-pointer hover:opacity-85 transition ${activeStatusInfo.color}`}
                                                                >
                                                                    {ActiveStatusIcon && (
                                                                        <ActiveStatusIcon className="w-3 h-3" />
                                                                    )}
                                                                    <span>{activeStatusInfo.shortLabel}</span>
                                                                </button>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                                    <span>Tidak Ada Tiket Aktif</span>
                                                                </span>
                                                            )}
                                                        </td>

                                                        <td className="p-3.5 text-right whitespace-nowrap">
                                                            <div className="inline-flex items-center justify-end gap-1.5">
                                                                {activeTicket ? (
                                                                    <>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setSelectedDetail(activeTicket)}
                                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-[11px] font-extrabold transition cursor-pointer"
                                                                        >
                                                                            <Eye className="w-3.5 h-3.5" />
                                                                            <span>Cek Progres</span>
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleOpenServiceModal(item)}
                                                                            title="Ajukan tiket perbaikan tambahan"
                                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 hover:border-amber-200 rounded-xl text-[11px] font-bold transition cursor-pointer"
                                                                        >
                                                                            <Wrench className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleOpenServiceModal(item)}
                                                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#006039] hover:bg-[#004d2e] text-white rounded-xl text-[11px] font-extrabold shadow-2xs transition cursor-pointer"
                                                                    >
                                                                        <Wrench className="w-3.5 h-3.5" />
                                                                        <span>Ajukan Servis</span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 2: RIWAYAT & PROGRES TIKET PERBAIKAN */}
                {activeTab === 'riwayat' && (
                    <div className="space-y-4">
                        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
                            <span className="text-slate-600 font-bold text-xs">
                                Riwayat Tiket Perbaikan ({filteredMaintenance.length})
                            </span>

                            <div className="flex items-center gap-2">
                                <span className="text-slate-500 text-[11px] font-bold">Filter Status:</span>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#006039] focus:outline-none cursor-pointer"
                                >
                                    <option value="semua">Semua Tiket</option>
                                    <option value="menunggu_tinjauan">Menunggu Validasi Admin</option>
                                    <option value="disetujui">Disetujui / Teknisi Ditugaskan</option>
                                    <option value="dalam_pengerjaan">Sedang Dikerjakan</option>
                                    <option value="selesai">Selesai Diperbaiki</option>
                                    <option value="ditolak">Ditolak</option>
                                </select>
                            </div>
                        </div>

                        {filteredMaintenance.length === 0 ? (
                            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center">
                                <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                                    <Wrench className="w-8 h-8" />
                                </div>
                                <h4 className="text-sm font-bold text-slate-800">Belum Ada Riwayat Pengajuan Servis</h4>
                                <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto mb-4">
                                    Pilih tab <strong>Inventaris Ruangan</strong> dan klik tombol <strong>Ajukan Servis</strong> pada barang yang memerlukan perbaikan.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('inventaris')}
                                    className="px-4 py-2 bg-[#006039] text-white rounded-xl text-xs font-extrabold hover:bg-[#004d2e] transition cursor-pointer"
                                >
                                    Lihat Tabel Inventaris Ruangan
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredMaintenance.map((item) => {
                                    const statusInfo = formatStatus(item.status);
                                    const urgensiInfo = formatUrgensi(item.tingkat_urgensi);
                                    const StatusIcon = statusInfo.icon;

                                    return (
                                        <div
                                            key={item.id}
                                            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-emerald-200 transition"
                                        >
                                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                                <div className="space-y-2">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg text-[11px] border border-slate-200 inline-flex items-center gap-1.5">
                                                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                            <span>{item.tanggal_lapor}</span>
                                                        </span>
                                                        <span
                                                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${urgensiInfo.color}`}
                                                        >
                                                            Urgensi: {urgensiInfo.label}
                                                        </span>
                                                        <span
                                                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${statusInfo.color}`}
                                                        >
                                                            <StatusIcon className="w-3 h-3" />
                                                            <span>{statusInfo.label}</span>
                                                        </span>
                                                        <span className="inline-flex items-center gap-1 text-slate-500 text-[11px] font-semibold">
                                                            <Building2 className="w-3 h-3 text-[#006039]" />
                                                            <span>{item.lokasi_ruang}</span>
                                                        </span>
                                                    </div>

                                                    <h3 className="text-sm font-extrabold text-slate-900">
                                                        {item.nama_sarpras}
                                                    </h3>

                                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px]">
                                                        <p className="font-bold text-slate-700 mb-0.5">
                                                            Keluhan / Gejala Kerusakan:
                                                        </p>
                                                        <p className="text-slate-600 leading-relaxed">
                                                            {item.alasan_maintenance}
                                                        </p>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-3 text-[11px] pt-1">
                                                        {item.nama_teknisi && (
                                                            <div className="flex items-center gap-1.5 text-blue-700 font-semibold bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                                                                <UserCheck className="w-3.5 h-3.5" />
                                                                <span>Teknisi: {item.nama_teknisi}</span>
                                                            </div>
                                                        )}

                                                        {item.catatan_admin && (
                                                            <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                                                                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                                                                <span>Catatan Admin: {item.catatan_admin}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                                                    {item.foto_kerusakan && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setPreviewFoto({
                                                                    url: item.foto_kerusakan!,
                                                                    nama: `Bukti Kerusakan - ${item.nama_sarpras}`,
                                                                })
                                                            }
                                                            className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 hover:ring-2 hover:ring-[#006039] transition cursor-pointer"
                                                            title="Lihat Foto Kerusakan"
                                                        >
                                                            <img
                                                                src={item.foto_kerusakan}
                                                                alt="Foto Kerusakan"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </button>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedDetail(item)}
                                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        <span>Detail Progres</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* MODAL PENGAJUAN SERVIS BERDASARKAN ITEM INVENTARIS YANG DIKLIK */}
                {selectedItemForService && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                        <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl text-xs max-h-[92vh] overflow-y-auto">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div>
                                    <span className="text-[10px] font-bold text-[#006039] uppercase tracking-wider">
                                        Pengajuan Perbaikan Inventaris
                                    </span>
                                    <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                                        Ajukan Servis Barang
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCloseServiceModal}
                                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmitMaintenance} className="space-y-4">
                                {/* Kartu Identitas Barang Inventaris (Otomatis Terkunci dari Tabel) */}
                                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex items-center gap-3.5">
                                    {selectedItemForService.foto_url ? (
                                        <div className="w-14 h-14 rounded-xl border border-emerald-200 overflow-hidden bg-white shrink-0">
                                            <img
                                                src={selectedItemForService.foto_url}
                                                alt={selectedItemForService.nama}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-14 h-14 rounded-xl bg-white border border-emerald-200 text-[#006039] flex items-center justify-center shrink-0">
                                            <Package className="w-6 h-6" />
                                        </div>
                                    )}

                                    <div className="min-w-0 flex-1 space-y-1">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="px-2 py-0.5 bg-white border border-emerald-200 rounded-md font-mono font-bold text-[10px] text-[#006039]">
                                                {selectedItemForService.kode}
                                            </span>
                                            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md font-bold text-[10px] text-slate-700">
                                                {selectedItemForService.stok_total}{' '}
                                                {selectedItemForService.satuan || 'Unit'}
                                            </span>
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-emerald-200 rounded-full text-[10px] font-bold text-[#006039] ml-auto">
                                                <Lock className="w-2.5 h-2.5" />
                                                <span>Data Inventaris</span>
                                            </span>
                                        </div>
                                        <h4 className="text-sm font-extrabold text-slate-900 truncate">
                                            {selectedItemForService.nama}
                                        </h4>
                                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                                            <Building2 className="w-3.5 h-3.5 text-[#006039] shrink-0" />
                                            <span className="truncate">
                                                {selectedItemForService.lokasi || ruanganNama}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Pilihan Tingkat Urgensi Interaktif */}
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                                        Pilih Tingkat Urgensi Kerusakan <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            {
                                                val: 'rendah',
                                                title: 'Rendah',
                                                desc: 'Masih dapat digunakan',
                                                activeClass: 'border-slate-500 bg-slate-50 text-slate-900',
                                            },
                                            {
                                                val: 'sedang',
                                                title: 'Sedang',
                                                desc: 'Perlu servis terjadwal',
                                                activeClass: 'border-sky-500 bg-sky-50/70 text-sky-900',
                                            },
                                            {
                                                val: 'tinggi',
                                                title: 'Tinggi',
                                                desc: 'Mengganggu kegiatan',
                                                activeClass: 'border-amber-500 bg-amber-50/70 text-amber-900',
                                            },
                                            {
                                                val: 'darurat',
                                                title: 'Darurat',
                                                desc: 'Mati total / bahaya',
                                                activeClass: 'border-rose-500 bg-rose-50/70 text-rose-900',
                                            },
                                        ].map((opt) => {
                                            const isSelected = tingkatUrgensi === opt.val;
                                            return (
                                                <button
                                                    key={opt.val}
                                                    type="button"
                                                    onClick={() =>
                                                        setTingkatUrgensi(
                                                            opt.val as 'rendah' | 'sedang' | 'tinggi' | 'darurat'
                                                        )
                                                    }
                                                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                                                        isSelected
                                                            ? `${opt.activeClass} ring-2 ring-offset-1 ring-[#006039]/20 font-extrabold`
                                                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                                                    }`}
                                                >
                                                    <div className="text-xs font-extrabold">{opt.title}</div>
                                                    <div className="text-[10px] opacity-80 mt-0.5">{opt.desc}</div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Keluhan / Detail Kerusakan */}
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        Keluhan / Detail Gejala Kerusakan <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={alasanMaintenance}
                                        onChange={(e) => setAlasanMaintenance(e.target.value)}
                                        placeholder="Jelaskan kondisi kerusakan secara spesifik (contoh: lampu indikator berkedip merah, AC tidak dingin, engsel patah, dsb - minimal 10 karakter)..."
                                        required
                                        minLength={10}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#006039] focus:bg-white focus:outline-none"
                                    />
                                </div>

                                {/* Unggah Foto Bukti Kerusakan */}
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        Foto Bukti Kondisi Kerusakan (Opsional)
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <label className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer transition">
                                            <Camera className="w-4 h-4 text-slate-600" />
                                            <span>{fotoPreview ? 'Ganti Foto Bukti' : 'Pilih Foto Kerusakan'}</span>
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
                                        onClick={handleCloseServiceModal}
                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-5 py-2 bg-[#006039] hover:bg-[#004d2e] text-white rounded-xl text-xs font-extrabold shadow-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                        <span>{isSubmitting ? 'Mengirim...' : 'Kirim Pengajuan Servis'}</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL DETAIL TIKET PERBAIKAN */}
                {selectedDetail && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                        <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-xl text-xs max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        Detail Laporan Perbaikan
                                    </span>
                                    <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                                        {selectedDetail.nama_sarpras}
                                    </h3>
                                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                        <Clock className="w-3 h-3 text-slate-400" />
                                        <span>Dilaporkan: {selectedDetail.tanggal_lapor}</span>
                                    </p>
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
                                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70">
                                    <span className="text-slate-400 text-[10px] uppercase font-bold">
                                        Inventaris &amp; Ruangan
                                    </span>
                                    <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                                        {selectedDetail.nama_sarpras}
                                    </p>
                                    <p className="text-[11px] font-semibold text-[#006039] mt-0.5 flex items-center gap-1">
                                        <Building2 className="w-3.5 h-3.5" />
                                        <span>{selectedDetail.lokasi_ruang}</span>
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                                    <div>
                                        <p className="text-slate-500 text-[11px]">Urgensi:</p>
                                        <p className="font-bold text-slate-900 mt-0.5">
                                            {formatUrgensi(selectedDetail.tingkat_urgensi).label}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-[11px]">Status Pengerjaan:</p>
                                        <p className="font-bold text-emerald-700 mt-0.5">
                                            {formatStatus(selectedDetail.status).label}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <span className="text-slate-700 font-bold block mb-1">
                                        Keluhan / Gejala Kerusakan:
                                    </span>
                                    <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                                        {selectedDetail.alasan_maintenance}
                                    </p>
                                </div>

                                {selectedDetail.nama_teknisi && (
                                    <div>
                                        <span className="text-slate-700 font-bold block mb-1">
                                            Teknisi Penanggung Jawab:
                                        </span>
                                        <p className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl text-blue-900 font-bold">
                                            {selectedDetail.nama_teknisi}
                                        </p>
                                    </div>
                                )}

                                {selectedDetail.catatan_admin && (
                                    <div>
                                        <span className="text-slate-700 font-bold block mb-1">
                                            Catatan Pimpinan / Admin:
                                        </span>
                                        <p className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-900">
                                            {selectedDetail.catatan_admin}
                                        </p>
                                    </div>
                                )}

                                {selectedDetail.catatan_staf && (
                                    <div>
                                        <span className="text-slate-700 font-bold block mb-1">
                                            Laporan Hasil Pengerjaan Teknisi:
                                        </span>
                                        <p className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl text-blue-900 font-medium">
                                            {selectedDetail.catatan_staf}
                                        </p>
                                    </div>
                                )}

                                {selectedDetail.foto_perbaikan_selesai && (
                                    <div>
                                        <span className="text-slate-700 font-bold block mb-1.5">
                                            Foto Bukti Perbaikan Selesai:
                                        </span>
                                        <div className="rounded-xl border border-emerald-200 overflow-hidden max-h-48">
                                            <img
                                                src={selectedDetail.foto_perbaikan_selesai}
                                                alt="Hasil Perbaikan"
                                                className="w-full h-full object-contain bg-slate-900"
                                            />
                                        </div>
                                    </div>
                                )}

                                {selectedDetail.foto_kerusakan && (
                                    <div>
                                        <span className="text-slate-700 font-bold block mb-1.5">
                                            Foto Bukti Kerusakan Awal:
                                        </span>
                                        <div className="rounded-xl border border-slate-200 overflow-hidden max-h-48">
                                            <img
                                                src={selectedDetail.foto_kerusakan}
                                                alt="Kerusakan"
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
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL PREVIEW FOTO */}
                {previewFoto && (
                    <div
                        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
                        onClick={() => setPreviewFoto(null)}
                    >
                        <div
                            className="bg-white rounded-3xl max-w-lg w-full p-4 space-y-3 border border-slate-200 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between px-1">
                                <div>
                                    <span className="text-[10px] font-bold text-[#006039] uppercase tracking-wider">
                                        Pratinjau Foto
                                    </span>
                                    <h3 className="text-sm font-extrabold text-slate-900">{previewFoto.nama}</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setPreviewFoto(null)}
                                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 max-h-[70vh] flex items-center justify-center">
                                <img
                                    src={previewFoto.url}
                                    alt={previewFoto.nama}
                                    className="max-h-[70vh] w-auto object-contain"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
