"use client";

import { useState, useMemo, useEffect } from "react";
import { Bookmark, Folder, Tag, MoreVertical, X, Phone, UserPlus, MessageSquare } from "lucide-react";
import { Conversation } from "@/data/mockConversations";
import { MessageThread } from "./MessageThread";
import { ManualControlPanel } from "./ManualControlPanel";
import { SendMessageModal } from "./SendMessageModal";
import { FolderSelectModal } from "./FolderSelectModal";
import { useUpdateConversationStatus, useAssignOperator, useMoveToFolder } from "@/hooks/useConversations";
import { toast } from "sonner";
import { useSocket } from "@/hooks/useSocket";

interface ConversationDetailProps {
  conversation: Conversation;
  onClose: () => void;
}

export function ConversationDetail({
  conversation,
  onClose,
}: ConversationDetailProps) {
  const [isManualControl, setIsManualControl] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showAssignMenu, setShowAssignMenu] = useState(false);
  const [showChannelsMenu, setShowChannelsMenu] = useState(false);
  const [sendMessageModalOpen, setSendMessageModalOpen] = useState(false);
  const [folderSelectModalOpen, setFolderSelectModalOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<'sms' | 'whatsapp' | null>(null);
  const [realtimeMessages, setRealtimeMessages] = useState<any[]>([]);
  const [isFetchingTranscript, setIsFetchingTranscript] = useState(false);
  
  const updateStatus = useUpdateConversationStatus();
  const assignOperator = useAssignOperator();
  const moveToFolder = useMoveToFolder();
  const { socket, isConnected } = useSocket();

  // Debug: Log conversation metadata
  useEffect(() => {
    console.log('[ConversationDetail] Conversation loaded:', {
      id: conversation.id,
      channel: conversation.channel,
      // @ts-ignore
      metadata: conversation.metadata,
      // @ts-ignore
      hasCallerId: !!conversation.metadata?.callerId
    });
  }, [conversation]);

  // Listen for real-time messages
  useEffect(() => {
    if (!socket || !conversation.id) return;

    console.log(`[Real-time] Joining conversation room: ${conversation.id}`);
    
    // Join this conversation's room
    socket.joinConversation(conversation.id);

    // Listen for new messages
    const handleNewMessage = (data: any) => {
      console.log('[Real-time] New message received:', data);
      setRealtimeMessages(prev => [...prev, data]);
      // Show notification
      if (data.sender === 'ai') {
        toast.success('AI replied to the conversation');
      } else if (data.sender === 'customer') {
        toast.info('New customer message received');
      }
    };

    socket.onMessageReceived(handleNewMessage);

    return () => {
      socket.off('message-received', handleNewMessage);
    };
  }, [socket, conversation.id]);

  // Merge real-time messages with conversation messages
  const allMessages = useMemo(() => {
    const existing = conversation.messages || [];
    return [...existing, ...realtimeMessages];
  }, [conversation.messages, realtimeMessages]);

  const handleTakeControl = () => {
    setIsManualControl(true);
  };

  const handleReleaseControl = () => {
    setIsManualControl(false);
  };

  const handleSendMessage = async (message: string, isInternal: boolean) => {
    try {
      console.log("Send message:", message, "Internal:", isInternal);
      
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
      
      const response = await fetch(
        `${API_URL}/conversations/${conversation.id}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            text: message,
            sender: 'operator',
            type: isInternal ? 'internal_note' : 'message'
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      console.log('Message sent successfully:', data);
      toast.success('Message sent!');
      
      // Add message to real-time list instead of full reload
      setRealtimeMessages(prev => [...prev, {
        text: message,
        sender: 'operator',
        timestamp: new Date()
      }]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
    }
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast.success(isBookmarked ? "Bookmark removed" : "Conversation bookmarked");
  };

  const handleAddToFolder = () => {
    setFolderSelectModalOpen(true);
  };

  const handleFolderSelect = (folderId: string | null) => {
    moveToFolder.mutate({
      conversationId: conversation.id,
      folderId: folderId,
    });
  };

  const handleCloseConversation = () => {
    if (confirm("Close this conversation?")) {
      updateStatus.mutate({
        conversationId: conversation.id,
        status: "closed",
      }, {
        onSuccess: () => {
          onClose();
        }
      });
    }
  };

  const handleAssignToSelf = () => {
    // Get current user ID from localStorage or context
    const userId = localStorage.getItem("userId") || "self";
    assignOperator.mutate({
      conversationId: conversation.id,
      operatorId: userId,
    });
    setShowAssignMenu(false);
  };

  const handleChannelSelect = (channel: 'sms' | 'whatsapp') => {
    setSelectedChannel(channel);
    setSendMessageModalOpen(true);
    setShowChannelsMenu(false);
  };

  const handleFetchTranscript = async () => {
    // @ts-ignore - metadata.callerId may exist
    const callerId = conversation.metadata?.callerId;
    
    if (!callerId) {
      toast.error('No caller ID found for this conversation');
      return;
    }

    setIsFetchingTranscript(true);
    
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
      
      const response = await fetch(
        `${API_URL}/conversations/transcript/${callerId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch transcript');
      }

      const data = await response.json();
      console.log('Transcript fetched successfully:', data);
      toast.success('Transcript loaded! Refreshing...');
      
      // Reload the page to show updated transcript
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Error fetching transcript:', error);
      toast.error(error.message || 'Failed to fetch transcript');
    } finally {
      setIsFetchingTranscript(false);
    }
  };

  // Convert messages to the format expected by MessageThread
  const messages = useMemo(() => {
    // @ts-ignore - messages may come from API with different structure
    if (conversation.messages && Array.isArray(conversation.messages) && conversation.messages.length > 0) {
      // @ts-ignore
      return conversation.messages.map((msg: any) => ({
        id: msg._id || msg.id,
        sender: (msg.sender === 'customer' || msg.sender === 'user' ? 'customer' : 'agent') as 'customer' | 'agent',
        content: msg.text || msg.content,
        timestamp: msg.timestamp || msg.createdAt || new Date().toISOString(),
        type: 'text' as const,
      }));
    }
    
    // Fallback to transcript if no messages
    // @ts-ignore - transcript may exist on conversation
    if (conversation.transcript) {
      // @ts-ignore
      const transcript = conversation.transcript;
      const transcriptMessages = [];
      
      // Parse transcript object and convert to message format
      // Transcript format can be:
      // 1. { items: [{ type: "message", role: "user", content: [...] }] } - New Python service format
      // 2. { "0": { role: "user", content: "..." }, "1": { role: "assistant", content: "..." } }
      // 3. Array: [{ role: "user", content: "..." }, { role: "assistant", content: "..." }]
      
      // Handle new Python service format with items array
      if (transcript.items && Array.isArray(transcript.items)) {
        for (let i = 0; i < transcript.items.length; i++) {
          const item = transcript.items[i];
          // Only process message items, skip function calls and other types
          if (item && item.type === 'message' && item.role && item.content) {
            const role = item.role;
            const content = Array.isArray(item.content) ? item.content.join(' ') : item.content;
            transcriptMessages.push({
              id: item.id || `transcript-${i}`,
              sender: (role === 'user' || role === 'customer' ? 'customer' : 'agent') as 'customer' | 'agent',
              content,
              timestamp: conversation.timestamp || new Date().toISOString(),
              type: 'text' as const,
            });
          }
        }
      }
      // Handle old array format
      else if (Array.isArray(transcript)) {
        for (let i = 0; i < transcript.length; i++) {
          const item = transcript[i];
          if (item && (item.role || item.sender) && (item.content || item.text || item.message)) {
            const role = item.role || item.sender;
            const content = item.content || item.text || item.message;
            transcriptMessages.push({
              id: `transcript-${i}`,
              sender: (role === 'user' || role === 'customer' ? 'customer' : 'agent') as 'customer' | 'agent',
              content,
              timestamp: item.timestamp || conversation.timestamp || new Date().toISOString(),
              type: 'text' as const,
            });
          }
        }
      } else if (typeof transcript === 'object') {
        const keys = Object.keys(transcript).sort((a, b) => {
          const aNum = parseInt(a);
          const bNum = parseInt(b);
          return isNaN(aNum) || isNaN(bNum) ? 0 : aNum - bNum;
        });
        
        for (const key of keys) {
          const item = transcript[key];
          if (item && (item.role || item.sender) && (item.content || item.text || item.message)) {
            const role = item.role || item.sender;
            const content = item.content || item.text || item.message;
            transcriptMessages.push({
              id: `transcript-${key}`,
              sender: (role === 'user' || role === 'customer' ? 'customer' : 'agent') as 'customer' | 'agent',
              content,
              timestamp: item.timestamp || conversation.timestamp || new Date().toISOString(),
              type: 'text' as const,
            });
          }
        }
      }
      
      if (transcriptMessages.length > 0) {
        return transcriptMessages;
      }
    }
    
    // Final fallback to conversation.messages if it exists
    return conversation.messages || [];
  }, [conversation]);

  return (
    <div className="flex-1 bg-background flex flex-col">
      {/* Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-border">
        {/* Left side - Avatar and name */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-foreground font-semibold text-sm"
            style={{ backgroundColor: conversation.customer.color }}
          >
            {conversation.customer.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">
                {conversation.customer.name}
              </h3>
              {/* @ts-ignore */}
              {conversation.transcript && (
                <span className="flex items-center gap-1 text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                  <Phone className="w-3 h-3" />
                  Call Transcript
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{conversation.customer.email}</p>
          </div>
        </div>

        {/* Right side - Action icons */}
        <div className="flex items-center gap-3">
          {/* Channels Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowChannelsMenu(!showChannelsMenu)}
              className="hover:text-foreground transition-colors text-muted-foreground"
              title="Send via Channel"
            >
              <MessageSquare className="w-[18px] h-[18px]" />
            </button>
            {showChannelsMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-lg shadow-lg py-1 z-50">
                <button
                  onClick={() => handleChannelSelect('whatsapp')}
                  className="w-full px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors text-left flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Send via WhatsApp
                </button>
                <button
                  onClick={() => handleChannelSelect('sms')}
                  className="w-full px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors text-left flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Send via SMS
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleBookmark}
            className={`hover:text-foreground transition-colors ${
              isBookmarked ? "text-yellow-500" : "text-muted-foreground"
            }`}
            title="Bookmark"
          >
            <Bookmark className={`w-[18px] h-[18px] ${isBookmarked ? "fill-current" : ""}`} />
          </button>
          <button
            onClick={handleAddToFolder}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Add to folder"
          >
            <Folder className="w-[18px] h-[18px]" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowAssignMenu(!showAssignMenu)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Actions"
            >
              <UserPlus className="w-[18px] h-[18px]" />
            </button>
            {showAssignMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-10">
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-border">
                  Send Message
                </div>
                <button
                  onClick={() => {
                    handleChannelSelect('whatsapp');
                    setShowAssignMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Send via WhatsApp
                </button>
                <button
                  onClick={() => {
                    handleChannelSelect('sms');
                    setShowAssignMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Send via SMS
                </button>
                
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground border-t border-b border-border mt-1">
                  Assign To
                </div>
                <button
                  onClick={handleAssignToSelf}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Assign to me
                </button>
                <button
                  onClick={() => {
                    toast.info("Team member selection coming soon");
                    setShowAssignMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Assign to colleague
                </button>
              </div>
            )}
          </div>
          <button
            onClick={handleCloseConversation}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Close conversation"
          >
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>

      {/* Outbound Call Info - Always show if callerId exists */}
      {/* @ts-ignore - metadata may exist */}
      {conversation.metadata?.callerId && (
        <div className="px-4 py-3 bg-blue-500/10 border-b border-blue-500/20">
          <div className="flex flex-col gap-2">
            {/* Caller ID */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="w-3 h-3" />
              {/* @ts-ignore */}
              <span>Caller ID: {conversation.metadata.callerId}</span>
            </div>
            
            {/* Fetch Transcript Button */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-foreground">
                {/* @ts-ignore */}
                {conversation.transcript ? 'Transcript loaded. Click to refresh.' : 'Click to fetch transcript and recording'}
              </span>
              <button
                onClick={handleFetchTranscript}
                disabled={isFetchingTranscript}
                className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {/* @ts-ignore */}
                {isFetchingTranscript ? 'Loading...' : conversation.transcript ? 'Refresh Transcript' : 'Get Transcript & Recording'}
              </button>
            </div>

            {/* Show call duration and recording if available */}
            {/* @ts-ignore */}
            {conversation.transcript && (
              <div className="flex flex-col gap-1 pt-2 border-t border-blue-500/20">
                {/* @ts-ignore */}
                {conversation.metadata?.duration && (
                  <span className="text-xs text-foreground">
                    {/* @ts-ignore */}
                    Duration: {conversation.metadata.duration}
                  </span>
                )}
                {/* Recording URL */}
                {(() => {
                  // @ts-ignore - metadata may exist
                  const recordingUrl = conversation.metadata?.recording_url;
                  return recordingUrl ? (
                    <a
                      href={recordingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline text-xs"
                    >
                      🎙️ Play Call Recording
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      No recording found
                    </span>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Message thread */}
      <MessageThread
        messages={messages}
        customerColor={conversation.customer.color}
        customerAvatar={conversation.customer.avatar}
      />

      {/* Control panel */}
      <ManualControlPanel
        isManualControl={isManualControl}
        onTakeControl={handleTakeControl}
        onReleaseControl={handleReleaseControl}
        onSendMessage={handleSendMessage}
      />

      {/* Send Message Modal */}
      {selectedChannel && (
        <SendMessageModal
          isOpen={sendMessageModalOpen}
          onClose={() => {
            setSendMessageModalOpen(false);
            setSelectedChannel(null);
          }}
          customerName={conversation.customer.name}
          customerPhone={conversation.customer.phone}
          channel={selectedChannel}
          conversationId={conversation.id}
        />
      )}

      {/* Folder Select Modal */}
      <FolderSelectModal
        isOpen={folderSelectModalOpen}
        onClose={() => setFolderSelectModalOpen(false)}
        onSelect={handleFolderSelect}
        currentFolderId={conversation.folder}
      />
    </div>
  );
}

