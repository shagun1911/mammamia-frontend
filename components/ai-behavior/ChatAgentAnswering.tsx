"use client";

import { useState, useEffect } from "react";
import { Sparkles, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { useKnowledgeBase } from "@/contexts/KnowledgeBaseContext";
import { RAGChatInterface } from "./RAGChatInterface";
import { toast } from "sonner";

export function ChatAgentAnswering() {
  const { chatAgentPrompt, setChatAgentPrompt } = useKnowledgeBase();
  const [improvements, setImprovements] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const handleSavePrompt = async () => {
    if (improvements.trim()) {
      setChatAgentPrompt(improvements);
      
      // Save to backend
      try {
        const response = await fetch('/api/v1/ai-behavior/chat-agent/prompt', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({ systemPrompt: improvements })
        });
        
        if (response.ok) {
          toast.success('Chat agent prompt saved to database!');
        } else {
          toast.error('Failed to save prompt');
        }
      } catch (error) {
        console.error('Error saving prompt:', error);
      }
    }
  };

  const handleReset = () => {
    const defaultPrompt = "You are a helpful AI assistant. Be friendly and concise.";
    setImprovements(defaultPrompt);
    setChatAgentPrompt(defaultPrompt);
  };

  useEffect(() => {
    setImprovements(chatAgentPrompt);
  }, [chatAgentPrompt]);

  return (
    <div className="space-y-6">
      {/* Toggle between Prompt Config and Chat */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowChat(false)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !showChat
              ? "bg-primary text-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Configure Prompt
        </button>
        <button
          onClick={() => setShowChat(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            showChat
              ? "bg-primary text-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Test Chat (RAG)
        </button>
      </div>

      {!showChat ? (
        <>
          {/* Main Question */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  What would you like to improve?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Describe how you want your AI chat agent to respond to customers
                </p>
              </div>
            </div>

            <textarea
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              placeholder="E.g., Be more friendly and professional, answer questions about pricing clearly, always ask for email before providing quotes..."
              rows={6}
              className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
            />

            <div className="flex justify-end gap-3 mt-4">
              <button 
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Reset
              </button>
              <button 
                onClick={handleSavePrompt}
                className="px-6 py-2 bg-primary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all"
              >
                Save Prompt
              </button>
            </div>
          </div>

          {/* Advanced Section */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="text-sm font-medium text-foreground">Advanced Settings</div>
                <span className="text-xs text-muted-foreground">
                  View the current system prompt
                </span>
              </div>
              {showAdvanced ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>

            {showAdvanced && (
              <div className="px-6 pb-6 pt-2 border-t border-border">
                <p className="text-sm text-muted-foreground mb-4">
                  This is the current system prompt that will be used for your AI chat agent
                </p>
                <div className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-foreground font-mono whitespace-pre-wrap min-h-[200px]">
                  {chatAgentPrompt}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        /* RAG Chat Interface */
        <div className="h-[600px]">
          <RAGChatInterface />
        </div>
      )}
    </div>
  );
}

