"use client";

import { AgentList } from "@/components/agents/AgentList";
import { TrainingSidebar } from "@/components/training/TrainingSidebar";
import { useSidebar } from "@/contexts/SidebarContext";
import { Bot, Activity } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";

export default function AgentsPage() {
  const { getSidebarWidth } = useSidebar();

  return (
    <div
      className="fixed inset-0 flex flex-col transition-all duration-300"
      style={{ left: `${getSidebarWidth()}px` }}
    >
      {/* Header */}
      <div className="h-20 px-6 lg:px-8 flex items-center justify-between border-b border-border/60 bg-gradient-to-br from-background via-background to-primary/[0.02] backdrop-blur-xl flex-shrink-0 z-10 min-w-0">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2 truncate">
              Agents
              <Activity className="w-5 h-5 text-primary/80 shrink-0" />
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5 truncate">
              Create and manage AI agents with custom configurations
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <LanguageSwitcher />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        <TrainingSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-6">
            <div className="max-w-7xl mx-auto w-full">
              <AgentList />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
