import React, { useState, useMemo } from 'react';
import { Head, useForm, Link, usePage, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    ClipboardList,
    ArrowLeft,
    UploadCloud,
    Package,
    Building2,
    MapPin,
    X,
    Plus,
    Calendar,
    Search,
    Trash2,
    Minus,
    Send,
    Users,
    FileBadge,
    CalendarClock,
    MessageCircle,
    Eye,
    AlertTriangle,
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

interface PeminjamanItemData {
    id: number;
    sarpras_id: number;
    qty: number;
    sarpras?: SarprasItem;
}

interface PeminjamanData {
    id: number;
    kode_transaksi: string;
    nama_peminjam: string;
    nim_nip: string;
    instansi_prodi: string;
    no_whatsapp: string;
    keperluan: string;
    tanggal_mulai: string;
    tanggal_kembali_rencana: string;
    file_ktm: string | null;
    file_surat_pengantar: string | null;
    status: string;
    items: PeminjamanItemData[];
}

interface Props {
    peminjaman: PeminjamanData;
    sarprasTersedia: SarprasItem[];
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

export default function PeminjamanEdit({
    peminjaman,
    sarprasTersedia = [],
}: Props) {
    const { auth } = usePage().props as any;
    const userRole = (auth?.user?.role as string) || '';
    const isUmum = !auth?.user?.nomor_induk || userRole === 'umum';
    const isPicRuangan = userRole === 'staf_ruangan' || userRole === 'kepala_bagian' || userRole === 'staf';

    const formatDateForInput = (d: string) => {
        if (!d) return '';
        try {
            return d.substring(0, 10);
        } catch {
            return '';
        }
    };

    const [ktmFileName, setKtmFileName] = useState<string | null>(null);
    const [clientError, setClientError] = useState<string | null>(null);

    const todayDateString = useMemo(() => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }, []);

    // Parse fakultas & prodi dari instansi_prodi jika ada format "Prodi - Fakultas"
    const parsedFakultasProdi = useMemo(() => {
        if (peminjaman.instansi_prodi && peminjaman.instansi_prodi.includes(' - ')) {
            const parts = peminjaman.instansi_prodi.split(' - ');
            return { prodi: parts[0]?.trim() || '', fakultas: parts[1]?.trim() || '' };
        }
        return { prodi: '', fakultas: '' };
    }, [peminjaman.instansi_prodi]);

    const [selectedFakultas, setSelectedFakultas] = useState<string>(parsedFakultasProdi.fakultas);
    const [selectedProdi, setSelectedProdi] = useState<string>(parsedFakultasProdi.prodi);

    // State Modal Pemilih Fasilitas
    const [showPickerModal, setShowPickerModal] = useState(false);
    const [pickerSearch, setPickerSearch] = useState('');
    const [pickerFilterJenis, setPickerFilterJenis] = useState<'semua' | 'sarana' | 'prasarana'>('semua');

    // Initial items mapping
    const initialItems = peminjaman.items && peminjaman.items.length > 0
        ? peminjaman.items.map((it) => ({
              sarpras_id: it.sarpras_id,
              qty: it.qty,
          }))
        : [
              {
                  sarpras_id: sarprasTersedia[0]?.id || 1,
                  qty: 1,
              },
          ];

    // Form Edit
    const { data, setData, processing, errors } = useForm({
        nama_peminjam: peminjaman.nama_peminjam || '',
        nim_nip: peminjaman.nim_nip || '',
        instansi_prodi: peminjaman.instansi_prodi || '',
        no_whatsapp: peminjaman.no_whatsapp || '08',
        keperluan: peminjaman.keperluan || '',
        tanggal_mulai: formatDateForInput(peminjaman.tanggal_mulai),
        tanggal_kembali_rencana: formatDateForInput(peminjaman.tanggal_kembali_rencana),
        file_ktm: null as File | null,
        items: initialItems,
    });

    const prodiOptions = useMemo(() => {
        if (!selectedFakultas) return [];
        const found = FAKULTAS_PRODI_UNUHA.find((f) => f.fakultas === selectedFakultas);
        return found ? found.prodiList : [];
    }, [selectedFakultas]);

    const handleFakultasChange = (fakultas: string) => {
        setSelectedFakultas(fakultas);
        setSelectedProdi('');
        setData('instansi_prodi', fakultas);
    };

    const handleProdiChange = (prodi: string) => {
        setSelectedProdi(prodi);
        if (selectedFakultas && prodi) {
            setData('instansi_prodi', `${prodi} - ${selectedFakultas}`);
        } else if (prodi) {
            setData('instansi_prodi', prodi);
        }
    };

    const handleQtyStep = (index: number, delta: number, maxStok: number) => {
        const next = [...data.items];
        const currentQty = next[index].qty || 1;
        const newQty = Math.max(1, Math.min(maxStok, currentQty + delta));
        next[index] = { ...next[index], qty: newQty };
        setData('items', next);
    };

    const handleRemoveItem = (index: number) => {
        if (data.items.length <= 1) {
            setClientError('Minimal harus ada 1 fasilitas yang diajukan.');
            return;
        }
        setData(
            'items',
            data.items.filter((_, i) => i !== index)
        );
    };

    const handleAddFacilityFromPicker = (sarpras: SarprasItem) => {
        const existingIdx = data.items.findIndex((it) => it.sarpras_id === sarpras.id);
        if (existingIdx >= 0) {
            const currentQty = data.items[existingIdx].qty;
            const maxStok = sarpras.stok_tersedia || 99;
            if (currentQty < maxStok) {
                handleQtyStep(existingIdx, 1, maxStok);
            }
        } else {
            setData('items', [...data.items, { sarpras_id: sarpras.id, qty: 1 }]);
        }
        setShowPickerModal(false);
    };

    const filteredPickerList = useMemo(() => {
        return sarprasTersedia.filter((item) => {
            if (pickerFilterJenis !== 'semua' && item.jenis !== pickerFilterJenis) {
                return false;
            }
            if (pickerSearch.trim()) {
                const q = pickerSearch.toLowerCase();
                const matchName = item.nama.toLowerCase().includes(q);
                const matchKode = item.kode.toLowerCase().includes(q);
                const matchLokasi = item.lokasi.toLowerCase().includes(q);
                return matchName || matchKode || matchLokasi;
            }
            return true;
        });
    }, [sarprasTersedia, pickerSearch, pickerFilterJenis]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setClientError(null);

        if (!data.nama_peminjam.trim()) {
            setClientError('Nama lengkap peminjam wajib diisi.');
            return;
        }
        if (!isUmum && !data.nim_nip.trim()) {
            setClientError(
                isPicRuangan
                    ? 'NIP.Y wajib diisi.'
                    : 'Nomor Induk Mahasiswa (NIM) wajib diisi.'
            );
            return;
        }
        if (!data.instansi_prodi.trim()) {
            setClientError(isUmum ? 'Instansi / Asal wajib diisi.' : 'Fakultas dan Program Studi wajib dipilih.');
            return;
        }
        if (!data.no_whatsapp.trim() || data.no_whatsapp === '08') {
            setClientError('Nomor WhatsApp aktif wajib diisi.');
            return;
        }
        if (!data.keperluan.trim()) {
            setClientError('Keperluan / agenda peminjaman wajib diisi.');
            return;
        }
        if (!data.tanggal_mulai || !data.tanggal_kembali_rencana) {
            setClientError('Tanggal mulai dan rencana pengembalian wajib diisi.');
            return;
        }
        if (data.tanggal_mulai < todayDateString) {
            setClientError('Tanggal mulai peminjaman tidak boleh sebelum tanggal hari ini.');
            return;
        }
        if (data.tanggal_kembali_rencana < data.tanggal_mulai) {
            setClientError('Tanggal selesai peminjaman tidak boleh mendahului tanggal mulai.');
            return;
        }
        if (data.items.length === 0) {
            setClientError('Pilih minimal 1 fasilitas yang ingin dipinjam.');
            return;
        }

        router.post(
            `/layanan/peminjaman/${peminjaman.id}`,
            {
                _method: 'PUT',
                ...data,
            },
            {
                forceFormData: true,
                preserveScroll: true,
                onError: (errs) => {
                    const first = Object.values(errs)[0];
                    if (first) setClientError(String(first));
                },
            }
        );
    };

    return (
        <AdminLayout>
            <Head title={`Edit Peminjaman ${peminjaman.kode_transaksi} - Biro Sarpras UNUHA`} />

            <div className="max-w-4xl mx-auto space-y-5 pb-16 font-sans text-slate-800 text-xs">
                {/* Header Navigasi Kembali */}
                <div className="flex items-center justify-between gap-3">
                    <Link
                        href="/layanan/peminjaman"
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-[#006039] hover:border-emerald-300 font-bold text-xs transition cursor-pointer shadow-2xs"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Kembali ke Daftar Peminjaman</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[11px] bg-emerald-50 text-[#006039] px-2.5 py-1 rounded-lg border border-emerald-200">
                            {peminjaman.kode_transaksi}
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            Menunggu Approval
                        </span>
                    </div>
                </div>

                {/* Banner Judul */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#006039] to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <ClipboardList className="w-5 h-5" strokeWidth={2} />
                        </div>
                        <div>
                            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                                Edit Pengajuan Peminjaman
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Anda dapat memperbarui data acara, jadwal, dan menambah atau menghapus fasilitas sebelum diverifikasi Admin.
                            </p>
                        </div>
                    </div>
                </div>

                {clientError && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>{clientError}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setClientError(null)}
                            className="p-1 text-rose-500 hover:text-rose-700"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* 1. INFORMASI IDENTITAS PEMINJAM */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#006039] flex items-center justify-center font-bold text-xs">
                                1
                            </div>
                            <h3 className="font-bold text-slate-900 text-sm">
                                Identitas &amp; Kontak Peminjam
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                    Nama Lengkap Peminjam <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.nama_peminjam}
                                    onChange={(e) => setData('nama_peminjam', e.target.value)}
                                    placeholder="Nama pemohon"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] focus:ring-1 focus:ring-[#006039] outline-hidden transition"
                                />
                                {errors.nama_peminjam && (
                                    <p className="text-rose-600 text-[11px] mt-1">{errors.nama_peminjam}</p>
                                )}
                            </div>

                            {!isUmum ? (
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        {isPicRuangan ? 'NIP.Y' : 'NIM (Nomor Induk Mahasiswa)'} <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.nim_nip}
                                        onChange={(e) => setData('nim_nip', e.target.value)}
                                        placeholder={isPicRuangan ? 'Contoh: KPB-2026-001' : 'Contoh: 2355202065'}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] focus:ring-1 focus:ring-[#006039] outline-hidden transition font-mono"
                                    />
                                    {errors.nim_nip && (
                                        <p className="text-rose-600 text-[11px] mt-1">{errors.nim_nip}</p>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        NIK / No. Identitas KTP (Opsional)
                                    </label>
                                    <input
                                        type="text"
                                        value={data.nim_nip}
                                        onChange={(e) => setData('nim_nip', e.target.value)}
                                        placeholder="Nomor identitas peminjam"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] focus:ring-1 focus:ring-[#006039] outline-hidden transition font-mono"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                    Nomor WhatsApp Aktif <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.no_whatsapp}
                                    onChange={(e) => setData('no_whatsapp', e.target.value)}
                                    placeholder="08xxxxxxxxxx"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] focus:ring-1 focus:ring-[#006039] outline-hidden transition font-mono"
                                />
                                {errors.no_whatsapp && (
                                    <p className="text-rose-600 text-[11px] mt-1">{errors.no_whatsapp}</p>
                                )}
                            </div>

                            {!isUmum ? (
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-bold text-slate-700">
                                        Fakultas &amp; Program Studi <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <select
                                            value={selectedFakultas}
                                            onChange={(e) => handleFakultasChange(e.target.value)}
                                            className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] focus:ring-1 focus:ring-[#006039] outline-hidden transition cursor-pointer"
                                        >
                                            <option value="">-- Pilih Fakultas --</option>
                                            {FAKULTAS_PRODI_UNUHA.map((f) => (
                                                <option key={f.kode} value={f.fakultas}>
                                                    {f.kode}
                                                </option>
                                            ))}
                                        </select>

                                        <select
                                            value={selectedProdi}
                                            onChange={(e) => handleProdiChange(e.target.value)}
                                            disabled={!selectedFakultas}
                                            className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] focus:ring-1 focus:ring-[#006039] outline-hidden transition cursor-pointer disabled:opacity-50"
                                        >
                                            <option value="">-- Pilih Program Studi --</option>
                                            {prodiOptions.map((p) => (
                                                <option key={p} value={p}>
                                                    {p}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {errors.instansi_prodi && (
                                        <p className="text-rose-600 text-[11px] mt-1">{errors.instansi_prodi}</p>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        Instansi / Organisasi / Asal <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.instansi_prodi}
                                        onChange={(e) => setData('instansi_prodi', e.target.value)}
                                        placeholder="Contoh: Yayasan, Perusahaan, atau Pribadi"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] focus:ring-1 focus:ring-[#006039] outline-hidden transition"
                                    />
                                    {errors.instansi_prodi && (
                                        <p className="text-rose-600 text-[11px] mt-1">{errors.instansi_prodi}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Berkas Identitas (KTM / KTP) */}
                        <div className="pt-2 border-t border-slate-100">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Berkas Identitas {!isUmum ? '(KTM)' : '(KTP)'}
                            </label>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                                <div className="flex items-center gap-2.5">
                                    <FileBadge className="w-5 h-5 text-[#006039]" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-800">
                                            {ktmFileName || (peminjaman.file_ktm ? 'Berkas identitas sudah tersimpan' : 'Belum ada berkas')}
                                        </p>
                                        <p className="text-[10px] text-slate-500">
                                            {ktmFileName ? 'Berkas baru dipilih untuk menggantikan' : 'Pilih file baru jika ingin memperbarui berkas identitas'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {peminjaman.file_ktm && (
                                        <a
                                            href={peminjaman.file_ktm}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200 text-[11px] transition shadow-2xs"
                                        >
                                            <Eye className="w-3.5 h-3.5 text-[#006039]" />
                                            <span>Lihat Berkas Lama</span>
                                        </a>
                                    )}

                                    <label className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#006039] hover:bg-[#0f4c3a] text-white font-bold rounded-lg text-[11px] transition cursor-pointer shadow-2xs">
                                        <UploadCloud className="w-3.5 h-3.5" />
                                        <span>Ganti Berkas</span>
                                        <input
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.webp,.pdf"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0] || null;
                                                setData('file_ktm', file);
                                                setKtmFileName(file ? file.name : null);
                                            }}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>
                            {errors.file_ktm && (
                                <p className="text-rose-600 text-[11px] mt-1">{errors.file_ktm}</p>
                            )}
                        </div>
                    </div>

                    {/* 2. FASILITAS YANG DIAJUKAN (BISA DITAMBAH, UBAH QTY, HAPUS) */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#006039] flex items-center justify-center font-bold text-xs">
                                    2
                                </div>
                                <h3 className="font-bold text-slate-900 text-sm">
                                    Fasilitas yang Diajukan
                                </h3>
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#006039] font-bold text-[11px]">
                                    {data.items.length} Fasilitas
                                </span>
                            </div>

                            {/* Tombol Tunggal Tambah Fasilitas Lain */}
                            <button
                                type="button"
                                onClick={() => setShowPickerModal(true)}
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
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                                                        {isRuangan ? 'Prasarana / Ruangan' : 'Sarana / Peralatan'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 flex items-center gap-0.5 truncate">
                                                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                                        {currentItem?.lokasi || 'Kampus UNUHA'}
                                                    </span>
                                                </div>
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

                    {/* 3. JADWAL PENGGUNAAN & KEPERLUAN */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#006039] flex items-center justify-center font-bold text-xs">
                                3
                            </div>
                            <h3 className="font-bold text-slate-900 text-sm">
                                Jadwal Penggunaan &amp; Keperluan Acara
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                    Tanggal Mulai Pemakaian <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="date"
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
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] focus:ring-1 focus:ring-[#006039] outline-hidden transition"
                                />
                                {errors.tanggal_mulai && (
                                    <p className="text-rose-600 text-[11px] mt-1">{errors.tanggal_mulai}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                    Tanggal Selesai Pemakaian <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    min={data.tanggal_mulai || todayDateString}
                                    value={data.tanggal_kembali_rencana}
                                    onChange={(e) => setData('tanggal_kembali_rencana', e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] focus:ring-1 focus:ring-[#006039] outline-hidden transition"
                                />
                                {errors.tanggal_kembali_rencana && (
                                    <p className="text-rose-600 text-[11px] mt-1">{errors.tanggal_kembali_rencana}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Keperluan / Alasan Peminjaman <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                rows={3}
                                value={data.keperluan}
                                onChange={(e) => setData('keperluan', e.target.value)}
                                placeholder="Jelaskan agenda pemakaian sarana / prasarana..."
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] focus:ring-1 focus:ring-[#006039] outline-hidden transition"
                            />
                            {errors.keperluan && (
                                <p className="text-rose-600 text-[11px] mt-1">{errors.keperluan}</p>
                            )}
                        </div>
                    </div>

                    {/* Tombol Aksi Simpan & Batal */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                        <Link
                            href="/layanan/peminjaman"
                            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-bold text-xs text-center transition cursor-pointer shadow-2xs"
                        >
                            Batal &amp; Kembali
                        </Link>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#006039] hover:bg-[#0f4c3a] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
                        >
                            <Send className="w-3.5 h-3.5" />
                            <span>{processing ? 'Menyimpan Perubahan...' : 'Simpan Perubahan Pengajuan'}</span>
                        </button>
                    </div>
                </form>
            </div>

            {/* MODAL PEMILIH FASILITAS */}
            {showPickerModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
                        {/* Header Modal */}
                        <div className="p-4 bg-gradient-to-r from-[#006039] to-emerald-700 text-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2.5">
                                <Package className="w-5 h-5 text-emerald-200" />
                                <div>
                                    <h3 className="font-bold text-sm">Pilih Fasilitas Kampus</h3>
                                    <p className="text-[11px] text-emerald-100">
                                        Tambahkan sarana atau prasarana ke pengajuan peminjaman
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowPickerModal(false)}
                                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search & Filter */}
                        <div className="p-3 bg-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row gap-2 shrink-0">
                            <div className="relative flex-1">
                                <Search className="absolute inset-y-0 left-3 my-auto w-3.5 h-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    value={pickerSearch}
                                    onChange={(e) => setPickerSearch(e.target.value)}
                                    placeholder="Cari sarana, ruangan, lokasi..."
                                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:border-[#006039] focus:ring-1 focus:ring-[#006039] outline-hidden"
                                />
                            </div>

                            <div className="flex bg-slate-200/70 p-0.5 rounded-xl gap-0.5">
                                {(['semua', 'sarana', 'prasarana'] as const).map((j) => (
                                    <button
                                        key={j}
                                        type="button"
                                        onClick={() => setPickerFilterJenis(j)}
                                        className={`px-3 py-1 rounded-lg text-[11px] font-bold capitalize transition cursor-pointer ${
                                            pickerFilterJenis === j
                                                ? 'bg-white text-[#006039] shadow-2xs'
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        {j}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Daftar Item */}
                        <div className="p-3 overflow-y-auto space-y-2 flex-1 custom-scrollbar">
                            {filteredPickerList.map((item) => {
                                const isRuangan = item.jenis === 'prasarana';
                                const isAlreadySelected = data.items.some((it) => it.sarpras_id === item.id);

                                return (
                                    <div
                                        key={item.id}
                                        className="p-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200/90 flex items-center justify-between gap-3 transition"
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
                                                    {item.nama}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                                        {item.kode}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 truncate flex items-center gap-0.5">
                                                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                                        {item.lokasi}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            <div className="text-right">
                                                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                    {item.stok_tersedia} {item.satuan} Tersedia
                                                </span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleAddFacilityFromPicker(item)}
                                                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                                                    isAlreadySelected
                                                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                        : 'bg-[#006039] hover:bg-[#0f4c3a] text-white shadow-2xs'
                                                }`}
                                            >
                                                {isAlreadySelected ? '+ Tambah Qty' : 'Pilih'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            {filteredPickerList.length === 0 && (
                                <div className="py-12 text-center text-slate-400">
                                    <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="font-bold text-slate-600 text-xs">
                                        Tidak ada fasilitas yang sesuai dengan pencarian.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
