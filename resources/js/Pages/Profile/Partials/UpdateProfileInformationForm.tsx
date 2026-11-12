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
    children,
}: {
    label: string;
    htmlFor: string;
    icon: ReactNode;
    error?: string | null;
    hint?: string;
    children: ReactNode;
}) {
    return (
        <div>
            <label htmlFor={htmlFor} className="block text-xs font-semibold text-slate-700 mb-1.5">
                {label}
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
    const isMahasiswa = (user?.role as string) === 'mahasiswa';
    const [prodiClientError, setProdiClientError] = useState<string | null>(null);

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
        // Program Studi tidak diisi otomatis — mahasiswa memilih sendiri agar tidak salah
        setProdiClientError(null);
        setData((prev) => ({ ...prev, fakultas: fakultasValue, prodi: '' }));
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        setProdiClientError(null);

        if (isMahasiswa && data.fakultas && !data.prodi) {
            setProdiClientError('Silakan pilih Program Studi Anda.');
            return;
        }

        patch(route('profile.update'), { preserveScroll: true });
    };

    return (
        <section className={className}>
            <form onSubmit={submit} className="space-y-6">
                {/* Data Akun */}
                <div className="space-y-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Data Akun</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Nama Lengkap" htmlFor="name" icon={<UserIcon className="w-4 h-4" />} error={errors.name}>
                            <input
                                id="name"
                                className={inputClass}
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                                autoComplete="name"
                                placeholder="Nama lengkap Anda"
                            />
                        </Field>

                        <Field label="Alamat Email" htmlFor="email" icon={<Mail className="w-4 h-4" />} error={errors.email}>
                            <input
                                id="email"
                                type="email"
                                className={inputClass}
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                                autoComplete="username"
                                placeholder="contoh@unuha.ac.id"
                            />
                        </Field>

                        <Field
                            label={isMahasiswa ? 'NIM' : 'NIP.Y'}
                            htmlFor="nomor_induk"
                            icon={<IdCard className="w-4 h-4" />}
                            error={errors.nomor_induk}
                        >
                            <input
                                id="nomor_induk"
                                className={`${inputClass} font-mono tracking-wide`}
                                value={data.nomor_induk}
                                onChange={(e) => setData('nomor_induk', e.target.value)}
                                placeholder={isMahasiswa ? 'Contoh: 2355202065' : 'Contoh: STF-2026-001'}
                            />
                        </Field>

                        <Field label="No. HP / WhatsApp" htmlFor="no_hp" icon={<Phone className="w-4 h-4" />} error={errors.no_hp}>
                            <input
                                id="no_hp"
                                type="tel"
                                inputMode="numeric"
                                className={inputClass}
                                value={data.no_hp}
                                onChange={(e) => setData('no_hp', e.target.value)}
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
                            {data.fakultas && data.prodi && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                    <CheckCircle2 className="w-3 h-3" /> Lengkap
                                </span>
                            )}
                        </div>

                        <div className="space-y-4">
                            <Field
                                label="1. Fakultas / Pascasarjana"
                                htmlFor="fakultas"
                                icon={<GraduationCap className="w-4 h-4" />}
                                error={errors.fakultas}
                            >
                                <select
                                    id="fakultas"
                                    value={data.fakultas}
                                    onChange={(e) => handleFakultasChange(e.target.value)}
                                    className={selectClass}
                                >
                                    <option value="">Pilih fakultas</option>
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
                                icon={<BookOpen className="w-4 h-4" />}
                                error={prodiClientError || errors.prodi}
                                hint={!data.fakultas ? 'Pilih fakultas terlebih dahulu.' : undefined}
                            >
                                <select
                                    id="prodi"
                                    value={data.prodi}
                                    onChange={(e) => {
                                        setProdiClientError(null);
                                        setData('prodi', e.target.value);
                                    }}
                                    disabled={!data.fakultas}
                                    className={`${selectClass} ${
                                        prodiClientError ? 'border-rose-300 ring-2 ring-rose-100' : ''
                                    }`}
                                >
                                    <option value="">{data.fakultas ? 'Pilih program studi' : '—'}</option>
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
