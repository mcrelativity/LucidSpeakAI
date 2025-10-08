"use client";
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations('Auth.register');
    
    const locale = pathname?.split('/')[1] || 'es';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await register(email, password);
            router.push(`/${locale}/login?registered=true`);
        } catch (err) {
            setError(err.message || 'No se pudo completar el registro.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 text-white p-4">
            <Link href={`/${locale}`} className="text-3xl font-bold text-sky-400 mb-8">LucidSpeak</Link>
            <form onSubmit={handleSubmit} className="w-full max-w-sm bg-slate-800 p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-center text-white mb-6">{t('title')}</h2>
                {error && <p className="bg-red-500/20 text-red-400 text-center p-2 rounded mb-4">{error}</p>}
                <p className="text-xs text-slate-400 mb-4">{t('requirements')}</p>
                <div className="mb-4">
                    <label className="block text-slate-400 mb-2" htmlFor="email">{t('email')}</label>
                    <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-slate-700 p-2 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                <div className="mb-6">
                    <label className="block text-slate-400 mb-2" htmlFor="password">{t('password')}</label>
                    <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-slate-700 p-2 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded transition-colors disabled:bg-slate-600">
                    {loading ? `${t('submit')}...` : t('submit')}
                </button>
                <p className="text-center text-slate-400 mt-4">{t('haveAccount')} <Link href={`/${locale}/login`} className="text-sky-400 hover:underline">{t('login')}</Link></p>
            </form>
        </div>
    );
}