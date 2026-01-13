"use client";

import { Message } from "@/data/mockConversations";
import { cn } from "@/lib/utils";
import { Paperclip, Download } from "lucide-react";

interface MessageBubbleProps {
  message: Message & { attachments?: Array<{ type: string; url: string; filename: string; size: number }> };
  customerColor: string;
  customerAvatar: string;
}

export function MessageBubble({
  message,
  customerColor,
  customerAvatar,
}: MessageBubbleProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const isCustomer = message.sender === "customer";

  return (
    <div
      className={cn(
        "flex gap-3",
        isCustomer ? "justify-start" : "justify-end"
      )}
    >
      {/* Avatar for customer messages */}
      {isCustomer && (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0"
          style={{ backgroundColor: customerColor }}
        >
          {customerAvatar}
        </div>
      )}

      {/* Message content */}
      <div className={cn("flex flex-col", isCustomer ? "items-start" : "items-end", "max-w-[70%]")}>
        <div
          className={cn(
            "px-4 py-3 text-foreground text-sm",
            isCustomer
              ? "bg-secondary rounded-[12px_12px_12px_4px]"
              : "bg-primary rounded-[12px_12px_4px_12px]"
          )}
        >
          {message.content}
          
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.attachments.map((attachment, index) => {
                const isImage = attachment.type.startsWith('image/');
                const fileSizeKB = (attachment.size / 1024).toFixed(1);
                
                return (
                  <div
                    key={index}
                    className={cn(
                      "rounded-lg overflow-hidden border",
                      isImage ? "max-w-xs" : "bg-secondary/50 p-2"
                    )}
                  >
                    {isImage ? (
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img
                          src={attachment.url}
                          alt={attachment.filename}
                          className="w-full h-auto max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        />
                      </a>
                    ) : (
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
                      >
                        <Paperclip className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground truncate">{attachment.filename}</p>
                          <p className="text-xs text-muted-foreground">{fileSizeKB} KB</p>
                        </div>
                        <Download className="w-4 h-4 text-muted-foreground" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Timestamp and translate button */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
          {isCustomer && (
            <button className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              Translate
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

