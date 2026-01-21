"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Bot } from "lucide-react";

/**
 * OAuth Callback Component
 * Handles OAuth redirects from Google and stores tokens
 */
function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = () => {
      // Get tokens from URL params
      const token = searchParams.get("token");
      const refreshToken = searchParams.get("refreshToken");
      const error = searchParams.get("error");

      if (error) {
        // Handle error
        const errorMessage = error.replace(/_/g, " ");
        toast.error(`Authentication failed: ${errorMessage}`);
        router.replace("/auth/signin");
        return;
      }

      if (token && refreshToken) {
        // Store tokens in localStorage
        localStorage.setItem("accessToken", token);
        localStorage.setItem("refreshToken", refreshToken);

        // Fetch user data and store it
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
        fetch(`${apiUrl}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.data) {
              localStorage.setItem("user", JSON.stringify(data.data));
              
              // STRICT: Only redirect to admin if role === 'admin' in database
              console.log('[OAuth Callback] User logged in:', { email: data.data.email, role: data.data.role });
              
              // Redirect immediately without showing toast (toast will show on the destination page if needed)
              if (data.data.role === 'admin') {
                console.log('[OAuth Callback] Admin user, redirecting to /admin');
                router.replace("/admin");
              } else {
                console.log('[OAuth Callback] Normal user, redirecting to /conversations');
                router.replace("/conversations");
              }
              
              // Show toast after redirect (this will be handled by the destination page)
              toast.success("Login successful! Welcome.");
            } else {
              throw new Error("Failed to fetch user data");
            }
          })
          .catch((error) => {
            console.error("Error fetching user data:", error);
            toast.error("Authentication failed. Please try again.");
            router.replace("/auth/signin");
          });
      } else {
        // No tokens or error, redirect to signin
        toast.error("Authentication failed. Please try again.");
        router.replace("/auth/signin");
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-full bg-primary/10 p-3">
          <Bot className="h-8 w-8 text-primary animate-pulse" />
        </div>
        <div className="w-12 h-12 border-4 border-gray-300 dark:border-gray-700 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
}

/**
 * OAuth Callback Page with Suspense
 */
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-primary/10 p-3">
            <Bot className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <div className="w-12 h-12 border-4 border-gray-300 dark:border-gray-700 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}

