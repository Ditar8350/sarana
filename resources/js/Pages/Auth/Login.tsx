import { useEffect, useState, FormEventHandler } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { Landmark, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function Login({ status }: { status?: string }) {
    // State untuk mengontrol visibilitas password
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    useEffect(() => {
        return () => {
            reset('password');
        };
    }, []);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <div className="min-h-screen bg-surface-low flex flex-col justify-center items-center p-4 font-sans">
            <Head title="Login - Biro Sarpras UNUHA" />

            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-ink/5 border border-surface-container overflow-hidden">
                
                {/* Header Login dengan Background Gambar */}
                <div className="relative px-8 py-10 text-center overflow-hidden">
                    {/* Latar Belakang Gambar */}
                    <img
                        src="/images/Hero.png" 
                        alt="Background Login"
                        className="absolute inset-0 w-full h-full object-cover object-center"
                    />
                    {/* Overlay Hijau Transparan */}
                    <div className="absolute inset-0 bg-primary/85 backdrop-blur-[2px]" />
                    
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center shadow-lg border border-white/30 mb-4">
                            <Landmark className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white font-serif drop-shadow-md">Login</h2>
                        <p className="text-white/90 text-sm mt-1 drop-shadow-sm">Biro Sarana &amp; Prasarana Universitas Nurul Huda</p>
                    </div>
                </div>

                {/* Form Login */}
                <div className="p-8">
                    {status && <div className="mb-4 font-medium text-sm text-green-600">{status}</div>}

                    <form onSubmit={submit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-ink mb-1.5" htmlFor="email">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/50" />
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    placeholder="nama@unuha.ac.id"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-container bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm"
                                    autoComplete="username"
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                />
                            </div>
                            {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-ink mb-1.5" htmlFor="password">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/50" />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={data.password}
                                    placeholder="Masukkan kata sandi..."
                                    className="w-full pl-10 pr-12 py-2.5 rounded-xl border border-surface-container bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm"
                                    autoComplete="current-password"
                                    onChange={(e) => setData('password', e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted/50 hover:text-primary transition-colors focus:outline-none cursor-pointer"
                                    aria-label="Tampilkan sandi"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                            {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password}</p>}
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <span className="ms-2 text-xs text-muted font-medium">Ingat Saya</span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className={`w-full py-3 px-4 bg-primary hover:bg-primary-dark text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 flex justify-center items-center cursor-pointer ${processing ? 'opacity-70 pointer-events-none' : ''}`}
                        >
                            {processing ? 'Memproses...' : 'Masuk ke Dashboard'}
                        </button>
                    </form>
                    
                    {/* Tautan Pendaftaran: Atas Bawah Sesuai Urutan */}
                    <div className="mt-6 text-center space-y-1.5">
                        <p className="text-xs text-muted font-medium">
                            Belum punya akun?
                        </p>
                        <div>
                            <Link
                                href="/register"
                                className="text-sm font-semibold text-primary hover:underline inline-block"
                            >
                                Daftar sebagai Mahasiswa
                            </Link>
                        </div>
                        <div>
                            <Link
                                href="/register?type=publik"
                                className="text-sm font-semibold text-primary hover:underline inline-block"
                            >
                                Daftar untuk Umum
                            </Link>
                        </div>
                        <div className="pt-2">
                            <Link
                                href="/"
                                className="text-xs font-medium text-muted hover:text-primary transition-colors inline-block"
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
