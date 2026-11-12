import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { PageProps } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { User, ShieldCheck, KeyRound, Mail, Phone, GraduationCap, IdCard } from 'lucide-react';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({
    mustVerifyEmail,
    status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    const { auth } = usePage<PageProps>().props;
    const user = auth?.user;
    const role = user?.role as string | undefined;
    const isMahasiswa = role === 'mahasiswa';
    const roleLabel =
        role === 'admin'
            ? 'Admin Sarpras'
            : role === 'staf'
              ? 'Staf Sarpras'
              : role === 'kepala_bagian'
                ? 'PIC Ruangan'
                : role === 'staf_ruangan'
                  ? 'PIC Ruangan'
                  : role === 'umum'
                    ? 'Umum'
                    : 'Mahasiswa';

    const biodataChecklist = isMahasiswa
        ? [
              { label: 'NIM', done: !!user?.nomor_induk },
              { label: 'No. HP', done: !!user?.no_hp },
              { label: 'Fakultas', done: !!user?.fakultas },
              { label: 'Program Studi', done: !!user?.prodi },
          ]
        : [];
    const completedCount = biodataChecklist.filter((item) => item.done).length;
    const completionPercent = biodataChecklist.length
        ? Math.round((completedCount / biodataChecklist.length) * 100)
        : 100;

    const infoChips = [
        user?.nomor_induk && {
            icon: <IdCard className="w-3.5 h-3.5" />,
            text: `${isMahasiswa ? 'NIM' : 'NIP.Y'} ${user.nomor_induk}`,
        },
        user?.no_hp && { icon: <Phone className="w-3.5 h-3.5" />, text: user.no_hp },
        isMahasiswa && user?.prodi && { icon: <GraduationCap className="w-3.5 h-3.5" />, text: user.prodi },
        !isMahasiswa && user?.unit_ruangan && { icon: <GraduationCap className="w-3.5 h-3.5" />, text: user.unit_ruangan },
    ].filter(Boolean) as { icon: React.ReactNode; text: string }[];

    return (
        <AdminLayout>
            <Head title="Profil & Pengaturan Akun - Biro Sarpras UNUHA" />

            <div className="max-w-6xl mx-auto space-y-5 pb-16 font-sans text-slate-800">
                {/* Header Profil */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#006039] to-[#004225] text-white p-5 sm:p-6 shadow-xs">
                    <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/5" />
                    <div className="absolute right-16 -bottom-12 w-32 h-32 rounded-full bg-[#FCB900]/10" />

                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white text-[#006039] font-extrabold text-2xl flex items-center justify-center shrink-0 shadow-sm">
                                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="min-w-0 space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate">
                                        {user?.name || 'Profil Pengguna'}
                                    </h1>
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-[#FCB900] text-[#004225] px-2 py-0.5 rounded-full shrink-0">
                                        <ShieldCheck className="w-3 h-3" />
                                        {roleLabel}
                                    </span>
                                </div>
                                <p className="text-emerald-100/90 text-xs flex items-center gap-1.5 truncate">
                                    <Mail className="w-3.5 h-3.5 shrink-0" />
                                    {user?.email}
                                </p>
                                {infoChips.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                                        {infoChips.map((chip, i) => (
                                            <span
                                                key={i}
                                                className="inline-flex items-center gap-1 text-[11px] font-medium bg-white/10 border border-white/15 text-emerald-50 px-2 py-0.5 rounded-lg"
                                            >
                                                {chip.icon}
                                                {chip.text}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {isMahasiswa && (
                            <div className="w-full md:w-56 shrink-0 rounded-xl bg-white/10 border border-white/15 p-3.5">
                                <div className="flex items-center justify-between text-xs mb-2">
                                    <span className="font-semibold text-emerald-50">Kelengkapan Biodata</span>
                                    <span className="font-bold text-[#FCB900]">{completionPercent}%</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-white/15 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-[#FCB900] transition-all"
                                        style={{ width: `${completionPercent}%` }}
                                    />
                                </div>
                                <p className="mt-2 text-[11px] text-emerald-100/80">
                                    {completionPercent === 100
                                        ? 'Biodata lengkap, siap untuk peminjaman.'
                                        : `Belum diisi: ${biodataChecklist
                                              .filter((item) => !item.done)
                                              .map((item) => item.label)
                                              .join(', ')}`}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Konten */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
                    <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                        <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-slate-100">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#006039] flex items-center justify-center">
                                <User className="w-4 h-4" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-slate-900">
                                    {isMahasiswa ? 'Profil & Biodata' : 'Informasi Profil'}
                                </h2>
                                <p className="text-[11px] text-slate-500">Perbarui data diri Anda.</p>
                            </div>
                        </div>
                        <div className="p-5 sm:p-6">
                            <UpdateProfileInformationForm mustVerifyEmail={mustVerifyEmail} status={status} />
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-2xs lg:sticky lg:top-20">
                        <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-slate-100">
                            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                <KeyRound className="w-4 h-4" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-slate-900">Keamanan Akun</h2>
                                <p className="text-[11px] text-slate-500">Ganti kata sandi secara berkala.</p>
                            </div>
                        </div>
                        <div className="p-5 sm:p-6">
                            <UpdatePasswordForm />
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
