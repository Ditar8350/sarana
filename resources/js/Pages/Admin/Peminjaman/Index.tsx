import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { PageProps } from '@/types';
import {
    Calendar,
    Search,
    CheckCircle2,
    Clock,
    UserCheck,
    AlertCircle,
    X,
    XCircle,
    Eye,
    Camera,
    FileText,
    Info,
    Check,
    Pencil,
    ClipboardList,
    Phone,
    RotateCcw,
    Layers,
    Package,
    Filter,
    ArrowUpDown,
    Download,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

interface PeminjamanItem {
    id: number;
    kode: string;
    peminjam: string;
    nim_nip: string;
    unit: string;
    no_whatsapp: string;
    file_ktm: string;
    file_surat_pengantar: string | null;
    keperluan: string;
    tanggal_mulai: string;
    tanggal_kembali_rencana: string;
    tanggal_mulai_raw?: string;
    tanggal_kembali_raw?: string;
    status:
        | 'menunggu_validasi'
        | 'ditunda'
        | 'disetujui'
        | 'siap_diambil'
        | 'sedang_dipinjam'
        | 'menunggu_kembali'
        | 'selesai'
        | 'ditolak';
    catatan_admin: string | null;
    petugas_pengambilan: string | null;
    pendamping_staf_id?: number | null;
    no_hp_pendamping?: string | null;
    is_assigned_to_me?: boolean;
    lokasi_pengambilan: string | null;
    foto_bukti_terima: string | null;
    tanggal_terima: string | null;
    items: Array<{
        id: number;
        sarpras_id: number;
        nama_barang: string;
        qty: number;
        satuan: string;
        kondisi_sebelum: string;
    }>;
}

interface StafUser {
    id: number;
    name: string;
    role?: string;
    no_hp?: string | null;
}

interface Props {
    peminjamanList: PeminjamanItem[];
    stafUsers?: StafUser[];
    currentUserRole?: string;
    currentUserId?: number;
}

const cleanDate = (raw: string) => {
    if (!raw) return '-';
    return raw.replace(/\s+\d{2}:\d{2}$/, '');
};

const getUniqueItems = (items: PeminjamanItem['items']) => {
    const seen = new Set<string>();
    return items.filter((it) => {
        const key = `${it.sarpras_id}-${it.nama_barang}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

export default function PeminjamanIndex({ peminjamanList = [], stafUsers = [], currentUserRole = 'admin' }: Props) {
    const { flash } = usePage<PageProps & { flash?: { success?: string; error?: string } }>().props;
    const isStaf = currentUserRole === 'staf';

    const [cari, setCari] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('semua');
    const [detailModalItem, setDetailModalItem] = useState<PeminjamanItem | null>(null);

    // Popup notifikasi sementara (auto-close 4 detik + tombol Close)
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        if (flash?.success) {
            setToast({ type: 'success', message: flash.success });
        } else if (flash?.error) {
            setToast({ type: 'error', message: flash.error });
        }
    }, [flash?.success, flash?.error]);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 4000);
        return () => clearTimeout(timer);
    }, [toast]);

    // Modal Edit Peminjaman Lengkap (Untuk Tombol Edit di Kolom Aksi)
    const [editModalItem, setEditModalItem] = useState<PeminjamanItem | null>(null);
    const [editStatus, setEditStatus] = useState<PeminjamanItem['status']>('disetujui');
    const [editStafOption, setEditStafOption] = useState<string>('');
    const [editCustomStaf, setEditCustomStaf] = useState<string>('');
    const [editStafNoHp, setEditStafNoHp] = useState<string>('');
    const [editLokasi, setEditLokasi] = useState<string>('Loket Gudang Biro Sarpras Kampus Sukaraja');
    const [editTanggalMulai, setEditTanggalMulai] = useState<string>('');
    const [editTanggalKembali, setEditTanggalKembali] = useState<string>('');
    const [editCatatan, setEditCatatan] = useState<string>('');
    const [editFotoBukti, setEditFotoBukti] = useState<File | null>(null);
    const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null);

    // Lightbox Lihat Bukti Terima
    const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);

    // Modal Persetujuan & Penugasan Staf
    const [approveModalItem, setApproveModalItem] = useState<PeminjamanItem | null>(null);
    const [approveStafOption, setApproveStafOption] = useState<string>('');
    const [approveCustomStaf, setApproveCustomStaf] = useState<string>('');
    const [approveStafNoHp, setApproveStafNoHp] = useState<string>('');
    const [approveLokasi, setApproveLokasi] = useState<string>('Loket Gudang Biro Sarpras Kampus Sukaraja');
    const [approveCatatan, setApproveCatatan] = useState<string>('');

    // Modal Tolak Pengajuan
    const [rejectModalItem, setRejectModalItem] = useState<PeminjamanItem | null>(null);
    const [rejectAlasan, setRejectAlasan] = useState<string>('');

    const [isProcessing, setIsProcessing] = useState(false);

    // Staf yang hanya ber-role Staf Sarpras
    const stafList = stafUsers.filter((u) => u.role === 'staf' || !u.role);

    const openEditModal = (item: PeminjamanItem) => {
        setDetailModalItem(null);
        setEditModalItem(item);
        setEditStatus(item.status);

        const matchedStaf = item.pendamping_staf_id
            ? stafList.find((u) => u.id === item.pendamping_staf_id)
            : (item.petugas_pengambilan ? stafList.find((u) => u.name === item.petugas_pengambilan) : null);

        if (matchedStaf) {
            setEditStafOption(String(matchedStaf.id));
            setEditCustomStaf('');
            setEditStafNoHp(item.no_hp_pendamping || matchedStaf.no_hp || '');
        } else if (item.petugas_pengambilan) {
            setEditStafOption('__custom__');
            setEditCustomStaf(item.petugas_pengambilan);
            setEditStafNoHp(item.no_hp_pendamping || '');
        } else if (stafList.length > 0) {
            setEditStafOption(String(stafList[0].id));
            setEditCustomStaf('');
            setEditStafNoHp(stafList[0].no_hp || '');
        } else {
            setEditStafOption('__custom__');
            setEditCustomStaf('');
            setEditStafNoHp('');
        }

        setEditLokasi(item.lokasi_pengambilan || 'Loket Gudang Biro Sarpras Kampus Sukaraja');
        setEditTanggalMulai(item.tanggal_mulai_raw || '');
        setEditTanggalKembali(item.tanggal_kembali_raw || '');
        setEditCatatan(item.catatan_admin || '');
        setEditFotoBukti(null);
        setEditPreviewUrl(null);
    };

    const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setEditFotoBukti(file);
        if (file && file.type.startsWith('image/')) {
            setEditPreviewUrl(URL.createObjectURL(file));
        } else {
            setEditPreviewUrl(null);
        }
    };

    const handleSubmitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editModalItem) return;

        if (editStatus === 'ditolak' && !editCatatan.trim()) {
            alert('Silakan tuliskan catatan alasan penolakan untuk admin dan peminjam.');
            return;
        }

        const isCustom = editStafOption === '__custom__';
        const selectedStaf = !isCustom ? stafList.find((u) => String(u.id) === editStafOption) : null;
        const finalPetugas = isCustom ? editCustomStaf.trim() : (selectedStaf?.name || '');
        const finalStafId = selectedStaf?.id || null;
        const finalNoHp = editStafNoHp.trim() || selectedStaf?.no_hp || null;

        setIsProcessing(true);
        const formData = new FormData();
        formData.append('status', editStatus);
        formData.append('petugas_pengambilan', finalPetugas);
        if (finalStafId) {
            formData.append('pendamping_staf_id', String(finalStafId));
        }
        if (finalNoHp) {
            formData.append('no_hp_pendamping', finalNoHp);
        }
        formData.append('lokasi_pengambilan', editLokasi);
        if (editTanggalMulai) formData.append('tanggal_mulai', editTanggalMulai);
        if (editTanggalKembali) formData.append('tanggal_kembali_rencana', editTanggalKembali);
        formData.append('catatan_admin', editCatatan);
        if (editFotoBukti) {
            formData.append('foto_bukti_terima', editFotoBukti);
        }

        router.post(`/admin/peminjaman/${editModalItem.id}/update`, formData as any, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: (page: any) => {
                const msg =
                    page?.props?.flash?.success || `Data peminjaman ${editModalItem.kode} berhasil diperbarui.`;
                setToast({ type: 'success', message: msg });
                setEditModalItem(null);
            },
            onFinish: () => {
                setIsProcessing(false);
            },
        });
    };

    const openApproveModal = (item: PeminjamanItem) => {
        setDetailModalItem(null);
        setRejectModalItem(null);
        setEditModalItem(null);
        setApproveModalItem(item);

        const matchedStaf = item.pendamping_staf_id
            ? stafList.find((u) => u.id === item.pendamping_staf_id)
            : (item.petugas_pengambilan ? stafList.find((u) => u.name === item.petugas_pengambilan) : null);

        if (matchedStaf) {
            setApproveStafOption(String(matchedStaf.id));
            setApproveCustomStaf('');
            setApproveStafNoHp(item.no_hp_pendamping || matchedStaf.no_hp || '');
        } else if (item.petugas_pengambilan) {
            setApproveStafOption('__custom__');
            setApproveCustomStaf(item.petugas_pengambilan);
            setApproveStafNoHp(item.no_hp_pendamping || '');
        } else if (stafList.length > 0) {
            setApproveStafOption(String(stafList[0].id));
            setApproveCustomStaf('');
            setApproveStafNoHp(stafList[0].no_hp || '');
        } else {
            setApproveStafOption('__custom__');
            setApproveCustomStaf('');
            setApproveStafNoHp('');
        }

        setApproveLokasi(item.lokasi_pengambilan || 'Loket Gudang Biro Sarpras Kampus Sukaraja');
        setApproveCatatan(
            item.catatan_admin || 'Pengajuan disetujui. Silakan temui staf yang bertugas di loket serah terima.'
        );
    };

    const handleApproveAndAssign = (e: React.FormEvent) => {
        e.preventDefault();
        if (!approveModalItem) return;

        const isCustom = approveStafOption === '__custom__';
        const selectedStaf = !isCustom ? stafList.find((u) => String(u.id) === approveStafOption) : null;
        const finalPetugas = isCustom ? approveCustomStaf.trim() : (selectedStaf?.name || '');
        const finalStafId = selectedStaf?.id || null;

        if (!finalPetugas) {
            alert('Silakan pilih atau ketik nama staf yang bertugas.');
            return;
        }

        const finalNoHp = approveStafNoHp.trim() || selectedStaf?.no_hp || null;

        setIsProcessing(true);
        router.post(
            `/admin/peminjaman/${approveModalItem.id}/serahkan`,
            {
                petugas_pengambilan: finalPetugas,
                pendamping_staf_id: finalStafId,
                no_hp_pendamping: finalNoHp,
                lokasi_pengambilan: approveLokasi,
                catatan_staf: approveCatatan,
            },
            {
                preserveScroll: true,
                onSuccess: (page: any) => {
                    const msg =
                        page?.props?.flash?.success ||
                        `Peminjaman ${approveModalItem.kode} berhasil disetujui & staf (${finalPetugas}) ditugaskan.`;
                    setToast({ type: 'success', message: msg });
                    setApproveModalItem(null);
                },
                onError: (err: any) => {
                    const msg = (Object.values(err)[0] as string) || 'Gagal memproses penugasan staf.';
                    setToast({ type: 'error', message: msg });
                },
                onFinish: () => setIsProcessing(false),
            }
        );
    };

    const handleApproveOnly = () => {
        if (!approveModalItem) return;

        const isCustom = approveStafOption === '__custom__';
        const selectedStaf = !isCustom ? stafList.find((u) => String(u.id) === approveStafOption) : null;
        const finalPetugas = isCustom ? approveCustomStaf.trim() : (selectedStaf?.name || '');
        const finalStafId = selectedStaf?.id || null;
        const finalNoHp = approveStafNoHp.trim() || selectedStaf?.no_hp || null;

        setIsProcessing(true);
        router.post(
            `/admin/peminjaman/${approveModalItem.id}/approve`,
            {
                catatan_admin: approveCatatan,
                petugas_pengambilan: finalPetugas || null,
                pendamping_staf_id: finalStafId,
                no_hp_pendamping: finalNoHp,
                lokasi_pengambilan: approveLokasi,
            },
            {
                preserveScroll: true,
                onSuccess: (page: any) => {
                    const msg =
                        page?.props?.flash?.success || `Peminjaman ${approveModalItem.kode} berhasil disetujui.`;
                    setToast({ type: 'success', message: msg });
                    setApproveModalItem(null);
                },
                onError: (err: any) => {
                    const msg = (Object.values(err)[0] as string) || 'Gagal menyetujui peminjaman.';
                    setToast({ type: 'error', message: msg });
                },
                onFinish: () => setIsProcessing(false),
            }
        );
    };

    const openRejectModal = (item: PeminjamanItem) => {
        setDetailModalItem(null);
        setApproveModalItem(null);
        setEditModalItem(null);
        setRejectModalItem(item);
        setRejectAlasan('');
    };

    const handleReject = (e: React.FormEvent) => {
        e.preventDefault();
        if (!rejectModalItem) return;
        if (!rejectAlasan.trim()) {
            alert('Silakan masukkan alasan penolakan.');
            return;
        }

        setIsProcessing(true);
        router.post(
            `/admin/peminjaman/${rejectModalItem.id}/reject`,
            {
                alasan: rejectAlasan,
            },
            {
                preserveScroll: true,
                onSuccess: (page: any) => {
                    const msg =
                        page?.props?.flash?.success || `Pengajuan peminjaman ${rejectModalItem.kode} telah ditolak.`;
                    setToast({ type: 'success', message: msg });
                    setRejectModalItem(null);
                },
                onError: (err: any) => {
                    const msg = (Object.values(err)[0] as string) || 'Gagal menolak peminjaman.';
                    setToast({ type: 'error', message: msg });
                },
                onFinish: () => setIsProcessing(false),
            }
        );
    };

    const normStatus = (s: string) => (s || '').toLowerCase().trim();

    const countMenunggu = peminjamanList.filter((i) => ['menunggu_validasi', 'pending', 'ditunda'].includes(normStatus(i.status))).length;
    const countPilihStaf = peminjamanList.filter((i) => ['disetujui', 'approved'].includes(normStatus(i.status))).length;
    const countMenungguBukti = peminjamanList.filter((i) => normStatus(i.status) === 'siap_diambil').length;
    const countPerluProses = countMenunggu + countPilihStaf + countMenungguBukti;
    const countDipinjam = peminjamanList.filter((i) => ['sedang_dipinjam', 'dipinjam'].includes(normStatus(i.status))).length;
    const countMenungguKembali = peminjamanList.filter((i) => normStatus(i.status) === 'menunggu_kembali').length;
    const countSelesai = peminjamanList.filter((i) => ['selesai', 'dikembalikan', 'lunas'].includes(normStatus(i.status))).length;
    const countDitolak = peminjamanList.filter((i) => ['ditolak', 'rejected'].includes(normStatus(i.status))).length;
    const countTugasSaya = peminjamanList.filter(
        (i) => i.is_assigned_to_me || ['disetujui', 'approved'].includes(normStatus(i.status)) || (normStatus(i.status) === 'siap_diambil' && !i.pendamping_staf_id) || normStatus(i.status) === 'menunggu_kembali'
    ).length;

    // State Tambahan untuk Toolbar Tabel (Search, Filter, Sort, Download)
    const [sortAsc, setSortAsc] = useState<boolean>(false);
    const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
    const [selectedProdi, setSelectedProdi] = useState<string>('semua');

    // Kumpulan Unit / Prodi Unik untuk Dropdown Filter
    const prodiOptions = Array.from(
        new Set(
            peminjamanList
                .map((i) => {
                    const u = i.unit || '';
                    return u.split(' - ')[0].trim();
                })
                .filter(Boolean)
        )
    ).sort();

    // Export CSV Data yang Sedang Difilter
    const handleDownloadCSV = () => {
        if (filtered.length === 0) {
            alert('Tidak ada data transaksi untuk diunduh.');
            return;
        }
        const headers = ['No', 'Kode Peminjaman', 'Peminjam', 'NIM/NIP', 'Unit / Prodi', 'Fasilitas', 'Jadwal Mulai', 'Jadwal Selesai', 'Status', 'Petugas Staf'];
        const rows = filtered.map((item, idx) => {
            const fasil = getUniqueItems(item.items).map((it) => `${it.nama_barang} [${it.qty} ${it.satuan}]`).join('; ');
            return [
                idx + 1,
                `"${item.kode}"`,
                `"${item.peminjam.replace(/"/g, '""')}"`,
                `"${item.nim_nip || '-'}"`,
                `"${(item.unit || '-').replace(/"/g, '""')}"`,
                `"${fasil.replace(/"/g, '""')}"`,
                `"${cleanDate(item.tanggal_mulai)}"`,
                `"${cleanDate(item.tanggal_kembali_rencana)}"`,
                `"${item.status}"`,
                `"${item.petugas_pengambilan ? item.petugas_pengambilan.split('(')[0].trim() : '-'}"`
            ].join(',');
        });
        const csvString = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `data_peminjaman_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filtered = peminjamanList.filter((item) => {
        const itemStat = normStatus(item.status);
        let matchesStatus = true;
        if (statusFilter === 'tugas_saya') {
            matchesStatus = Boolean(
                item.is_assigned_to_me ||
                    ['disetujui', 'approved'].includes(itemStat) ||
                    (itemStat === 'siap_diambil' && !item.pendamping_staf_id) ||
                    itemStat === 'menunggu_kembali'
            );
        } else if (statusFilter === 'perlu_proses') {
            matchesStatus = ['menunggu_validasi', 'pending', 'ditunda', 'disetujui', 'approved', 'siap_diambil'].includes(itemStat);
        } else if (statusFilter === 'menunggu_validasi') {
            matchesStatus = ['menunggu_validasi', 'pending', 'ditunda'].includes(itemStat);
        } else if (statusFilter === 'siap_diambil') {
            matchesStatus = itemStat === 'siap_diambil';
        } else if (statusFilter === 'sedang_dipinjam') {
            matchesStatus = ['sedang_dipinjam', 'dipinjam'].includes(itemStat);
        } else if (statusFilter === 'menunggu_kembali') {
            matchesStatus = itemStat === 'menunggu_kembali';
        } else if (statusFilter === 'selesai') {
            matchesStatus = ['selesai', 'dikembalikan', 'lunas'].includes(itemStat);
        } else if (statusFilter === 'ditolak') {
            matchesStatus = ['ditolak', 'rejected'].includes(itemStat);
        } else if (statusFilter !== 'semua') {
            matchesStatus = itemStat === normStatus(statusFilter);
        }

        // Filter Prodi Opsional dari Tombol Filter
        let matchesProdi = true;
        if (selectedProdi !== 'semua') {
            const u = item.unit || '';
            matchesProdi = u.toLowerCase().includes(selectedProdi.toLowerCase());
        }

        const q = cari.toLowerCase();
        const matchesSearch =
            item.peminjam.toLowerCase().includes(q) ||
            item.kode.toLowerCase().includes(q) ||
            item.nim_nip.toLowerCase().includes(q) ||
            item.unit.toLowerCase().includes(q) ||
            item.items.some((it) => it.nama_barang.toLowerCase().includes(q));
        return matchesStatus && matchesProdi && matchesSearch;
    })
    .sort((a, b) => {
        if (sortAsc) {
            return a.id - b.id;
        }
        return b.id - a.id;
    });

    return (
        <AdminLayout>
            <Head title="Data Peminjaman & Pembagian Staf - Biro Sarpras UNUHA" />

            <div className="w-full space-y-5 pb-14 font-sans text-slate-800 text-xs">
                {/* Popup Notifikasi Sementara (Auto-Close 4 Detik + Tombol Close) */}
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
                                        {toast.type === 'success' ? 'Berhasil' : 'Perhatian'}
                                    </p>
                                    <p className="text-xs font-semibold text-slate-800 leading-snug">{toast.message}</p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setToast(null)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-[11px] font-bold transition cursor-pointer shrink-0"
                            >
                                <span>Close</span>
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* 1. Header Modern & Rapi */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#006039] to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Calendar className="w-5 h-5" strokeWidth={2} />
                        </div>
                        <div>
                            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
                                {isStaf ? 'Tugas Pendampingan & Serah Terima' : 'Peminjaman Sarpras'}
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {isStaf
                                    ? 'Siapkan fasilitas yang disetujui di loket dan pantau konfirmasi penerimaan dari peminjam.'
                                    : 'Persetujuan dan serah terima peminjaman sarpras.'}
                            </p>
                        </div>
                    </div>

                    <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50/80 border border-emerald-200/70 text-[#006039] font-bold text-xs shrink-0 self-start sm:self-auto">
                        <ClipboardList className="w-4 h-4" />
                        <span>{peminjamanList.length} Transaksi</span>
                    </div>
                </div>

                {/* 2. Kartu Ringkasan Interaktif (Sesuai dengan Data Peminjaman pada Tabel) */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
                    {/* Kartu 1: Semua Transaksi */}
                    <button
                        type="button"
                        onClick={() => setStatusFilter('semua')}
                        className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                            statusFilter === 'semua'
                                ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-400/20 shadow-xs'
                                : 'bg-white border-slate-200/90 shadow-2xs hover:border-blue-300'
                        }`}
                    >
                        <div>
                            <p className="text-[11px] font-semibold text-slate-500">Semua Transaksi</p>
                            <h3 className="text-2xl font-extrabold text-blue-600 mt-0.5">{peminjamanList.length}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Layers className="w-5 h-5" strokeWidth={2} />
                        </div>
                    </button>

                    {/* Kartu 2: Perlu Proses (Approval, Pilih Staf, Bukti Terima) */}
                    <button
                        type="button"
                        onClick={() => setStatusFilter(statusFilter === 'perlu_proses' ? 'semua' : 'perlu_proses')}
                        className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                            statusFilter === 'perlu_proses' || ['menunggu_validasi', 'disetujui', 'siap_diambil'].includes(statusFilter)
                                ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
                                : 'bg-white border-slate-200/90 shadow-2xs hover:border-amber-300'
                        }`}
                    >
                        <div>
                            <p className="text-[11px] font-semibold text-slate-500">Perlu Proses</p>
                            <h3 className="text-2xl font-extrabold text-amber-600 mt-0.5">{countPerluProses}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Clock className="w-5 h-5" strokeWidth={2} />
                        </div>
                    </button>

                    {/* Kartu 3: Sedang Dipinjam */}
                    <button
                        type="button"
                        onClick={() => setStatusFilter(statusFilter === 'sedang_dipinjam' ? 'semua' : 'sedang_dipinjam')}
                        className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                            statusFilter === 'sedang_dipinjam'
                                ? 'bg-purple-50/70 border-purple-400 ring-2 ring-purple-400/20 shadow-xs'
                                : 'bg-white border-slate-200/90 shadow-2xs hover:border-purple-300'
                        }`}
                    >
                        <div>
                            <p className="text-[11px] font-semibold text-slate-500">Sedang Dipinjam</p>
                            <h3 className="text-2xl font-extrabold text-purple-600 mt-0.5">{countDipinjam}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Package className="w-5 h-5" strokeWidth={2} />
                        </div>
                    </button>

                    {/* Kartu 4: Selesai */}
                    <button
                        type="button"
                        onClick={() => setStatusFilter(statusFilter === 'selesai' ? 'semua' : 'selesai')}
                        className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                            statusFilter === 'selesai'
                                ? 'bg-emerald-50/70 border-[#006039] ring-2 ring-[#006039]/20 shadow-xs'
                                : 'bg-white border-slate-200/90 shadow-2xs hover:border-emerald-300'
                        }`}
                    >
                        <div>
                            <p className="text-[11px] font-semibold text-slate-500">Selesai</p>
                            <h3 className="text-2xl font-extrabold text-[#006039] mt-0.5">{countSelesai}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#006039] to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <CheckCircle2 className="w-5 h-5" strokeWidth={2} />
                        </div>
                    </button>

                    {/* Kartu 5: Ditolak */}
                    <button
                        type="button"
                        onClick={() => setStatusFilter(statusFilter === 'ditolak' ? 'semua' : 'ditolak')}
                        className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                            statusFilter === 'ditolak'
                                ? 'bg-rose-50/70 border-rose-400 ring-2 ring-rose-400/20 shadow-xs'
                                : 'bg-white border-slate-200/90 shadow-2xs hover:border-rose-300'
                        }`}
                    >
                        <div>
                            <p className="text-[11px] font-semibold text-slate-500">Ditolak</p>
                            <h3 className="text-2xl font-extrabold text-rose-600 mt-0.5">{countDitolak}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <XCircle className="w-5 h-5" strokeWidth={2} />
                        </div>
                    </button>
                </div>

                {/* 3. Tabel Daftar Peminjaman dengan Toolbar Tengah 1 Baris yang Seimbang & Rapi */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                    {/* Toolbar Header di dalam Card Tabel (Sesuai Gambar Pertama: Search di kiri, Filter, Sort, Download di kanan) */}
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
                        {/* Search Bar di Kiri */}
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="absolute inset-y-0 left-3.5 my-auto w-4 h-4 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                value={cari}
                                onChange={(e) => setCari(e.target.value)}
                                placeholder="Cari kode, peminjam, fasilitas..."
                                className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-xs focus:border-[#006039] focus:ring-1 focus:ring-[#006039] outline-hidden bg-white text-slate-800 placeholder-slate-400 font-medium transition shadow-2xs"
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

                        {/* Action Buttons di Kanan: Filter, Sort, Download */}
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                            {/* Tombol Filter */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer shadow-2xs ${
                                        selectedProdi !== 'semua' || isFilterOpen
                                            ? 'border-[#006039] bg-emerald-50 text-[#006039]'
                                            : 'border-slate-200 hover:bg-slate-50 text-slate-700 bg-white'
                                    }`}
                                    title="Filter Berdasarkan Unit / Prodi"
                                >
                                    <Filter className="w-3.5 h-3.5" />
                                    <span>Filter</span>
                                    {selectedProdi !== 'semua' && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#006039]"></span>
                                    )}
                                </button>

                                {/* Dropdown Menu Filter */}
                                {isFilterOpen && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl z-30 p-3 space-y-2">
                                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                            <span className="font-bold text-slate-800 text-xs">Filter Unit / Prodi</span>
                                            {selectedProdi !== 'semua' && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedProdi('semua')}
                                                    className="text-[11px] font-semibold text-[#006039] hover:underline cursor-pointer"
                                                >
                                                    Reset
                                                </button>
                                            )}
                                        </div>
                                        <div className="max-h-48 overflow-y-auto space-y-1 text-xs">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedProdi('semua');
                                                    setIsFilterOpen(false);
                                                }}
                                                className={`w-full text-left px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                                                    selectedProdi === 'semua'
                                                        ? 'bg-emerald-50 text-[#006039] font-bold'
                                                        : 'text-slate-700 hover:bg-slate-50'
                                                }`}
                                            >
                                                Semua Unit / Prodi
                                            </button>
                                            {prodiOptions.map((prodi) => (
                                                <button
                                                    key={prodi}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedProdi(prodi);
                                                        setIsFilterOpen(false);
                                                    }}
                                                    className={`w-full text-left px-2.5 py-1.5 rounded-lg transition cursor-pointer truncate ${
                                                        selectedProdi === prodi
                                                            ? 'bg-emerald-50 text-[#006039] font-bold'
                                                            : 'text-slate-700 hover:bg-slate-50'
                                                    }`}
                                                    title={prodi}
                                                >
                                                    {prodi}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Tombol Sortir */}
                            <button
                                type="button"
                                onClick={() => setSortAsc(!sortAsc)}
                                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 bg-white transition cursor-pointer shadow-2xs"
                                title={sortAsc ? 'Urutkan ID Terlama' : 'Urutkan ID Terbaru'}
                            >
                                <ArrowUpDown className="w-3.5 h-3.5" />
                            </button>

                            {/* Tombol Download */}
                            <button
                                type="button"
                                onClick={handleDownloadCSV}
                                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 bg-white transition cursor-pointer shadow-2xs"
                                title="Unduh Rekap Data (CSV)"
                            >
                                <Download className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Tabel 5 Kolom: Peminjam | Fasilitas | Jadwal | Status & Staf | Aksi */}
                    <div className="overflow-x-auto">
                        <table className="w-full lg:table-fixed text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                                    <th className="py-3 px-4 lg:w-[22%]">Peminjam</th>
                                    <th className="py-3 px-3 lg:w-[26%]">Fasilitas</th>
                                    <th className="py-3 px-3 lg:w-[16%]">Jadwal</th>
                                    <th className="py-3 px-3 text-center lg:w-[18%]">Status &amp; Staf</th>
                                    <th className="py-3 px-4 text-right lg:w-[18%]">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((item) => {
                                    const uniqueItems = getUniqueItems(item.items);

                                    return (
                                        <tr
                                            key={item.id}
                                            className="hover:bg-slate-50/70 transition-colors align-middle"
                                        >
                                            {/* Kolom 1: Peminjam */}
                                            <td className="py-3.5 px-4">
                                                <div className="min-w-0 space-y-0.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => setDetailModalItem(item)}
                                                        className="font-bold text-slate-900 hover:text-[#006039] text-xs block truncate w-full text-left transition-colors cursor-pointer"
                                                        title={item.peminjam}
                                                    >
                                                        {item.peminjam}
                                                    </button>
                                                    <div className="text-[11px] text-slate-400 truncate">
                                                        {item.unit}
                                                    </div>
                                                    <div className="pt-0.5 flex items-center gap-2">
                                                        <a
                                                            href={item.file_ktm}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline"
                                                        >
                                                            <FileText className="w-3 h-3" />
                                                            <span>Lihat KTM/KTP</span>
                                                        </a>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Kolom 2: Fasilitas (Terpisah Sendiri & Tidak Double) */}
                                            <td className="py-3.5 px-3">
                                                <div className="space-y-1.5 min-w-0">
                                                    {uniqueItems.map((it) => (
                                                        <div key={it.id} className="min-w-0">
                                                            <p
                                                                className="font-bold text-slate-800 text-xs leading-snug line-clamp-1"
                                                                title={it.nama_barang}
                                                            >
                                                                {it.nama_barang}
                                                            </p>
                                                            <span className="inline-block text-[10px] font-bold text-[#006039] bg-emerald-50/80 px-1.5 py-0.2 rounded mt-0.5">
                                                                {it.qty} {it.satuan}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>

                                            {/* Kolom 3: Jadwal (Terpisah Sendiri) */}
                                            <td className="py-3.5 px-3 whitespace-nowrap">
                                                <div className="space-y-0.5 text-[11px]">
                                                    <div className="font-semibold text-slate-800">
                                                        {cleanDate(item.tanggal_mulai)}
                                                    </div>
                                                    <div className="text-slate-400">
                                                        s/d {cleanDate(item.tanggal_kembali_rencana)}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Kolom 4: Status & Staf */}
                                            <td className="py-3.5 px-3 text-center">
                                                <div className="flex flex-col items-center gap-1.5">
                                                    {/* Badge Status Terstandar & Fallback Aman */}
                                                    {(() => {
                                                        const s = (item.status || '').toLowerCase().trim();
                                                        if (s === 'menunggu_validasi' || s === 'pending') {
                                                            return (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 bg-amber-50 text-amber-700 rounded-full font-bold text-[10px] border border-amber-200">
                                                                    Menunggu Approval
                                                                </span>
                                                            );
                                                        }
                                                        if (s === 'ditunda') {
                                                            return (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px] border border-amber-300">
                                                                    Ditunda
                                                                </span>
                                                            );
                                                        }
                                                        if (s === 'disetujui' || s === 'approved') {
                                                            return (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full font-bold text-[10px] border border-blue-200">
                                                                    Pilih Staf
                                                                </span>
                                                            );
                                                        }
                                                        if (s === 'siap_diambil') {
                                                            return (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-bold text-[10px] border border-indigo-200">
                                                                    Menunggu Bukti
                                                                </span>
                                                            );
                                                        }
                                                        if (s === 'sedang_dipinjam' || s === 'dipinjam') {
                                                            return (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-[#006039] rounded-full font-bold text-[10px] border border-emerald-200">
                                                                    <CheckCircle2 className="w-3 h-3" />
                                                                    <span>Dipinjam</span>
                                                                </span>
                                                            );
                                                        }
                                                        if (s === 'menunggu_kembali') {
                                                            return (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 bg-purple-50 text-purple-700 rounded-full font-bold text-[10px] border border-purple-200">
                                                                    Cek Kembali
                                                                </span>
                                                            );
                                                        }
                                                        if (s === 'selesai' || s === 'dikembalikan' || s === 'lunas') {
                                                            return (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full font-bold text-[10px] border border-slate-200">
                                                                    Selesai
                                                                </span>
                                                            );
                                                        }
                                                        if (s === 'ditolak' || s === 'rejected') {
                                                            return (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 bg-rose-50 text-rose-700 rounded-full font-bold text-[10px] border border-rose-200">
                                                                    Ditolak
                                                                </span>
                                                            );
                                                        }
                                                        return (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full font-bold text-[10px] border border-slate-200 capitalize">
                                                                {s.replace(/_/g, ' ') || 'Diproses'}
                                                            </span>
                                                        );
                                                    })()}

                                                    {/* Info Staf yang Bertugas */}
                                                    {item.petugas_pengambilan ? (
                                                        <div className="flex flex-col items-center mt-0.5">
                                                            <span
                                                                className="text-[10px] text-slate-700 font-semibold truncate max-w-[135px] flex items-center gap-1"
                                                                title={item.petugas_pengambilan}
                                                            >
                                                                <UserCheck className="w-3 h-3 text-[#006039] shrink-0" />
                                                                <span>{item.petugas_pengambilan.replace(/\s*\(.*\)/, '')}</span>
                                                            </span>
                                                            {item.no_hp_pendamping && (
                                                                <span className="text-[9px] text-emerald-700 font-bold flex items-center gap-0.5">
                                                                    <Phone className="w-2.5 h-2.5" />
                                                                    <span>{item.no_hp_pendamping}</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        (item.status === 'disetujui' || item.status === 'siap_diambil') && (
                                                            <span className="text-[9px] text-blue-600 font-semibold">
                                                                Staf belum ditentukan
                                                            </span>
                                                        )
                                                    )}

                                                    {item.foto_bukti_terima && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setLightboxImage({
                                                                    url: item.foto_bukti_terima!,
                                                                    title: `Bukti Terima - ${item.peminjam}`,
                                                                })
                                                            }
                                                            className="inline-flex items-center gap-1 text-[10px] font-bold text-[#006039] hover:underline cursor-pointer pt-0.5"
                                                        >
                                                            <Eye className="w-3 h-3" />
                                                            <span>Bukti Terima</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Kolom 5: Aksi */}
                                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                <div className="inline-flex items-center justify-end gap-1.5">
                                                    {/* Jika status menunggu approval atau ditunda: Tombol Setujui & Tolak (Hanya Admin) */}
                                                    {!isStaf && (item.status === 'menunggu_validasi' || item.status === 'ditunda') && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => openApproveModal(item)}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#006039] hover:bg-[#0f4c3a] text-white rounded-lg text-[11px] font-bold shadow-2xs transition cursor-pointer"
                                                                title="Setujui Peminjaman & Tunjuk Staf"
                                                            >
                                                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                                                <span>Setujui</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => openRejectModal(item)}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold transition cursor-pointer"
                                                                title="Tolak Pengajuan"
                                                            >
                                                                <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                                                <span>Tolak</span>
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* Jika status disetujui (belum ditugaskan staf): Tombol Tunjuk Staf / Siapkan Barang & Tolak */}
                                                    {item.status === 'disetujui' && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => openApproveModal(item)}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold shadow-2xs transition cursor-pointer"
                                                                title={isStaf ? 'Siapkan Barang & Loket Pengambilan' : 'Tunjuk Staf Sarpras yang Bertugas'}
                                                            >
                                                                <UserCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                                                                <span>{isStaf ? 'Siapkan Barang' : 'Tunjuk Staf'}</span>
                                                            </button>
                                                            {!isStaf && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openRejectModal(item)}
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold transition cursor-pointer"
                                                                    title="Tolak Pengajuan"
                                                                >
                                                                    <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                                                    <span>Tolak</span>
                                                                </button>
                                                            )}
                                                        </>
                                                    )}

                                                    {/* Jika status menunggu kembali: Tombol Cek Fisik ke Menu Pengembalian */}
                                                    {item.status === 'menunggu_kembali' && (
                                                        <a
                                                            href="/admin/pengembalian"
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-bold shadow-2xs transition cursor-pointer"
                                                            title="Buka Menu Pengembalian & Lakukan Cek Fisik Barang"
                                                        >
                                                            <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                                                            <span>Cek Fisik</span>
                                                        </a>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={() => setDetailModalItem(item)}
                                                        className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                                                        title="Lihat Detail"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </button>

                                                    {!isStaf && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditModal(item)}
                                                            className="inline-flex items-center gap-1 px-2 py-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-lg text-[11px] font-bold transition cursor-pointer"
                                                            title="Edit Status, Staf Bertugas, Jadwal & Bukti"
                                                        >
                                                            <Pencil className="w-3 h-3" />
                                                            <span className="hidden sm:inline">Edit</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-12 px-4 text-center text-slate-400">
                                            <p className="font-bold text-slate-700 text-xs">
                                                Tidak ada transaksi peminjaman ditemukan
                                            </p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">
                                                Silakan pilih tab filter lain atau ubah kata kunci pencarian.
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* MODAL EDIT PEMINJAMAN (Status, Staf Bertugas, Lokasi, Jadwal, Bukti Terima, Catatan) */}
                {editModalItem && (
                    <div
                        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
                        onClick={() => setEditModalItem(null)}
                    >
                        <form
                            onSubmit={handleSubmitEdit}
                            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 my-8"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header Modal Edit */}
                            <div className="bg-[#006039] px-5 py-4 text-white flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <Pencil className="w-4 h-4 text-emerald-200" />
                                    <div>
                                        <h3 className="text-sm font-bold">
                                            Edit Peminjaman {editModalItem.kode}
                                        </h3>
                                        <p className="text-[11px] text-emerald-100">
                                            Peminjam: {editModalItem.peminjam} ({editModalItem.unit})
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setEditModalItem(null)}
                                    className="p-1 text-white/80 hover:text-white rounded-lg cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
                                {/* Ringkasan Fasilitas */}
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                                        Fasilitas yang Dipinjam
                                    </span>
                                    {getUniqueItems(editModalItem.items).map((it) => (
                                        <div key={it.id} className="font-bold text-slate-800 flex items-center justify-between">
                                            <span>{it.nama_barang}</span>
                                            <span className="text-[#006039] bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                                                {it.qty} {it.satuan}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* 1. Keputusan Persetujuan: Setujui atau Tolak */}
                                <div className="space-y-2">
                                    <label className="block font-bold text-slate-800 text-xs">
                                        Keputusan Persetujuan Peminjaman <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        <button
                                            type="button"
                                            onClick={() => setEditStatus('siap_diambil')}
                                            className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                                                editStatus !== 'ditolak' && editStatus !== 'menunggu_validasi'
                                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                                                    : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-700'
                                            }`}
                                        >
                                            <div
                                                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                                    editStatus !== 'ditolak' && editStatus !== 'menunggu_validasi'
                                                        ? 'bg-white/20 text-white'
                                                        : 'bg-emerald-100 text-emerald-700'
                                                }`}
                                            >
                                                <Check className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <span className="font-extrabold text-xs block leading-tight">
                                                    Setujui
                                                </span>
                                                <span
                                                    className={`text-[10px] block ${
                                                        editStatus !== 'ditolak' && editStatus !== 'menunggu_validasi'
                                                            ? 'text-emerald-100'
                                                            : 'text-slate-400'
                                                    }`}
                                                >
                                                    Peminjaman diterima
                                                </span>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setEditStatus('ditolak')}
                                            className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                                                editStatus === 'ditolak'
                                                    ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                                                    : 'bg-white border-slate-200 text-slate-700 hover:border-rose-500 hover:text-rose-700'
                                            }`}
                                        >
                                            <div
                                                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                                    editStatus === 'ditolak'
                                                        ? 'bg-white/20 text-white'
                                                        : 'bg-rose-100 text-rose-700'
                                                }`}
                                            >
                                                <X className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <span className="font-extrabold text-xs block leading-tight">
                                                    Tolak
                                                </span>
                                                <span
                                                    className={`text-[10px] block ${
                                                        editStatus === 'ditolak' ? 'text-rose-100' : 'text-slate-400'
                                                    }`}
                                                >
                                                    Tolak & beri catatan
                                                </span>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* KONDISI JIKA DITOLAK: TAMPILKAN PERINGATAN DAN INPUT CATATAN PENOLAKAN WAJIB */}
                                {editStatus === 'ditolak' ? (
                                    <div className="space-y-3.5">
                                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 flex items-start gap-2.5">
                                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-bold text-xs">Pengajuan Ini Akan Ditolak</p>
                                                <p className="text-[11px] text-rose-700 mt-0.5 leading-snug">
                                                    Wajib sertakan catatan alasan penolakan di bawah. Catatan ini akan dicatat ke log admin dan dikirimkan langsung sebagai notifikasi ke peminjam.
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block font-bold text-slate-800 mb-1">
                                                Catatan Alasan Penolakan untuk Admin & Peminjam <span className="text-rose-500">* (Wajib)</span>
                                            </label>
                                            <textarea
                                                rows={3}
                                                required
                                                value={editCatatan}
                                                onChange={(e) => setEditCatatan(e.target.value)}
                                                placeholder="Contoh: Jadwal pemakaian ruangan bentrok dengan agenda universitas, atau fasilitas sedang dalam perbaikan teknis..."
                                                className="w-full px-3 py-2 bg-rose-50/30 border border-rose-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-rose-500 outline-hidden resize-none min-h-[90px]"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    /* KONDISI JIKA DISETUJUI / STATUS LAINNYA: TAMPILKAN PEMBAGIAN STAF, LOKASI & CATATAN */
                                    <div className="space-y-4">
                                        <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-900 flex items-start gap-2.5">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-bold text-xs">Pengajuan Peminjaman Disetujui</p>
                                                <p className="text-[11px] text-emerald-700 mt-0.5 leading-snug">
                                                    Pilih staf yang bertugas melayani serah terima barang/ruangan dan tentukan lokasi loket pengambilan.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Pembagian Staf yang Bertugas & Lokasi */}
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block font-bold text-slate-700 mb-1">
                                                        Staf yang Bertugas
                                                    </label>
                                                    <select
                                                        value={editStafOption}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setEditStafOption(val);
                                                            if (val === '__custom__') {
                                                                setEditCustomStaf('');
                                                                setEditStafNoHp('');
                                                            } else {
                                                                const found = stafList.find((u) => String(u.id) === val);
                                                                if (found) {
                                                                    setEditCustomStaf('');
                                                                    setEditStafNoHp(found.no_hp || '');
                                                                }
                                                            }
                                                        }}
                                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#006039] outline-hidden"
                                                    >
                                                        {stafList.map((u) => (
                                                            <option key={u.id} value={String(u.id)}>
                                                                {u.name}
                                                            </option>
                                                        ))}
                                                        <option value="__custom__">+ Ketik Nama Staf Lain...</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block font-bold text-slate-700 mb-1">
                                                        Lokasi Pengambilan
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={editLokasi}
                                                        onChange={(e) => setEditLokasi(e.target.value)}
                                                        placeholder="Loket Gudang Biro Sarpras"
                                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-[#006039] outline-hidden"
                                                    />
                                                </div>
                                            </div>

                                            {editStafOption === '__custom__' ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl">
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                                            Nama Staf yang Bertugas <span className="text-rose-500">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={editCustomStaf}
                                                            onChange={(e) => setEditCustomStaf(e.target.value)}
                                                            placeholder="Ketik nama staf..."
                                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:border-[#006039] outline-hidden"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                                            Nomor HP / WhatsApp Staf <span className="text-rose-500">*</span>
                                                        </label>
                                                        <div className="relative">
                                                            <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                                            <input
                                                                type="text"
                                                                required
                                                                value={editStafNoHp}
                                                                onChange={(e) => setEditStafNoHp(e.target.value)}
                                                                placeholder="Contoh: 081234567890"
                                                                className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:border-[#006039] outline-hidden"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                                        Nomor HP / WhatsApp Staf (Terhubung ke Mahasiswa)
                                                    </label>
                                                    <div className="relative">
                                                        <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                                        <input
                                                            type="text"
                                                            value={editStafNoHp}
                                                            onChange={(e) => setEditStafNoHp(e.target.value)}
                                                            placeholder="Contoh: 081234567890"
                                                            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#006039] outline-hidden"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Catatan Admin / Staf (Opsional) */}
                                        <div>
                                            <label className="block font-bold text-slate-700 mb-1">
                                                Catatan Admin / Staf (Opsional)
                                            </label>
                                            <textarea
                                                rows={2}
                                                value={editCatatan}
                                                onChange={(e) => setEditCatatan(e.target.value)}
                                                placeholder="Catatan persetujuan / instruksi pengambilan..."
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] outline-hidden resize-none min-h-[60px]"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setEditModalItem(null)}
                                        className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition cursor-pointer"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isProcessing}
                                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold shadow-xs transition cursor-pointer disabled:opacity-60 text-white ${
                                            editStatus === 'ditolak'
                                                ? 'bg-rose-600 hover:bg-rose-700'
                                                : 'bg-[#006039] hover:bg-[#0f4c3a]'
                                        }`}
                                    >
                                        {editStatus === 'ditolak' ? (
                                            <>
                                                <X className="w-4 h-4" />
                                                <span>{isProcessing ? 'Menolak...' : 'Tolak & Simpan Catatan'}</span>
                                            </>
                                        ) : (
                                            <>
                                                <Check className="w-4 h-4" />
                                                <span>{isProcessing ? 'Menyimpan...' : 'Setujui & Simpan Perubahan'}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {/* MODAL DETAIL TRANSAKSI PEMINJAMAN */}
                {detailModalItem && (
                    <div
                        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
                        onClick={() => setDetailModalItem(null)}
                    >
                        <div
                            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 my-8"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-[#006039] px-5 py-3.5 text-white flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Info className="w-4 h-4 text-emerald-200" />
                                    <h3 className="text-sm font-bold">Detail Peminjaman {detailModalItem.kode}</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setDetailModalItem(null)}
                                    className="p-1 text-white/80 hover:text-white rounded-lg cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-5 space-y-4 text-xs">
                                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                    <div>
                                        <span className="text-[10px] text-slate-400 block">Nama Peminjam</span>
                                        <span className="font-bold text-slate-900 block mt-0.5">
                                            {detailModalItem.peminjam}
                                        </span>
                                        <span className="text-[11px] text-slate-500">
                                            {detailModalItem.unit} • ID: {detailModalItem.nim_nip}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 block">Kontak &amp; Jadwal</span>
                                        <span className="font-bold text-slate-900 block mt-0.5">
                                            WA: {detailModalItem.no_whatsapp}
                                        </span>
                                        <span className="text-[11px] text-slate-500">
                                            {cleanDate(detailModalItem.tanggal_mulai)} s/d{' '}
                                            {cleanDate(detailModalItem.tanggal_kembali_rencana)}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">
                                        Fasilitas yang Dipinjam
                                    </span>
                                    <div className="space-y-1.5">
                                        {getUniqueItems(detailModalItem.items).map((it) => (
                                            <div
                                                key={it.id}
                                                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 bg-white font-bold text-slate-800"
                                            >
                                                <span>{it.nama_barang}</span>
                                                <span className="text-[#006039] bg-emerald-50 px-2 py-0.5 rounded-md text-[11px]">
                                                    {it.qty} {it.satuan}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <span className="text-[10px] text-slate-400 block">Keperluan</span>
                                        <p className="font-medium text-slate-700 mt-0.5">
                                            {detailModalItem.keperluan || '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 block">Staf Bertugas &amp; Lokasi</span>
                                        <p className="font-bold text-slate-800 mt-0.5">
                                            {detailModalItem.petugas_pengambilan || 'Belum ditentukan'}
                                        </p>
                                        {detailModalItem.lokasi_pengambilan && (
                                            <p className="text-[11px] text-slate-500">
                                                {detailModalItem.lokasi_pengambilan}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                    <a
                                        href={detailModalItem.file_ktm}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                                    >
                                        <FileText className="w-3.5 h-3.5" />
                                        <span>Lihat KTM / KTP</span>
                                    </a>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setDetailModalItem(null)}
                                            className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                                        >
                                            Tutup
                                        </button>

                                        {!isStaf && (detailModalItem.status === 'menunggu_validasi' ||
                                            detailModalItem.status === 'ditunda') && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => openRejectModal(detailModalItem)}
                                                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold cursor-pointer"
                                                >
                                                    <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                                    <span>Tolak</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openApproveModal(detailModalItem)}
                                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#006039] hover:bg-[#0f4c3a] text-white font-bold cursor-pointer shadow-xs"
                                                >
                                                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                                    <span>Setujui &amp; Tunjuk Staf</span>
                                                </button>
                                            </>
                                        )}

                                        {detailModalItem.status === 'disetujui' && (
                                            <button
                                                type="button"
                                                onClick={() => openApproveModal(detailModalItem)}
                                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs"
                                            >
                                                <UserCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                                                <span>{isStaf ? 'Siapkan Barang' : 'Tunjuk Staf'}</span>
                                            </button>
                                        )}

                                        {!isStaf && (
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(detailModalItem)}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                                <span>Edit</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL PERSETUJUAN & PENUGASAN STAF */}
                {approveModalItem && (
                    <div
                        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
                        onClick={() => setApproveModalItem(null)}
                    >
                        <form
                            onSubmit={handleApproveAndAssign}
                            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 my-8"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header Modal Persetujuan & Penugasan */}
                            <div className="bg-[#006039] px-5 py-4 text-white flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <UserCheck className="w-5 h-5 text-emerald-200" />
                                    <div>
                                        <h3 className="text-sm font-bold">
                                            {approveModalItem.status === 'disetujui'
                                                ? `Tunjuk Staf Sarpras - ${approveModalItem.kode}`
                                                : `Setujui & Tunjuk Staf - ${approveModalItem.kode}`}
                                        </h3>
                                        <p className="text-[11px] text-emerald-100">
                                            Peminjam: {approveModalItem.peminjam} ({approveModalItem.unit})
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setApproveModalItem(null)}
                                    className="p-1 text-white/80 hover:text-white rounded-lg cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
                                {/* Rincian Peminjaman */}
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                                        <span className="text-slate-500 font-semibold">Jadwal Penggunaan:</span>
                                        <span className="font-bold text-slate-800">
                                            {cleanDate(approveModalItem.tanggal_mulai)} s/d{' '}
                                            {cleanDate(approveModalItem.tanggal_kembali_rencana)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                                            Fasilitas yang Diajukan
                                        </span>
                                        {getUniqueItems(approveModalItem.items).map((it) => (
                                            <div
                                                key={it.id}
                                                className="font-bold text-slate-800 flex items-center justify-between py-0.5"
                                            >
                                                <span>{it.nama_barang}</span>
                                                <span className="text-[#006039] bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                                                    {it.qty} {it.satuan}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    {approveModalItem.keperluan && (
                                        <div className="pt-1 text-[11px] text-slate-600 border-t border-slate-200/60">
                                            <span className="font-semibold text-slate-700">Keperluan:</span>{' '}
                                            {approveModalItem.keperluan}
                                        </div>
                                    )}
                                </div>

                                {/* Penunjukan Staf yang Bertugas */}
                                <div className="space-y-2">
                                    <label className="block font-bold text-slate-700">
                                        Tunjuk Staf Sarpras yang Bertugas <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={approveStafOption}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setApproveStafOption(val);
                                            if (val === '__custom__') {
                                                setApproveCustomStaf('');
                                                setApproveStafNoHp('');
                                            } else {
                                                const found = stafList.find((u) => String(u.id) === val);
                                                if (found) {
                                                    setApproveCustomStaf('');
                                                    setApproveStafNoHp(found.no_hp || '');
                                                }
                                            }
                                        }}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#006039] outline-hidden"
                                    >
                                        {stafList.map((u) => (
                                            <option key={u.id} value={String(u.id)}>
                                                {u.name}
                                            </option>
                                        ))}
                                        <option value="__custom__">+ Ketik Nama Staf Lain...</option>
                                    </select>

                                    {approveStafOption === '__custom__' ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl">
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                                    Nama Staf yang Bertugas <span className="text-rose-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={approveCustomStaf}
                                                    onChange={(e) => setApproveCustomStaf(e.target.value)}
                                                    placeholder="Ketik nama staf..."
                                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:border-[#006039] outline-hidden"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                                    Nomor HP / WhatsApp Staf <span className="text-rose-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                                    <input
                                                        type="text"
                                                        required
                                                        value={approveStafNoHp}
                                                        onChange={(e) => setApproveStafNoHp(e.target.value)}
                                                        placeholder="Contoh: 081234567890"
                                                        className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:border-[#006039] outline-hidden"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                                Nomor HP / WhatsApp Staf (Terhubung ke Mahasiswa)
                                            </label>
                                            <div className="relative">
                                                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                                <input
                                                    type="text"
                                                    value={approveStafNoHp}
                                                    onChange={(e) => setApproveStafNoHp(e.target.value)}
                                                    placeholder="Contoh: 081234567890"
                                                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#006039] outline-hidden"
                                                />
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-1">
                                                Nomor staf ini langsung terintegrasi dan bisa dihubungi peminjam via WhatsApp saat serah terima barang.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Lokasi Serah Terima */}
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">
                                        Lokasi Serah Terima / Pengambilan <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={approveLokasi}
                                        onChange={(e) => setApproveLokasi(e.target.value)}
                                        placeholder="Contoh: Loket Gudang Biro Sarpras Kampus Sukaraja"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-[#006039] outline-hidden"
                                    />
                                </div>

                                {/* Catatan Persetujuan */}
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">
                                        Catatan / Petunjuk Pengambilan (Opsional)
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={approveCatatan}
                                        onChange={(e) => setApproveCatatan(e.target.value)}
                                        placeholder="Tambahkan instruksi khusus untuk peminjam saat mengambil barang..."
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] outline-hidden resize-none"
                                    />
                                </div>

                                {/* Tombol Aksi */}
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-3 border-t border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setApproveModalItem(null)}
                                            className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition cursor-pointer text-center"
                                        >
                                            Batal
                                        </button>
                                        {!isStaf && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const item = approveModalItem;
                                                    setApproveModalItem(null);
                                                    openRejectModal(item);
                                                }}
                                                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs transition cursor-pointer text-center"
                                                title="Tolak pengajuan peminjaman ini"
                                            >
                                                Tolak
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {!isStaf && approveModalItem.status !== 'disetujui' && (
                                            <button
                                                type="button"
                                                disabled={isProcessing}
                                                onClick={handleApproveOnly}
                                                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer disabled:opacity-60 text-center"
                                                title="Setujui permohonan terlebih dahulu, staf bisa ditunjuk nanti"
                                            >
                                                Setujui Saja
                                            </button>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={isProcessing}
                                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#006039] hover:bg-[#0f4c3a] text-white rounded-xl font-bold text-xs shadow-xs transition cursor-pointer disabled:opacity-60"
                                        >
                                            <Check className="w-4 h-4 stroke-[2.5]" />
                                            <span>
                                                {isProcessing
                                                    ? 'Memproses...'
                                                    : approveModalItem.status === 'disetujui'
                                                      ? isStaf
                                                          ? 'Siapkan & Konfirmasi Loket'
                                                          : 'Tugaskan Staf'
                                                      : 'Setujui & Tugaskan Staf'}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {/* MODAL TOLAK PENGAJUAN */}
                {rejectModalItem && (
                    <div
                        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
                        onClick={() => setRejectModalItem(null)}
                    >
                        <form
                            onSubmit={handleReject}
                            className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 my-8"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header Modal Tolak */}
                            <div className="bg-rose-600 px-5 py-4 text-white flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <XCircle className="w-5 h-5 text-rose-200" />
                                    <div>
                                        <h3 className="text-sm font-bold">
                                            Tolak Pengajuan - {rejectModalItem.kode}
                                        </h3>
                                        <p className="text-[11px] text-rose-100">
                                            Peminjam: {rejectModalItem.peminjam}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setRejectModalItem(null)}
                                    className="p-1 text-white/80 hover:text-white rounded-lg cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-5 space-y-4 text-xs">
                                <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200/60 space-y-1">
                                    <p className="text-rose-800 font-semibold">
                                        Apakah Anda yakin ingin menolak pengajuan peminjaman fasilitas ini?
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                        Peminjam akan menerima pemberitahuan beserta alasan penolakan yang Anda cantumkan di bawah ini.
                                    </p>
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">
                                        Alasan Penolakan <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        required
                                        rows={3}
                                        value={rejectAlasan}
                                        onChange={(e) => setRejectAlasan(e.target.value)}
                                        placeholder="Contoh: Jadwal bertabrakan dengan agenda resmi universitas / Fasilitas sedang dalam pemeliharaan berkala..."
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-rose-500 outline-hidden resize-none"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setRejectModalItem(null)}
                                        className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition cursor-pointer"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isProcessing}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs transition cursor-pointer disabled:opacity-60"
                                    >
                                        <X className="w-4 h-4" />
                                        <span>{isProcessing ? 'Menolak...' : 'Tolak Pengajuan'}</span>
                                    </button>
                                </div>
                            </div>
                        </form>
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
            </div>
        </AdminLayout>
    );
}
