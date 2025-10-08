"use client";
import Link from '@/components/LocaleLink';
import { useAuth } from '@/context/AuthContext';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';
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
        <Link href="/pricing" className="block py-2 hover:text-sky-400" onClick={() => setIsMenuOpen(false)}>{t('Header.prices')}</Link>
        {user ? (
            <>
                <Link href="/dashboard" className="block py-2 hover:text-sky-400" onClick={() => setIsMenuOpen(false)}>{t('Header.goToApp')}</Link>
                <Link href="/account" className="block py-2 hover:text-sky-400" onClick={() => setIsMenuOpen(false)}>{t('Header.account')}</Link>
                <button onClick={() => { logout(); setIsMenuOpen(false); }} className="block w-full text-left py-2 text-red-400 hover:text-red-500">{t('Header.logout')}</button>
            </>
        ) : (
            <>
                <Link href="/login" className="block py-2 hover:text-sky-400" onClick={() => setIsMenuOpen(false)}>{t('Header.login')}</Link>
                <Link href="/register" className="block py-2 mt-2 text-center bg-sky-500 px-4 rounded hover:bg-sky-600 transition-colors" onClick={() => setIsMenuOpen(false)}>{t('Header.getStarted')}</Link>
            </>
        )}
    </>
);

    return (
        <header className="w-full max-w-5xl p-4 flex justify-between items-center text-white mb-8">
            <Link href="/welcome" className="text-2xl font-bold text-sky-400 z-30">LucidSpeak</Link>
            
            <nav className="hidden md:flex items-center space-x-6 text-slate-300">
                <Link href="/pricing" className="hover:text-sky-400">{t('Header.prices')}</Link>
                {user ? (
                    <>
                        <Link href="/account" className="hover:text-sky-400">{t('Header.account')}</Link>
                        <button onClick={logout} className="hover:text-red-500">{t('Header.logout')}</button>
                        <Link href="/dashboard" className="bg-sky-500 px-4 py-2 rounded hover:bg-sky-600 transition-colors text-white">{t('Header.goToApp')}</Link>
                    </>
                ) : (
                    <>
                        <Link href="/login" className="hover:text-sky-400">{t('Header.login')}</Link>
                        <Link href="/register" className="bg-sky-500 px-4 py-2 rounded hover:bg-sky-600 transition-colors text-white">{t('Header.getStarted')}</Link>
                    </>
                )}
            </nav>

            <div className="md:hidden z-30">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
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
                        className="fixed top-0 right-0 h-full w-64 bg-slate-800 shadow-lg p-8 pt-24 z-20 md:hidden"
                    >
                        <nav className="flex flex-col space-y-4 text-lg">
                            {navLinks}
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

export default Header;