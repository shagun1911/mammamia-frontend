"use client";

import { useState, useEffect } from "react";
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

    const handleTranscriptUpdated = (data: any) => {
      try {
        console.log('[ConversationsPage] 📝 Transcript updated:', data);
        
        // Show toast notification
        toast.success('Call transcript ready!');
        
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
      {/* Enhanced Professional Navbar */}
      <div className="h-auto px-8 py-4 flex flex-col gap-4 border-b border-border bg-gradient-to-r from-primary/5 via-primary/3 to-transparent backdrop-blur-sm shadow-sm flex-shrink-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                Conversations
                <Activity className="w-5 h-5 text-primary" />
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">Manage and respond to customer conversations</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>

        {/* Platform Toggle Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-2">Platform:</span>
          <div className="flex items-center gap-2 bg-secondary/50 p-1 rounded-lg border border-border">
            <button
              onClick={() => setFilter("all")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === "all"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <Hash className="w-4 h-4" />
              <span>All</span>
            </button>
            <div className="w-px h-6 bg-border" />
            <button
              onClick={() => setFilter("channel:website")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === "channel:website"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chatbot</span>
            </button>
            <button
              onClick={() => setFilter("channel:whatsapp")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === "channel:whatsapp"
                  ? "bg-green-500 text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={() => setFilter("channel:instagram")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === "channel:instagram"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <Instagram className="w-4 h-4" />
              <span>Instagram</span>
            </button>
            <button
              onClick={() => setFilter("channel:facebook")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === "channel:facebook"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <Facebook className="w-4 h-4" />
              <span>Facebook</span>
            </button>
            <button
              onClick={() => setFilter("channel:phone")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === "channel:phone"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
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
          <div className="flex-1 bg-background flex items-center justify-center overflow-hidden">
            <div className="text-center max-w-md px-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Select a conversation to view details
              </h3>
              <p className="text-sm text-muted-foreground">
                Choose a conversation from the list to see messages, customer details, and more
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
