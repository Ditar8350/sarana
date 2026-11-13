import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    RotateCcw,
    Search,
    CheckCircle2,
    AlertCircle,
    X,
    ClipboardCheck,
    Clock,
    User,
    Package,
    Building2,
    Camera,
    Eye,
    ShieldCheck,
    ArrowRight,
    CheckCheck,
    AlertTriangle,
    Layers,
    FileText,
    Wrench,
    Check,
    CreditCard,
    Phone,
    Calendar,
    MessageSquare,
    ZoomIn,
    Sparkles,
    Copy,
} from 'lucide-react';

interface BorrowedItem {
    id: number;
    sarpras_id?: number;
    nama_barang: string;
    qty: number;
    satuan: string;
    kondisi_sebelum?: string;
    kondisi_sesudah?: string | null;
}

interface PengembalianItem {
    id: number;
    kode: string;
    kode_peminjaman: string;
    peminjam: string;
    nim_nip: string;
    instansi_prodi: string;
    no_whatsapp: string;
    tanggal_kembali: string;
    tanggal_verifikasi: string | null;
    foto_bukti: string | null;
    catatan_mahasiswa: string | null;
    status_verifikasi: string;
    biaya_denda: number;
    nomor_rekening?: string | null;
    status_pembayaran_denda?: string | null;
    bukti_bayar_denda?: string | null;
    catatan_bayar_denda?: string | null;
    diverifikasi_denda_pada?: string | null;
    verifikator_denda?: string | null;
    catatan_inspeksi_admin: string | null;
    pemeriksa_nama: string;
    items: BorrowedItem[];
}

interface PeminjamanAktifItem {
    id: number;
    kode: string;
    peminjam: string;
    nim_nip: string;
    instansi_prodi: string;
    tanggal_mulai: string;
    tanggal_kembali_rencana: string;
    status: string;
    items: Array<{
        id: number;
        sarpras_id: number;
        nama_barang: string;
        qty: number;
        satuan?: string;
    }>;
}

interface Props {
    pengembalianList: PengembalianItem[];
    peminjamanAktif: PeminjamanAktifItem[];
    currentUserRole?: string;
    currentUserId?: number;
}

export default function PengembalianIndex({
    pengembalianList = [],
    peminjamanAktif = [],
    currentUserRole = 'admin',
}: Props) {
    const { flash } = usePage().props as any;
    const isStaf = currentUserRole === 'staf';
    const isAdmin = currentUserRole === 'admin';
    const [cari, setCari] = useState('');
    const [activeTab, setActiveTab] = useState<'semua' | 'menunggu' | 'selesai' | 'verifikasi_denda' | 'aktif_pinjam'>('semua');

    // Modal Inspeksi Fisik
    const [inspeksiItem, setInspeksiItem] = useState<PengembalianItem | null>(null);
    const [kondisiMap, setKondisiMap] = useState<Record<number, string>>({});
    const [biayaDenda, setBiayaDenda] = useState<number | ''>('');
    const [nomorRekening, setNomorRekening] = useState('BSI (Bank Syariah Indonesia) No. Rek: 7182938475 a.n. Biro Sarpras Universitas Nurul Huda');
    const [catatanInspeksi, setCatatanInspeksi] = useState('Barang kembali lengkap dan dalam kondisi baik.');
    const [buatTiketMaintenance, setBuatTiketMaintenance] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [copiedRekening, setCopiedRekening] = useState(false);
    const [isEditingRekening, setIsEditingRekening] = useState(false);

    const hasKerusakan = Object.values(kondisiMap).some((val) =>
        ['rusak_ringan', 'rusak_berat', 'hilang'].includes(val)
    );

    const isFormDendaValid = !hasKerusakan || (
        biayaDenda !== '' &&
        Number(biayaDenda) > 0 &&
        catatanInspeksi.trim().length > 0 &&
        nomorRekening.trim().length > 0
    );

    const handleCopyRekening = () => {
        const match = nomorRekening.match(/\d{8,}/);
        const textToCopy = match ? match[0] : nomorRekening;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(textToCopy);
            setCopiedRekening(true);
            setTimeout(() => setCopiedRekening(false), 2000);
        }
    };

    const handleKondisiChange = (itemId: number, val: string) => {
        const newMap = { ...kondisiMap, [itemId]: val };
        setKondisiMap(newMap);

        const isAnyDamaged = Object.values(newMap).some((k) =>
            ['rusak_ringan', 'rusak_berat', 'hilang'].includes(k)
        );

        if (isAnyDamaged) {
            // Biarkan kosong untuk diisi manual oleh staf (jangan diisi 50.000 otomatis)
            if (biayaDenda === 0 || biayaDenda === '') {
                setBiayaDenda('');
            }
            if (catatanInspeksi.includes('kondisi baik') || !catatanInspeksi.trim()) {
                setCatatanInspeksi('');
            }
        } else {
            setBiayaDenda(0);
            setCatatanInspeksi('Barang kembali lengkap dan dalam kondisi baik.');
        }
    };

    // Modal Verifikasi Denda
    const [verifikasiDendaItem, setVerifikasiDendaItem] = useState<PengembalianItem | null>(null);
    const [catatanVerifikasiDenda, setCatatanVerifikasiDenda] = useState('');

    // Lightbox Foto Preview
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [lightboxTitle, setLightboxTitle] = useState<string>('Bukti Foto Fisik Mahasiswa');

    const handleOpenInspeksi = (item: PengembalianItem) => {
        setInspeksiItem(item);
        setIsEditingRekening(false);
        setCopiedRekening(false);
        const initialKondisi: Record<number, string> = {};
        let hasDamage = false;
        item.items.forEach((it) => {
            const kond = it.kondisi_sesudah || 'sempurna';
            initialKondisi[it.id] = kond;
            if (['rusak_ringan', 'rusak_berat', 'hilang'].includes(kond)) {
                hasDamage = true;
            }
        });
        setKondisiMap(initialKondisi);
        // Jika ada kerusakan, ambil nominal denda jika sudah ada, jika belum biarkan kosong ''
        setBiayaDenda(hasDamage ? (item.biaya_denda > 0 ? item.biaya_denda : '') : 0);
        setNomorRekening(item.nomor_rekening || 'BSI (Bank Syariah Indonesia) No. Rek: 7182938475 a.n. Biro Sarpras Universitas Nurul Huda');
        setCatatanInspeksi(
            item.catatan_inspeksi_admin ||
            (hasDamage ? '' : 'Barang kembali lengkap dan dalam kondisi baik.')
        );
    };

    const handleSimpanInspeksi = () => {
        if (!inspeksiItem) return;

        if (hasKerusakan) {
            if (biayaDenda === '' || Number(biayaDenda) <= 0) {
                alert('Nominal denda kerusakan wajib diisi dengan nominal yang valid.');
                return;
            }
            if (!catatanInspeksi.trim()) {
                alert('Catatan kerusakan & instruksi denda wajib diisi.');
                return;
            }
        }

        setIsProcessing(true);
        router.post(
            `/admin/pengembalian/${inspeksiItem.id}/verifikasi`,
            {
                kondisi_items: kondisiMap,
                biaya_denda: hasKerusakan ? Number(biayaDenda) : 0,
                nomor_rekening: hasKerusakan ? nomorRekening : null,
                catatan_inspeksi_admin: catatanInspeksi,
                buat_tiket_maintenance: buatTiketMaintenance,
            },
            {
                preserveScroll: true,
                onFinish: () => {
                    setIsProcessing(false);
                    setInspeksiItem(null);
                },
            }
        );
    };

    const handleVerifikasiDendaSubmit = (status: 'lunas' | 'ditolak') => {
        if (!verifikasiDendaItem) return;
        setIsProcessing(true);
        router.post(
            `/admin/pengembalian/${verifikasiDendaItem.id}/verifikasi-denda`,
            {
                status_denda: status,
                catatan_admin: catatanVerifikasiDenda,
            },
            {
                preserveScroll: true,
                onFinish: () => {
                    setIsProcessing(false);
                    setVerifikasiDendaItem(null);
                    setCatatanVerifikasiDenda('');
                },
            }
        );
    };

    // Filter daftar pengembalian
    const listMenunggu = pengembalianList.filter(
        (item) => item.status_verifikasi === 'menunggu_inspeksi'
    );
    const listSelesai = pengembalianList.filter(
        (item) => item.status_verifikasi !== 'menunggu_inspeksi'
    );
    const listVerifikasiDenda = pengembalianList.filter(
        (item) => item.status_pembayaran_denda === 'menunggu_verifikasi_admin' || (item.biaya_denda > 0 && Boolean(item.bukti_bayar_denda))
    );

    const matchesSearch = (item: PengembalianItem) => {
        const query = cari.toLowerCase();
        return (
            item.kode.toLowerCase().includes(query) ||
            item.kode_peminjaman.toLowerCase().includes(query) ||
            item.peminjam.toLowerCase().includes(query) ||
            (item.nim_nip && item.nim_nip.toLowerCase().includes(query)) ||
            (item.instansi_prodi && item.instansi_prodi.toLowerCase().includes(query)) ||
            item.items.some((it) => it.nama_barang.toLowerCase().includes(query))
        );
    };

    const filteredSemua = pengembalianList.filter(matchesSearch);
    const filteredMenunggu = listMenunggu.filter(matchesSearch);
    const filteredSelesai = listSelesai.filter(matchesSearch);
    const filteredVerifikasiDenda = listVerifikasiDenda.filter(matchesSearch);
    const filteredAktifPinjam = peminjamanAktif.filter((item) => {
        const query = cari.toLowerCase();
        return (
            item.kode.toLowerCase().includes(query) ||
            item.peminjam.toLowerCase().includes(query) ||
            (item.nim_nip && item.nim_nip.toLowerCase().includes(query))
        );
    });

    const renderMenungguCard = (item: PengembalianItem) => (
        <div
            key={item.id}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all overflow-hidden"
        >
            {/* Baris Atas / Status Bar */}
            <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                    <span className="font-mono font-extrabold px-2.5 py-1 rounded-lg bg-slate-800 text-white">
                        {item.kode}
                    </span>
                    <span className="text-slate-400 hidden sm:inline">•</span>
                    <span className="text-slate-500 flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Waktu Pengembalian: <strong className="text-slate-800">{item.tanggal_kembali}</strong></span>
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        <span>Menunggu Cek Fisik di Meja Loket</span>
                    </span>
                </div>
            </div>

            {/* Konten Utama: 2 Kolom Seimbang (Kiri: Info & Barang, Kanan: Foto & Aksi) */}
            <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Kolom Kiri (7 Kolom): Identitas Peminjam, Catatan, & Daftar Fasilitas */}
                <div className="lg:col-span-7 space-y-4">
                    {/* Profil Peminjam */}
                    <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/60">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center shrink-0">
                            <User className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-slate-900 text-sm">{item.peminjam}</h3>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200/80 text-slate-700">
                                    {item.nim_nip ? `NIM: ${item.nim_nip}` : 'Umum'}
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                {item.instansi_prodi || 'Civitas Akademika / Umum'}
                            </p>
                            {item.no_whatsapp && (
                                <p className="text-[11px] text-[#006039] font-medium mt-1 flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-[#006039]" />
                                    <span>{item.no_whatsapp}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Catatan Peminjam jika ada */}
                    {item.catatan_mahasiswa && (
                        <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/60 flex items-start gap-2.5">
                            <MessageSquare className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div className="text-[11px]">
                                <span className="font-bold text-amber-900">Catatan dari Peminjam:</span>
                                <p className="text-slate-700 italic mt-0.5">"{item.catatan_mahasiswa}"</p>
                            </div>
                        </div>
                    )}

                    {/* Daftar Fasilitas yang Dikembalikan */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                            <span className="flex items-center gap-1.5">
                                <Package className="w-3.5 h-3.5 text-[#006039]" />
                                <span>Fasilitas yang Dikembalikan</span>
                            </span>
                            <span className="text-[11px] font-normal text-slate-400">
                                {item.items.length} Barang
                            </span>
                        </div>

                        <div className="space-y-2">
                            {item.items.map((it) => (
                                <div
                                    key={it.id}
                                    className="p-3 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between gap-3 text-xs hover:border-slate-300 transition"
                                >
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-900 truncate">{it.nama_barang}</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            Kondisi saat awal dipinjam:{' '}
                                            <span className="font-semibold text-slate-600 capitalize">
                                                {it.kondisi_sebelum || 'Baik'}
                                            </span>
                                        </p>
                                    </div>
                                    <span className="px-3 py-1 rounded-lg bg-emerald-50 text-[#006039] font-black text-xs shrink-0 border border-emerald-200/60">
                                        {it.qty} {it.satuan}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Stepper Alur Pengembalian Ringkas & Elegan */}
                    <div className="pt-2">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-2">
                            <span className="flex items-center gap-1.5">
                                <ClipboardCheck className="w-3.5 h-3.5 text-[#006039]" />
                                <span>Tahapan Sirkulasi:</span>
                            </span>
                            <span className="text-[#006039] font-bold">Langkah 3 dari 4</span>
                        </div>

                        <div className="grid grid-cols-4 gap-2 text-center">
                            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200/80">
                                <span className="text-[10px] font-bold text-emerald-800 block">1. Bukti Foto</span>
                                <span className="text-[9px] text-emerald-600 font-semibold">Terkirim ✓</span>
                            </div>
                            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200/80">
                                <span className="text-[10px] font-bold text-emerald-800 block">2. Fisik Loket</span>
                                <span className="text-[9px] text-emerald-600 font-semibold">Diterima ✓</span>
                            </div>
                            <div className="p-2 rounded-xl bg-amber-500 text-white border border-amber-600 shadow-2xs">
                                <span className="text-[10px] font-bold block">3. Cek Fisik</span>
                                <span className="text-[9px] text-amber-100 font-semibold">Butuh Verifikasi</span>
                            </div>
                            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/60 opacity-60">
                                <span className="text-[10px] font-bold text-slate-500 block">4. Restock</span>
                                <span className="text-[9px] text-slate-400">Otomatis</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Kolom Kanan (5 Kolom): Preview Foto Bukti & Tombol Aksi */}
                <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                            <span className="flex items-center gap-1.5">
                                <Camera className="w-3.5 h-3.5 text-[#006039]" />
                                <span>Bukti Foto dari Peminjam</span>
                            </span>
                            {item.foto_bukti && (
                                <span className="text-[10px] font-normal text-slate-400">Klik untuk perbesar</span>
                            )}
                        </div>

                        {item.foto_bukti ? (
                            <div
                                onClick={() => {
                                    setLightboxUrl(item.foto_bukti);
                                    setLightboxTitle(`Foto Bukti Pengembalian ${item.kode} - ${item.peminjam}`);
                                }}
                                className="relative aspect-4/3 sm:aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 group cursor-pointer shadow-2xs hover:border-[#006039] transition"
                            >
                                <img
                                    src={item.foto_bukti}
                                    alt="Foto Bukti Pengembalian"
                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                />
                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-bold text-xs gap-1.5 backdrop-blur-2xs">
                                    <ZoomIn className="w-4 h-4" />
                                    <span>Buka Foto Ukuran Penuh</span>
                                </div>
                            </div>
                        ) : (
                            <div className="aspect-video w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400 text-xs p-4 text-center">
                                <Camera className="w-7 h-7 mb-1 text-slate-300" />
                                <span>Foto belum diunggah oleh peminjam</span>
                            </div>
                        )}
                    </div>

                    {/* Kotak Petunjuk Singkat & Tombol Eksekusi Cek Fisik */}
                    <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-3">
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                            Cocokkan kondisi fisik barang di loket dengan foto bukti di atas. Setelah diverifikasi, stok akan langsung kembali ke sistem.
                        </p>

                        <button
                            type="button"
                            onClick={() => handleOpenInspeksi(item)}
                            className="w-full py-2.5 px-4 bg-[#006039] hover:bg-[#0f4c3a] text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <ClipboardCheck className="w-4 h-4" />
                            <span>
                                {isAdmin
                                    ? 'Verifikasi Cek Fisik & Selesaikan (Admin)'
                                    : 'Lakukan Cek Fisik & Inspeksi (Staf Loket)'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSelesaiCard = (item: PengembalianItem) => {
        const isDenda = item.status_verifikasi === 'ada_kerusakan_hilang' || item.biaya_denda > 0;

        return (
            <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition overflow-hidden"
            >
                {/* Header Card */}
                <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-2 text-slate-700">
                        <span className="font-mono font-black text-slate-900">{item.kode}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500">
                            Diperiksa: <strong className="text-slate-700">{item.tanggal_verifikasi || item.tanggal_kembali}</strong>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500">
                            Pemeriksa: <strong className="text-slate-700">{item.pemeriksa_nama}</strong>
                        </span>
                    </div>

                    <div>
                        {isDenda ? (
                            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                Ada Kerusakan / Hilang
                            </span>
                        ) : (
                            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-[#006039] border border-emerald-200">
                                Selesai (Tidak Denda)
                            </span>
                        )}
                    </div>
                </div>

                {/* Isi 3 Kolom Sesuai Gambar Pertama */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-start text-xs">
                    {/* Kolom 1: IDENTITAS PEMINJAM (4 Kolom) */}
                    <div className="md:col-span-4 space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">IDENTITAS PEMINJAM</p>
                        <h4 className="font-bold text-slate-900 text-sm leading-snug">{item.peminjam}</h4>
                        <p className="text-[11px] text-slate-600 font-medium">NIM: {item.nim_nip || '-'}</p>
                        <p className="text-[11px] text-slate-500">{item.instansi_prodi || '-'}</p>
                    </div>

                    {/* Kolom 2: KONDISI FISIK & CATATAN INSPEKSI (4 Kolom) */}
                    <div className="md:col-span-4 space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">KONDISI FISIK &amp; CATATAN INSPEKSI</p>
                        <div className="space-y-1">
                            {item.items.map((it) => (
                                <div key={it.id} className="flex flex-wrap items-center gap-1.5 font-bold text-slate-900 text-xs">
                                    <span>{it.nama_barang}</span>
                                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
                                        {it.qty} {it.satuan}
                                    </span>
                                    {it.kondisi_sesudah && it.kondisi_sesudah !== 'sempurna' ? (
                                        <span className="px-2 py-0.2 rounded-full text-[10px] bg-amber-50 text-amber-800 border border-amber-200 capitalize font-bold">
                                            {it.kondisi_sesudah.replace('_', ' ')}
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.2 rounded-full text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                                            Lengkap &amp; Baik
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>

                        {item.catatan_inspeksi_admin && (
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 italic">
                                “ {item.catatan_inspeksi_admin} ”
                            </div>
                        )}
                    </div>

                    {/* Kolom 3: DENDA & FORM ARSIP (4 Kolom) */}
                    <div className="md:col-span-4 space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                DENDA &amp; FORM ARSIP
                            </p>
                            {isAdmin && (
                                <button
                                    type="button"
                                    onClick={() => handleOpenInspeksi(item)}
                                    className="text-[10px] font-bold text-[#006039] hover:underline inline-flex items-center gap-1 cursor-pointer"
                                    title="Edit hasil cek kondisi fisik atau denda"
                                >
                                    <Wrench className="w-3 h-3" />
                                    <span>Ubah Cek Fisik</span>
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                            {/* Kotak Biaya Denda / Bebas Denda */}
                            {isDenda ? (
                                <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-200 flex flex-col justify-between">
                                    <span className="text-[10px] font-semibold text-rose-800 leading-tight">
                                        Biaya Denda + Ganti Rugi:
                                    </span>
                                    <span className="text-sm font-extrabold text-rose-700 mt-1">
                                        Rp {item.biaya_denda.toLocaleString('id-ID')}
                                    </span>
                                </div>
                            ) : (
                                <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 flex flex-col justify-between">
                                    <span className="text-[10px] font-semibold text-[#006039] leading-tight">
                                        Bebas Denda:
                                    </span>
                                    <span className="text-sm font-extrabold text-[#006039] mt-1">
                                        Rp 0
                                    </span>
                                </div>
                            )}

                            {/* Kotak Form Arsip / Bukti (Hanya Gambar yang Bisa Diklik) */}
                            {item.foto_bukti ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setLightboxUrl(item.foto_bukti);
                                        setLightboxTitle(`Bukti Foto & Arsip ${item.kode} - ${item.peminjam}`);
                                    }}
                                    className="relative h-full min-h-[58px] rounded-xl overflow-hidden border border-slate-200/90 bg-slate-100 group cursor-pointer shadow-2xs hover:shadow-xs hover:border-[#006039] transition flex items-center justify-center p-0"
                                    title="Klik untuk memperbesar gambar arsip"
                                >
                                    <img
                                        src={item.foto_bukti}
                                        alt="Bukti Arsip"
                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                    />
                                    <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white backdrop-blur-[1px]">
                                        <ZoomIn className="w-4 h-4 drop-shadow" />
                                    </div>
                                </button>
                            ) : (
                                <div
                                    className="h-full min-h-[58px] rounded-xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-slate-300"
                                    title="Tidak ada berkas bukti arsip"
                                >
                                    <FileText className="w-5 h-5" />
                                </div>
                            )}
                        </div>

                        {/* STATUS PEMBAYARAN DENDA & TOMBOL VERIFIKASI ADMIN */}
                        {isDenda && (
                            <div className="pt-1.5 space-y-2 border-t border-slate-100 mt-2">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className="text-[11px] font-bold">
                                        {item.status_pembayaran_denda === 'lunas' ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                <span>Denda Lunas Terverifikasi</span>
                                            </span>
                                        ) : item.status_pembayaran_denda === 'menunggu_verifikasi_admin' ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                                                <span>Menunggu Verifikasi Admin</span>
                                            </span>
                                        ) : item.status_pembayaran_denda === 'ditolak' ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                                                <AlertCircle className="w-3 h-3 text-rose-600" />
                                                <span>Bukti Ditolak</span>
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                                <CreditCard className="w-3 h-3 text-slate-500" />
                                                <span>Belum Dibayar</span>
                                            </span>
                                        )}
                                    </div>

                                    {item.bukti_bayar_denda && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setLightboxUrl(item.bukti_bayar_denda!);
                                                setLightboxTitle(`Bukti Transfer Denda ${item.kode} - ${item.peminjam}`);
                                            }}
                                            className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                                        >
                                            <Eye className="w-3 h-3" />
                                            <span>Lihat Struk</span>
                                        </button>
                                    )}
                                </div>

                                {/* AKSI VERIFIKASI DENDA LANGSUNG (ROLE ADMIN) */}
                                {isAdmin && item.status_pembayaran_denda !== 'lunas' && (
                                    <div className="pt-0.5">
                                        {item.status_pembayaran_denda === 'menunggu_verifikasi_admin' ? (
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setVerifikasiDendaItem(item);
                                                        setCatatanVerifikasiDenda(
                                                            'Pembayaran denda telah masuk ke rekening Biro Sarpras dan diverifikasi lunas.'
                                                        );
                                                    }}
                                                    className="flex-1 py-1.5 px-3 bg-[#006039] hover:bg-[#0f4c3a] text-white font-bold text-[11px] rounded-xl transition shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                                                    title="Verifikasi lunas pembayaran denda"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    <span>Verifikasi Lunas</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setVerifikasiDendaItem(item);
                                                        setCatatanVerifikasiDenda(
                                                            'Bukti transfer tidak valid atau dana belum masuk ke rekening. Silakan transfer ulang.'
                                                        );
                                                    }}
                                                    className="py-1.5 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] rounded-xl transition cursor-pointer"
                                                    title="Tolak bukti transfer denda"
                                                >
                                                    Tolak
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setVerifikasiDendaItem(item);
                                                    setCatatanVerifikasiDenda(
                                                        'Pembayaran denda telah diterima dan diverifikasi lunas oleh Admin Sarpras.'
                                                    );
                                                }}
                                                className="w-full py-1.5 px-3 bg-[#006039] hover:bg-[#0f4c3a] text-white font-bold text-[11px] rounded-xl transition shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                                                title="Verifikasi pelunasan denda langsung oleh admin"
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                <span>Verifikasi Lunas Denda (Admin)</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AdminLayout>
            <Head title="Pengembalian & Cek Fisik - Biro Sarpras UNUHA" />

            <div className="max-w-7xl mx-auto space-y-5 pb-16 px-2 sm:px-4 font-sans text-slate-800 text-xs">
                {/* 1. Header Banner Bersih & Modern (Search Sejajar Dihapus) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#006039] to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <RotateCcw className="w-5 h-5" strokeWidth={2} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#006039] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                                    Layanan Sirkulasi Loket
                                </span>
                            </div>
                            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
                                Data Pengembalian &amp; Cek Fisik
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Inspeksi kondisi fisik barang di meja loket, konfirmasi keutuhan unit, dan restock otomatis.
                            </p>
                        </div>
                    </div>

                    <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 font-bold text-xs flex items-center gap-2 shrink-0 self-start sm:self-auto">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                        <span>{listMenunggu.length} Antrean Cek Fisik</span>
                    </div>
                </div>

                {/* Alerts Flash */}
                {flash?.success && (
                    <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#006039] text-xs font-semibold shadow-2xs animate-in fade-in duration-200">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash?.error && (
                    <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold shadow-2xs animate-in fade-in duration-200">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>{flash.error}</span>
                    </div>
                )}

                {/* 2. Kartu Ringkasan Metrik KPI (Sesuai Gambar Pertama) */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
                    {/* Kartu 1: Semua Data */}
                    <button
                        type="button"
                        onClick={() => setActiveTab('semua')}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                            activeTab === 'semua'
                                ? 'bg-cyan-50/60 border-cyan-500 ring-2 ring-cyan-500/20 shadow-xs'
                                : 'bg-white border-slate-200/90 shadow-2xs hover:border-cyan-300'
                        }`}
                    >
                        <div className="w-10 h-10 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-[11px] font-semibold text-slate-700 block truncate">Semua Data:</span>
                            <span className="text-2xl font-black text-slate-900 leading-tight">{pengembalianList.length}</span>
                        </div>
                    </button>

                    {/* Kartu 2: Cek Fisik */}
                    <button
                        type="button"
                        onClick={() => setActiveTab('menunggu')}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                            activeTab === 'menunggu'
                                ? 'bg-amber-50/60 border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
                                : 'bg-white border-slate-200/90 shadow-2xs hover:border-amber-300'
                        }`}
                    >
                        <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                            <ClipboardCheck className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-[11px] font-semibold text-slate-700 block truncate">Cek Fisik:</span>
                            <span className="text-2xl font-black text-slate-900 leading-tight">{listMenunggu.length}</span>
                        </div>
                    </button>

                    {/* Kartu 3: Selesai */}
                    <button
                        type="button"
                        onClick={() => setActiveTab('selesai')}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                            activeTab === 'selesai'
                                ? 'bg-emerald-50/60 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                                : 'bg-white border-slate-200/90 shadow-2xs hover:border-emerald-300'
                        }`}
                    >
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <CheckCheck className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-[11px] font-semibold text-slate-700 block truncate">Selesai:</span>
                            <span className="text-2xl font-black text-slate-900 leading-tight">{listSelesai.length}</span>
                        </div>
                    </button>

                    {/* Kartu 4: Verifikasi Denda */}
                    <button
                        type="button"
                        onClick={() => setActiveTab('verifikasi_denda')}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                            activeTab === 'verifikasi_denda'
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
                                {listSelesai.filter((s) => s.status_verifikasi === 'ada_kerusakan_hilang' || s.biaya_denda > 0).length}
                            </span>
                        </div>
                    </button>

                    {/* Kartu 5: Sedang Dipinjam */}
                    <button
                        type="button"
                        onClick={() => setActiveTab('aktif_pinjam')}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                            activeTab === 'aktif_pinjam'
                                ? 'bg-purple-50/60 border-purple-400 ring-2 ring-purple-400/20 shadow-xs'
                                : 'bg-white border-slate-200/90 shadow-2xs hover:border-purple-300'
                        }`}
                    >
                        <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-[11px] font-semibold text-slate-700 block truncate">Sedang Dipinjam:</span>
                            <span className="text-2xl font-black text-slate-900 leading-tight">{peminjamanAktif.length}</span>
                        </div>
                    </button>
                </div>

                {/* 3. Kolom Pencarian */}
                <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                    <div className="relative w-full">
                        <Search className="absolute inset-y-0 left-3.5 my-auto w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            value={cari}
                            onChange={(e) => setCari(e.target.value)}
                            placeholder="Cari kode pengembalian, ref pinjam, nama peminjam, NIM, prodi..."
                            className="w-full pl-10 pr-9 py-2.5 border border-slate-200 rounded-xl text-xs focus:border-[#006039] focus:ring-1 focus:ring-[#006039] outline-hidden bg-slate-50/60 focus:bg-white text-slate-800 placeholder-slate-400 font-medium transition shadow-2xs"
                        />
                        {cari && (
                            <button
                                type="button"
                                onClick={() => setCari('')}
                                className="absolute inset-y-0 right-3 my-auto text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* ======================================================== */}
                {/* TAB 0: TAMPILKAN SEMUA PENGEMBALIAN                     */}
                {/* ======================================================== */}
                {activeTab === 'semua' && (
                    <div className="space-y-4">
                        {filteredSemua.map((item) =>
                            item.status_verifikasi === 'menunggu_inspeksi'
                                ? renderMenungguCard(item)
                                : renderSelesaiCard(item)
                        )}

                        {filteredSemua.length === 0 && (
                            <div className="py-16 px-6 text-center bg-white border border-slate-200/90 rounded-2xl text-slate-400 space-y-3 shadow-2xs">
                                <Layers className="w-12 h-12 text-slate-300 mx-auto" />
                                <h3 className="font-bold text-slate-800 text-sm">Tidak Ada Data Pengembalian</h3>
                                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                    {cari
                                        ? `Tidak ada data pengembalian yang cocok dengan pencarian "${cari}".`
                                        : 'Belum ada transaksi pengembalian sarpras yang tercatat.'}
                                </p>
                                {cari && (
                                    <button
                                        type="button"
                                        onClick={() => setCari('')}
                                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                                    >
                                        Reset Pencarian
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ======================================================== */}
                {/* TAB 1: ANTREAN CEK FISIK DI LOKET (DESAIN BARU & ELEGAN) */}
                {/* ======================================================== */}
                {activeTab === 'menunggu' && (
                    <div className="space-y-4">
                        {filteredMenunggu.map((item) => renderMenungguCard(item))}

                        {filteredMenunggu.length === 0 && (
                            <div className="py-16 px-6 text-center bg-white border border-slate-200/90 rounded-2xl text-slate-400 space-y-3 shadow-2xs">
                                <CheckCheck className="w-12 h-12 text-[#006039] mx-auto" />
                                <h3 className="font-bold text-slate-800 text-sm">Tidak Ada Antrean Cek Fisik</h3>
                                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                    {cari
                                        ? `Tidak ada antrean cek fisik yang cocok dengan pencarian "${cari}".`
                                        : 'Seluruh fasilitas yang dikembalikan telah selesai diinspeksi oleh staf loket.'}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* ======================================================== */}
                {/* TAB 2: RIWAYAT PENGEMBALIAN SELESAI                     */}
                {/* ======================================================== */}
                {activeTab === 'selesai' && (
                    <div className="space-y-4">
                        {filteredSelesai.map((item) => renderSelesaiCard(item))}

                        {filteredSelesai.length === 0 && (
                            <div className="py-16 px-6 text-center bg-white border border-slate-200/90 rounded-2xl text-slate-400 space-y-2 shadow-2xs">
                                <Package className="w-10 h-10 text-slate-300 mx-auto" />
                                <h3 className="font-bold text-slate-700 text-xs">Belum Ada Riwayat Selesai</h3>
                                <p className="text-xs text-slate-400">
                                    {cari
                                        ? `Tidak ada riwayat selesai yang cocok dengan pencarian "${cari}".`
                                        : 'Belum ada transaksi pengembalian yang telah selesai diverifikasi.'}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* ======================================================== */}
                {/* TAB 3: VERIFIKASI TRANSFER DENDA                        */}
                {/* ======================================================== */}
                {activeTab === 'verifikasi_denda' && (
                    <div className="space-y-4">
                        {filteredVerifikasiDenda.map((item) => (
                            <div
                                key={item.id}
                                className="bg-white rounded-2xl border border-rose-200/90 shadow-2xs hover:shadow-xs transition overflow-hidden"
                            >
                                <div className="px-5 py-3.5 bg-rose-50/50 border-b border-rose-100 flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                                        <span className="text-slate-500">
                                            Peminjam: <strong className="text-slate-900">{item.peminjam}</strong>
                                        </span>
                                        <span className="text-slate-400 hidden sm:inline">•</span>
                                        <span className="text-rose-700 font-extrabold">
                                            Nominal: Rp {item.biaya_denda.toLocaleString('id-ID')}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {item.status_pembayaran_denda === 'lunas' ? (
                                            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-[#006039] border border-emerald-200">
                                                Lunas Terverifikasi
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                                                <span>Menunggu Verifikasi Admin</span>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                                    {/* Rekening & Catatan */}
                                    <div className="lg:col-span-6 space-y-3">
                                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
                                            <span className="text-slate-500 font-bold block">Rekening Tujuan Sarpras:</span>
                                            <p className="font-semibold text-slate-800">
                                                {item.nomor_rekening || 'BSI (Bank Syariah Indonesia) No. Rek: 7182938475 a.n. Biro Sarpras Universitas Nurul Huda'}
                                            </p>
                                        </div>

                                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
                                            <span className="text-slate-500 font-bold block">Catatan Transfer dari Mahasiswa:</span>
                                            <p className="italic text-slate-700">
                                                {item.catatan_bayar_denda ? `"${item.catatan_bayar_denda}"` : 'Tidak ada catatan khusus.'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Bukti Struk & Tombol Konfirmasi */}
                                    <div className="lg:col-span-6 space-y-3">
                                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                            <span>Bukti Struk Transfer:</span>
                                            {item.bukti_bayar_denda && (
                                                <span className="text-[10px] text-slate-400 font-normal">Klik untuk perbesar</span>
                                            )}
                                        </div>

                                        {item.bukti_bayar_denda ? (
                                            <div
                                                onClick={() => {
                                                    setLightboxUrl(item.bukti_bayar_denda!);
                                                    setLightboxTitle(`Bukti Transfer Denda ${item.kode} - ${item.peminjam}`);
                                                }}
                                                className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group cursor-pointer shadow-2xs hover:border-[#006039] transition"
                                            >
                                                <img
                                                    src={item.bukti_bayar_denda}
                                                    alt="Bukti Transfer"
                                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                                />
                                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-bold text-xs gap-1.5 backdrop-blur-2xs">
                                                    <ZoomIn className="w-4 h-4" />
                                                    <span>Lihat Struk Transfer</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="aspect-video w-full rounded-xl border border-dashed border-rose-200 bg-rose-50/30 flex items-center justify-center text-rose-500 text-xs text-center p-4">
                                                Peminjam belum mengunggah struk transfer
                                            </div>
                                        )}

                                        {item.status_pembayaran_denda === 'menunggu_verifikasi_admin' && (
                                            isAdmin ? (
                                                <div className="pt-2 flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setVerifikasiDendaItem(item);
                                                            setCatatanVerifikasiDenda('Pembayaran denda telah masuk ke rekening Biro Sarpras dan diverifikasi lunas.');
                                                        }}
                                                        className="flex-1 py-2 px-3 bg-[#006039] hover:bg-[#0f4c3a] text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        <span>Verifikasi Lunas</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setVerifikasiDendaItem(item);
                                                            setCatatanVerifikasiDenda('Bukti transfer tidak valid atau dana belum masuk ke rekening. Silakan transfer ulang.');
                                                        }}
                                                        className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition cursor-pointer"
                                                    >
                                                        Tolak
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="pt-2">
                                                    <div className="p-2.5 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-900 text-xs font-semibold flex items-center gap-2">
                                                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                                        <span>Menunggu Verifikasi Pembayaran oleh Admin Sarpras</span>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {filteredVerifikasiDenda.length === 0 && (
                            <div className="py-16 px-6 text-center bg-white border border-slate-200/90 rounded-2xl text-slate-400 space-y-2 shadow-2xs">
                                <CreditCard className="w-10 h-10 text-slate-300 mx-auto" />
                                <h3 className="font-bold text-slate-700 text-xs">Tidak Ada Antrean Verifikasi Denda</h3>
                            </div>
                        )}
                    </div>
                )}

                {/* ======================================================== */}
                {/* TAB 4: TRANSAKSI PEMINJAMAN YANG MASIH AKTIF             */}
                {/* ======================================================== */}
                {activeTab === 'aktif_pinjam' && (
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-extrabold uppercase tracking-wider text-[10px]">
                                        <th className="p-3.5">Kode Transaksi</th>
                                        <th className="p-3.5">Peminjam</th>
                                        <th className="p-3.5">Fasilitas Dipinjam</th>
                                        <th className="p-3.5">Rentang Waktu</th>
                                        <th className="p-3.5 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredAktifPinjam.map((pinjam) => (
                                        <tr key={pinjam.id} className="hover:bg-slate-50/60 transition">
                                            <td className="p-3.5 font-mono font-bold text-[#006039]">
                                                {pinjam.kode}
                                            </td>
                                            <td className="p-3.5">
                                                <div className="font-bold text-slate-900">{pinjam.peminjam}</div>
                                                <div className="text-[11px] text-slate-500 mt-0.5">
                                                    {pinjam.nim_nip} • {pinjam.instansi_prodi}
                                                </div>
                                            </td>
                                            <td className="p-3.5">
                                                <div className="space-y-1">
                                                    {pinjam.items.map((it) => (
                                                        <span
                                                            key={it.id}
                                                            className="inline-block mr-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold"
                                                        >
                                                            {it.nama_barang} ({it.qty} {it.satuan || 'Unit'})
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-3.5 text-slate-600 text-[11px]">
                                                {pinjam.tanggal_mulai} s.d {pinjam.tanggal_kembali_rencana}
                                            </td>
                                            <td className="p-3.5 text-center">
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                    Sedang Digunakan
                                                </span>
                                            </td>
                                        </tr>
                                    ))}

                                    {filteredAktifPinjam.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-slate-400">
                                                Tidak ada transaksi peminjaman aktif yang sedang berlangsung.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ======================================================== */}
                {/* MODAL INSPEKSI FISIK & RESTOCK OTOMATIS                  */}
                {/* ======================================================== */}
                {inspeksiItem && (
                    <div
                        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
                        onClick={() => setInspeksiItem(null)}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden"
                        >
                            {/* Header Tetap */}
                            <div className="px-5 py-4 bg-[#006039] text-white flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                                        <ClipboardCheck className="w-4 h-4 text-emerald-200" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold leading-tight">
                                            Inspeksi Fisik &amp; Verifikasi Pengembalian
                                        </h3>
                                        <p className="text-[11px] text-emerald-100 mt-0.5">
                                            {inspeksiItem.kode} • Peminjam: <strong>{inspeksiItem.peminjam}</strong>
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setInspeksiItem(null)}
                                    className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer transition"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Body Scrollable */}
                            <div className="p-5 space-y-4 overflow-y-auto text-xs">
                                {/* Foto Bukti Mahasiswa di Dalam Modal */}
                                {inspeksiItem.foto_bukti && (
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-3.5">
                                        <img
                                            src={inspeksiItem.foto_bukti}
                                            alt="Foto Bukti Mahasiswa"
                                            onClick={() => {
                                                setLightboxUrl(inspeksiItem.foto_bukti);
                                                setLightboxTitle(`Foto Bukti ${inspeksiItem.kode}`);
                                            }}
                                            className="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0 cursor-pointer hover:opacity-85 transition"
                                        />
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs font-bold text-slate-800">
                                                    Foto Bukti Fisik Mahasiswa
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setLightboxUrl(inspeksiItem.foto_bukti);
                                                        setLightboxTitle(`Foto Bukti ${inspeksiItem.kode}`);
                                                    }}
                                                    className="text-[11px] font-bold text-[#006039] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    <span>Perbesar</span>
                                                </button>
                                            </div>
                                            {inspeksiItem.catatan_mahasiswa ? (
                                                <p className="text-[11px] text-slate-600 italic truncate">
                                                    Catatan: "{inspeksiItem.catatan_mahasiswa}"
                                                </p>
                                            ) : (
                                                <p className="text-[11px] text-slate-400">
                                                    Klik foto untuk melihat ukuran penuh
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Kondisi Masing-masing Barang */}
                                <div className="space-y-2.5">
                                    <label className="block font-bold text-slate-800 text-xs">
                                        Hasil Cek Kondisi Fisik Masing-masing Fasilitas:
                                    </label>
                                    {inspeksiItem.items.map((it) => {
                                        const currentKondisi = kondisiMap[it.id] || 'sempurna';
                                        const isDamaged = ['rusak_ringan', 'rusak_berat', 'hilang'].includes(currentKondisi);

                                        return (
                                            <div
                                                key={it.id}
                                                className={`p-3 rounded-xl flex items-center justify-between gap-3 text-xs transition border ${
                                                    isDamaged
                                                        ? 'bg-rose-50/70 border-rose-300 shadow-2xs'
                                                        : 'bg-slate-50 border-slate-200/90'
                                                }`}
                                            >
                                                <div className="min-w-0">
                                                    <div className="font-bold text-slate-900 truncate flex items-center gap-2">
                                                        <span>{it.nama_barang}</span>
                                                        {isDamaged && (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-100 text-rose-700 border border-rose-200">
                                                                {currentKondisi.replace('_', ' ')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 mt-0.5">
                                                        Jumlah: {it.qty} {it.satuan}
                                                    </div>
                                                </div>
                                                <select
                                                    value={currentKondisi}
                                                    onChange={(e) => handleKondisiChange(it.id, e.target.value)}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#006039] shrink-0 border cursor-pointer ${
                                                        isDamaged
                                                            ? 'bg-white border-rose-400 text-rose-800 ring-1 ring-rose-300'
                                                            : 'bg-white border-slate-200 text-slate-800'
                                                    }`}
                                                >
                                                    <option value="sempurna">Sempurna / Utuh (Kondisi Baik)</option>
                                                    <option value="rusak_ringan">Rusak Ringan</option>
                                                    <option value="rusak_berat">Rusak Berat</option>
                                                    <option value="hilang">Hilang</option>
                                                </select>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* JIKA SEMUA BARANG DALAM KONDISI BAIK: TIDAK MUNCUL DENDA */}
                                {!hasKerusakan ? (
                                    <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-start gap-2.5 text-emerald-900 text-xs">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-bold">Barang Kembali Lengkap &amp; Kondisi Baik</p>
                                            <p className="text-[11px] text-emerald-700 mt-0.5 leading-snug">
                                                Semua fasilitas dalam kondisi baik/utuh tanpa kerusakan. Tidak ada denda yang dikenakan dan fasilitas akan otomatis di-restock ke sistem.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    /* JIKA ADA BARANG RUSAK / HILANG: FORM DENDA & INSTRUKSI YANG RAPI & MENARIK */
                                    <div className="p-4 sm:p-5 bg-gradient-to-b from-rose-50/70 via-white to-amber-50/30 border border-rose-200/90 rounded-2xl space-y-4 shadow-2xs animate-in fade-in duration-200">
                                        {/* Header Tagihan Denda */}
                                        <div className="flex items-start gap-3 pb-3 border-b border-rose-200/70">
                                            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 shadow-2xs">
                                                <AlertTriangle className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                                    <h4 className="font-black text-xs sm:text-sm text-rose-950">
                                                        Tagihan Denda Kerusakan / Kehilangan (Diurus Staf)
                                                    </h4>
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                                        Wajib Dilengkapi
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-rose-800 mt-1 leading-relaxed">
                                                    Fasilitas terindikasi mengalami kerusakan atau hilang saat diperiksa staf. Silakan tentukan nominal denda serta tuliskan catatan instruksi kerusakan untuk peminjam.
                                                </p>
                                            </div>
                                        </div>

                                        {/* 1. Input Nominal Denda */}
                                        <div className="space-y-1.5">
                                            <label className="block font-bold text-slate-800 text-xs">
                                                Nominal Denda Kerusakan <span className="text-rose-500 font-extrabold">* (Wajib Diisi)</span>:
                                            </label>
                                            <div
                                                className={`flex items-center bg-white border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-rose-500/20 transition shadow-2xs ${
                                                    biayaDenda === '' || Number(biayaDenda) <= 0
                                                        ? 'border-rose-300'
                                                        : 'border-emerald-400 ring-1 ring-emerald-300/40'
                                                }`}
                                            >
                                                <span className="px-3.5 py-2.5 bg-rose-100/80 border-r border-rose-200 text-xs font-extrabold text-rose-800 select-none shrink-0">
                                                    Rp
                                                </span>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    required
                                                    value={
                                                        biayaDenda !== '' && Number(biayaDenda) > 0
                                                            ? Number(biayaDenda).toLocaleString('id-ID')
                                                            : ''
                                                    }
                                                    onChange={(e) => {
                                                        const rawDigits = e.target.value.replace(/\D/g, '');
                                                        setBiayaDenda(rawDigits ? parseInt(rawDigits, 10) : '');
                                                    }}
                                                    className="w-full px-3.5 py-2.5 bg-transparent text-sm font-extrabold text-slate-900 focus:outline-none placeholder:text-slate-400 placeholder:font-normal placeholder:text-xs"
                                                    placeholder="Ketikkan nominal denda (contoh: 50.000, 100.000, 250.000...)"
                                                />
                                            </div>
                                            {biayaDenda === '' || Number(biayaDenda) <= 0 ? (
                                                <p className="text-[10px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                    Nominal denda belum diisi. Masukkan nominal ganti rugi kerusakan.
                                                </p>
                                            ) : (
                                                <p className="text-[10px] text-emerald-700 font-bold mt-1 flex items-center gap-1">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                    Denda sebesar Rp {Number(biayaDenda).toLocaleString('id-ID')} akan ditagihkan ke mahasiswa/peminjam.
                                                </p>
                                            )}
                                        </div>

                                        {/* 2. Catatan Kerusakan & Instruksi Denda (Textarea) */}
                                        <div className="space-y-1.5">
                                            <label className="block font-bold text-slate-800 text-xs">
                                                Catatan Kerusakan &amp; Instruksi Denda <span className="text-rose-500 font-extrabold">* (Wajib Diisi)</span>:
                                            </label>
                                            <textarea
                                                rows={3}
                                                required
                                                value={catatanInspeksi}
                                                onChange={(e) => setCatatanInspeksi(e.target.value)}
                                                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition resize-none placeholder:text-slate-400 shadow-2xs leading-relaxed ${
                                                    !catatanInspeksi.trim()
                                                        ? 'border-rose-300'
                                                        : 'border-slate-300'
                                                }`}
                                                placeholder="Tuliskan detail kerusakan fisik barang (misal: layar monitor retak di sudut kanan, kabel power hilang) serta batas waktu transfer bagi peminjam..."
                                            />
                                            {!catatanInspeksi.trim() ? (
                                                <p className="text-[10px] text-rose-600 font-semibold mt-0.5 flex items-center gap-1">
                                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                    Catatan kerusakan wajib diisi agar peminjam memahami alasan tagihan denda.
                                                </p>
                                            ) : (
                                                <p className="text-[10px] text-slate-500 mt-0.5">
                                                    Catatan ini langsung ditampilkan di halaman peminjam untuk instruksi pembayaran.
                                                </p>
                                            )}
                                        </div>

                                        {/* 3. Kartu Nomor Rekening Tujuan Pembayaran Denda (Modern & Menarik) */}
                                        <div className="space-y-2 pt-1">
                                            <div className="flex items-center justify-between">
                                                <label className="block font-bold text-slate-800 text-xs">
                                                    Nomor Rekening Tujuan Pembayaran Denda:
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsEditingRekening(!isEditingRekening)}
                                                    className="text-[11px] font-bold text-[#006039] hover:underline cursor-pointer"
                                                >
                                                    {isEditingRekening ? 'Selesai Edit' : 'Ubah Info Rekening'}
                                                </button>
                                            </div>

                                            {/* Kartu Bank Syariah Indonesia Eksklusif */}
                                            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#004e2e] via-[#006039] to-[#0d7d4d] text-white p-4 sm:p-4.5 shadow-md border border-emerald-600/40">
                                                {/* Dekorasi Visual Background */}
                                                <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/5 pointer-events-none blur-xl" />
                                                <div className="absolute top-2 right-2 p-2 opacity-15 pointer-events-none">
                                                    <Building2 className="w-16 h-16 text-white" />
                                                </div>

                                                <div className="relative z-10 space-y-3">
                                                    {/* Header Kartu Bank */}
                                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-xs border border-white/20 shadow-2xs">
                                                                <CreditCard className="w-4 h-4 text-emerald-200" />
                                                            </div>
                                                            <div>
                                                                <div className="text-xs font-black tracking-wide text-white uppercase flex items-center gap-1.5">
                                                                    <span>BSI (Bank Syariah Indonesia)</span>
                                                                </div>
                                                                <div className="text-[10px] text-emerald-200/90 font-medium">
                                                                    Rekening Resmi Kas Biro Sarpras
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-300/30">
                                                            Tujuan Transfer Mahasiswa
                                                        </span>
                                                    </div>

                                                    {/* Nomor Rekening & Tombol Salin */}
                                                    <div className="bg-black/25 backdrop-blur-xs rounded-xl p-3 border border-white/15 flex items-center justify-between gap-3">
                                                        <div>
                                                            <div className="text-[9px] uppercase font-bold tracking-wider text-emerald-200/80">
                                                                Nomor Rekening
                                                            </div>
                                                            <div className="text-base sm:text-lg font-mono font-black tracking-wider text-white select-all">
                                                                {nomorRekening.match(/\d{8,}/)
                                                                    ? nomorRekening.match(/\d{8,}/)![0]
                                                                    : '7182938475'}
                                                            </div>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={handleCopyRekening}
                                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0 ${
                                                                copiedRekening
                                                                    ? 'bg-emerald-400 text-emerald-950 font-black'
                                                                    : 'bg-white/20 hover:bg-white/30 text-white border border-white/25'
                                                            }`}
                                                            title="Salin nomor rekening ke clipboard"
                                                        >
                                                            {copiedRekening ? (
                                                                <>
                                                                    <Check className="w-3.5 h-3.5" />
                                                                    <span>Tersalin!</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Copy className="w-3.5 h-3.5" />
                                                                    <span>Salin No. Rek</span>
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>

                                                    {/* Nama Pemilik Rekening */}
                                                    <div className="flex items-center justify-between text-[11px] pt-0.5">
                                                        <div>
                                                            <span className="text-emerald-200/80">Atas Nama: </span>
                                                            <span className="font-bold text-white">
                                                                Biro Sarpras Universitas Nurul Huda
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] text-emerald-200/70 italic hidden sm:inline">
                                                            Diverifikasi oleh Admin Sarpras
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Input Kustomisasi Teks Rekening Jika Dibutuhkan */}
                                            {isEditingRekening && (
                                                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs animate-in fade-in duration-150">
                                                    <label className="block text-[11px] font-bold text-slate-700">
                                                        Teks Rekening Custom (Opsional):
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={nomorRekening}
                                                        onChange={(e) => setNomorRekening(e.target.value)}
                                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#006039]"
                                                        placeholder="Contoh: BSI No. Rek 7182938475 a.n. Biro Sarpras"
                                                        required
                                                    />
                                                    <p className="text-[10px] text-slate-500">
                                                        Teks ini akan disertakan pada detail pembayaran mahasiswa peminjam.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer Modal */}
                            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setInspeksiItem(null)}
                                    className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs transition cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    disabled={isProcessing || !isFormDendaValid}
                                    onClick={handleSimpanInspeksi}
                                    className="px-5 py-2 bg-[#006039] hover:bg-[#0f4c3a] text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>
                                        {isProcessing
                                            ? 'Menyimpan...'
                                            : hasKerusakan
                                            ? 'Simpan Cek Fisik & Terbitkan Denda'
                                            : 'Selesaikan Cek Fisik (Kondisi Baik)'}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL VERIFIKASI DENDA */}
                {verifikasiDendaItem && (
                    <div
                        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
                        onClick={() => setVerifikasiDendaItem(null)}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 p-5 space-y-4"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <h3 className="font-bold text-slate-900 text-sm">Konfirmasi Pembayaran Denda</h3>
                                <button
                                    type="button"
                                    onClick={() => setVerifikasiDendaItem(null)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <p className="text-xs text-slate-600">
                                Transaksi <strong className="font-mono text-slate-900">{verifikasiDendaItem.kode}</strong> • Total Denda:{' '}
                                <strong className="text-rose-700">Rp {verifikasiDendaItem.biaya_denda.toLocaleString('id-ID')}</strong>
                            </p>

                            <div>
                                <label className="block font-bold text-slate-700 text-xs mb-1">
                                    Catatan Verifikasi Admin:
                                </label>
                                <textarea
                                    value={catatanVerifikasiDenda}
                                    onChange={(e) => setCatatanVerifikasiDenda(e.target.value)}
                                    rows={3}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006039]"
                                    placeholder="Tuliskan catatan verifikasi bukti transfer..."
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => handleVerifikasiDendaSubmit('ditolak')}
                                    disabled={isProcessing}
                                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 cursor-pointer"
                                >
                                    Tolak Transfer
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleVerifikasiDendaSubmit('lunas')}
                                    disabled={isProcessing}
                                    className="px-5 py-2 bg-[#006039] hover:bg-[#0f4c3a] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                                >
                                    Konfirmasi Lunas
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL LIGHTBOX FOTO */}
                {lightboxUrl && (
                    <div
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
                        onClick={() => setLightboxUrl(null)}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="relative max-w-4xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                        >
                            <div className="p-3 bg-slate-900/90 text-white flex items-center justify-between border-b border-white/10">
                                <span className="font-bold text-xs truncate max-w-md">{lightboxTitle}</span>
                                <button
                                    type="button"
                                    onClick={() => setLightboxUrl(null)}
                                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="p-2 sm:p-4 flex items-center justify-center max-h-[80vh] overflow-hidden">
                                <img
                                    src={lightboxUrl}
                                    alt="Preview Penuh"
                                    className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
