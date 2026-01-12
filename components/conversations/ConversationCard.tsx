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
        "h-[72px] px-4 py-3 border-b border-border cursor-pointer transition-colors",
        "hover:bg-accent",
        isSelected && "bg-accent"
      )}
    >
      <div className="flex items-center gap-3 h-full">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0"
          style={{ backgroundColor: conversation.customer.color }}
        >
          {conversation.customer.avatar}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-foreground truncate">
              {conversation.customer.name}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-xs text-muted-foreground">
                {formatTime(conversation.timestamp)}
              </span>
              {isVoiceMessage && (
                <Phone className="w-3.5 h-3.5 text-indigo-400" />
              )}
              {hasRecording && (
                <Mic className="w-3.5 h-3.5 text-green-400" />
              )}
            </div>
          </div>
          <p className="text-[13px] text-muted-foreground truncate">
            {conversation.lastMessage}
          </p>
        </div>
      </div>
    </div>
  );
}

