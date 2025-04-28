"use client";
import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/layout/AuthProvider';
import DashboardHeader from '../../components/layout/DashboardHeader';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/sign-in');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <>
      <DashboardHeader />
      <div className="min-h-screen">
        <div className="container mx-auto px-6 py-8 bg-muted/50">
          {children}
        </div>
      </div>
    </>
  );
} 