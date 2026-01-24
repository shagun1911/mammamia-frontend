"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingLogo } from "@/components/LoadingLogo";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
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
        if (!user) {
          router.replace("/auth/signin");
        } else {
          // STRICT: Only redirect to admin if role === 'admin' in database
          console.log('[Home] User detected:', { email: user.email, role: user.role });
          if (user.role === 'admin') {
            console.log('[Home] Admin user, redirecting to /admin');
            router.replace("/admin");
          } else {
            console.log('[Home] Normal user, redirecting to /conversations');
            router.replace("/conversations");
          }
        }
      }, remainingTime);
    }
  }, [user, loading, router]);

  if (!showLoader && !loading) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <LoadingLogo size="lg" text="Loading..." />
    </div>
  );
}
