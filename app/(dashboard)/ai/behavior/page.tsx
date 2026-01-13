"use client";

import { useState } from "react";
import { TrainingSidebar } from "@/components/training/TrainingSidebar";
import { KnowledgeBaseList } from "@/components/knowledge-base/KnowledgeBaseList";
import { ChatAgentAnswering } from "@/components/ai-behavior/ChatAgentAnswering";
import { HumanOperator } from "@/components/ai-behavior/HumanOperator";
import { VoiceAgentAnswering } from "@/components/ai-behavior/VoiceAgentAnswering";
import { VoiceHumanOperator } from "@/components/ai-behavior/VoiceHumanOperator";
import { AIBehaviorLoader } from "@/components/ai-behavior/AIBehaviorLoader";
import { cn } from "@/lib/utils";
import { BookOpen, MessageSquare, Phone } from "lucide-react";

type Section = "knowledge" | "chat-agent" | "voice-agent";
type AgentTab = "answering" | "human-operator";

export default function AIBehaviorPage() {
  const [activeSection, setActiveSection] = useState<Section>("knowledge");
  const [chatAgentTab, setChatAgentTab] = useState<AgentTab>("answering");
  const [voiceAgentTab, setVoiceAgentTab] = useState<AgentTab>("answering");

  return (
    <div className="fixed inset-0 flex" style={{ left: "240px" }}>
      <AIBehaviorLoader />
      <TrainingSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Section Tabs */}
        <div className="border-b border-border bg-card shadow-sm">
          <div className="flex items-center px-6">
            <button
              onClick={() => setActiveSection("knowledge")}
              className={cn(
                "flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors cursor-pointer",
                activeSection === "knowledge"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <BookOpen className="w-4 h-4" />
              Knowledge Base
            </button>
            <button
              onClick={() => setActiveSection("chat-agent")}
              className={cn(
                "flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors cursor-pointer",
                activeSection === "chat-agent"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <MessageSquare className="w-4 h-4" />
              Chat Agent
            </button>
            <button
              onClick={() => setActiveSection("voice-agent")}
              className={cn(
                "flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors cursor-pointer",
                activeSection === "voice-agent"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Phone className="w-4 h-4" />
              Voice Agent
            </button>
            </div>
          </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto w-full p-6">
            {/* Knowledge Base Section */}
            {activeSection === "knowledge" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Knowledge Base</h2>
                  <p className="text-muted-foreground">
                    Create collections and ingest data (URLs, PDFs, Excel files) into Python RAG service
                  </p>
                </div>

                {/* Knowledge Base List with Create & Ingest functionality */}
                <KnowledgeBaseList />
              </div>
            )}

            {/* Chat Agent Section */}
            {activeSection === "chat-agent" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Chat Agent Behavior</h2>
                  <p className="text-muted-foreground">
                    Configure how your AI chat agent responds to customers
                  </p>
                </div>

                {/* Chat Agent Tabs */}
                <div className="flex items-center gap-2 border-b border-border">
                  <button
                    onClick={() => setChatAgentTab("answering")}
                    className={cn(
                      "px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer",
                      chatAgentTab === "answering"
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Answering Behavior
                  </button>
                  <button
                    onClick={() => setChatAgentTab("human-operator")}
                    className={cn(
                      "px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer",
                      chatAgentTab === "human-operator"
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Human Operator
                  </button>
                </div>

                {/* Chat Agent Content */}
                <div className="mt-6">
                  {chatAgentTab === "answering" && <ChatAgentAnswering />}
                  {chatAgentTab === "human-operator" && <HumanOperator />}
                </div>
              </div>
            )}

            {/* Voice Agent Section */}
            {activeSection === "voice-agent" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Voice Agent Behavior</h2>
                  <p className="text-muted-foreground">
                    Configure how your AI voice agent responds to phone calls
                  </p>
                </div>

                {/* Voice Agent Tabs */}
                <div className="flex items-center gap-2 border-b border-border">
                  <button
                    onClick={() => setVoiceAgentTab("answering")}
                    className={cn(
                      "px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer",
                      voiceAgentTab === "answering"
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Answering Behavior
                  </button>
                  <button
                    onClick={() => setVoiceAgentTab("human-operator")}
                    className={cn(
                      "px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer",
                      voiceAgentTab === "human-operator"
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Human Operator
                  </button>
                </div>

                {/* Voice Agent Content */}
                <div className="mt-6">
                  {voiceAgentTab === "answering" && <VoiceAgentAnswering />}
                  {voiceAgentTab === "human-operator" && <VoiceHumanOperator />}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
