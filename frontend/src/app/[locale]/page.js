"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LandingPage from "@/components/LandingPage";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Redirect logged-in users to dashboard
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Show loading or landing page
  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center w-full p-4 md:p-6">
        <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-16 w-16 animate-spin border-t-sky-500"></div>
      </div>
    );
  }

  // Don't show landing if user is logged in (will redirect)
  if (user) {
    return null;
  }

  return (
    <div className="flex-grow flex items-center justify-center w-full p-4 md:p-6">
      <LandingPage />
    </div>
  );
}