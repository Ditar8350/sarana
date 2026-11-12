import React, { useState } from "react";
import { Head, useForm, router, usePage } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import DeleteConfirmModal from "@/Components/Admin/DeleteConfirmModal";
import { PageProps, UserRole } from "@/types";
import {
    Users,
    User,
    Plus,
    UserPlus,
    Pencil,
    Trash2,
    X,
    CheckCircle2,
    AlertCircle,
    Search,
    Eye,
    EyeOff,
    Shield,
    GraduationCap,
    Briefcase,
    Building2,
    ShieldAlert,
    Check,
    Phone,
    RotateCcw,
} from "lucide-react";

interface RuanganItem {
    id: number;
    nama: string;
    lokasi: string;
}

interface PenggunaItem {
    id: number;
    name: string;
    email: string;
    no_hp?: string | null;
    role: UserRole;
    role_label: string;
    nomor_induk: string | null;
    ruangan_id?: number | null;
    unit_ruangan?: string | null;
    assigned_rooms?: string[];
    created_at: string | null;
}

interface RoleOption {
    value: UserRole;
    label: string;
}

interface PenggunaProps {
    users: PenggunaItem[];
    roles: RoleOption[];
    ruanganList?: RuanganItem[];
}

type PenggunaForm = {
    name: string;
    email: string;
    no_hp: string;
    role: UserRole;
    nomor_induk: string;
    ruangan_id: number | null;
    unit_ruangan: string;
    password: string;
    password_confirmation: string;
};

export default function Pengguna({ users = [], roles = [], ruanganList = [] }: PenggunaProps) {
    const { flash, auth } = usePage<
        PageProps<{ flash: { success?: string; error?: string } }>
    >().props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<PenggunaItem | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("semua");
    const [showPassword, setShowPassword] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<PenggunaItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [customRoomInput, setCustomRoomInput] = useState("");

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm<PenggunaForm>({
            name: "",
            email: "",
            no_hp: "",
            role: "mahasiswa",
            nomor_induk: "",
            ruangan_id: null,
            unit_ruangan: "",
            password: "",
            password_confirmation: "",
        });

    const handleOpenCreateModal = () => {
        clearErrors();
        reset();
        setEditingItem(null);
        setShowPassword(false);
        setCustomRoomInput("");
        setIsModalOpen(true);
    };

    const handleEdit = (item: PenggunaItem) => {
        clearErrors();
        setEditingItem(item);
        setCustomRoomInput("");
        setData({
            name: item.name,
            email: item.email,
            no_hp: item.no_hp ?? "",
            role: item.role,
            nomor_induk: item.nomor_induk ?? "",
            ruangan_id: item.ruangan_id ?? null,
            unit_ruangan: item.unit_ruangan ?? "",
            password: "",
            password_confirmation: "",
        });
        setShowPassword(false);
        setIsModalOpen(true);
    };

    const selectedRoomsList = data.unit_ruangan
        ? data.unit_ruangan
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
        : [];

    const updateSelectedRooms = (rooms: string[]) => {
        const uniqueRooms = Array.from(new Set(rooms.map((r) => r.trim()).filter(Boolean)));
        const firstMatchedCatalog = ruanganList.find(
            (r) => r.id > 0 && uniqueRooms.some((u) => u.toLowerCase() === r.nama.toLowerCase()),
        );
        setData((prev) => ({
            ...prev,
            ruangan_id: firstMatchedCatalog ? firstMatchedCatalog.id : null,
            unit_ruangan: uniqueRooms.join(", "),
        }));
    };

    const handleToggleRoom = (roomName: string) => {
        const exists = selectedRoomsList.some((r) => r.toLowerCase() === roomName.toLowerCase());
        if (exists) {
            updateSelectedRooms(selectedRoomsList.filter((r) => r.toLowerCase() !== roomName.toLowerCase()));
        } else {
            updateSelectedRooms([...selectedRoomsList, roomName]);
        }
    };

    const handleAddCustomRoom = () => {
        const trimmed = customRoomInput.trim();
        if (!trimmed) return;
        const parts = trimmed
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        updateSelectedRooms([...selectedRoomsList, ...parts]);
        setCustomRoomInput("");
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        clearErrors();
        reset();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if ((data.role === "kepala_bagian" || data.role === "staf_ruangan") && !data.unit_ruangan.trim()) {
            alert("Harap pilih minimal satu ruangan yang dikelola untuk PIC Ruangan.");
            return;
        }
        if (editingItem) {
            put(`/admin/pengguna/${editingItem.id}`, {
                preserveScroll: true,
                onSuccess: () => handleCloseModal(),
            });
        } else {
            post("/admin/pengguna", {
                preserveScroll: true,
                onSuccess: () => handleCloseModal(),
            });
        }
    };

    const handleConfirmDelete = () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete(`/admin/pengguna/${deleteTarget.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    const keyword = searchQuery.toLowerCase().trim();

    // Identifikasi tipe pengguna umum vs mahasiswa
    const isUmum = (u: PenggunaItem) => u.role === "umum" || (u.role === "mahasiswa" && !u.nomor_induk);
    const isMahasiswa = (u: PenggunaItem) => u.role === "mahasiswa" && Boolean(u.nomor_induk);

    const countAdmin = users.filter((u) => u.role === "admin").length;
    const countPicRuangan = users.filter((u) => u.role === "kepala_bagian" || u.role === "staf_ruangan").length;
    const countStaf = users.filter((u) => u.role === "staf").length;
    const countMahasiswa = users.filter(isMahasiswa).length;
    const countUmum = users.filter(isUmum).length;

    const filteredUsers = users.filter((item) => {
        // Filter Peran
        if (roleFilter !== "semua") {
            if (roleFilter === "umum") {
                if (!isUmum(item)) return false;
            } else if (roleFilter === "mahasiswa") {
                if (!isMahasiswa(item)) return false;
            } else if (roleFilter === "pic_ruangan" || roleFilter === "kepala_bagian" || roleFilter === "staf_ruangan") {
                if (item.role !== "kepala_bagian" && item.role !== "staf_ruangan") return false;
            } else if (roleFilter === "staf") {
                if (item.role !== "staf") return false;
            } else if (item.role !== roleFilter) {
                return false;
            }
        }

        // Filter Kata Kunci
        if (!keyword) return true;
        return (
            item.name.toLowerCase().includes(keyword) ||
            item.email.toLowerCase().includes(keyword) ||
            (item.nomor_induk ?? "").toLowerCase().includes(keyword) ||
            (item.unit_ruangan ?? "").toLowerCase().includes(keyword)
        );
    });

    const isPegawai = ["staf", "kepala_bagian", "staf_ruangan", "admin"].includes(data.role);

    const nomorIndukLabel = isPegawai
        ? "NIP.Y"
        : data.role === "mahasiswa"
        ? "NIM (Nomor Induk Mahasiswa)"
        : "NIK / No. Identitas";

    const nomorIndukPlaceholder = isPegawai
        ? "Nomor NIP.Y (contoh: STF-2026-001)..."
        : data.role === "mahasiswa"
        ? "Nomor Induk Mahasiswa (contoh: 2355202065)..."
        : "Nomor identitas unik...";

    // Tampilkan NIP.Y atau NIM riil pada tabel pengguna
    const formatIdentitas = (item: PenggunaItem) => {
        if (!item.nomor_induk) return <span className="text-slate-400 font-medium">—</span>;
        return <span className="font-mono text-slate-800 font-bold text-xs">{item.nomor_induk}</span>;
    };

    // Tampilan penugasan ruangan yang rapi
    const renderRoomAssignment = (item: PenggunaItem) => {
        const rooms =
            item.assigned_rooms && item.assigned_rooms.length > 0
                ? item.assigned_rooms
                : item.unit_ruangan
                ? item.unit_ruangan.split(",").map((s) => s.trim()).filter(Boolean)
                : [];

        if (rooms.length === 0 || (item.role !== "kepala_bagian" && item.role !== "staf_ruangan")) {
            return <span className="text-slate-400 font-medium">—</span>;
        }

        if (rooms.length === 1) {
            return (
                <span className="text-slate-800 font-medium text-xs truncate max-w-[200px] inline-block" title={rooms[0]}>
                    {rooms[0]}
                </span>
            );
        }

        return (
            <div className="flex items-center gap-1.5" title={rooms.join(", ")}>
                <span className="text-slate-800 font-medium text-xs truncate max-w-[150px]">
                    {rooms[0]}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#d1fae5] text-[#065f46] text-[10px] font-bold border border-[#a7f3d0]/80 shrink-0">
                    +{rooms.length - 1} lainnya
                </span>
            </div>
        );
    };

    // Tampilan peran pengguna dalam bentuk badge pill
    const renderRoleBadge = (item: PenggunaItem) => {
        if (isUmum(item)) {
            return (
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#f1f5f9] text-[#334155] border border-[#e2e8f0] inline-block">
                    Masyarakat Umum
                </span>
            );
        }

        switch (item.role) {
            case "admin":
                return (
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#fef3c7] text-[#92400e] border border-[#fde68a] inline-block">
                        Admin
                    </span>
                );
            case "kepala_bagian":
            case "staf_ruangan":
                return (
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#dbeafe] text-[#1e40af] border border-[#bfdbfe] inline-block">
                        PIC Ruangan
                    </span>
                );
            case "staf":
                return (
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#d1fae5] text-[#065f46] border border-[#a7f3d0] inline-block">
                        Staf Sarpras
                    </span>
                );
            case "mahasiswa":
                return (
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd] inline-block">
                        Mahasiswa
                    </span>
                );
            default:
                return (
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 inline-block">
                        {item.role_label}
                    </span>
                );
        }
    };

    const roleCards = [
        { key: "semua", label: "SEMUA", count: users.length },
        { key: "admin", label: "ADMIN", count: countAdmin },
        { key: "pic_ruangan", label: "PIC RUANGAN", count: countPicRuangan },
        { key: "staf", label: "STAF SARPRAS", count: countStaf },
        { key: "mahasiswa", label: "MAHASISWA", count: countMahasiswa },
        { key: "umum", label: "UMUM", count: countUmum },
    ];

    return (
        <AdminLayout>
            <Head title="Manajemen Pengguna - Biro Sarpras UNUHA" />

            <div className="max-w-7xl mx-auto pb-16 font-sans text-slate-800 text-xs px-2 sm:px-4 space-y-6 sm:space-y-7">
                {/* Header Banner Gradien Hijau UNUHA */}
                <div className="relative rounded-3xl bg-gradient-to-r from-[#006039] via-[#094c34] to-[#004225] p-5 sm:p-6 lg:p-7 text-white shadow-md border border-emerald-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5">
                    {/* Lingkaran dekoratif latar belakang halus terisolasi */}
                    <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                        <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/5" />
                        <div className="absolute right-36 -bottom-14 w-36 h-36 rounded-full bg-emerald-400/10" />
                    </div>

                    {/* Kiri: Ikon + Judul + Subtitle */}
                    <div className="relative z-10 flex items-center gap-3.5 sm:gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
                            <Users className="w-6 h-6 text-amber-300" strokeWidth={2.2} />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                                    Manajemen Pengguna
                                </h1>
                                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-bold text-emerald-200 border border-white/15">
                                    Otorisasi
                                </span>
                            </div>
                            <p className="text-xs text-emerald-100/90 mt-0.5 font-normal truncate max-w-sm sm:max-w-md lg:max-w-xl">
                                Kelola akun pengguna, hak akses peran, dan penugasan ruangan sarpras kampus.
                            </p>
                        </div>
                    </div>

                    {/* Kanan: Search Bar + Tombol Tambah Pengguna */}
                    <div className="relative z-10 flex items-center gap-2.5 sm:gap-3 shrink-0 flex-wrap sm:flex-nowrap w-full md:w-auto">
                        {/* Search Bar */}
                        <div className="relative w-full sm:w-52 md:w-56 lg:w-60">
                            <Search className="absolute inset-y-0 left-3 my-auto w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari nama atau email..."
                                className="w-full pl-9 pr-7 h-10 bg-white text-slate-800 placeholder-slate-400 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-amber-400 font-medium shadow-xs transition"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="absolute inset-y-0 right-2.5 my-auto text-slate-400 hover:text-slate-600 cursor-pointer"
                                    title="Hapus pencarian"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Tombol Tambah Pengguna */}
                        <button
                            type="button"
                            onClick={handleOpenCreateModal}
                            className="h-10 px-4 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4 stroke-[2.5]" />
                            <span>Tambah Pengguna</span>
                        </button>
                    </div>
                </div>

                {/* Alert Notifikasi */}
                {flash?.success && (
                    <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#006039] text-xs font-semibold shadow-2xs">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-[#006039]" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash?.error && (
                    <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold shadow-2xs">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>{flash.error}</span>
                    </div>
                )}

                {/* 6 Kartu Filter Peran - Sejajar 6 Kolom di Desktop dengan Tinggi Seragam */}
                <div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
                        {roleCards.map((card) => {
                            const isActive = roleFilter === card.key;
                            return (
                                <button
                                    key={card.key}
                                    type="button"
                                    onClick={() => setRoleFilter(card.key)}
                                    className={`h-[84px] sm:h-[88px] rounded-2xl p-3 sm:p-3.5 border text-left transition-all duration-200 cursor-pointer shadow-2xs flex flex-col justify-between ${
                                        isActive
                                            ? "bg-[#006039] text-white border-[#006039] shadow-md ring-2 ring-[#006039]/25 -translate-y-0.5"
                                            : "bg-white hover:bg-slate-50/90 text-slate-900 border-slate-200/90 hover:-translate-y-0.5"
                                    }`}
                                >
                                    <p
                                        className={`text-[10px] font-extrabold uppercase tracking-wider truncate block leading-tight ${
                                            isActive ? "text-emerald-100" : "text-slate-400"
                                        }`}
                                    >
                                        {card.label}
                                    </p>
                                    <div className="flex items-baseline gap-1.5 mt-auto">
                                        <span
                                            className={`text-2xl sm:text-3xl font-black tracking-tight leading-none ${
                                                isActive ? "text-white" : "text-slate-900"
                                            }`}
                                        >
                                            {card.count}
                                        </span>
                                        <span
                                            className={`text-[10px] sm:text-[11px] font-normal ${
                                                isActive ? "text-emerald-100/80" : "text-slate-400"
                                            }`}
                                        >
                                            pengguna
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Kontainer Tabel Utama dengan Jarak Lega */}
                <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden mt-6 sm:mt-8">
                    {/* Header Tabel dengan Spasi Lega antara Tulisan & Kotak Angka */}
                    <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-50/40 via-white to-slate-50/20">
                        <div className="flex items-center gap-3.5">
                            <div className="w-3 h-3 rounded-full bg-[#006039] ring-4 ring-emerald-100/90 shrink-0" />
                            <div className="flex items-center gap-3">
                                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                                    Seluruh Pengguna
                                </h2>
                                <span className="inline-flex items-center justify-center px-3.5 py-1 rounded-full bg-emerald-50 text-[#006039] text-xs sm:text-sm font-black border border-emerald-200 shadow-2xs shrink-0">
                                    {filteredUsers.length}
                                </span>
                            </div>
                        </div>

                        {(roleFilter !== "semua" || searchQuery) && (
                            <button
                                type="button"
                                onClick={() => {
                                    setRoleFilter("semua");
                                    setSearchQuery("");
                                }}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#006039] bg-emerald-50/90 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition cursor-pointer self-start sm:self-auto shadow-2xs"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Reset Filter</span>
                            </button>
                        )}
                    </div>

                    {/* Tabel Pengguna */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse min-w-[680px]">
                            <thead className="bg-slate-50/80 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                                <tr>
                                    <th className="py-3 px-4 sm:px-5">PENGGUNA</th>
                                    <th className="py-3 px-3 sm:px-4">PERAN</th>
                                    <th className="py-3 px-3 sm:px-4">PENUGASAN RUANGAN</th>
                                    <th className="py-3 px-3 sm:px-4">NIP.Y / NIM</th>
                                    <th className="py-3 px-3 sm:px-4">TERDAFTAR</th>
                                    <th className="py-3 px-4 sm:px-5 text-center w-24">AKSI</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredUsers.map((item) => {
                                    const isSelf = item.id === auth.user.id;

                                    return (
                                        <tr
                                            key={item.id}
                                            className="hover:bg-slate-50/70 transition"
                                        >
                                            {/* Kolom 1: PENGGUNA */}
                                            <td className="py-3.5 px-4 sm:px-5">
                                                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                                    <span>{item.name}</span>
                                                    {isSelf && (
                                                        <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold border border-amber-200/80">
                                                            Anda
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                                                    {item.email}
                                                </p>
                                            </td>

                                            {/* Kolom 2: PERAN */}
                                            <td className="py-3.5 px-3 sm:px-4 whitespace-nowrap">
                                                {renderRoleBadge(item)}
                                            </td>

                                            {/* Kolom 3: PENUGASAN RUANGAN */}
                                            <td className="py-3.5 px-3 sm:px-4 whitespace-nowrap">
                                                {renderRoomAssignment(item)}
                                            </td>

                                            {/* Kolom 4: NIP.Y / NIM */}
                                            <td className="py-3.5 px-3 sm:px-4 whitespace-nowrap">
                                                {formatIdentitas(item)}
                                            </td>

                                            {/* Kolom 5: TERDAFTAR */}
                                            <td className="py-3.5 px-3 sm:px-4 whitespace-nowrap">
                                                <span className="text-slate-600 font-medium text-xs">
                                                    {item.created_at || "—"}
                                                </span>
                                            </td>

                                            {/* Kolom 6: AKSI */}
                                            <td className="py-3.5 px-4 sm:px-5 text-center whitespace-nowrap w-24">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEdit(item)}
                                                        className="w-8 h-8 rounded-xl border border-slate-200/90 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-emerald-700 flex items-center justify-center transition cursor-pointer shadow-2xs"
                                                        title="Edit Pengguna"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    {!isSelf && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeleteTarget(item)}
                                                            className="w-8 h-8 rounded-xl border border-slate-200/90 bg-white hover:bg-rose-50 hover:border-rose-300 text-rose-500 hover:text-rose-700 flex items-center justify-center transition cursor-pointer shadow-2xs"
                                                            title="Hapus Pengguna"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                                            <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                                            <p className="font-semibold text-slate-600">Tidak ada pengguna ditemukan</p>
                                            <p className="text-slate-400 mt-0.5">Coba gunakan kata kunci pencarian atau filter peran yang lain.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* MODAL INPUT / EDIT PENGGUNA */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
                    onClick={handleCloseModal}
                >
                    <div
                        className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header Modal (Tetap di Atas) */}
                        <div className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
                            <div>
                                <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                                    {editingItem ? (
                                        <>
                                            <Pencil className="w-4 h-4 text-[#006039]" />
                                            <span>Edit Data Pengguna</span>
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4 text-[#006039]" />
                                            <span>Tambah Pengguna Baru</span>
                                        </>
                                    )}
                                </h2>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    {editingItem ? `Memperbarui akun ${editingItem.name}` : "Tentukan hak akses, identitas, dan kredensial pengguna baru."}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 text-xs">
                            {/* Body Form (Scrollable secara rapi jika konten panjang) */}
                            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5">
                                {/* Pilihan Peran / Hak Akses (Selalu terlihat paling atas) */}
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">
                                        Peran / Hak Akses <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={data.role}
                                        onChange={(e) => setData("role", e.target.value as UserRole)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-[#006039] outline-hidden cursor-pointer"
                                        required
                                    >
                                        {roles.map((role) => (
                                            <option key={role.value} value={role.value}>
                                                {role.label}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.role && <p className="text-rose-600 text-[11px] mt-1">{errors.role}</p>}
                                </div>

                                {/* Penentuan Ruangan Khusus PIC Ruangan (Ringkas & Tidak Sesak) */}
                                {(data.role === 'staf_ruangan' || data.role === 'kepala_bagian') && (
                                    <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1.5">
                                                <Building2 className="w-3.5 h-3.5 text-[#006039]" />
                                                <h3 className="font-extrabold text-[11px] text-emerald-950">
                                                    Penugasan Unit / Ruangan (PIC Ruangan) <span className="text-rose-500">*</span>
                                                </h3>
                                            </div>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#006039] text-white">
                                                {selectedRoomsList.length} Dipilih
                                            </span>
                                        </div>

                                        {/* Chips Ruangan Terpilih */}
                                        {selectedRoomsList.length > 0 && (
                                            <div className="flex flex-wrap items-center gap-1.5 pb-0.5">
                                                {selectedRoomsList.map((room, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#006039] text-white text-[10px] font-bold shadow-2xs"
                                                    >
                                                        <span className="truncate max-w-[190px]">{room}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleRoom(room)}
                                                            className="hover:bg-white/20 rounded-full p-0.5 transition cursor-pointer"
                                                            title="Hapus ruangan ini"
                                                        >
                                                            <X className="w-2.5 h-2.5" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Daftar Pilihan Ruangan (Ringkas) */}
                                        {ruanganList.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-white border border-emerald-200/80 rounded-lg">
                                                {ruanganList.map((r) => {
                                                    const isSelected = selectedRoomsList.some(
                                                        (s) => s.toLowerCase() === r.nama.toLowerCase()
                                                    );
                                                    return (
                                                        <button
                                                            key={r.id}
                                                            type="button"
                                                            onClick={() => handleToggleRoom(r.nama)}
                                                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer border ${
                                                                isSelected
                                                                    ? 'bg-emerald-50 text-[#006039] border-[#006039]'
                                                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                                            }`}
                                                        >
                                                            <span
                                                                className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] ${
                                                                    isSelected
                                                                        ? 'bg-[#006039] text-white'
                                                                        : 'bg-white border border-slate-300 text-slate-400'
                                                                }`}
                                                            >
                                                                {isSelected ? '✓' : '+'}
                                                            </span>
                                                            <span className="truncate max-w-[175px]">{r.nama}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Input Tambah Ruangan Baru Secara Ringkas */}
                                        <div className="flex gap-1.5">
                                            <input
                                                type="text"
                                                value={customRoomInput}
                                                onChange={(e) => setCustomRoomInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault();
                                                        handleAddCustomRoom();
                                                    }
                                                }}
                                                placeholder="Tambah ruangan lain (ketik lalu klik + Tambah)..."
                                                className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] focus:border-[#006039] outline-hidden font-medium"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleAddCustomRoom}
                                                className="px-2.5 py-1.5 bg-[#006039] hover:bg-[#0f4c3a] text-white rounded-lg text-[11px] font-bold transition cursor-pointer shrink-0 flex items-center gap-1"
                                            >
                                                <Plus className="w-3 h-3" />
                                                <span>Tambah</span>
                                            </button>
                                        </div>

                                        {errors.unit_ruangan && (
                                            <p className="text-rose-600 text-[10px] font-semibold">
                                                {errors.unit_ruangan}
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">
                                            Nama Lengkap <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData("name", e.target.value)}
                                            placeholder="Contoh: Muhammad Ihsan, S.T."
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] outline-hidden font-medium"
                                            required
                                        />
                                        {errors.name && <p className="text-rose-600 text-[11px] mt-1">{errors.name}</p>}
                                    </div>

                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">
                                            {nomorIndukLabel} <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.nomor_induk}
                                            onChange={(e) => setData("nomor_induk", e.target.value)}
                                            placeholder={nomorIndukPlaceholder}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] outline-hidden font-mono"
                                            required
                                        />
                                        {errors.nomor_induk && (
                                            <p className="text-rose-600 text-[11px] mt-1">{errors.nomor_induk}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">
                                            Alamat Email <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData("email", e.target.value)}
                                            placeholder="user@unuha.ac.id"
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] outline-hidden"
                                            required
                                        />
                                        {errors.email && <p className="text-rose-600 text-[11px] mt-1">{errors.email}</p>}
                                    </div>

                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">
                                            Nomor HP / WhatsApp <span className="text-rose-500">*</span>
                                            {data.role === 'staf' && (
                                                <span className="text-emerald-700 text-[10px] font-semibold ml-1">(Pendamping)</span>
                                            )}
                                        </label>
                                        <div className="relative">
                                            <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                value={data.no_hp}
                                                onChange={(e) => setData("no_hp", e.target.value)}
                                                placeholder="Contoh: 081234567890"
                                                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] outline-hidden font-medium"
                                                required
                                            />
                                        </div>
                                        {errors.no_hp && <p className="text-rose-600 text-[11px] mt-1">{errors.no_hp}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">
                                            Kata Sandi {!editingItem ? <span className="text-rose-500">*</span> : <span className="text-slate-400 font-normal">(Opsional)</span>}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={data.password}
                                                onChange={(e) => setData("password", e.target.value)}
                                                placeholder={editingItem ? "Tetap sandi lama" : "Minimal 8 karakter"}
                                                className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] outline-hidden"
                                                required={!editingItem}
                                                autoComplete="new-password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-2.5 my-auto text-slate-400 hover:text-slate-600 cursor-pointer"
                                                aria-label="Tampilkan sandi"
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="w-3.5 h-3.5" />
                                                ) : (
                                                    <Eye className="w-3.5 h-3.5" />
                                                )}
                                            </button>
                                        </div>
                                        {errors.password && (
                                            <p className="text-rose-600 text-[11px] mt-1">{errors.password}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">
                                            Ulangi Kata Sandi {!editingItem ? <span className="text-rose-500">*</span> : <span className="text-slate-400 font-normal">(Opsional)</span>}
                                        </label>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={data.password_confirmation}
                                            onChange={(e) => setData("password_confirmation", e.target.value)}
                                            placeholder={editingItem ? "Tetap sandi lama" : "Konfirmasi sandi"}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006039] outline-hidden"
                                            required={!editingItem || data.password !== ""}
                                            autoComplete="new-password"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Footer Modal (Tetap di Bawah) */}
                            <div className="shrink-0 px-5 py-3.5 flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 border border-slate-200 bg-white text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition cursor-pointer text-xs"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2 rounded-xl bg-[#006039] hover:bg-[#0f4c3a] text-white font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 text-xs"
                                >
                                    <Check className="w-4 h-4" />
                                    <span>
                                        {processing
                                            ? "Menyimpan..."
                                            : editingItem
                                            ? "Perbarui Akun"
                                            : "Buat Akun Pengguna"}
                                    </span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Hapus */}
            <DeleteConfirmModal
                show={deleteTarget !== null}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleConfirmDelete}
                title="Hapus Akun Pengguna"
                message="Akun ini akan dihapus secara permanen dan tidak dapat masuk ke sistem lagi. "
                itemName={deleteTarget?.name}
                processing={isDeleting}
            />
        </AdminLayout>
    );
}
