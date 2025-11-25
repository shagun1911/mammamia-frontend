"use client";

import { useState, useEffect } from "react";
import { RotateCcw, Send, Minimize2, Database } from "lucide-react";
import { mockChatbotSettings } from "@/data/mockSettings";
import { pythonRagService } from "@/services/pythonRag.service";
import { useKnowledgeBase } from "@/contexts/KnowledgeBaseContext";
import { useSettings } from "@/hooks/useSettings";
import { v4 as uuidv4 } from "uuid";

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  content: string;
  timestamp: string;
  retrieved_docs?: string[];
}

export function WidgetSimulator() {
  const { collections, selectedCollection, setSelectedCollection, chatAgentPrompt, loadCollections } = useKnowledgeBase();
  const { data: dbSettings } = useSettings();
  const [threadId] = useState(uuidv4());
  const [userName, setUserName] = useState("Test User");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "bot",
      content: mockChatbotSettings.welcomeMessages.en,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isReady] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  // Get chatbot settings from database or fallback to mock
  const chatbotName = dbSettings?.chatbotName || mockChatbotSettings.customization.chatbotName;
  const chatbotAvatar = dbSettings?.chatbotAvatar || null;
  const widgetColor = dbSettings?.primaryColor || mockChatbotSettings.customization.widgetColor;

  // Load collections on mount
  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  // Save conversation to backend
  const saveConversation = async (message: string, response: string) => {
    try {
      const payload = {
        name: userName,
        threadId: threadId,
        collection: selectedCollection,
        messages: [
          { role: 'user', content: message, timestamp: new Date() },
          { role: 'bot', content: response, timestamp: new Date() }
        ]
      };

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
      const res = await fetch(`${API_URL}/conversations/widget`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        console.log('✅ Conversation saved to database');
      } else {
        console.error('❌ Failed to save conversation:', await res.text());
      }
    } catch (error) {
      console.error('❌ Error saving conversation:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      sender: "user" as const,
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userQuery = input;
    setInput("");
    setIsSending(true);

    try {
      if (selectedCollection) {
        // Use Python RAG for response
        const systemPrompt = `Knowledge base: ${selectedCollection}. Use documents from this collection to answer questions accurately.\n\n${chatAgentPrompt}`;
        
        const response = await pythonRagService.chat({
          query: userQuery,
          collection_name: selectedCollection,
          thread_id: threadId,
          system_prompt: systemPrompt,
          top_k: 5
        });

        const botMessage = {
          id: (Date.now() + 1).toString(),
          sender: "bot" as const,
          content: response.answer,
          timestamp: new Date().toISOString(),
          retrieved_docs: response.retrieved_docs
        };
        setMessages((prev) => [...prev, botMessage]);

        // Save conversation to database
        await saveConversation(userQuery, response.answer);
      } else {
        // Fallback to simulated response if no collection selected
        setTimeout(() => {
          const botMessage = {
            id: (Date.now() + 1).toString(),
            sender: "bot" as const,
            content:
              "Please select a knowledge base collection to enable AI responses. Go to AI Behavior → Knowledge Base to create one.",
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, botMessage]);
        }, 500);
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        sender: "bot" as const,
        content: `Error: ${error.message}. Please ensure Python RAG service is accessible at https://keplerov1-python-production.up.railway.app`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleNewChat = () => {
    setMessages([
      {
        id: "1",
        sender: "bot" as const,
        content: mockChatbotSettings.welcomeMessages.en,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  return (
    <div className="w-1/2 bg-background p-8">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Live Preview</h2>
          <button
            onClick={handleNewChat}
            className="flex items-center gap-2 px-3 py-2 bg-secondary hover:bg-accent text-muted-foreground hover:text-foreground rounded-lg text-sm transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* User Name Input */}
        <div className="bg-card border border-border rounded-lg p-4">
          <label className="text-sm font-medium text-foreground mb-2 block">
            Test User Name
          </label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Enter a test name..."
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Conversations will be saved under this name
          </p>
        </div>

        {/* Collection Selector */}
        <div className="bg-card border border-border rounded-lg p-4">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
            <Database className="w-4 h-4" />
            Knowledge Base
          </label>
          <select
            value={selectedCollection || ''}
            onChange={(e) => setSelectedCollection(e.target.value || null)}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
          >
            <option value="">-- Select Collection (Optional) --</option>
            {collections.map((collection) => (
              <option key={collection.collection_name} value={collection.collection_name}>
                {collection.collection_name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-2">
            {selectedCollection 
              ? `Using RAG with ${selectedCollection}` 
              : 'Select a collection to enable AI-powered responses'}
          </p>
        </div>
      </div>

      {/* Status indicator */}
      <div className="flex items-center justify-center mb-8">
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-full ${
            isReady
              ? "bg-green-500/20 text-green-500"
              : "bg-yellow-500/20 text-yellow-500"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
          <span className="text-sm font-medium">
            {isReady
              ? "🤖 Your AI Chatbot is ready!"
              : "💪 Your AI Chatbot is almost ready..."}
          </span>
        </div>
      </div>

      {/* Widget simulator */}
      <div className="max-w-[400px] mx-auto">
        <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[600px]">
          {/* Header */}
          <div 
            className="flex items-center justify-between p-4 border-b border-border" 
            style={{ backgroundColor: widgetColor }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                {chatbotAvatar ? (
                  <img src={chatbotAvatar} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span>{chatbotName.charAt(0)}</span>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {chatbotName}
                </h3>
                <p className="text-xs text-white/80">Online</p>
              </div>
            </div>
            <button className="text-white hover:bg-white/10 p-1 rounded transition-colors">
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
                    message.sender === "user"
                      ? "text-white rounded-br-sm"
                      : "bg-secondary text-foreground rounded-bl-sm"
                  }`}
                  style={message.sender === "user" ? { backgroundColor: widgetColor } : {}}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type your message..."
                className="flex-1 bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isSending}
                style={{ backgroundColor: widgetColor }}
                className="w-10 h-10 hover:brightness-110 text-white rounded-lg flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

