"use client";

// minor change: layout maintenance comment

import { useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Shield, Activity } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <ProtectedRoute>
      <AdminRoute>
        <div className="fixed inset-0 flex">
          {/* Admin Sidebar */}
          <AdminSidebar onCollapseChange={setSidebarCollapsed} collapsed={sidebarCollapsed} />

          {/* Main Content Area */}
          <div
            className={cn(
              "flex-1 flex flex-col transition-all duration-300"
            )}
          >
            {/* Admin Navbar Header */}
            <div className="h-16 px-6 flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/5 via-primary/3 to-transparent backdrop-blur-sm shadow-sm flex-shrink-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground flex items-center gap-1.5">
                    Admin Panel
                    <Activity className="w-4 h-4 text-primary" />
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Platform administration
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <ThemeToggle />
                <UserMenu />
                <Link
                  href="/"
                  className="px-2.5 py-1 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto bg-background p-6">
              {children}
            </div>
          </div>
        </div>
      </AdminRoute>
    </ProtectedRoute>
  );
}
