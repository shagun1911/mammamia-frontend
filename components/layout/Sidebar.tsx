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
  Cog,
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
  { icon: Cog, label: "Configuration", href: "/configuration" },
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
        "fixed left-0 top-0 h-screen bg-gradient-to-b from-sidebar via-sidebar to-sidebar/95 border-r border-sidebar-border/60 transition-all duration-300 ease-in-out flex flex-col z-50 shadow-xl",
        isCollapsed ? "w-[60px]" : "w-[240px]"
      )}
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
        backgroundSize: '20px 20px'
      }}></div>

      {/* Top section - Logo */}
      <div className="p-3 relative z-10">
        <div
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm transition-all duration-300 shadow-md",
            isCollapsed ? "mx-auto" : "mx-0"
          )}
        >
          I
        </div>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto relative z-10">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href) || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center h-11 rounded-xl transition-all duration-200 relative min-w-0 group cursor-pointer",
                isCollapsed ? "justify-center px-0" : "px-3 gap-3",
                active
                  ? "bg-gradient-to-r from-primary via-primary/95 to-primary/90 text-primary-foreground shadow-lg shadow-primary/20 ring-2 ring-primary/20"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/80 hover:shadow-md hover:scale-[1.02]"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0 flex-shrink-0" />
              {!isCollapsed && (
                <span className="text-sm font-semibold truncate min-w-0 flex-1 overflow-hidden text-ellipsis">
                  {item.label}
                </span>
              )}
              {active && !isCollapsed && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground/60 animate-pulse shrink-0"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom navigation */}
      <div className="px-3 space-y-2 pb-3 relative z-10">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center h-11 rounded-xl transition-all duration-200 relative min-w-0 group cursor-pointer",
                isCollapsed ? "justify-center px-0" : "px-3 gap-3",
                active
                  ? "bg-gradient-to-r from-primary via-primary/95 to-primary/90 text-primary-foreground shadow-lg shadow-primary/20 ring-2 ring-primary/20"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/80 hover:shadow-md hover:scale-[1.02]"
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
                <span className="text-sm font-semibold truncate min-w-0 flex-1 overflow-hidden text-ellipsis">
                  {item.label}
                </span>
              )}
              {active && !isCollapsed && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground/60 animate-pulse shrink-0"></div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Language Switcher */}
      <div className="border-t border-sidebar-border/60 p-3 relative z-10 bg-sidebar/50 backdrop-blur-sm">
        <button
          onClick={() => setShowLanguageMenu(!showLanguageMenu)}
          className={cn(
            "flex items-center h-11 w-full rounded-xl text-sidebar-foreground hover:bg-sidebar-accent/80 hover:shadow-md hover:scale-[1.02] transition-all duration-200 min-w-0 group cursor-pointer",
            isCollapsed ? "justify-center px-0" : "px-3 gap-3",
            showLanguageMenu && "bg-sidebar-accent/80"
          )}
          title={isCollapsed ? languageNames[language] : undefined}
        >
          <Globe className="w-5 h-5 shrink-0 flex-shrink-0" />
          {!isCollapsed && (
            <span className="text-sm font-semibold truncate min-w-0 flex-1 overflow-hidden text-ellipsis">{languageNames[language]}</span>
          )}
        </button>

        {/* Language dropdown */}
        {showLanguageMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowLanguageMenu(false)}
            />
            <div className="absolute bottom-full left-3 right-3 mb-2 z-50 bg-card border border-border/60 rounded-xl shadow-xl overflow-hidden backdrop-blur-sm">
              {(Object.keys(languageNames) as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    setLanguage(lang);
                    setShowLanguageMenu(false);
                  }}
                  className={cn(
                    "w-full px-4 py-2.5 text-left text-sm hover:bg-accent transition-all duration-200 cursor-pointer",
                    language === lang 
                      ? "bg-gradient-to-r from-primary/15 to-primary/5 text-primary font-semibold border-l-2 border-primary" 
                      : "text-foreground hover:translate-x-1"
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
      <div className="border-t border-sidebar-border/60 p-3 relative z-10 bg-sidebar/50 backdrop-blur-sm">
        <button
          onClick={handleToggleCollapse}
          className={cn(
            "flex items-center h-11 w-full rounded-xl text-sidebar-foreground hover:bg-sidebar-accent/80 hover:shadow-md hover:scale-[1.02] transition-all duration-200 min-w-0 group cursor-pointer",
            isCollapsed ? "justify-center px-0" : "px-3 gap-3"
          )}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 shrink-0 flex-shrink-0" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5 shrink-0 flex-shrink-0" />
              <span className="text-sm font-semibold truncate min-w-0 flex-1 overflow-hidden text-ellipsis">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
