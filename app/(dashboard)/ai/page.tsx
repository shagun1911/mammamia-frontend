"use client";

import { useState } from "react";
import { TrainingSidebar } from "@/components/training/TrainingSidebar";
import { KnowledgeBaseList } from "@/components/knowledge-base/KnowledgeBaseList";
import { RAGChatInterface } from "@/components/ai-behavior/RAGChatInterface";
import { VoiceAgentAnswering } from "@/components/ai-behavior/VoiceAgentAnswering";
import { VoiceHumanOperator } from "@/components/ai-behavior/VoiceHumanOperator";
import { AIBehaviorLoader } from "@/components/ai-behavior/AIBehaviorLoader";
import { useSidebar } from "@/contexts/SidebarContext";
import { Phone, BookOpen, Brain, Activity } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";

export default function AIPage() {
  const { getSidebarWidth } = useSidebar();
  const [activeTab, setActiveTab] = useState<"knowledge" | "voice">("knowledge");

  return (
    <div className="fixed inset-0 flex flex-col transition-all duration-300" style={{ left: `${getSidebarWidth()}px` }}>
      {/* Premium Navbar Header */}
      <div className="h-20 px-8 flex items-center justify-between border-b border-border/60 bg-gradient-to-br from-background via-background to-primary/[0.02] backdrop-blur-xl shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset] flex-shrink-0 z-10">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center shadow-[0_8px_24px_rgba(99,102,241,0.25)] ring-1 ring-primary/20">
              <Brain className="w-7 h-7 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
              AI Dashboard
              <Activity className="w-5 h-5 text-primary/80" />
            </h1>
            <p className="text-sm text-muted-foreground/80 mt-1 font-medium">Configure and manage your AI agents</p>
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
        <TrainingSidebar />
        <div className="flex-1 flex flex-col">
          {/* Tab Navigation */}
          <div className="border-b border-border bg-card shadow-sm">
            <div className="flex gap-1 px-6">
            <button
              onClick={() => setActiveTab("knowledge")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative cursor-pointer ${
                activeTab === "knowledge"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Knowledge Base
              {activeTab === "knowledge" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("voice")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative cursor-pointer ${
                activeTab === "voice"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Phone className="w-4 h-4" />
              Voice Agent
              {activeTab === "voice" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto">
          <AIBehaviorLoader />
          {activeTab === "knowledge" && (
            <div className="p-6">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">Knowledge Base</h2>
                <p className="text-muted-foreground">
                  Create and manage knowledge bases for your AI agents. Connect to Python RAG service on port 8000.
                </p>
              </div>
              <KnowledgeBaseList />
            </div>
          )}
          {activeTab === "voice" && (
            <div className="p-6 space-y-6">
              <h2 className="text-2xl font-bold text-foreground mb-4">Voice Agent Configuration</h2>
              <VoiceAgentAnswering />
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
