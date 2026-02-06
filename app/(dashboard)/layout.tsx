"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UserOnly } from "@/components/auth/UserOnly";
import { PlanWarningBanner } from "@/components/PlanWarningBanner";
import { OnboardingModal } from "@/components/auth/OnboardingModal";
import { useAuth } from "@/contexts/AuthContext";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Show onboarding modal if user is logged in and hasn't completed onboarding
    if (!loading && user && !user.onboardingCompleted) {
      setShowOnboarding(true);
    }
  }, [user, loading]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  return (
    <ProtectedRoute>
      <UserOnly>
        <PlanWarningBanner />
        <DashboardLayout>{children}</DashboardLayout>
        {showOnboarding && (
          <OnboardingModal
            isOpen={showOnboarding}
            onClose={() => {}} // Prevent closing without completing
            onComplete={handleOnboardingComplete}
          />
        )}
      </UserOnly>
    </ProtectedRoute>
  );
}

