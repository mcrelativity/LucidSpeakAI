"use client";
import { useAuth } from '@/context/AuthContext';
import Link from '@/components/LocaleLink';
import { useTranslations } from 'next-intl';
import { FaCrown, FaChartLine } from 'react-icons/fa';

const UserTierBadge = () => {
    const { user } = useAuth();
    const t = useTranslations('UserTier');

    if (!user) return null;

    const isPro = user.tier === 'pro';
    const minutesUsed = user.minutes || 0;
    const minutesLimit = isPro ? null : 5;
    const percentageUsed = minutesLimit ? Math.min((minutesUsed / minutesLimit) * 100, 100) : 0;

    return (
        <div className="w-full max-w-3xl mb-4 bg-slate-800 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
                {isPro ? (
                    <FaCrown className="text-yellow-400 text-2xl" />
                ) : (
                    <FaChartLine className="text-sky-400 text-2xl" />
                )}
                <div>
                    <h3 className="text-white font-bold">
                        {isPro ? t('proPlan') : t('freePlan')}
                    </h3>
                    <p className="text-slate-400 text-sm">
                        {isPro 
                            ? `${minutesUsed.toFixed(1)} ${t('minutesAnalyzed')}`
                            : `${minutesUsed.toFixed(1)} / ${minutesLimit} ${t('minutesUsed')}`
                        }
                    </p>
                </div>
            </div>
            
            {!isPro && (
                <div className="flex flex-col items-end">
                    <div className="w-32 bg-slate-700 rounded-full h-2 mb-1">
                        <div 
                            className={`h-2 rounded-full transition-all ${
                                percentageUsed >= 80 ? 'bg-red-500' : 
                                percentageUsed >= 50 ? 'bg-yellow-500' : 
                                'bg-green-500'
                            }`}
                            style={{ width: `${percentageUsed}%` }}
                        ></div>
                    </div>
                    {percentageUsed >= 80 && (
                        <Link 
                            href="/pricing" 
                            className="text-xs text-sky-400 hover:text-sky-300 underline"
                        >
                            {t('upgradeToPro')}
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
};

export default UserTierBadge;
