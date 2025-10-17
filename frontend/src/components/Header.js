"use client";
import Link from '@/components/LocaleLink';
import { useAuth } from '@/context/AuthContext';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { FaBars, FaTimes, FaSignOutAlt, FaUser, FaRocket, FaTag } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const Header = () => {
    const { user, logout } = useAuth();
    const t = useTranslations();
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    if (pathname?.includes('/login') || pathname?.includes('/registrarse')) {
        return null;
    }

    if (pathname === '/login' || pathname === '/register') {
        return null;
    }

    const navLinks = (
    <>
        <Link href="/pricing" className="flex items-center gap-3 py-3 px-4 hover:bg-slate-700 rounded-lg transition-colors group" onClick={() => setIsMenuOpen(false)}>
            <FaTag className="text-sky-400 group-hover:text-sky-300" />
            <span className="group-hover:text-sky-400">{t('Header.prices')}</span>
        </Link>
        {user ? (
            <>
                <Link href="/dashboard" className="flex items-center gap-3 py-3 px-4 hover:bg-slate-700 rounded-lg transition-colors group" onClick={() => setIsMenuOpen(false)}>
                    <FaRocket className="text-sky-400 group-hover:text-sky-300" />
                    <span className="group-hover:text-sky-400">{t('Header.goToApp')}</span>
                </Link>
                <Link href="/account" className="flex items-center gap-3 py-3 px-4 hover:bg-slate-700 rounded-lg transition-colors group" onClick={() => setIsMenuOpen(false)}>
                    <FaUser className="text-sky-400 group-hover:text-sky-300" />
                    <span className="group-hover:text-sky-400">{t('Header.account')}</span>
                </Link>
                <button onClick={() => { logout(); setIsMenuOpen(false); }} className="flex items-center gap-3 w-full text-left py-3 px-4 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors group">
                    <FaSignOutAlt className="group-hover:text-red-300" />
                    <span className="group-hover:text-red-300">{t('Header.logout')}</span>
                </button>
            </>
        ) : (
            <>
                <Link href="/login" className="block py-3 px-4 hover:bg-slate-700 rounded-lg hover:text-sky-400 transition-colors" onClick={() => setIsMenuOpen(false)}>{t('Header.login')}</Link>
                <Link href="/register" className="block py-3 px-4 text-center bg-sky-500 rounded-lg hover:bg-sky-600 transition-colors font-semibold" onClick={() => setIsMenuOpen(false)}>{t('Header.getStarted')}</Link>
            </>
        )}
    </>
);

    return (
        <header className="w-full max-w-6xl px-6 py-4 flex justify-between items-center text-white mb-8">
            <Link href="/welcome" className="text-2xl font-bold text-sky-400 hover:text-sky-300 transition-colors z-30">
                Intone
            </Link>
            
            <nav className="hidden md:flex items-center gap-2 text-slate-300">
                <Link href="/pricing" className="px-4 py-2 rounded-lg hover:bg-slate-800 hover:text-sky-400 transition-all">{t('Header.prices')}</Link>
                {user ? (
                    <>
                        <Link href="/account" className="px-4 py-2 rounded-lg hover:bg-slate-800 hover:text-sky-400 transition-all">{t('Header.account')}</Link>
                        <button onClick={logout} className="px-4 py-2 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-all">{t('Header.logout')}</button>
                        <div className="w-px h-6 bg-slate-700 mx-2"></div>
                        <Link href="/dashboard" className="bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2.5 rounded-lg hover:from-sky-600 hover:to-blue-700 transition-all text-white font-semibold shadow-lg shadow-sky-500/20 hover:shadow-sky-500/40">{t('Header.goToApp')}</Link>
                    </>
                ) : (
                    <>
                        <Link href="/login" className="px-4 py-2 rounded-lg hover:bg-slate-800 hover:text-sky-400 transition-all">{t('Header.login')}</Link>
                        <Link href="/register" className="bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2.5 rounded-lg hover:from-sky-600 hover:to-blue-700 transition-all text-white font-semibold shadow-lg shadow-sky-500/20 hover:shadow-sky-500/40">{t('Header.getStarted')}</Link>
                    </>
                )}
            </nav>

            <div className="md:hidden z-30">
                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                    {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                </button>
            </div>

            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        transition={{ type: 'tween', duration: 0.3 }}
                        className="fixed top-0 right-0 h-full w-72 bg-slate-800 shadow-2xl p-6 pt-20 z-20 md:hidden border-l border-slate-700"
                    >
                        <nav className="flex flex-col space-y-2 text-base">
                            {navLinks}
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

export default Header;