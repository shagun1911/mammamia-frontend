"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, MessagesSquare, Users, BarChart3, Globe, Radio, Key, Plug, Share2, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { href: "/settings/profile", label: "Profile & Subscription", icon: UserCircle },

  { href: "/settings/socials", label: "Socials", icon: Share2 },
  { href: "/settings/integrations", label: "Integrations", icon: Plug },

];

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-[260px] bg-card border-r border-border flex flex-col">
      <div className="px-4 py-6">
        <h2 className="text-xl font-bold text-foreground">Settings</h2>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 h-10 px-3 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-foreground"
                  : "text-secondary-foreground hover:bg-secondary"
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

