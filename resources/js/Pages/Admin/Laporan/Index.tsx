import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    ShoppingCart,
    Wrench,
    Download,
    Search,
    MapPin,
    FileText,
    Eye,
    X,
    ClipboardCheck,
    Package,
    RotateCcw,
    Box,
    Calendar,
    CheckCircle2,
    Clock,
    AlertCircle,
    FileSpreadsheet,
    Printer,
    LayoutGrid,
    Building2,
    ChevronDown,
    Monitor,
    Camera,
} from 'lucide-react';
import { exportToExcel, exportToPdf, exportToCsv, exportToWord, ExportSheet } from '@/utils/exportHelper';

interface Props {
    inventaris?: any[];
    peminjaman?: any[];
    pengembalian?: any[];
    maintenance?: any[];
    pengadaan?: any[];
    pengecekan?: any[];
}

export default function LaporanIndex({
    inventaris = [],
    peminjaman = [],
    pengembalian = [],
    maintenance = [],
    pengadaan = [],
    pengecekan = [],
}: Props) {
    const [activeTab, setActiveTab] = useState<
        'semua' | 'pengadaan' | 'maintenance' | 'pengecekan' | 'peminjaman' | 'pengembalian' | 'inventaris'
    >('semua');
    const [searchQuery, setSearchQuery] = useState('');
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

    // Filter data sesuai kata kunci
    const q = searchQuery.trim().toLowerCase();

    // Data Gabungan untuk Tab 'Semua' (Total 64 Data Terpadu)
    const allData = useMemo(() => {
        const list: any[] = [];

        // 1. Pengadaan
        pengadaan.forEach((b) => {
            list.push({
                id: `pengadaan-${b.id}`,
                tipe: 'pengadaan',
                kategoriLabel: 'Pengadaan Barang',
                kategoriBadge: 'bg-emerald-50 text-[#006039] border border-emerald-200',
                nama: b.nama_barang,
                subDetail: b.kategori,
                pengusul: b.pelapor,
                tanggal: b.tanggal,
                penempatan: b.lokasi_penempatan,
                status: b.status_label || (b.status === 'selesai' ? 'SELESAI' : b.status.toUpperCase()),
                statusBadge: b.status === 'selesai' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200',
                dotColor: b.status === 'selesai' ? 'bg-emerald-600' : 'bg-amber-600',
                icon: Monitor,
            });
        });

        // 2. Perbaikan
        maintenance.forEach((m) => {
            list.push({
                id: `maintenance-${m.id}`,
                tipe: 'maintenance',
                kategoriLabel: 'Perbaikan / Maintenance',
                kategoriBadge: 'bg-amber-50 text-amber-800 border border-amber-200',
                nama: m.sarpras,
                subDetail: `${m.deskripsi} • Urgensi: ${m.urgensi}`,
                pengusul: m.pelapor,
                tanggal: m.tanggal_lapor,
                penempatan: m.lokasi,
                status: m.status,
                statusBadge: m.status === 'SELESAI' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-blue-50 text-blue-800 border border-blue-200',
                dotColor: m.status === 'SELESAI' ? 'bg-emerald-600' : 'bg-blue-600',
                icon: Wrench,
            });
        });

        // 3. Cek Ruangan
        pengecekan.forEach((ck) => {
            const isVerif =
                ck.status_tinjauan === 'SELESAI' ||
                ck.status_tinjauan === 'DIVERIFIKASI ADMIN' ||
                ck.status_tinjauan === 'VERIFIED' ||
                ck.status_tinjauan === 'DIVERIFIKASI';

            list.push({
                id: `pengecekan-${ck.id}`,
                tipe: 'pengecekan',
                kategoriLabel: 'Cek Ruangan',
                kategoriBadge: 'bg-teal-50 text-teal-800 border border-teal-200',
                nama: ck.ruangan,
                subDetail: `Audit Fisik Ruangan (${ck.total_item} Aset)`,
                pengusul: ck.pelapor,
                tanggal: ck.tanggal,
                penempatan: ck.ruangan,
                status: isVerif ? 'Verified' : 'Menunggu',
                statusBadge: isVerif
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200',
                dotColor: isVerif ? 'bg-emerald-600' : 'bg-amber-500',
                icon: ClipboardCheck,
            });
        });

        // 4. Peminjaman
        peminjaman.forEach((p) => {
            list.push({
                id: `peminjaman-${p.id}`,
                tipe: 'peminjaman',
                kategoriLabel: 'Peminjaman',
                kategoriBadge: 'bg-blue-50 text-blue-800 border border-blue-200',
                nama: p.items || 'Sarpras Pinjam',
                subDetail: `Keperluan: ${p.keperluan || '-'}`,
                pengusul: p.peminjam,
                tanggal: p.tanggal_mulai,
                penempatan: p.unit || 'Kampus UNUHA',
                status: p.status,
                statusBadge: 'bg-blue-50 text-blue-800 border border-blue-200',
                dotColor: 'bg-blue-600',
                icon: Package,
            });
        });

        // 5. Pengembalian & Denda
        pengembalian.forEach((k) => {
            list.push({
                id: `pengembalian-${k.id}`,
                tipe: 'pengembalian',
                kategoriLabel: 'Pengembalian & Denda',
                kategoriBadge: 'bg-purple-50 text-purple-800 border border-purple-200',
                nama: k.items || 'Pengembalian Barang',
                subDetail: `Denda: Rp ${(k.biaya_denda || 0).toLocaleString('id-ID')}`,
                pengusul: k.peminjam,
                tanggal: k.tanggal_kembali,
                penempatan: `Ref: ${k.kode_pinjam}`,
                status: k.status_verifikasi,
                statusBadge: 'bg-purple-50 text-purple-800 border border-purple-200',
                dotColor: 'bg-purple-600',
                icon: RotateCcw,
            });
        });

        // 6. Sarana & Prasarana
        inventaris.forEach((inv) => {
            list.push({
                id: `inventaris-${inv.id}`,
                tipe: 'inventaris',
                kategoriLabel: 'Sarana & Prasarana',
                kategoriBadge: 'bg-slate-100 text-slate-800 border border-slate-200',
                nama: inv.nama,
                subDetail: `${inv.jenis} • Stok: ${inv.stok_total} ${inv.satuan}`,
                pengusul: 'Administrator Sarpras',
                tanggal: `Tahun ${inv.tahun}`,
                penempatan: inv.lokasi,
                status: inv.kondisi_umum ? inv.kondisi_umum.toUpperCase() : 'BAIK',
                statusBadge: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
                dotColor: 'bg-emerald-600',
                icon: Building2,
            });
        });

        return list;
    }, [pengadaan, maintenance, pengecekan, peminjaman, pengembalian, inventaris]);

    const filteredAll = useMemo(() => {
        return allData.filter(
            (item) =>
                !q ||
                item.nama.toLowerCase().includes(q) ||
                item.subDetail.toLowerCase().includes(q) ||
                item.pengusul.toLowerCase().includes(q) ||
                item.penempatan.toLowerCase().includes(q) ||
                item.kategoriLabel.toLowerCase().includes(q)
        );
    }, [allData, q]);

    const filteredPengadaan = useMemo(() => {
        return pengadaan.filter(
            (b) =>
                !q ||
                b.kode?.toLowerCase().includes(q) ||
                b.nama_barang?.toLowerCase().includes(q) ||
                b.lokasi_penempatan?.toLowerCase().includes(q) ||
                b.pelapor?.toLowerCase().includes(q)
        );
    }, [pengadaan, q]);

    const filteredMaintenance = useMemo(() => {
        return maintenance.filter(
            (m) =>
                !q ||
                m.kode?.toLowerCase().includes(q) ||
                m.sarpras?.toLowerCase().includes(q) ||
                m.pelapor?.toLowerCase().includes(q) ||
                m.lokasi?.toLowerCase().includes(q)
        );
    }, [maintenance, q]);

    const filteredPengecekan = useMemo(() => {
        return pengecekan.filter(
            (ck) =>
                !q ||
                ck.kode?.toLowerCase().includes(q) ||
                ck.ruangan?.toLowerCase().includes(q) ||
                ck.pelapor?.toLowerCase().includes(q)
        );
    }, [pengecekan, q]);

    const filteredPeminjaman = useMemo(() => {
        return peminjaman.filter(
            (p) =>
                !q ||
                p.kode?.toLowerCase().includes(q) ||
                p.peminjam?.toLowerCase().includes(q) ||
                p.nim_nip?.toLowerCase().includes(q) ||
                p.unit?.toLowerCase().includes(q) ||
                p.items?.toLowerCase().includes(q)
        );
    }, [peminjaman, q]);

    const filteredPengembalian = useMemo(() => {
        return pengembalian.filter(
            (k) =>
                !q ||
                k.kode?.toLowerCase().includes(q) ||
                k.kode_pinjam?.toLowerCase().includes(q) ||
                k.peminjam?.toLowerCase().includes(q) ||
                k.items?.toLowerCase().includes(q)
        );
    }, [pengembalian, q]);

    const filteredInventaris = useMemo(() => {
        return inventaris.filter(
            (inv) =>
                !q ||
                inv.kode?.toLowerCase().includes(q) ||
                inv.nama?.toLowerCase().includes(q) ||
                inv.lokasi?.toLowerCase().includes(q) ||
                inv.jenis?.toLowerCase().includes(q)
        );
    }, [inventaris, q]);

    const totalSemua = allData.length;

    const tabs = [
        { id: 'semua', label: 'Semua', line1: 'Semua', line2: null, count: totalSemua, icon: LayoutGrid },
        { id: 'pengadaan', label: 'Pengadaan Barang', line1: 'Pengadaan', line2: 'Barang', count: pengadaan.length, icon: ShoppingCart },
        { id: 'maintenance', label: 'Perbaikan / Maintenance', line1: 'Perbaikan /', line2: 'Maintenance', count: maintenance.length, icon: Wrench },
        { id: 'pengecekan', label: 'Cek Ruangan', line1: 'Cek', line2: 'Ruangan', count: pengecekan.length, icon: ClipboardCheck },
        { id: 'peminjaman', label: 'Peminjaman', line1: 'Peminjaman', line2: null, count: peminjaman.length, icon: Package },
        { id: 'pengembalian', label: 'Pengembalian & Denda', line1: 'Pengembalian', line2: '& Denda', count: pengembalian.length, icon: RotateCcw },
        { id: 'inventaris', label: 'Sarana & Prasarana', line1: 'Sarana &', line2: 'Prasarana', count: inventaris.length, icon: Building2 },
    ];

    // Download Data Laporan sebagai File Excel Resmi (.xls), Word (.doc), Cetak/PDF, atau CSV
    const handleDownload = (format: 'excel' | 'pdf' | 'csv' | 'word' = 'excel') => {
        const dateStr = new Date().toISOString().slice(0, 10);
        const sheets: ExportSheet[] = [];

        const executeExport = (filename: string, sheetList: ExportSheet[]) => {
            if (format === 'excel') exportToExcel(filename, sheetList);
            else if (format === 'word') exportToWord(filename, sheetList);
            else if (format === 'pdf') exportToPdf(filename, sheetList);
            else exportToCsv(filename, sheetList);
        };

        if (activeTab === 'semua') {
            const filename = `Laporan_Pusat_Operasional_UNUHA_${dateStr}`;
            const columns = [
                { title: 'NO', width: 35, align: 'center' as const },
                { title: 'Kategori', width: 140, align: 'left' as const },
                { title: 'Nama / Detail Sarpras', width: 180, align: 'left' as const },
                { title: 'Rincian / Sub Detail', width: 160, align: 'left' as const },
                { title: 'Pengusul / Pelapor', width: 130, align: 'left' as const },
                { title: 'Tanggal', width: 110, align: 'center' as const },
                { title: 'Penempatan / Lokasi', width: 160, align: 'left' as const },
                { title: 'Status', width: 100, align: 'center' as const },
            ];

            const rows = filteredAll.map((item, idx) => [
                idx + 1,
                item.kategoriLabel,
                item.nama,
                item.subDetail,
                item.pengusul,
                item.tanggal,
                item.penempatan,
                item.status,
            ]);

            sheets.push({
                name: 'Semua Laporan Operasional',
                title: 'REKAPITULASI PUSAT LAPORAN OPERASIONAL TERPADU',
                subtitle: 'Biro Sarana dan Prasarana - Universitas Nurul Huda',
                meta: [
                    { label: 'Tanggal Cetak', value: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) },
                    { label: 'Total Entitas Data', value: `${filteredAll.length} Data` },
                ],
                columns,
                rows,
            });

            executeExport(filename, sheets);
            return;
        }

        if (activeTab === 'pengecekan') {
            // TAB CEK RUANGAN
            const filename = `Laporan_Cek_Ruangan_UNUHA_${dateStr}`;
            
            // Sheet 1: Rekapitulasi Audit Ruangan (Tanpa Kode)
            const auditColumns = [
                { title: 'NO', width: 35, align: 'center' as const },
                { title: 'Tanggal', width: 90, align: 'center' as const },
                { title: 'Ruangan / Unit', width: 150, align: 'left' as const },
                { title: 'PIC Ruangan', width: 130, align: 'left' as const },
                { title: 'Kebersihan', width: 90, align: 'center' as const },
                { title: 'Kondisi Sarpras', width: 100, align: 'center' as const },
                { title: 'Total Item', width: 70, align: 'center' as const, isNumber: true },
                { title: 'Baik', width: 60, align: 'center' as const, isNumber: true },
                { title: 'Rusak', width: 60, align: 'center' as const, isNumber: true },
                { title: 'Catatan Pemeriksaan', width: 180, align: 'left' as const },
                { title: 'Status Tinjauan', width: 110, align: 'center' as const },
                { title: 'Admin Peninjau', width: 120, align: 'left' as const },
            ];

            const auditRows = filteredPengecekan.map((c, idx) => [
                idx + 1,
                c.tanggal,
                c.ruangan,
                c.pelapor,
                c.kondisi_kebersihan || '-',
                c.kondisi_sarpras || '-',
                Number(c.total_item) || 0,
                Number(c.kondisi_baik) || 0,
                Number(c.kondisi_rusak) || 0,
                c.catatan || '-',
                c.status_tinjauan || 'MENUNGGU TINJAUAN',
                c.admin_verifikator || 'Admin Sarpras',
            ]);

            sheets.push({
                name: 'Rekap Audit Ruangan',
                title: 'REKAPITULASI LAPORAN CEK FISIK RUANGAN & AUDIT KAMPUS',
                subtitle: 'Biro Sarana dan Prasarana - Universitas Nurul Huda',
                meta: [
                    { label: 'Tanggal Rekapitulasi', value: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) },
                    { label: 'Total Laporan Selesai / Ditinjau', value: `${filteredPengecekan.length} Ruangan` },
                ],
                columns: auditColumns,
                rows: auditRows,
            });

            // Sheet 2: Data Detail Rincian Barang Ruangan Terkait (Tanpa Kode)
            const groupedInvByRoom: Record<string, any[]> = {};
            inventaris.forEach((it) => {
                const room = it.lokasi || 'Ruangan Lainnya';
                if (!groupedInvByRoom[room]) groupedInvByRoom[room] = [];
                groupedInvByRoom[room].push(it);
            });

            const itemColumns = [
                { title: 'NO', width: 35, align: 'center' as const },
                { title: 'Tahun Pengadaan', width: 95, align: 'center' as const },
                { title: 'Nama Barang', width: 180, align: 'left' as const },
                { title: 'Jumlah', width: 60, align: 'center' as const, isNumber: true },
                { title: 'Ruang', width: 140, align: 'left' as const },
                { title: 'Kondisi', subheaders: ['Baik', 'Sedang', 'Rusak'], width: 150 },
                { title: 'Harga Perolehan', width: 100, align: 'right' as const, isCurrency: true },
                { title: 'TOTAL', width: 100, align: 'right' as const, isCurrency: true },
            ];

            Object.entries(groupedInvByRoom).forEach(([roomName, items]) => {
                const rRows = items.map((inv, idx) => {
                    const bVal = Number(inv.baik ?? (inv.kondisi_umum === 'Baik' ? inv.stok_total : 0));
                    const sVal = Number(inv.sedang ?? (inv.kondisi_umum === 'Sedang' ? inv.stok_total : 0));
                    const rVal = Number(inv.rusak ?? (inv.kondisi_umum === 'Rusak' ? inv.stok_total : 0));
                    return [
                        idx + 1,
                        inv.tahun || '',
                        inv.nama,
                        Number(inv.stok_total) || 0,
                        inv.lokasi || roomName,
                        bVal > 0 ? bVal : '',
                        sVal > 0 ? sVal : '',
                        rVal > 0 ? rVal : '',
                        '',
                        '',
                    ];
                });
                const rStok = items.reduce((acc, c) => acc + (Number(c.stok_total) || 0), 0);
                const rBaik = items.reduce((acc, c) => acc + (Number(c.baik) || (c.kondisi_umum === 'Baik' ? Number(c.stok_total) : 0)), 0);
                const rSedang = items.reduce((acc, c) => acc + (Number(c.sedang) || (c.kondisi_umum === 'Sedang' ? Number(c.stok_total) : 0)), 0);
                const rRusak = items.reduce((acc, c) => acc + (Number(c.rusak) || (c.kondisi_umum === 'Rusak' ? Number(c.stok_total) : 0)), 0);

                sheets.push({
                    name: roomName,
                    title: roomName.toUpperCase(),
                    subtitle: 'Data Hasil Pemeriksaan Fisik & Aset Ruangan',
                    meta: [
                        { label: 'Ruangan', value: roomName },
                        { label: 'Total Aset', value: `${items.length} Item (${rStok} Unit)` },
                    ],
                    columns: itemColumns,
                    rows: rRows,
                    summaryRow: [`TOTAL ${roomName.toUpperCase()}`, '', '', rStok, '', rBaik || '', rSedang || '', rRusak || '', '', ''],
                });
            });

            executeExport(filename, sheets);

        } else if (activeTab === 'pengadaan') {
            const filename = `Laporan_Pengadaan_Barang_UNUHA_${dateStr}`;
            const columns = [
                { title: 'NO', width: 35, align: 'center' as const },
                { title: 'Tanggal', width: 90, align: 'center' as const },
                { title: 'Nama Barang', width: 160, align: 'left' as const },
                { title: 'Spesifikasi', width: 140, align: 'left' as const },
                { title: 'Kategori', width: 100, align: 'left' as const },
                { title: 'Jumlah', width: 70, align: 'center' as const },
                { title: 'Penempatan Ruangan', width: 150, align: 'left' as const },
                { title: 'Pengusul', width: 120, align: 'left' as const },
                { title: 'Staf Pelaksana', width: 120, align: 'left' as const },
                { title: 'Vendor / Toko', width: 120, align: 'left' as const },
                { title: 'Total Biaya (Rp)', width: 110, align: 'right' as const, isCurrency: true },
                { title: 'Status', width: 90, align: 'center' as const },
            ];

            const rows = filteredPengadaan.map((b, idx) => [
                idx + 1,
                b.tanggal,
                b.nama_barang,
                b.spesifikasi || '-',
                b.kategori,
                b.jumlah,
                b.lokasi_penempatan,
                b.pelapor,
                b.staf || '-',
                b.vendor || '-',
                Number(b.total_biaya) || 0,
                b.status_label || b.status,
            ]);

            const sumBiaya = filteredPengadaan.reduce((acc, cur) => acc + (Number(cur.total_biaya) || 0), 0);

            sheets.push({
                name: 'Pengadaan Barang',
                title: 'LAPORAN REKAPITULASI PENGADAAN BARANG & SARPRAS',
                subtitle: 'Biro Sarana dan Prasarana - Universitas Nurul Huda',
                meta: [
                    { label: 'Tanggal Ekspor', value: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) },
                    { label: 'Total Transaksi', value: `${filteredPengadaan.length} Pengadaan` },
                    { label: 'Total Realisasi Anggaran', value: `Rp ${sumBiaya.toLocaleString('id-ID')}` },
                ],
                columns,
                rows,
                summaryRow: ['TOTAL KESELURUHAN', '', '', '', '', '', '', '', '', '', sumBiaya, ''],
            });

            executeExport(filename, sheets);

        } else if (activeTab === 'maintenance') {
            const filename = `Laporan_Perbaikan_Fasilitas_UNUHA_${dateStr}`;
            const columns = [
                { title: 'NO', width: 35, align: 'center' as const },
                { title: 'Tanggal Lapor', width: 90, align: 'center' as const },
                { title: 'Sarana / Fasilitas', width: 160, align: 'left' as const },
                { title: 'Lokasi Ruangan', width: 140, align: 'left' as const },
                { title: 'Pelapor', width: 120, align: 'left' as const },
                { title: 'Teknisi / Staf', width: 120, align: 'left' as const },
                { title: 'Tingkat Urgensi', width: 85, align: 'center' as const },
                { title: 'Deskripsi Kerusakan', width: 180, align: 'left' as const },
                { title: 'Estimasi Biaya (Rp)', width: 110, align: 'right' as const, isCurrency: true },
                { title: 'Status', width: 95, align: 'center' as const },
            ];

            const rows = filteredMaintenance.map((m, idx) => [
                idx + 1,
                m.tanggal_lapor || m.tanggal,
                m.sarpras,
                m.lokasi,
                m.pelapor,
                m.teknisi || m.staf || '-',
                m.urgensi || 'NORMAL',
                m.deskripsi || '-',
                Number(m.biaya) || 0,
                m.status_label || m.status,
            ]);

            const sumBiaya = filteredMaintenance.reduce((acc, cur) => acc + (Number(cur.biaya) || 0), 0);

            sheets.push({
                name: 'Perbaikan Fasilitas',
                title: 'LAPORAN PEMELIHARAAN & PERBAIKAN SARANA PRASARANA',
                subtitle: 'Biro Sarana dan Prasarana - Universitas Nurul Huda',
                meta: [
                    { label: 'Tanggal Ekspor', value: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) },
                    { label: 'Total Tiket', value: `${filteredMaintenance.length} Perbaikan` },
                    { label: 'Total Biaya Servis', value: `Rp ${sumBiaya.toLocaleString('id-ID')}` },
                ],
                columns,
                rows,
                summaryRow: ['TOTAL KESELURUHAN', '', '', '', '', '', '', '', sumBiaya, ''],
            });

            executeExport(filename, sheets);

        } else if (activeTab === 'peminjaman') {
            const filename = `Laporan_Peminjaman_Sarpras_UNUHA_${dateStr}`;
            const columns = [
                { title: 'NO', width: 35, align: 'center' as const },
                { title: 'Nama Peminjam', width: 130, align: 'left' as const },
                { title: 'NIM / NIP', width: 85, align: 'center' as const },
                { title: 'Instansi / Prodi', width: 130, align: 'left' as const },
                { title: 'No WhatsApp', width: 95, align: 'center' as const },
                { title: 'Fasilitas & Qty', width: 180, align: 'left' as const },
                { title: 'Tanggal Mulai', width: 95, align: 'center' as const },
                { title: 'Rencana Kembali', width: 95, align: 'center' as const },
                { title: 'Keperluan / Agenda', width: 160, align: 'left' as const },
                { title: 'Status', width: 95, align: 'center' as const },
            ];

            const rows = filteredPeminjaman.map((p, idx) => [
                idx + 1,
                p.peminjam,
                p.nim_nip || '-',
                p.unit || '-',
                p.no_wa || '-',
                p.items || '-',
                p.tanggal_mulai,
                p.tanggal_kembali,
                p.keperluan || '-',
                p.status_label || p.status,
            ]);

            sheets.push({
                name: 'Sirkulasi Peminjaman',
                title: 'LAPORAN SIRKULASI PEMINJAMAN SARANA & PRASARANA',
                subtitle: 'Biro Sarana dan Prasarana - Universitas Nurul Huda',
                meta: [
                    { label: 'Tanggal Ekspor', value: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) },
                    { label: 'Total Pengajuan', value: `${filteredPeminjaman.length} Transaksi` },
                ],
                columns,
                rows,
            });

            executeExport(filename, sheets);

        } else if (activeTab === 'pengembalian') {
            // TAB PENGEMBALIAN & DENDA (Tanpa Kode)
            const filename = `Laporan_Pengembalian_Denda_UNUHA_${dateStr}`;
            const columns = [
                { title: 'NO', width: 35, align: 'center' as const },
                { title: 'Nama Peminjam', width: 130, align: 'left' as const },
                { title: 'Fasilitas Dikembalikan', width: 180, align: 'left' as const },
                { title: 'Tanggal Kembali', width: 95, align: 'center' as const },
                { title: 'Denda (Rp)', width: 100, align: 'right' as const, isCurrency: true },
                { title: 'Status Pembayaran Denda', width: 120, align: 'center' as const },
                { title: 'Catatan Inspeksi Loket', width: 160, align: 'left' as const },
                { title: 'Status Verifikasi', width: 100, align: 'center' as const },
            ];

            const rows = filteredPengembalian.map((k, idx) => [
                idx + 1,
                k.peminjam,
                k.items || '-',
                k.tanggal_kembali,
                Number(k.biaya_denda) || 0,
                k.status_pembayaran_denda || 'TIDAK ADA DENDA',
                k.catatan_inspeksi || '-',
                k.status_verifikasi || 'SELESAI',
            ]);

            const sumDenda = filteredPengembalian.reduce((acc, cur) => acc + (Number(cur.biaya_denda) || 0), 0);

            sheets.push({
                name: 'Pengembalian & Denda',
                title: 'LAPORAN PENGEMBALIAN FASILITAS & PENGAWASAN DENDA',
                subtitle: 'Biro Sarana dan Prasarana - Universitas Nurul Huda',
                meta: [
                    { label: 'Tanggal Ekspor', value: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) },
                    { label: 'Total Pengembalian', value: `${filteredPengembalian.length} Transaksi` },
                    { label: 'Total Penerimaan Denda', value: `Rp ${sumDenda.toLocaleString('id-ID')}` },
                ],
                columns,
                rows,
                summaryRow: ['TOTAL KESELURUHAN', '', '', '', sumDenda, '', '', ''],
            });

            executeExport(filename, sheets);
        } else if (activeTab === 'inventaris') {
            const filename = `Laporan_Inventaris_Sarpras_UNUHA_${dateStr}`;
            const columns = [
                { title: 'NO', width: 35, align: 'center' as const },
                { title: 'Tahun Pengadaan', width: 95, align: 'center' as const },
                { title: 'Nama Barang', width: 180, align: 'left' as const },
                { title: 'Jumlah', width: 60, align: 'center' as const, isNumber: true },
                { title: 'Ruang', width: 140, align: 'left' as const },
                { title: 'Kondisi', subheaders: ['Baik', 'Sedang', 'Rusak'], width: 150 },
                { title: 'TOTAL', width: 100, align: 'right' as const, isCurrency: true },
            ];

            const allRows = filteredInventaris.map((inv, idx) => {
                const bVal = Number(inv.baik ?? (inv.kondisi_umum === 'Baik' ? inv.stok_total : 0));
                const sVal = Number(inv.sedang ?? (inv.kondisi_umum === 'Sedang' ? inv.stok_total : 0));
                const rVal = Number(inv.rusak ?? (inv.kondisi_umum === 'Rusak' ? inv.stok_total : 0));
                return [
                    idx + 1,
                    inv.tahun || '',
                    inv.nama,
                    Number(inv.stok_total) || 0,
                    inv.lokasi || '-',
                    bVal > 0 ? bVal : '',
                    sVal > 0 ? sVal : '',
                    rVal > 0 ? rVal : '',
                    '',
                ];
            });

            const totalStokAll = filteredInventaris.reduce((acc, c) => acc + (Number(c.stok_total) || 0), 0);
            const totalBaikAll = filteredInventaris.reduce((acc, c) => acc + (Number(c.baik) || (c.kondisi_umum === 'Baik' ? Number(c.stok_total) : 0)), 0);
            const totalSedangAll = filteredInventaris.reduce((acc, c) => acc + (Number(c.sedang) || (c.kondisi_umum === 'Sedang' ? Number(c.stok_total) : 0)), 0);
            const totalRusakAll = filteredInventaris.reduce((acc, c) => acc + (Number(c.rusak) || (c.kondisi_umum === 'Rusak' ? Number(c.stok_total) : 0)), 0);

            sheets.push({
                name: 'Semua Ruangan',
                title: 'REKAPITULASI INVENTARIS SARANA & PRASARANA SELURUH RUANGAN',
                subtitle: 'Biro Sarana dan Prasarana - Universitas Nurul Huda',
                meta: [
                    { label: 'Tanggal Cetak', value: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) },
                    { label: 'Total Aset', value: `${filteredInventaris.length} Jenis Barang (${totalStokAll} Unit)` },
                ],
                columns,
                rows: allRows,
                summaryRow: ['TOTAL KESELURUHAN', '', '', totalStokAll, '', totalBaikAll || '', totalSedangAll || '', totalRusakAll || '', ''],
            });

            executeExport(filename, sheets);
        }
    };

    return (
        <AdminLayout>
            <Head title="Pusat Laporan - Biro Sarpras UNUHA" />

            <div className="max-w-7xl mx-auto space-y-4 pb-14 font-sans text-slate-800 text-xs px-2 sm:px-4">
                {/* Header Banner Gradien Hijau UNUHA */}
                <div className="relative rounded-3xl bg-gradient-to-r from-[#006039] via-[#094c34] to-[#004225] p-6 sm:p-7 text-white shadow-md border border-emerald-800/40 flex flex-col md:flex-row md:items-center justify-between gap-5">
                    {/* Lingkaran dekoratif dalam wrapper overflow-hidden terisolasi */}
                    <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/5" />
                        <div className="absolute right-32 -bottom-16 w-40 h-40 rounded-full bg-emerald-400/10" />
                    </div>

                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
                            <FileText className="w-6 h-6 text-amber-300" strokeWidth={2} />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                                Pusat Laporan Operasional
                            </h1>
                            <p className="text-xs text-emerald-100/90 mt-0.5 font-normal">
                                Rekapitulasi inti sarana &amp; prasarana Universitas Nurul Huda.
                            </p>
                        </div>
                    </div>

                    {/* Search Bar & Tombol Unduh Laporan + Cetak / PDF */}
                    <div className="relative z-20 flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
                        {/* Search Bar */}
                        <div className="relative w-full sm:w-60">
                            <Search className="absolute inset-y-0 left-3.5 my-auto w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari data laporan..."
                                className="w-full pl-9 pr-7 py-2.5 bg-white text-slate-800 placeholder-slate-400 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-emerald-400 font-medium shadow-xs"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute inset-y-0 right-2.5 my-auto text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Tombol Unduh Laporan Oranye dengan Dropdown */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
                            >
                                <Download className="w-4 h-4" />
                                <span>Unduh Laporan</span>
                                <ChevronDown className={`w-3.5 h-3.5 ml-0.5 opacity-90 transition-transform duration-200 ${showDownloadMenu ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Backdrop Transparan untuk Klik di Luar */}
                            {showDownloadMenu && (
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowDownloadMenu(false)}
                                />
                            )}

                            {/* Dropdown Menu Mengambang Tanpa Terpotong */}
                            {showDownloadMenu && (
                                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                                    <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                                        Pilih Format Unduhan
                                    </div>

                                    {/* 1. Format Excel (.xls) */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleDownload('excel');
                                            setShowDownloadMenu(false);
                                        }}
                                        className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50 text-slate-800 hover:text-[#006039] font-bold flex items-center gap-2.5 cursor-pointer transition"
                                    >
                                        <div className="w-8 h-8 rounded-xl bg-emerald-100/80 text-[#006039] flex items-center justify-center shrink-0">
                                            <FileSpreadsheet className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900">Download Excel (.xls)</div>
                                            <div className="text-[10px] text-slate-400 font-normal">Format resmi tabel bergaris</div>
                                        </div>
                                    </button>

                                    <div className="border-t border-slate-100 my-1" />

                                    {/* 2. Format Word (.doc) */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleDownload('word');
                                            setShowDownloadMenu(false);
                                        }}
                                        className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50 text-slate-800 hover:text-blue-700 font-bold flex items-center gap-2.5 cursor-pointer transition"
                                    >
                                        <div className="w-8 h-8 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center shrink-0">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900">Download Word (.doc)</div>
                                            <div className="text-[10px] text-slate-400 font-normal">Dokumen Microsoft Word ber-kop</div>
                                        </div>
                                    </button>

                                    <div className="border-t border-slate-100 my-1" />

                                    {/* 3. Format PDF (.pdf) */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleDownload('pdf');
                                            setShowDownloadMenu(false);
                                        }}
                                        className="w-full text-left px-3.5 py-2.5 hover:bg-rose-50 text-slate-800 hover:text-rose-700 font-bold flex items-center gap-2.5 cursor-pointer transition"
                                    >
                                        <div className="w-8 h-8 rounded-xl bg-rose-100/80 text-rose-700 flex items-center justify-center shrink-0">
                                            <Printer className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900">Cetak / Unduh PDF</div>
                                            <div className="text-[10px] text-slate-400 font-normal">Format cetak kop surat resmi</div>
                                        </div>
                                    </button>

                                    <div className="border-t border-slate-100 my-1" />

                                    {/* 4. Format CSV (.csv) */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleDownload('csv');
                                            setShowDownloadMenu(false);
                                        }}
                                        className="w-full text-left px-3.5 py-2.5 hover:bg-amber-50 text-slate-800 hover:text-amber-700 font-bold flex items-center gap-2.5 cursor-pointer transition"
                                    >
                                        <div className="w-8 h-8 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center shrink-0">
                                            <Download className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900">Download CSV (.csv)</div>
                                            <div className="text-[10px] text-slate-400 font-normal">Kompatibel semua spreadsheet</div>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tab Menu Cards (Sesuai Desain Gambar Referensi) */}
                <div className="flex flex-wrap items-center gap-3">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`inline-flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all duration-150 cursor-pointer text-left min-h-[54px] select-none ${
                                    isActive
                                        ? 'bg-[#eaf5ef] border border-[#006039] shadow-xs'
                                        : 'bg-white border border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-xs'
                                }`}
                            >
                                {/* Kotak Ikon (Ikon Tetap Sesuai Permintaan) */}
                                <div
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                        isActive
                                            ? 'bg-[#006039] text-white shadow-2xs'
                                            : 'bg-slate-50 text-slate-600 border border-slate-100'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" strokeWidth={isActive ? 2.5 : 2} />
                                </div>

                                {/* Teks Label (Mendukung 1 atau 2 baris) */}
                                <div
                                    className={`flex flex-col justify-center text-xs leading-tight tracking-tight whitespace-nowrap ${
                                        isActive ? 'font-black text-[#006039]' : 'font-bold text-slate-800'
                                    }`}
                                >
                                    <span>{tab.line1}</span>
                                    {tab.line2 && <span>{tab.line2}</span>}
                                </div>

                                {/* Badge Jumlah */}
                                <span
                                    className={`ml-1 text-[11px] px-2.5 py-0.5 rounded-full font-bold transition-colors shrink-0 ${
                                        isActive
                                            ? 'bg-[#006039] text-white font-black'
                                            : 'bg-slate-100 text-slate-600'
                                    }`}
                                >
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Kontainer Utama Tabel: Simpel, Ringkas & Nyaman */}
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
                    {/* Toolbar Informasi Ringkas */}
                    <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white">
                        <h2 className="text-base font-black text-slate-900 capitalize">
                            {tabs.find((t) => t.id === activeTab)?.label}
                        </h2>

                        <div className="text-slate-500 text-xs flex items-center gap-2">
                            <span className="text-[11px] font-medium text-slate-400">Total:</span>
                            <span className="font-extrabold text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                {activeTab === 'semua' && `${filteredAll.length} Data`}
                                {activeTab === 'pengadaan' && `${filteredPengadaan.length} Data`}
                                {activeTab === 'maintenance' && `${filteredMaintenance.length} Data`}
                                {activeTab === 'pengecekan' && `${filteredPengecekan.length} Data`}
                                {activeTab === 'peminjaman' && `${filteredPeminjaman.length} Data`}
                                {activeTab === 'pengembalian' && `${filteredPengembalian.length} Data`}
                                {activeTab === 'inventaris' && `${filteredInventaris.length} Data`}
                            </span>
                        </div>
                    </div>

                    {/* TABEL GABUNGAN KETIKA TAB 'SEMUA' AKTIF (5 KOLOM TERPADU PERSIS GAMBAR) */}
                    {activeTab === 'semua' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-50/90 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                                    <tr>
                                        <th className="py-3.5 px-4">Kategori</th>
                                        <th className="py-3.5 px-4">Nama / Detail</th>
                                        <th className="py-3.5 px-4">Pengusul</th>
                                        <th className="py-3.5 px-4">Penempatan</th>
                                        <th className="py-3.5 px-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredAll.map((item) => {
                                        const Icon = item.icon || Box;
                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/80 transition">
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${item.kategoriBadge}`}>
                                                        {item.kategoriLabel}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-emerald-50/80 border border-emerald-200/60 flex items-center justify-center text-[#006039] shrink-0">
                                                            <Icon className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <div className="font-extrabold text-xs text-slate-900">{item.nama}</div>
                                                            <div className="text-[11px] text-slate-400 capitalize">{item.subDetail}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <div className="font-bold text-slate-900 text-xs">{item.pengusul}</div>
                                                    <div className="text-[10px] text-slate-400 mt-0.5">{item.tanggal}</div>
                                                </td>
                                                <td className="py-3.5 px-4 text-slate-600">
                                                    <div className="flex items-center gap-1.5 text-xs">
                                                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                        <span>{item.penempatan}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 ${item.statusBadge}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${item.dotColor}`}></span>
                                                        <span>{item.status}</span>
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredAll.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                                                Tidak ada data laporan yang cocok dengan pencarian Anda.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* 1. TABEL PENGADAAN BARANG (SIMPEL, INTI, STATUS TUNGGAL: SELESAI - TANPA KODE) */}
                    {activeTab === 'pengadaan' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-50/90 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                                    <tr>
                                        <th className="py-3 px-4">Nama Barang &amp; Spesifikasi</th>
                                        <th className="py-3 px-4">Pengusul</th>
                                        <th className="py-3 px-4">Penempatan</th>
                                        <th className="py-3 px-4 text-center">Jumlah</th>
                                        <th className="py-3 px-4 text-right">Total Biaya</th>
                                        <th className="py-3 px-4 text-center">Bukti Nota</th>
                                        <th className="py-3 px-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredPengadaan.map((b) => (
                                        <tr key={b.id} className="hover:bg-slate-50/70 transition">
                                            <td className="py-3 px-4">
                                                <div className="font-bold text-slate-900">{b.nama_barang}</div>
                                                <div className="text-[10px] text-slate-400 capitalize">{b.kategori}</div>
                                            </td>
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <div className="font-bold text-slate-800">{b.pelapor}</div>
                                                <div className="text-[10px] text-slate-400">{b.tanggal}</div>
                                            </td>
                                            <td className="py-3 px-4 text-slate-600">
                                                {b.lokasi_penempatan}
                                            </td>
                                            <td className="py-3 px-4 text-center font-extrabold text-slate-900 whitespace-nowrap">
                                                {b.jumlah}
                                            </td>
                                            <td className="py-3 px-4 text-right font-bold text-emerald-700 whitespace-nowrap">
                                                {b.total_biaya > 0 ? `Rp ${b.total_biaya.toLocaleString('id-ID')}` : '-'}
                                            </td>
                                            <td className="py-3 px-4 text-center whitespace-nowrap">
                                                {b.foto_bukti_nota ? (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setPreviewImage({
                                                                url: b.foto_bukti_nota,
                                                                title: `Nota - ${b.nama_barang}`,
                                                            })
                                                        }
                                                        className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-[#006039] font-bold rounded-lg border border-emerald-200 hover:bg-emerald-100 text-[10px] cursor-pointer transition"
                                                    >
                                                        <Eye className="w-3 h-3" />
                                                        <span>Lihat Nota</span>
                                                    </button>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </td>
                                            {/* STATUS TUNGGAL (INTI: SELESAI / SESUAI STATUS TANPA BADGE DOBEL) */}
                                            <td className="py-3 px-4 text-center whitespace-nowrap">
                                                <span
                                                    className={`px-2.5 py-1 rounded-md font-extrabold text-[10px] uppercase tracking-wide ${
                                                        b.status === 'selesai'
                                                            ? 'bg-emerald-100 text-[#006039]'
                                                            : b.status === 'disetujui'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : b.status === 'ditolak'
                                                            ? 'bg-rose-100 text-rose-800'
                                                            : 'bg-amber-100 text-amber-800'
                                                    }`}
                                                >
                                                    {b.status_label || (b.status === 'selesai' ? 'SELESAI' : b.status)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredPengadaan.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                                                Tidak ada data pengadaan barang ditemukan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* 2. TABEL PERBAIKAN / MAINTENANCE (TANPA KODE) */}
                    {activeTab === 'maintenance' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-50/90 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                                    <tr>
                                        <th className="py-3 px-4">Sarana / Prasarana</th>
                                        <th className="py-3 px-4">Pelapor</th>
                                        <th className="py-3 px-4">Kerusakan</th>
                                        <th className="py-3 px-4 text-right">Biaya</th>
                                        <th className="py-3 px-4 text-center">Foto</th>
                                        <th className="py-3 px-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredMaintenance.map((m) => (
                                        <tr key={m.id} className="hover:bg-slate-50/70 transition">
                                            <td className="py-3 px-4">
                                                <div className="font-bold text-slate-900">{m.sarpras}</div>
                                                <div className="text-[10px] text-slate-400">{m.lokasi}</div>
                                            </td>
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <div className="font-bold text-slate-800">{m.pelapor}</div>
                                                <div className="text-[10px] text-slate-400">{m.tanggal}</div>
                                            </td>
                                            <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                                                {m.deskripsi}
                                            </td>
                                            <td className="py-3 px-4 text-right font-bold text-amber-800 whitespace-nowrap">
                                                {m.biaya > 0 ? `Rp ${m.biaya.toLocaleString('id-ID')}` : '-'}
                                            </td>
                                            <td className="py-3 px-4 text-center whitespace-nowrap">
                                                {(m.foto_kerusakan || m.foto_bukti) ? (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setPreviewImage({
                                                                url: (m.foto_kerusakan || m.foto_bukti)!,
                                                                title: `Kerusakan - ${m.sarpras}`,
                                                            })
                                                        }
                                                        className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-800 font-bold rounded-lg border border-amber-200 hover:bg-amber-100 text-[10px] cursor-pointer"
                                                    >
                                                        <Eye className="w-3 h-3" />
                                                        <span>Foto</span>
                                                    </button>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-center whitespace-nowrap">
                                                <span
                                                    className={`px-2.5 py-1 rounded-md font-extrabold text-[10px] uppercase ${
                                                        m.status === 'selesai'
                                                            ? 'bg-emerald-100 text-[#006039]'
                                                            : m.status === 'dalam_perbaikan'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-amber-100 text-amber-800'
                                                    }`}
                                                >
                                                    {m.status_label || (m.status === 'selesai' ? 'SELESAI' : m.status)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredMaintenance.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                                                Tidak ada data perbaikan fasilitas ditemukan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* 3. TABEL CEK RUANGAN (PAS LAYAR & BEBAS GESER HORIZONTAL) */}
                    {activeTab === 'pengecekan' && (
                        <div className="w-full overflow-hidden">
                            <table className="w-full text-left text-xs border-collapse table-fixed">
                                <thead className="bg-slate-50/90 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                                    <tr>
                                        <th className="py-3 px-2 text-center w-14">Foto</th>
                                        <th className="py-3 px-3 w-[24%]">Ruangan</th>
                                        <th className="py-3 px-3 w-[22%]">PIC Ruangan</th>
                                        <th className="py-3 px-2 text-center w-[15%]">Kondisi</th>
                                        <th className="py-3 px-3 w-[25%]">Catatan</th>
                                        <th className="py-3 px-2 text-center w-24">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredPengecekan.map((ck) => {
                                        const isVerif =
                                            ck.status_tinjauan === 'SELESAI' ||
                                            ck.status_tinjauan === 'DIVERIFIKASI ADMIN' ||
                                            ck.status_tinjauan === 'VERIFIED' ||
                                            ck.status_tinjauan === 'DIVERIFIKASI';

                                        return (
                                            <tr key={ck.id} className="hover:bg-slate-50/70 transition">
                                                {/* Kolom Foto Dokumentasi / Fisik */}
                                                <td className="py-3 px-2 text-center">
                                                    {(ck.foto_ruangan || ck.foto_bukti) ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setPreviewImage({
                                                                    url: (ck.foto_ruangan || ck.foto_bukti)!,
                                                                    title: `Dokumentasi - ${ck.ruangan}`,
                                                                })
                                                            }
                                                            className="group relative inline-block cursor-pointer focus:outline-none"
                                                            title="Klik untuk melihat foto lebih besar"
                                                        >
                                                            <div className="w-10 h-10 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shadow-2xs group-hover:ring-2 group-hover:ring-[#006039] transition mx-auto">
                                                                <img
                                                                    src={(ck.foto_ruangan || ck.foto_bukti)!}
                                                                    alt={`Foto ${ck.ruangan}`}
                                                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                                                                />
                                                            </div>
                                                            <div className="absolute inset-0 bg-black/30 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white">
                                                                <Eye className="w-3.5 h-3.5" />
                                                            </div>
                                                        </button>
                                                    ) : (
                                                        <div className="w-10 h-10 mx-auto rounded-xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-300" title="Belum ada foto">
                                                            <Camera className="w-3.5 h-3.5" />
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Kolom Ruangan */}
                                                <td className="py-3 px-3">
                                                    <div className="font-bold text-slate-900 leading-snug line-clamp-2" title={ck.ruangan}>
                                                        {ck.ruangan}
                                                    </div>
                                                </td>

                                                {/* Kolom PIC Ruangan */}
                                                <td className="py-3 px-3">
                                                    <div className="font-bold text-slate-800 leading-tight line-clamp-1" title={ck.pelapor}>
                                                        {ck.pelapor}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 mt-0.5">
                                                        {ck.tanggal}
                                                    </div>
                                                </td>

                                                {/* Kolom Kondisi */}
                                                <td className="py-3 px-2 text-center">
                                                    <div className="inline-flex items-center justify-center gap-1 text-[11px] font-bold">
                                                        <span className="text-emerald-700 whitespace-nowrap">{ck.kondisi_baik} Baik</span>
                                                        <span className="text-slate-300">•</span>
                                                        <span className="text-rose-600 whitespace-nowrap">{ck.kondisi_rusak} Rusak</span>
                                                    </div>
                                                </td>

                                                {/* Kolom Catatan */}
                                                <td className="py-3 px-3">
                                                    <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-2" title={ck.catatan || '-'}>
                                                        {ck.catatan || '-'}
                                                    </p>
                                                </td>

                                                {/* Kolom Status (Verified) */}
                                                <td className="py-3 px-2 text-center">
                                                    <span
                                                        className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full font-extrabold text-[10px] tracking-wide whitespace-nowrap ${
                                                            isVerif
                                                                ? 'bg-emerald-100 text-[#006039] border border-emerald-200/80'
                                                                : 'bg-amber-100 text-amber-800 border border-amber-200/80'
                                                        }`}
                                                    >
                                                        {isVerif ? 'Verified' : 'Menunggu'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredPengecekan.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                                                Tidak ada data audit ruangan ditemukan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* 4. TABEL PEMINJAMAN (TANPA KODE) */}
                    {activeTab === 'peminjaman' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-50/90 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                                    <tr>
                                        <th className="py-3 px-4">Peminjam</th>
                                        <th className="py-3 px-4">Fasilitas &amp; Jumlah</th>
                                        <th className="py-3 px-4">Jadwal Pakai</th>
                                        <th className="py-3 px-4 text-center">KTM</th>
                                        <th className="py-3 px-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredPeminjaman.map((p) => (
                                        <tr key={p.id} className="hover:bg-slate-50/70 transition">
                                            <td className="py-3 px-4">
                                                <div className="font-bold text-slate-900">{p.peminjam}</div>
                                                <div className="text-[10px] text-slate-400">{p.unit}</div>
                                            </td>
                                            <td className="py-3 px-4 font-bold text-slate-800">
                                                {p.items}
                                            </td>
                                            <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                                                {p.tanggal_mulai} s/d {p.tanggal_kembali}
                                            </td>
                                            <td className="py-3 px-4 text-center whitespace-nowrap">
                                                {p.file_ktm ? (
                                                    <a
                                                        href={p.file_ktm}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px] transition"
                                                    >
                                                        <Eye className="w-3 h-3" />
                                                        <span>KTM</span>
                                                    </a>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-center whitespace-nowrap">
                                                <span
                                                    className={`px-2.5 py-1 rounded-md font-extrabold text-[10px] uppercase ${
                                                        p.status === 'selesai'
                                                            ? 'bg-emerald-100 text-[#006039]'
                                                            : p.status === 'sedang_dipinjam'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : p.status === 'ditolak' || p.status === 'dibatalkan'
                                                            ? 'bg-rose-100 text-rose-800'
                                                            : 'bg-amber-100 text-amber-800'
                                                    }`}
                                                >
                                                    {p.status_label || (p.status === 'selesai' ? 'SELESAI' : p.status)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredPeminjaman.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-10 text-center text-slate-400 text-xs">
                                                Tidak ada data peminjaman ditemukan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* 5. TABEL PENGEMBALIAN */}
                    {activeTab === 'pengembalian' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-50/90 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                                    <tr>
                                        <th className="py-3 px-4">Peminjam</th>
                                        <th className="py-3 px-4">Fasilitas Dikembalikan</th>
                                        <th className="py-3 px-4">Tanggal Pengembalian</th>
                                        <th className="py-3 px-4 text-right">Denda</th>
                                        <th className="py-3 px-4 text-center">Foto Bukti</th>
                                        <th className="py-3 px-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredPengembalian.map((k) => {
                                        const dendaVal = Number(k.biaya_denda ?? k.denda ?? 0);
                                        return (
                                            <tr key={k.id} className="hover:bg-slate-50/70 transition">
                                                <td className="py-3 px-4 whitespace-nowrap">
                                                    <div className="font-bold text-slate-900">{k.peminjam}</div>
                                                    <div className="text-[10px] text-slate-400">Ref: {k.kode_pinjam || '-'}</div>
                                                </td>
                                                <td className="py-3 px-4 text-slate-700">
                                                    {k.items}
                                                </td>
                                                <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                                                    {k.tanggal_kembali}
                                                </td>
                                                <td className="py-3 px-4 text-right font-bold whitespace-nowrap">
                                                    {dendaVal > 0 ? (
                                                        <span className="text-rose-600">Rp {dendaVal.toLocaleString('id-ID')}</span>
                                                    ) : (
                                                        <span className="text-emerald-700 font-semibold">Rp 0</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-center whitespace-nowrap">
                                                    {k.foto_bukti ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setPreviewImage({
                                                                    url: k.foto_bukti,
                                                                    title: `Bukti Pengembalian - ${k.peminjam}`,
                                                                })
                                                            }
                                                            className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-[#006039] font-bold rounded-lg border border-emerald-200 hover:bg-emerald-100 text-[10px] cursor-pointer transition"
                                                        >
                                                            <Eye className="w-3 h-3" />
                                                            <span>Foto</span>
                                                        </button>
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-center whitespace-nowrap">
                                                    <span
                                                        className={`px-2.5 py-1 rounded-md font-extrabold text-[10px] uppercase ${
                                                            k.status_verifikasi === 'SELESAI' || k.status_verifikasi === 'DISETUJUI' || k.status_denda === 'Lunas'
                                                                ? 'bg-emerald-100 text-[#006039]'
                                                                : 'bg-amber-100 text-amber-800'
                                                        }`}
                                                    >
                                                        {k.status_verifikasi || k.status_denda || 'SELESAI'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredPengembalian.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                                                Tidak ada data pengembalian ditemukan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {/* 6. TABEL MASTER SARANA & PRASARANA */}
                    {activeTab === 'inventaris' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-50/90 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                                    <tr>
                                        <th className="py-3 px-4">Nama Fasilitas</th>
                                        <th className="py-3 px-4">Jenis &amp; Kategori</th>
                                        <th className="py-3 px-4">Lokasi Ruangan</th>
                                        <th className="py-3 px-4 text-center">Stok Total</th>
                                        <th className="py-3 px-4 text-center">Tersedia</th>
                                        <th className="py-3 px-4 text-center">Kondisi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredInventaris.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                                            <td className="py-3 px-4 font-bold text-slate-900">
                                                {inv.nama}
                                            </td>
                                            <td className="py-3 px-4 whitespace-nowrap capitalize text-slate-600">
                                                {inv.jenis} • {inv.kategori}
                                            </td>
                                            <td className="py-3 px-4 text-slate-600">
                                                {inv.lokasi}
                                            </td>
                                            <td className="py-3 px-4 text-center font-bold text-slate-900">
                                                {inv.stok_total} {inv.satuan}
                                            </td>
                                            <td className="py-3 px-4 text-center font-bold text-emerald-700">
                                                {inv.stok_tersedia} {inv.satuan}
                                            </td>
                                            <td className="py-3 px-4 text-center whitespace-nowrap">
                                                <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                    {inv.kondisi_umum || inv.kondisi || 'Baik'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredInventaris.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                                                Tidak ada data sarana &amp; prasarana ditemukan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Preview Gambar / Nota */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
                    onClick={() => setPreviewImage(null)}
                >
                    <div
                        className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between text-xs font-bold">
                            <span className="truncate pr-4">{previewImage.title}</span>
                            <button
                                onClick={() => setPreviewImage(null)}
                                className="p-1 hover:bg-white/20 rounded-lg cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-3 bg-slate-950 flex items-center justify-center max-h-[75vh] overflow-auto">
                            <img
                                src={previewImage.url}
                                alt={previewImage.title}
                                className="max-w-full max-h-[70vh] object-contain rounded-lg"
                            />
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
