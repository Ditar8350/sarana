import { useEffect, useState, FormEventHandler } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { Landmark, Mail, Lock, User, Hash, Eye, EyeOff } from 'lucide-react';

interface RegisterProps {
    initialType?: 'mahasiswa' | 'publik';
}

export default function Register({ initialType = 'mahasiswa' }: RegisterProps) {
    // Menentukan jenis registrasi (publik atau mahasiswa) dari prop atau parameter URL
    const isPublik = (() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('type') === 'publik') return true;
            if (window.location.pathname.includes('/register/publik')) return true;
        }
        return initialType === 'publik';
    })();

    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        type: isPublik ? 'publik' : 'mahasiswa',
        name: '',
        nomor_induk: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        return () => {
            reset('password', 'password_confirmation');
        };
    }, []);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'));
    };

    return (
        <div className="min-h-screen bg-surface-low flex flex-col justify-center items-center p-4 font-sans py-8">
            <Head title={isPublik ? "Daftar Akun Publik - Biro Sarpras UNUHA" : "Daftar Akun Mahasiswa - Biro Sarpras UNUHA"} />

            <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl shadow-ink/5 border border-surface-container overflow-hidden">
                {/* Header dengan background */}
                <div className="relative px-8 py-8 text-center overflow-hidden">
                    <img
                        src="/images/Hero.png"
                        alt="Background Register"
                        className="absolute inset-0 w-full h-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-primary/85 backdrop-blur-[2px]" />

                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center shadow-lg border border-white/30 mb-3">
                            <Landmark className="w-7 h-7 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white font-serif drop-shadow-md">
                            {isPublik ? "Registrasi Publik / Umum" : "Registrasi Mahasiswa"}
                        </h2>
                        <p className="text-white/90 text-xs mt-1 drop-shadow-sm">
                            Biro Sarana &amp; Prasarana Universitas Nurul Huda
                        </p>
                    </div>
                </div>

                {/* Form Input Khusus (Full Mahasiswa atau Full Publik) */}
                <div className="p-8">
                    <form onSubmit={submit} className="space-y-4">
                        {/* Nama Lengkap */}
                        <div>
                            <label className="block text-xs font-bold text-ink mb-1.5">
                                Nama Lengkap <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted/60">
                                    <User className="w-4 h-4" />
                                </div>
                                <input
                                    type="text"
                                    name="name"
                                    value={data.name}
                                    placeholder={isPublik ? "Masukkan nama lengkap Anda..." : "Masukkan nama lengkap..."}
                                    className="w-full pl-10 pr-4 py-2.5 bg-surface-low/50 border border-slate-200 rounded-xl text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                />
                            </div>
                            {errors.name && (
                                <p className="text-red-500 text-[11px] mt-1">{errors.name}</p>
                            )}
                        </div>

                        {/* NIM (HANYA MUNCUL DI HALAMAN MAHASISWA, TIDAK ADA DI HALAMAN PUBLIK) */}
                        {!isPublik && (
                            <div>
                                <label className="block text-xs font-bold text-ink mb-1.5">
                                    NIM (Nomor Induk Mahasiswa) <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted/60">
                                        <Hash className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="text"
                                        name="nomor_induk"
                                        value={data.nomor_induk}
                                        placeholder="Contoh: 2355202017"
                                        className="w-full pl-10 pr-4 py-2.5 bg-surface-low/50 border border-slate-200 rounded-xl text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono font-bold"
                                        onChange={(e) => setData('nomor_induk', e.target.value)}
                                        required
                                    />
                                </div>
                                {errors.nomor_induk && (
                                    <p className="text-red-500 text-[11px] mt-1">{errors.nomor_induk}</p>
                                )}
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label className="block text-xs font-bold text-ink mb-1.5">
                                Alamat Email <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted/60">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    placeholder={isPublik ? "emailanda@gmail.com" : "nama@mhs.unuha.ac.id"}
                                    className="w-full pl-10 pr-4 py-2.5 bg-surface-low/50 border border-slate-200 rounded-xl text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                />
                            </div>
                            {errors.email && (
                                <p className="text-red-500 text-[11px] mt-1">{errors.email}</p>
                            )}
                        </div>

                        {/* Password & Confirm */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-ink mb-1.5">
                                    Kata Sandi <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted/60">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={data.password}
                                        placeholder="Min. 8 karakter"
                                        className="w-full pl-10 pr-9 py-2.5 bg-surface-low/50 border border-slate-200 rounded-xl text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                        onChange={(e) => setData('password', e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted/50 hover:text-primary transition-colors focus:outline-none cursor-pointer"
                                        aria-label="Tampilkan sandi"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-red-500 text-[11px] mt-1">{errors.password}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-ink mb-1.5">
                                    Ulangi Kata Sandi <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted/60">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password_confirmation"
                                        value={data.password_confirmation}
                                        placeholder="Konfirmasi sandi"
                                        className="w-full pl-10 pr-4 py-2.5 bg-surface-low/50 border border-slate-200 rounded-xl text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                        onChange={(e) =>
                                            setData('password_confirmation', e.target.value)
                                        }
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className={`w-full py-3 px-4 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 flex justify-center items-center cursor-pointer ${
                                    processing ? 'opacity-70 pointer-events-none' : ''
                                }`}
                            >
                                {processing
                                    ? 'Mendaftarkan Akun...'
                                    : isPublik
                                    ? 'Daftar untuk Umum'
                                    : 'Daftar sebagai Mahasiswa'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center space-y-2">
                        <div>
                            <Link
                                href={route('login')}
                                className="text-xs font-semibold text-primary hover:underline"
                            >
                                Sudah punya akun? Masuk di sini
                            </Link>
                        </div>
                        <div>
                            {isPublik ? (
                                <Link
                                    href="/register"
                                    className="text-xs font-semibold text-slate-500 hover:text-primary transition-colors hover:underline"
                                >
                                    Mahasiswa UNUHA? Daftar sebagai Mahasiswa
                                </Link>
                            ) : (
                                <Link
                                    href="/register?type=publik"
                                    className="text-xs font-semibold text-slate-500 hover:text-primary transition-colors hover:underline"
                                >
                                    Bukan Mahasiswa? Daftar untuk Umum
                                </Link>
                            )}
                        </div>
                        <div className="pt-1">
                            <Link
                                href="/"
                                className="text-xs font-medium text-muted hover:text-primary transition-colors"
                            >
                                &larr; Kembali ke Beranda
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
