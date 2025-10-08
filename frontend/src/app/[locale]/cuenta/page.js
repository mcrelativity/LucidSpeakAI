"use client";
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function AccountPage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    
    // Extract locale from pathname
    const locale = pathname?.split('/')[1] || 'es';

    useEffect(() => {
        if (!loading && !user) {
            router.push(`/${locale}/login`);
        }
    }, [user, loading, router, locale]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p>Cargando...</p>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="flex-grow flex items-center justify-center w-full p-6">
            <div className="w-full max-w-md bg-slate-800 p-8 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold text-sky-400 mb-6">Mi Cuenta</h1>
                <div className="space-y-4">
                    <p><span className="font-bold text-slate-400">Email:</span> {user.email}</p>
                    <p><span className="font-bold text-slate-400">Minutos Usados:</span> {user.minutes || 0}</p>
                    <p><span className="font-bold text-slate-400">Plan:</span> <span className="capitalize font-semibold text-green-400">{user.tier || 'free'}</span></p>
                </div>
                <button onClick={logout} className="w-full mt-8 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors">
                    Cerrar Sesión
                </button>
            </div>
        </div>
    );
}