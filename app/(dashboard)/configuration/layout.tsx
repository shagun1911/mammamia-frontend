"use client";

import { ConfigurationSidebar } from "@/components/configuration/ConfigurationSidebar";
import { useSidebar } from "@/contexts/SidebarContext";

export default function ConfigurationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { getSidebarWidth } = useSidebar();

  return (
    <div className="fixed inset-0 flex transition-all duration-300" style={{ left: `${getSidebarWidth()}px` }}>
      <ConfigurationSidebar />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
