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
import { MessageSquare, Activity } from "lucide-react";

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
      return { channel: channelMap[channel] || channel };
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

  // Listen for new conversations via WebSocket
  useEffect(() => {
    if (!socket) return;

    console.log('[ConversationsPage] Setting up WebSocket listeners...');

    const handleNewConversation = (data: any) => {
      console.log('[ConversationsPage] 🆕 New conversation received:', data);
      
      // Show toast notification
      toast.success('New conversation created!', {
        description: `From ${data.customerId?.name || 'Unknown'}`
      });
      
      // Invalidate conversations query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      
      console.log('[ConversationsPage] ✅ Invalidated conversations query');
    };

    const handleTranscriptUpdated = (data: any) => {
      console.log('[ConversationsPage] 📝 Transcript updated:', data);
      
      // Show toast notification
      toast.success('Call transcript ready!');
      
      // Invalidate conversations query to show updated data
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      
      // If this conversation is currently selected, invalidate it too
      if (data.conversationId === selectedConversationId) {
        queryClient.invalidateQueries({ queryKey: ['conversation', data.conversationId] });
      }
    };

    // Subscribe to events
    socket.onNewConversation(handleNewConversation);
    socket.onTranscriptUpdated(handleTranscriptUpdated);

    console.log('[ConversationsPage] ✅ WebSocket listeners registered');

    // Cleanup
    return () => {
      console.log('[ConversationsPage] 🧹 Cleaning up WebSocket listeners');
      socket.off('conversation:new', handleNewConversation);
      socket.off('conversation:transcript-updated', handleTranscriptUpdated);
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
      <div className="h-20 px-8 flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/5 via-primary/3 to-transparent backdrop-blur-sm shadow-sm flex-shrink-0 z-10">
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

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Column 1 - Filters */}
        <ConversationFilters onFilterChange={setFilter} />

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
