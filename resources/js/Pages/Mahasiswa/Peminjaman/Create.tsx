import React, { useState, useMemo } from 'react';
import { Head, useForm, Link, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    ClipboardList,
    ArrowLeft,
    UploadCloud,
    Check,
    Package,
    Building2,
    MapPin,
    X,
    Plus,
    UserCheck,
    Calendar,
    CheckCircle2,
    Search,
    ChevronDown,
    Trash2,
    ShieldCheck,
    Camera,
    Sparkles,
    Minus,
    Send,
    Users,
    Layers,
    Compass,
    FileBadge,
    CalendarClock,
    MessageCircle,
} from 'lucide-react';

interface SarprasItem {
    id: number;
    kode: string;
    nama: string;
    jenis: string;
    kategori: string;
    lokasi: string;
    stok_tersedia: number;
    satuan: string;
    foto_url: string | null;
    kondisi_umum: string;
    deskripsi: string | null;
}

interface Props {
    sarprasPilihan: SarprasItem | null;
    sarprasTersedia: SarprasItem[];
    initialSarprasId: number | null;
}

const FAKULTAS_PRODI_UNUHA: {
    fakultas: string;
    kode: string;
    prodiList: string[];
}[] = [
    {
        fakultas: 'Fakultas Sains dan Teknologi (FST)',
        kode: 'FST',
        prodiList: [
            'S1 Informatika',
            'S1 Matematika',
            'S1 Sains Pertanian',
            'S1 Peternakan',
        ],
    },
    {
        fakultas: 'Fakultas Ilmu Pendidikan (FIP)',
        kode: 'FIP',
        prodiList: [
            'S1 Pendidikan Bahasa dan Sastra Indonesia',
            'S1 Pendidikan Bahasa Inggris',
            'S1 Pendidikan Ekonomi',
            'S1 Pendidikan Fisika',
            'S1 Pendidikan Teknologi Informasi (PTI)',
            'S1 Pendidikan Kepelatihan Olahraga',
        ],
    },
    {
        fakultas: 'Fakultas Agama Islam (FAI)',
        kode: 'FAI',
        prodiList: [
            'S1 Pendidikan Agama Islam (PAI)',
            'S1 Pendidikan Guru Madrasah Ibtidaiyah (PGMI)',
            'S1 Pendidikan Bahasa Arab',
        ],
    },
    {
        fakultas: 'Sekolah Pascasarjana',
        kode: 'Pascasarjana',
        prodiList: [
            'S2 Pendidikan Agama Islam',
        ],
    },
];

export default function PeminjamanCreate({
    sarprasPilihan,
    sarprasTersedia = [],
    initialSarprasId,
}: Props) {
    const { auth, flash } = usePage().props as any;
    const userRole = (auth?.user?.role as string) || '';
    const isUmum = !auth?.user?.nomor_induk || userRole === 'umum';
    const isPicRuangan = userRole === 'staf_ruangan' || userRole === 'kepala_bagian' || userRole === 'staf';

    const [ktmFileName, setKtmFileName] = useState<string | null>(null);
    const profileFakultas: string = !isUmum ? auth?.user?.fakultas || '' : '';
    const profileProdi: string = !isUmum && profileFakultas ? auth?.user?.prodi || '' : '';
    const [selectedFakultas, setSelectedFakultas] = useState<string>(profileFakultas);
    const [selectedProdi, setSelectedProdi] = useState<string>(profileProdi);
    const [clientError, setClientError] = useState<string | null>(null);

    const todayDateString = useMemo(() => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }, []);

    // State Modal Pemilih Fasilitas (untuk "+ Tambah Fasilitas Lain" atau "Pilih dari Katalog")
    const [showPickerModal, setShowPickerModal] = useState(false);
    const [pickerTargetIndex, setPickerTargetIndex] = useState<number | null>(null);
    const [pickerSearch, setPickerSearch] = useState('');
    const [pickerFilterJenis, setPickerFilterJenis] = useState<'semua' | 'sarana' | 'prasarana'>('semua');

    const defaultSarprasId = initialSarprasId || sarprasPilihan?.id || sarprasTersedia[0]?.id || 1;

    // Form Pengajuan
    const { data, setData, post, processing, errors } = useForm({
        nama_peminjam: auth?.user?.name || '',
        nim_nip: auth?.user?.nomor_induk || '',
        instansi_prodi: isUmum
            ? 'Masyarakat Umum / Pribadi'
            : profileFakultas && profileProdi
              ? `${profileProdi} - ${profileFakultas}`
              : '',
        no_whatsapp: auth?.user?.no_hp || '08',
        keperluan: '',
        tanggal_mulai: '',
        tanggal_kembali_rencana: '',
        file_ktm: null as File | null,
        items: [
            {
                sarpras_id: defaultSarprasId,
                qty: 1,
            },
        ],
    });

    const activeProdiOptions = useMemo(() => {
        const found = FAKULTAS_PRODI_UNUHA.find((f) => f.fakultas === selectedFakultas);
        return found ? found.prodiList : [];
    }, [selectedFakultas]);

    const handleFakultasChange = (fakultasValue: string) => {
        // Program Studi tidak diisi otomatis — mahasiswa memilih sendiri agar tidak salah
        setSelectedFakultas(fakultasValue);
        setSelectedProdi('');
        setData('instansi_prodi', '');
        setClientError(null);
    };

    const handleProdiChange = (prodiValue: string) => {
        setSelectedProdi(prodiValue);
        setData('instansi_prodi', prodiValue ? `${prodiValue} - ${selectedFakultas}` : '');
        setClientError(null);
    };

    const handleKtmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setData('file_ktm', file);
        setKtmFileName(file ? file.name : null);
        setClientError(null);
    };

    const openAddFacilityModal = () => {
        setPickerTargetIndex(null);
        setPickerSearch('');
        setPickerFilterJenis('semua');
        setShowPickerModal(true);
    };

    const openChangeFacilityModal = (index: number) => {
        setPickerTargetIndex(index);
        setPickerSearch('');
        setPickerFilterJenis('semua');
        setShowPickerModal(true);
    };

    const handleSelectFacilityFromModal = (sarpras: SarprasItem) => {
        if (pickerTargetIndex !== null) {
            const newItems = [...data.items];
            newItems[pickerTargetIndex] = {
                sarpras_id: sarpras.id,
                qty: Math.min(newItems[pickerTargetIndex].qty, sarpras.stok_tersedia || 1),
            };
            setData('items', newItems);
        } else {
            const existingIdx = data.items.findIndex((it) => it.sarpras_id === sarpras.id);
            if (existingIdx !== -1) {
                const newItems = [...data.items];
                const maxStok = sarpras.stok_tersedia || 1;
                if (newItems[existingIdx].qty < maxStok) {
                    newItems[existingIdx].qty += 1;
                    setData('items', newItems);
                }
            } else {
                const updated = [...data.items, { sarpras_id: sarpras.id, qty: 1 }];
                setData('items', updated);
            }
        }
        setShowPickerModal(false);
    };

    const handleRemoveItem = (index: number) => {
        const updated = data.items.filter((_, idx) => idx !== index);
        setData('items', updated);
    };

    const handleQtyStep = (index: number, delta: number, maxStok: number) => {
        const newItems = [...data.items];
        const nextQty = Math.max(1, Math.min(maxStok, (newItems[index].qty || 1) + delta));
        newItems[index].qty = nextQty;
        setData('items', newItems);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setClientError(null);

        if (!isUmum && (!selectedFakultas || !selectedProdi)) {
            setClientError('Silakan pilih Fakultas / Pascasarjana dan Program Studi terlebih dahulu.');
            return;
        }

        if (!data.items || data.items.length === 0) {
            setClientError('Silakan pilih minimal 1 fasilitas yang ingin dipinjam.');
            return;
        }

        if (!data.file_ktm) {
            setClientError(
                isUmum
                    ? 'Foto / berkas Kartu Tanda Penduduk (KTP) wajib diunggah.'
                    : isPicRuangan
                      ? 'Foto / berkas kartu identitas pegawai / tanda pengenal wajib diunggah.'
                      : 'Foto / berkas Kartu Tanda Mahasiswa (KTM) wajib diunggah.'
            );
            return;
        }

        if (!data.tanggal_mulai || !data.tanggal_kembali_rencana) {
            setClientError('Silakan tentukan Tanggal Mulai dan Tanggal Selesai peminjaman.');
            return;
        }

        if (data.tanggal_mulai < todayDateString) {
            setClientError('Tanggal mulai peminjaman tidak boleh sebelum tanggal hari ini.');
            return;
        }

        if (data.tanggal_kembali_rencana < data.tanggal_mulai) {
            setClientError('Tanggal selesai peminjaman tidak boleh lebih awal dari tanggal mulai.');
            return;
        }

        if (!data.keperluan.trim()) {
            setClientError('Silakan isi Keperluan / Alasan Peminjaman terlebih dahulu.');
            return;
        }

        post('/layanan/peminjaman', {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const allErrorMessages = useMemo(() => {
        const list: string[] = [];
        if (clientError) {
            list.push(clientError);
        }
        if (flash?.error) {
            list.push(flash.error);
        }
        Object.values(errors).forEach((msg) => {
            if (msg && !list.includes(msg)) {
                list.push(msg);
            }
        });
        return list;
    }, [clientError, flash, errors]);

    const filteredPickerSarpras = useMemo(() => {
        return sarprasTersedia.filter((s) => {
            const matchJenis = pickerFilterJenis === 'semua' || s.jenis === pickerFilterJenis;
            const q = pickerSearch.trim().toLowerCase();
            const matchSearch =
                !q ||
                s.nama.toLowerCase().includes(q) ||
                s.kode.toLowerCase().includes(q) ||
                s.kategori.toLowerCase().includes(q) ||
                s.lokasi.toLowerCase().includes(q);
            return matchJenis && matchSearch;
        });
    }, [sarprasTersedia, pickerFilterJenis, pickerSearch]);

    const alurSteps = [
        {
            step: 'STEP 1',
            title: 'Pengajuan Terkirim',
            desc: 'Formulir tercatat di sistem dan dapat dipantau pada menu Layanan Peminjaman.',
            icon: Send,
            iconBg: 'bg-gradient-to-br from-[#006039] to-emerald-700 text-white shadow-sm shadow-emerald-900/20',
            badgeBg: 'bg-emerald-100 text-[#006039] border-emerald-200',
            cardStyle: 'bg-emerald-50/60 border-emerald-200/90',
        },
        {
            step: 'STEP 2',
            title: 'Validasi Admin Sarpras',
            desc: `Admin memverifikasi berkas ${isUmum ? 'KTP' : isPicRuangan ? 'identitas pegawai' : 'KTM'} serta ketersediaan jadwal fasilitas.`,
            icon: ShieldCheck,
            iconBg: 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-900/15',
            badgeBg: 'bg-blue-50 text-blue-700 border-blue-200/80',
            cardStyle: 'bg-white border-slate-200/80 hover:border-blue-200',
        },
        {
            step: 'STEP 3',
            title: 'Pembagian Staf Bertugas',
            desc: 'Staf loket ditugaskan menyiapkan barang/ruangan beserta lokasi pengambilan.',
            icon: Users,
            iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-900/15',
            badgeBg: 'bg-amber-50 text-amber-800 border-amber-200/80',
            cardStyle: 'bg-white border-slate-200/80 hover:border-amber-200',
        },
        {
            step: 'STEP 4',
            title: 'Upload Bukti Terima (Sukses)',
            desc: `Tunjukkan ${isUmum ? 'KTP' : isPicRuangan ? 'tanda pengenal' : 'KTM'} asli di loket, lalu unggah foto barang diterima hingga Sukses.`,
            icon: Camera,
            iconBg: 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-sm shadow-teal-900/15',
            badgeBg: 'bg-teal-50 text-teal-800 border-teal-200/80',
            cardStyle: 'bg-white border-slate-200/80 hover:border-teal-200',
        },
    ];

    return (
        <AdminLayout>
            <Head title="Formulir Pengajuan Peminjaman - Biro Sarpras UNUHA" />

            <div className="max-w-6xl mx-auto space-y-4 pb-14 px-2 sm:px-4 font-sans text-slate-800 text-xs">
                {/* 1. HEADER HALAMAN & TOMBOL KEMBALI */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                        Formulir Pengajuan Peminjaman
                    </h1>
                    <Link
                        href="/layanan/sarpras"
                        className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer self-start sm:self-auto shadow-2xs"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Kembali ke Katalog</span>
                    </Link>
                </div>

                {/* 2. KARTU ALUR PEMINJAMAN (MENARIK & SIMPEL) */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                    {/* Header Alur & Catatan WhatsApp */}
                    <div className="px-4 sm:px-5 py-3 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">
                                Alur Proses Peminjaman
                            </span>
                            <span className="text-[11px] text-slate-400 hidden sm:inline">•</span>
                            <span className="text-[11px] text-slate-500 hidden sm:inline">
                                4 Tahap praktis dari pengajuan hingga barang diterima
                            </span>
                        </div>

                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] text-emerald-950 font-medium self-start sm:self-auto">
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>
                                Pastikan nomor <strong>WhatsApp aktif</strong> agar petugas dapat menghubungi Anda.
                            </span>
                        </div>
                    </div>

                    {/* 4 Langkah Alur Terpadu */}
                    <div className="p-3.5 sm:p-4">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                            {/* Langkah 1 */}
                            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 relative">
                                <div className="w-9 h-9 rounded-xl bg-[#006039] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                                    <Send className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-extrabold text-[#006039] uppercase tracking-wider">
                                            Tahap 1
                                        </span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#006039]"></span>
                                    </div>
                                    <h4 className="font-bold text-xs text-slate-900 truncate">Pengajuan Terkirim</h4>
                                    <p className="text-[10px] text-slate-500 truncate">Formulir masuk ke sistem</p>
                                </div>
                            </div>

                            {/* Langkah 2 */}
                            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 text-slate-800">
                                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                                    <UserCheck className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                        Tahap 2
                                    </span>
                                    <h4 className="font-bold text-xs text-slate-800 truncate">Validasi Admin</h4>
                                    <p className="text-[10px] text-slate-500 truncate">Cek berkas &amp; jadwal</p>
                                </div>
                            </div>

                            {/* Langkah 3 */}
                            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 text-slate-800">
                                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0">
                                    <Users className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                        Tahap 3
                                    </span>
                                    <h4 className="font-bold text-xs text-slate-800 truncate">Penyiapan Staf</h4>
                                    <p className="text-[10px] text-slate-500 truncate">Penugasan serah terima</p>
                                </div>
                            </div>

                            {/* Langkah 4 */}
                            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 text-slate-800">
                                <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center font-bold text-xs shrink-0">
                                    <Check className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                        Tahap 4
                                    </span>
                                    <h4 className="font-bold text-xs text-slate-800 truncate">Selesai / Terima</h4>
                                    <p className="text-[10px] text-slate-500 truncate">Serah terima di loket</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. FORMULIR PENGAJUAN UTAMA */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs">
                    <form onSubmit={handleSubmit} className="space-y-6 text-xs">
                        {allErrorMessages.length > 0 && (
                            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
                                <p className="font-bold text-xs text-rose-900">
                                    Mohon periksa kembali formulir pengajuan Anda:
                                </p>
                                <ul className="list-disc list-inside text-[11px] font-medium space-y-0.5">
                                    {allErrorMessages.map((msg, i) => (
                                        <li key={i}>{msg}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* 1. IDENTITAS MAHASISWA / PEMINJAM */}
                        <div className="space-y-3.5">
                            <h3 className="font-bold text-slate-900 text-sm">
                                {isUmum
                                    ? '1. Identitas Peminjam (Umum)'
                                    : isPicRuangan
                                      ? '1. Identitas Peminjam'
                                      : '1. Identitas Mahasiswa / Peminjam'}
                            </h3>

                            {isUmum ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">
                                            Nama Lengkap Peminjam <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={data.nama_peminjam}
                                            onChange={(e) => setData('nama_peminjam', e.target.value)}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#006039] outline-hidden"
                                        />
                                        {errors.nama_peminjam && (
                                            <p className="text-rose-600 text-[11px] mt-1">{errors.nama_peminjam}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">
                                            NIK / Nomor Identitas <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={data.nim_nip}
                                            onChange={(e) => setData('nim_nip', e.target.value)}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-[#006039] outline-hidden"
                                        />
                                        {errors.nim_nip && (
                                            <p className="text-rose-600 text-[11px] mt-1">{errors.nim_nip}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">
                                            Nomor WhatsApp Aktif <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={data.no_whatsapp}
                                            onChange={(e) => setData('no_whatsapp', e.target.value)}
                                            placeholder="08xxxxxxxxxx"
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#006039] outline-hidden"
                                        />
                                        {errors.no_whatsapp && (
                                            <p className="text-rose-600 text-[11px] mt-1">{errors.no_whatsapp}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">
                                            Instansi / Asal Peminjam <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={data.instansi_prodi}
                                            onChange={(e) => setData('instansi_prodi', e.target.value)}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#006039] outline-hidden"
                                        />
                                        {errors.instansi_prodi && (
                                            <p className="text-rose-600 text-[11px] mt-1">{errors.instansi_prodi}</p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3.5">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                        <div>
                                            <label className="block font-bold text-slate-700 mb-1">
                                                Nama Lengkap Peminjam <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={data.nama_peminjam}
                                                onChange={(e) => setData('nama_peminjam', e.target.value)}
                                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#006039] outline-hidden"
                                            />
                                            {errors.nama_peminjam && (
                                                <p className="text-rose-600 text-[11px] mt-1">{errors.nama_peminjam}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block font-bold text-slate-700 mb-1">
                                                {isPicRuangan ? 'NIP.Y' : 'NIM (Nomor Induk Mahasiswa)'} <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={data.nim_nip}
                                                onChange={(e) => setData('nim_nip', e.target.value)}
                                                placeholder={isPicRuangan ? 'Contoh: KPB-2026-001' : 'Contoh: 2355202065'}
                                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-[#006039] outline-hidden"
                                            />
                                            {errors.nim_nip && (
                                                <p className="text-rose-600 text-[11px] mt-1">{errors.nim_nip}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block font-bold text-slate-700 mb-1">
                                                Nomor WhatsApp Aktif <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={data.no_whatsapp}
                                                onChange={(e) => setData('no_whatsapp', e.target.value)}
                                                placeholder="08xxxxxxxxxx"
                                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#006039] outline-hidden"
                                            />
                                            {errors.no_whatsapp && (
                                                <p className="text-rose-600 text-[11px] mt-1">{errors.no_whatsapp}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 rounded-xl bg-emerald-50/40 border border-emerald-200/70">
                                        <div>
                                            <label className="block font-bold text-slate-700 mb-1">
                                                Fakultas / Pascasarjana (UNUHA) <span className="text-rose-500">*</span>
                                            </label>
                                            <select
                                                required
                                                value={selectedFakultas}
                                                onChange={(e) => handleFakultasChange(e.target.value)}
                                                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:border-[#006039] outline-hidden cursor-pointer"
                                            >
                                                <option value="" disabled>
                                                    -- Pilih Fakultas / Pascasarjana --
                                                </option>
                                                {FAKULTAS_PRODI_UNUHA.map((item) => (
                                                    <option key={item.fakultas} value={item.fakultas}>
                                                        {item.fakultas}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block font-bold text-slate-700 mb-1">
                                                Program Studi <span className="text-rose-500">*</span>
                                            </label>
                                            <select
                                                required
                                                value={selectedProdi}
                                                onChange={(e) => handleProdiChange(e.target.value)}
                                                disabled={!selectedFakultas}
                                                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:border-[#006039] outline-hidden cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
                                            >
                                                <option value="" disabled>
                                                    {selectedFakultas
                                                        ? '-- Pilih Program Studi --'
                                                        : 'Pilih Fakultas terlebih dahulu'}
                                                </option>
                                                {activeProdiOptions.map((prodi) => (
                                                    <option key={prodi} value={prodi}>
                                                        {prodi}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.instansi_prodi && (
                                                <p className="text-rose-600 text-[11px] mt-1">{errors.instansi_prodi}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Upload Identitas (KTM / KTP / Tanda Pengenal) - WAJIB DIISI */}
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    {isUmum
                                        ? 'Unggah Kartu Tanda Penduduk (KTP)'
                                        : isPicRuangan
                                          ? 'Unggah Tanda Pengenal / Kartu Pegawai'
                                          : 'Unggah Kartu Tanda Mahasiswa (KTM)'}{' '}
                                    <span className="text-rose-500 font-extrabold">*</span>{' '}
                                    <span className="text-rose-600 font-bold text-[11px]">(Wajib Diisi)</span>{' '}
                                    <span className="text-slate-400 font-normal">(JPG / PNG / PDF, Maks 5MB)</span>
                                </label>
                                <label className={`block w-full sm:max-w-md p-3 border-2 border-dashed rounded-xl transition cursor-pointer text-xs ${
                                    errors.file_ktm || (!data.file_ktm && clientError?.includes('KTM'))
                                        ? 'border-rose-400 bg-rose-50/50 hover:bg-rose-50'
                                        : ktmFileName
                                          ? 'border-emerald-400 bg-emerald-50/40'
                                          : 'border-slate-300 hover:border-[#006039] bg-slate-50/60 hover:bg-emerald-50/30'
                                }`}>
                                    {ktmFileName ? (
                                        <div className="flex items-center gap-2 font-bold text-[#006039]">
                                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                                            <span className="truncate">{ktmFileName}</span>
                                            <span className="ml-auto text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">Siap Diunggah</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <UploadCloud className="w-4 h-4 text-slate-400 shrink-0" />
                                            <span>Klik untuk memilih berkas {isUmum ? 'KTP' : isPicRuangan ? 'identitas / kartu pegawai' : 'KTM'} wajib (Maks 5MB)</span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*,application/pdf"
                                        onChange={handleKtmChange}
                                        className="hidden"
                                    />
                                </label>
                                {errors.file_ktm && (
                                    <p className="text-rose-600 text-[11px] font-semibold mt-1">{errors.file_ktm}</p>
                                )}
                            </div>
                        </div>

                        {/* 2. FASILITAS YANG DIAJUKAN */}
                        <div className="p-4 sm:p-5 rounded-2xl border border-emerald-200/90 bg-emerald-50/20 space-y-3.5">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-slate-900 text-sm">
                                        2. Fasilitas yang Diajukan
                                    </h3>
                                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#006039] font-bold text-[11px]">
                                        {data.items.length} Fasilitas
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={openAddFacilityModal}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#006039] hover:bg-[#0f4c3a] text-white rounded-xl font-bold text-xs shadow-2xs transition cursor-pointer shrink-0"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Tambah Fasilitas Lain</span>
                                </button>
                            </div>

                            <div className="space-y-2.5">
                                {data.items.map((it, idx) => {
                                    const currentItem = sarprasTersedia.find((s) => s.id === it.sarpras_id);
                                    const isRuangan = currentItem?.jenis === 'prasarana';
                                    const maxStok = currentItem?.stok_tersedia || 99;

                                    return (
                                        <div
                                            key={idx}
                                            className="p-3 bg-white rounded-xl border border-emerald-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#006039] flex items-center justify-center shrink-0 border border-emerald-200/60">
                                                    {isRuangan ? (
                                                        <Building2 className="w-5 h-5" />
                                                    ) : (
                                                        <Package className="w-5 h-5" />
                                                    )}
                                                </div>

                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-slate-900 text-xs truncate">
                                                        {currentItem?.nama || 'Fasilitas'} (Tersedia: {currentItem?.stok_tersedia || 0} {currentItem?.satuan || 'Unit'})
                                                    </h4>
                                                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                                                        {isRuangan ? 'Prasarana / Ruangan' : 'Sarana / Peralatan'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                                <div className="text-right">
                                                    <span className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                                                        Jumlah ({currentItem?.satuan || 'Unit'}):
                                                    </span>
                                                    <div className="inline-flex items-center border border-slate-200 rounded-lg bg-slate-50 p-0.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleQtyStep(idx, -1, maxStok)}
                                                            disabled={it.qty <= 1}
                                                            className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-white disabled:opacity-40 transition cursor-pointer"
                                                        >
                                                            <Minus className="w-3 h-3" />
                                                        </button>
                                                        <span className="w-8 text-center font-bold text-slate-900 text-xs">
                                                            {it.qty}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleQtyStep(idx, 1, maxStok)}
                                                            disabled={it.qty >= maxStok}
                                                            className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-white disabled:opacity-40 transition cursor-pointer"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {data.items.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(idx)}
                                                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                                        title="Hapus fasilitas"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {errors.items && (
                                <p className="text-rose-600 text-[11px] font-semibold">{errors.items}</p>
                            )}
                        </div>

                        {/* 3. JADWAL PENGGUNAAN & KEPERLUAN ACARA */}
                        <div className="space-y-3.5">
                            <h3 className="font-bold text-slate-900 text-sm">
                                3. Jadwal Penggunaan &amp; Keperluan Acara
                            </h3>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 items-start">
                                <div>
                                    <label className="block font-bold text-slate-700 text-xs mb-1">
                                        Tanggal &amp; Waktu Mulai <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        min={todayDateString}
                                        value={data.tanggal_mulai}
                                        onChange={(e) => {
                                            const newStart = e.target.value;
                                            setData((prev) => {
                                                const shouldAdjustEnd =
                                                    prev.tanggal_kembali_rencana &&
                                                    prev.tanggal_kembali_rencana < newStart;
                                                return {
                                                    ...prev,
                                                    tanggal_mulai: newStart,
                                                    tanggal_kembali_rencana: shouldAdjustEnd
                                                        ? newStart
                                                        : prev.tanggal_kembali_rencana,
                                                };
                                            });
                                        }}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] outline-hidden font-medium text-slate-800"
                                    />
                                    {errors.tanggal_mulai && (
                                        <p className="text-rose-600 text-[11px] mt-1">{errors.tanggal_mulai}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 text-xs mb-1">
                                        Tanggal &amp; Waktu Selesai <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        min={data.tanggal_mulai || todayDateString}
                                        value={data.tanggal_kembali_rencana}
                                        onChange={(e) => setData('tanggal_kembali_rencana', e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] outline-hidden font-medium text-slate-800"
                                    />
                                    {errors.tanggal_kembali_rencana && (
                                        <p className="text-rose-600 text-[11px] mt-1">
                                            {errors.tanggal_kembali_rencana}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 text-xs mb-1">
                                        Keperluan / Alasan Peminjaman <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        rows={2}
                                        required
                                        value={data.keperluan}
                                        onChange={(e) => setData('keperluan', e.target.value)}
                                        placeholder="Tuliskan detail agenda pemakaian fasilitas kampus di sini (contoh: Rapat Anggota, Seminar, dll)..."
                                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] outline-hidden resize-none h-[72px]"
                                    />
                                    {errors.keperluan && (
                                        <p className="text-rose-600 text-[11px] mt-1">{errors.keperluan}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {allErrorMessages.length > 0 && (
                            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
                                <p className="font-bold text-xs text-rose-900">
                                    Gagal Mengirim Pengajuan:
                                </p>
                                <ul className="list-disc list-inside text-[11px] font-medium space-y-0.5">
                                    {allErrorMessages.map((msg, i) => (
                                        <li key={i}>{msg}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* TOMBOL AKSI */}
                        <div className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-3">
                            <Link
                                href="/layanan/sarpras"
                                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold text-xs text-center transition cursor-pointer"
                            >
                                Batal &amp; Kembali ke Katalog
                            </Link>

                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center justify-center gap-1.5 px-5 py-2 bg-[#006039] hover:bg-[#0f4c3a] text-white rounded-xl font-bold text-xs shadow-xs transition cursor-pointer disabled:opacity-60"
                            >
                                <Check className="w-4 h-4" />
                                <span>
                                    {processing ? 'Mengirim Formulir...' : 'Kirim Pengajuan Peminjaman'}
                                </span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* MODAL PEMILIH FASILITAS (KETIKA KLIK "+ TAMBAH FASILITAS LAIN" ATAU "PILIH DARI KATALOG") */}
            {showPickerModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        {/* Header Modal */}
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/70">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#006039] to-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                                    <Layers className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm">
                                        {pickerTargetIndex !== null
                                            ? `Ganti Fasilitas Pilihan #${pickerTargetIndex + 1}`
                                            : 'Pilih Fasilitas yang Ingin Ditambahkan'}
                                    </h3>
                                    <p className="text-[11px] text-slate-500">
                                        Cari dan klik tombol Pilih pada sarana atau prasarana yang Anda butuhkan.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowPickerModal(false)}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Filter & Search Bar */}
                        <div className="p-4 border-b border-slate-100 space-y-3 bg-white">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                                <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200/70">
                                    {[
                                        { id: 'semua', label: 'Semua Fasilitas' },
                                        { id: 'sarana', label: 'Sarana (Alat)' },
                                        { id: 'prasarana', label: 'Prasarana (Ruang)' },
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setPickerFilterJenis(tab.id as any)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                                pickerFilterJenis === tab.id
                                                    ? 'bg-[#006039] text-white shadow-2xs'
                                                    : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="relative flex-1 sm:max-w-xs">
                                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={pickerSearch}
                                        onChange={(e) => setPickerSearch(e.target.value)}
                                        placeholder="Cari nama barang, ruangan, lokasi..."
                                        className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] outline-hidden"
                                        autoFocus
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Daftar Fasilitas Tersedia */}
                        <div className="p-4 overflow-y-auto flex-1 space-y-2.5 bg-slate-50/50">
                            {filteredPickerSarpras.length === 0 ? (
                                <div className="py-12 text-center space-y-2">
                                    <Package className="w-8 h-8 text-slate-300 mx-auto" />
                                    <p className="text-xs font-bold text-slate-600">
                                        Tidak ada fasilitas yang cocok dengan pencarian Anda.
                                    </p>
                                    <p className="text-[11px] text-slate-400">
                                        Coba gunakan kata kunci lain atau ubah filter kategori di atas.
                                    </p>
                                </div>
                            ) : (
                                filteredPickerSarpras.map((item) => {
                                    const isAlreadySelected = data.items.some((it) => it.sarpras_id === item.id);
                                    const isRuangan = item.jenis === 'prasarana';

                                    return (
                                        <div
                                            key={item.id}
                                            className={`p-3.5 rounded-xl border bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                                                isAlreadySelected
                                                    ? 'border-emerald-300 bg-emerald-50/30'
                                                    : 'border-slate-200 hover:border-[#006039]'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3 min-w-0">
                                                {item.foto_url ? (
                                                    <img
                                                        src={item.foto_url}
                                                        alt={item.nama}
                                                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                                                    />
                                                ) : (
                                                    <div
                                                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                                                            isRuangan
                                                                ? 'bg-gradient-to-br from-emerald-50 to-teal-100/80 border-emerald-200 text-[#006039]'
                                                                : 'bg-gradient-to-br from-blue-50 to-indigo-100/70 border-blue-200 text-blue-700'
                                                        }`}
                                                    >
                                                        {isRuangan ? (
                                                            <Building2 className="w-5 h-5" />
                                                        ) : (
                                                            <Package className="w-5 h-5" />
                                                        )}
                                                    </div>
                                                )}

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-bold text-[10px]">
                                                            {item.kode}
                                                        </span>
                                                        <span
                                                            className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                                                isRuangan
                                                                    ? 'bg-emerald-50 text-[#006039]'
                                                                    : 'bg-blue-50 text-blue-700'
                                                            }`}
                                                        >
                                                            {isRuangan ? 'Ruangan' : 'Peralatan'}
                                                        </span>
                                                        {item.kategori && (
                                                            <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-50/70 text-[#006039] border border-emerald-200/60">
                                                                {item.kategori}
                                                            </span>
                                                        )}
                                                        {isAlreadySelected && (
                                                            <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[10px]">
                                                                Sudah di Daftar
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm mt-1 truncate">
                                                        {item.nama}
                                                    </h4>
                                                    <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-slate-500">
                                                        <span className="inline-flex items-center gap-1">
                                                            <MapPin className="w-3 h-3 text-[#006039]" />
                                                            {item.lokasi}
                                                        </span>
                                                        <span className="font-semibold text-[#006039]">
                                                            Stok: {item.stok_tersedia} {item.satuan}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleSelectFacilityFromModal(item)}
                                                className="px-4 py-2 bg-[#006039] hover:bg-[#0f4c3a] text-white rounded-xl font-bold text-xs transition shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                                            >
                                                <Check className="w-3.5 h-3.5" />
                                                <span>
                                                    {pickerTargetIndex !== null
                                                        ? 'Pilih Ini'
                                                        : isAlreadySelected
                                                          ? '+ Tambah Jumlah'
                                                          : 'Pilih Fasilitas'}
                                                </span>
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer Modal */}
                        <div className="px-5 py-3 border-t border-slate-100 bg-white flex items-center justify-between text-xs">
                            <span className="text-slate-500">
                                Menampilkan <strong>{filteredPickerSarpras.length}</strong> fasilitas siap dipinjam
                            </span>
                            <button
                                type="button"
                                onClick={() => setShowPickerModal(false)}
                                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition cursor-pointer"
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
