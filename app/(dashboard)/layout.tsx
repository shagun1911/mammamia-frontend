import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UserOnly } from "@/components/auth/UserOnly";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <UserOnly>
        <DashboardLayout>{children}</DashboardLayout>
      </UserOnly>
    </ProtectedRoute>
  );
}

