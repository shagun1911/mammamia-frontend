'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface UserOnlyProps {
  children: React.ReactNode;
}

/**
 * UserOnly Route Guard Component
 * Blocks admin users from accessing user pages
 * Redirects admin users to /admin
 */
export function UserOnly({ children }: UserOnlyProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.role === 'admin') {
      console.warn('[UserOnly] Admin user attempted to access user page, redirecting to /admin');
      router.replace('/admin');
    }
  }, [user, loading, router]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Don't render children if user is admin
  if (user?.role === 'admin') {
    return null;
  }

  return <>{children}</>;
}
