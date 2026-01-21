'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * Admin Route Protection Component
 * STRICT GUARD: Only allows users with role === 'admin' in database
 * No email whitelist - only database role matters
 */
export function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Check if user is authenticated
      if (!user) {
        console.warn('[AdminRoute] Unauthenticated user attempted to access admin panel');
        router.replace('/auth/signin');
        return;
      }

      // STRICT CHECK: Only allow if role === 'admin' in database
      if (user.role !== 'admin') {
        console.warn('[AdminRoute] Non-admin user attempted to access admin panel, redirecting to dashboard');
        console.warn('[AdminRoute] User role:', user.role, 'Email:', user.email);
        router.replace('/conversations');
      }
    }
  }, [user, loading, router]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-300 dark:border-gray-700 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!user) {
    return null;
  }

  // STRICT CHECK: Only render if role === 'admin'
  if (user.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
}
