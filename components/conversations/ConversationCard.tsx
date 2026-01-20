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
          "h-[80px] px-5 py-4 border-b border-border cursor-pointer transition-all duration-200 relative group",
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
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-sm font-semibold text-foreground truncate">
                  {conversation.customer.name}
                </span>
                {isBookmarked && (
                  <BookmarkCheck className="w-3.5 h-3.5 text-yellow-500 shrink-0" fill="currentColor" />
                )}
              </div>
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
                {/* Menu Button - Always Visible */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(!showMenu);
                    }}
                    className={cn(
                      "p-1.5 rounded-lg transition-all",
                      "hover:bg-secondary text-muted-foreground hover:text-foreground",
                      showMenu && "bg-secondary text-foreground"
                    )}
                    title="More options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showMenu && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-xl z-[100] py-1 overflow-hidden">
                      <button
                        onClick={handleAddToFolder}
                        className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-accent flex items-center gap-3 transition-colors"
                      >
                        <Folder className="w-4 h-4 text-primary shrink-0" />
                        <span>Add to folder</span>
                      </button>
                      <button
                        onClick={handleBookmark}
                        disabled={isBookmarking}
                        className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-accent flex items-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            <p className="text-[13px] text-muted-foreground truncate leading-relaxed">
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

