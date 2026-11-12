import React, { useState, useMemo } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    RotateCcw,
    CheckCircle2,
    Clock,
    AlertCircle,
    Calendar,
    MapPin,
    Package,
    Box,
    Eye,
    X,
    ShieldCheck,
    Check,
    UserCheck,
    Camera,
    Info,
    ClipboardList,
    Search,
    CreditCard,
    Layers,
    ClipboardCheck,
    CheckCheck,
    AlertTriangle,
} from 'lucide-react';

interface BorrowedItem {
    id: number;
    sarpras_id?: number;
    nama_barang: string;
    jenis?: string;
    lokasi?: string;
    foto_url?: string | null;
    qty: number;
    satuan: string;
    kondisi_sesudah?: string;
}

interface PinjamanAktif {
    id: number;
    kode: string;
    nama_peminjam: string;
    nim_nip: string;
    instansi_prodi: string;
    keperluan: string;
    status_peminjaman: string;
    tanggal_mulai: string;
    tanggal_kembali_rencana: string;
    petugas_pengambilan?: string | null;
    lokasi_pengambilan?: string | null;
    is_overdue: boolean;
    items: BorrowedItem[];
}

interface MenungguInspeksi {
    id: number;
    kode: string;
    nama_peminjam: string;
    nim_nip: string;
    instansi_prodi: string;
    keperluan: string;
    tanggal_mulai: string;
    tanggal_kembali_rencana: string;
    kode_pengembalian: string;
    tanggal_pengajuan_kembali: string;
    foto_bukti: string | null;
    catatan_mahasiswa: string | null;
    status_verifikasi: string;
    petugas_pengambilan?: string | null;
    lokasi_pengambilan?: string | null;
    items: BorrowedItem[];
}

interface RiwayatSelesai {
    id: number;
    peminjaman_id?: number;
    kode_pengembalian: string;
    kode_peminjaman: string;
    nama_peminjam: string;
    nim_nip: string;
    instansi_prodi: string;
    keperluan?: string;
    tanggal_mulai?: string;
    tanggal_kembali_rencana?: string;
    tanggal_kembali: string;
    tanggal_verifikasi: string;
    foto_bukti: string | null;
    catatan_mahasiswa: string | null;
    status_verifikasi: string;
    biaya_denda: number;
    nomor_rekening?: string | null;
    status_pembayaran_denda?: string | null;
    bukti_bayar_denda?: string | null;
    catatan_bayar_denda?: string | null;
    diverifikasi_denda_pada?: string | null;
    catatan_inspeksi_admin: string | null;
    pemeriksa_nama: string;
    lokasi_pengambilan?: string | null;
    items: BorrowedItem[];
}

interface Props {
    sedangDipinjam: PinjamanAktif[];
    menungguInspeksi: MenungguInspeksi[];
    riwayatSelesai: RiwayatSelesai[];
}

interface UnifiedTableRow {
    rowKey: string;
    kategori: 'aktif' | 'menunggu' | 'selesai';
    peminjamanId: number;
    pengembalianId?: number;
    kodePeminjaman: string;
    kodePengembalian?: string | null;
    tanggalMulai: string;
    tanggalKembaliRencana: string;
    tanggalPengajuanKembali?: string | null;
    tanggalVerifikasi?: string | null;
    keperluan: string;
    petugasNama: string;
    lokasiLoket: string;
    fotoBukti: string | null;
    catatanMahasiswa?: string | null;
    catatanInspeksiAdmin?: string | null;
    statusVerifikasi?: string;
    biayaDenda: number;
    nomorRekening?: string | null;
    statusPembayaranDenda?: string | null;
    buktiBayarDenda?: string | null;
    catatanBayarDenda?: string | null;
    diverifikasiDendaPada?: string | null;
    isOverdue: boolean;
    items: BorrowedItem[];
    rawAktif?: PinjamanAktif;
}

export default function PengembalianMahasiswaIndex({
    sedangDipinjam = [],
    menungguInspeksi = [],
    riwayatSelesai = [],
}: Props) {
    const { auth, flash } = usePage().props as any;
    const isUmum = !auth?.user?.nomor_induk || (auth?.user?.role as string) === 'umum';
    const [cari, setCari] = useState('');
    const [tabFilter, setTabFilter] = useState<'semua' | 'menunggu' | 'selesai' | 'verifikasi_denda' | 'aktif_pinjam'>('semua');

    // Modal Konfirmasi Pengembalian
    const [selectedItem, setSelectedItem] = useState<PinjamanAktif | null>(null);
    const [fotoBukti, setFotoBukti] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [catatan, setCatatan] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Modal Bayar Denda
    const [bayarDendaItem, setBayarDendaItem] = useState<UnifiedTableRow | null>(null);
    const [buktiBayarDendaFile, setBuktiBayarDendaFile] = useState<File | null>(null);
    const [previewDendaUrl, setPreviewDendaUrl] = useState<string | null>(null);
    const [catatanBayarDendaInput, setCatatanBayarDendaInput] = useState('');
    const [isSubmittingDenda, setIsSubmittingDenda] = useState(false);
    const [errorDendaMessage, setErrorDendaMessage] = useState<string | null>(null);

    // Lightbox Foto Preview
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [lightboxTitle, setLightboxTitle] = useState<string>('Bukti Foto Fisik');

    // Modal Detail Pemeriksaan & Pengembalian
    const [selectedDetailRow, setSelectedDetailRow] = useState<UnifiedTableRow | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setFotoBukti(file);
        setErrorMessage(null);
        if (file && file.type.startsWith('image/')) {
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            setPreviewUrl(null);
        }
    };

    const handleDendaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setBuktiBayarDendaFile(file);
        setErrorDendaMessage(null);
        if (file && file.type.startsWith('image/')) {
            setPreviewDendaUrl(URL.createObjectURL(file));
        } else {
            setPreviewDendaUrl(null);
        }
    };

    const handleOpenModal = (item: PinjamanAktif) => {
        setSelectedItem(item);
        setFotoBukti(null);
        setPreviewUrl(null);
        setCatatan('');
        setErrorMessage(null);
    };

    const handleOpenBayarDenda = (row: UnifiedTableRow) => {
        setBayarDendaItem(row);
        setBuktiBayarDendaFile(null);
        setPreviewDendaUrl(null);
        setCatatanBayarDendaInput('');
        setErrorDendaMessage(null);
    };

    const handleSubmitBayarDenda = (e: React.FormEvent) => {
        e.preventDefault();
        if (!bayarDendaItem || !bayarDendaItem.pengembalianId) return;

        if (!buktiBayarDendaFile) {
            setErrorDendaMessage('Foto bukti transfer pembayaran denda wajib diunggah.');
            return;
        }

        setIsSubmittingDenda(true);
        const formData = new FormData();
        formData.append('bukti_bayar_denda', buktiBayarDendaFile);
        if (catatanBayarDendaInput.trim()) {
            formData.append('catatan_bayar_denda', catatanBayarDendaInput.trim());
        }

        router.post(`/layanan/pengembalian/${bayarDendaItem.pengembalianId}/bayar-denda`, formData as any, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setBayarDendaItem(null);
                setBuktiBayarDendaFile(null);
                setPreviewDendaUrl(null);
                setCatatanBayarDendaInput('');
            },
            onError: (errs) => {
                const firstErr = Object.values(errs)[0] as string;
                setErrorDendaMessage(firstErr || 'Gagal mengunggah bukti denda.');
            },
            onFinish: () => {
                setIsSubmittingDenda(false);
            },
        });
    };

    const handleSubmitReturn = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem) return;

        if (!fotoBukti) {
            setErrorMessage('Foto bukti fisik kondisi barang wajib diunggah.');
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('foto_bukti', fotoBukti);
        if (catatan.trim()) {
            formData.append('catatan', catatan.trim());
        }

        router.post(`/layanan/pengembalian/${selectedItem.id}`, formData as any, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setSelectedItem(null);
                setFotoBukti(null);
                setPreviewUrl(null);
                setCatatan('');
            },
            onError: (errs) => {
                const firstErr = Object.values(errs)[0] as string;
                setErrorMessage(firstErr || 'Terjadi kesalahan saat mengunggah bukti.');
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    // Gabungkan data menjadi baris tabel terpadu seperti pada halaman Layanan Peminjaman
    const allRows: UnifiedTableRow[] = useMemo(() => {
        const aktifRows: UnifiedTableRow[] = sedangDipinjam.map((p) => ({
            rowKey: `aktif-${p.id}`,
            kategori: 'aktif',
            peminjamanId: p.id,
            kodePeminjaman: p.kode,
            kodePengembalian: null,
            tanggalMulai: p.tanggal_mulai,
            tanggalKembaliRencana: p.tanggal_kembali_rencana,
            keperluan: p.keperluan,
            petugasNama: p.petugas_pengambilan || 'Staf Loket Sarpras',
            lokasiLoket: p.lokasi_pengambilan || 'Loket Gudang Biro Sarpras Kampus Sukaraja',
            fotoBukti: null,
            biayaDenda: 0,
            isOverdue: p.is_overdue,
            items: p.items,
            rawAktif: p,
        }));

        const menungguRows: UnifiedTableRow[] = menungguInspeksi.map((m) => ({
            rowKey: `menunggu-${m.id}`,
            kategori: 'menunggu',
            peminjamanId: m.id,
            kodePeminjaman: m.kode,
            kodePengembalian: m.kode_pengembalian,
            tanggalMulai: m.tanggal_mulai,
            tanggalKembaliRencana: m.tanggal_kembali_rencana,
            tanggalPengajuanKembali: m.tanggal_pengajuan_kembali,
            keperluan: m.keperluan,
            petugasNama: m.petugas_pengambilan || 'Menunggu Pemeriksa Loket',
            lokasiLoket: m.lokasi_pengambilan || 'Loket Gudang Biro Sarpras Kampus Sukaraja',
            fotoBukti: m.foto_bukti,
            catatanMahasiswa: m.catatan_mahasiswa,
            statusVerifikasi: m.status_verifikasi,
            biayaDenda: 0,
            isOverdue: false,
            items: m.items,
        }));

        const selesaiRows: UnifiedTableRow[] = riwayatSelesai.map((s) => ({
            rowKey: `selesai-${s.id}`,
            kategori: 'selesai',
            peminjamanId: s.peminjaman_id || s.id,
            kodePeminjaman: s.kode_peminjaman,
            kodePengembalian: s.kode_pengembalian,
            tanggalMulai: s.tanggal_mulai || '-',
            tanggalKembaliRencana: s.tanggal_kembali_rencana || s.tanggal_kembali || '-',
            tanggalPengajuanKembali: s.tanggal_kembali,
            tanggalVerifikasi: s.tanggal_verifikasi,
            keperluan: s.keperluan || '-',
            petugasNama: s.pemeriksa_nama || 'Staf Sarpras',
            lokasiLoket: s.lokasi_pengambilan || 'Loket Gudang Biro Sarpras Kampus Sukaraja',
            fotoBukti: s.foto_bukti,
            catatanMahasiswa: s.catatan_mahasiswa,
            catatanInspeksiAdmin: s.catatan_inspeksi_admin,
            statusVerifikasi: s.status_verifikasi,
            biayaDenda: s.biaya_denda,
            pengembalianId: s.id,
            nomorRekening: s.nomor_rekening,
            statusPembayaranDenda: s.status_pembayaran_denda,
            buktiBayarDenda: s.bukti_bayar_denda,
            catatanBayarDenda: s.catatan_bayar_denda,
            diverifikasiDendaPada: s.diverifikasi_denda_pada,
            isOverdue: false,
            items: s.items,
        }));

        return [...aktifRows, ...menungguRows, ...selesaiRows];
    }, [sedangDipinjam, menungguInspeksi, riwayatSelesai]);

    const countDenda = useMemo(() => allRows.filter((r) => r.biayaDenda > 0).length, [allRows]);

    const filteredRows = useMemo(() => {
        return allRows.filter((row) => {
            let matchTab = true;
            if (tabFilter === 'semua') {
                matchTab = true;
            } else if (tabFilter === 'menunggu') {
                matchTab = row.kategori === 'menunggu';
            } else if (tabFilter === 'selesai') {
                matchTab = row.kategori === 'selesai';
            } else if (tabFilter === 'verifikasi_denda') {
                matchTab = row.biayaDenda > 0;
            } else if (tabFilter === 'aktif_pinjam') {
                matchTab = row.kategori === 'aktif';
            }

            const q = cari.trim().toLowerCase();
            const matchCari =
                !q ||
                row.kodePeminjaman.toLowerCase().includes(q) ||
                (row.kodePengembalian && row.kodePengembalian.toLowerCase().includes(q)) ||
                row.keperluan.toLowerCase().includes(q) ||
                row.items.some((it) => it.nama_barang.toLowerCase().includes(q));
            return matchTab && matchCari;
        });
    }, [allRows, tabFilter, cari]);

    return (
        <AdminLayout>
            <Head
                title={`${
                    isUmum ? 'Pengembalian Sarpras (Layanan Umum)' : 'Pengembalian Sarana & Prasarana'
                } - Biro Sarpras UNUHA`}
            />

            <div className="max-w-7xl mx-auto space-y-6 pb-20 px-3 sm:px-6 font-sans text-slate-800 text-xs">
                {/* Header Banner Modern */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
                    <div className="flex items-center gap-3.5 relative z-10">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#006039] border border-emerald-200/80 flex items-center justify-center shrink-0">
                            <RotateCcw className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-[#006039] px-2.5 py-0.5 rounded-full">
                                {isUmum
                                    ? 'PENGEMBALIAN SARPRAS (UMUM)'
                                    : 'PENGEMBALIAN SARPRAS'}
                            </span>
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                                Pengembalian Fasilitas
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {isUmum
                                    ? 'Unggah foto bukti pengembalian dan pantau riwayat cek fisik fasilitas.'
                                    : 'Unggah foto bukti pengembalian dan pantau riwayat cek fisik fasilitas.'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 relative z-10 shrink-0 w-full sm:w-auto">
                        {/* Search Bar di Header Atas */}
                        <div className="relative w-full sm:w-72">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 my-auto inset-y-0 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Cari kode, fasilitas, keperluan..."
                                value={cari}
                                onChange={(e) => setCari(e.target.value)}
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

                        <Link
                            href="/layanan/sarpras"
                            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl font-bold flex items-center justify-center gap-2 transition text-xs cursor-pointer shadow-2xs shrink-0 self-start sm:self-auto"
                        >
                            <Box className="w-4 h-4 text-[#006039]" />
                            <span>Sarana &amp; Prasarana</span>
                        </Link>
                    </div>
                </div>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-[#006039] text-xs font-semibold shadow-xs">
                        <CheckCircle2 className="w-5 h-5 shrink-0 text-[#006039]" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash?.error && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold shadow-xs">
                        <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                        <span>{flash.error}</span>
                    </div>
                )}

                {/* 2. Kartu Ringkasan Metrik KPI (Sesuai Tampilan di Role Admin) */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
                    {/* Kartu 1: Semua Data */}
                    <button
                        type="button"
                        onClick={() => setTabFilter('semua')}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                            tabFilter === 'semua'
                                ? 'bg-cyan-50/60 border-cyan-500 ring-2 ring-cyan-500/20 shadow-xs'
                                : 'bg-white border-slate-200/90 shadow-2xs hover:border-cyan-300'
                        }`}
                    >
                        <div className="w-10 h-10 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-[11px] font-semibold text-slate-700 block truncate">Semua Data:</span>
                            <span className="text-2xl font-black text-slate-900 leading-tight">{allRows.length}</span>
                        </div>
                    </button>

                    {/* Kartu 2: Cek Fisik */}
                    <button
                        type="button"
                        onClick={() => setTabFilter(tabFilter === 'menunggu' ? 'semua' : 'menunggu')}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                            tabFilter === 'menunggu'
                                ? 'bg-amber-50/60 border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
                                : 'bg-white border-slate-200/90 shadow-2xs hover:border-amber-300'
                        }`}
                    >
                        <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                            <ClipboardCheck className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-[11px] font-semibold text-slate-700 block truncate">Cek Fisik:</span>
                            <span className="text-2xl font-black text-slate-900 leading-tight">{menungguInspeksi.length}</span>
                        </div>
                    </button>

                    {/* Kartu 3: Selesai */}
                    <button
                        type="button"
                        onClick={() => setTabFilter(tabFilter === 'selesai' ? 'semua' : 'selesai')}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                            tabFilter === 'selesai'
                                ? 'bg-emerald-50/60 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                                : 'bg-white border-slate-200/90 shadow-2xs hover:border-emerald-300'
                        }`}
                    >
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <CheckCheck className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-[11px] font-semibold text-slate-700 block truncate">Selesai:</span>
                            <span className="text-2xl font-black text-slate-900 leading-tight">{riwayatSelesai.length}</span>
                        </div>
                    </button>

                    {/* Kartu 4: Verifikasi Denda */}
                    <button
                        type="button"
                        onClick={() => setTabFilter(tabFilter === 'verifikasi_denda' ? 'semua' : 'verifikasi_denda')}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                            tabFilter === 'verifikasi_denda'
                                ? 'bg-rose-50/60 border-rose-400 ring-2 ring-rose-400/20 shadow-xs'
                                : 'bg-white border-slate-200/90 shadow-2xs hover:border-rose-300'
                        }`}
                    >
                        <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-[11px] font-semibold text-slate-700 block truncate">Verifikasi Denda:</span>
                            <span className="text-2xl font-black text-slate-900 leading-tight">
                                {countDenda}
                            </span>
                        </div>
                    </button>

                    {/* Kartu 5: Sedang Dipinjam */}
                    <button
                        type="button"
                        onClick={() => setTabFilter(tabFilter === 'aktif_pinjam' ? 'semua' : 'aktif_pinjam')}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                            tabFilter === 'aktif_pinjam'
                                ? 'bg-purple-50/60 border-purple-400 ring-2 ring-purple-400/20 shadow-xs'
                                : 'bg-white border-slate-200/90 shadow-2xs hover:border-purple-300'
                        }`}
                    >
                        <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-[11px] font-semibold text-slate-700 block truncate">Sedang Dipinjam:</span>
                            <span className="text-2xl font-black text-slate-900 leading-tight">{sedangDipinjam.length}</span>
                        </div>
                    </button>
                </div>

                {/* ==================================================================================== */}
                {/* BAGIAN 1: PROGRES CEK FISIK SEDANG BERJALAN (Hanya Muncul Bila Ada yang Menunggu)   */}
                {/* ==================================================================================== */}
                {(tabFilter === 'semua' || tabFilter === 'menunggu') && menungguInspeksi.length > 0 && (
                    <div className="space-y-3.5">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
                                <h2 className="font-bold text-slate-900 text-sm">
                                    Progres Cek Fisik Sedang Berjalan di Loket
                                </h2>
                                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[10px]">
                                    {menungguInspeksi.length} Menunggu Verifikasi
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {menungguInspeksi.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-white rounded-2xl border border-indigo-200/90 shadow-xs p-5 space-y-4"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                                        <div className="space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-mono font-extrabold text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-lg">
                                                    {item.kode_pengembalian || item.kode}
                                                </span>
                                                <span className="text-[11px] text-slate-500">
                                                    Kode Pinjam: <strong className="text-slate-700">{item.kode}</strong>
                                                </span>
                                                <span className="text-slate-300">•</span>
                                                <span className="text-[11px] text-slate-500">
                                                    Diunggah: <strong>{item.tanggal_pengajuan_kembali}</strong>
                                                </span>
                                            </div>
                                            <div className="text-xs text-slate-700">
                                                Fasilitas:{' '}
                                                <strong className="text-slate-900 font-bold">
                                                    {item.items
                                                        .map((it) => `${it.nama_barang} (${it.qty} ${it.satuan})`)
                                                        .join(', ')}
                                                </strong>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-start sm:self-auto">
                                            {item.foto_bukti && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setLightboxUrl(item.foto_bukti);
                                                        setLightboxTitle(
                                                            `Bukti Foto Pengembalian ${item.kode_pengembalian}`
                                                        );
                                                    }}
                                                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    <span>Lihat Foto Bukti</span>
                                                </button>
                                            )}
                                            <span className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>Menunggu Cek Fisik Loket</span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* 4-Step Alur Pengembalian */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                        <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-[#006039]">
                                                    Step 1: Foto Bukti
                                                </span>
                                                <CheckCircle2 className="w-3.5 h-3.5 text-[#006039]" />
                                            </div>
                                            <p className="text-[10px] text-slate-500 truncate">
                                                {item.tanggal_pengajuan_kembali}
                                            </p>
                                        </div>

                                        <div className="p-3 bg-indigo-50/80 rounded-xl border-2 border-indigo-500 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-indigo-900">
                                                    Step 2: Serah Fisik
                                                </span>
                                                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                                            </div>
                                            <p className="text-[10px] text-indigo-700 font-semibold truncate">
                                                Serahkan di Loket Sarpras
                                            </p>
                                        </div>

                                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 opacity-75">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-slate-500">
                                                    Step 3: Cek Fisik Staf
                                                </span>
                                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                            </div>
                                            <p className="text-[10px] text-slate-400 truncate">Inspeksi kelengkapan</p>
                                        </div>

                                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 opacity-75">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-slate-500">
                                                    Step 4: Selesai
                                                </span>
                                                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                                            </div>
                                            <p className="text-[10px] text-slate-400 truncate">Restock katalog</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ==================================================================================== */}
                {/* BAGIAN 2: TABEL PENGEMBALIAN & RIWAYAT CEK FISIK (5 KOLOM PROPORSIONAL & RAPI)       */}
                {/* ==================================================================================== */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                    {/* Header Toolbar Tabel (Sesuai Desain Admin: Rapi, Menampilkan Filter Aktif & Reset) */}
                    <div className="p-5 sm:px-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-[#006039] flex items-center justify-center shrink-0">
                                <ClipboardList className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="font-bold text-slate-900 text-base">
                                        Riwayat Pengembalian
                                    </h2>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                        {filteredRows.length} data
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {tabFilter === 'semua'
                                        ? 'Pantau seluruh pengembalian fasilitas dan status verifikasi fisik.'
                                        : tabFilter === 'aktif_pinjam'
                                          ? 'Daftar fasilitas yang saat ini masih Anda pinjam dan perlu dikembalikan.'
                                          : tabFilter === 'menunggu'
                                            ? 'Pengembalian yang sedang menunggu pemeriksaan fisik staf loket.'
                                            : tabFilter === 'verifikasi_denda'
                                              ? 'Daftar pengembalian dengan catatan denda kerusakan atau keterlambatan.'
                                              : 'Daftar riwayat pengembalian fasilitas yang telah tuntas.'}
                                </p>
                            </div>
                        </div>

                        {/* Reset Filter Button jika sedang memfilter */}
                        {(tabFilter !== 'semua' || cari) && (
                            <button
                                type="button"
                                onClick={() => {
                                    setTabFilter('semua');
                                    setCari('');
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-bold text-[#006039] bg-emerald-50 hover:bg-emerald-100 transition cursor-pointer self-start sm:self-auto shadow-2xs"
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
                                    <th className="py-3 px-4 min-w-[160px]">Keperluan</th>
                                    <th className="py-3 px-4 min-w-[170px]">Petugas &amp; Lokasi</th>
                                    <th className="py-3 px-4 w-[140px]">Status</th>
                                    <th className="py-3 px-4 text-right min-w-[150px]">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredRows.map((row) => (
                                    <tr key={row.rowKey} className="hover:bg-slate-50/60 transition align-middle">
                                        {/* Kolom 1: Jadwal */}
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                            <div className="font-semibold text-slate-800 text-xs">
                                                {row.tanggalMulai}
                                            </div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">
                                                s.d {row.tanggalKembaliRencana}
                                            </div>
                                        </td>

                                        {/* Kolom 2: Fasilitas */}
                                        <td className="py-3.5 px-4">
                                            <div className="space-y-1">
                                                {row.items.map((it) => (
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

                                        {/* Kolom 3: Keperluan */}
                                        <td className="py-3.5 px-4">
                                            <div className="text-xs text-slate-700 leading-relaxed line-clamp-2" title={row.keperluan}>
                                                {row.keperluan && row.keperluan !== '-' ? row.keperluan : '-'}
                                            </div>
                                        </td>

                                        {/* Kolom 4: Petugas & Lokasi */}
                                        <td className="py-3.5 px-4">
                                            <div className="space-y-0.5 text-xs">
                                                <div className="font-bold text-slate-800 truncate" title={row.petugasNama}>
                                                    {row.petugasNama}
                                                </div>
                                                <div className="text-[11px] text-slate-400 truncate" title={row.lokasiLoket}>
                                                    {row.lokasiLoket}
                                                </div>
                                                {row.biayaDenda > 0 && (
                                                    <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-1.5 flex-wrap">
                                                        <span>Denda: Rp {row.biayaDenda.toLocaleString('id-ID')}</span>
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                                            row.statusPembayaranDenda === 'lunas'
                                                                ? 'bg-slate-100 text-slate-700'
                                                                : 'bg-rose-50 text-rose-700'
                                                        }`}>
                                                            {row.statusPembayaranDenda === 'lunas' ? 'Lunas' : 'Belum Lunas'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Kolom 5: Status */}
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                            {row.kategori === 'aktif' && (
                                                <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                                                    <span className="inline-block min-w-[60px]">{row.isOverdue ? 'Jatuh Tempo' : 'Dipinjam'}</span>
                                                </div>
                                            )}
                                            {row.kategori === 'menunggu' && (
                                                <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                                                    <span className="inline-block min-w-[60px]">Cek Fisik</span>
                                                    {row.fotoBukti && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setLightboxUrl(row.fotoBukti);
                                                                setLightboxTitle(`Bukti Foto Pengembalian - ${row.kodePengembalian || row.kodePeminjaman}`);
                                                            }}
                                                            className="text-slate-400 hover:text-slate-700 transition cursor-pointer p-0.5 rounded"
                                                            title="Lihat foto bukti pengembalian"
                                                            aria-label="Lihat foto bukti"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            {row.kategori === 'selesai' && (
                                                <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                                                    <span className="inline-block min-w-[60px]">
                                                        {row.statusVerifikasi === 'ada_kerusakan_hilang' ? 'Ada Kerusakan' : 'Selesai'}
                                                    </span>
                                                    {/* Cukup 1 ikon saja untuk melihat detail pemeriksaan & bukti */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedDetailRow(row)}
                                                        className="text-slate-400 hover:text-slate-700 transition cursor-pointer p-0.5 rounded"
                                                        title="Lihat detail pemeriksaan & bukti"
                                                        aria-label="Lihat detail pemeriksaan"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>

                                        {/* Kolom 6: Aksi */}
                                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {row.kategori === 'aktif' && row.rawAktif ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenModal(row.rawAktif!)}
                                                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#006039] hover:bg-[#004e2e] text-white rounded-xl font-bold text-xs shadow-2xs transition cursor-pointer"
                                                    >
                                                        <RotateCcw className="w-3.5 h-3.5" />
                                                        <span>Kembalikan</span>
                                                    </button>
                                                ) : row.kategori === 'menunggu' ? (
                                                    <span className="text-xs text-slate-500 font-medium">
                                                        Cek di Loket
                                                    </span>
                                                ) : row.biayaDenda > 0 && row.statusPembayaranDenda !== 'lunas' ? (
                                                    row.statusPembayaranDenda === 'menunggu_verifikasi_admin' ? (
                                                        <span className="text-xs text-slate-500 font-medium">
                                                            Verifikasi Admin
                                                        </span>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenBayarDenda(row)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl font-bold text-xs shadow-2xs transition cursor-pointer"
                                                        >
                                                            <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                                                            <span>Bayar Denda</span>
                                                        </button>
                                                    )
                                                ) : (
                                                    <Link
                                                        href={
                                                            row.items?.[0]?.sarpras_id
                                                                ? `/layanan/sarpras/ajukan?sarpras_id=${row.items[0].sarpras_id}`
                                                                : '/layanan/sarpras'
                                                        }
                                                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl font-bold text-xs shadow-2xs transition cursor-pointer"
                                                        title="Ajukan peminjaman fasilitas ini kembali"
                                                    >
                                                        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                                                        <span>Ajukan Ulang</span>
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {filteredRows.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-slate-400 space-y-2.5">
                                            <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                                                <Package className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-700">
                                                    Tidak Ada Data Pengembalian
                                                </p>
                                                <p className="text-[11px] text-slate-400 mt-0.5">
                                                    Seluruh fasilitas yang perlu dikembalikan maupun riwayat pengembalian yang sudah selesai akan tercatat pada tabel ini.
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

            {/* MODAL FORMULIR UNGGAH BUKTI FOTO & PENGEMBALIAN */}
            {selectedItem && (
                <div
                    className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
                    onClick={() => setSelectedItem(null)}
                >
                    <form
                        onSubmit={handleSubmitReturn}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 text-xs flex flex-col max-h-[88vh] overflow-hidden"
                    >
                        {/* Header Tetap */}
                        <div className="px-5 py-3.5 bg-[#006039] text-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2.5">
                                <RotateCcw className="w-4 h-4 text-emerald-200 shrink-0" />
                                <div>
                                    <h3 className="font-bold text-sm leading-tight">
                                        Formulir Pengembalian Sarpras
                                    </h3>
                                    <p className="text-[11px] text-emerald-100 mt-0.5">
                                        Kode Pinjam: <strong>{selectedItem.kode}</strong>
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedItem(null)}
                                className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Body Scrollable & Ringkas */}
                        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto">
                            {errorMessage && (
                                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            {/* Rincian Nama Fasilitas yang Dikembalikan */}
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        Fasilitas Dikembalikan
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-medium">
                                        {selectedItem.nama_peminjam}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    {selectedItem.items.map((it) => (
                                        <div
                                            key={it.id}
                                            className="font-bold text-slate-900 text-xs flex justify-between items-center bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/70"
                                        >
                                            <div className="flex items-center gap-1.5 truncate">
                                                <Package className="w-3.5 h-3.5 text-[#006039] shrink-0" />
                                                <span className="truncate">{it.nama_barang}</span>
                                            </div>
                                            <span className="text-[#006039] bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-extrabold shrink-0 ml-2">
                                                {it.qty} {it.satuan}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Unggah Bukti Foto Fisik */}
                            <div className="space-y-1">
                                <label className="block font-bold text-slate-700">
                                    Foto Bukti Kondisi Fisik Barang <span className="text-rose-500">*</span>
                                </label>
                                {previewUrl ? (
                                    <div className="p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl flex items-center gap-3">
                                        <img
                                            src={previewUrl}
                                            alt="Preview Bukti Foto"
                                            className="w-14 h-14 object-cover rounded-lg border border-slate-200 shrink-0 shadow-2xs"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 text-xs truncate">
                                                {fotoBukti?.name || 'Foto dipilih'}
                                            </p>
                                            <p className="text-[10px] text-[#006039] font-semibold mt-0.5 flex items-center gap-1">
                                                <Check className="w-3 h-3" />
                                                <span>Siap diunggah</span>
                                            </p>
                                        </div>
                                        <label className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-bold text-[11px] cursor-pointer transition shrink-0">
                                            Ganti
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center py-4 px-3 border-2 border-dashed border-slate-300 hover:border-[#006039] rounded-xl bg-slate-50/70 hover:bg-emerald-50/20 transition cursor-pointer text-center">
                                        <Camera className="w-6 h-6 text-[#006039] mb-1" />
                                        <p className="font-bold text-slate-800 text-xs">
                                            Pilih Foto Kondisi Barang / Ruangan
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                            JPG, PNG, WEBP (Maks. 5MB)
                                        </p>
                                        <input
                                            type="file"
                                            required
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>

                            {/* Catatan Mahasiswa */}
                            <div className="space-y-1">
                                <label className="block font-bold text-slate-700">
                                    Catatan Kondisi / Kelengkapan (Opsional)
                                </label>
                                <textarea
                                    rows={2}
                                    value={catatan}
                                    onChange={(e) => setCatatan(e.target.value)}
                                    placeholder="Contoh: Barang kembali lengkap dan berfungsi baik."
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] outline-hidden resize-none"
                                />
                            </div>
                        </div>

                        {/* Footer Tetap */}
                        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={() => setSelectedItem(null)}
                                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 font-bold transition cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-4 py-2 rounded-xl bg-[#006039] hover:bg-[#0f4c3a] text-white font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>{isSubmitting ? 'Mengunggah...' : 'Ajukan Pengembalian'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* MODAL FORMULIR UNGGAH BUKTI PEMBAYARAN DENDA */}
            {bayarDendaItem && (
                <div
                    className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
                    onClick={() => setBayarDendaItem(null)}
                >
                    <form
                        onSubmit={handleSubmitBayarDenda}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 text-xs flex flex-col max-h-[88vh] overflow-hidden"
                    >
                        {/* Header Tetap */}
                        <div className="p-4 bg-white border-b border-slate-200 text-slate-800 flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="font-bold text-sm text-slate-900 leading-tight">
                                    Pembayaran Denda Kerusakan
                                </h3>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    Kode Pinjam: <strong>{bayarDendaItem.kodePeminjaman}</strong>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setBayarDendaItem(null)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                                aria-label="Tutup"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Body Scrollable */}
                        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto">
                            {errorDendaMessage && (
                                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 font-semibold">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{errorDendaMessage}</span>
                                </div>
                            )}

                            <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-rose-900">Total Nominal Denda:</span>
                                    <span className="text-base font-extrabold text-rose-700">
                                        Rp {bayarDendaItem.biayaDenda.toLocaleString('id-ID')}
                                    </span>
                                </div>
                                <div className="pt-2 border-t border-rose-200/80">
                                    <span className="text-[10px] text-slate-500 block">Transfer ke Rekening Resmi:</span>
                                    <p className="font-bold text-slate-900 bg-white p-2 rounded-lg border border-rose-200 mt-1 text-[11px]">
                                        {bayarDendaItem.nomorRekening || 'BSI (Bank Syariah Indonesia) No. Rek: 7182938475 a.n. Biro Sarpras Universitas Nurul Huda'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block font-bold text-slate-700">
                                    Unggah Foto Struk / Bukti Transfer Bank <span className="text-rose-500">*</span>
                                </label>
                                {previewDendaUrl ? (
                                    <div className="p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl flex items-center gap-3">
                                        <img
                                            src={previewDendaUrl}
                                            alt="Preview Bukti Transfer"
                                            className="w-14 h-14 object-cover rounded-lg border border-slate-200 shrink-0 shadow-2xs"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 text-xs truncate">
                                                {buktiBayarDendaFile?.name || 'Bukti transfer dipilih'}
                                            </p>
                                            <p className="text-[10px] text-[#006039] font-semibold mt-0.5 flex items-center gap-1">
                                                <Check className="w-3 h-3" />
                                                <span>Siap dikirim</span>
                                            </p>
                                        </div>
                                        <label className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-bold text-[11px] cursor-pointer transition shrink-0">
                                            Ganti
                                            <input
                                                type="file"
                                                accept="image/*,application/pdf"
                                                onChange={handleDendaFileChange}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center py-4 px-3 border-2 border-dashed border-slate-300 hover:border-[#006039] rounded-xl bg-slate-50/60 hover:bg-emerald-50/20 transition cursor-pointer text-center">
                                        <Camera className="w-6 h-6 text-slate-400 mb-1" />
                                        <p className="font-bold text-slate-700 text-xs">Pilih Foto Struk / Bukti Transfer</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">Format: JPG, PNG, WEBP, PDF (Maks. 5MB)</p>
                                        <input
                                            type="file"
                                            accept="image/*,application/pdf"
                                            onChange={handleDendaFileChange}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>

                            <div className="space-y-1">
                                <label className="block font-bold text-slate-700">
                                    Catatan Pengirim Transfer (Nama Pemilik Rekening / Bank)
                                </label>
                                <input
                                    type="text"
                                    value={catatanBayarDendaInput}
                                    onChange={(e) => setCatatanBayarDendaInput(e.target.value)}
                                    placeholder="Contoh: Transfer dari BCA a.n. Dita Ramdani"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] outline-hidden"
                                />
                            </div>
                        </div>

                        {/* Footer Tetap */}
                        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={() => setBayarDendaItem(null)}
                                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 font-bold transition cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmittingDenda}
                                className="px-4 py-2 rounded-xl bg-[#006039] hover:bg-[#0f4c3a] text-white font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                            >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{isSubmittingDenda ? 'Mengirim...' : 'Kirim Bukti Pembayaran'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* MODAL POP-UP DETAIL PEMERIKSAAN & BUKTI PENGEMBALIAN */}
            {selectedDetailRow && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
                    onClick={() => setSelectedDetailRow(null)}
                >
                    <div
                        className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header Modal */}
                        <div className="p-4 bg-white border-b border-slate-200 text-slate-800 flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="font-bold text-sm text-slate-900">Detail Pemeriksaan Pengembalian</h3>
                                <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                                    Pemeriksa: {selectedDetailRow.petugasNama} {selectedDetailRow.tanggalVerifikasi ? `• ${selectedDetailRow.tanggalVerifikasi}` : ''}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedDetailRow(null)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                aria-label="Tutup"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body Modal Scrollable */}
                        <div className="p-5 space-y-4 text-xs overflow-y-auto">
                            {/* Status Verifikasi */}
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                                <span className="font-semibold text-slate-600">Status Fisik:</span>
                                <span className="font-bold text-slate-800">
                                    {selectedDetailRow.statusVerifikasi === 'ada_kerusakan_hilang' ? 'Ada Catatan Kerusakan' : 'Lolos Cek Fisik'}
                                </span>
                            </div>

                            {/* Daftar Fasilitas & Kondisi Sesudah */}
                            <div className="space-y-1.5">
                                <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
                                    Fasilitas &amp; Kondisi Barang
                                </span>
                                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 overflow-hidden bg-white">
                                    {selectedDetailRow.items.map((it) => {
                                        const kondisi = it.kondisi_sesudah || 'sempurna';
                                        const isDamaged = ['rusak_ringan', 'rusak_berat', 'hilang'].includes(kondisi);
                                        const labelKondisi =
                                            kondisi === 'rusak_berat'
                                                ? 'Rusak Berat'
                                                : kondisi === 'rusak_ringan'
                                                ? 'Rusak Ringan'
                                                : kondisi === 'hilang'
                                                ? 'Hilang'
                                                : 'Sempurna / Utuh';

                                        return (
                                            <div key={it.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                                                <div className="min-w-0">
                                                    <span className="font-bold text-slate-800 block truncate">
                                                        {it.nama_barang}
                                                    </span>
                                                    <span className="text-[11px] text-slate-500">
                                                        Jumlah: {it.qty} {it.satuan}
                                                    </span>
                                                </div>
                                                <span
                                                    className={`px-2 py-0.5 rounded text-[11px] font-bold shrink-0 ${
                                                        isDamaged
                                                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                                                    }`}
                                                >
                                                    {labelKondisi}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Catatan Petugas / Admin */}
                            <div className="space-y-1.5">
                                <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
                                    Catatan Petugas Sarpras
                                </span>
                                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 leading-relaxed font-medium">
                                    "{selectedDetailRow.catatanInspeksiAdmin ||
                                        (selectedDetailRow.statusVerifikasi === 'ada_kerusakan_hilang'
                                            ? 'Ditemukan kerusakan/kehilangan pada barang yang dikembalikan.'
                                            : 'Barang kembali lengkap dan dalam kondisi baik.')}"
                                </div>
                            </div>

                            {/* Info Denda Jika Ada */}
                            {selectedDetailRow.biayaDenda > 0 && (
                                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-slate-700">Denda Kerusakan:</span>
                                        <span className="font-bold text-slate-900 text-sm">
                                            Rp {selectedDetailRow.biayaDenda.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/80 text-[11px]">
                                        <span className="text-slate-500">Status Pembayaran:</span>
                                        <span className="font-bold text-slate-800">
                                            {selectedDetailRow.statusPembayaranDenda === 'lunas'
                                                ? 'Lunas'
                                                : selectedDetailRow.statusPembayaranDenda === 'menunggu_verifikasi_admin'
                                                ? 'Menunggu Verifikasi Admin'
                                                : 'Belum Dibayar'}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Bukti Foto (Foto Pengembalian & Bukti Transfer Denda) */}
                            {(selectedDetailRow.fotoBukti || selectedDetailRow.buktiBayarDenda) && (
                                <div className="space-y-1.5 pt-1">
                                    <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
                                        Foto Bukti Tersimpan
                                    </span>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        {selectedDetailRow.fotoBukti && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setLightboxUrl(selectedDetailRow.fotoBukti);
                                                    setLightboxTitle(`Bukti Foto Fisik Pengembalian - ${selectedDetailRow.kodePengembalian || selectedDetailRow.kodePeminjaman}`);
                                                }}
                                                className="p-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-left flex items-center gap-2.5 transition cursor-pointer group"
                                            >
                                                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-500 group-hover:text-slate-800">
                                                    <Camera className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="font-bold text-slate-800 text-xs block group-hover:underline">
                                                        Bukti Fisik Barang
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 block">
                                                        Klik untuk perbesar foto
                                                    </span>
                                                </div>
                                            </button>
                                        )}

                                        {selectedDetailRow.buktiBayarDenda && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setLightboxUrl(selectedDetailRow.buktiBayarDenda!);
                                                    setLightboxTitle(`Bukti Transfer Denda - ${selectedDetailRow.kodePengembalian || selectedDetailRow.kodePeminjaman}`);
                                                }}
                                                className="p-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-left flex items-center gap-2.5 transition cursor-pointer group"
                                            >
                                                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-500 group-hover:text-slate-800">
                                                    <CreditCard className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="font-bold text-slate-800 text-xs block group-hover:underline">
                                                        Bukti Transfer Denda
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 block">
                                                        Klik untuk perbesar foto
                                                    </span>
                                                </div>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Modal */}
                        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end shrink-0">
                            <button
                                type="button"
                                onClick={() => setSelectedDetailRow(null)}
                                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold rounded-xl text-xs transition cursor-pointer shadow-2xs"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
