"use client";
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LucidApp from '@/components/LucidApp';
import UserTierBadge from '@/components/UserTierBadge';

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    
    const locale = pathname?.split('/')[1] || 'es';

    useEffect(() => {
        if (!loading && !user) {
            router.push(`/${locale}/login`);
        }
    }, [user, loading, router, locale]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-900">
                <div className="w-full max-w-3xl min-h-[500px] bg-slate-800 shadow-2xl rounded-xl p-6 sm:p-10 flex flex-col justify-center items-center animate-pulse">
                    <div className="w-32 h-32 bg-slate-700 rounded-full mb-6"></div>
                    <div className="w-48 h-6 bg-slate-700 rounded mb-4"></div>
                    <div className="w-64 h-4 bg-slate-700 rounded mb-8"></div>
                    <div className="w-40 h-12 bg-slate-700 rounded-full"></div>
                </div>
            </div>
        );
    }

    if (!user) {
        // Redirect is happening, show nothing to prevent flash
        return null;
    }

    if (user) {
        return (
            <div className="flex-grow flex flex-col items-center justify-center w-full p-4 md:p-6 bg-slate-900">
                <UserTierBadge />
                <LucidApp locale={locale} />
            </div>
        );
    }

    return null;
}