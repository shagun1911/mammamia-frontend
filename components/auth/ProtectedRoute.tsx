'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingLogo } from '@/components/LoadingLogo';

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirected = useRef(false);
  const [showLoader, setShowLoader] = useState(true);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    if (!loading) {
      // Ensure loader stays for at least 2.5 seconds
      const elapsed = Date.now() - startTimeRef.current;
      const minDisplayTime = 2500; // 2.5 seconds
      const remainingTime = Math.max(0, minDisplayTime - elapsed);

      setTimeout(() => {
        setShowLoader(false);
        
        // Only redirect once to prevent infinite loops
        if (!isAuthenticated && !hasRedirected.current) {
          hasRedirected.current = true;
          // Save the attempted URL to redirect back after login
          sessionStorage.setItem('redirectAfterLogin', pathname);
          router.replace('/auth/signin');
        }
      }, remainingTime);
    } else {
      // Reset timer when loading starts again
      startTimeRef.current = Date.now();
    }
    
    // Reset flag when authenticated
    if (isAuthenticated) {
      hasRedirected.current = false;
    }
  }, [isAuthenticated, loading, router, pathname]);

  // Show loading spinner while checking authentication or during minimum display time
  if (loading || showLoader) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingLogo size="md" text="Loading..." />
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

