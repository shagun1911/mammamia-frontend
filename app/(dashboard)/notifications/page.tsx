"use client";

import { Bell, MessageSquare, Users, Zap, Settings, Activity } from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";

export default function NotificationsPage() {
  const { getSidebarWidth } = useSidebar();
  const notifications = [
    {
      id: "1",
      type: "conversation",
      icon: MessageSquare,
      title: "New conversation from Sarah Johnson",
      description: "WhatsApp message received",
      time: "5 minutes ago",
      unread: true,
    },
    {
      id: "2",
      type: "team",
      icon: Users,
      title: "New team member added",
      description: "John Smith joined your team",
      time: "1 hour ago",
      unread: true,
    },
    {
      id: "3",
      type: "automation",
      icon: Zap,
      title: "Automation triggered",
      description: "Cart abandoned workflow sent 15 messages",
      time: "2 hours ago",
      unread: false,
    },
    {
      id: "4",
      type: "system",
      icon: Settings,
      title: "System update completed",
      description: "New features are now available",
      time: "1 day ago",
      unread: false,
    },
  ];

  return (
    <div className="fixed inset-0 flex flex-col transition-all duration-300" style={{ left: `${getSidebarWidth()}px` }}>
      {/* Enhanced Professional Navbar */}
      <div className="h-20 px-8 flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/5 via-primary/3 to-transparent backdrop-blur-sm shadow-sm flex-shrink-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20 relative">
            <Bell className="w-6 h-6 text-white" />
            {notifications.filter((n) => n.unread).length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                {notifications.filter((n) => n.unread).length}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              Notifications
              <Activity className="w-5 h-5 text-primary" />
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {notifications.filter((n) => n.unread).length} unread notification{notifications.filter((n) => n.unread).length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-5 py-2.5 bg-secondary hover:bg-accent text-foreground rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md cursor-pointer">
            Mark all as read
          </button>
          <LanguageSwitcher />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8">

          <div className="space-y-4">
            {notifications.map((notification) => {
              const Icon = notification.icon;
              return (
                <div
                  key={notification.id}
                  className={`bg-card border rounded-xl p-5 transition-all cursor-pointer hover:shadow-lg ${
                    notification.unread
                      ? "border-primary/50 shadow-md bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-all ${
                        notification.unread 
                          ? "bg-gradient-to-br from-primary to-primary/80" 
                          : "bg-secondary"
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${
                          notification.unread ? "text-white" : "text-muted-foreground"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          className={`text-base font-semibold ${
                            notification.unread ? "text-foreground" : "text-secondary-foreground"
                          }`}
                        >
                          {notification.title}
                        </h3>
                        {notification.unread && (
                          <span className="w-2.5 h-2.5 bg-primary rounded-full shrink-0 mt-2 animate-pulse" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                        {notification.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-3 font-medium">
                        {notification.time}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
