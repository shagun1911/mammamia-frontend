"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { ConversationFilters } from "@/components/conversations/ConversationFilters";
import { ConversationList } from "@/components/conversations/ConversationList";
import { ConversationDetail } from "@/components/conversations/ConversationDetail";
import { useConversations, useConversation } from "@/hooks/useConversations";
import { ConversationListSkeleton } from "@/components/LoadingSkeleton";
import { NoConversations } from "@/components/EmptyState";
import { useSidebar } from "@/contexts/SidebarContext";
import { useSocket } from "@/hooks/useSocket";
import { toast } from "sonner";

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
      <>
        <Header title="Conversations" />
        <div className="fixed inset-0 flex transition-all duration-300" style={{ left: `${getSidebarWidth()}px`, top: "80px" }}>
          <ConversationFilters onFilterChange={setFilter} />
          <div className="flex-1 p-4">
            <ConversationListSkeleton count={5} />
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (isError) {
    return (
      <>
        <Header title="Conversations" />
        <div className="fixed inset-0 flex items-center justify-center transition-all duration-300" style={{ left: `${getSidebarWidth()}px`, top: "80px" }}>
          <div className="text-center">
            <h2 className="text-xl font-bold text-destructive mb-2">Error Loading Conversations</h2>
            <p className="text-muted-foreground">{error?.message || 'Failed to load conversations'}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Conversations" />
      <div className="fixed inset-0 flex transition-all duration-300" style={{ left: `${getSidebarWidth()}px`, top: "80px" }}>
        {/* Column 1 - Filters */}
        <ConversationFilters onFilterChange={setFilter} />

        {/* Column 2 - Conversation List */}
        {conversations.length === 0 ? (
          <div className="flex-1">
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
        ) : (
          <div className="flex-1 bg-background flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">
                Select a conversation to view details
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
