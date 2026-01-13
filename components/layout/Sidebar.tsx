"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  Brain,
  Zap,
  Users,
  Megaphone,
  FlaskConical,
  BarChart3,
  Settings,
  HelpCircle,
  Bell,
  User,
  ChevronLeft,
  ChevronRight,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage, languageNames, Language } from "@/contexts/LanguageContext";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

interface SidebarProps {
  onCollapseChange?: (collapsed: boolean) => void;
}

const mainNavItems: NavItem[] = [
  { icon: MessageSquare, label: "Conversations", href: "/conversations" },
  { icon: Brain, label: "AI", href: "/ai" },
  { icon: Zap, label: "Automations", href: "/automations" },
  { icon: Users, label: "Contacts", href: "/contacts" },
  { icon: Megaphone, label: "Campaigns", href: "/campaigns" },
  { icon: FlaskConical, label: "Chatbot Test", href: "/chatbot-test" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

const bottomNavItems: NavItem[] = [
  { icon: HelpCircle, label: "Help", href: "/help" },
  { icon: Bell, label: "Notifications", href: "/notifications" },
  { icon: User, label: "Profile", href: "/profile" },
];

export function Sidebar({ onCollapseChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  useEffect(() => {
    if (onCollapseChange) {
      onCollapseChange(isCollapsed);
    }
  }, [isCollapsed, onCollapseChange]);

  const isActive = (href: string) => pathname === href;

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Get user initials for avatar
  const getInitials = (name?: string) => {
    if (!name) return "U";
    const names = name.split(" ");
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out flex flex-col z-50",
        isCollapsed ? "w-[60px]" : "w-[240px]"
      )}
    >
      {/* Top section - Logo */}
      <div className="p-3">
        <div
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm mb-6 transition-all duration-300",
            !isCollapsed && "mx-0"
          )}
        >
          I
        </div>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center h-10 rounded-lg transition-all duration-200 relative min-w-0",
                isCollapsed ? "justify-center px-0" : "px-3 gap-3",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0 flex-shrink-0" />
              {!isCollapsed && (
                <span className="text-sm font-medium truncate min-w-0 flex-1 overflow-hidden">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom navigation */}
      <div className="px-3 space-y-2 pb-3">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center h-10 rounded-lg transition-all duration-200 relative min-w-0",
                isCollapsed ? "justify-center px-0" : "px-3 gap-3",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              {item.icon === User ? (
                <div 
                  className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium shrink-0 flex-shrink-0 overflow-hidden"
                  data-no-translate
                >
                  <span className="text-[10px] leading-none select-none truncate max-w-full">
                    {getInitials(user?.name)}
                  </span>
                </div>
              ) : (
                <Icon className="w-5 h-5 shrink-0 flex-shrink-0" />
              )}
              {!isCollapsed && (
                <span className="text-sm font-medium truncate min-w-0 flex-1 overflow-hidden">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Language Switcher */}
      <div className="border-t border-sidebar-border p-3 relative">
        <button
          onClick={() => setShowLanguageMenu(!showLanguageMenu)}
          className={cn(
            "flex items-center h-10 w-full rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200 min-w-0",
            isCollapsed ? "justify-center px-0" : "px-3 gap-3"
          )}
          title={isCollapsed ? languageNames[language] : undefined}
        >
          <Globe className="w-5 h-5 shrink-0 flex-shrink-0" />
          {!isCollapsed && (
            <span className="text-sm font-medium truncate min-w-0 flex-1 overflow-hidden">{languageNames[language]}</span>
          )}
        </button>

        {/* Language dropdown */}
        {showLanguageMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowLanguageMenu(false)}
            />
            <div className="absolute bottom-full left-3 right-3 mb-2 z-50 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
              {(Object.keys(languageNames) as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    setLanguage(lang);
                    setShowLanguageMenu(false);
                  }}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors",
                    language === lang ? "bg-primary/10 text-primary font-medium" : "text-foreground"
                  )}
                >
                  {languageNames[lang]}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Collapse/Expand button */}
      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={handleToggleCollapse}
          className={cn(
            "flex items-center h-10 w-full rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200 min-w-0",
            isCollapsed ? "justify-center px-0" : "px-3 gap-3"
          )}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 shrink-0 flex-shrink-0" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5 shrink-0 flex-shrink-0" />
              <span className="text-sm font-medium truncate min-w-0 flex-1 overflow-hidden">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
