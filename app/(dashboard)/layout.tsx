import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UserOnly } from "@/components/auth/UserOnly";
import { PlanWarningBanner } from "@/components/PlanWarningBanner";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <UserOnly>
        <PlanWarningBanner />
        <DashboardLayout>{children}</DashboardLayout>
      </UserOnly>
    </ProtectedRoute>
  );
}

