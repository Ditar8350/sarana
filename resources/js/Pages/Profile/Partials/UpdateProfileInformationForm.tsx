import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, ReactNode, useMemo, useState } from 'react';
import {
    User as UserIcon,
    Mail,
    IdCard,
    Phone,
    GraduationCap,
    BookOpen,
    CheckCircle2,
    ChevronDown,
    Save,
    Info,
} from 'lucide-react';

export const FAKULTAS_PRODI_UNUHA: {
    fakultas: string;
    kode: string;
    prodiList: string[];
}[] = [
    {
        fakultas: 'Fakultas Sains dan Teknologi (FST)',
        kode: 'FST',
        prodiList: ['S1 Informatika', 'S1 Matematika', 'S1 Sains Pertanian', 'S1 Peternakan'],
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
        prodiList: ['S2 Pendidikan Agama Islam'],
    },
];

const inputClass =
    'w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50/70 text-[13px] text-slate-800 placeholder:text-slate-400 outline-hidden transition focus:bg-white focus:border-[#006039] focus:ring-2 focus:ring-emerald-100';

const selectClass =
    'w-full h-10 pl-9 pr-9 rounded-xl border border-slate-200 bg-slate-50/70 text-[13px] text-slate-800 outline-hidden transition appearance-none cursor-pointer truncate focus:bg-white focus:border-[#006039] focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400';

function Field({
    label,
    htmlFor,
    icon,
    error,
    hint,
    required = false,
    children,
}: {
    label: string;
    htmlFor: string;
    icon: ReactNode;
    error?: string | null;
    hint?: string;
    required?: boolean;
    children: ReactNode;
}) {
    return (
        <div>
            <label htmlFor={htmlFor} className="block text-xs font-semibold text-slate-700 mb-1.5">
                {label} {required && <span className="text-rose-500 font-extrabold">*</span>}
            </label>
            <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {icon}
                </span>
                {children}
            </div>
            {error ? (
                <p className="mt-1.5 text-[11px] font-medium text-rose-600">{error}</p>
            ) : (
                hint && <p className="mt-1.5 text-[11px] text-slate-400">{hint}</p>
            )}
        </div>
    );
}

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}: {
    mustVerifyEmail: boolean;
    status?: string;
    className?: string;
}) {
    const user = usePage().props.auth.user as any;
    const role = (user?.role as string) || '';
    const isMahasiswa = role === 'mahasiswa';
    const isUmum = role === 'umum';
    const nomorIndukLabel = isMahasiswa ? 'NIM' : isUmum ? 'NIK / No. KTP' : 'NIP.Y';
    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user?.name || '',
        email: user?.email || '',
        nomor_induk: user?.nomor_induk || '',
        no_hp: user?.no_hp || '',
        fakultas: user?.fakultas || '',
        prodi: user?.prodi || '',
    });

    const activeProdiOptions = useMemo(() => {
        const found = FAKULTAS_PRODI_UNUHA.find((item) => item.fakultas === data.fakultas);
        return found ? found.prodiList : [];
    }, [data.fakultas]);

    const handleFakultasChange = (fakultasValue: string) => {
        setClientErrors((prev) => {
            const next = { ...prev };
            delete next.fakultas;
            delete next.prodi;
            return next;
        });
        setData((prev) => ({ ...prev, fakultas: fakultasValue, prodi: '' }));
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const newClientErrors: Record<string, string> = {};

        if (!data.name.trim()) {
            newClientErrors.name = 'Nama lengkap wajib diisi.';
        }
        if (!data.email.trim()) {
            newClientErrors.email = 'Alamat email wajib diisi.';
        }
        if (!data.nomor_induk.trim()) {
            newClientErrors.nomor_induk = `${nomorIndukLabel} wajib diisi.`;
        }
        if (!data.no_hp.trim()) {
            newClientErrors.no_hp = 'Nomor HP / WhatsApp wajib diisi.';
        }

        if (isMahasiswa) {
            if (!data.fakultas) {
                newClientErrors.fakultas = 'Silakan pilih Fakultas terlebih dahulu.';
            }
            if (!data.prodi) {
                newClientErrors.prodi = 'Silakan pilih Program Studi terlebih dahulu.';
            }
        }

        if (Object.keys(newClientErrors).length > 0) {
            setClientErrors(newClientErrors);
            return;
        }

        setClientErrors({});
        patch(route('profile.update'), { preserveScroll: true });
    };

    return (
        <section className={className}>
            <form onSubmit={submit} className="space-y-6">
                {/* Data Akun */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Data Akun</p>
                        <span className="text-[10px] font-medium text-slate-400">
                            Semua kolom bertanda <span className="text-rose-500 font-bold">*</span> wajib diisi
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field
                            label="Nama Lengkap"
                            htmlFor="name"
                            required
                            icon={<UserIcon className="w-4 h-4" />}
                            error={clientErrors.name || errors.name}
                        >
                            <input
                                id="name"
                                className={inputClass}
                                value={data.name}
                                onChange={(e) => {
                                    setClientErrors((prev) => {
                                        const next = { ...prev };
                                        delete next.name;
                                        return next;
                                    });
                                    setData('name', e.target.value);
                                }}
                                required
                                autoComplete="name"
                                placeholder="Nama lengkap Anda"
                            />
                        </Field>

                        <Field
                            label="Alamat Email"
                            htmlFor="email"
                            required
                            icon={<Mail className="w-4 h-4" />}
                            error={clientErrors.email || errors.email}
                        >
                            <input
                                id="email"
                                type="email"
                                className={inputClass}
                                value={data.email}
                                onChange={(e) => {
                                    setClientErrors((prev) => {
                                        const next = { ...prev };
                                        delete next.email;
                                        return next;
                                    });
                                    setData('email', e.target.value);
                                }}
                                required
                                autoComplete="username"
                                placeholder="contoh@unuha.ac.id"
                            />
                        </Field>

                        <Field
                            label={nomorIndukLabel}
                            htmlFor="nomor_induk"
                            required
                            icon={<IdCard className="w-4 h-4" />}
                            error={clientErrors.nomor_induk || errors.nomor_induk}
                        >
                            <input
                                id="nomor_induk"
                                required
                                className={`${inputClass} font-mono tracking-wide`}
                                value={data.nomor_induk}
                                onChange={(e) => {
                                    setClientErrors((prev) => {
                                        const next = { ...prev };
                                        delete next.nomor_induk;
                                        return next;
                                    });
                                    setData('nomor_induk', e.target.value);
                                }}
                                placeholder={
                                    isMahasiswa
                                        ? 'Contoh: 2355202065'
                                        : isUmum
                                          ? 'Contoh: 1608xxxxxxxxxxxx'
                                          : 'Contoh: STF-2026-001'
                                }
                            />
                        </Field>

                        <Field
                            label="No. HP / WhatsApp"
                            htmlFor="no_hp"
                            required
                            icon={<Phone className="w-4 h-4" />}
                            error={clientErrors.no_hp || errors.no_hp}
                        >
                            <input
                                id="no_hp"
                                type="tel"
                                required
                                inputMode="numeric"
                                className={inputClass}
                                value={data.no_hp}
                                onChange={(e) => {
                                    setClientErrors((prev) => {
                                        const next = { ...prev };
                                        delete next.no_hp;
                                        return next;
                                    });
                                    setData('no_hp', e.target.value);
                                }}
                                placeholder="08xxxxxxxxxx"
                            />
                        </Field>
                    </div>
                </div>

                {/* Biodata Akademik (Mahasiswa) */}
                {isMahasiswa && (
                    <div className="space-y-4 pt-5 border-t border-slate-100">
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Biodata Akademik</p>
                            {data.fakultas && data.prodi ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                    <CheckCircle2 className="w-3 h-3" /> Lengkap
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                                    Wajib Dilengkapi
                                </span>
                            )}
                        </div>

                        <div className="space-y-4">
                            <Field
                                label="1. Fakultas / Pascasarjana"
                                htmlFor="fakultas"
                                required
                                icon={<GraduationCap className="w-4 h-4" />}
                                error={clientErrors.fakultas || errors.fakultas}
                            >
                                <select
                                    id="fakultas"
                                    required
                                    value={data.fakultas}
                                    onChange={(e) => handleFakultasChange(e.target.value)}
                                    className={selectClass}
                                >
                                    <option value="">-- Pilih Fakultas / Pascasarjana --</option>
                                    {FAKULTAS_PRODI_UNUHA.map((item) => (
                                        <option key={item.fakultas} value={item.fakultas}>
                                            {item.fakultas}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            </Field>

                            <Field
                                label="2. Program Studi"
                                htmlFor="prodi"
                                required
                                icon={<BookOpen className="w-4 h-4" />}
                                error={clientErrors.prodi || errors.prodi}
                                hint={!data.fakultas ? 'Pilih fakultas terlebih dahulu.' : undefined}
                            >
                                <select
                                    id="prodi"
                                    required
                                    value={data.prodi}
                                    onChange={(e) => {
                                        setClientErrors((prev) => {
                                            const next = { ...prev };
                                            delete next.prodi;
                                            return next;
                                        });
                                        setData('prodi', e.target.value);
                                    }}
                                    disabled={!data.fakultas}
                                    className={`${selectClass} ${
                                        clientErrors.prodi || errors.prodi ? 'border-rose-300 ring-2 ring-rose-100' : ''
                                    }`}
                                >
                                    <option value="">{data.fakultas ? '-- Pilih Program Studi --' : '—'}</option>
                                    {activeProdiOptions.map((prodiName) => (
                                        <option key={prodiName} value={prodiName}>
                                            {prodiName}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            </Field>
                        </div>

                        <div className="flex items-start gap-2 rounded-xl bg-emerald-50/60 border border-emerald-100 px-3 py-2.5">
                            <Info className="w-4 h-4 text-[#006039] shrink-0 mt-0.5" />
                            <p className="text-[11px] leading-relaxed text-emerald-900">
                                NIM, No. HP, Fakultas, dan Program Studi akan <strong>terisi otomatis</strong> saat Anda mengajukan peminjaman.
                            </p>
                        </div>
                    </div>
                )}

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                        <p className="text-xs text-amber-800">
                            Alamat email Anda belum diverifikasi.{' '}
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="font-bold underline hover:text-amber-900 focus:outline-hidden"
                            >
                                Kirim ulang email verifikasi.
                            </Link>
                        </p>
                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-xs font-semibold text-emerald-700">
                                Tautan verifikasi baru telah dikirim ke email Anda.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-[#006039] hover:bg-[#0f4c3a] text-white text-[13px] font-semibold shadow-xs transition cursor-pointer disabled:opacity-60"
                    >
                        <Save className="w-4 h-4" />
                        {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="w-4 h-4" />
                            Tersimpan
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
