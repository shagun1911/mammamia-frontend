"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
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
    }
  }, [user, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-gray-300 dark:border-gray-700 border-t-primary rounded-full animate-spin" />
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    </div>
  );
}
