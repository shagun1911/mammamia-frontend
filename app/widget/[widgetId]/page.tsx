"use client";

import { useState, useEffect } from "react";
import { Send, Minimize2, X, MessageCircle } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useSearchParams, useParams } from "next/navigation";
import { widgetTranslations } from "@/data/mockSettings";

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  content: string;
  timestamp: string;
}

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

  const isEmbedded =
    typeof window !== "undefined" && window.self !== window.top;

  const widgetId =
    params?.widgetId || (routeParams?.widgetId as string) || null;

  if (!widgetId) {
    throw new Error("widgetId missing from route params");
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

  const [widgetSettings, setWidgetSettings] = useState<WidgetSettings>({
    chatbotName: "AI Assistant",
    chatbotAvatar: null,
    primaryColor: "#6366f1",
    welcomeMessage: "👋 Hello! Before we start, may I know your name?",
    language: "en",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

        const response = await fetch(`${API_URL}/settings/widget/${widgetId}`);

        if (response.ok) {
          const data = await response.json();

          if (data.success && data.data) {
            const lang = data.data.language || "en";

            setWidgetSettings({
              chatbotName: data.data.chatbotName || "AI Assistant",
              chatbotAvatar: data.data.chatbotAvatar || null,
              primaryColor: data.data.primaryColor || "#6366f1",
              welcomeMessage:
                data.data.welcomeMessage ||
                widgetTranslations[lang]?.askName ||
                widgetTranslations.en.askName,
              language: lang,
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch widget settings:", error);
      }
    };

    fetchSettings();
  }, [widgetId]);

  useEffect(() => {
    const collectionParam = searchParams.get("collection");

    if (collectionParam) {
      setSelectedCollection(collectionParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAskingName) {
      setMessages([
        {
          id: "welcome",
          sender: "bot",
          content: widgetSettings.welcomeMessage,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, [widgetSettings.welcomeMessage]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    if (isAskingName) {
      const name = input;

      setUserName(name);
      setIsAskingName(false);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: "user",
          content: name,
          timestamp: new Date().toISOString(),
        },
      ]);

      setInput("");

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: "bot",
            content: `Nice to meet you, ${name}! How can I help you today?`,
            timestamp: new Date().toISOString(),
          },
        ]);
      }, 500);

      return;
    }

    const userQuery = input;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "user",
        content: userQuery,
        timestamp: new Date().toISOString(),
      },
    ]);

    setInput("");
    setIsSending(true);

    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

      const response = await fetch(
        `${API_URL}/chatbot/widget/${widgetId}/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: userQuery,
            threadId: threadId,
            ...(selectedCollection && { knowledgeBaseId: selectedCollection }),
          }),
        }
      );

      const data = await response.json();

      const answer =
        data.data?.answer ||
        data.answer ||
        "I'm having trouble connecting right now.";

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          content: answer,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error(error);
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

  /* -------- Close widget inside iframe -------- */

  const closeWidget = () => {
    if (isEmbedded) {
      window.parent.postMessage("AISTEIN_WIDGET_CLOSE", "*");
    } else {
      setIsOpen(false);
    }
  };

  const minimizeWidget = () => {
    if (isEmbedded) {
      window.parent.postMessage("AISTEIN_WIDGET_CLOSE", "*");
    } else {
      setIsMinimized(true);
    }
  };

  if (!isOpen) return null;

  if (isMinimized && !isEmbedded) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          style={{ backgroundColor: widgetSettings.primaryColor }}
          className="w-16 h-16 rounded-full shadow-xl flex items-center justify-center"
        >
          {widgetSettings.chatbotAvatar ? (
            <img
              src={widgetSettings.chatbotAvatar}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <MessageCircle className="w-7 h-7 text-white" />
          )}
        </button>
      </div>
    );
  }

  return (
    <div
      className={
        isEmbedded
          ? "w-full h-full"
          : "fixed inset-0 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      }
    >
      <div
        className={
          isEmbedded
            ? "w-full h-full bg-white dark:bg-gray-900 flex flex-col"
            : "w-full max-w-md h-[600px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        }
      >
        {/* Header */}

        <div
          style={{ backgroundColor: widgetSettings.primaryColor }}
          className="p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
              {widgetSettings.chatbotAvatar ? (
                <img
                  src={widgetSettings.chatbotAvatar}
                  className="w-full h-full object-cover"
                />
              ) : (
                <MessageCircle className="w-6 h-6 text-white" />
              )}
            </div>

            <div>
              <h3 className="text-white font-semibold">
                {widgetSettings.chatbotName}
              </h3>
              <p className="text-white/80 text-xs">Online</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={minimizeWidget}
              className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded"
            >
              <Minimize2 className="w-5 h-5 text-white" />
            </button>

            <button
              onClick={closeWidget}
              className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Messages */}

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.sender === "user"
                    ? "text-white"
                    : "bg-white dark:bg-gray-700"
                }`}
                style={
                  msg.sender === "user"
                    ? { backgroundColor: widgetSettings.primaryColor }
                    : {}
                }
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isSending && <div>Thinking...</div>}
        </div>

        {/* Input */}

        <div className="p-4 border-t flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            rows={1}
            className="flex-1 border rounded-xl px-4 py-2"
          />

          <button
            onClick={handleSend}
            disabled={!input.trim()}
            style={{ backgroundColor: widgetSettings.primaryColor }}
            className="w-11 h-11 text-white rounded-xl flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Footer */}

        <div className="px-4 py-2 text-center text-xs text-gray-400 border-t">
          Powered by <span className="font-semibold">Aistein-It</span>
        </div>
      </div>
    </div>
  );
}