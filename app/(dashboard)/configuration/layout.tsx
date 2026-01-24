"use client";

import { ConfigurationSidebar } from "@/components/configuration/ConfigurationSidebar";
import { useSidebar } from "@/contexts/SidebarContext";
import { Cog, Activity } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";

export default function ConfigurationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { getSidebarWidth } = useSidebar();

  return (
    <div className="fixed inset-0 flex flex-col transition-all duration-300" style={{ left: `${getSidebarWidth()}px` }}>
      {/* Premium Professional Navbar */}
      <div className="h-20 px-8 flex items-center justify-between border-b border-border/60 bg-gradient-to-br from-background via-background to-primary/[0.02] backdrop-blur-xl shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset] flex-shrink-0 z-10">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center shadow-[0_8px_24px_rgba(99,102,241,0.25)] ring-1 ring-primary/20">
              <Cog className="w-7 h-7 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
              Configuration
              <Activity className="w-5 h-5 text-primary/80" />
            </h1>
            <p className="text-sm text-muted-foreground/80 mt-1 font-medium">Configure system settings and integrations</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        <ConfigurationSidebar />
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
