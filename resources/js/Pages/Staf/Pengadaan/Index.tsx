import React, { useState } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    ShoppingCart,
    Plus,
    Clock,
    CheckCircle2,
    AlertCircle,
    MapPin,
    Building2,
    X,
    Search,
    UploadCloud,
    Trash2,
    Eye,
    Calendar,
    FileText,
    Check,
    AlertTriangle,
    Receipt,
    CheckCircle,
    XCircle,
    Layers,
    UserCheck,
    Lock,
} from 'lucide-react';

interface StafUser {
    id: number;
    name: string;
    no_hp?: string | null;
}

interface PengadaanItem {
    id: number;
    user_id?: number | null;
    kode_pengadaan: string;
    pelapor_nama: string;
    pelapor_role: string;
    staf_id?: number | null;
    staf_nama: string | null;
    admin_nama: string | null;
    nama_barang: string;
    kategori: string;
    jumlah: number;
    satuan: string;
    estimasi_harga_satuan: number;
    total_biaya: number;
    lokasi_penempatan: string;
    ruangan_tujuan: string;
    alasan_pengadaan: string;
    spesifikasi: string | null;
    nama_toko_vendor: string | null;
    foto_bukti_nota: string | null;
    tanggal_pembelian: string | null;
    status: 'diajukan' | 'disetujui' | 'selesai' | 'ditolak';
    catatan_admin: string | null;
    sarpras_id: number | null;
    is_converted_to_sarpras: boolean;
    is_assigned_to_me?: boolean;
    tanggal_dibuat: string;
}

interface Props {
    pengadaanList: PengadaanItem[];
    stafUsers?: StafUser[];
    allRuanganList?: string[];
    currentUserId?: number;
    userRuangan?: string;
    assignedRooms?: string[];
    userRole: string;
    isAdmin: boolean;
    isStaf: boolean;
    isKepalaBagian: boolean;
}

// Kategori resmi sarana sesuai standar sistem inventaris sarpras
const KATEGORI_SARANA_OPTIONS = [
    'Furnitur & Mebel',
    'IT & Informatika',
    'Elektronik & Multimedia',
    'Peralatan & Perkakas',
    'Olahraga & Seni',
    'Perlengkapan Acara & Protokoler',
    'Lainnya',
];

// Helper cerdas mendeteksi kategori berdasarkan nama barang
const tebakKategoriOtomatis = (nama: string): string => {
    const n = nama.toLowerCase();
    if (
        n.includes('komputer') ||
        n.includes('pc') ||
        n.includes('laptop') ||
        n.includes('notebook') ||
        n.includes('monitor') ||
        n.includes('cpu') ||
        n.includes('printer') ||
        n.includes('scanner') ||
        n.includes('mouse') ||
        n.includes('keyboard') ||
        n.includes('router') ||
        n.includes('switch') ||
        n.includes('server') ||
        n.includes('it')
    ) {
        return 'IT & Informatika';
    }
    if (
        n.includes('proyektor') ||
        n.includes('projector') ||
        n.includes('sound') ||
        n.includes('speaker') ||
        n.includes('mic') ||
        n.includes('audio') ||
        n.includes('kamera') ||
        n.includes('tv') ||
        n.includes('layar')
    ) {
        return 'Elektronik & Multimedia';
    }
    if (
        n.includes('meja') ||
        n.includes('kursi') ||
        n.includes('lemari') ||
        n.includes('rak') ||
        n.includes('podium') ||
        n.includes('mimbar') ||
        n.includes('whiteboard') ||
        n.includes('papan')
    ) {
        return 'Furnitur & Mebel';
    }
    if (
        n.includes('tangga') ||
        n.includes('genset') ||
        n.includes('bor') ||
        n.includes('kabel') ||
        n.includes('stopkontak') ||
        n.includes('perkakas')
    ) {
        return 'Peralatan & Perkakas';
    }
    if (
        n.includes('matras') ||
        n.includes('bola') ||
        n.includes('raket') ||
        n.includes('net') ||
        n.includes('olahraga') ||
        n.includes('seni')
    ) {
        return 'Olahraga & Seni';
    }
    if (
        n.includes('tenda') ||
        n.includes('banner') ||
        n.includes('backdrop') ||
        n.includes('panggung')
    ) {
        return 'Perlengkapan Acara & Protokoler';
    }
    return 'Furnitur & Mebel';
};

const getBadgeKategoriStyle = (kategori: string) => {
    switch (kategori) {
        case 'IT & Informatika':
            return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'Elektronik & Multimedia':
            return 'bg-purple-50 text-purple-700 border-purple-200';
        case 'Furnitur & Mebel':
            return 'bg-amber-50 text-amber-800 border-amber-200';
        case 'Peralatan & Perkakas':
            return 'bg-slate-100 text-slate-700 border-slate-300';
        case 'Olahraga & Seni':
            return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'Perlengkapan Acara & Protokoler':
            return 'bg-rose-50 text-rose-700 border-rose-200';
        default:
            return 'bg-slate-50 text-slate-700 border-slate-200';
    }
};

export default function PengadaanIndex({
    pengadaanList = [],
    stafUsers = [],
    allRuanganList = [],
    currentUserId,
    userRuangan = '',
    assignedRooms = [],
    userRole = 'staf',
    isAdmin = false,
    isStaf = false,
    isKepalaBagian = false,
}: Props) {
    const isPicRuangan = isKepalaBagian || userRole === 'kepala_bagian' || userRole === 'staf_ruangan';
    const { flash } = usePage().props as any;
    const [cari, setCari] = useState('');
    const [tabFilter, setTabFilter] = useState<'semua' | 'diajukan' | 'disetujui' | 'selesai' | 'ditolak'>('semua');

    // Lightbox foto bukti
    const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

    // Modal Admin Validasi
    const [itemToValidate, setItemToValidate] = useState<PengadaanItem | null>(null);
    const [validationAction, setValidationAction] = useState<'disetujui' | 'ditolak'>('disetujui');
    const [selectedStafId, setSelectedStafId] = useState<string>('');
    const [catatanAdmin, setCatatanAdmin] = useState('');

    // Modal Staf Upload Nota Belanja
    const [itemToPurchase, setItemToPurchase] = useState<PengadaanItem | null>(null);
    const [notaFilePreview, setNotaFilePreview] = useState<string | null>(null);

    // Modal Staf Tambah / Ajukan Pengadaan Baru
    const [isModalTambahOpen, setIsModalTambahOpen] = useState(false);
    const formUsulanStaf = useForm({
        nama_barang: '',
        kategori: 'Elektronik & Multimedia',
        jumlah: '' as number | string,
        satuan: 'Unit',
        estimasi_harga_satuan: '' as number | string,
        ruangan_tujuan: allRuanganList[0] || 'Biro Sarpras',
        alasan_pengadaan: '',
        spesifikasi: '',
    });

    const handleKirimUsulanStaf = (e: React.FormEvent) => {
        e.preventDefault();
        formUsulanStaf.post('/staf/pengadaan', {
            preserveScroll: true,
            onSuccess: () => {
                setIsModalTambahOpen(false);
                formUsulanStaf.reset();
            },
        });
    };

    // Form Kepala Bagian: Usulan Kebutuhan Barang Baru
    const [isKategoriManual, setIsKategoriManual] = useState(false);
    const defaultAssignedRoom = assignedRooms[0] || userRuangan || '';
    const formUsulan = useForm({
        nama_barang: '',
        kategori: 'Furnitur & Mebel',
        jumlah: '' as number | string,
        satuan: 'Unit',
        estimasi_harga_satuan: 0,
        lokasi_penempatan: defaultAssignedRoom,
        ruangan_tujuan: defaultAssignedRoom,
        alasan_pengadaan: '',
    });

    // Form Staf: Belanja & Upload Nota
    const formBelanja = useForm({
        tanggal_pembelian: new Date().toISOString().split('T')[0],
        estimasi_harga_satuan: 0,
        foto_bukti_nota: null as File | null,
        nama_toko_vendor: '',
        spesifikasi: '',
    });

    const handleFileNotaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        formBelanja.setData('foto_bukti_nota', file);
        if (file) {
            if (file.type.startsWith('image/')) {
                setNotaFilePreview(URL.createObjectURL(file));
            } else {
                setNotaFilePreview(null);
            }
        } else {
            setNotaFilePreview(null);
        }
    };

    const handleKirimUsulan = (e: React.FormEvent) => {
        e.preventDefault();
        formUsulan.post('/staf/pengadaan', {
            preserveScroll: true,
            onSuccess: () => {
                formUsulan.reset('nama_barang', 'jumlah', 'estimasi_harga_satuan', 'alasan_pengadaan');
                formUsulan.setData('satuan', 'Unit');
                setIsKategoriManual(false);
            },
        });
    };

    const handleKirimBelanja = (e: React.FormEvent) => {
        e.preventDefault();
        if (!itemToPurchase) return;

        formBelanja.post(`/staf/pengadaan/${itemToPurchase.id}/upload-nota`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setItemToPurchase(null);
                setNotaFilePreview(null);
                formBelanja.reset();
            },
        });
    };

    const handleValidasiAdmin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!itemToValidate) return;

        router.post(
            `/staf/pengadaan/${itemToValidate.id}/status`,
            {
                status: validationAction,
                staf_id: validationAction === 'disetujui' && selectedStafId ? Number(selectedStafId) : null,
                catatan_admin: catatanAdmin,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setItemToValidate(null);
                    setSelectedStafId('');
                    setCatatanAdmin('');
                },
            }
        );
    };

    const handleInsertToSarpras = (id: number) => {
        if (!confirm('Tambahkan barang pengadaan yang sudah dibeli ini langsung ke Master Stok Sarpras?')) return;
        router.post(
            `/staf/pengadaan/${id}/status`,
            {
                status: 'selesai',
                masukkan_ke_sarpras: true,
            },
            { preserveScroll: true }
        );
    };

    const filtered = pengadaanList.filter((item) => {
        const matchCari =
            item.kode_pengadaan.toLowerCase().includes(cari.toLowerCase()) ||
            item.nama_barang.toLowerCase().includes(cari.toLowerCase()) ||
            item.lokasi_penempatan.toLowerCase().includes(cari.toLowerCase()) ||
            item.ruangan_tujuan.toLowerCase().includes(cari.toLowerCase()) ||
            item.pelapor_nama.toLowerCase().includes(cari.toLowerCase());

        if (tabFilter === 'semua') return matchCari;
        return matchCari && item.status === tabFilter;
    });

    // Hitung antrean belanja untuk staf (prioritaskan yang ditugaskan ke staf ini atau belum dikunci staf lain)
    const antreanBelanjaStaf = pengadaanList.filter(
        (it) => it.status === 'disetujui' && it.is_assigned_to_me !== false
    );
    const riwayatSelesaiStaf = pengadaanList.filter((it) => it.status === 'selesai');
    const usulanSayaStaf = pengadaanList.filter(
        (it) => (currentUserId && it.user_id === currentUserId) || it.pelapor_role === 'Staf Sarpras'
    );

    return (
        <AdminLayout>
            <Head title="Pengadaan & Rencana Kebutuhan Sarpras" />

            <div className="max-w-7xl mx-auto space-y-6 pb-12 px-2 sm:px-4 font-sans text-slate-800 text-xs">
                {/* Header Berdasarkan Role */}
                {isPicRuangan ? (
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#006039] via-[#094c34] to-[#004225] p-6 sm:p-8 text-white shadow-xs border border-emerald-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        {/* Lingkaran dekoratif */}
                        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
                        <div className="absolute right-36 -bottom-16 w-40 h-40 rounded-full bg-emerald-400/10 pointer-events-none" />

                        <div className="relative z-10 space-y-2 max-w-xl">
                            <div>
                                <span className="px-3.5 py-1 bg-amber-400 text-amber-950 font-black text-[10px] tracking-wider rounded-full uppercase inline-block shadow-2xs">
                                    LAYANAN PENGADAAN
                                </span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                Pengadaan Barang &amp; Fasilitas
                            </h1>
                            <p className="text-xs sm:text-sm text-emerald-100/90 font-normal">
                                Ajukan kebutuhan fasilitas ruangan Anda untuk divalidasi oleh Kepala Biro Sarpras.
                            </p>
                        </div>

                        {/* Kartu Ilustrasi Sesuai Gambar 1 */}
                        <div className="relative shrink-0 hidden sm:flex items-center justify-center w-48 h-28 pointer-events-none">
                            <div className="absolute top-0 right-4 w-36 h-20 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 transform rotate-12" />
                            <div className="absolute top-2 right-8 w-36 h-20 rounded-2xl bg-emerald-400/20 backdrop-blur-xs border border-white/20 transform -rotate-6" />
                            <div className="relative z-10 w-36 h-20 rounded-2xl bg-amber-400 shadow-lg p-3.5 flex flex-col justify-center gap-1.5 border border-amber-300">
                                <div className="w-12 h-1.5 rounded-full bg-amber-800/40" />
                                <div className="w-8 h-1.5 rounded-full bg-amber-800/40" />
                            </div>
                        </div>
                    </div>
                ) : isAdmin ? (
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#006039] via-[#094c34] to-[#004225] p-6 sm:p-7 text-white shadow-md border border-emerald-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                        {/* Lingkaran dekoratif */}
                        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
                        <div className="absolute right-32 -bottom-16 w-40 h-40 rounded-full bg-emerald-400/10 pointer-events-none" />

                        <div className="relative z-10 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
                                <ShoppingCart className="w-6 h-6" strokeWidth={2} />
                            </div>
                            <div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500 text-white text-[11px] font-bold shadow-xs tracking-wide">
                                    Layanan Pengadaan
                                </div>
                                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1.5">
                                    Pengadaan Barang &amp; Fasilitas
                                </h1>
                                <p className="text-xs text-emerald-100/90 mt-0.5 font-normal max-w-xl">
                                    Kelola usulan pengadaan barang, persetujuan belanja, dan integrasi stok sarpras.
                                </p>
                            </div>
                        </div>

                        <div className="relative z-10 w-full sm:w-72 shrink-0">
                            <Search className="absolute inset-y-0 left-3.5 my-auto w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={cari}
                                onChange={(e) => setCari(e.target.value)}
                                placeholder="Cari kode, barang, ruangan..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-800 placeholder-slate-400 rounded-xl text-xs shadow-xs border border-slate-200 outline-hidden focus:ring-2 focus:ring-emerald-400 transition"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 border border-slate-200/80 flex items-center justify-center shrink-0">
                                <ShoppingCart className="w-5 h-5" strokeWidth={1.75} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-[#006039] border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
                                        LAYANAN PENGADAAN
                                    </span>
                                </div>
                                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                                    Pengadaan Barang &amp; Fasilitas
                                </h1>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Daftar barang yang telah disetujui Admin untuk dibeli atau ajukan kebutuhan fasilitas baru.
                                </p>
                            </div>
                        </div>

                        {isStaf && (
                            <button
                                type="button"
                                onClick={() => {
                                    setIsModalTambahOpen(true);
                                    if (!formUsulanStaf.data.ruangan_tujuan && allRuanganList.length > 0) {
                                        formUsulanStaf.setData('ruangan_tujuan', allRuanganList[0]);
                                    }
                                }}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#006039] hover:bg-[#004e2e] active:bg-[#003822] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-sm transition cursor-pointer shrink-0 self-start sm:self-auto"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Ajukan Pengadaan</span>
                            </button>
                        )}
                    </div>
                )}

                {/* Notifikasi Flash Sukses / Error */}
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

                {/* ============================================================== */}
                {/* 1. TAMPILAN KHUSUS KEPALA BAGIAN / PIC RUANGAN (SESUAI GAMBAR 1) */}
                {/* ============================================================== */}
                {isPicRuangan && (
                    <div className="space-y-6">
                        {/* Formulir Rencana Kebutuhan (Full-Width Card Sesuai Gambar 1) */}
                        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
                            <div className="pb-3 border-b border-slate-100">
                                <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                                    Formulir Rencana Kebutuhan
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Isi data barang yang dibutuhkan beserta ruangan tujuannya.
                                </p>
                            </div>

                            <form onSubmit={handleKirimUsulan} className="space-y-4 text-xs">
                                {/* Baris 1: 3 Kolom (Input Satuan dihapus, Kategori disamakan dengan Inventaris) */}
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-start">
                                    <div className="sm:col-span-12 md:col-span-6">
                                        <label className="block font-bold text-slate-700 text-xs mb-1.5">
                                            Nama Sarpras / Barang yang Dibutuhkan <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formUsulan.data.nama_barang}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                formUsulan.setData('nama_barang', val);
                                                if (!isKategoriManual && val.trim().length > 1) {
                                                    formUsulan.setData('kategori', tebakKategoriOtomatis(val));
                                                }
                                            }}
                                            placeholder="Contoh: Kursi Mahasiswa / Proyektor Epson..."
                                            className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] focus:ring-1 focus:ring-[#006039] transition outline-none"
                                        />
                                        {formUsulan.errors.nama_barang && (
                                            <p className="text-rose-600 text-[11px] mt-1">{formUsulan.errors.nama_barang}</p>
                                        )}
                                    </div>

                                    <div className="sm:col-span-7 md:col-span-4">
                                        <label className="block font-bold text-slate-700 text-xs mb-1.5">
                                            Kategori <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={formUsulan.data.kategori}
                                            onChange={(e) => {
                                                setIsKategoriManual(true);
                                                formUsulan.setData('kategori', e.target.value);
                                            }}
                                            className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] outline-none font-medium cursor-pointer"
                                        >
                                            {KATEGORI_SARANA_OPTIONS.map((kat) => (
                                                <option key={kat} value={kat}>
                                                    {kat}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="sm:col-span-5 md:col-span-2">
                                        <label className="block font-bold text-slate-700 text-xs mb-1.5">
                                            Jumlah <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            required
                                            value={formUsulan.data.jumlah}
                                            onChange={(e) => {
                                                const raw = e.target.value.replace(/\D/g, '');
                                                formUsulan.setData('jumlah', raw === '' ? '' : parseInt(raw, 10));
                                            }}
                                            placeholder="Jml"
                                            className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold text-center focus:bg-white focus:border-[#006039] outline-none"
                                        />
                                        {formUsulan.errors.jumlah && (
                                            <p className="text-rose-600 text-[11px] mt-1 text-center">{formUsulan.errors.jumlah}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Baris 2: 2 Kolom Sesuai Gambar 1 */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch mt-3.5">
                                    {/* Kolom Kiri: Ruangan Penempatan */}
                                    <div className="lg:col-span-5 p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-2xl flex flex-col justify-between space-y-2">
                                        <label className="block font-bold text-slate-700 text-xs">
                                            Ruangan Penempatan (Ditentukan Admin):
                                        </label>
                                        {assignedRooms.length > 0 ? (
                                            <select
                                                required
                                                value={formUsulan.data.ruangan_tujuan}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    formUsulan.setData('ruangan_tujuan', val);
                                                    formUsulan.setData('lokasi_penempatan', val);
                                                }}
                                                className="w-full px-3.5 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-slate-900 focus:border-[#006039] outline-none cursor-pointer"
                                            >
                                                {assignedRooms.map((room, idx) => (
                                                    <option key={idx} value={room}>
                                                        {room}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div className="px-3.5 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-slate-700">
                                                {userRuangan || 'Ruangan belum ditentukan'}
                                            </div>
                                        )}
                                        <p className="text-[10px] text-slate-500 font-medium">
                                            * Hanya menampilkan ruangan yang telah ditentukan oleh Admin untuk akun Anda.
                                        </p>
                                    </div>

                                    {/* Kolom Kanan: Alasan Kebutuhan Pengadaan */}
                                    <div className="lg:col-span-7 flex flex-col justify-between space-y-1.5">
                                        <label className="block font-bold text-slate-700 text-xs">
                                            Alasan Kebutuhan Pengadaan <span className="text-rose-500">*</span>
                                        </label>
                                        <textarea
                                            rows={3}
                                            required
                                            value={typeof formUsulan.data.alasan_pengadaan === 'string' ? formUsulan.data.alasan_pengadaan : ''}
                                            onChange={(e) => formUsulan.setData('alasan_pengadaan', e.target.value)}
                                            placeholder="Jelaskan kebutuhan pengadaan barang atau fasilitas ini..."
                                            className="w-full h-full min-h-[88px] px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] focus:ring-1 focus:ring-[#006039] outline-none resize-none"
                                        />
                                        {formUsulan.errors.alasan_pengadaan && (
                                            <p className="text-rose-600 text-[11px] mt-1">{formUsulan.errors.alasan_pengadaan}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Tombol Submit di Kanan Bawah Sesuai Gambar 1 */}
                                <div className="flex justify-end pt-3">
                                    <button
                                        type="submit"
                                        disabled={formUsulan.processing}
                                        className="px-6 py-2.5 rounded-xl bg-[#006039] hover:bg-[#004e2e] active:bg-[#003822] text-white font-bold text-xs shadow-xs hover:shadow-sm transition cursor-pointer disabled:opacity-60 flex items-center gap-2"
                                    >
                                        <span>{formUsulan.processing ? 'Mengirim...' : 'Kirim Usulan Kebutuhan Barang'}</span>
                                        <span>&rarr;</span>
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Riwayat Usulan Ruangan Saya (Full-Width Card di bawah formulir) */}
                        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
                            <div className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <h2 className="text-base font-extrabold text-slate-900">
                                        Riwayat Usulan Ruangan Saya ({filtered.length})
                                    </h2>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Pantau status persetujuan dan rincian data kebutuhan yang diajukan ke Admin Biro Sarpras.
                                    </p>
                                </div>
                            </div>

                            <div className="overflow-x-auto border border-slate-200/90 rounded-2xl shadow-2xs">
                                <table className="w-full min-w-[860px] text-left text-xs border-collapse">
                                    <thead className="bg-slate-50/80 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                                        <tr>
                                            <th className="py-3.5 pl-4 sm:pl-5 pr-2 w-[14%] whitespace-nowrap">Tanggal &amp; Kode</th>
                                            <th className="py-3.5 px-3 w-[22%] min-w-[180px]">Barang yang Diusulkan</th>
                                            <th className="py-3.5 px-3 w-[15%] min-w-[130px] whitespace-nowrap">Kategori</th>
                                            <th className="py-3.5 px-2 text-center w-[9%] whitespace-nowrap">Jumlah</th>
                                            <th className="py-3.5 px-3 w-[18%] min-w-[160px]">Ruangan Penempatan</th>
                                            <th className="py-3.5 px-3 w-[14%] min-w-[150px]">Alasan Kebutuhan</th>
                                            <th className="py-3.5 pr-4 pl-2 text-center w-[8%] whitespace-nowrap">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filtered.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/70 transition">
                                                <td className="py-3 pl-4 sm:pl-5 pr-2 whitespace-nowrap font-bold text-slate-800">
                                                    <div>{item.tanggal_dibuat}</div>
                                                    <div className="text-[10px] font-mono font-semibold text-slate-400 mt-0.5">
                                                        {item.kode_pengadaan}
                                                    </div>
                                                </td>

                                                <td className="py-3 px-3">
                                                    <div className="font-extrabold text-slate-900 text-xs leading-snug">
                                                        {item.nama_barang}
                                                    </div>
                                                </td>

                                                <td className="py-3 px-3 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold border ${getBadgeKategoriStyle(item.kategori)}`}>
                                                        {item.kategori}
                                                    </span>
                                                </td>

                                                <td className="py-3 px-2 text-center whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-extrabold text-xs">
                                                        {item.jumlah} {item.satuan || 'Unit'}
                                                    </span>
                                                </td>

                                                <td className="py-3 px-3">
                                                    <div className="font-bold text-slate-900 flex items-center gap-1.5 leading-snug">
                                                        <Building2 className="w-3.5 h-3.5 text-[#006039] shrink-0" />
                                                        <span className="truncate">{item.ruangan_tujuan}</span>
                                                    </div>
                                                    {item.lokasi_penempatan && item.lokasi_penempatan !== item.ruangan_tujuan && (
                                                        <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                                                            {item.lokasi_penempatan}
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="py-3 px-3">
                                                    <div className="text-slate-700 text-xs line-clamp-2" title={item.alasan_pengadaan}>
                                                        {item.alasan_pengadaan}
                                                    </div>
                                                </td>

                                                <td className="py-3 pr-4 pl-2 text-center whitespace-nowrap">
                                                    {item.status === 'diajukan' && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 rounded-full font-bold text-[10px] border border-amber-200 shadow-2xs">
                                                            <Clock className="w-3 h-3 text-amber-600" />
                                                            <span>Menunggu Validasi</span>
                                                        </span>
                                                    )}
                                                    {item.status === 'disetujui' && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-800 rounded-full font-bold text-[10px] border border-blue-200 shadow-2xs">
                                                            <ShoppingCart className="w-3 h-3 text-blue-600" />
                                                            <span>Disetujui Admin</span>
                                                        </span>
                                                    )}
                                                    {item.status === 'selesai' && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full font-bold text-[10px] border border-emerald-200 shadow-2xs">
                                                            <CheckCircle2 className="w-3 h-3 text-[#006039]" />
                                                            <span>Sudah Ditaruh di Ruangan</span>
                                                        </span>
                                                    )}
                                                    {item.status === 'ditolak' && (
                                                        <div>
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-800 rounded-full font-bold text-[10px] border border-rose-200 shadow-2xs">
                                                                <XCircle className="w-3 h-3 text-rose-600" />
                                                                <span>Ditolak Admin</span>
                                                            </span>
                                                            {item.catatan_admin && (
                                                                <div className="text-[10px] text-rose-600 mt-1 max-w-[150px] truncate" title={item.catatan_admin}>
                                                                    Alasan: {item.catatan_admin}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {filtered.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                                                    Belum ada rencana kebutuhan sarpras yang diajukan.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ============================================================== */}
                {/* 2. TAMPILAN KHUSUS STAF SARPRAS (ANTEAN BELANJA + UPLOAD NOTA) */}
                {/* ============================================================== */}
                {isStaf && (
                    <div className="space-y-6">
                        {/* Section Antrean Belanja yang sudah di-ACC atau Banner Bersih jika Kosong (Sesuai Gambar 1) */}
                        {antreanBelanjaStaf.length === 0 ? (
                            <div className="bg-[#eaf8f0] border border-emerald-100 rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#006039] shadow-2xs shrink-0">
                                    <Check className="w-5 h-5 stroke-[2.5]" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                                        Belum ada barang yang menunggu dibeli
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                                        Antrean belanja kosong saat ini.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3.5">
                                {/* Header Section Barang yang Butuh Dibeli */}
                                <div className="flex items-center justify-between gap-3 px-1">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-amber-100 shrink-0" />
                                        <h2 className="text-base sm:text-lg font-bold text-slate-900">
                                            Barang yang Menunggu Dibeli
                                        </h2>
                                    </div>
                                    <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full">
                                        {antreanBelanjaStaf.length} barang butuh dibeli
                                    </span>
                                </div>

                                {/* List Kartu Barang yang Butuh Dibeli (Konsisten Bergaya Horizontal Seperti Gambar 1) */}
                                <div className="space-y-3">
                                    {antreanBelanjaStaf.map((item) => (
                                        <div
                                            key={item.id}
                                            className="bg-white rounded-2xl sm:rounded-3xl border border-amber-200/80 shadow-2xs p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:shadow-xs"
                                        >
                                            {/* Kiri: Ikon Belanja + Kode & Barang */}
                                            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 md:min-w-[300px]">
                                                {/* Visual Kartu Keranjang Belanja */}
                                                <div className="w-14 h-18 sm:w-16 sm:h-20 rounded-xl border border-amber-200 bg-amber-50/70 flex flex-col justify-between overflow-hidden shadow-2xs shrink-0 text-center select-none">
                                                    <div className="w-full h-1 bg-amber-500" />
                                                    <div className="p-1 flex items-center justify-center flex-1 text-amber-600">
                                                        <ShoppingCart className="w-6 h-6 stroke-[1.75]" />
                                                    </div>
                                                    <div className="bg-amber-500 text-slate-950 text-[9px] sm:text-[10px] font-extrabold py-1 px-1 text-center truncate">
                                                        Siap Dibeli
                                                    </div>
                                                </div>

                                                {/* Detail Barang */}
                                                <div className="min-w-0">
                                                    <span className="font-mono font-bold text-[10px] sm:text-[11px] text-amber-800 bg-amber-100/70 border border-amber-200 px-2 py-0.5 rounded-md inline-block">
                                                        {item.kode_pengadaan}
                                                    </span>
                                                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 mt-1 truncate">
                                                        {item.nama_barang}
                                                    </h3>
                                                    <p className="text-xs text-slate-400 font-medium mt-0.5 truncate">
                                                        {item.kategori} · Pengusul: {item.pelapor_nama} ({item.pelapor_role})
                                                    </p>
                                                    {item.alasan_pengadaan && (
                                                        <p className="text-[11px] text-slate-500 italic mt-0.5 truncate">
                                                            "{item.alasan_pengadaan}"
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Tengah 1: Jumlah & Estimasi Biaya */}
                                            <div className="md:min-w-[120px]">
                                                <div className="text-xs text-slate-400 font-medium">
                                                    {item.jumlah} {item.satuan}
                                                </div>
                                                <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight mt-0.5">
                                                    {item.total_biaya > 0 ? `Rp ${item.total_biaya.toLocaleString('id-ID')}` : '-'}
                                                </div>
                                                <div className="text-[10px] font-semibold text-emerald-700">
                                                    Estimasi Anggaran
                                                </div>
                                            </div>

                                            {/* Tengah 2: Lokasi Peletakan Tujuan */}
                                            <div className="flex items-start gap-2 md:min-w-[180px]">
                                                <MapPin className="w-4 h-4 text-[#006039] shrink-0 mt-0.5" />
                                                <div className="min-w-0">
                                                    <div className="text-sm font-extrabold text-[#004e2e] truncate">
                                                        {item.ruangan_tujuan}
                                                    </div>
                                                    <div className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                                                        {item.lokasi_penempatan}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Kanan: Tombol Aksi Upload Bukti Foto Pembelian */}
                                            <div className="shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setItemToPurchase(item);
                                                        formBelanja.setData({
                                                            tanggal_pembelian: new Date().toISOString().split('T')[0],
                                                            estimasi_harga_satuan: item.estimasi_harga_satuan || 0,
                                                            foto_bukti_nota: null,
                                                            nama_toko_vendor: '',
                                                            spesifikasi: '',
                                                        });
                                                        setNotaFilePreview(null);
                                                    }}
                                                    className="px-4 py-2.5 bg-[#006039] hover:bg-[#004e2e] active:bg-[#003822] text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-2xs hover:shadow-xs transition cursor-pointer whitespace-nowrap"
                                                >
                                                    <Receipt className="w-4 h-4" />
                                                    <span>Upload Nota Pembelian</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Section Usulan Pengadaan Saya (Untuk memantau status validasi oleh Admin) */}
                        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        <ShoppingCart className="w-4 h-4 text-[#006039]" />
                                        <span>Usulan Pengadaan Saya ({usulanSayaStaf.length})</span>
                                    </h2>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Daftar pengajuan pengadaan barang yang Anda usulkan ke Admin Biro Sarpras.
                                    </p>
                                </div>
                            </div>

                            {usulanSayaStaf.length === 0 ? (
                                <div className="py-8 text-center text-slate-400 space-y-1">
                                    <p className="font-medium">Belum ada usulan pengadaan barang yang diajukan.</p>
                                    <p className="text-[11px] text-slate-400">Gunakan tombol "Ajukan Pengadaan" di bagian atas untuk membuat usulan baru.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                                            <tr>
                                                <th className="p-3">Kode &amp; Barang</th>
                                                <th className="p-3">Jumlah &amp; Estimasi</th>
                                                <th className="p-3">Ruangan Tujuan</th>
                                                <th className="p-3 text-center">Status Validasi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {usulanSayaStaf.map((item) => (
                                                <tr key={item.id} className="hover:bg-slate-50/80 transition align-middle">
                                                    <td className="p-3">
                                                        <span className="font-mono font-bold text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                                                            {item.kode_pengadaan}
                                                        </span>
                                                        <div className="font-bold text-slate-900 text-xs mt-1">{item.nama_barang}</div>
                                                        <div className="text-[10px] text-slate-400 mt-0.5">{item.kategori}</div>
                                                        {item.alasan_pengadaan && (
                                                            <div className="text-[10px] text-slate-600 italic mt-1 bg-slate-50 p-1.5 rounded border border-slate-100 max-w-sm">
                                                                "{item.alasan_pengadaan}"
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-3 whitespace-nowrap">
                                                        <div className="font-bold text-slate-900">{item.jumlah} {item.satuan}</div>
                                                        {item.total_biaya > 0 && (
                                                            <div className="text-[11px] font-extrabold text-[#006039] mt-0.5">
                                                                Rp {item.total_biaya.toLocaleString('id-ID')}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                                                            <Building2 className="w-3.5 h-3.5 text-[#006039] shrink-0" />
                                                            <span>{item.ruangan_tujuan}</span>
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 mt-0.5">{item.lokasi_penempatan}</div>
                                                    </td>
                                                    <td className="p-3 text-center whitespace-nowrap">
                                                        {item.status === 'diajukan' && (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 rounded-full font-bold text-[10px] border border-amber-200">
                                                                <Clock className="w-3 h-3 text-amber-600" />
                                                                <span>Menunggu Validasi</span>
                                                            </span>
                                                        )}
                                                        {item.status === 'disetujui' && (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-800 rounded-full font-bold text-[10px] border border-blue-200">
                                                                <ShoppingCart className="w-3 h-3 text-blue-600" />
                                                                <span>Disetujui (Siap Dibeli)</span>
                                                            </span>
                                                        )}
                                                        {item.status === 'selesai' && (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full font-bold text-[10px] border border-emerald-200">
                                                                <CheckCircle2 className="w-3 h-3 text-[#006039]" />
                                                                <span>Selesai Ditempatkan</span>
                                                            </span>
                                                        )}
                                                        {item.status === 'ditolak' && (
                                                            <div>
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-800 rounded-full font-bold text-[10px] border border-rose-200">
                                                                <XCircle className="w-3 h-3 text-rose-600" />
                                                                <span>Ditolak Admin</span>
                                                            </span>
                                                            {item.catatan_admin && (
                                                                <div className="text-[10px] text-rose-600 mt-1 max-w-[160px] truncate mx-auto" title={item.catatan_admin}>
                                                                    Alasan: {item.catatan_admin}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Section Riwayat Pembelian & Peletakan Selesai (Format Tabel Sesuai Gambar 2, Visual Nota Sesuai Gambar 1) */}
                        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-[#006039]" />
                                        Riwayat Pembelian &amp; Peletakan Selesai ({riwayatSelesaiStaf.length})
                                    </h2>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Daftar belanjaan yang telah dieksekusi lengkap dengan bukti nota.
                                    </p>
                                </div>
                            </div>

                            <div className="overflow-x-auto border border-slate-200 rounded-xl">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                                        <tr>
                                            <th className="p-3 w-28">Bukti Nota</th>
                                            <th className="p-3">Kode &amp; Barang</th>
                                            <th className="p-3">Jumlah &amp; Realisasi Biaya</th>
                                            <th className="p-3">Lokasi Peletakan</th>
                                            <th className="p-3 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {riwayatSelesaiStaf.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/80 transition align-middle">
                                                {/* Kolom 1: Bukti Nota (Bergaya Nota Dokumen 'Lihat nota' Sesuai Gambar 1) */}
                                                <td className="p-3 whitespace-nowrap">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (item.foto_bukti_nota) {
                                                                if (item.foto_bukti_nota.endsWith('.pdf')) {
                                                                    window.open(item.foto_bukti_nota, '_blank');
                                                                } else {
                                                                    setPreviewImage({
                                                                        url: item.foto_bukti_nota,
                                                                        title: `Nota Belanja - ${item.nama_barang}`,
                                                                    });
                                                                }
                                                            }
                                                        }}
                                                        className={`w-14 h-18 rounded-xl border border-slate-200 bg-white flex flex-col justify-between overflow-hidden shadow-2xs shrink-0 text-left transition ${
                                                            item.foto_bukti_nota
                                                                ? 'cursor-pointer hover:border-[#006039] hover:shadow-xs'
                                                                : 'opacity-70 cursor-default'
                                                        }`}
                                                        title={item.foto_bukti_nota ? 'Klik untuk melihat nota belanja' : 'Tanpa foto nota'}
                                                    >
                                                        {/* Garis Aksen Hijau & Garis Simbolis Nota */}
                                                        <div className="p-1.5 flex flex-col gap-1.5 flex-1 justify-center">
                                                            <div className="w-5 h-1 bg-[#006039] rounded-full" />
                                                            <div className="w-9 h-1 bg-slate-200 rounded-full" />
                                                            <div className="w-7 h-1 bg-slate-200 rounded-full" />
                                                            <div className="w-9 h-1 bg-slate-200 rounded-full" />
                                                        </div>
                                                        {/* Tombol Hijau 'Lihat nota' di Bagian Bawah */}
                                                        <div className="bg-[#006039] hover:bg-[#004e2e] text-white text-[9px] font-bold py-1 px-1 text-center truncate">
                                                            Lihat nota
                                                        </div>
                                                    </button>
                                                </td>

                                                {/* Kolom 2: Kode & Barang */}
                                                <td className="p-3">
                                                    <span className="font-mono font-bold text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                                                        {item.kode_pengadaan}
                                                    </span>
                                                    <div className="font-bold text-slate-900 text-xs mt-1">{item.nama_barang}</div>
                                                    <div className="text-[10px] text-slate-400 mt-0.5">
                                                        {item.kategori} {item.tanggal_pembelian && `• Tgl: ${item.tanggal_pembelian}`}
                                                    </div>
                                                </td>

                                                {/* Kolom 3: Jumlah & Realisasi Biaya */}
                                                <td className="p-3 whitespace-nowrap">
                                                    <div className="font-bold text-slate-900">{item.jumlah} {item.satuan}</div>
                                                    <div className="text-xs font-extrabold text-[#006039]">
                                                        Rp {item.total_biaya.toLocaleString('id-ID')}
                                                    </div>
                                                </td>

                                                {/* Kolom 4: Lokasi Peletakan */}
                                                <td className="p-3">
                                                    <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                                                        <Building2 className="w-3.5 h-3.5 text-[#006039] shrink-0" />
                                                        <span>{item.ruangan_tujuan}</span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 mt-0.5">{item.lokasi_penempatan}</div>
                                                </td>

                                                {/* Kolom 5: Status Selesai Ditempatkan */}
                                                <td className="p-3 text-center whitespace-nowrap">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full font-bold text-[10px] border border-emerald-200">
                                                        <CheckCircle2 className="w-3 h-3 text-[#006039]" />
                                                        <span>Selesai Ditempatkan</span>
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}

                                        {riwayatSelesaiStaf.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center text-slate-400">
                                                    Belum ada riwayat belanja yang selesai.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ============================================================== */}
                {/* 3. TAMPILAN KHUSUS ADMIN (APPROVAL & KONTROL PENUH) */}
                {/* ============================================================== */}
                {isAdmin && (
                    <div className="space-y-6">
                        {/* 5 KPI Metric Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                            {[
                                { id: 'semua', label: 'Semua Data', count: pengadaanList.length, borderTop: 'border-t-4 border-slate-300' },
                                { id: 'diajukan', label: 'Menunggu Validasi', count: pengadaanList.filter((i) => i.status === 'diajukan').length, borderTop: 'border-t-4 border-amber-400' },
                                { id: 'disetujui', label: 'Disetujui Belanja', count: pengadaanList.filter((i) => i.status === 'disetujui').length, borderTop: 'border-t-4 border-blue-500' },
                                { id: 'selesai', label: 'Selesai Dibeli', count: pengadaanList.filter((i) => i.status === 'selesai').length, borderTop: 'border-t-4 border-emerald-500' },
                                { id: 'ditolak', label: 'Ditolak', count: pengadaanList.filter((i) => i.status === 'ditolak').length, borderTop: 'border-t-4 border-rose-500' },
                            ].map((tab) => {
                                const isActive = tabFilter === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setTabFilter(tab.id as any)}
                                        className={`p-4 rounded-2xl text-left transition-all duration-200 cursor-pointer flex flex-col justify-between h-24 ${
                                            isActive
                                                ? 'bg-[#006039] text-white shadow-md'
                                                : `bg-white text-slate-800 border border-slate-200/90 shadow-2xs hover:shadow-xs ${tab.borderTop}`
                                        }`}
                                    >
                                        <span className={`text-xs font-semibold ${isActive ? 'text-emerald-100' : 'text-slate-600'}`}>
                                            {tab.label}
                                        </span>
                                        <span className={`text-2xl font-black ${isActive ? 'text-white' : 'text-slate-900'}`}>
                                            {tab.count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Wadah Utama: Daftar Pengadaan (Tabel Lengkap & Terpisah Kolomnya) */}
                        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
                            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                                <h2 className="text-base font-extrabold text-slate-900">Daftar Pengadaan</h2>
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-[#006039] border border-emerald-200 shadow-2xs">
                                    {tabFilter === 'semua' && `Semua Data (${filtered.length})`}
                                    {tabFilter === 'diajukan' && `Menunggu Validasi (${filtered.length})`}
                                    {tabFilter === 'disetujui' && `Disetujui Belanja (${filtered.length})`}
                                    {tabFilter === 'selesai' && `Selesai Dibeli (${filtered.length})`}
                                    {tabFilter === 'ditolak' && `Ditolak (${filtered.length})`}
                                </span>
                            </div>

                            {/* Tabel Data Terstruktur: Memisahkan Nama Barang, Kategori, Jumlah, Deskripsi, Status, dan Aksi */}
                            <div className="overflow-x-auto border border-slate-200/90 rounded-2xl shadow-2xs">
                                <table className="w-full min-w-[1150px] text-left text-xs border-collapse">
                                    <thead className="bg-slate-50/80 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                                        <tr>
                                            <th className="py-3.5 pl-4 pr-2 w-[6%] text-center whitespace-nowrap">Bukti Nota</th>
                                            <th className="py-3.5 px-3 w-[11%] whitespace-nowrap">Kode &amp; Tanggal</th>
                                            <th className="py-3.5 px-3 w-[15%] min-w-[150px]">Nama Barang</th>
                                            <th className="py-3.5 px-3 w-[12%] min-w-[130px] whitespace-nowrap">Kategori</th>
                                            <th className="py-3.5 px-2 text-center w-[7%] whitespace-nowrap">Jumlah</th>
                                            <th className="py-3.5 px-3 w-[16%] min-w-[160px]">Deskripsi / Alasan</th>
                                            <th className="py-3.5 px-3 w-[14%] min-w-[150px]">Pengusul &amp; Ruangan</th>
                                            <th className="py-3.5 px-3 w-[9%] whitespace-nowrap">Realisasi Biaya</th>
                                            <th className="py-3.5 px-3 text-center w-[10%] min-w-[120px] whitespace-nowrap">Status</th>
                                            <th className="py-3.5 pr-4 pl-2 text-center w-[11%] min-w-[140px] whitespace-nowrap">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filtered.map((item) => {
                                            const cleanKode = item.kode_pengadaan.startsWith('#')
                                                ? item.kode_pengadaan
                                                : `#${item.kode_pengadaan}`;

                                            return (
                                                <tr key={item.id} className="hover:bg-slate-50/70 transition">
                                                    {/* 1. Bukti Nota */}
                                                    <td className="py-3 pl-4 pr-2 text-center whitespace-nowrap">
                                                        {item.foto_bukti_nota ? (
                                                            item.foto_bukti_nota.endsWith('.pdf') ? (
                                                                <a
                                                                    href={item.foto_bukti_nota}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 inline-flex flex-col items-center justify-center text-blue-700 hover:bg-blue-100 transition shadow-2xs"
                                                                    title="Buka Nota PDF"
                                                                >
                                                                    <FileText className="w-5 h-5 mb-0.5" />
                                                                    <span className="text-[8px] font-bold">PDF</span>
                                                                </a>
                                                            ) : (
                                                                <div className="relative inline-block group">
                                                                    <img
                                                                        src={item.foto_bukti_nota}
                                                                        alt="Nota"
                                                                        onClick={() =>
                                                                            setPreviewImage({
                                                                                url: item.foto_bukti_nota!,
                                                                                title: `Nota - ${item.nama_barang}`,
                                                                            })
                                                                        }
                                                                        className="w-12 h-12 object-cover rounded-xl border border-slate-200 shadow-2xs cursor-pointer group-hover:opacity-85 transition"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setPreviewImage({
                                                                                url: item.foto_bukti_nota!,
                                                                                title: `Nota - ${item.nama_barang}`,
                                                                            })
                                                                        }
                                                                        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs cursor-pointer hover:bg-emerald-700 transition"
                                                                        title="Lihat Nota"
                                                                    >
                                                                        <Eye className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            )
                                                        ) : (
                                                            <div className="w-12 h-12 mx-auto rounded-xl border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center p-1 text-slate-300">
                                                                <Receipt className="w-4 h-4 mb-0.5 text-slate-400" />
                                                                <span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">
                                                                    Nota
                                                                </span>
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* 2. Kode & Tanggal */}
                                                    <td className="py-3 px-3 font-bold text-slate-800 whitespace-nowrap">
                                                        <div className="font-mono text-xs font-extrabold text-[#006039]">
                                                            {cleanKode}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                                                            {item.tanggal_dibuat}
                                                        </div>
                                                    </td>

                                                    {/* 3. Nama Barang */}
                                                    <td className="py-3 px-3">
                                                        <div className="font-extrabold text-slate-900 text-xs leading-snug">
                                                            {item.nama_barang}
                                                        </div>
                                                    </td>

                                                    {/* 4. Kategori */}
                                                    <td className="py-3 px-3 whitespace-nowrap">
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold border ${getBadgeKategoriStyle(
                                                                item.kategori
                                                            )}`}
                                                        >
                                                            {item.kategori}
                                                        </span>
                                                    </td>

                                                    {/* 5. Jumlah */}
                                                    <td className="py-3 px-2 text-center whitespace-nowrap">
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-extrabold text-xs">
                                                            {item.jumlah} {item.satuan || 'Unit'}
                                                        </span>
                                                    </td>

                                                    {/* 6. Deskripsi / Alasan */}
                                                    <td className="py-3 px-3">
                                                        <div
                                                            className="text-slate-700 text-xs line-clamp-3 leading-relaxed"
                                                            title={item.alasan_pengadaan || '-'}
                                                        >
                                                            {item.alasan_pengadaan || '-'}
                                                        </div>
                                                    </td>

                                                    {/* 7. Pengusul & Ruangan */}
                                                    <td className="py-3 px-3">
                                                        <div className="font-bold text-slate-900 text-xs leading-tight">
                                                            {item.pelapor_nama}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                                                            {item.pelapor_role}
                                                        </div>
                                                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-1 rounded-md border border-slate-200 bg-slate-50 text-slate-700 text-[10px] font-semibold max-w-full">
                                                            <Building2 className="w-3 h-3 text-[#006039] shrink-0" />
                                                            <span className="truncate">{item.ruangan_tujuan}</span>
                                                        </div>
                                                    </td>

                                                    {/* 8. Realisasi Biaya */}
                                                    <td className="py-3 px-3 whitespace-nowrap">
                                                        <div className="font-extrabold text-slate-900 text-xs">
                                                            Rp {(item.total_biaya || 0).toLocaleString('id-ID')}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 mt-0.5">
                                                            Staf: {item.staf_nama || '-'}
                                                        </div>
                                                    </td>

                                                    {/* 9. Status */}
                                                    <td className="py-3 px-3 text-center whitespace-nowrap">
                                                        {item.status === 'selesai' && (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full font-bold text-[11px] border border-emerald-200 shadow-2xs">
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                                <span>Selesai Dibeli</span>
                                                            </span>
                                                        )}
                                                        {item.status === 'diajukan' && (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 rounded-full font-bold text-[11px] border border-amber-200 shadow-2xs">
                                                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                                                <span>Menunggu Validasi</span>
                                                            </span>
                                                        )}
                                                        {item.status === 'disetujui' && (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-800 rounded-full font-bold text-[11px] border border-blue-200 shadow-2xs">
                                                                <ShoppingCart className="w-3.5 h-3.5 text-blue-600" />
                                                                <span>Disetujui Belanja</span>
                                                            </span>
                                                        )}
                                                        {item.status === 'ditolak' && (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-800 rounded-full font-bold text-[11px] border border-rose-200 shadow-2xs">
                                                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                                                <span>Ditolak</span>
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* 10. Aksi Admin */}
                                                    <td className="py-3 pr-4 pl-2 text-center whitespace-nowrap">
                                                        {item.status === 'diajukan' && (
                                                            <div className="inline-flex items-center justify-center gap-1.5">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setItemToValidate(item);
                                                                        setValidationAction('disetujui');
                                                                        setCatatanAdmin('');
                                                                        setSelectedStafId(
                                                                            stafUsers[0]?.id ? String(stafUsers[0].id) : ''
                                                                        );
                                                                    }}
                                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#006039] hover:bg-[#004e2e] text-white rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer"
                                                                    title="Setujui Usulan Pengadaan"
                                                                >
                                                                    <Check className="w-3.5 h-3.5" />
                                                                    <span>Setujui</span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setItemToValidate(item);
                                                                        setValidationAction('ditolak');
                                                                        setCatatanAdmin('');
                                                                        setSelectedStafId('');
                                                                    }}
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition cursor-pointer"
                                                                    title="Tolak Usulan Pengadaan"
                                                                >
                                                                    <X className="w-3.5 h-3.5" />
                                                                    <span>Tolak</span>
                                                                </button>
                                                            </div>
                                                        )}

                                                        {item.status === 'selesai' && (
                                                            item.is_converted_to_sarpras ? (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg font-bold text-[11px] border border-emerald-200">
                                                                    <CheckCircle2 className="w-3.5 h-3.5 text-[#006039]" />
                                                                    <span>Masuk Inventaris</span>
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleInsertToSarpras(item.id)}
                                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#006039] hover:bg-[#004e2e] text-white rounded-xl font-bold text-xs shadow-2xs transition cursor-pointer"
                                                                    title="Tambahkan Barang ke Stok Inventaris Sarpras"
                                                                >
                                                                    <Plus className="w-3.5 h-3.5" />
                                                                    <span>Masuk Stok Sarpras</span>
                                                                </button>
                                                            )
                                                        )}

                                                        {item.status === 'disetujui' && (
                                                            <span className="text-slate-400 text-xs italic font-medium">
                                                                Sedang dibeli staf
                                                            </span>
                                                        )}
                                                        {item.status === 'ditolak' && (
                                                            <span className="text-slate-400 text-xs italic font-medium">
                                                                Selesai (Ditolak)
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {filtered.length === 0 && (
                                            <tr>
                                                <td colSpan={10} className="p-12 text-center text-slate-400 font-medium">
                                                    Tidak ada data pengadaan yang sesuai dengan filter atau kata kunci pencarian.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ============================================================== */}
            {/* MODAL 1: STAF BELANJA & UPLOAD NOTA */}
            {/* ============================================================== */}
            {itemToPurchase && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                    <Receipt className="w-4 h-4 text-[#006039]" />
                                    Upload Bukti Foto Pembelian &amp; Nota
                                </h3>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    {itemToPurchase.nama_barang} ({itemToPurchase.jumlah} {itemToPurchase.satuan}) • Disetujui Admin untuk Dibeli
                                </p>
                            </div>
                            <button
                                onClick={() => setItemToPurchase(null)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-3 bg-emerald-50/50 border border-emerald-200/80 rounded-xl space-y-1 text-xs">
                            <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-[#006039]" />
                                <span>Ruangan Tujuan: {itemToPurchase.ruangan_tujuan}</span>
                            </div>
                            <div className="text-[11px] text-slate-600">{itemToPurchase.lokasi_penempatan}</div>
                            <div className="text-[10px] text-slate-500">Pengusul: {itemToPurchase.pelapor_nama}</div>
                        </div>

                        <form onSubmit={handleKirimBelanja} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    Tanggal Pembelian <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formBelanja.data.tanggal_pembelian}
                                    onChange={(e) => formBelanja.setData('tanggal_pembelian', e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] outline-hidden"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3 items-end">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">
                                        Harga Satuan Realisasi (Rp) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        required
                                        value={formBelanja.data.estimasi_harga_satuan || ''}
                                        onChange={(e) => formBelanja.setData('estimasi_harga_satuan', parseFloat(e.target.value) || 0)}
                                        placeholder="0"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-[#006039] outline-hidden"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-500 mb-1">Total Biaya Belanja</label>
                                    <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl font-extrabold text-[#006039] text-xs truncate">
                                        Rp {((formBelanja.data.estimasi_harga_satuan || 0) * itemToPurchase.jumlah).toLocaleString('id-ID')}
                                    </div>
                                </div>
                            </div>

                            {/* Upload Bukti Nota */}
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    Upload Foto Bukti Pembelian / Nota Resmi <span className="text-rose-500">*</span>
                                </label>
                                {notaFilePreview ? (
                                    <div className="relative p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                                        <img
                                            src={notaFilePreview}
                                            alt="Preview Foto"
                                            className="w-14 h-14 object-cover rounded-lg border border-slate-200 shadow-2xs"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 text-xs truncate">
                                                {formBelanja.data.foto_bukti_nota?.name}
                                            </p>
                                            <p className="text-[10px] text-slate-500 mt-0.5">Foto siap diunggah</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                formBelanja.setData('foto_bukti_nota', null);
                                                setNotaFilePreview(null);
                                            }}
                                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 hover:border-[#006039] rounded-2xl bg-slate-50/60 hover:bg-emerald-50/30 transition cursor-pointer text-center">
                                        <UploadCloud className="w-6 h-6 text-slate-400 mb-1" />
                                        <span className="text-xs font-bold text-slate-700">Pilih Foto Bukti Pembelian / Nota</span>
                                        <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, atau PDF (Maks 5MB)</span>
                                        <input
                                            type="file"
                                            required
                                            accept="image/*,application/pdf"
                                            onChange={handleFileNotaChange}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                                {formBelanja.errors.foto_bukti_nota && (
                                    <p className="text-rose-600 text-[11px] mt-1">{formBelanja.errors.foto_bukti_nota}</p>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setItemToPurchase(null)}
                                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={formBelanja.processing}
                                    className="px-4 py-2 bg-[#006039] hover:bg-[#0f4c3a] text-white rounded-xl font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                                >
                                    <Check className="w-4 h-4" />
                                    <span>{formBelanja.processing ? 'Menyimpan...' : 'Simpan & Upload Bukti Pembelian'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============================================================== */}
            {/* MODAL 2: ADMIN VALIDASI USULAN (SETUJUI / TOLAK) */}
            {/* ============================================================== */}
            {itemToValidate && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm">
                                    {validationAction === 'disetujui' ? 'Setujui Rencana Pengadaan' : 'Tolak Rencana Pengadaan'}
                                </h3>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    {itemToValidate.nama_barang} ({itemToValidate.kode_pengadaan})
                                </p>
                            </div>
                            <button
                                onClick={() => setItemToValidate(null)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                            <p className="font-bold text-slate-800">Ruangan: {itemToValidate.ruangan_tujuan} ({itemToValidate.lokasi_penempatan})</p>
                            <p className="text-slate-600">Jumlah: {itemToValidate.jumlah} {itemToValidate.satuan}</p>
                            {itemToValidate.total_biaya > 0 && (
                                <p className="font-bold text-[#006039]">
                                    Estimasi Anggaran: Rp {itemToValidate.total_biaya.toLocaleString('id-ID')}
                                </p>
                            )}
                            <p className="text-slate-500 italic">"Alasan: {itemToValidate.alasan_pengadaan}"</p>
                        </div>

                        <form onSubmit={handleValidasiAdmin} className="space-y-4 text-xs">
                            {validationAction === 'disetujui' && (
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">
                                        Tugaskan Staf Pelaksana Belanja
                                    </label>
                                    <select
                                        value={selectedStafId}
                                        onChange={(e) => setSelectedStafId(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-[#006039] outline-hidden"
                                    >
                                        <option value="">-- Semua Staf Sarpras (Terbuka) --</option>
                                        {stafUsers.map((staf) => (
                                            <option key={staf.id} value={String(staf.id)}>
                                                {staf.name} (Staf Sarpras)
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        Staf yang dipilih akan menerima notifikasi tugas belanja dan unggah nota.
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    {validationAction === 'disetujui' ? 'Catatan Tambahan untuk Staf (Opsional)' : 'Alasan Penolakan (Wajib Diisi)'}
                                </label>
                                <textarea
                                    rows={3}
                                    required={validationAction === 'ditolak'}
                                    value={catatanAdmin}
                                    onChange={(e) => setCatatanAdmin(e.target.value)}
                                    placeholder={validationAction === 'disetujui' ? 'Contoh: Disetujui, utamakan yang bergaransi resmi...' : 'Contoh: Anggaran belum mencukupi atau dialihkan ke semester depan...'}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] outline-hidden"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setItemToValidate(null)}
                                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className={`px-4 py-2 text-white rounded-xl font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer ${
                                        validationAction === 'disetujui' ? 'bg-[#006039] hover:bg-[#0f4c3a]' : 'bg-rose-600 hover:bg-rose-700'
                                    }`}
                                >
                                    <Check className="w-4 h-4" />
                                    <span>{validationAction === 'disetujui' ? 'Konfirmasi Setujui' : 'Konfirmasi Tolak'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============================================================== */}
            {/* MODAL 3: AJUKAN PENGADAAN (STAF SARPRAS) */}
            {/* ============================================================== */}
            {isModalTambahOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-xl border border-slate-100 text-xs">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#006039] flex items-center justify-center shrink-0 border border-emerald-100">
                                    <ShoppingCart className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-[#006039] uppercase tracking-wider">
                                        Formulir Usulan Pengadaan
                                    </span>
                                    <h3 className="font-extrabold text-slate-900 text-sm sm:text-base mt-0.5">
                                        Pengajuan Pengadaan Barang &amp; Fasilitas
                                    </h3>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsModalTambahOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleKirimUsulanStaf} className="space-y-4">
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    Nama Sarpras / Barang yang Dibutuhkan <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formUsulanStaf.data.nama_barang}
                                    onChange={(e) => formUsulanStaf.setData('nama_barang', e.target.value)}
                                    placeholder="Contoh: Kabel LAN Cat6 300m, Proyektor Epson, Meja Rapat..."
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] focus:ring-1 focus:ring-[#006039] outline-hidden transition"
                                />
                                {formUsulanStaf.errors.nama_barang && (
                                    <p className="text-rose-600 text-[11px] mt-1">{formUsulanStaf.errors.nama_barang}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">
                                        Kategori Barang <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={formUsulanStaf.data.kategori}
                                        onChange={(e) => formUsulanStaf.setData('kategori', e.target.value)}
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] outline-hidden font-medium"
                                    >
                                        {KATEGORI_SARANA_OPTIONS.map((kat) => (
                                            <option key={kat} value={kat}>
                                                {kat}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">
                                        Ruangan Tujuan / Penempatan <span className="text-rose-500">*</span>
                                    </label>
                                    {allRuanganList.length > 0 ? (
                                        <select
                                            value={formUsulanStaf.data.ruangan_tujuan}
                                            onChange={(e) => formUsulanStaf.setData('ruangan_tujuan', e.target.value)}
                                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] outline-hidden font-medium"
                                        >
                                            {allRuanganList.map((room, idx) => (
                                                <option key={idx} value={room}>
                                                    {room}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            required
                                            value={formUsulanStaf.data.ruangan_tujuan}
                                            onChange={(e) => formUsulanStaf.setData('ruangan_tujuan', e.target.value)}
                                            placeholder="Contoh: Biro Sarpras, Gudang Utama..."
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] outline-hidden"
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">
                                        Jumlah &amp; Satuan <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            required
                                            value={formUsulanStaf.data.jumlah}
                                            onChange={(e) => {
                                                const raw = e.target.value.replace(/\D/g, '');
                                                formUsulanStaf.setData('jumlah', raw === '' ? '' : parseInt(raw, 10));
                                            }}
                                            placeholder="Jml"
                                            className="w-24 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-center font-bold focus:bg-white focus:border-[#006039] outline-hidden"
                                        />
                                        <input
                                            type="text"
                                            required
                                            value={formUsulanStaf.data.satuan}
                                            onChange={(e) => formUsulanStaf.setData('satuan', e.target.value)}
                                            placeholder="Unit / Pcs / Set"
                                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] outline-hidden"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">
                                        Estimasi Harga Satuan (Rp) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        required
                                        value={formUsulanStaf.data.estimasi_harga_satuan || ''}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/\D/g, '');
                                            formUsulanStaf.setData('estimasi_harga_satuan', raw === '' ? '' : parseInt(raw, 10));
                                        }}
                                        placeholder="Contoh: 150000"
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-[#006039] outline-hidden"
                                    />
                                </div>
                            </div>

                            {/* Total Estimasi Anggaran Box */}
                            <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between">
                                <span className="font-semibold text-slate-600 text-xs">Total Estimasi Anggaran:</span>
                                <span className="text-sm font-black text-[#006039]">
                                    Rp {((Number(formUsulanStaf.data.estimasi_harga_satuan) || 0) * (Number(formUsulanStaf.data.jumlah) || 0)).toLocaleString('id-ID')}
                                </span>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    Alasan Pengadaan &amp; Kebutuhan <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    rows={3}
                                    required
                                    value={formUsulanStaf.data.alasan_pengadaan}
                                    onChange={(e) => formUsulanStaf.setData('alasan_pengadaan', e.target.value)}
                                    placeholder="Jelaskan urgensi atau alasan kebutuhan pengadaan fasilitas ini..."
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] outline-hidden"
                                />
                                {formUsulanStaf.errors.alasan_pengadaan && (
                                    <p className="text-rose-600 text-[11px] mt-1">{formUsulanStaf.errors.alasan_pengadaan}</p>
                                )}
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    Spesifikasi Teknis / Keterangan (Opsional)
                                </label>
                                <textarea
                                    rows={2}
                                    value={formUsulanStaf.data.spesifikasi}
                                    onChange={(e) => formUsulanStaf.setData('spesifikasi', e.target.value)}
                                    placeholder="Contoh: Merk Belden, panjang 305m, garansi distributor..."
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] outline-hidden"
                                />
                            </div>

                            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalTambahOpen(false)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={formUsulanStaf.processing}
                                    className="px-5 py-2 bg-[#006039] hover:bg-[#004e2e] active:bg-[#003822] text-white rounded-xl font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                                >
                                    <Check className="w-4 h-4" />
                                    <span>{formUsulanStaf.processing ? 'Mengirim Usulan...' : 'Kirim Usulan Pengadaan'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============================================================== */}
            {/* LIGHTBOX PREVIEW FOTO BUKTI NOTA */}
            {/* ============================================================== */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setPreviewImage(null)}
                >
                    <div
                        className="relative max-w-3xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between text-xs">
                            <span className="font-bold truncate pr-4">{previewImage.title}</span>
                            <button
                                onClick={() => setPreviewImage(null)}
                                className="p-1 hover:bg-white/20 rounded-lg transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-2 overflow-auto max-h-[80vh] flex items-center justify-center bg-slate-950">
                            <img
                                src={previewImage.url}
                                alt="Bukti Nota"
                                className="max-w-full max-h-[75vh] object-contain rounded-lg"
                            />
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
