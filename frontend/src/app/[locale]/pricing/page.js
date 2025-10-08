"use client";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';

export default function PricingPage() {
    const router = useRouter();
    const { user, token, apiBase } = useAuth();
    const [{ isPending }] = usePayPalScriptReducer();
    const [status, setStatus] = useState({ state: 'idle', message: '' });
    const t = useTranslations('Pricing');

    // Monthly subscription - $4.99/month
    const createSubscription = (data, actions) => {
        return actions.subscription.create({
            plan_id: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID || 'P-PLAN_ID_HERE',
        });
    };

    const onApprove = async (data, actions) => {
        setStatus({ state: 'processing', message: t('processing') });

        try {
            const subscriptionID = data.subscriptionID;
            
            if (!token) throw new Error(t('errorAuth'));

            const response = await fetch(`${apiBase}/confirm-subscription`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
                body: JSON.stringify({ subscriptionID })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || t('errorBackend'));
            }

            setStatus({ state: 'success', message: t('success') });
            setTimeout(() => { router.push('/account'); }, 2000);

        } catch (error) {
            console.error("Error en el flujo de aprobación:", error);
            setStatus({ state: 'error', message: error.message || t('errorVerification') });
        }
    };

    const onError = (err) => {
        console.error("Error en el pago de PayPal:", err);
        setStatus({ state: 'error', message: t('errorPayment') });
    };

    const isPro = user?.tier === 'pro';

    return (
        <div className="flex-grow flex flex-col items-center justify-center w-full p-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
            >
                <h1 className="text-4xl sm:text-5xl font-bold text-sky-400 mb-3">{t('title')}</h1>
                <p className="text-slate-400 text-lg">{t('subtitle')}</p>
            </motion.div>

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-2 gap-8 w-full max-w-5xl mb-8">
                
                {/* Free Tier */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-slate-800 border border-slate-700 rounded-2xl p-8 flex flex-col"
                >
                    <h2 className="text-2xl font-bold text-white mb-2">{t('freeTier.name')}</h2>
                    <div className="mb-6">
                        <span className="text-5xl font-bold text-slate-300">{t('freeTier.price')}</span>
                        <span className="text-slate-400 ml-2">{t('freeTier.period')}</span>
                    </div>
                    
                    <ul className="space-y-3 mb-8 flex-grow">
                        {t.raw('freeTier.features').map((feature, idx) => (
                            <li key={idx} className="flex items-start text-slate-300">
                                <svg className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                    
                    <button 
                        disabled
                        className="w-full bg-slate-700 text-slate-400 font-semibold py-3 px-6 rounded-lg cursor-not-allowed"
                    >
                        {t('freeTier.cta')}
                    </button>
                </motion.div>

                {/* Pro Tier */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-sky-900/50 to-blue-900/50 border-2 border-sky-500 rounded-2xl p-8 flex flex-col relative"
                >
                    {/* Popular Badge */}
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <span className="bg-sky-500 text-white text-sm font-bold px-4 py-1 rounded-full">
                            {t('proTier.popular')}
                        </span>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">{t('proTier.name')}</h2>
                    <div className="mb-6">
                        <span className="text-5xl font-bold text-sky-400">{t('proTier.price')}</span>
                        <span className="text-slate-300 ml-2">{t('proTier.period')}</span>
                    </div>
                    
                    <ul className="space-y-3 mb-8 flex-grow">
                        {t.raw('proTier.features').map((feature, idx) => (
                            <li key={idx} className="flex items-start text-white">
                                <svg className="w-5 h-5 text-sky-400 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>

                    {isPro ? (
                        <div className="w-full bg-green-600 text-white font-semibold py-3 px-6 rounded-lg text-center">
                            ✓ Plan Activo
                        </div>
                    ) : (
                        <div>
                            <p className="text-sm text-slate-300 mb-4 text-center">{t('cancelAnytime')}</p>
                            
                            {status.state === 'idle' && (
                                <div>
                                    {isPending && <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mx-auto animate-spin border-t-sky-500"></div>}
                                    {!isPending && (
                                        <>
                                            <PayPalButtons
                                                style={{ layout: "vertical", color: "blue" }}
                                                createSubscription={createSubscription}
                                                onApprove={onApprove}
                                                onError={onError}
                                                disabled={!user}
                                            />
                                            {!user && <p className="text-yellow-400 text-sm mt-4 text-center">{t('loginRequired')}</p>}
                                        </>
                                    )}
                                </div>
                            )}

                            {status.state === 'processing' && (
                                <div className="text-center py-4">
                                    <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mx-auto mb-2 animate-spin border-t-sky-500"></div>
                                    <p className="text-slate-300">{status.message}</p>
                                </div>
                            )}

                            {status.state === 'success' && (
                                <div className="bg-green-600/20 border border-green-500 rounded-lg p-4 text-center">
                                    <p className="text-green-400 font-bold">{status.message}</p>
                                </div>
                            )}

                            {status.state === 'error' && (
                                <div className="bg-red-600/20 border border-red-500 rounded-lg p-4 text-center">
                                    <p className="text-red-400 font-bold mb-3">{status.message}</p>
                                    <button 
                                        onClick={() => setStatus({ state: 'idle', message: '' })} 
                                        className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded transition-colors"
                                    >
                                        {t('retryButton')}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}