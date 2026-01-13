"use client";

import { Conversation } from "@/data/mockConversations";
import { Phone, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConversationCardProps {
  conversation: Conversation;
  isSelected?: boolean;
  onClick?: () => void;
}

export function ConversationCard({
  conversation,
  isSelected = false,
  onClick,
}: ConversationCardProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const isVoiceMessage = conversation.messages?.some((m) => m.type === "voice") || conversation.channel === "phone";
  // @ts-ignore - metadata may exist
  const hasRecording = conversation.metadata?.recording_url;

  return (
    <div
      onClick={onClick}
      className={cn(
        "h-[80px] px-5 py-4 border-b border-border cursor-pointer transition-all duration-200",
        "hover:bg-accent/50 hover:shadow-sm",
        isSelected && "bg-accent border-l-4 border-l-primary shadow-sm"
      )}
    >
      <div className="flex items-center gap-3.5 h-full">
        {/* Enhanced Avatar */}
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0 shadow-sm ring-2 ring-background"
          style={{ backgroundColor: conversation.customer.color }}
        >
          {conversation.customer.avatar}
        </div>

        {/* Enhanced Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-foreground truncate">
              {conversation.customer.name}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs text-muted-foreground font-medium">
                {formatTime(conversation.timestamp)}
              </span>
              {isVoiceMessage && (
                <div className="p-1 rounded bg-indigo-500/10">
                  <Phone className="w-3 h-3 text-indigo-500" />
                </div>
              )}
              {hasRecording && (
                <div className="p-1 rounded bg-green-500/10">
                  <Mic className="w-3 h-3 text-green-500" />
                </div>
              )}
            </div>
          </div>
          <p className="text-[13px] text-muted-foreground truncate leading-relaxed">
            {conversation.lastMessage}
          </p>
        </div>
      </div>
    </div>
  );
}

