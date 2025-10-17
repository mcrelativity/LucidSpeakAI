'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function SubscriptionSuccessPage() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const confirmPayment = async () => {
      try {
        if (!sessionId) {
          throw new Error('No session ID found');
        }

        // Get token from localStorage
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('Not authenticated');
        }

        // Call backend to confirm payment
        const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8001';
        const response = await fetch(`${apiBase}/api/confirm-stripe-payment?session_id=${sessionId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'Failed to confirm payment');
        }

        setSuccess(true);
        setLoading(false);

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } catch (err) {
        console.error('Error confirming payment:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    if (sessionId) {
      confirmPayment();
    } else {
      setError('No session ID provided');
      setLoading(false);
    }
  }, [sessionId, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-sky-400 border-t-transparent"></div>
          <p className="mt-4 text-xl text-white">Processing your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="max-w-md rounded-lg bg-slate-800 p-8 text-center">
          <h1 className="text-2xl font-bold text-red-400">Payment Error</h1>
          <p className="mt-4 text-slate-300">{error}</p>
          <button
            onClick={() => router.push('/pricing')}
            className="mt-6 rounded-lg bg-sky-500 px-6 py-2 font-semibold text-white hover:bg-sky-600"
          >
            Back to Pricing
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="max-w-md rounded-lg bg-slate-800 p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
              <svg className="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-green-400">Payment Successful!</h1>
          <p className="mt-4 text-slate-300">Your Pro subscription is now active.</p>
          <p className="mt-2 text-sm text-slate-400">Redirecting to dashboard...</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-6 rounded-lg bg-sky-500 px-6 py-2 font-semibold text-white hover:bg-sky-600"
          >
            Go to Dashboard Now
          </button>
        </div>
      </div>
    );
  }
}
