import React, { useState, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Box } from 'lucide-react';
import {
    Package,
    Search,
    FileText,
    FileSpreadsheet,
    Save,
    RotateCcw,
    Trash2,
    Plus,
    ChevronUp,
    CheckCircle2,
    Calendar,
    MapPin,
    Tag,
    Wallet,
    Layers,
} from 'lucide-react';

interface InventarisItem {
    id: number;
    tanggal: string;
    kode: string;
    nama: string;
    ruang: string;
    baik: number;
    sedang: number;
    buruk: number;
    jumlah: number;
    harga: number; // Harga Satuan
    total: number; // Jumlah x Harga Satuan
}

// Fungsi bantu format tanggal Indonesia
function formatTanggalIndo(dateStr: string) {
    if (!dateStr) return '-';
    const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const tahun = parts[0];
    const blnIdx = parseInt(parts[1], 10) - 1;
    const tgl = parseInt(parts[2], 10);
    return `${tgl} ${bulan[blnIdx] || parts[1]} ${tahun}`;
}

// Fungsi bantu format ribuan (30.000)
function formatRibuan(angka: string | number) {
    const clean = String(angka).replace(/[^0-9]/g, '');
    if (!clean) return '';
    return Number(clean).toLocaleString('id-ID');
}

export default function IndexInventaris() {
    const today = new Date().toISOString().split('T')[0];

    const [showForm, setShowForm] = useState(true);
    const [notif, setNotif] = useState<string | null>(null);

    // State Daftar Ruangan (Bisa ditambah dinamis)
    const [daftarRuangan, setDaftarRuangan] = useState<string[]>([
        'Lab Komputer Kampus A',
        'Ruang Rapat Kampus A',
        'Gudang Sarpras Kampus B',
        'Lab Microteaching Kampus B',
        'Aula Utama Kampus B',
    ]);

    // State Form Input
    const [tanggal, setTanggal] = useState(today);
    const [kode, setKode] = useState('SR-ELK-096');
    const [nama, setNama] = useState('');
    const [ruang, setRuang] = useState('Lab Komputer Kampus A');
    
    // State khusus untuk mode tambah ruangan baru
    const [isAddingRuang, setIsAddingRuang] = useState(false);
    const [ruangBaru, setRuangBaru] = useState('');

    const [baik, setBaik] = useState('0');
    const [sedang, setSedang] = useState('0');
    const [buruk, setBuruk] = useState('0');
    const [hargaRaw, setHargaRaw] = useState<number>(0);

    // Filter Tabel
    const [cari, setCari] = useState('');
    const [filterRuang, setFilterRuang] = useState('Semua');

    const handleAngkaKondisi = (val: string, setter: (v: string) => void) => {
        const clean = val.replace(/[^0-9]/g, '');
        setter(clean);
    };

    const handleInputHarga = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawDigits = e.target.value.replace(/[^0-9]/g, '');
        setHargaRaw(rawDigits ? parseInt(rawDigits, 10) : 0);
    };

    const numBaik = parseInt(baik || '0', 10);
    const numSedang = parseInt(sedang || '0', 10);
    const numBuruk = parseInt(buruk || '0', 10);

    const totalUnit = numBaik + numSedang + numBuruk;
    const totalNilai = totalUnit * hargaRaw;

    // Data Awal Tabel
    const [items, setItems] = useState<InventarisItem[]>([
        {
            id: 1,
            tanggal: '2026-10-15',
            kode: 'SR-ELK-089',
            nama: 'Proyektor Epson EB-E500',
            ruang: 'Lab Komputer Kampus A',
            baik: 8,
            sedang: 2,
            buruk: 0,
            jumlah: 10,
            harga: 6500000,
            total: 65000000,
        },
        {
            id: 2,
            tanggal: '2026-10-18',
            kode: 'SR-MBL-012',
            nama: 'AC Split Daikin 2 PK',
            ruang: 'Ruang Rapat Kampus A',
            baik: 4,
            sedang: 1,
            buruk: 0,
            jumlah: 5,
            harga: 4800000,
            total: 24000000,
        },
    ]);

    // Handler saat user memilih opsi dropdown ruangan
    const handleSelectRuangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === 'TAMBAH_RUANG_BARU') {
            setIsAddingRuang(true);
            setRuangBaru('');
        } else {
            setIsAddingRuang(false);
            setRuang(val);
        }
    };

    // Handler untuk menyimpan ruangan baru ke dalam list dropdown
    const handleSimpanRuangBaru = () => {
        const trimmed = ruangBaru.trim();
        if (!trimmed) {
            alert('Nama ruangan tidak boleh kosong.');
            return;
        }
        if (daftarRuangan.includes(trimmed)) {
            alert('Ruangan tersebut sudah ada dalam daftar.');
            setRuang(trimmed);
            setIsAddingRuang(false);
            return;
        }

        setDaftarRuangan([...daftarRuangan, trimmed]);
        setRuang(trimmed);
        setIsAddingRuang(false);
        setRuangBaru('');
    };

    const resetForm = () => {
        setNama('');
        setTanggal(today);
        setBaik('0');
        setSedang('0');
        setBuruk('0');
        setHargaRaw(0);
        setIsAddingRuang(false);
    };

    const handleSimpan = (e: React.FormEvent) => {
        e.preventDefault();
        if (!nama.trim() || totalUnit <= 0) {
            alert('Silakan isi Nama Barang dan minimal 1 jumlah unit pada kondisi barang.');
            return;
        }

        const baru: InventarisItem = {
            id: Date.now(),
            tanggal,
            kode,
            nama,
            ruang,
            baik: numBaik,
            sedang: numSedang,
            buruk: numBuruk,
            jumlah: totalUnit,
            harga: hargaRaw,
            total: totalNilai,
        };

        setItems([baru, ...items]);
        setKode(`SR-ELK-0${97 + items.length}`);
        resetForm();
        setNotif(`Barang "${baru.nama}" berhasil disimpan ke daftar inventaris!`);
        setTimeout(() => setNotif(null), 3500);
    };

    const dataTampil = useMemo(() => {
        return items.filter((item) => {
            const cocokCari =
                item.nama.toLowerCase().includes(cari.toLowerCase()) ||
                item.kode.toLowerCase().includes(cari.toLowerCase());
            const cocokRuang = filterRuang === 'Semua' || item.ruang === filterRuang;
            return cocokCari && cocokRuang;
        });
    }, [items, cari, filterRuang]);

    const grandTotalUnit = dataTampil.reduce((acc, cur) => acc + cur.jumlah, 0);
    const grandTotalHarga = dataTampil.reduce((acc, cur) => acc + cur.total, 0);

    return (
        <AdminLayout>
            <Head title="Inventaris Sarana - Biro Sarpras" />

            <div className="max-w-7xl mx-auto space-y-6 pb-12 px-2 sm:px-4 font-sans text-slate-800">
                
                {/* 1. HEADER & KARTU RINGKASAN */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 border border-slate-200/80 flex items-center justify-center shrink-0">
                            <Box className="w-5 h-5" strokeWidth={1.75} />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                                Kelola Inventaris Sarana
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                Input data barang, pilih atau tambah lokasi ruangan, kondisi fisik, dan cetak laporan.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {/* Search Bar di Header Atas */}
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute inset-y-0 left-3 my-auto w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                value={cari}
                                onChange={(e) => setCari(e.target.value)}
                                placeholder="Cari nama barang atau kode..."
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006039] font-medium"
                            />
                        </div>
                        <div className="flex items-center gap-4 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200/80">
                            <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-[#006039]" />
                                <div className="text-xs">
                                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Total Aset</span>
                                    <strong className="text-slate-900">{grandTotalUnit} Unit</strong>
                                </div>
                            </div>
                            <div className="h-7 w-px bg-slate-200" />
                            <div className="flex items-center gap-2">
                                <Wallet className="w-4 h-4 text-[#006039]" />
                                <div className="text-xs">
                                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Total Nilai</span>
                                    <strong className="text-[#006039]">Rp {grandTotalHarga.toLocaleString('id-ID')}</strong>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowForm(!showForm)}
                            className={`px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 transition shrink-0 ${
                                showForm
                                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    : 'bg-[#006039] text-white hover:bg-[#0f4c3a] shadow-sm'
                            }`}
                        >
                            {showForm ? (
                                <>
                                    <ChevronUp className="w-4 h-4" />
                                    <span>Sembunyikan Form</span>
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" />
                                    <span>Tambah Barang Baru</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Notifikasi */}
                {notif && (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#006039] text-xs font-bold flex items-center gap-2.5 shadow-xs">
                        <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                        <span>{notif}</span>
                    </div>
                )}

                {/* 2. FORM INPUT */}
                {showForm && (
                    <form
                        onSubmit={handleSimpan}
                        className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden"
                    >
                        <div className="bg-[#006039] px-6 py-3.5 text-white flex items-center justify-between">
                            <span className="font-bold text-xs sm:text-sm flex items-center gap-2">
                                <Plus className="w-4 h-4 text-[#FCB900]" />
                                Formulir Input Barang Inventaris Baru
                            </span>
                            <span className="text-[11px] bg-white/15 px-2.5 py-0.5 rounded-full text-emerald-100 font-medium">
                                Pilih / Tambah Ruangan Fleksibel
                            </span>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* LANGKAH 1: IDENTITAS & RUANGAN */}
                            <div>
                                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                                    <span className="w-5 h-5 rounded-full bg-[#006039] text-white text-[10px] flex items-center justify-center">1</span>
                                    Informasi & Tanggal Pencatatan Barang
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                                    {/* Tanggal */}
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1.5">
                                            Tanggal Pencatatan <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Calendar className="absolute inset-y-0 left-3 my-auto w-4 h-4 text-slate-400 pointer-events-none" />
                                            <input
                                                type="date"
                                                value={tanggal}
                                                onChange={(e) => setTanggal(e.target.value)}
                                                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006039]"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Kode Barang */}
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1.5">
                                            Kode Barang <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Tag className="absolute inset-y-0 left-3 my-auto w-4 h-4 text-slate-400 pointer-events-none" />
                                            <input
                                                type="text"
                                                value={kode}
                                                onChange={(e) => setKode(e.target.value)}
                                                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 font-mono font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006039]"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Nama Barang */}
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1.5">
                                            Nama Barang <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={nama}
                                            onChange={(e) => setNama(e.target.value)}
                                            placeholder="Contoh: Proyektor Epson EB-E500"
                                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-[#006039]"
                                            required
                                        />
                                    </div>

                                    {/* Ruang / Lokasi (Bisa Pilih atau Tambah Baru) */}
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1.5">
                                            Ruang / Lokasi <span className="text-rose-500">*</span>
                                        </label>
                                        
                                        {!isAddingRuang ? (
                                            <div className="relative">
                                                <MapPin className="absolute inset-y-0 left-3 my-auto w-4 h-4 text-slate-400 pointer-events-none" />
                                                <select
                                                    value={ruang}
                                                    onChange={handleSelectRuangChange}
                                                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006039]"
                                                >
                                                    {daftarRuangan.map((r, idx) => (
                                                        <option key={idx} value={r}>
                                                            {r}
                                                        </option>
                                                    ))}
                                                    <option value="TAMBAH_RUANG_BARU" className="font-bold text-[#006039]">
                                                        + Tambah Ruangan Baru...
                                                    </option>
                                                </select>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5">
                                                <input
                                                    type="text"
                                                    value={ruangBaru}
                                                    onChange={(e) => setRuangBaru(e.target.value)}
                                                    placeholder="Ketik nama ruang baru..."
                                                    className="w-full px-3 py-2 border border-[#006039] rounded-xl font-semibold text-xs focus:outline-none"
                                                    autoFocus
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleSimpanRuangBaru}
                                                    className="px-3 py-2 bg-[#006039] text-white rounded-xl font-bold text-xs shrink-0"
                                                >
                                                    Pakai
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsAddingRuang(false)}
                                                    className="px-2 py-2 bg-slate-200 text-slate-600 rounded-xl font-bold text-xs shrink-0"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* LANGKAH 2: KONDISI & HARGA */}
                            <div className="pt-4 border-t border-slate-100">
                                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                                    <span className="w-5 h-5 rounded-full bg-[#006039] text-white text-[10px] flex items-center justify-center">2</span>
                                    Rincian Jumlah Kondisi & Harga Perolehan
                                </h3>

                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                                    {/* 3 Kotak Kondisi + Total Unit */}
                                    <div className="lg:col-span-7 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3 items-center">
                                        <div className="bg-white p-3 rounded-xl border border-emerald-200 text-center">
                                            <label className="block text-[11px] font-extrabold text-emerald-700 mb-1">
                                                Kondisi Baik
                                            </label>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={baik}
                                                onFocus={() => baik === '0' && setBaik('')}
                                                onBlur={() => baik === '' && setBaik('0')}
                                                onChange={(e) => handleAngkaKondisi(e.target.value, setBaik)}
                                                placeholder="0"
                                                className="w-full py-1.5 text-center border border-slate-200 rounded-lg font-extrabold text-base text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            />
                                        </div>

                                        <div className="bg-white p-3 rounded-xl border border-amber-200 text-center">
                                            <label className="block text-[11px] font-extrabold text-amber-700 mb-1">
                                                Kondisi Sedang
                                            </label>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={sedang}
                                                onFocus={() => sedang === '0' && setSedang('')}
                                                onBlur={() => sedang === '' && setSedang('0')}
                                                onChange={(e) => handleAngkaKondisi(e.target.value, setSedang)}
                                                placeholder="0"
                                                className="w-full py-1.5 text-center border border-slate-200 rounded-lg font-extrabold text-base text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>

                                        <div className="bg-white p-3 rounded-xl border border-rose-200 text-center">
                                            <label className="block text-[11px] font-extrabold text-rose-600 mb-1">
                                                Kondisi Buruk
                                            </label>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={buruk}
                                                onFocus={() => buruk === '0' && setBuruk('')}
                                                onBlur={() => buruk === '' && setBuruk('0')}
                                                onChange={(e) => handleAngkaKondisi(e.target.value, setBuruk)}
                                                placeholder="0"
                                                className="w-full py-1.5 text-center border border-slate-200 rounded-lg font-extrabold text-base text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
                                            />
                                        </div>

                                        <div className="bg-slate-200/80 p-3 rounded-xl border border-slate-300 text-center flex flex-col justify-center h-full">
                                            <span className="text-[10px] font-bold uppercase text-slate-500">
                                                Jumlah Total
                                            </span>
                                            <span className="text-lg font-extrabold text-slate-900 mt-1">
                                                {totalUnit} Unit
                                            </span>
                                        </div>
                                    </div>

                                    {/* Harga Satuan & Total */}
                                    <div className="lg:col-span-5 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200/80 flex flex-col justify-between gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Harga Perolehan Satuan <span className="text-rose-500">*</span>
                                            </label>
                                            <div className="relative flex items-center">
                                                <span className="absolute left-3.5 font-extrabold text-sm text-[#006039] select-none">
                                                    Rp
                                                </span>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={hargaRaw === 0 ? '' : formatRibuan(hargaRaw)}
                                                    onChange={handleInputHarga}
                                                    placeholder="Contoh: 30.000"
                                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-emerald-300 rounded-xl font-extrabold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006039]"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="px-4 py-2.5 rounded-xl bg-[#006039] text-white flex items-center justify-between">
                                            <span className="text-[11px] text-emerald-100 font-medium">
                                                Total Nilai ({totalUnit} Unit):
                                            </span>
                                            <span className="text-sm sm:text-base font-extrabold tracking-tight">
                                                Rp {totalNilai.toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tombol Simpan */}
                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 transition"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Kosongkan Form</span>
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-[#006039] hover:bg-[#0f4c3a] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>Simpan ke Daftar Inventaris</span>
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {/* 3. TABEL LAPORAN INVENTARIS */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2.5 flex-1">
                            <select
                                value={filterRuang}
                                onChange={(e) => setFilterRuang(e.target.value)}
                                className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 cursor-pointer"
                            >
                                <option value="Semua">Semua Ruangan</option>
                                {daftarRuangan.map((r, idx) => (
                                    <option key={idx} value={r}>
                                        {r}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Tombol Export */}
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-400 hidden sm:inline mr-1">
                                Unduh Laporan:
                            </span>
                            <a
                                href="/admin/laporan/export?format=pdf"
                                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/60 rounded-xl font-bold text-xs flex items-center gap-1.5 transition"
                            >
                                <FileText className="w-3.5 h-3.5" />
                                <span>PDF</span>
                            </a>
                            <a
                                href="/admin/laporan/export?format=word"
                                className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/60 rounded-xl font-bold text-xs flex items-center gap-1.5 transition"
                            >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Word</span>
                            </a>
                            <a
                                href="/admin/laporan/export?format=csv"
                                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#006039] border border-emerald-200/60 rounded-xl font-bold text-xs flex items-center gap-1.5 transition"
                            >
                                <FileSpreadsheet className="w-3.5 h-3.5" />
                                <span>CSV / Excel</span>
                            </a>
                        </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[11px]">
                                <tr>
                                    <th className="p-3.5">Tanggal</th>
                                    <th className="p-3.5">Kode</th>
                                    <th className="p-3.5">Nama Barang</th>
                                    <th className="p-3.5">Ruang / Lokasi</th>
                                    <th className="p-3.5 text-center text-emerald-700 bg-emerald-50/60">Baik</th>
                                    <th className="p-3.5 text-center text-amber-700 bg-amber-50/60">Sedang</th>
                                    <th className="p-3.5 text-center text-rose-600 bg-rose-50/60">Buruk</th>
                                    <th className="p-3.5 text-center">Jumlah</th>
                                    <th className="p-3.5 text-right">Harga Satuan</th>
                                    <th className="p-3.5 text-right text-[#006039] bg-emerald-50/30">Total Harga</th>
                                    <th className="p-3.5 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {dataTampil.length === 0 ? (
                                    <tr>
                                        <td colSpan={11} className="p-8 text-center text-slate-400">
                                            Data barang tidak ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    dataTampil.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/80 transition">
                                            <td className="p-3.5 text-slate-500 font-medium whitespace-nowrap">
                                                {formatTanggalIndo(item.tanggal)}
                                            </td>
                                            <td className="p-3.5 font-mono font-bold text-slate-600 whitespace-nowrap">
                                                {item.kode}
                                            </td>
                                            <td className="p-3.5 font-bold text-slate-900">{item.nama}</td>
                                            <td className="p-3.5 text-slate-600 font-medium">{item.ruang}</td>
                                            <td className="p-3.5 text-center font-bold text-emerald-700 bg-emerald-50/20">
                                                {item.baik}
                                            </td>
                                            <td className="p-3.5 text-center font-bold text-amber-700 bg-amber-50/20">
                                                {item.sedang}
                                            </td>
                                            <td className="p-3.5 text-center font-bold text-rose-600 bg-rose-50/20">
                                                {item.buruk}
                                            </td>
                                            <td className="p-3.5 text-center font-extrabold text-slate-900 whitespace-nowrap">
                                                {item.jumlah} Unit
                                            </td>
                                            <td className="p-3.5 text-right text-slate-700 font-semibold whitespace-nowrap">
                                                Rp {item.harga.toLocaleString('id-ID')}
                                            </td>
                                            <td className="p-3.5 text-right font-extrabold text-[#006039] bg-emerald-50/20 whitespace-nowrap">
                                                Rp {item.total.toLocaleString('id-ID')}
                                            </td>
                                            <td className="p-3.5 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => setItems(items.filter((i) => i.id !== item.id))}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                                    title="Hapus Barang"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>

                            <tfoot className="bg-slate-900 text-white font-bold text-xs">
                                <tr>
                                    <td colSpan={7} className="p-3.5 text-right text-slate-300 uppercase tracking-wider">
                                        Grand Total Laporan Inventaris :
                                    </td>
                                    <td className="p-3.5 text-center text-emerald-300 font-extrabold whitespace-nowrap">
                                        {grandTotalUnit} Unit
                                    </td>
                                    <td className="p-3.5 text-right text-slate-400 font-normal">Total Valuasi :</td>
                                    <td className="p-3.5 text-right text-emerald-300 font-extrabold text-sm whitespace-nowrap">
                                        Rp {grandTotalHarga.toLocaleString('id-ID')}
                                    </td>
                                    <td />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
}