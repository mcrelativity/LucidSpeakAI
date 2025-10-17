"use client";
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';

export default function PricingPage() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, token, apiBase, refreshUser } = useAuth();
    const [{ isPending }] = usePayPalScriptReducer();
    const [status, setStatus] = useState({ state: 'idle', message: '' });
    const [paymentMethod, setPaymentMethod] = useState(null); // 'paypal' or 'stripe'
    const t = useTranslations('Pricing');
    
    // Extract locale from pathname
    const locale = pathname?.split('/')[1] || 'es';

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

            // Refresh user data to get updated subscription status
            await refreshUser();

            setStatus({ state: 'success', message: t('success') });
            setTimeout(() => { router.push(`/${locale}/account`); }, 2000);

        } catch (error) {
            console.error("Error en el flujo de aprobación:", error);
            setStatus({ state: 'error', message: error.message || t('errorVerification') });
        }
    };

    const handleStripePayment = async () => {
        setStatus({ state: 'processing', message: 'Redirecting to Stripe...' });
        try {
            if (!token) throw new Error(t('errorAuth'));

            const response = await fetch(`${apiBase}/api/stripe-payment`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Error creating checkout');
            }

            const data = await response.json();
            // Redirect to Stripe checkout
            if (data.checkout_url) {
                window.location.href = data.checkout_url;
            }
        } catch (error) {
            console.error("Error with Stripe:", error);
            setStatus({ state: 'error', message: error.message || 'Error initiating Stripe payment' });
            setPaymentMethod(null);
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
                    <div className="mb-2">
                        <span className="text-5xl font-bold text-sky-400">{t('proTier.price')}</span>
                        <span className="text-slate-300 ml-2">{t('proTier.period')}</span>
                    </div>
                    <p className="text-sm text-slate-300 mb-6">{t('billingPeriod')}</p>
                    
                    <ul className="space-y-3 mb-8 flex-grow">
                        {t.raw('proTier.features').map((feature, idx) => (
                            <li key={idx} className="flex items-start text-white">
                                <svg className="w-5 h-5 text-sky-400 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm">{feature}</span>
                            </li>
                        ))}
                    </ul>

                    {isPro ? (
                        <div className="w-full bg-green-600 text-white font-semibold py-3 px-6 rounded-lg text-center">
                            ✓ {locale === 'es' ? 'Plan Activo' : 'Active Plan'}
                        </div>
                    ) : (
                        <div>
                            <p className="text-xs text-slate-300 mb-4 text-center">{t('cancelAnytime')}</p>
                            
                            {status.state === 'idle' && (
                                <div>
                                    {isPending && <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mx-auto animate-spin border-t-sky-500"></div>}
                                    {!isPending && (
                                        <>
                                            {!paymentMethod ? (
                                                <div className="space-y-3">
                                                    <p className="text-xs text-slate-400 text-center mb-3">{t('paymentMethods')}</p>
                                                    <button
                                                        onClick={() => setPaymentMethod('paypal')}
                                                        disabled={!user}
                                                        className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                                                    >
                                                        {t('paypalButton')}
                                                    </button>
                                                    <button
                                                        onClick={() => setPaymentMethod('stripe')}
                                                        disabled={!user}
                                                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                                                    >
                                                        {t('stripeButton')}
                                                    </button>
                                                    {!user && <p className="text-yellow-400 text-xs mt-4 text-center">{t('loginRequired')}</p>}
                                                </div>
                                            ) : paymentMethod === 'paypal' ? (
                                                <div>
                                                    <button
                                                        onClick={() => setPaymentMethod(null)}
                                                        className="text-xs text-slate-400 hover:text-slate-300 mb-3 w-full text-center"
                                                    >
                                                        ← {locale === 'es' ? 'Cambiar método' : 'Change method'}
                                                    </button>
                                                    <PayPalButtons
                                                        style={{ layout: "vertical", color: "blue" }}
                                                        createSubscription={createSubscription}
                                                        onApprove={onApprove}
                                                        onError={onError}
                                                        disabled={!user}
                                                    />
                                                </div>
                                            ) : paymentMethod === 'stripe' ? (
                                                <div>
                                                    <button
                                                        onClick={() => setPaymentMethod(null)}
                                                        className="text-xs text-slate-400 hover:text-slate-300 mb-3 w-full text-center"
                                                    >
                                                        ← {locale === 'es' ? 'Cambiar método' : 'Change method'}
                                                    </button>
                                                    <button
                                                        onClick={handleStripePayment}
                                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                                                    >
                                                        {locale === 'es' ? 'Continuar a Stripe' : 'Continue to Stripe'}
                                                    </button>
                                                </div>
                                            ) : null}
                                        </>
                                    )}
                                </div>
                            )}

                            {status.state === 'processing' && (
                                <div className="text-center py-4">
                                    <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mx-auto mb-2 animate-spin border-t-sky-500"></div>
                                    <p className="text-slate-300 text-sm">{status.message}</p>
                                </div>
                            )}

                            {status.state === 'success' && (
                                <div className="bg-green-600/20 border border-green-500 rounded-lg p-4 text-center">
                                    <p className="text-green-400 font-bold text-sm">{status.message}</p>
                                </div>
                            )}

                            {status.state === 'error' && (
                                <div className="bg-red-600/20 border border-red-500 rounded-lg p-4 text-center">
                                    <p className="text-red-400 font-bold mb-3 text-sm">{status.message}</p>
                                    <button 
                                        onClick={() => { setStatus({ state: 'idle', message: '' }); setPaymentMethod(null); }} 
                                        className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded transition-colors text-sm"
                                    >
                                        {t('retryButton')}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Detailed Comparison Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="w-full max-w-5xl mt-16 bg-slate-800/50 border border-slate-700 rounded-2xl p-8"
            >
                <h3 className="text-2xl font-bold text-white mb-8 text-center">{locale === 'es' ? 'Comparación de Planes' : 'Plan Comparison'}</h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="text-slate-300">
                        <p className="font-semibold text-white mb-4">{locale === 'es' ? 'Feature' : 'Feature'}</p>
                        <p className="mb-3">{locale === 'es' ? 'Grabaciones/mes' : 'Recordings/month'}</p>
                        <p className="mb-3">{locale === 'es' ? 'Análisis IA' : 'AI Analysis'}</p>
                        <p className="mb-3">{locale === 'es' ? 'Historial' : 'History'}</p>
                        <p className="mb-3">{locale === 'es' ? 'Ejercicios' : 'Exercises'}</p>
                        <p className="mb-3">{locale === 'es' ? 'Soporte' : 'Support'}</p>
                    </div>
                    <div className="text-slate-300 border-l border-slate-600 pl-4">
                        <p className="font-semibold text-white mb-4">{t('freeTier.name')}</p>
                        <p className="mb-3">3</p>
                        <p className="mb-3">{locale === 'es' ? 'Básico' : 'Basic'}</p>
                        <p className="mb-3">7 {locale === 'es' ? 'días' : 'days'}</p>
                        <p className="mb-3">-</p>
                        <p className="mb-3">{locale === 'es' ? 'Email' : 'Email'}</p>
                    </div>
                    <div className="text-white border-l border-sky-500 pl-4">
                        <p className="font-semibold text-sky-400 mb-4">{t('proTier.name')}</p>
                        <p className="mb-3">{locale === 'es' ? 'Ilimitadas' : 'Unlimited'}</p>
                        <p className="mb-3">{locale === 'es' ? 'Avanzado + GPT-4' : 'Advanced + GPT-4'}</p>
                        <p className="mb-3">{locale === 'es' ? 'Completo' : 'Complete'}</p>
                        <p className="mb-3">{locale === 'es' ? 'Personalizados' : 'Personalized'}</p>
                        <p className="mb-3">{locale === 'es' ? 'Prioritario' : 'Priority'}</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}