import React, { useState } from 'react';
import { Head, router, usePage, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { PageProps } from '@/types';
import {
    Clock,
    CheckCircle2,
    AlertCircle,
    RotateCcw,
    X,
    UserCheck,
    UploadCloud,
    Package,
    PauseCircle,
    Calendar,
    Search,
    Camera,
    Eye,
    Plus,
    ClipboardList,
    MapPin,
    Phone,
    Pencil,
    Trash2,
    AlertTriangle,
    Info,
    Layers,
    XCircle,
} from 'lucide-react';

interface RiwayatItem {
    id: number;
    kode: string;
    nama_peminjam: string;
    nim_nip: string;
    instansi_prodi: string;
    no_whatsapp: string;
    file_ktm: string;
    keperluan: string;
    tanggal_mulai: string;
    tanggal_kembali_rencana: string;
    tanggal_kembali_aktual: string | null;
    status:
        | 'menunggu_validasi'
        | 'ditunda'
        | 'disetujui'
        | 'siap_diambil'
        | 'sedang_dipinjam'
        | 'menunggu_kembali'
        | 'selesai'
        | 'ditolak'
        | 'dibatalkan';
    catatan_admin: string | null;
    petugas_pengambilan: string | null;
    no_hp_pendamping?: string | null;
    lokasi_pengambilan: string | null;
    foto_bukti_terima?: string | null;
    tanggal_terima?: string | null;
    validator_nama: string | null;
    has_pengembalian: boolean;
    pengembalian: {
        id: number;
        kode_pengembalian?: string;
        status_verifikasi: string;
        biaya_denda: number;
        nomor_rekening?: string | null;
        status_pembayaran_denda?: string | null;
        bukti_bayar_denda?: string | null;
        catatan_bayar_denda?: string | null;
        diverifikasi_denda_pada?: string | null;
        foto_bukti: string | null;
        catatan_inspeksi: string | null;
    } | null;
    items: Array<{
        id: number;
        sarpras_id: number;
        nama_barang: string;
        jenis: string;
        lokasi: string;
        foto_url: string | null;
        qty: number;
        satuan: string;
    }>;
}

interface StatusKelayakan {
    eligible: boolean;
    alasan: 'belum_mengembalikan' | 'tanggungan_denda' | string;
    pesan: string;
    kode?: string;
    nominal?: number;
}

interface Props {
    riwayat: RiwayatItem[];
    statusKelayakan?: StatusKelayakan | null;
}

export default function PeminjamanMahasiswaIndex({ riwayat = [], statusKelayakan = null }: Props) {
    const { auth, flash } = usePage<PageProps & { flash?: { success?: string; error?: string } }>().props;
    const userRole = (auth?.user?.role as string) || '';
    const cannotBorrow = ['admin', 'staf'].includes(userRole);
    const isUmum = !auth?.user?.nomor_induk || userRole === 'umum';
    const [cari, setCari] = useState('');
    const [tabRiwayat, setTabRiwayat] = useState<'semua' | 'proses' | 'aktif' | 'selesai' | 'ditolak'>('semua');

    // Modal Step 4: Upload Bukti Barang yang Diterima -> Baru Dinyatakan Sukses
    const [selectedTerimaItem, setSelectedTerimaItem] = useState<RiwayatItem | null>(null);
    const [fotoTerima, setFotoTerima] = useState<File | null>(null);
    const [previewTerimaUrl, setPreviewTerimaUrl] = useState<string | null>(null);
    const [isSubmittingTerima, setIsSubmittingTerima] = useState(false);

    // Lightbox Lihat Foto Bukti Terima
    const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);

    // Modal Pengembalian
    const [selectedKembaliItem, setSelectedKembaliItem] = useState<RiwayatItem | null>(null);
    const [fotoBukti, setFotoBukti] = useState<File | null>(null);
    const [previewBuktiUrl, setPreviewBuktiUrl] = useState<string | null>(null);
    const [catatanKembali, setCatatanKembali] = useState('');
    const [isSubmittingKembali, setIsSubmittingKembali] = useState(false);

    // Modal Batalkan Pengajuan Sebelum Approval
    const [cancellingItem, setCancellingItem] = useState<RiwayatItem | null>(null);
    const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

    // Modal Pop-up Alasan Penolakan
    const [selectedAlasanItem, setSelectedAlasanItem] = useState<RiwayatItem | null>(null);

    const handleConfirmCancel = () => {
        if (!cancellingItem) return;
        setIsSubmittingCancel(true);
        router.delete(`/layanan/peminjaman/${cancellingItem.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setIsSubmittingCancel(false);
                setCancellingItem(null);
            },
        });
    };

    const handleTerimaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setFotoTerima(file);
        if (file && file.type.startsWith('image/')) {
            setPreviewTerimaUrl(URL.createObjectURL(file));
        } else {
            setPreviewTerimaUrl(null);
        }
    };

    const handleSubmitTerimaBarang = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTerimaItem || !fotoTerima) return;
        setIsSubmittingTerima(true);

        const formData = new FormData();
        formData.append('foto_bukti_terima', fotoTerima);

        router.post(`/layanan/peminjaman/${selectedTerimaItem.id}/terima-barang`, formData as any, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => {
                setIsSubmittingTerima(false);
                setSelectedTerimaItem(null);
                setFotoTerima(null);
                setPreviewTerimaUrl(null);
            },
        });
    };

    const handleBuktiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setFotoBukti(file);
        if (file && file.type.startsWith('image/')) {
            setPreviewBuktiUrl(URL.createObjectURL(file));
        } else {
            setPreviewBuktiUrl(null);
        }
    };

    const handleSubmitPengembalian = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedKembaliItem || !fotoBukti) return;
        setIsSubmittingKembali(true);

        const formData = new FormData();
        formData.append('foto_bukti', fotoBukti);
        if (catatanKembali) formData.append('catatan', catatanKembali);

        router.post(`/layanan/peminjaman/${selectedKembaliItem.id}/kembalikan`, formData as any, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => {
                setIsSubmittingKembali(false);
                setSelectedKembaliItem(null);
                setFotoBukti(null);
                setPreviewBuktiUrl(null);
                setCatatanKembali('');
            },
        });
    };

    // 1. Daftar Pengajuan yang MASIH DALAM PROSES (Step 1 s/d Step 4 belum selesai) -> Ditampilkan sebagai Kartu Stepper di Atas
    const sedangProsesList = riwayat.filter((r) =>
        ['menunggu_validasi', 'ditunda', 'disetujui', 'siap_diambil'].includes(r.status)
    );

    // 2. Daftar yang SUDAH SELESAI / SUKSES / DITOLAK -> Masuk ke Tabel Riwayat di Bagian Bawah
    const riwayatSelesaiList = riwayat.filter((r) =>
        ['sedang_dipinjam', 'menunggu_kembali', 'selesai', 'ditolak'].includes(r.status)
    );

    const filteredRiwayatTable = riwayatSelesaiList.filter((item) => {
        const matchesCari =
            item.kode.toLowerCase().includes(cari.toLowerCase()) ||
            item.keperluan.toLowerCase().includes(cari.toLowerCase()) ||
            item.items.some((it) => it.nama_barang.toLowerCase().includes(cari.toLowerCase()));

        if (tabRiwayat === 'semua') return matchesCari;
        if (tabRiwayat === 'proses') return false;
        if (tabRiwayat === 'aktif') {
            return matchesCari && (item.status === 'sedang_dipinjam' || item.status === 'menunggu_kembali');
        }
        if (tabRiwayat === 'selesai') {
            return matchesCari && item.status === 'selesai';
        }
        if (tabRiwayat === 'ditolak') {
            return matchesCari && item.status === 'ditolak';
        }
        return matchesCari;
    });

    const countAktif = riwayatSelesaiList.filter(
        (r) => r.status === 'sedang_dipinjam' || r.status === 'menunggu_kembali'
    ).length;
    const countSelesai = riwayatSelesaiList.filter((r) => r.status === 'selesai').length;
    const countDitolak = riwayatSelesaiList.filter((r) => r.status === 'ditolak').length;

    return (
        <AdminLayout>
            <Head title={`${isUmum ? 'Layanan Peminjaman Umum' : 'Layanan Peminjaman Mahasiswa'} - Biro Sarpras UNUHA`} />

            <div className="w-full space-y-5 pb-14 font-sans text-slate-800 text-xs">
                {/* Header Banner Modern & Simpel */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#006039] border border-emerald-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                            <Calendar className="w-5 h-5" strokeWidth={1.75} />
                        </div>
                        <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-[#006039] border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
                                {isUmum ? 'PEMINJAMAN (UMUM)' : 'LAYANAN SARPRAS'}
                            </span>
                            <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                                Peminjaman Saya
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {cannotBorrow
                                    ? 'Memantau data riwayat peminjaman fasilitas civitas akademika.'
                                    : 'Pantau pengajuan dan riwayat peminjaman fasilitas Anda.'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 shrink-0 w-full sm:w-auto">
                        {/* Search Bar di Header Atas */}
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute inset-y-0 left-3 my-auto w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                value={cari}
                                onChange={(e) => setCari(e.target.value)}
                                placeholder="Cari kode / sarpras..."
                                className="w-full pl-9 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] outline-hidden transition font-medium"
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

                        {!cannotBorrow && (
                            statusKelayakan && !statusKelayakan.eligible ? (
                                <button
                                    type="button"
                                    onClick={() => alert(statusKelayakan.pesan)}
                                    className="px-4 py-2 bg-slate-200 text-slate-500 rounded-xl font-bold flex items-center justify-center gap-2 text-xs cursor-not-allowed shrink-0"
                                    title={statusKelayakan.pesan}
                                >
                                    <Plus className="w-4 h-4 stroke-[2.5]" />
                                    <span>Ajukan Pinjam</span>
                                </button>
                            ) : (
                                <Link
                                    href="/layanan/sarpras"
                                    className="px-4 py-2 bg-[#006039] hover:bg-[#004e2e] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-2xs transition text-xs cursor-pointer shrink-0"
                                >
                                    <Plus className="w-4 h-4 stroke-[2.5]" />
                                    <span>Ajukan Pinjam</span>
                                </Link>
                            )
                        )}
                    </div>
                </div>

                {/* Alert Tanggungan / Belum Mengembalikan Barang */}
                {statusKelayakan && !statusKelayakan.eligible && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 p-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-amber-900 shadow-2xs animate-in fade-in duration-200">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5 text-amber-700">
                                <AlertCircle className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="font-bold text-xs text-amber-950">
                                    Pengajuan Peminjaman Baru Ditangguhkan
                                </p>
                                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                                    {statusKelayakan.pesan}
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/layanan/pengembalian"
                            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 transition"
                        >
                            {statusKelayakan.alasan === 'tanggungan_denda' ? 'Lihat Denda & Selesaikan' : 'Ke Menu Pengembalian'}
                        </Link>
                    </div>
                )}

                {/* Alerts Flash */}
                {flash?.success && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-[#006039] text-xs font-semibold shadow-xs animate-in fade-in duration-200">
                        <CheckCircle2 className="w-5 h-5 shrink-0 text-[#006039]" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash?.error && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold shadow-xs animate-in fade-in duration-200">
                        <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                        <span>{flash.error}</span>
                    </div>
                )}

                {/* 2. Kartu Ringkasan Interaktif (Sesuai Tampilan di Role Admin) */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
                    {/* Kartu 1: Semua */}
                    <button
                        type="button"
                        onClick={() => setTabRiwayat('semua')}
                        className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                            tabRiwayat === 'semua'
                                ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-400/20 shadow-xs'
                                : 'bg-white border-slate-200/90 shadow-2xs hover:border-blue-300'
                        }`}
                    >
                        <div>
                            <p className="text-[11px] font-semibold text-slate-500">Semua</p>
                            <h3 className="text-2xl font-extrabold text-blue-600 mt-0.5">
                                {riwayatSelesaiList.length + sedangProsesList.length}
                            </h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Layers className="w-5 h-5" strokeWidth={2} />
                        </div>
                    </button>

                    {/* Kartu 2: Perlu Proses */}
                    <button
                        type="button"
                        onClick={() => setTabRiwayat(tabRiwayat === 'proses' ? 'semua' : 'proses')}
                        className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                            tabRiwayat === 'proses'
                                ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
                                : 'bg-white border-slate-200/90 shadow-2xs hover:border-amber-300'
                        }`}
                    >
                        <div>
                            <p className="text-[11px] font-semibold text-slate-500">Perlu Proses</p>
                            <h3 className="text-2xl font-extrabold text-amber-600 mt-0.5">
                                {sedangProsesList.length}
                            </h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Clock className="w-5 h-5" strokeWidth={2} />
                        </div>
                    </button>

                    {/* Kartu 3: Dipinjam */}
                    <button
                        type="button"
                        onClick={() => setTabRiwayat(tabRiwayat === 'aktif' ? 'semua' : 'aktif')}
                        className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                            tabRiwayat === 'aktif'
                                ? 'bg-purple-50/70 border-purple-400 ring-2 ring-purple-400/20 shadow-xs'
                                : 'bg-white border-slate-200/90 shadow-2xs hover:border-purple-300'
                        }`}
                    >
                        <div>
                            <p className="text-[11px] font-semibold text-slate-500">Dipinjam</p>
                            <h3 className="text-2xl font-extrabold text-purple-600 mt-0.5">
                                {countAktif}
                            </h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Package className="w-5 h-5" strokeWidth={2} />
                        </div>
                    </button>

                    {/* Kartu 4: Selesai */}
                    <button
                        type="button"
                        onClick={() => setTabRiwayat(tabRiwayat === 'selesai' ? 'semua' : 'selesai')}
                        className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                            tabRiwayat === 'selesai'
                                ? 'bg-emerald-50/70 border-[#006039] ring-2 ring-[#006039]/20 shadow-xs'
                                : 'bg-white border-slate-200/90 shadow-2xs hover:border-emerald-300'
                        }`}
                    >
                        <div>
                            <p className="text-[11px] font-semibold text-slate-500">Selesai</p>
                            <h3 className="text-2xl font-extrabold text-[#006039] mt-0.5">
                                {countSelesai}
                            </h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#006039] to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <CheckCircle2 className="w-5 h-5" strokeWidth={2} />
                        </div>
                    </button>

                    {/* Kartu 5: Ditolak */}
                    <button
                        type="button"
                        onClick={() => setTabRiwayat(tabRiwayat === 'ditolak' ? 'semua' : 'ditolak')}
                        className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                            tabRiwayat === 'ditolak'
                                ? 'bg-rose-50/70 border-rose-400 ring-2 ring-rose-400/20 shadow-xs'
                                : 'bg-white border-slate-200/90 shadow-2xs hover:border-rose-300'
                        }`}
                    >
                        <div>
                            <p className="text-[11px] font-semibold text-slate-500">Ditolak</p>
                            <h3 className="text-2xl font-extrabold text-rose-600 mt-0.5">
                                {countDitolak}
                            </h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <XCircle className="w-5 h-5" strokeWidth={2} />
                        </div>
                    </button>
                </div>

                {/* ===================================================================== */}
                {/* BAGIAN 1 (ATAS): HANYA MUNCUL JIKA ADA PENGAJUAN YANG SEDANG BERJALAN */}
                {/* ===================================================================== */}
                {(tabRiwayat === 'semua' || tabRiwayat === 'proses') && sedangProsesList.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 px-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            <h2 className="text-sm font-extrabold text-slate-900">
                                Pengajuan Berjalan
                            </h2>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                                {sedangProsesList.length} Diproses
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-3.5">
                            {sedangProsesList.map((p) => {
                                const isStep2Approved = ['disetujui', 'siap_diambil'].includes(p.status);
                                const isStep2Pending = p.status === 'menunggu_validasi';
                                const isStep2Delayed = p.status === 'ditunda';

                                const isStep3WaitingStaff = p.status === 'disetujui';
                                const isStep3Validated = p.status === 'siap_diambil';
                                const isStep4WaitingUpload = p.status === 'siap_diambil';

                                return (
                                    <div
                                        key={p.id}
                                        className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3.5"
                                    >
                                        {/* Header Kartu Progres */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                        <span>Jadwal: <strong>{p.tanggal_mulai}</strong> – <strong>{p.tanggal_kembali_rencana}</strong></span>
                                                    </span>
                                                </div>
                                                <h3 className="font-bold text-slate-900 text-sm mt-1">
                                                    {p.items
                                                        .map((it) => `${it.nama_barang} (${it.qty} ${it.satuan})`)
                                                        .join(', ')}
                                                </h3>
                                            </div>

                                            <div>
                                                {p.status === 'menunggu_validasi' && (
                                                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                                                        <span>Menunggu Approval</span>
                                                    </span>
                                                )}
                                                {p.status === 'ditunda' && (
                                                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1.5">
                                                        <PauseCircle className="w-3.5 h-3.5 text-amber-700" />
                                                        <span>Ditunda</span>
                                                    </span>
                                                )}
                                                {p.status === 'disetujui' && (
                                                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200 inline-flex items-center gap-1.5">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                                                        <span>Pilih Staf</span>
                                                    </span>
                                                )}
                                                {p.status === 'siap_diambil' && (
                                                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 inline-flex items-center gap-1.5">
                                                        <Camera className="w-3.5 h-3.5 text-indigo-600" />
                                                        <span>Upload Bukti</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Stepper 4 Tahap Ringkas & Proporsional */}
                                        <div className="p-3 sm:p-3.5 bg-slate-50/90 border border-slate-200/80 rounded-xl relative overflow-hidden">
                                            <div className="grid grid-cols-4 gap-2 text-center select-none relative z-10">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-7 h-7 rounded-full bg-[#006039] text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                                                        ✓
                                                    </div>
                                                    <span className="text-[11px] font-bold text-[#006039] mt-1.5 truncate max-w-full">
                                                        1. Pengajuan
                                                    </span>
                                                </div>

                                                <div className="flex flex-col items-center">
                                                    <div
                                                        className={`w-7 h-7 rounded-full font-bold flex items-center justify-center text-xs shadow-2xs transition-colors ${
                                                            isStep2Approved
                                                                ? 'bg-[#006039] text-white'
                                                                : isStep2Pending || isStep2Delayed
                                                                ? 'bg-amber-500 text-white ring-2 ring-amber-300'
                                                                : 'bg-slate-200 text-slate-500'
                                                        }`}
                                                    >
                                                        {isStep2Approved ? '✓' : '2'}
                                                    </div>
                                                    <span className={`text-[11px] font-bold mt-1.5 truncate max-w-full ${isStep2Approved ? 'text-[#006039]' : isStep2Pending || isStep2Delayed ? 'text-amber-800' : 'text-slate-500'}`}>
                                                        2. Approval
                                                    </span>
                                                </div>

                                                <div className="flex flex-col items-center">
                                                    <div
                                                        className={`w-7 h-7 rounded-full font-bold flex items-center justify-center text-xs shadow-2xs transition-colors ${
                                                            isStep3Validated
                                                                ? 'bg-[#006039] text-white'
                                                                : isStep3WaitingStaff
                                                                ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                                                                : 'bg-slate-200 text-slate-500'
                                                        }`}
                                                    >
                                                        {isStep3Validated ? '✓' : '3'}
                                                    </div>
                                                    <span className={`text-[11px] font-bold mt-1.5 truncate max-w-full ${isStep3Validated ? 'text-[#006039]' : isStep3WaitingStaff ? 'text-blue-800' : 'text-slate-500'}`}>
                                                        3. Staf
                                                    </span>
                                                </div>

                                                <div className="flex flex-col items-center">
                                                    <div
                                                        className={`w-7 h-7 rounded-full font-bold flex items-center justify-center text-xs shadow-2xs transition-colors ${
                                                            isStep4WaitingUpload
                                                                ? 'bg-indigo-600 text-white ring-2 ring-indigo-300 animate-pulse'
                                                                : 'bg-slate-200 text-slate-500'
                                                        }`}
                                                    >
                                                        4
                                                    </div>
                                                    <span className={`text-[11px] font-bold mt-1.5 truncate max-w-full ${isStep4WaitingUpload ? 'text-indigo-800 font-extrabold' : 'text-slate-500'}`}>
                                                        4. Bukti
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {p.status === 'ditunda' && p.catatan_admin && (
                                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                                                <strong>Catatan:</strong> {p.catatan_admin}
                                            </div>
                                        )}

                                        {p.status === 'disetujui' && (
                                            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 text-xs">
                                                Pengajuan disetujui. Menunggu penentuan staf bertugas.
                                            </div>
                                        )}

                                        {p.status === 'siap_diambil' && (
                                            <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div className="space-y-1 text-xs">
                                                    <div className="font-bold text-indigo-950 flex flex-wrap items-center gap-2">
                                                        <div className="flex items-center gap-1.5">
                                                            <UserCheck className="w-4 h-4 text-indigo-600" />
                                                            <span>
                                                                Staf: {p.petugas_pengambilan || 'Staf Loket'} • Lokasi:{' '}
                                                                {p.lokasi_pengambilan || 'Loket Sarpras'}
                                                            </span>
                                                        </div>
                                                        {p.no_hp_pendamping && (
                                                            <a
                                                                href={`https://wa.me/${p.no_hp_pendamping.replace(/^0/, '62').replace(/[^0-9]/g, '')}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-bold shadow-2xs transition"
                                                            >
                                                                <Phone className="w-2.5 h-2.5" />
                                                                WhatsApp Staf ({p.no_hp_pendamping})
                                                            </a>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-indigo-800">
                                                        Silakan ambil sarpras di loket, lalu upload bukti foto terima barang.
                                                    </p>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedTerimaItem(p);
                                                        setFotoTerima(null);
                                                        setPreviewTerimaUrl(null);
                                                    }}
                                                    className="px-4 py-2 bg-[#006039] hover:bg-[#004e2e] text-white rounded-xl font-bold shadow-2xs transition cursor-pointer text-xs shrink-0 flex items-center justify-center gap-1.5"
                                                >
                                                    <Camera className="w-4 h-4" />
                                                    <span>Upload Bukti</span>
                                                </button>
                                            </div>
                                        )}

                                        {/* Aksi Edit & Batal Sebelum Approval Admin (Step 1 atau Ditunda) */}
                                        {(p.status === 'menunggu_validasi' || p.status === 'ditunda') && (
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 bg-slate-50/70 p-3 rounded-xl border border-slate-200/60">
                                                <div className="space-y-0.5">
                                                    <p className="text-xs font-bold text-slate-800">
                                                        Pengajuan Belum Diverifikasi Admin
                                                    </p>
                                                    <p className="text-[11px] text-slate-500">
                                                        Anda masih dapat mengubah jadwal, menambah fasilitas lain, atau membatalkan pengajuan.
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    <Link
                                                        href={`/layanan/peminjaman/${p.id}/edit`}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-[#006039] rounded-xl font-bold text-xs border border-slate-200 hover:border-emerald-300 transition cursor-pointer shadow-2xs"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5 text-[#006039]" />
                                                        <span>Edit Pengajuan</span>
                                                    </Link>

                                                    <button
                                                        type="button"
                                                        onClick={() => setCancellingItem(p)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold text-xs border border-rose-200 transition cursor-pointer shadow-2xs"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                                        <span>Batalkan</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ===================================================================== */}
                {/* BAGIAN 2: TABEL RIWAYAT PEMINJAMAN (RAPI, PROPORSIONAL & USER-FRIENDLY) */}
                {/* ===================================================================== */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                    {/* Header Toolbar Tabel (Sesuai Desain Admin: Rapi, Menampilkan Filter Aktif & Reset) */}
                    <div className="p-4 sm:px-5 sm:py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#006039] border border-emerald-200/60 flex items-center justify-center shrink-0 shadow-2xs">
                                <ClipboardList className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                                        Daftar Riwayat
                                    </h2>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                        {filteredRiwayatTable.length} data
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-500">
                                    {tabRiwayat === 'semua'
                                        ? 'Menampilkan seluruh transaksi peminjaman fasilitas Anda.'
                                        : tabRiwayat === 'proses'
                                          ? 'Pengajuan yang sedang diproses ditampilkan pada kartu di atas.'
                                          : tabRiwayat === 'aktif'
                                            ? 'Menampilkan fasilitas yang saat ini sedang Anda pinjam.'
                                            : tabRiwayat === 'selesai'
                                              ? 'Menampilkan riwayat peminjaman yang telah selesai.'
                                              : 'Menampilkan pengajuan peminjaman yang ditolak.'}
                                </p>
                            </div>
                        </div>

                        {/* Reset Filter Button jika sedang memfilter */}
                        {(tabRiwayat !== 'semua' || cari) && (
                            <button
                                type="button"
                                onClick={() => {
                                    setTabRiwayat('semua');
                                    setCari('');
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-bold text-[#006039] bg-emerald-50 hover:bg-emerald-100 transition cursor-pointer self-start md:self-auto shadow-2xs"
                            >
                                <span>Reset Filter</span>
                            </button>
                        )}
                    </div>

                    {/* Tabel 6 Kolom Proporsional & Terorganisir */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-50/90 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                                <tr>
                                    <th className="py-3 px-4 w-[130px]">Jadwal</th>
                                    <th className="py-3 px-4 min-w-[180px]">Fasilitas</th>
                                    <th className="py-3 px-4 min-w-[170px]">Keperluan</th>
                                    <th className="py-3 px-4 min-w-[170px]">Petugas &amp; Lokasi</th>
                                    <th className="py-3 px-4 w-[130px]">Status</th>
                                    <th className="py-3 px-4 text-right min-w-[160px]">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredRiwayatTable.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/60 transition align-middle">
                                        {/* Kolom 1: Jadwal (Teks Bersih Tanpa Ikon Kalender) */}
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                            <div className="font-semibold text-slate-800 text-xs">
                                                {item.tanggal_mulai}
                                            </div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">
                                                s.d {item.tanggal_kembali_rencana}
                                            </div>
                                        </td>

                                        {/* Kolom 2: Fasilitas yang Dipinjam */}
                                        <td className="py-3.5 px-4">
                                            <div className="space-y-1">
                                                {item.items.map((it) => (
                                                    <div key={it.id} className="min-w-0">
                                                        <span className="font-bold text-slate-900 text-xs block leading-snug line-clamp-2">
                                                            {it.nama_barang}
                                                        </span>
                                                        <span className="inline-block text-[10px] font-bold text-[#006039] bg-emerald-50 px-1.5 py-0.2 rounded mt-0.5 border border-emerald-200/60">
                                                            {it.qty} {it.satuan}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>

                                        {/* Kolom 3: Keperluan (Kolom Mandiri) */}
                                        <td className="py-3.5 px-4">
                                            <div className="text-xs text-slate-700 leading-relaxed line-clamp-2" title={item.keperluan}>
                                                {item.keperluan || '-'}
                                            </div>
                                        </td>

                                        {/* Kolom 4: Staf Bertugas & Lokasi (Teks Bersih Tanpa Ikon Berulang) */}
                                        <td className="py-3.5 px-4">
                                            <div className="space-y-0.5 text-xs">
                                                <div className="font-bold text-slate-800 truncate" title={item.petugas_pengambilan || 'Petugas Sarpras'}>
                                                    {item.petugas_pengambilan || 'Petugas Sarpras'}
                                                </div>
                                                {item.no_hp_pendamping && (
                                                    <a
                                                        href={`https://wa.me/${item.no_hp_pendamping.replace(/^0/, '62').replace(/[^0-9]/g, '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold block hover:underline"
                                                    >
                                                        WA: {item.no_hp_pendamping}
                                                    </a>
                                                )}
                                                <div className="text-[11px] text-slate-400 truncate" title={item.lokasi_pengambilan || 'Loket Gudang Sarpras'}>
                                                    {item.lokasi_pengambilan || 'Loket Gudang Sarpras'}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Kolom 5: Status */}
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                            {item.status === 'sedang_dipinjam' && (
                                                <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                                                    <span className="inline-block min-w-[56px]">Dipinjam</span>
                                                    {item.foto_bukti_terima && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setLightboxImage({
                                                                    url: item.foto_bukti_terima!,
                                                                    title: `Bukti Serah Terima - ${item.kode}`,
                                                                })
                                                            }
                                                            className="text-slate-400 hover:text-slate-700 transition cursor-pointer p-0.5 rounded"
                                                            title="Lihat bukti serah terima"
                                                            aria-label="Lihat bukti serah terima"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            {item.status === 'menunggu_kembali' && (
                                                <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                                                    <span className="inline-block min-w-[56px]">Cek Fisik</span>
                                                </div>
                                            )}
                                            {item.status === 'selesai' && (
                                                <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                                                    <span className="inline-block min-w-[56px]">Selesai</span>
                                                    {item.foto_bukti_terima && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setLightboxImage({
                                                                    url: item.foto_bukti_terima!,
                                                                    title: `Bukti Serah Terima - ${item.kode}`,
                                                                })
                                                            }
                                                            className="text-slate-400 hover:text-slate-700 transition cursor-pointer p-0.5 rounded"
                                                            title="Lihat bukti serah terima"
                                                            aria-label="Lihat bukti serah terima"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            {item.status === 'ditolak' && (
                                                <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                                                    <span className="inline-block min-w-[56px]">Ditolak</span>
                                                    {item.catatan_admin && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedAlasanItem(item)}
                                                            className="text-slate-400 hover:text-slate-700 transition cursor-pointer p-0.5 rounded"
                                                            title="Lihat alasan penolakan"
                                                            aria-label="Lihat alasan penolakan"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </td>

                                        {/* Kolom 6: Aksi */}
                                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1.5">

                                                {/* Upload Bukti jika belum upload dan sedang dipinjam */}
                                                {!item.foto_bukti_terima && item.status === 'sedang_dipinjam' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedTerimaItem(item);
                                                            setFotoTerima(null);
                                                            setPreviewTerimaUrl(null);
                                                        }}
                                                        className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl font-bold text-[11px] transition cursor-pointer"
                                                        title="Upload bukti serah terima barang"
                                                    >
                                                        <Camera className="w-3.5 h-3.5 text-slate-500" />
                                                        <span>Upload Bukti</span>
                                                    </button>
                                                )}

                                                {/* Kembalikan Barang */}
                                                {item.status === 'sedang_dipinjam' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedKembaliItem(item);
                                                            setFotoBukti(null);
                                                            setPreviewBuktiUrl(null);
                                                            setCatatanKembali('');
                                                        }}
                                                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#006039] hover:bg-[#004e2e] text-white rounded-xl font-bold text-xs shadow-2xs transition cursor-pointer"
                                                    >
                                                        <RotateCcw className="w-3.5 h-3.5" />
                                                        <span>Kembalikan</span>
                                                    </button>
                                                )}

                                                {/* Menunggu Kembali / Cek Fisik */}
                                                {item.status === 'menunggu_kembali' && (
                                                    <Link
                                                        href="/layanan/pengembalian"
                                                        className="inline-flex items-center justify-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl font-bold text-[11px] transition"
                                                    >
                                                        Lihat Cek Fisik
                                                    </Link>
                                                )}

                                                {/* Selesai atau Ditolak -> Ajukan Ulang */}
                                                {(item.status === 'selesai' || item.status === 'ditolak') && (
                                                    statusKelayakan && !statusKelayakan.eligible ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => alert(statusKelayakan.pesan)}
                                                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl font-bold text-xs cursor-not-allowed"
                                                            title={statusKelayakan.pesan}
                                                        >
                                                            <RotateCcw className="w-3.5 h-3.5" />
                                                            <span>Ajukan Ulang</span>
                                                        </button>
                                                    ) : (
                                                        <Link
                                                            href={
                                                                item.items?.[0]?.sarpras_id
                                                                    ? `/layanan/sarpras/ajukan?sarpras_id=${item.items[0].sarpras_id}`
                                                                    : '/layanan/sarpras'
                                                            }
                                                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl font-bold text-xs shadow-2xs transition cursor-pointer"
                                                            title="Ajukan peminjaman fasilitas ini kembali"
                                                        >
                                                            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                                                            <span>Ajukan Ulang</span>
                                                        </Link>
                                                    )
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {filteredRiwayatTable.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-slate-400 space-y-2.5">
                                            <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                                                <Package className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-700">
                                                    Belum Ada Riwayat Peminjaman
                                                </p>
                                                <p className="text-[11px] text-slate-400 mt-0.5">
                                                    Data peminjaman yang sudah selesai divalidasi dan diterima akan tampil pada tabel ini.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* MODAL STEP 4: UPLOAD BUKTI BARANG YANG DITERIMA */}
            {selectedTerimaItem && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100 text-xs">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                    <Camera className="w-4 h-4 text-[#006039]" />
                                    <span>Upload Barang yang Diterima (Step 4)</span>
                                </h3>
                                <p className="text-[11px] text-slate-500 mt-0.5">Pengajuan {selectedTerimaItem.kode}</p>
                            </div>
                            <button onClick={() => setSelectedTerimaItem(null)}>
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>

                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-[11px] leading-relaxed">
                            Unggah foto bukti barang atau fasilitas yang telah Anda terima dari staf bertugas (
                            <strong>{selectedTerimaItem.petugas_pengambilan}</strong>) agar peminjaman dinyatakan{' '}
                            <strong>Sukses (Step 4)</strong>.
                        </div>

                        <form onSubmit={handleSubmitTerimaBarang} className="space-y-4">
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    Foto Barang yang Diterima <span className="text-rose-500">*</span>
                                </label>
                                {previewTerimaUrl ? (
                                    <div className="relative p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                                        <img
                                            src={previewTerimaUrl}
                                            alt="Preview Barang Diterima"
                                            className="w-14 h-14 object-cover rounded-lg border border-slate-200 shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 text-xs truncate">{fotoTerima?.name}</p>
                                            <p className="text-[10px] text-emerald-700 font-semibold">
                                                Foto siap diunggah
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFotoTerima(null);
                                                setPreviewTerimaUrl(null);
                                            }}
                                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-200 hover:border-[#006039] rounded-xl bg-slate-50/70 hover:bg-emerald-50/30 transition cursor-pointer text-center">
                                        <UploadCloud className="w-6 h-6 text-slate-400 mb-1" />
                                        <span className="text-xs font-bold text-slate-700">
                                            Pilih Foto Barang yang Diterima
                                        </span>
                                        <span className="text-[10px] text-slate-400 mt-0.5">
                                            JPG, PNG, atau WebP (Maks 5MB)
                                        </span>
                                        <input
                                            type="file"
                                            required
                                            accept="image/*"
                                            onChange={handleTerimaFileChange}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setSelectedTerimaItem(null)}
                                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingTerima || !fotoTerima}
                                    className="px-4 py-2 bg-[#006039] hover:bg-[#0f4c3a] text-white rounded-xl font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
                                >
                                    {isSubmittingTerima ? 'Mengunggah...' : 'Upload & Selesaikan Step 4 (Sukses)'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL UPLOAD BUKTI PENGEMBALIAN */}
            {selectedKembaliItem && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100 text-xs">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                    <RotateCcw className="w-4 h-4 text-[#006039]" />
                                    <span>Konfirmasi Pengembalian Barang</span>
                                </h3>
                                <p className="text-[11px] text-slate-500 mt-0.5">Pengajuan {selectedKembaliItem.kode}</p>
                            </div>
                            <button onClick={() => setSelectedKembaliItem(null)}>
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitPengembalian} className="space-y-4">
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    Foto Kondisi Fisik Barang Sesudah Dipakai <span className="text-rose-500">*</span>
                                </label>
                                {previewBuktiUrl ? (
                                    <div className="relative p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                                        <img
                                            src={previewBuktiUrl}
                                            alt="Preview Kembali"
                                            className="w-14 h-14 object-cover rounded-lg border border-slate-200 shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 text-xs truncate">{fotoBukti?.name}</p>
                                            <p className="text-[10px] text-emerald-700 font-semibold">Foto siap diunggah</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFotoBukti(null);
                                                setPreviewBuktiUrl(null);
                                            }}
                                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 hover:border-[#006039] rounded-xl bg-slate-50/70 hover:bg-emerald-50/30 transition cursor-pointer text-center">
                                        <UploadCloud className="w-6 h-6 text-slate-400 mb-1" />
                                        <span className="text-xs font-bold text-slate-700">Pilih Foto Kondisi Barang</span>
                                        <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, atau WebP (Maks 5MB)</span>
                                        <input
                                            type="file"
                                            required
                                            accept="image/*"
                                            onChange={handleBuktiChange}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan (Opsional):</label>
                                <textarea
                                    rows={2}
                                    value={catatanKembali}
                                    onChange={(e) => setCatatanKembali(e.target.value)}
                                    placeholder="Contoh: Barang dalam kondisi lengkap dan bersih tanpa kendala..."
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] outline-hidden"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setSelectedKembaliItem(null)}
                                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingKembali || !fotoBukti}
                                    className="px-4 py-2 bg-[#006039] hover:bg-[#0f4c3a] text-white rounded-xl font-bold shadow-xs transition disabled:opacity-50"
                                >
                                    {isSubmittingKembali ? 'Mengunggah...' : 'Kirim Bukti Pengembalian'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* LIGHTBOX FOTO BUKTI TERIMA */}
            {lightboxImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
                    onClick={() => setLightboxImage(null)}
                >
                    <div
                        className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between text-xs font-bold">
                            <span className="truncate pr-4">{lightboxImage.title}</span>
                            <button
                                onClick={() => setLightboxImage(null)}
                                className="p-1 hover:bg-white/20 rounded-lg cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-3 bg-slate-950 flex items-center justify-center max-h-[75vh] overflow-auto">
                            <img
                                src={lightboxImage.url}
                                alt={lightboxImage.title}
                                className="max-w-full max-h-[70vh] object-contain rounded-lg"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL KONFIRMASI PEMBATALAN PEMINJAMAN SEBELUM APPROVAL */}
            {cancellingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                        <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-rose-100" />
                                <h3 className="font-bold text-sm">Konfirmasi Pembatalan Pengajuan</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCancellingItem(null)}
                                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 space-y-3 text-xs text-slate-600">
                            <p>
                                Apakah Anda yakin ingin membatalkan pengajuan peminjaman{' '}
                                <strong className="text-slate-900 font-mono">{cancellingItem.kode}</strong>?
                            </p>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                                <div className="font-bold text-slate-800">Fasilitas yang Diajukan:</div>
                                <div className="text-slate-600">
                                    {cancellingItem.items.map((it) => `${it.nama_barang} (${it.qty} ${it.satuan})`).join(', ')}
                                </div>
                            </div>
                            <p className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                                ✓ Seluruh stok fasilitas yang diajukan akan otomatis dikembalikan ke katalog dan status pengajuan dibatalkan.
                            </p>
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setCancellingItem(null)}
                                disabled={isSubmittingCancel}
                                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold rounded-xl text-xs transition cursor-pointer shadow-2xs"
                            >
                                Tutup
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmCancel}
                                disabled={isSubmittingCancel}
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs transition cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>{isSubmittingCancel ? 'Membatalkan...' : 'Ya, Batalkan Pengajuan'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* MODAL POP-UP DETAIL ALASAN PENOLAKAN */}
            {selectedAlasanItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                        <div className="p-4 bg-white border-b border-slate-200 text-slate-800 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-sm text-slate-900">Alasan Penolakan</h3>
                                <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                                    Jadwal: {selectedAlasanItem.tanggal_mulai} s.d {selectedAlasanItem.tanggal_kembali_rencana}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedAlasanItem(null)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                aria-label="Tutup"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 space-y-3.5 text-xs">
                            {/* Info Fasilitas */}
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                                    Fasilitas yang Diajukan
                                </span>
                                <div className="font-bold text-slate-800">
                                    {selectedAlasanItem.items.map((it) => `${it.nama_barang} (${it.qty} ${it.satuan})`).join(', ')}
                                </div>
                            </div>

                            {/* Box Catatan / Alasan Admin */}
                            <div className="space-y-1.5">
                                <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
                                    Catatan Petugas / Admin
                                </span>
                                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 leading-relaxed font-medium">
                                    "{selectedAlasanItem.catatan_admin || 'Tidak ada catatan spesifik dari admin.'}"
                                </div>
                            </div>

                            <p className="text-[11px] text-slate-500">
                                Anda dapat mengajukan peminjaman kembali dengan memilih jadwal lain atau sarana & prasarana yang tersedia.
                            </p>
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setSelectedAlasanItem(null)}
                                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold rounded-xl text-xs transition cursor-pointer shadow-2xs"
                            >
                                Tutup
                            </button>
                            {statusKelayakan && !statusKelayakan.eligible ? (
                                <button
                                    type="button"
                                    onClick={() => alert(statusKelayakan.pesan)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-200 text-slate-500 font-bold rounded-xl text-xs cursor-not-allowed shadow-2xs"
                                    title={statusKelayakan.pesan}
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Ajukan Ulang Sekarang</span>
                                </button>
                            ) : (
                                <Link
                                    href={
                                        selectedAlasanItem.items?.[0]?.sarpras_id
                                            ? `/layanan/sarpras/ajukan?sarpras_id=${selectedAlasanItem.items[0].sarpras_id}`
                                            : '/layanan/sarpras'
                                    }
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#006039] hover:bg-[#004e2e] text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-2xs"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Ajukan Ulang Sekarang</span>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
