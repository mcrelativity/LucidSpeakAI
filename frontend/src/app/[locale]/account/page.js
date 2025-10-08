"use client";
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function AccountPage() {
    const { user, loading, logout, token, apiBase } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations('Account');
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showReactivateModal, setShowReactivateModal] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    
    // Extract locale from pathname
    const locale = pathname?.split('/')[1] || 'es';

    useEffect(() => {
        if (!loading && !user) {
            router.push(`/${locale}/login`);
        }
    }, [user, loading, router, locale]);

    const handleCancelSubscription = async () => {
        setProcessing(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await fetch(`${apiBase}/cancel-subscription`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to cancel subscription');
            }

            setMessage({ type: 'success', text: t('cancelSuccess') });
            setShowCancelModal(false);
            
            // Reload page to update user data
            setTimeout(() => {
                window.location.reload();
            }, 1500);

        } catch (error) {
            console.error('Error cancelling subscription:', error);
            setMessage({ type: 'error', text: t('cancelError') });
        } finally {
            setProcessing(false);
        }
    };

    const handleReactivateSubscription = async () => {
        setProcessing(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await fetch(`${apiBase}/reactivate-subscription`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to reactivate subscription');
            }

            setMessage({ type: 'success', text: t('reactivateSuccess') });
            
            // Reload page to update user data
            setTimeout(() => {
                window.location.reload();
            }, 1500);

        } catch (error) {
            console.error('Error reactivating subscription:', error);
            setMessage({ type: 'error', text: t('reactivateError') });
        } finally {
            setProcessing(false);
        }
    };

    // Format date for display
    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mx-auto mb-4 animate-spin border-t-sky-500"></div>
                    <p className="text-slate-400">{t('loading')}</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const isPro = user.tier === 'pro';
    const isActive = user.subscription_status === 'active';

    return (
        <div className="flex-grow flex items-center justify-center w-full p-6">
            <div className="w-full max-w-2xl">
                
                {/* Account Info Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-800 border border-slate-700 rounded-2xl p-8 mb-6"
                >
                    <h1 className="text-3xl font-bold text-sky-400 mb-6">{t('title')}</h1>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                            <span className="font-bold text-slate-400">{t('email')}:</span>
                            <span className="text-white">{user.email}</span>
                        </div>
                        
                        <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                            <span className="font-bold text-slate-400">{t('minutesUsed')}:</span>
                            <span className="text-white">{user.minutes || 0} min</span>
                        </div>
                        
                        <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                            <span className="font-bold text-slate-400">{t('plan')}:</span>
                            <span className={`capitalize font-bold px-3 py-1 rounded ${isPro ? 'bg-sky-500/20 text-sky-400' : 'bg-slate-700 text-slate-300'}`}>
                                {isPro ? t('proPlan') : t('freePlan')}
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Subscription Management Card */}
                {isPro && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-slate-800 border border-slate-700 rounded-2xl p-8 mb-6"
                    >
                        <h2 className="text-2xl font-bold text-white mb-4">{t('manageSubscription')}</h2>
                        
                        <div className="space-y-4">
                            {user.subscription_id && (
                                <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                                    <span className="font-bold text-slate-400">{t('subscriptionId')}:</span>
                                    <span className="text-slate-300 text-sm font-mono">{user.subscription_id.substring(0, 20)}...</span>
                                </div>
                            )}
                            
                            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                                <span className="font-bold text-slate-400">{t('subscriptionStatus')}:</span>
                                <span className={`capitalize font-semibold ${isActive ? 'text-green-400' : 'text-yellow-400'}`}>
                                    {isActive ? t('active') : t('cancelled')}
                                </span>
                            </div>

                            {/* Show next billing date if active, or end date if cancelled */}
                            {isActive && user.subscription_end_date && (
                                <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                                    <span className="font-bold text-slate-400">{t('nextBillingDate')}:</span>
                                    <span className="text-white">{formatDate(user.subscription_end_date)}</span>
                                </div>
                            )}

                            {!isActive && user.subscription_end_date && (
                                <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                                    <span className="font-bold text-slate-400">{t('subscriptionEndsOn')}:</span>
                                    <span className="text-yellow-400 font-semibold">{formatDate(user.subscription_end_date)}</span>
                                </div>
                            )}
                        </div>

                        {/* Cancelled subscription notice */}
                        {!isActive && (
                            <div className="mt-4 p-4 bg-yellow-600/20 border border-yellow-500 rounded-lg">
                                <p className="text-yellow-300 text-sm">{t('cancelledNotice')}</p>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="mt-6">
                            {isActive ? (
                                <button
                                    onClick={() => setShowCancelModal(true)}
                                    disabled={processing}
                                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                                >
                                    {processing ? t('cancelling') : t('cancelSubscription')}
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowReactivateModal(true)}
                                    disabled={processing}
                                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                                >
                                    {processing ? t('reactivating') : t('reactivateSubscription')}
                                </button>
                            )}
                        </div>

                        {message.text && (
                            <div className={`mt-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-600/20 border border-green-500 text-green-400' : 'bg-red-600/20 border border-red-500 text-red-400'}`}>
                                {message.text}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Upgrade Card for Free Users */}
                {!isPro && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-sky-900/30 to-blue-900/30 border border-sky-500/50 rounded-2xl p-8 mb-6"
                    >
                        <h2 className="text-2xl font-bold text-sky-400 mb-3">Upgrade to Pro</h2>
                        <p className="text-slate-300 mb-6">
                            Unlock unlimited recordings, advanced AI analysis, and priority support.
                        </p>
                        <Link href={`/${locale}/pricing`}>
                            <button className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                                {t('upgradeButton')}
                            </button>
                        </Link>
                    </motion.div>
                )}
            </div>

            {/* Cancel Confirmation Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full"
                    >
                        <h3 className="text-2xl font-bold text-white mb-4">{t('cancelConfirmTitle')}</h3>
                        <p className="text-slate-300 mb-6">
                            {t('cancelConfirmMessage')}
                        </p>
                        
                        <div className="flex gap-4">
                            <button
                                onClick={handleCancelSubscription}
                                disabled={processing}
                                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                            >
                                {processing ? t('cancelling') : t('cancelConfirmButton')}
                            </button>
                            <button
                                onClick={() => setShowCancelModal(false)}
                                disabled={processing}
                                className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                            >
                                {t('cancelKeepButton')}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Reactivate Confirmation Modal */}
            {showReactivateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full"
                    >
                        <h3 className="text-2xl font-bold text-white mb-4">{t('reactivateConfirmTitle')}</h3>
                        <p className="text-slate-300 mb-6">
                            {t('reactivateConfirmMessage')}
                        </p>
                        
                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setShowReactivateModal(false);
                                    handleReactivateSubscription();
                                }}
                                disabled={processing}
                                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                            >
                                {processing ? t('reactivating') : t('reactivateConfirmButton')}
                            </button>
                            <button
                                onClick={() => setShowReactivateModal(false)}
                                disabled={processing}
                                className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                            >
                                {t('cancel')}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}