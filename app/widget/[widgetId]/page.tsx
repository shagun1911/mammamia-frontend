"use client";

import { useState, useEffect } from "react";
import { Send, Minimize2, X, MessageCircle } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useSearchParams, useParams } from "next/navigation";

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  content: string;
  timestamp: string;
}

import { widgetTranslations } from "@/data/mockSettings";

interface WidgetSettings {
  chatbotName: string;
  chatbotAvatar: string | null;
  primaryColor: string;
  welcomeMessage: string;
  language: string;
}

export default function WidgetPage({ params }: { params?: { widgetId?: string } }) {
  const searchParams = useSearchParams();
  const routeParams = useParams();

  // ========== CRITICAL: Resolve widgetId with fallback ==========
  // In Next.js App Router, params might not be available immediately in client components
  // Use useParams() hook as fallback for client components
  const widgetId = params?.widgetId || (routeParams?.widgetId as string) || null;

  // ========== LOG PARAMS AT RENDER TIME ==========
  console.log('[Widget Page] Render - params:', params);
  console.log('[Widget Page] Render - routeParams:', routeParams);
  console.log('[Widget Page] Render - resolved widgetId:', widgetId);

  // ========== FAIL FAST: Throw error if widgetId is missing ==========
  if (!widgetId || widgetId === 'undefined') {
    const error = new Error('widgetId missing from route params');
    console.error('[Widget Page] ❌ CRITICAL ERROR:', error.message);
    console.error('[Widget Page] params:', params);
    console.error('[Widget Page] routeParams:', routeParams);
    throw error;
  }
  const [threadId] = useState(uuidv4());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isAskingName, setIsAskingName] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [widgetSettings, setWidgetSettings] = useState<WidgetSettings>({
    chatbotName: 'AI Assistant',
    chatbotAvatar: null,
    primaryColor: '#6366f1',
    welcomeMessage: '👋 Hello! Before we start, may I know your name?',
    language: 'en'
  });

  // Fetch widget settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
        const response = await fetch(`${API_URL}/settings/widget/${widgetId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const lang = data.data.language || 'en';
            setWidgetSettings({
              chatbotName: data.data.chatbotName || 'AI Assistant',
              chatbotAvatar: data.data.chatbotAvatar || null,
              primaryColor: data.data.primaryColor || '#6366f1',
              welcomeMessage: data.data.welcomeMessage || widgetTranslations[lang]?.askName || widgetTranslations.en.askName,
              language: lang
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch widget settings:', error);
      }
    };
    fetchSettings();
  }, [widgetId]);

  // Get collection from URL parameter (optional - backend will use Settings if not provided)
  useEffect(() => {
    const collectionParam = searchParams.get('collection');
    if (collectionParam) {
      setSelectedCollection(collectionParam);
    }
    // Widget uses knowledge base from Settings via backend endpoint
    // No need to fetch collections directly from Python API
  }, [searchParams]);

  // Send welcome message asking for name
  // Send welcome message asking for name
  useEffect(() => {
    if (isAskingName) {
      setMessages(prev => {
        const welcomeMsgExists = prev.some(m => m.id === "welcome");

        if (!welcomeMsgExists) {
          // Add new welcome message
          return [
            {
              id: "welcome",
              sender: "bot",
              content: widgetSettings.welcomeMessage,
              timestamp: new Date().toISOString(),
            },
            ...prev
          ];
        } else {
          // Update existing welcome message
          return prev.map(m =>
            m.id === "welcome"
              ? { ...m, content: widgetSettings.welcomeMessage }
              : m
          );
        }
      });
    }
  }, [widgetSettings.welcomeMessage, isAskingName]);

  // Save conversation to database
  const saveConversation = async (userName: string, message: string, response: string) => {
    try {
      const payload = {
        name: userName,
        threadId: threadId,
        collection: selectedCollection,
        widgetId: widgetId, // Pass widgetId to get organizationId
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
        const data = await res.json();
        if (!conversationId) {
          setConversationId(data.data._id);
        }
      }
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    // If asking for name, save it and continue
    if (isAskingName) {
      const userMessage = {
        id: Date.now().toString(),
        sender: "user" as const,
        content: input,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      const userName = input;
      setUserName(userName);
      setIsAskingName(false);
      setInput("");

      // Localized name confirmation messages
      const nameConfirmations: Record<string, string> = {
        en: "Nice to meet you, {name}! How can I help you today?",
        es: "¡Mucho gusto, {name}! ¿Cómo puedo ayudarte hoy?",
        fr: "Enchanté, {name}! Comment puis-je vous aider aujourd'hui?",
        de: "Freut mich, Sie kennenzulernen, {name}! Wie kann ich Ihnen heute helfen?",
        it: "Piacere di conoscerti, {name}! Come posso aiutarti oggi?",
        pt: "Prazer em conhecê-lo, {name}! Como posso ajudar você hoje?",
        ar: "تشرفت بمقابلتك يا {name}! كيف يمكنني مساعدتك اليوم؟",
        tr: "Tanıştığımıza memnun oldum {name}! Bugün size nasıl yardımcı olabilirim?",
        zh: "很高兴见到你，{name}！今天我能为你做些什么？",
        ja: "{name}さん、はじめまして！今日はどのようなお手伝いができますか？",
        ko: "{name}님, 만나서 반갑습니다! 오늘 어떻게 도와드릴까요?",
      };

      const template = nameConfirmations[widgetSettings.language] || nameConfirmations.en;
      const greetingText = template.replace("{name}", userName);

      setTimeout(() => {
        const greeting = {
          id: (Date.now() + 1).toString(),
          sender: "bot" as const,
          content: greetingText,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, greeting]);
      }, 500);

      // Save initial conversation with name to database
      await saveConversation(userName, userName, greetingText);
      return;
    }

    // Normal chat flow
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
      let botResponseText = "";

      // Use backend chatbot endpoint which handles API keys, WooCommerce, and knowledge base settings
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
      const response = await fetch(`${API_URL}/chatbot/widget/${widgetId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userQuery,
          threadId: threadId,
          ...(selectedCollection && { knowledgeBaseId: selectedCollection })
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errMsg = data.error?.message || data.message || data.error?.detail || 'Failed to get response';
        throw new Error(errMsg);
      }

      botResponseText = data.data?.answer || data.answer || "I'm having trouble connecting right now. Please try again later.";

      // Check if Python backend returned an error message as the answer
      if (botResponseText.toLowerCase().includes('encountered an error') ||
        botResponseText.toLowerCase().includes('error while generating')) {
        console.error('[Widget] Python backend returned error message:', botResponseText);
        console.error('[Widget] Response data:', JSON.stringify(data, null, 2));
        // Keep the error message but log it for debugging
      }

      const botMessage = {
        id: (Date.now() + 1).toString(),
        sender: "bot" as const,
        content: botResponseText,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMessage]);

      // Save conversation to database if we have a name
      if (userName) {
        await saveConversation(userName, userQuery, botResponseText);
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorContent = error?.message || "I'm having trouble connecting right now. Please try again later.";
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        sender: "bot" as const,
        content: errorContent,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          style={{ backgroundColor: widgetSettings.primaryColor }}
          className="w-16 h-16 hover:brightness-110 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110"
        >
          {widgetSettings.chatbotAvatar ? (
            <img src={widgetSettings.chatbotAvatar} alt="Chat" className="w-12 h-12 rounded-full" />
          ) : (
            <MessageCircle className="w-8 h-8 text-white" />
          )}
        </button>
      </div>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          style={{ backgroundColor: widgetSettings.primaryColor }}
          className="flex items-center gap-3 px-5 py-4 hover:brightness-110 rounded-full shadow-2xl transition-all hover:scale-105"
        >
          {widgetSettings.chatbotAvatar ? (
            <img src={widgetSettings.chatbotAvatar} alt="Chat" className="w-8 h-8 rounded-full" />
          ) : (
            <MessageCircle className="w-6 h-6 text-white" />
          )}
          <span className="text-white font-semibold">{widgetSettings.chatbotName}</span>
          {messages.filter(m => m.sender === "bot").length > 1 && (
            <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm z-50">
      <div className="w-full max-w-md h-[600px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div style={{ backgroundColor: widgetSettings.primaryColor }} className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center overflow-hidden">
              {widgetSettings.chatbotAvatar ? (
                <img src={widgetSettings.chatbotAvatar} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <MessageCircle className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-white font-semibold">{widgetSettings.chatbotName}</h3>
              <p className="text-white/80 text-xs">
                {widgetTranslations[widgetSettings.language]?.online || widgetTranslations.en.online}
                •
                {widgetTranslations[widgetSettings.language]?.ready || widgetTranslations.en.ready}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(true)}
              className="w-8 h-8 hover:bg-white/10 rounded-lg flex items-center justify-center transition-colors"
            >
              <Minimize2 className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                // If inside an iframe, notify parent to close
                if (window.self !== window.top) {
                  window.parent.postMessage('AISTEIN_WIDGET_CLOSE', '*');
                }
              }}
              className="w-8 h-8 hover:bg-white/10 rounded-lg flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.sender === "user"
                  ? "text-white shadow-md"
                  : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md"
                  }`}
                style={message.sender === "user" ? { backgroundColor: widgetSettings.primaryColor } : {}}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${message.sender === "user" ? "text-white/70" : "text-gray-500 dark:text-gray-400"
                    }`}
                >
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
          {isSending && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-700 rounded-2xl px-4 py-3 shadow-md">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={widgetTranslations[widgetSettings.language]?.placeholder || widgetTranslations.en.placeholder}
              rows={1}
              className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              style={{ minHeight: "44px", maxHeight: "120px" }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              style={{ backgroundColor: !input.trim() || isSending ? '#9ca3af' : widgetSettings.primaryColor }}
              className="w-11 h-11 hover:brightness-110 text-white rounded-xl flex items-center justify-center transition-all disabled:cursor-not-allowed disabled:opacity-50 shrink-0"
            >
              {isSending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Powered by */}
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Powered by <span className="font-semibold" style={{ color: widgetSettings.primaryColor }}>Aistein-It</span>
          </p>
        </div>
      </div>
    </div>
  );
}

