"use client";

import { useEffect, Suspense, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingLogo } from "@/components/LoadingLogo";

/**
 * OAuth Callback Component
 * Handles OAuth redirects from Google and stores tokens
 */
function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showLoader, setShowLoader] = useState(true);
  const startTimeRef = useRef(Date.now());

  // ✅ GET CONTEXT METHOD
  const { setAuthFromOAuth } = useAuth();

  useEffect(() => {
    // Ensure loader stays for at least 2.5 seconds
    const minDisplayTime = 2500; // 2.5 seconds
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, minDisplayTime);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleCallback = () => {
      // Get tokens from URL params
      const token = searchParams.get("token");
      const refreshToken = searchParams.get("refreshToken");
      const error = searchParams.get("error");

      if (error) {
        const errorMessage = error.replace(/_/g, " ");
        toast.error(`Authentication failed: ${errorMessage}`);
        router.replace("/auth/signin");
        return;
      }

      if (token && refreshToken) {
        // Store tokens
        localStorage.setItem("accessToken", token);
        localStorage.setItem("refreshToken", refreshToken);

        // Fetch user data
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL ||
          "http://localhost:5001/api/v1";

        fetch(`${apiUrl}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.data) {
              // Store user
              localStorage.setItem("user", JSON.stringify(data.data));

              // ✅ CRITICAL LINE (FIXES REFRESH ISSUE)
              setAuthFromOAuth(data.data);

              toast.success("Login successful! Welcome.");

              console.log("[OAuth Callback] User logged in:", {
                email: data.data.email,
                role: data.data.role,
              });

              // Role-based redirect
              if (data.data.role === "admin") {
                router.replace("/admin");
              } else {
                router.replace("/conversations");
              }
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
        toast.error("Authentication failed. Please try again.");
        router.replace("/auth/signin");
      }
    };

    handleCallback();
  }, [router, searchParams, setAuthFromOAuth]);

  if (showLoader) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <LoadingLogo size="lg" text="Completing authentication..." />
      </div>
    );
  }

  return null;
}

/**
 * OAuth Callback Page with Suspense
 */
export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <LoadingLogo size="lg" text="Loading..." />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
