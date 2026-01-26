"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  Zap,
  Activity,
  Plug,
  Settings,
  FileText,
  BarChart3,
  Shield,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Database
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  onCollapseChange?: (collapsed: boolean) => void;
  collapsed?: boolean;
  isMobile?: boolean;
}

export function AdminSidebar({ onCollapseChange, collapsed = false, isMobile }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const pathname = usePathname();

  useEffect(() => {
    setIsCollapsed(collapsed);
  }, [collapsed]);

  const toggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onCollapseChange?.(newCollapsed);
  };

  const menuItems = [
    {
      title: "Overview",
      items: [
        {
          label: "Dashboard",
          icon: LayoutDashboard,
          href: "/admin",
          description: "Platform metrics & statistics"
        }
      ]
    },
    {
      title: "Organizations",
      items: [
        {
          label: "All Organizations",
          icon: Building2,
          href: "/admin/organizations",
          description: "Manage organizations"
        },
        {
          label: "Users & Billing",
          icon: Users,
          href: "/admin/users",
          description: "User accounts & plan upgrades"
        },
        {
          label: "Plans Management",
          icon: CreditCard,
          href: "/admin/plans",
          description: "Create & manage plans"
        }
      ]
    },
    {
      title: "Automations",
      items: [
        {
          label: "All Automations",
          icon: Zap,
          href: "/admin/automations",
          description: "Manage automations"
        },
        {
          label: "Execution Logs",
          icon: Activity,
          href: "/admin/executions",
          description: "View execution history"
        }
      ]
    },
    {
      title: "Integrations",
      items: [
        {
          label: "Integration Status",
          icon: Plug,
          href: "/admin/integrations",
          description: "Monitor integrations"
        }
      ]
    },
    {
      title: "Analytics",
      items: [
        {
          label: "Usage Reports",
          icon: BarChart3,
          href: "/admin/analytics",
          description: "Platform usage analytics"
        },
        {
          label: "Billing Overview",
          icon: TrendingUp,
          href: "/admin/billing",
          description: "Revenue & subscriptions"
        }
      ]
    }
  ];

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  return (
    <div
      className={cn(
        "h-full bg-card border-r border-border transition-all duration-300 z-40 flex flex-col",
        isMobile ? "w-full" : (isCollapsed ? "w-16" : "w-64")
      )}
    >
      {/* Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-border flex-shrink-0">
        <Link href="/admin" className="flex items-center gap-2">
          <img src="/Logo.webp" alt="Aistein.ai Logo" className="w-7 h-7 object-contain" />
          {!isCollapsed && <span className="text-lg font-bold text-foreground">Aistein.ai Admin</span>}
        </Link>
        {!isMobile && (
          <button
            onClick={toggleCollapse}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2">
        {menuItems.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-4">
            {!isCollapsed && (
              <div className="px-4 mb-1">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.title}
                </h3>
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2 mx-2 rounded-lg transition-all group",
                      active
                        ? "bg-primary/10 text-primary border-l-2 border-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className={cn("w-5 h-5 flex-shrink-0", active && "text-primary")} />
                    {!isCollapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{item.label}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {item.description}
                        </div>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
