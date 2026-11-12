import { Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, KeyRound } from 'lucide-react';

const inputClass =
    'w-full h-10 pl-9 pr-10 rounded-xl border border-slate-200 bg-slate-50/70 text-[13px] text-slate-800 placeholder:text-slate-400 outline-hidden transition focus:bg-white focus:border-[#006039] focus:ring-2 focus:ring-emerald-100';

function PasswordField({
    id,
    label,
    value,
    onChange,
    placeholder,
    autoComplete,
    error,
    inputRef,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    autoComplete: string;
    error?: string;
    inputRef?: React.RefObject<HTMLInputElement>;
}) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div>
            <label htmlFor={id} className="block text-xs font-semibold text-slate-700 mb-1.5">
                {label}
            </label>
            <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    id={id}
                    ref={inputRef}
                    type={isVisible ? 'text' : 'password'}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={inputClass}
                    autoComplete={autoComplete}
                    placeholder={placeholder}
                />
                <button
                    type="button"
                    onClick={() => setIsVisible((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    tabIndex={-1}
                    aria-label={isVisible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                    {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>
            {error && <p className="mt-1.5 text-[11px] font-medium text-rose-600">{error}</p>}
        </div>
    );
}

export default function UpdatePasswordForm({ className = '' }: { className?: string }) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword: FormEventHandler = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <section className={className}>
            <form onSubmit={updatePassword} className="space-y-4">
                <PasswordField
                    id="current_password"
                    label="Kata Sandi Saat Ini"
                    value={data.current_password}
                    onChange={(v) => setData('current_password', v)}
                    placeholder="Kata sandi lama"
                    autoComplete="current-password"
                    error={errors.current_password}
                    inputRef={currentPasswordInput}
                />

                <PasswordField
                    id="password"
                    label="Kata Sandi Baru"
                    value={data.password}
                    onChange={(v) => setData('password', v)}
                    placeholder="Minimal 8 karakter"
                    autoComplete="new-password"
                    error={errors.password}
                    inputRef={passwordInput}
                />

                <PasswordField
                    id="password_confirmation"
                    label="Konfirmasi Kata Sandi Baru"
                    value={data.password_confirmation}
                    onChange={(v) => setData('password_confirmation', v)}
                    placeholder="Ulangi kata sandi baru"
                    autoComplete="new-password"
                    error={errors.password_confirmation}
                />

                <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center gap-2 h-10 px-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-[13px] font-semibold transition cursor-pointer disabled:opacity-60"
                    >
                        <KeyRound className="w-4 h-4 text-[#006039]" />
                        {processing ? 'Memproses...' : 'Perbarui Kata Sandi'}
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
                            Kata sandi diperbarui
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
