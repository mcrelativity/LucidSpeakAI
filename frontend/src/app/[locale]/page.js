"use client";
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  
  // Extract locale from pathname
  const locale = pathname?.split('/')[1] || 'es';

  useEffect(() => {
    if (!loading) {
      // Redirect based on authentication status
      if (user) {
        router.push(`/${locale}/dashboard`);
      } else {
        router.push(`/${locale}/welcome`);
      }
    }
  }, [user, loading, router, locale]);

  // Show loading spinner while determining where to redirect
  return (
    <div className="flex-grow flex items-center justify-center w-full p-4 md:p-6">
      <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-16 w-16 animate-spin border-t-sky-500"></div>
    </div>
  );
}