"use client";

import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ConversationFilters } from "@/components/conversations/ConversationFilters";
import { ConversationList } from "@/components/conversations/ConversationList";
import { ConversationDetail } from "@/components/conversations/ConversationDetail";
import { useConversations, useConversation } from "@/hooks/useConversations";
import { ConversationListSkeleton } from "@/components/LoadingSkeleton";
import { NoConversations } from "@/components/EmptyState";
import { useSidebar } from "@/contexts/SidebarContext";
import { useSocket } from "@/hooks/useSocket";
import { toast } from "sonner";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";
import { MessageSquare, Activity, MessageCircle, Phone, Instagram, Facebook, Hash } from "lucide-react";

export default function ConversationsPage() {
  const { getSidebarWidth } = useSidebar();
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [filter, setFilter] = useState("all");

  // Parse filter to determine if it's a channel filter
  const getFilterParams = () => {
    if (filter.startsWith('channel:')) {
      const channel = filter.replace('channel:', '');
      // Map channel names to backend format
      const channelMap: Record<string, string> = {
        'website': 'website',
        'whatsapp': 'whatsapp',
        'instagram': 'social',
        'facebook': 'social',
        'phone': 'phone',
      };
      const backendChannel = channelMap[channel] || channel;
      
      // For Instagram and Facebook, also pass platform in metadata
      if (channel === 'instagram') {
        return { channel: backendChannel, platform: 'instagram' };
      } else if (channel === 'facebook') {
        return { channel: backendChannel, platform: 'facebook' };
      }
      
      return { channel: backendChannel };
    }
    if (filter.startsWith('folder:')) {
      const folderId = filter.replace('folder:', '');
      return { folderId };
    }
    return { status: filter === "all" ? undefined : filter };
  };

  // Fetch conversations from API
  const { data: conversationsData, isLoading, isError, error } = useConversations(getFilterParams());

  // Fetch selected conversation details
  const { data: selectedConversationData } = useConversation(selectedConversationId);

  const conversations = conversationsData?.conversations || [];
  const selectedConversation = selectedConversationData || null;

  // Close selected conversation when filter changes
  useEffect(() => {
    setSelectedConversationId(null);
  }, [filter]);

  // Track which conversations have already shown transcript toast
  const transcriptToastShown = useRef<Set<string>>(new Set());

  // Join organization room and listen for real-time updates
  useEffect(() => {
    if (!socket || !socket.isConnected()) {
      console.log('[ConversationsPage] Socket not connected, skipping setup');
      return;
    }

    console.log('[ConversationsPage] Setting up WebSocket listeners...');

    // Get organization ID from user data
    const userStr = localStorage.getItem('user');
    let organizationId: string | null = null;
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        organizationId = user.organizationId || user.id; // Fallback to user ID if no org ID
      } catch (e) {
        console.error('[ConversationsPage] Failed to parse user data:', e);
      }
    }

    // Join organization room if we have an ID
    if (organizationId) {
      try {
        socket.joinOrganization(organizationId);
        console.log(`[ConversationsPage] Joined organization room: ${organizationId}`);
      } catch (error) {
        console.error('[ConversationsPage] Error joining organization room:', error);
      }
    }

    const handleNewConversation = (data: any) => {
      try {
        console.log('[ConversationsPage] 🆕 New conversation received:', data);
        
        // Show toast notification
        toast.success('New conversation created!', {
          description: `From ${data.customerId?.name || 'Unknown'}`
        });
        
        // Invalidate conversations query to trigger refetch
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        
        console.log('[ConversationsPage] ✅ Invalidated conversations query');
      } catch (error) {
        console.error('[ConversationsPage] Error handling new conversation:', error);
      }
    };

    const handleNewMessage = (data: any) => {
      try {
        console.log('[ConversationsPage] 💬 New message received:', data);
        
        // If this message is for the currently selected conversation, update it
        if (data.conversationId === selectedConversationId) {
          queryClient.invalidateQueries({ queryKey: ['conversation', data.conversationId] });
        }
        
        // Also invalidate conversations list to update last message
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      } catch (error) {
        console.error('[ConversationsPage] Error handling new message:', error);
      }
    };

    const handleBatchConversationsSynced = (data: any) => {
      try {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      } catch (error) {
        console.error('[ConversationsPage] Error handling batch sync event:', error);
      }
    };

    const handleTranscriptUpdated = (data: any) => {
      try {
        console.log('[ConversationsPage] 📝 Transcript updated:', data);
        
        const conversationId = data.conversationId?.toString() || '';
        
        // Only show toast once per conversation, and only when both transcript and audio are ready
        // OR if transcript is ready and we haven't shown toast for this conversation yet
        const hasTranscript = data.hasTranscript === true;
        const hasRecording = data.hasRecording === true;
        const alreadyShown = transcriptToastShown.current.has(conversationId);
        
        // Show toast only if:
        // 1. Transcript is ready
        // 2. We haven't shown toast for this conversation yet
        // 3. Either both transcript and recording are ready, OR we'll show it when transcript is ready (audio might come later)
        if (hasTranscript && !alreadyShown) {
          // Mark as shown immediately to prevent duplicate toasts
          transcriptToastShown.current.add(conversationId);
          
          // Show toast with appropriate message
          if (hasTranscript && hasRecording) {
            toast.success('Call transcript and recording ready!');
          } else {
            toast.success('Call transcript ready!');
          }
          
          console.log('[ConversationsPage] ✅ Transcript toast shown for conversation:', conversationId);
        } else if (hasTranscript && alreadyShown) {
          console.log('[ConversationsPage] ⏭️ Skipping duplicate transcript toast for conversation:', conversationId);
        }
        
        // Invalidate conversations query to show updated data
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        
        // If this conversation is currently selected, invalidate it too
        if (data.conversationId === selectedConversationId) {
          queryClient.invalidateQueries({ queryKey: ['conversation', data.conversationId] });
        }
      } catch (error) {
        console.error('[ConversationsPage] Error handling transcript update:', error);
      }
    };

    // Subscribe to events with error handling
    try {
      socket.onNewConversation(handleNewConversation);
      socket.onNewMessageInOrg(handleNewMessage);
      socket.onTranscriptUpdated(handleTranscriptUpdated);
      socket.onBatchConversationsSynced(handleBatchConversationsSynced);

      console.log('[ConversationsPage] ✅ WebSocket listeners registered');
    } catch (error) {
      console.error('[ConversationsPage] Error registering WebSocket listeners:', error);
    }

    // Cleanup
    return () => {
      try {
        console.log('[ConversationsPage] 🧹 Cleaning up WebSocket listeners');
        socket.off('conversation:new', handleNewConversation);
        socket.off('new-message', handleNewMessage);
        socket.off('conversation:transcript-updated', handleTranscriptUpdated);
        socket.off('batch:conversations-synced', handleBatchConversationsSynced);
      } catch (error) {
        console.error('[ConversationsPage] Error during cleanup:', error);
      }
    };
  }, [socket, queryClient, selectedConversationId]);

  const handleCloseDetail = () => {
    setSelectedConversationId(null);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex flex-col transition-all duration-300" style={{ left: `${getSidebarWidth()}px` }}>
        <div className="h-20 px-8 flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/5 via-primary/3 to-transparent backdrop-blur-sm shadow-sm flex-shrink-0">
          <h1 className="text-2xl font-bold text-foreground">Conversations</h1>
        </div>
        <div className="flex-1 flex overflow-hidden">
          <ConversationFilters onFilterChange={setFilter} />
          <div className="flex-1 p-4 overflow-auto">
            <ConversationListSkeleton count={5} />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="fixed inset-0 flex flex-col transition-all duration-300" style={{ left: `${getSidebarWidth()}px` }}>
        <div className="h-20 px-8 flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/5 via-primary/3 to-transparent backdrop-blur-sm shadow-sm flex-shrink-0">
          <h1 className="text-2xl font-bold text-foreground">Conversations</h1>
        </div>
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          <div className="text-center">
            <h2 className="text-xl font-bold text-destructive mb-2">Error Loading Conversations</h2>
            <p className="text-muted-foreground">{error?.message || 'Failed to load conversations'}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col transition-all duration-300" style={{ left: `${getSidebarWidth()}px` }}>
      {/* Premium Professional Navbar */}
      <div className="h-auto px-8 py-5 flex flex-col gap-5 border-b border-border/60 bg-gradient-to-br from-background via-background to-primary/[0.02] backdrop-blur-xl shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset] flex-shrink-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center shadow-[0_8px_24px_rgba(99,102,241,0.25)] ring-1 ring-primary/20">
                <MessageSquare className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background shadow-lg"></div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
                Conversations
                <Activity className="w-5 h-5 text-primary/80" />
              </h1>
              <p className="text-sm text-muted-foreground/80 mt-1 font-medium">Manage and respond to customer conversations across all channels</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>

        {/* Premium Platform Toggle Buttons */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest mr-1">Platform:</span>
          <div className="flex items-center gap-1.5 bg-card/80 backdrop-blur-sm p-1.5 rounded-xl border border-border/50 shadow-sm">
            <button
              onClick={() => setFilter("all")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                filter === "all"
                  ? "bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg shadow-primary/30 scale-[1.02]"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <Hash className="w-4 h-4" />
              <span>All</span>
            </button>
            <div className="w-px h-7 bg-border/50" />
            <button
              onClick={() => setFilter("channel:website")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                filter === "channel:website"
                  ? "bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg shadow-primary/30 scale-[1.02]"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chatbot</span>
            </button>
            <button
              onClick={() => setFilter("channel:whatsapp")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                filter === "channel:whatsapp"
                  ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30 scale-[1.02]"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={() => setFilter("channel:instagram")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                filter === "channel:instagram"
                  ? "bg-gradient-to-r from-purple-500 via-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/30 scale-[1.02]"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <Instagram className="w-4 h-4" />
              <span>Instagram</span>
            </button>
            <button
              onClick={() => setFilter("channel:facebook")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                filter === "channel:facebook"
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/30 scale-[1.02]"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <Facebook className="w-4 h-4" />
              <span>Facebook</span>
            </button>
            <button
              onClick={() => setFilter("channel:phone")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                filter === "channel:phone"
                  ? "bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg shadow-primary/30 scale-[1.02]"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <Phone className="w-4 h-4" />
              <span>Phone</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Column 1 - Filters */}
        <ConversationFilters onFilterChange={setFilter} selectedFilter={filter} />

        {/* Column 2 - Conversation List */}
        {conversations.length === 0 ? (
          <div className="flex-1 overflow-hidden">
            <NoConversations />
          </div>
        ) : (
          <ConversationList
            conversations={conversations}
            selectedId={selectedConversationId || undefined}
            onSelectConversation={setSelectedConversationId}
          />
        )}

        {/* Column 3 - Detail View */}
        {selectedConversation ? (
          <ConversationDetail
            conversation={selectedConversation}
            onClose={handleCloseDetail}
          />
        ) : conversations.length > 0 ? (
          <div className="flex-1 bg-gradient-to-br from-background via-background to-primary/[0.01] flex items-center justify-center overflow-hidden">
            <div className="text-center max-w-md px-6">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10 flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-primary/10">
                <svg
                  className="w-12 h-12 text-primary/80"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 tracking-tight">
                Select a conversation to view details
              </h3>
              <p className="text-sm text-muted-foreground/80 font-medium">
                Choose a conversation from the list to see messages, customer details, and more
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
