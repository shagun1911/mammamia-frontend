"use client";

import { Conversation } from "@/data/mockConversations";
import { Phone, Mic, MoreVertical, Folder, Bookmark, BookmarkCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { conversationService } from "@/services/conversation.service";
import { FolderSelectModal } from "./FolderSelectModal";
import { toast } from "@/lib/toast";

interface ConversationCardProps {
  conversation: Conversation;
  isSelected?: boolean;
  onClick?: () => void;
  onUpdate?: () => void;
}

export function ConversationCard({
  conversation,
  isSelected = false,
  onClick,
  onUpdate,
}: ConversationCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState((conversation as any).isBookmarked || false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const isVoiceMessage = conversation.messages?.some((m) => m.type === "voice") || conversation.channel === "phone";
  // @ts-ignore - metadata may exist
  const hasRecording = conversation.metadata?.recording_url;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsBookmarking(true);
      const newBookmarkState = !isBookmarked;
      await conversationService.toggleBookmark(conversation.id, newBookmarkState);
      setIsBookmarked(newBookmarkState);
      toast.success(newBookmarkState ? 'Conversation bookmarked' : 'Bookmark removed');
      setShowMenu(false);
      onUpdate?.();
    } catch (error: any) {
      console.error('Failed to toggle bookmark:', error);
      toast.error(error.message || 'Failed to update bookmark');
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleAddToFolder = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFolderModal(true);
    setShowMenu(false);
  };

  const handleFolderSelect = async (folderId: string | null) => {
    try {
      await conversationService.moveToFolder(conversation.id, folderId);
      toast.success(folderId ? 'Moved to folder' : 'Removed from folder');
      setShowFolderModal(false);
      onUpdate?.();
    } catch (error: any) {
      console.error('Failed to move to folder:', error);
      toast.error(error.message || 'Failed to move to folder');
    }
  };

  return (
    <>
      <div
        onClick={onClick}
        className={cn(
          "h-[88px] px-6 py-5 border-b border-border/50 cursor-pointer transition-all duration-300 relative group",
          "hover:bg-gradient-to-r hover:from-accent/60 hover:to-accent/30 hover:shadow-md hover:border-l-2 hover:border-l-primary/50",
          isSelected && "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-l-4 border-l-primary shadow-[inset_0_0_0_1px_rgba(99,102,241,0.1)]"
        )}
      >
        <div className="flex items-center gap-4 h-full">
          {/* Premium Avatar with Glow */}
          <div className="relative shrink-0">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-lg ring-2 ring-background/50 transition-transform group-hover:scale-105"
              style={{ 
                backgroundColor: conversation.customer.color,
                boxShadow: `0 4px 12px ${conversation.customer.color}40`
              }}
            >
              {conversation.customer.avatar}
            </div>
            {conversation.unread && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-background shadow-lg animate-pulse"></div>
            )}
          </div>

          {/* Premium Content */}
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <span className="text-sm font-bold text-foreground truncate tracking-tight">
                  {conversation.customer.name}
                </span>
                {isBookmarked && (
                  <BookmarkCheck className="w-4 h-4 text-yellow-500 shrink-0 drop-shadow-sm" fill="currentColor" />
                )}
                {conversation.unread && (
                  <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-bold rounded-full">
                    NEW
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground/80 font-semibold tracking-wide">
                  {formatTime(conversation.timestamp)}
                </span>
                {isVoiceMessage && (
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500/20 to-indigo-500/10 border border-indigo-500/20">
                    <Phone className="w-3.5 h-3.5 text-indigo-500" />
                  </div>
                )}
                {hasRecording && (
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500/20 to-green-500/10 border border-green-500/20">
                    <Mic className="w-3.5 h-3.5 text-green-500" />
                  </div>
                )}
                {/* Menu Button - Always Visible */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(!showMenu);
                    }}
                    className={cn(
                      "p-2 rounded-xl transition-all duration-200",
                      "hover:bg-secondary/80 text-muted-foreground hover:text-foreground hover:shadow-sm",
                      showMenu && "bg-secondary text-foreground shadow-sm"
                    )}
                    title="More options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  
                  {/* Premium Dropdown Menu */}
                  {showMenu && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl z-[100] py-2 overflow-hidden ring-1 ring-black/5">
                      <button
                        onClick={handleAddToFolder}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-gradient-to-r hover:from-accent hover:to-accent/50 flex items-center gap-3 transition-all duration-200"
                      >
                        <Folder className="w-4 h-4 text-primary shrink-0" />
                        <span>Add to folder</span>
                      </button>
                      <button
                        onClick={handleBookmark}
                        disabled={isBookmarking}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-gradient-to-r hover:from-accent hover:to-accent/50 flex items-center gap-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isBookmarked ? (
                          <>
                            <BookmarkCheck className="w-4 h-4 text-yellow-500 shrink-0" fill="currentColor" />
                            <span>Remove bookmark</span>
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-4 h-4 text-primary shrink-0" />
                            <span>Bookmark</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <p className="text-[13px] text-muted-foreground/90 truncate leading-relaxed font-medium">
              {conversation.lastMessage}
            </p>
          </div>
        </div>
      </div>

      {/* Folder Select Modal */}
      <FolderSelectModal
        isOpen={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        onSelect={handleFolderSelect}
        currentFolderId={(conversation as any).folder || null}
      />
    </>
  );
}

