"use client";

import { useState } from "react";
import { TrainingSidebar } from "@/components/training/TrainingSidebar";
import { KnowledgeBaseList } from "@/components/knowledge-base/KnowledgeBaseList";
import { RAGChatInterface } from "@/components/ai-behavior/RAGChatInterface";
import { ChatAgentAnswering } from "@/components/ai-behavior/ChatAgentAnswering";
import { VoiceAgentAnswering } from "@/components/ai-behavior/VoiceAgentAnswering";
import { HumanOperator } from "@/components/ai-behavior/HumanOperator";
import { VoiceHumanOperator } from "@/components/ai-behavior/VoiceHumanOperator";
import { AIBehaviorLoader } from "@/components/ai-behavior/AIBehaviorLoader";
import { useSidebar } from "@/contexts/SidebarContext";
import { MessageSquare, Phone, BookOpen } from "lucide-react";

export default function AIPage() {
  const { getSidebarWidth } = useSidebar();
  const [activeTab, setActiveTab] = useState<"knowledge" | "chat" | "voice">("knowledge");

  return (
    <div className="fixed inset-0 flex transition-all duration-300" style={{ left: `${getSidebarWidth()}px` }}>
      <TrainingSidebar />
      <div className="flex-1 flex flex-col">
        {/* Tab Navigation */}
        <div className="border-b border-border bg-card">
          <div className="flex gap-1 px-6">
            <button
              onClick={() => setActiveTab("knowledge")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
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
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === "chat"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Chat Agent
              {activeTab === "chat" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("voice")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
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
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Knowledge Base</h2>
                <p className="text-muted-foreground">
                  Create and manage knowledge bases for your AI agents. Connect to Python RAG service on port 8000.
                </p>
              </div>
              <KnowledgeBaseList />
            </div>
          )}
          {activeTab === "chat" && (
            <div className="p-6 space-y-6">
              <h2 className="text-2xl font-bold text-foreground mb-4">Chat Agent Configuration</h2>
              <ChatAgentAnswering />
              <HumanOperator />
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
  );
}
