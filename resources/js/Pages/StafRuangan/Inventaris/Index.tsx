import React, { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    Building2,
    Package,
    Box,
    ClipboardCheck,
    CheckSquare,
    Search,
    Filter,
    SlidersHorizontal,
    Plus,
    Wrench,
    CheckCircle2,
    AlertTriangle,
    AlertCircle,
    Calendar,
    Camera,
    Eye,
    X,
    MessageSquare,
    Send,
    Tag,
    Clock,
    Check,
    FileText,
    Lock,
    Pencil,
    Trash2,
    Download,
    Printer,
    FileSpreadsheet,
} from 'lucide-react';
import DeleteConfirmModal from '@/Components/Admin/DeleteConfirmModal';
import { exportToExcel, exportToPdf, exportToCsv, ExportSheet } from '@/utils/exportHelper';

interface SaranaItem {
    id: number;
    kode: string;
    nama: string;
    kategori: string;
    lokasi: string;
    stok_total: number;
    stok_tersedia: number;
    jumlah_baik?: number;
    jumlah_sedang?: number;
    jumlah_rusak?: number;
    satuan: string;
    kondisi_umum: string;
    deskripsi?: string | null;
    foto_url: string | null;
    tanggal_input?: string;
    tahun?: string;
    created_at_iso?: string;
}

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
    pelapor_nama?: string;
    pelapor_role?: string;
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
    inventaris: SaranaItem[];
    laporanList: LaporanItem[];
    inventarisTemplate: TemplateItem[];
    ruanganOptions?: string[];
    activeTab?: string;
    isAdminView?: boolean;
}

export default function InventarisPengecekanUnifiedIndex({
    ruanganNama,
    inventaris = [],
    laporanList = [],
    inventarisTemplate = [],
    ruanganOptions = [],
    activeTab = 'inventaris',
    isAdminView = false,
}: Props) {
    const { auth, flash } = usePage().props as any;
    const isAdmin = isAdminView || (auth?.user?.role as string) === 'admin';

    const [currentTab, setCurrentTab] = useState<'inventaris' | 'pengecekan'>(
        activeTab === 'pengecekan' ? 'pengecekan' : 'inventaris'
    );

    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [filterRuangan, setFilterRuangan] = useState<string>('semua');

    // Sync query parameter & activeTab prop
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab') || activeTab;
        if (tabParam === 'pengecekan') {
            setCurrentTab('pengecekan');
        } else if (tabParam === 'inventaris') {
            setCurrentTab('inventaris');
        }
    }, [activeTab]);

    useEffect(() => {
        if (flash?.success) {
            setToast({ type: 'success', message: flash.success });
        } else if (flash?.error) {
            setToast({ type: 'error', message: flash.error });
        }
    }, [flash?.success, flash?.error]);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => {
            setToast(null);
        }, 4000);
        return () => clearTimeout(timer);
    }, [toast]);

    // Filter & Search untuk Tab Inventaris
    const [cariInventaris, setCariInventaris] = useState('');
    const [filterKondisiInventaris, setFilterKondisiInventaris] = useState('semua');
    const [filterTahunInventaris, setFilterTahunInventaris] = useState('semua');

    // Filter & Search untuk Tab Laporan Pengecekan
    const [cariLaporan, setCariLaporan] = useState('');
    const [statusFilterLaporan, setStatusFilterLaporan] = useState('semua');

    // Modal Download Inventaris (Admin)
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
    const [dlModeRuangan, setDlModeRuangan] = useState<'semua_pisah' | 'semua_gabung' | 'pilih_ruangan'>('semua_pisah');
    const [dlSelectedRooms, setDlSelectedRooms] = useState<string[]>([]);
    const [dlKondisi, setDlKondisi] = useState<string>('semua');
    const [dlTahun, setDlTahun] = useState<string>('semua');
    const [dlStartDate, setDlStartDate] = useState<string>('');
    const [dlEndDate, setDlEndDate] = useState<string>('');

    // Modal States
    const [isTambahInventarisModalOpen, setIsTambahInventarisModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<SaranaItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<SaranaItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [previewFoto, setPreviewFoto] = useState<{ url: string; nama: string } | null>(null);
    const [selectedDetailLaporan, setSelectedDetailLaporan] = useState<LaporanItem | null>(null);
    const [verifikasiStatus, setVerifikasiStatus] = useState<'diverifikasi_admin' | 'ditindaklanjuti'>('diverifikasi_admin');
    const [verifikasiCatatan, setVerifikasiCatatan] = useState('');
    const [isSubmittingVerifikasi, setIsSubmittingVerifikasi] = useState(false);

    // Form Tambah / Edit Inventaris
    const [namaBarang, setNamaBarang] = useState('');
    const [jumlahAsetTotal, setJumlahAsetTotal] = useState<number | string>('');
    const [jumlahBaik, setJumlahBaik] = useState<number | string>('');
    const [jumlahSedang, setJumlahSedang] = useState<number | string>('');
    const [jumlahRusak, setJumlahRusak] = useState<number | string>('');
    const [lokasiBarang, setLokasiBarang] = useState(ruanganOptions[0] || ruanganNama);
    const [deskripsiBarang, setDeskripsiBarang] = useState('');
    const [fotoBarangFile, setFotoBarangFile] = useState<File | null>(null);
    const [fotoBarangPreview, setFotoBarangPreview] = useState<string | null>(null);
    const [isSubmittingInventaris, setIsSubmittingInventaris] = useState(false);
    const [isSubmittingPengecekan, setIsSubmittingPengecekan] = useState(false);

    const todayDisplayDate = new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date());

    const totalJumlahInput =
        (Number(jumlahBaik) || 0) + (Number(jumlahSedang) || 0) + (Number(jumlahRusak) || 0);

    const normalizeKondisi = (kondisi?: string | null): { label: string; value: 'Baik' | 'Sedang' | 'Rusak'; badgeClass: string } => {
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

    const getRincianKondisiItem = (item: SaranaItem): { baik: number; sedang: number; rusak: number; total: number } => {
        if (
            typeof item.jumlah_baik === 'number' ||
            typeof item.jumlah_sedang === 'number' ||
            typeof item.jumlah_rusak === 'number'
        ) {
            const baik = Number(item.jumlah_baik) || 0;
            const sedang = Number(item.jumlah_sedang) || 0;
            const rusak = Number(item.jumlah_rusak) || 0;
            return {
                baik,
                sedang,
                rusak,
                total: baik + sedang + rusak || Number(item.stok_total) || 0,
            };
        }

        const desc = item.deskripsi || '';
        const match = desc.match(/Baik:\s*(\d+)\s*,\s*Sedang:\s*(\d+)\s*,\s*Rusak:\s*(\d+)/i);
        if (match) {
            const baik = parseInt(match[1], 10) || 0;
            const sedang = parseInt(match[2], 10) || 0;
            const rusak = parseInt(match[3], 10) || 0;
            return {
                baik,
                sedang,
                rusak,
                total: baik + sedang + rusak || Number(item.stok_total) || 0,
            };
        }

        const total = Number(item.stok_total) || 0;
        const norm = normalizeKondisi(item.kondisi_umum).value;
        if (norm === 'Sedang') {
            return { baik: 0, sedang: total, rusak: 0, total };
        }
        if (norm === 'Rusak') {
            return { baik: 0, sedang: 0, rusak: total, total };
        }
        return { baik: total, sedang: 0, rusak: 0, total };
    };

    const getTanggalInputItem = (item: SaranaItem): string => {
        if (item.tanggal_input && item.tanggal_input !== '-') {
            return item.tanggal_input;
        }
        return todayDisplayDate;
    };

    const handleOpenTambahInventaris = () => {
        setEditingItem(null);
        setNamaBarang('');
        setJumlahAsetTotal('');
        setJumlahBaik('');
        setJumlahSedang('');
        setJumlahRusak('');
        setLokasiBarang(filterRuangan !== 'semua' ? filterRuangan : ruanganOptions[0] || ruanganNama);
        setDeskripsiBarang('');
        setFotoBarangFile(null);
        setFotoBarangPreview(null);
        setCurrentTab('inventaris');
        setIsTambahInventarisModalOpen(true);
    };

    const handleOpenEditInventaris = (item: SaranaItem) => {
        const rincian = getRincianKondisiItem(item);
        setEditingItem(item);
        setNamaBarang(item.nama);
        setJumlahAsetTotal(item.stok_total || rincian.total || '');
        setJumlahBaik(rincian.baik > 0 ? rincian.baik : '');
        setJumlahSedang(rincian.sedang > 0 ? rincian.sedang : '');
        setJumlahRusak(rincian.rusak > 0 ? rincian.rusak : '');
        setLokasiBarang(
            ruanganOptions.includes(item.lokasi)
                ? item.lokasi
                : ruanganOptions[0] || item.lokasi || ruanganNama
        );
        setDeskripsiBarang(item.deskripsi || '');
        setFotoBarangFile(null);
        setFotoBarangPreview(item.foto_url || null);
        setIsTambahInventarisModalOpen(true);
    };

    const handleConfirmDeleteInventaris = () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete(`/staf-ruangan/inventaris/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteTarget(null);
                setIsDeleting(false);
            },
            onError: () => {
                setIsDeleting(false);
            },
        });
    };

    const availableYears = Array.from(
        new Set(
            inventaris
                .map((it) => it.tahun || (it.created_at_iso ? it.created_at_iso.slice(0, 4) : String(new Date().getFullYear())))
                .filter(Boolean)
        )
    ).sort((a, b) => b.localeCompare(a));

    const matchesKondisiFilter = (item: SaranaItem, filterVal: string): boolean => {
        if (filterVal === 'semua') return true;
        const rincian = getRincianKondisiItem(item);
        const f = filterVal.toLowerCase();
        if (f === 'baik') return rincian.baik > 0;
        if (f === 'sedang') return rincian.sedang > 0;
        if (f === 'rusak') return rincian.rusak > 0;
        return normalizeKondisi(item.kondisi_umum).value.toLowerCase() === f;
    };

    // Filter Items untuk Tabel Inventaris
    const filteredInventaris = inventaris.filter((item) => {
        const matchesRuangan =
            filterRuangan === 'semua' ||
            item.lokasi?.toLowerCase().includes(filterRuangan.toLowerCase());
        const matchesKondisi = matchesKondisiFilter(item, filterKondisiInventaris);
        const itemYear = item.tahun || (item.created_at_iso ? item.created_at_iso.slice(0, 4) : String(new Date().getFullYear()));
        const matchesTahun =
            filterTahunInventaris === 'semua' || itemYear === filterTahunInventaris;
        const tgl = getTanggalInputItem(item);
        const matchesCari =
            item.nama.toLowerCase().includes(cariInventaris.toLowerCase()) ||
            item.kode.toLowerCase().includes(cariInventaris.toLowerCase()) ||
            item.lokasi.toLowerCase().includes(cariInventaris.toLowerCase()) ||
            tgl.toLowerCase().includes(cariInventaris.toLowerCase());
        return matchesRuangan && matchesKondisi && matchesTahun && matchesCari;
    });

    // Filter Items untuk Download Inventaris (Admin)
    const downloadFilteredItems = inventaris.filter((item) => {
        if (dlModeRuangan === 'pilih_ruangan') {
            if (dlSelectedRooms.length === 0) return false;
            const matchRoom = dlSelectedRooms.some(
                (r) => item.lokasi?.toLowerCase() === r.toLowerCase()
            );
            if (!matchRoom) return false;
        }
        if (!matchesKondisiFilter(item, dlKondisi)) {
            return false;
        }
        const itemYear = item.tahun || (item.created_at_iso ? item.created_at_iso.slice(0, 4) : String(new Date().getFullYear()));
        if (dlTahun !== 'semua' && itemYear !== dlTahun) {
            return false;
        }
        if (dlStartDate && item.created_at_iso && item.created_at_iso < dlStartDate) {
            return false;
        }
        if (dlEndDate && item.created_at_iso && item.created_at_iso > dlEndDate) {
            return false;
        }
        return true;
    });

    const toggleDownloadRoom = (room: string) => {
        setDlSelectedRooms((prev) =>
            prev.includes(room) ? prev.filter((r) => r !== room) : [...prev, room]
        );
    };

    const prepareExportSheets = (): ExportSheet[] => {
        const columns = [
            { title: 'NO', width: 35, align: 'center' as const },
            { title: 'Tahun Pengadaan', width: 95, align: 'center' as const },
            { title: 'Nama Barang', width: 180, align: 'left' as const },
            { title: 'Jumlah', width: 60, align: 'center' as const, isNumber: true },
            { title: 'Ruang', width: 140, align: 'left' as const },
            { title: 'Kondisi', subheaders: ['Baik', 'Sedang', 'Rusak'], width: 150 },
            { title: 'Harga Perolehan', width: 100, align: 'right' as const, isCurrency: true },
            { title: 'TOTAL', width: 100, align: 'right' as const, isCurrency: true },
        ];

        const isGrouped = dlModeRuangan !== 'semua_gabung';
        const sheets: ExportSheet[] = [];

        const mapItemToRow = (it: SaranaItem, idx: number) => {
            const r = getRincianKondisiItem(it);
            return [
                idx + 1,
                it.tahun || '',
                it.nama,
                Number(it.stok_total) || 0,
                it.lokasi || ruanganNama,
                r.baik > 0 ? r.baik : '',
                r.sedang > 0 ? r.sedang : '',
                r.rusak > 0 ? r.rusak : '',
                '',
                '',
            ];
        };

        if (isGrouped) {
            const grouped: Record<string, SaranaItem[]> = {};
            downloadFilteredItems.forEach((it) => {
                const room = it.lokasi || 'Ruangan Lainnya';
                if (!grouped[room]) grouped[room] = [];
                grouped[room].push(it);
            });

            // 1. Tab Ringkasan Seluruh Ruangan (hanya jika ada lebih dari 1 ruangan)
            if (Object.keys(grouped).length > 1) {
                const allRows = downloadFilteredItems.map(mapItemToRow);
                const sumStok = downloadFilteredItems.reduce((acc, cur) => acc + (Number(cur.stok_total) || 0), 0);
                const sumBaik = downloadFilteredItems.reduce((acc, cur) => acc + getRincianKondisiItem(cur).baik, 0);
                const sumSedang = downloadFilteredItems.reduce((acc, cur) => acc + getRincianKondisiItem(cur).sedang, 0);
                const sumRusak = downloadFilteredItems.reduce((acc, cur) => acc + getRincianKondisiItem(cur).rusak, 0);

                sheets.push({
                    name: 'Rekap Semua Ruangan',
                    title: 'REKAPITULASI INVENTARIS SARANA & PRASARANA SELURUH RUANGAN',
                    subtitle: 'Biro Sarana dan Prasarana - Universitas Nurul Huda',
                    meta: [
                        { label: 'Tanggal Cetak', value: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) },
                        { label: 'Filter Kondisi', value: dlKondisi === 'semua' ? 'Semua Kondisi' : dlKondisi.toUpperCase() },
                        { label: 'Total Aset', value: `${downloadFilteredItems.length} Jenis Barang (${sumStok} Unit)` },
                    ],
                    columns,
                    rows: allRows,
                    summaryRow: ['TOTAL KESELURUHAN', '', '', '', sumStok, '', sumBaik, sumSedang, sumRusak, '', ''],
                });
            }

            // 2. Tab untuk Masing-masing Ruangan (Persis format Gudang Kampus B, Kampus A, Gudang sarpras, dll.)
            Object.entries(grouped).forEach(([roomName, items]) => {
                const roomRows = items.map(mapItemToRow);
                const sumStok = items.reduce((acc, cur) => acc + (Number(cur.stok_total) || 0), 0);
                const sumBaik = items.reduce((acc, cur) => acc + getRincianKondisiItem(cur).baik, 0);
                const sumSedang = items.reduce((acc, cur) => acc + getRincianKondisiItem(cur).sedang, 0);
                const sumRusak = items.reduce((acc, cur) => acc + getRincianKondisiItem(cur).rusak, 0);

                sheets.push({
                    name: roomName,
                    title: roomName.toUpperCase(),
                    subtitle: 'Data Pemeriksaan & Inventaris Sarana Prasarana Ruangan',
                    meta: [
                        { label: 'Lokasi Unit', value: roomName },
                        { label: 'Jumlah Aset Terdata', value: `${items.length} Jenis Barang (${sumStok} Unit)` },
                    ],
                    columns,
                    rows: roomRows,
                    summaryRow: [`TOTAL ${roomName.toUpperCase()}`, '', '', '', sumStok, '', sumBaik, sumSedang, sumRusak, '', ''],
                });
            });
        } else {
            const allRows = downloadFilteredItems.map(mapItemToRow);
            const sumStok = downloadFilteredItems.reduce((acc, cur) => acc + (Number(cur.stok_total) || 0), 0);
            const sumBaik = downloadFilteredItems.reduce((acc, cur) => acc + getRincianKondisiItem(cur).baik, 0);
            const sumSedang = downloadFilteredItems.reduce((acc, cur) => acc + getRincianKondisiItem(cur).sedang, 0);
            const sumRusak = downloadFilteredItems.reduce((acc, cur) => acc + getRincianKondisiItem(cur).rusak, 0);

            sheets.push({
                name: 'Data Inventaris',
                title: 'REKAPITULASI INVENTARIS SARANA & PRASARANA RUANGAN',
                subtitle: 'Biro Sarana dan Prasarana - Universitas Nurul Huda',
                meta: [
                    { label: 'Tanggal Cetak', value: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) },
                    { label: 'Total Aset', value: `${downloadFilteredItems.length} Jenis Barang (${sumStok} Unit)` },
                ],
                columns,
                rows: allRows,
                summaryRow: ['TOTAL KESELURUHAN', '', '', '', sumStok, '', sumBaik, sumSedang, sumRusak, '', ''],
            });
        }

        return sheets;
    };

    const handleDownloadExcel = () => {
        if (downloadFilteredItems.length === 0) {
            alert('Tidak ada data inventaris yang sesuai dengan filter download yang dipilih.');
            return;
        }
        const sheets = prepareExportSheets();
        const suffix =
            dlModeRuangan === 'pilih_ruangan' && dlSelectedRooms.length === 1
                ? dlSelectedRooms[0].replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
                : 'semua_ruangan';
        exportToExcel(`inventaris_ruangan_${suffix}_${new Date().toISOString().slice(0, 10)}`, sheets);
    };

    const handleDownloadCSV = () => {
        if (downloadFilteredItems.length === 0) {
            alert('Tidak ada data inventaris yang sesuai dengan filter download yang dipilih.');
            return;
        }
        const sheets = prepareExportSheets();
        const suffix =
            dlModeRuangan === 'pilih_ruangan' && dlSelectedRooms.length === 1
                ? dlSelectedRooms[0].replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
                : 'semua_ruangan';
        exportToCsv(`inventaris_ruangan_${suffix}_${new Date().toISOString().slice(0, 10)}`, sheets);
    };

    const handleDownloadPDF = () => {
        if (downloadFilteredItems.length === 0) {
            alert('Tidak ada data inventaris yang sesuai dengan filter download yang dipilih.');
            return;
        }

        const sheets = prepareExportSheets();
        const suffix =
            dlModeRuangan === 'pilih_ruangan' && dlSelectedRooms.length === 1
                ? dlSelectedRooms[0].replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
                : 'semua_ruangan';
        exportToPdf(`inventaris_ruangan_${suffix}_${new Date().toISOString().slice(0, 10)}`, sheets);
    };

    const filteredLaporan = laporanList.filter((item) => {
        const matchesRuangan =
            filterRuangan === 'semua' ||
            item.nama_ruangan?.toLowerCase().includes(filterRuangan.toLowerCase());
        const matchesStatus = statusFilterLaporan === 'semua' || item.status_tinjauan === statusFilterLaporan;
        const matchesCari =
            item.kode_pengecekan.toLowerCase().includes(cariLaporan.toLowerCase()) ||
            item.catatan_pemeriksaan.toLowerCase().includes(cariLaporan.toLowerCase()) ||
            item.nama_ruangan.toLowerCase().includes(cariLaporan.toLowerCase()) ||
            (item.pelapor_nama && item.pelapor_nama.toLowerCase().includes(cariLaporan.toLowerCase())) ||
            item.tanggal_pengecekan.toLowerCase().includes(cariLaporan.toLowerCase());
        return matchesRuangan && matchesStatus && matchesCari;
    });

    // Pagination Tab Laporan Sesuai Desain Target
    const [pageLaporan, setPageLaporan] = useState(1);
    const itemsPerPageLaporan = 5;

    useEffect(() => {
        setPageLaporan(1);
    }, [cariLaporan, filterRuangan, statusFilterLaporan]);

    const totalLaporan = filteredLaporan.length;
    const totalPagesLaporan = Math.max(1, Math.ceil(totalLaporan / itemsPerPageLaporan));
    const paginatedLaporan = filteredLaporan.slice(
        (pageLaporan - 1) * itemsPerPageLaporan,
        pageLaporan * itemsPerPageLaporan
    );
    const startIdxLaporan = totalLaporan === 0 ? 0 : (pageLaporan - 1) * itemsPerPageLaporan + 1;
    const endIdxLaporan = Math.min(pageLaporan * itemsPerPageLaporan, totalLaporan);

    // Handle File Upload
    const handlePhotoBarangChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFotoBarangFile(file);
            setFotoBarangPreview(URL.createObjectURL(file));
        }
    };

    // Submit Tambah / Edit Inventaris
    const handleSubmitTambahInventaris = (e: React.FormEvent) => {
        e.preventDefault();
        const targetAset = Number(jumlahAsetTotal) || 0;
        if (targetAset < 1) {
            alert('Mohon isi Jumlah Aset / Barang minimal 1 unit.');
            return;
        }

        const baik = Number(jumlahBaik) || 0;
        const sedang = Number(jumlahSedang) || 0;
        const rusak = Number(jumlahRusak) || 0;
        const total = baik + sedang + rusak;

        if (total !== targetAset) {
            alert(`Total rincian kondisi belum sesuai dengan Jumlah Aset yang diinputkan. Total rincian kondisi: ${total} Unit, Total aset: ${targetAset} Unit.`);
            return;
        }

        if (!editingItem && !fotoBarangFile) {
            alert('Foto fisik barang wajib diunggah.');
            return;
        }

        if (editingItem && !fotoBarangFile && !fotoBarangPreview) {
            alert('Foto fisik barang wajib diunggah.');
            return;
        }

        setIsSubmittingInventaris(true);

        const formData = new FormData();
        formData.append('nama', namaBarang);
        formData.append('jumlah', String(targetAset));
        formData.append('jumlah_baik', String(baik));
        formData.append('jumlah_sedang', String(sedang));
        formData.append('jumlah_rusak', String(rusak));
        formData.append('lokasi', lokasiBarang || ruanganNama);
        if (fotoBarangFile) formData.append('foto', fotoBarangFile);

        const url = editingItem
            ? `/staf-ruangan/inventaris/${editingItem.id}`
            : '/staf-ruangan/inventaris';

        router.post(url, formData, {
            preserveScroll: true,
            onSuccess: () => {
                setIsTambahInventarisModalOpen(false);
                setEditingItem(null);
                setIsSubmittingInventaris(false);
                setNamaBarang('');
                setJumlahBaik('');
                setJumlahSedang('');
                setJumlahRusak('');
                setDeskripsiBarang('');
                setFotoBarangFile(null);
                setFotoBarangPreview(null);
            },
            onError: () => {
                setIsSubmittingInventaris(false);
            },
        });
    };

    // Langsung Kirim Laporan ke Admin tanpa popup
    const handleKirimLangsungKeAdmin = () => {
        if (inventaris.length === 0) {
            alert('Belum ada data inventaris di ruangan ini untuk dikirimkan ke admin.');
            return;
        }

        setIsSubmittingPengecekan(true);

        // Tentukan kondisi sarpras otomatis dari rincian kondisi seluruh inventaris
        const hasDamage = inventaris.some((it) => {
            const r = getRincianKondisiItem(it);
            return r.sedang > 0 || r.rusak > 0;
        });
        const kondisiSarpras = hasDamage ? 'ada_kerusakan' : 'semua_baik';
        const today = new Date().toISOString().split('T')[0];

        const formData = new FormData();
        formData.append('tanggal_pengecekan', today);
        formData.append('kondisi_kebersihan', 'bersih');
        formData.append('kondisi_sarpras', kondisiSarpras);
        formData.append(
            'catatan_pemeriksaan',
            `Laporan inventaris & pengecekan fisik unit ${ruanganNama}. Tercatat ${inventaris.length} sarana/barang terdaftar sesuai tabel.`
        );

        // Sertakan foto fisik barang inventaris ruangan jika tersedia
        const firstPhoto = inventaris.find((it) => it.foto_url)?.foto_url;
        if (firstPhoto) {
            formData.append('foto_ruangan_url', firstPhoto);
        }

        // Masukkan seluruh inventaris di tabel beserta rincian Baik, Sedang, Rusak sebagai checklist yang terkirim ke admin
        inventaris.forEach((item, index) => {
            const r = getRincianKondisiItem(item);
            formData.append(`items_checked[${index}][sarpras_id]`, String(item.id));
            formData.append(`items_checked[${index}][nama]`, item.nama);
            formData.append(
                `items_checked[${index}][kondisi]`,
                `Baik: ${r.baik}, Sedang: ${r.sedang}, Rusak: ${r.rusak}`
            );
            formData.append(
                `items_checked[${index}][catatan]`,
                `Total: ${item.stok_total} ${item.satuan || 'Unit'} (Baik: ${r.baik}, Sedang: ${r.sedang}, Rusak: ${r.rusak}) • Lokasi: ${item.lokasi || ruanganNama} • Tgl Input: ${getTanggalInputItem(item)}`
            );
        });

        router.post('/staf-ruangan/pengecekan', formData, {
            preserveScroll: true,
            onSuccess: (page: any) => {
                setIsSubmittingPengecekan(false);
                setCurrentTab('pengecekan');
                const msg =
                    page?.props?.flash?.success ||
                    'Laporan inventaris berhasil dikirim ke Admin dan masuk ke Riwayat Selesai.';
                setToast({ type: 'success', message: msg });
            },
            onError: () => {
                setIsSubmittingPengecekan(false);
            },
        });
    };

    // Formatters
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
                return { label: 'Semua Sarana Berfungsi Baik', color: 'bg-emerald-100/80 text-emerald-800 border-emerald-200' };
            case 'ada_kerusakan':
                return { label: 'Ada Kerusakan Ringan', color: 'bg-amber-100/80 text-amber-800 border-amber-200' };
            case 'butuh_penggantian':
                return { label: 'Perlu Penggantian / Servis', color: 'bg-rose-100/80 text-rose-800 border-rose-200' };
            default:
                return { label: val, color: 'bg-slate-100 text-slate-700 border-slate-200' };
        }
    };

    const formatStatusTinjauan = (val: string) => {
        switch (val) {
            case 'menunggu_tinjauan':
                return {
                    label: 'Menunggu Verifikasi Admin',
                    color: 'bg-amber-50 text-amber-800 border-amber-200',
                    icon: CheckCircle2,
                };
            case 'ditindaklanjuti':
                return {
                    label: 'Selesai • Ditindaklanjuti',
                    color: 'bg-blue-50 text-blue-700 border-blue-200',
                    icon: CheckCircle2,
                };
            case 'diverifikasi_admin':
            default:
                return {
                    label: 'Verified',
                    color: 'bg-emerald-50 text-[#006039] border-emerald-200',
                    icon: CheckCircle2,
                };
        }
    };

    const handleVerifikasiLaporan = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDetailLaporan) return;

        setIsSubmittingVerifikasi(true);
        router.post(
            `/admin/pengecekan-ruangan/${selectedDetailLaporan.id}/verifikasi`,
            {
                status_tinjauan: verifikasiStatus,
                catatan_admin: verifikasiCatatan,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSubmittingVerifikasi(false);
                    setSelectedDetailLaporan(null);
                    setVerifikasiCatatan('');
                    setToast({
                        type: 'success',
                        message: `Laporan pengecekan ${selectedDetailLaporan.kode_pengecekan} berhasil diverifikasi.`,
                    });
                },
                onError: () => {
                    setIsSubmittingVerifikasi(false);
                },
            }
        );
    };

    return (
        <AdminLayout>
            <Head title={`Inventaris Ruangan ${ruanganNama} - Biro Sarpras UNUHA`} />

            <div className="w-full max-w-full space-y-5 pb-14 font-sans text-slate-800 text-xs">
                {/* Popup Notifikasi Sementara (Otomatis hilang dalam 4 detik + Tombol Close) */}
                {toast && (
                    <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-md w-full sm:w-auto animate-in fade-in slide-in-from-top-3 duration-200">
                        <div
                            className={`flex items-center justify-between gap-3.5 px-4 py-3.5 rounded-2xl shadow-xl border bg-white ${
                                toast.type === 'success' ? 'border-emerald-200' : 'border-rose-200'
                            }`}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div
                                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                        toast.type === 'success'
                                            ? 'bg-emerald-50 text-[#006039]'
                                            : 'bg-rose-50 text-rose-600'
                                    }`}
                                >
                                    {toast.type === 'success' ? (
                                        <CheckCircle2 className="w-4 h-4" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p
                                        className={`text-[10px] font-extrabold uppercase tracking-wider ${
                                            toast.type === 'success' ? 'text-[#006039]' : 'text-rose-600'
                                        }`}
                                    >
                                        {toast.type === 'success' ? 'Selesai Terkirim' : 'Perhatian'}
                                    </p>
                                    <p className="text-xs font-semibold text-slate-800 leading-snug">
                                        {toast.message}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setToast(null)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-[11px] font-bold transition cursor-pointer shrink-0"
                            >
                                <span>Close</span>
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Header Banner - Rapi & Elegan */}
                <div className="bg-gradient-to-r from-[#006039] via-[#094c34] to-[#004225] text-white p-6 sm:p-7 rounded-3xl shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />

                    <div className="relative z-10 space-y-3.5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider bg-white/15 px-3 py-1 rounded-full border border-white/20 text-emerald-100">
                                <Building2 className="w-3.5 h-3.5 text-emerald-200" />
                                <span>{isAdmin ? 'Monitoring Seluruh Ruangan Kampus' : `Unit Penugasan: ${ruanganNama}`}</span>
                            </span>
                        </div>

                        <div className="max-w-2xl space-y-1">
                            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
                                {isAdmin ? 'Laporan Inventaris dari PIC Ruangan' : 'Inventaris Ruangan'}
                            </h1>
                            <p className="text-emerald-100/90 text-xs sm:text-sm leading-relaxed">
                                {isAdmin
                                    ? 'Memantau dan merekap laporan inventaris fisik dari seluruh PIC Ruangan kampus UNUHA.'
                                    : 'Kelola sarana dan laporan kondisi ruangan unit.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tab Navigasi, Search & Filter Ruangan di Bagian Atas Sesuai Desain Target */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 w-full">
                    {/* Tabs Pill Sesuai Gambar Pertama - Bersebelahan & Nampak Semua */}
                    <div className="flex items-center gap-2 shrink-0 overflow-x-auto max-w-full">
                        <button
                            type="button"
                            onClick={() => setCurrentTab('inventaris')}
                            className={`px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
                                currentTab === 'inventaris'
                                    ? 'bg-[#006039] text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/80'
                            }`}
                        >
                            {isAdmin ? 'Daftar Aset Sarpras' : 'Inventaris'} ({filteredInventaris.length})
                        </button>

                        <button
                            type="button"
                            onClick={() => setCurrentTab('pengecekan')}
                            className={`px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
                                currentTab === 'pengecekan'
                                    ? 'bg-[#006039] text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/80'
                            }`}
                        >
                            {isAdmin
                                ? `Laporan PIC Ruangan (${filteredLaporan.length})`
                                : `Riwayat Terkirim (${laporanList.length})`}
                        </button>
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 flex-1 xl:justify-end min-w-0">
                        {/* Search Bar Sesuai Gambar Pertama */}
                        <div className="relative flex-1 min-w-[200px] max-w-full sm:max-w-xs xl:max-w-sm">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                placeholder={
                                    currentTab === 'inventaris'
                                        ? 'Cari kode, nama barang, ruangan...'
                                        : 'Cari tanggal, ruangan, catatan...'
                                }
                                value={currentTab === 'inventaris' ? cariInventaris : cariLaporan}
                                onChange={(e) =>
                                    currentTab === 'inventaris'
                                        ? setCariInventaris(e.target.value)
                                        : setCariLaporan(e.target.value)
                                }
                                className="w-full pl-9 pr-7 py-2 bg-white border border-slate-200/90 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-[#006039] focus:border-[#006039] focus:outline-none shadow-2xs font-medium"
                            />
                            {(currentTab === 'inventaris' ? cariInventaris : cariLaporan) && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        currentTab === 'inventaris'
                                            ? setCariInventaris('')
                                            : setCariLaporan('')
                                    }
                                    className="absolute inset-y-0 right-2.5 my-auto text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Filter Ruangan Sesuai Gambar Pertama */}
                        {isAdmin || ruanganOptions.length > 1 ? (
                            <div className="bg-white px-3 py-2 rounded-xl border border-slate-200/90 shadow-2xs flex items-center gap-2 shrink-0 max-w-full">
                                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                                <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                                    Ruangan:
                                </span>
                                <select
                                    value={filterRuangan}
                                    onChange={(e) => setFilterRuangan(e.target.value)}
                                    className="bg-transparent border-none text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-1 max-w-[150px] sm:max-w-[180px] truncate"
                                >
                                    <option value="semua">
                                        {isAdmin ? 'Semua Ruangan' : `Semua Ruangan Saya (${ruanganOptions.length})`}
                                    </option>
                                    {ruanganOptions.map((r) => (
                                        <option key={r} value={r}>
                                            {r}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : ruanganOptions.length === 1 ? (
                            <div className="bg-emerald-50/80 px-3.5 py-2 rounded-xl border border-emerald-200 shadow-2xs flex items-center gap-2 shrink-0">
                                <Building2 className="w-3.5 h-3.5 text-[#006039] shrink-0" />
                                <span className="text-[11px] font-bold text-slate-600">Ruangan:</span>
                                <span className="text-xs font-extrabold text-[#006039]">{ruanganOptions[0]}</span>
                            </div>
                        ) : null}

                        {/* Tombol Tambah Inventaris */}
                        <button
                            type="button"
                            onClick={handleOpenTambahInventaris}
                            className="h-9 px-3.5 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4 stroke-[2.5]" />
                            <span>Tambah Inventaris</span>
                        </button>
                    </div>
                </div>

                {/* ISI TAB 1: TABEL INVENTARIS & ALAT */}
                {currentTab === 'inventaris' && (
                    <div className="space-y-4">
                        {/* HASIL BERUPA TABEL INVENTARIS RUANGAN */}
                        {filteredInventaris.length === 0 ? (
                            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center">
                                <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                                    <Package className="w-8 h-8" />
                                </div>
                                <h4 className="text-sm font-bold text-slate-800">Belum Ada Inventaris yang Sesuai</h4>
                                <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto mb-4">
                                    {isAdmin
                                        ? 'Tidak ditemukan data inventaris sarpras pada filter ruangan, kondisi, atau tahun yang dipilih.'
                                        : 'Gunakan tombol Tambah Inventaris untuk mencatat alat, perangkat, atau fasilitas di ruangan ini.'}
                                </p>
                                {!isAdmin && (
                                    <button
                                        type="button"
                                        onClick={handleOpenTambahInventaris}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#006039] text-white rounded-xl text-xs font-extrabold hover:bg-[#004d2e] transition cursor-pointer"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>Tambah Inventaris Baru</span>
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[880px] text-left text-xs border-collapse">
                                        <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                                            <tr>
                                                <th className="py-3.5 pl-4 sm:pl-5 pr-2 w-[14%] min-w-[110px] whitespace-nowrap">Tanggal Input</th>
                                                <th className={`py-3.5 px-3 min-w-[230px] ${isAdmin ? 'w-[32%]' : 'w-[28%]'}`}>Nama Alat / Inventaris</th>
                                                <th className="py-3.5 px-2 text-center w-[9%] min-w-[85px] whitespace-nowrap">Jumlah</th>
                                                <th className={`py-3.5 px-3 whitespace-nowrap ${isAdmin ? 'w-[22%] min-w-[210px]' : 'w-[20%] min-w-[200px]'}`}>Kondisi Fisik</th>
                                                <th className={`py-3.5 px-3 min-w-[180px] ${isAdmin ? 'w-[23%]' : 'w-[19%]'}`}>Lokasi Penempatan</th>
                                                {!isAdmin && <th className="py-3.5 pr-4 pl-2 text-right w-[10%] min-w-[85px] whitespace-nowrap">Aksi</th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredInventaris.map((item) => {
                                                const rincian = getRincianKondisiItem(item);
                                                const isOutOfStock = item.stok_total === 0;

                                                return (
                                                    <tr
                                                        key={item.id}
                                                        className={`transition ${
                                                            isOutOfStock
                                                                ? 'opacity-50 grayscale-[25%] bg-slate-50/70'
                                                                : 'hover:bg-slate-50/60'
                                                        }`}
                                                    >
                                                        <td className="py-3 pl-4 sm:pl-5 pr-2 whitespace-nowrap font-bold text-slate-800 text-xs">
                                                            {getTanggalInputItem(item)}
                                                        </td>

                                                        <td className="py-3 px-3">
                                                            <div className="flex items-center gap-2.5 min-w-0">
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
                                                                        className="w-9 h-9 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shrink-0 inline-flex items-center justify-center shadow-2xs hover:ring-2 hover:ring-[#006039] transition cursor-pointer group"
                                                                    >
                                                                        <img
                                                                            src={item.foto_url}
                                                                            alt={item.nama}
                                                                            className="w-full h-full object-cover group-hover:scale-105 transition"
                                                                        />
                                                                    </button>
                                                                ) : (
                                                                    <div
                                                                        title="Belum ada foto"
                                                                        className="w-9 h-9 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-300 shrink-0 inline-flex items-center justify-center"
                                                                    >
                                                                        <Camera className="w-3.5 h-3.5" />
                                                                    </div>
                                                                )}
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="font-extrabold text-slate-900 text-xs leading-snug truncate" title={item.nama}>
                                                                        {item.nama}
                                                                    </div>
                                                                    {item.kode && (
                                                                        <div className="text-[10px] font-mono font-semibold text-slate-400 mt-0.5 truncate">
                                                                            {item.kode}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td className="py-3 px-2 text-center whitespace-nowrap">
                                                            {isOutOfStock ? (
                                                                <span className="font-extrabold text-slate-400 text-xs bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                                                                    0 {item.satuan}
                                                                </span>
                                                            ) : (
                                                                <span className="font-extrabold text-slate-900 text-xs bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-lg border border-emerald-100">
                                                                    {item.stok_total} {item.satuan}
                                                                </span>
                                                            )}
                                                        </td>

                                                        <td className="py-3 px-3 whitespace-nowrap">
                                                            <div className="inline-flex items-center gap-1.5 flex-nowrap">
                                                                {rincian.baik > 0 && (
                                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg border bg-emerald-50 text-emerald-800 border-emerald-200/80 shadow-2xs">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                                                        <span>Baik: {rincian.baik}</span>
                                                                    </span>
                                                                )}
                                                                {rincian.sedang > 0 && (
                                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg border bg-amber-50 text-amber-800 border-amber-200/80 shadow-2xs">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                                                                        <span>Sedang: {rincian.sedang}</span>
                                                                    </span>
                                                                )}
                                                                {rincian.rusak > 0 && (
                                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg border bg-rose-50 text-rose-800 border-rose-200/80 shadow-2xs">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                                                                        <span>Rusak: {rincian.rusak}</span>
                                                                    </span>
                                                                )}
                                                                {rincian.baik === 0 && rincian.sedang === 0 && rincian.rusak === 0 && (
                                                                    <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-lg border bg-slate-100 text-slate-600 border-slate-200">
                                                                        0 Unit
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>

                                                        <td className="py-3 px-3 text-slate-700 font-medium">
                                                            <div className="inline-flex items-center gap-1.5 text-slate-700 max-w-full">
                                                                <Building2 className="w-3.5 h-3.5 text-[#006039] shrink-0" />
                                                                <span className="truncate" title={item.lokasi || ruanganNama}>{item.lokasi || ruanganNama}</span>
                                                            </div>
                                                        </td>

                                                        {!isAdmin && (
                                                            <td className="py-3 pr-4 pl-2 text-right whitespace-nowrap">
                                                                <div className="inline-flex items-center justify-end gap-1.5">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleOpenEditInventaris(item)}
                                                                        title="Edit Inventaris"
                                                                        aria-label="Edit Inventaris"
                                                                        className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-700 border border-slate-200/80 hover:border-amber-300 rounded-lg transition cursor-pointer shadow-2xs"
                                                                    >
                                                                        <Pencil className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setDeleteTarget(item)}
                                                                        title="Hapus Inventaris"
                                                                        aria-label="Hapus Inventaris"
                                                                        className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200/80 hover:border-rose-300 rounded-lg transition cursor-pointer shadow-2xs"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        )}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* FOOTER: KLIK LANGSUNG TERKIRIM KE ADMIN & MASUK KE RIWAYAT SELESAI */}
                                {!isAdmin && (
                                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <p className="text-[11px] text-slate-500">
                                            Pastikan daftar inventaris di atas sudah sesuai sebelum dikirim. Laporan yang dikirim otomatis masuk ke <strong className="text-slate-700">Riwayat Selesai</strong>.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={handleKirimLangsungKeAdmin}
                                            disabled={isSubmittingPengecekan || filteredInventaris.length === 0}
                                            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#006039] hover:bg-[#004d2e] text-white rounded-xl text-xs font-extrabold shadow-sm transition cursor-pointer disabled:opacity-50 shrink-0"
                                        >
                                            <Send className="w-3.5 h-3.5" />
                                            <span>{isSubmittingPengecekan ? 'Mengirim ke Admin...' : 'Kirim ke Admin'}</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ISI TAB 2: TABEL RIWAYAT SELESAI TERKIRIM KE ADMIN SESUAI DESAIN TARGET */}
                {currentTab === 'pengecekan' && (
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                        {/* Tabel Riwayat Selesai */}
                        {filteredLaporan.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                                    <ClipboardCheck className="w-7 h-7" />
                                </div>
                                <h4 className="text-sm font-bold text-slate-800">Belum Ada Riwayat Selesai</h4>
                                <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
                                    Klik tombol <strong>Kirim ke Admin</strong> pada tab Tabel Inventaris untuk mengirimkan laporan dan menyimpannya ke daftar selesai.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[850px] text-left text-xs border-collapse">
                                    <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                                        <tr>
                                            <th className="py-3.5 pl-4 sm:pl-5 pr-2 w-[14%] min-w-[110px] whitespace-nowrap">Tanggal Kirim</th>
                                            {isAdmin && <th className="py-3.5 px-3 w-[22%] min-w-[170px]">PIC Ruangan (Pelapor)</th>}
                                            <th className="py-3.5 px-3 w-[36%] min-w-[220px]">Ruangan &amp; Kondisi</th>
                                            <th className="py-3.5 px-2 text-center w-[10%] min-w-[85px] whitespace-nowrap">Aset Dicek</th>
                                            <th className="py-3.5 px-2 text-center w-[12%] min-w-[110px] whitespace-nowrap">Status</th>
                                            <th className="py-3.5 pr-4 pl-2 text-center w-[6%] min-w-[70px] whitespace-nowrap">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {paginatedLaporan.map((item) => {
                                            const sarprasInfo = formatSarprasKondisi(item.kondisi_sarpras);
                                            const statusTinjauanInfo = formatStatusTinjauan(item.status_tinjauan);
                                            const isVerified =
                                                item.status_tinjauan === 'diverifikasi_admin' ||
                                                !item.status_tinjauan ||
                                                item.status_tinjauan === 'selesai' ||
                                                item.status_tinjauan === 'diverifikasi';

                                            return (
                                                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                                                    <td className="py-3 pl-4 sm:pl-5 pr-2 whitespace-nowrap font-bold text-slate-800 text-xs">
                                                        {item.tanggal_pengecekan}
                                                    </td>

                                                    {isAdmin && (
                                                        <td className="py-3 px-3">
                                                            <div className="font-bold text-slate-900 text-xs truncate" title={item.pelapor_nama || 'PIC Ruangan'}>
                                                                {item.pelapor_nama || 'PIC Ruangan'}
                                                            </div>
                                                            <div className="text-[11px] text-slate-500 font-medium mt-0.5 truncate" title={item.pelapor_role || 'Staf Ruangan'}>
                                                                {item.pelapor_role || 'Staf Ruangan'}
                                                            </div>
                                                        </td>
                                                    )}

                                                    <td className="py-3 px-3">
                                                        <div className="font-bold text-slate-900 text-xs leading-snug line-clamp-1" title={item.nama_ruangan}>
                                                            {item.nama_ruangan}
                                                        </div>
                                                        <div className="mt-1">
                                                            <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${sarprasInfo.color} whitespace-nowrap`}>
                                                                {sarprasInfo.label}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td className="py-3 px-2 text-center whitespace-nowrap">
                                                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200/70 inline-block">
                                                            {item.items_checked?.length || 0} Item
                                                        </span>
                                                    </td>

                                                    <td className="py-3 px-2 text-center whitespace-nowrap">
                                                        {isVerified ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#d1fae5] text-[#065f46] border border-emerald-200">
                                                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                                                <span>Verified</span>
                                                            </span>
                                                        ) : (
                                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${statusTinjauanInfo.color}`}>
                                                                <CheckCircle2 className="w-3 h-3" />
                                                                <span>{statusTinjauanInfo.label}</span>
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td className="py-3 pr-4 pl-2 text-center whitespace-nowrap">
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedDetailLaporan(item)}
                                                            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 inline-flex items-center justify-center transition cursor-pointer shadow-2xs"
                                                            title="Lihat Detail Laporan"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination Footer Sesuai Gambar Pertama */}
                        {filteredLaporan.length > 0 && (
                            <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 bg-white">
                                <div className="font-semibold text-slate-700">
                                    Menampilkan {startIdxLaporan}-{endIdxLaporan} dari {totalLaporan}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setPageLaporan((p) => Math.max(1, p - 1))}
                                        disabled={pageLaporan <= 1}
                                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                    >
                                        Sebelumnya
                                    </button>
                                    {Array.from({ length: totalPagesLaporan }, (_, i) => i + 1).map((pg) => (
                                        <button
                                            key={pg}
                                            type="button"
                                            onClick={() => setPageLaporan(pg)}
                                            className={`min-w-8 h-8 px-2 rounded-lg border text-xs font-bold transition ${
                                                pageLaporan === pg
                                                    ? 'border-slate-300 bg-slate-100 text-slate-900 shadow-2xs'
                                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            {pg}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => setPageLaporan((p) => Math.min(totalPagesLaporan, p + 1))}
                                        disabled={pageLaporan >= totalPagesLaporan}
                                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                    >
                                        Selanjutnya
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* MODAL 1: TAMBAH / EDIT INVENTARIS */}
                {isTambahInventarisModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                        <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-xl text-xs max-h-[92vh] overflow-y-auto">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div>
                                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                                        {editingItem ? `Kode Aset: ${editingItem.kode}` : 'Pencatatan Inventaris Unit'}
                                    </span>
                                    <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                                        {editingItem ? 'Edit Data Inventaris' : 'Tambah Inventaris'}
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsTambahInventarisModalOpen(false);
                                        setEditingItem(null);
                                    }}
                                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmitTambahInventaris} className="space-y-3.5">
                                {/* Tanggal Pencatatan Inventaris (Otomatis) */}
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        Tanggal Pencatatan Inventaris (Otomatis)
                                    </label>
                                    <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Calendar className="w-4 h-4 text-[#006039] shrink-0" />
                                            <span className="font-extrabold text-slate-900 text-xs">
                                                {editingItem ? getTanggalInputItem(editingItem) : todayDisplayDate}
                                            </span>
                                        </div>
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#006039] text-[10px] font-bold shrink-0">
                                            <Clock className="w-2.5 h-2.5" />
                                            <span>Otomatis</span>
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        Nama Inventaris <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={namaBarang}
                                        onChange={(e) => setNamaBarang(e.target.value)}
                                        placeholder="Contoh: Proyektor Epson EB-X500, Papan Tulis Whiteboard, AC Daikin 2 PK..."
                                        required
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#006039] focus:outline-none"
                                    />
                                </div>

                                {/* Menu Jumlah Aset / Barang yang Ingin Diinputkan */}
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        Jumlah Aset / Barang <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={jumlahAsetTotal}
                                            onChange={(e) => {
                                                const raw = e.target.value.replace(/\D/g, '');
                                                const val = raw === '' ? '' : parseInt(raw, 10);
                                                setJumlahAsetTotal(val);
                                                const curTotal = (Number(jumlahBaik) || 0) + (Number(jumlahSedang) || 0) + (Number(jumlahRusak) || 0);
                                                if (val !== '' && curTotal > Number(val)) {
                                                    setJumlahBaik('');
                                                    setJumlahSedang('');
                                                    setJumlahRusak('');
                                                }
                                            }}
                                            placeholder="Masukkan total unit barang (misal: 3, 10, 25...)"
                                            required
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#006039] focus:outline-none pr-12"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                                            Unit
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        Tentukan total keseluruhan barang yang akan dialokasikan ke masing-masing kondisi fisik di bawah.
                                    </p>
                                </div>

                                {/* Rincian Jumlah Berdasarkan Kondisi Fisik Barang */}
                                {(() => {
                                    const targetTotal = Number(jumlahAsetTotal) || 0;
                                    const currentBaik = Number(jumlahBaik) || 0;
                                    const currentSedang = Number(jumlahSedang) || 0;
                                    const currentRusak = Number(jumlahRusak) || 0;
                                    const currentTotal = currentBaik + currentSedang + currentRusak;
                                    const sisaUnit = Math.max(0, targetTotal - currentTotal);
                                    const isQuotaFull = targetTotal > 0 && currentTotal >= targetTotal;

                                    return (
                                        <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-2.5">
                                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                                <label className="block text-[11px] font-extrabold text-slate-800">
                                                    Rincian Kondisi &amp; Jumlah Barang <span className="text-rose-500">*</span>
                                                </label>
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                                                        targetTotal > 0 && currentTotal === targetTotal
                                                            ? 'bg-emerald-50 border-emerald-300 text-[#006039]'
                                                            : targetTotal > 0 && currentTotal < targetTotal
                                                            ? 'bg-amber-50 border-amber-300 text-amber-800'
                                                            : 'bg-slate-100 border-slate-200 text-slate-600'
                                                    }`}>
                                                        Terisi: {currentTotal} / {targetTotal || 0} Unit
                                                    </span>
                                                </div>
                                            </div>

                                            {targetTotal === 0 ? (
                                                <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl font-medium">
                                                    ⚠️ Masukkan <strong>Jumlah Aset / Barang</strong> di atas terlebih dahulu sebelum mengisi rincian kondisi.
                                                </p>
                                            ) : isQuotaFull ? (
                                                <p className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-[#006039] shrink-0" />
                                                    <span>Jumlah rincian sudah sesuai dengan total {targetTotal} aset. Kolom kondisi lain otomatis dikunci.</span>
                                                </p>
                                            ) : (
                                                <p className="text-[10px] text-slate-500 leading-snug">
                                                    Tersisa <strong className="text-amber-700 font-bold">{sisaUnit} Unit</strong> yang belum dialokasikan. Isi unit pada kondisi di bawah ini.
                                                </p>
                                            )}

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                                {/* Kondisi Baik */}
                                                <div className={`p-2.5 rounded-xl border transition ${
                                                    targetTotal === 0 || (isQuotaFull && currentBaik === 0)
                                                        ? 'bg-slate-100/70 border-slate-200 opacity-60'
                                                        : 'bg-emerald-50/60 border-emerald-200'
                                                }`}>
                                                    <label className="block text-[10px] font-extrabold text-emerald-800 mb-1">
                                                        Kondisi Baik
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            disabled={targetTotal === 0 || (isQuotaFull && currentBaik === 0)}
                                                            value={jumlahBaik}
                                                            onChange={(e) => {
                                                                const raw = e.target.value.replace(/\D/g, '');
                                                                if (raw === '') {
                                                                    setJumlahBaik('');
                                                                    return;
                                                                }
                                                                const parsed = parseInt(raw, 10);
                                                                const maxAllowed = currentBaik + sisaUnit;
                                                                setJumlahBaik(Math.min(parsed, maxAllowed));
                                                            }}
                                                            placeholder="0"
                                                            className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-extrabold focus:outline-none pr-10 border ${
                                                                targetTotal === 0 || (isQuotaFull && currentBaik === 0)
                                                                    ? 'bg-slate-200/50 text-slate-400 border-slate-200 cursor-not-allowed'
                                                                    : 'bg-white border-emerald-200 text-slate-900 focus:ring-2 focus:ring-[#006039]'
                                                            }`}
                                                        />
                                                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                                                            Unit
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Kondisi Sedang / Rusak Ringan */}
                                                <div className={`p-2.5 rounded-xl border transition ${
                                                    targetTotal === 0 || (isQuotaFull && currentSedang === 0)
                                                        ? 'bg-slate-100/70 border-slate-200 opacity-60'
                                                        : 'bg-amber-50/60 border-amber-200'
                                                }`}>
                                                    <label className="block text-[10px] font-extrabold text-amber-800 mb-1">
                                                        Sedang / Ringan
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            disabled={targetTotal === 0 || (isQuotaFull && currentSedang === 0)}
                                                            value={jumlahSedang}
                                                            onChange={(e) => {
                                                                const raw = e.target.value.replace(/\D/g, '');
                                                                if (raw === '') {
                                                                    setJumlahSedang('');
                                                                    return;
                                                                }
                                                                const parsed = parseInt(raw, 10);
                                                                const maxAllowed = currentSedang + sisaUnit;
                                                                setJumlahSedang(Math.min(parsed, maxAllowed));
                                                            }}
                                                            placeholder="0"
                                                            className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-extrabold focus:outline-none pr-10 border ${
                                                                targetTotal === 0 || (isQuotaFull && currentSedang === 0)
                                                                    ? 'bg-slate-200/50 text-slate-400 border-slate-200 cursor-not-allowed'
                                                                    : 'bg-white border-amber-200 text-slate-900 focus:ring-2 focus:ring-amber-500'
                                                            }`}
                                                        />
                                                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                                                            Unit
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Kondisi Rusak Berat */}
                                                <div className={`p-2.5 rounded-xl border transition ${
                                                    targetTotal === 0 || (isQuotaFull && currentRusak === 0)
                                                        ? 'bg-slate-100/70 border-slate-200 opacity-60'
                                                        : 'bg-rose-50/60 border-rose-200'
                                                }`}>
                                                    <label className="block text-[10px] font-extrabold text-rose-800 mb-1">
                                                        Rusak Berat
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            disabled={targetTotal === 0 || (isQuotaFull && currentRusak === 0)}
                                                            value={jumlahRusak}
                                                            onChange={(e) => {
                                                                const raw = e.target.value.replace(/\D/g, '');
                                                                if (raw === '') {
                                                                    setJumlahRusak('');
                                                                    return;
                                                                }
                                                                const parsed = parseInt(raw, 10);
                                                                const maxAllowed = currentRusak + sisaUnit;
                                                                setJumlahRusak(Math.min(parsed, maxAllowed));
                                                            }}
                                                            placeholder="0"
                                                            className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-extrabold focus:outline-none pr-10 border ${
                                                                targetTotal === 0 || (isQuotaFull && currentRusak === 0)
                                                                    ? 'bg-slate-200/50 text-slate-400 border-slate-200 cursor-not-allowed'
                                                                    : 'bg-white border-rose-200 text-slate-900 focus:ring-2 focus:ring-rose-500'
                                                            }`}
                                                        />
                                                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                                                            Unit
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        Ruangan Penempatan (Ditentukan oleh Admin)
                                    </label>
                                    {ruanganOptions.length === 1 ? (
                                        <div className="px-3.5 py-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <Building2 className="w-4 h-4 text-[#006039] shrink-0" />
                                                <span className="font-extrabold text-slate-900 text-xs truncate">
                                                    {ruanganOptions[0]}
                                                </span>
                                            </div>
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-emerald-200 text-[#006039] text-[10px] font-bold shrink-0">
                                                <Lock className="w-2.5 h-2.5" />
                                                <span>Otomatis</span>
                                            </span>
                                        </div>
                                    ) : ruanganOptions.length > 1 ? (
                                        <div className="space-y-1.5">
                                            <select
                                                value={lokasiBarang}
                                                onChange={(e) => setLokasiBarang(e.target.value)}
                                                required
                                                className="w-full px-3 py-2 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#006039] focus:outline-none cursor-pointer"
                                            >
                                                {ruanganOptions.map((opt, i) => (
                                                    <option key={i} value={opt}>
                                                        {opt}
                                                    </option>
                                                ))}
                                            </select>
                                            <p className="text-[10px] text-[#006039] font-semibold">
                                                * Hanya menampilkan ruangan yang telah ditentukan oleh Admin untuk akun Anda.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-[11px] font-semibold">
                                            Akun Anda belum memiliki penugasan ruangan dari Admin. Silakan hubungi Admin Biro Sarpras.
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-[11px] font-bold text-slate-700">
                                            Unggah Foto Barang <span className="text-rose-500">*</span>
                                        </label>
                                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                                            Wajib
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <label className={`flex items-center gap-2 px-3.5 py-2 border rounded-xl text-xs font-bold cursor-pointer transition ${
                                            fotoBarangPreview
                                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300 ring-2 ring-rose-400/20'
                                        }`}>
                                            <Camera className={`w-4 h-4 ${fotoBarangPreview ? 'text-slate-600' : 'text-rose-600'}`} />
                                            <span>{fotoBarangPreview ? 'Ganti Foto' : 'Pilih Foto (Wajib)'}</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                required={!editingItem && !fotoBarangPreview}
                                                onChange={handlePhotoBarangChange}
                                                className="hidden"
                                            />
                                        </label>
                                        {fotoBarangPreview ? (
                                            <div className="w-12 h-12 rounded-xl border border-slate-200 overflow-hidden shrink-0 shadow-2xs">
                                                <img
                                                    src={fotoBarangPreview}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg font-medium">
                                                * Foto fisik barang wajib diunggah
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsTambahInventarisModalOpen(false);
                                            setEditingItem(null);
                                        }}
                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmittingInventaris}
                                        className="px-5 py-2 bg-[#006039] hover:bg-[#004d2e] text-white rounded-xl text-xs font-extrabold shadow-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                                    >
                                        {isSubmittingInventaris
                                            ? 'Menyimpan...'
                                            : editingItem
                                            ? 'Simpan Perubahan'
                                            : 'Simpan ke Tabel'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL PREVIEW FOTO BARANG INVENTARIS */}
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
                                        Foto Barang Inventaris
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

                {/* MODAL KONFIRMASI HAPUS INVENTARIS */}
                <DeleteConfirmModal
                    show={Boolean(deleteTarget)}
                    onClose={() => {
                        if (!isDeleting) {
                            setDeleteTarget(null);
                        }
                    }}
                    onConfirm={handleConfirmDeleteInventaris}
                    title="Hapus Data Inventaris?"
                    itemName={deleteTarget ? `${deleteTarget.nama} (${deleteTarget.kode})` : undefined}
                    message="Apakah Anda yakin ingin menghapus data inventaris ini dari daftar aset ruangan?"
                    processing={isDeleting}
                />

                {/* MODAL 3: DETAIL LAPORAN PENGECEKAN */}
                {selectedDetailLaporan && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                        <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto text-xs">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        Detail Laporan Inspeksi
                                    </span>
                                    <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                                        {selectedDetailLaporan.nama_ruangan}
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedDetailLaporan(null)}
                                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 text-[11px]">
                                    <div>
                                        <p className="text-slate-500">Tanggal Pemeriksaan:</p>
                                        <p className="font-extrabold text-slate-900 mt-0.5">
                                            {selectedDetailLaporan.tanggal_pengecekan}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">Status Tinjauan:</p>
                                        <p className="font-extrabold text-emerald-700 mt-0.5">
                                            {formatStatusTinjauan(selectedDetailLaporan.status_tinjauan).label}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-extrabold text-slate-800 text-xs mb-1">
                                        Catatan Pemeriksaan PIC Ruangan:
                                    </h4>
                                    <p className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-slate-700 leading-relaxed text-xs">
                                        {selectedDetailLaporan.catatan_pemeriksaan}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-extrabold text-slate-800 text-xs mb-2">
                                        Checklist Barang / Fasilitas yang Diperiksa:
                                    </h4>
                                    {selectedDetailLaporan.items_checked && selectedDetailLaporan.items_checked.length > 0 ? (
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
                                                    {selectedDetailLaporan.items_checked.map((item, idx) => {
                                                        const matchRincian = (item.kondisi || '').match(
                                                            /Baik:\s*(\d+)\s*,\s*Sedang:\s*(\d+)\s*,\s*Rusak:\s*(\d+)/i
                                                        );
                                                        const kondisiInfo = normalizeKondisi(item.kondisi);

                                                        return (
                                                            <tr key={idx} className="hover:bg-slate-50/50">
                                                                <td className="p-2.5 font-bold text-slate-800">
                                                                    {item.nama}
                                                                </td>
                                                                <td className="p-2.5">
                                                                    {matchRincian ? (
                                                                        <div className="flex flex-wrap items-center gap-1">
                                                                            {parseInt(matchRincian[1], 10) > 0 && (
                                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold border bg-emerald-50 text-emerald-700 border-emerald-200">
                                                                                    Baik: {matchRincian[1]}
                                                                                </span>
                                                                            )}
                                                                            {parseInt(matchRincian[2], 10) > 0 && (
                                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold border bg-amber-50 text-amber-700 border-amber-200">
                                                                                    Sedang: {matchRincian[2]}
                                                                                </span>
                                                                            )}
                                                                            {parseInt(matchRincian[3], 10) > 0 && (
                                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold border bg-rose-50 text-rose-700 border-rose-200">
                                                                                    Rusak: {matchRincian[3]}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <span
                                                                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${kondisiInfo.badgeClass}`}
                                                                        >
                                                                            {kondisiInfo.label}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="p-2.5 text-slate-500">
                                                                    {item.catatan || '-'}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-slate-400 italic text-xs">Tidak ada checklist barang terperinci.</p>
                                    )}
                                </div>

                                {selectedDetailLaporan.foto_ruangan && (
                                    <div>
                                        <h4 className="font-extrabold text-slate-800 text-xs mb-1.5">
                                            Foto Bukti Kondisi Ruangan:
                                        </h4>
                                        <div className="rounded-2xl border border-slate-200 overflow-hidden max-h-60">
                                            <img
                                                src={selectedDetailLaporan.foto_ruangan}
                                                alt="Foto Ruangan"
                                                className="w-full h-full object-contain bg-slate-900"
                                            />
                                        </div>
                                    </div>
                                )}

                                {selectedDetailLaporan.catatan_admin && !isAdmin && (
                                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                                        <h4 className="font-extrabold text-[#006039] text-xs mb-1">
                                            Catatan Verifikasi Admin:
                                        </h4>
                                        <p className="text-slate-700 text-xs">{selectedDetailLaporan.catatan_admin}</p>
                                    </div>
                                )}

                                {isAdmin && (
                                    selectedDetailLaporan.status_tinjauan === 'menunggu_tinjauan' ? (
                                        <form onSubmit={handleVerifikasiLaporan} className="p-4 bg-emerald-50/40 border border-emerald-200 rounded-2xl space-y-3">
                                            <h4 className="font-extrabold text-[#006039] text-xs">
                                                Verifikasi &amp; Tindak Lanjut Admin
                                            </h4>
                                            <div>
                                                <label className="block font-bold text-slate-700 text-[11px] mb-1">
                                                    Status Tinjauan
                                                </label>
                                                <select
                                                    value={verifikasiStatus}
                                                    onChange={(e) => setVerifikasiStatus(e.target.value as 'diverifikasi_admin' | 'ditindaklanjuti')}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#006039] outline-hidden"
                                                >
                                                    <option value="diverifikasi_admin">Verified (Kondisi Tercatat)</option>
                                                    <option value="ditindaklanjuti">Selesai • Ditindaklanjuti Perbaikan/Pengadaan</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block font-bold text-slate-700 text-[11px] mb-1">
                                                    Catatan / Respon Admin untuk PIC Ruangan
                                                </label>
                                                <textarea
                                                    rows={2}
                                                    value={verifikasiCatatan}
                                                    onChange={(e) => setVerifikasiCatatan(e.target.value)}
                                                    placeholder={selectedDetailLaporan.catatan_admin || 'Tulis catatan verifikasi atau tindak lanjut...'}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:border-[#006039] outline-hidden"
                                                />
                                            </div>
                                            <div className="flex justify-end">
                                                <button
                                                    type="submit"
                                                    disabled={isSubmittingVerifikasi}
                                                    className="px-4 py-2 bg-[#006039] hover:bg-[#0f4c3a] text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer disabled:opacity-60"
                                                >
                                                    {isSubmittingVerifikasi ? 'Menyimpan...' : 'Simpan Verifikasi Admin'}
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                                <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                                                    <CheckCircle2 className="w-4 h-4 text-[#006039]" />
                                                    <span>Laporan Telah Diverifikasi (Verified)</span>
                                                </span>
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-[#006039] border border-emerald-200">
                                                    {selectedDetailLaporan.status_tinjauan === 'ditindaklanjuti' ? 'Ditindaklanjuti' : 'Verified'}
                                                </span>
                                            </div>
                                            {selectedDetailLaporan.catatan_admin && (
                                                <div className="text-xs text-slate-700 pt-1">
                                                    <span className="text-slate-400 block text-[10px]">Catatan Admin:</span>
                                                    <p className="font-medium italic mt-0.5 text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200/80">"{selectedDetailLaporan.catatan_admin}"</p>
                                                </div>
                                            )}
                                            {selectedDetailLaporan.ditinjau_pada && (
                                                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200/60 flex items-center gap-1">
                                                    <Clock className="w-3 h-3 text-slate-400" />
                                                    <span>Diverifikasi pada: {selectedDetailLaporan.ditinjau_pada} {selectedDetailLaporan.admin_nama ? `oleh ${selectedDetailLaporan.admin_nama}` : ''}</span>
                                                </div>
                                            )}
                                        </div>
                                    )
                                )}
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setSelectedDetailLaporan(null)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                                >
                                    Tutup Detail
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL 4: DOWNLOAD & FILTER INVENTARIS RUANGAN (KHUSUS ADMIN) */}
                {isAdmin && isDownloadModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                        <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 border border-slate-200 shadow-2xl max-h-[92vh] overflow-y-auto text-xs">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div>
                                    <span className="text-[10px] font-bold text-[#006039] uppercase tracking-wider">
                                        Rekapitulasi &amp; Ekspor Aset
                                    </span>
                                    <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                                        Download Data Inventaris Ruangan
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsDownloadModalOpen(false)}
                                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* 1. Mode Pengelompokan & Pilihan Ruangan */}
                                <div>
                                    <label className="block text-[11px] font-extrabold text-slate-800 mb-2">
                                        1. Pilihan &amp; Pengelompokan Ruangan
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                        <button
                                            type="button"
                                            onClick={() => setDlModeRuangan('semua_pisah')}
                                            className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                                                dlModeRuangan === 'semua_pisah'
                                                    ? 'bg-emerald-50/80 border-[#006039] ring-2 ring-[#006039]/15'
                                                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                                            }`}
                                        >
                                            <div className="font-extrabold text-slate-900 text-xs">
                                                Pisahkan per Ruangan
                                            </div>
                                            <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                                                Semua ruangan dengan tabel terpisah masing-masing ruangan
                                            </p>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setDlModeRuangan('pilih_ruangan')}
                                            className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                                                dlModeRuangan === 'pilih_ruangan'
                                                    ? 'bg-emerald-50/80 border-[#006039] ring-2 ring-[#006039]/15'
                                                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                                            }`}
                                        >
                                            <div className="font-extrabold text-slate-900 text-xs">
                                                Pilih Ruangan Tertentu
                                            </div>
                                            <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                                                Centang satu atau beberapa ruangan yang ingin didownload
                                            </p>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setDlModeRuangan('semua_gabung')}
                                            className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                                                dlModeRuangan === 'semua_gabung'
                                                    ? 'bg-emerald-50/80 border-[#006039] ring-2 ring-[#006039]/15'
                                                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                                            }`}
                                        >
                                            <div className="font-extrabold text-slate-900 text-xs">
                                                Gabung Semua Ruangan
                                            </div>
                                            <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                                                Seluruh inventaris digabung dalam 1 tabel rekapitulasi
                                            </p>
                                        </button>
                                    </div>

                                    {dlModeRuangan === 'pilih_ruangan' && (
                                        <div className="mt-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-bold text-slate-700">
                                                    Pilih Ruangan ({dlSelectedRooms.length} dipilih):
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setDlSelectedRooms([...ruanganOptions])}
                                                        className="text-[10px] font-extrabold text-[#006039] hover:underline cursor-pointer"
                                                    >
                                                        Pilih Semua
                                                    </button>
                                                    <span className="text-slate-300">|</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDlSelectedRooms([])}
                                                        className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                                                    >
                                                        Reset
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                                                {ruanganOptions.map((room) => {
                                                    const checked = dlSelectedRooms.includes(room);
                                                    return (
                                                        <label
                                                            key={room}
                                                            className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] font-semibold cursor-pointer transition ${
                                                                checked
                                                                    ? 'bg-emerald-50 border-emerald-300 text-[#006039]'
                                                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                onChange={() => toggleDownloadRoom(room)}
                                                                className="rounded border-slate-300 text-[#006039] focus:ring-[#006039]"
                                                            />
                                                            <span className="truncate">{room}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 2. Filter Kondisi & Tahun */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-extrabold text-slate-800 mb-1.5">
                                            2. Filter Kondisi Barang
                                        </label>
                                        <select
                                            value={dlKondisi}
                                            onChange={(e) => setDlKondisi(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#006039] focus:outline-none cursor-pointer"
                                        >
                                            <option value="semua">Semua Kondisi</option>
                                            <option value="baik">Baik</option>
                                            <option value="sedang">Sedang / Rusak Ringan</option>
                                            <option value="rusak">Rusak Berat</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-extrabold text-slate-800 mb-1.5">
                                            3. Filter Tahun Pencatatan
                                        </label>
                                        <select
                                            value={dlTahun}
                                            onChange={(e) => setDlTahun(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#006039] focus:outline-none cursor-pointer"
                                        >
                                            <option value="semua">Semua Tahun</option>
                                            {availableYears.map((th) => (
                                                <option key={th} value={th}>
                                                    Tahun {th}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* 3. Filter Rentang Tanggal Input */}
                                <div>
                                    <label className="block text-[11px] font-extrabold text-slate-800 mb-1.5">
                                        4. Rentang Tanggal Input (Opsional)
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <span className="block text-[10px] font-semibold text-slate-500 mb-1">
                                                Dari Tanggal:
                                            </span>
                                            <input
                                                type="date"
                                                value={dlStartDate}
                                                onChange={(e) => setDlStartDate(e.target.value)}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#006039] focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <span className="block text-[10px] font-semibold text-slate-500 mb-1">
                                                Sampai Tanggal:
                                            </span>
                                            <input
                                                type="date"
                                                value={dlEndDate}
                                                onChange={(e) => setDlEndDate(e.target.value)}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#006039] focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Ringkasan Data yang Akan Didownload */}
                                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-9 h-9 rounded-xl bg-[#006039] text-white flex items-center justify-center shrink-0">
                                            <Package className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-extrabold text-slate-900">
                                                {downloadFilteredItems.length} Data Inventaris Siap Diunduh
                                            </div>
                                            <p className="text-[11px] text-slate-600">
                                                {dlModeRuangan === 'semua_gabung'
                                                    ? 'Digabung dalam 1 tabel rekapitulasi'
                                                    : 'Dipisahkan tabelnya untuk masing-masing ruangan'}
                                            </p>
                                        </div>
                                    </div>

                                    {(dlKondisi !== 'semua' || dlTahun !== 'semua' || dlStartDate || dlEndDate) && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDlKondisi('semua');
                                                setDlTahun('semua');
                                                setDlStartDate('');
                                                setDlEndDate('');
                                            }}
                                            className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer shrink-0"
                                        >
                                            Reset Filter
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsDownloadModalOpen(false)}
                                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                                >
                                    Batal
                                </button>

                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleDownloadExcel}
                                        disabled={downloadFilteredItems.length === 0}
                                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-[#006039] hover:bg-[#0f4c3a] text-white rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer disabled:opacity-50"
                                        title="Unduh File Spreadsheet Excel (.xls) bergaris tabel rapi, multi-sheet per ruangan & format resmi"
                                    >
                                        <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                                        <span>Download Excel (.xls)</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleDownloadCSV}
                                        disabled={downloadFilteredItems.length === 0}
                                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200/80 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
                                        title="Unduh File CSV (.csv) standar spreadsheet"
                                    >
                                        <Download className="w-4 h-4 text-slate-500" />
                                        <span>CSV</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleDownloadPDF}
                                        disabled={downloadFilteredItems.length === 0}
                                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
                                    >
                                        <Printer className="w-4 h-4 text-slate-600" />
                                        <span>Cetak / PDF</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
