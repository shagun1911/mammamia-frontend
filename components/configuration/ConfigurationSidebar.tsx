"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { href: "/configuration/phone", label: "Phone Settings", icon: Phone },
  { href: "/configuration/chatbot", label: "Chatbot", icon: MessageSquare },
];

export function ConfigurationSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-[260px] bg-card border-r border-border flex flex-col">
      <div className="px-4 py-6">
        <h2 className="text-xl font-bold text-foreground">Configuration</h2>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 h-10 px-3 rounded-md text-sm font-semibold transition-colors cursor-pointer",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground/85 hover:bg-secondary hover:text-foreground"
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
