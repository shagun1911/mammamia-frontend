"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { X, Phone, MessageSquare, Play, Pause, Volume2, Download, ChevronDown, ChevronUp, FileText, Folder, Bookmark, BookmarkCheck } from "lucide-react";
import { Conversation } from "@/data/mockConversations";
import { MessageThread } from "./MessageThread";
import { ManualControlPanel } from "./ManualControlPanel";
import { SendMessageModal } from "./SendMessageModal";
import { FolderSelectModal } from "./FolderSelectModal";
import { cn } from "@/lib/utils";
import { useUpdateConversationStatus, useAssignOperator, useMoveToFolder } from "@/hooks/useConversations";
import { conversationService } from "@/services/conversation.service";
import { toast } from "sonner";
import { useSocket } from "@/hooks/useSocket";
import { useQueryClient } from "@tanstack/react-query";

interface ConversationDetailProps {
  conversation: Conversation;
  onClose: () => void;
}

export function ConversationDetail({
  conversation,
  onClose,
}: ConversationDetailProps) {
  const queryClient = useQueryClient();
  const [isManualControl, setIsManualControl] = useState(false);
  const [sendMessageModalOpen, setSendMessageModalOpen] = useState(false);
  const [folderSelectModalOpen, setFolderSelectModalOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<'sms' | 'whatsapp' | null>(null);
  const [realtimeMessages, setRealtimeMessages] = useState<any[]>([]);
  const [isFetchingTranscript, setIsFetchingTranscript] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState((conversation as any).isBookmarked || false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Update bookmark state when conversation changes
  useEffect(() => {
    const bookmarkState = (conversation as any).isBookmarked || false;
    console.log('[ConversationDetail] Conversation updated, bookmark state:', bookmarkState);
    setIsBookmarked(bookmarkState);
  }, [conversation.id, (conversation as any).isBookmarked]);
  
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

    if (!socket.isConnected()) {
      console.warn('[ConversationDetail] Socket not connected, real-time updates disabled');
      return;
    }

    console.log(`[Real-time] Joining conversation room: ${conversation.id}`);
    
    // Join this conversation's room
    socket.joinConversation(conversation.id);

    // Listen for new messages in this conversation
    const handleMessageReceived = (data: any) => {
      console.log('[Real-time] New message received:', data);
      
      // Normalize IDs to strings for comparison
      const dataConvId = String(data.conversationId || '');
      const currentConvId = String(conversation.id || '');
      
      // Only add if it's for this conversation
      if (dataConvId === currentConvId) {
        // Check if message already exists (avoid duplicates)
        setRealtimeMessages(prev => {
          const exists = prev.some(msg => msg.id === data.id);
          if (exists) {
            console.log('[Real-time] Message already exists, skipping:', data.id);
            return prev;
          }
          
          console.log('[Real-time] Adding new message to state');
          return [...prev, {
            id: data.id,
            text: data.text,
            sender: data.sender === 'operator' ? 'agent' : (data.sender === 'customer' ? 'customer' : 'agent'),
            timestamp: data.timestamp || new Date().toISOString(),
            type: 'text' as const,
            attachments: data.attachments || []
          }];
        });
        
        // Show notification
        if (data.sender === 'ai') {
          toast.success('AI replied to the conversation');
        } else if (data.sender === 'customer') {
          toast.info('New customer message received');
        }
      }
    };

    // Also listen for organization-level new-message events
    const handleNewMessageInOrg = (data: any) => {
      console.log('[Real-time] New message in org:', data);
      
      // Normalize IDs to strings for comparison
      const dataConvId = String(data.conversationId || '');
      const currentConvId = String(conversation.id || '');
      
      // Only handle if it's for this conversation
      if (dataConvId === currentConvId && data.message) {
        const messageData = data.message;
        setRealtimeMessages(prev => {
          const exists = prev.some(msg => msg.id === messageData.id);
          if (exists) return prev;
          
          return [...prev, {
            id: messageData.id,
            text: messageData.text,
            sender: messageData.sender === 'operator' ? 'agent' : (messageData.sender === 'customer' ? 'customer' : 'agent'),
            timestamp: messageData.timestamp || new Date().toISOString(),
            type: 'text' as const,
            attachments: messageData.attachments || []
          }];
        });
      }
    };

    socket.onMessageReceived(handleMessageReceived);
    socket.onNewMessageInOrg(handleNewMessageInOrg);

    return () => {
      socket.off('message-received', handleMessageReceived);
      socket.off('new-message', handleNewMessageInOrg);
      socket.leaveConversation(conversation.id);
    };
  }, [socket, conversation.id]);

  // Auto-fetch transcript for phone calls with caller_id
  useEffect(() => {
    // @ts-ignore
    const callerId = conversation.metadata?.callerId;
    const hasTranscript = conversation.messages && conversation.messages.length > 1; // More than just the initial note
    // @ts-ignore
    const hasRecording = conversation.metadata?.recording_url;
    
    // Only poll if it's a phone call with callerId but no transcript yet
    if (conversation.channel === 'phone' && callerId && !hasTranscript && !hasRecording) {
      console.log('[ConversationDetail] Starting automatic transcript polling for:', callerId);
      
      let pollCount = 0;
      const maxPolls = 60; // Poll for up to 10 minutes (60 * 10 seconds)
      
      const pollTranscript = async () => {
        try {
          const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
          
          console.log(`[ConversationDetail] Polling attempt ${pollCount + 1}/${maxPolls} for callerId: ${callerId}`);
          
          const response = await fetch(
            `${API_URL}/conversations/transcript/${callerId}`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );

          if (response.ok) {
            const data = await response.json();
            console.log('[ConversationDetail] ✅ Transcript found!');
            toast.success('Call transcript ready!');
            
            // Refresh conversation data without page reload
            queryClient.invalidateQueries({ queryKey: ['conversation', conversation.id] });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            
            // Auto-expand transcript section
            setShowTranscript(true);
            
            return true; // Stop polling
          } else if (response.status === 404) {
            // Transcript not ready yet, continue polling
            console.log('[ConversationDetail] Transcript not ready yet, will retry...');
            return false;
          } else {
            console.error('[ConversationDetail] Error fetching transcript:', response.statusText);
            return false;
          }
        } catch (error: any) {
          console.error('[ConversationDetail] Poll error:', error.message);
          return false;
        }
      };
      
      // Initial poll after 5 seconds
      const initialTimeout = setTimeout(async () => {
        const found = await pollTranscript();
        if (found) return;
        
        // Continue polling every 10 seconds
        const interval = setInterval(async () => {
          pollCount++;
          
          if (pollCount >= maxPolls) {
            console.log('[ConversationDetail] Max polls reached, stopping');
            clearInterval(interval);
            return;
          }
          
          const found = await pollTranscript();
          if (found) {
            clearInterval(interval);
          }
        }, 10000); // Poll every 10 seconds
        
        return () => clearInterval(interval);
      }, 5000); // Start after 5 seconds
      
      return () => clearTimeout(initialTimeout);
    }
    // @ts-ignore - metadata may exist
  }, [conversation.id, conversation.channel, conversation.metadata, conversation.messages]);

  // Merge real-time messages with conversation messages (avoid duplicates)
  // This will be merged with the formatted messages below
  const mergedRealtimeMessages = useMemo(() => {
    return realtimeMessages.map(msg => ({
      id: msg.id,
      sender: msg.sender as 'customer' | 'agent',
      content: msg.text || msg.content,
      timestamp: msg.timestamp,
      type: 'text' as const,
      attachments: msg.attachments || []
    }));
  }, [realtimeMessages]);

  const handleTakeControl = () => {
    setIsManualControl(true);
  };

  const handleReleaseControl = () => {
    setIsManualControl(false);
  };

  const handleSendMessage = async (message: string, isInternal: boolean, files?: File[]) => {
    try {
      console.log("Send message:", message, "Internal:", isInternal, "Files:", files);
      
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
      
      // Create FormData if files are present, otherwise use JSON
      const hasFiles = files && files.length > 0;
      
      let requestBody: FormData | string;
      let headers: HeadersInit = {
        'Authorization': `Bearer ${token}`
      };
      
      if (hasFiles) {
        const formData = new FormData();
        formData.append('text', message || '');
        formData.append('sender', 'operator');
        formData.append('type', isInternal ? 'internal_note' : 'message');
        
        files.forEach((file) => {
          formData.append('attachments', file);
        });
        
        requestBody = formData;
        // Don't set Content-Type header - browser will set it with boundary for FormData
      } else {
        headers['Content-Type'] = 'application/json';
        requestBody = JSON.stringify({
          text: message,
          sender: 'operator',
          type: isInternal ? 'internal_note' : 'message'
        });
      }
      
      const response = await fetch(
        `${API_URL}/conversations/${conversation.id}/messages`,
        {
          method: 'POST',
          headers,
          body: requestBody
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to send message');
      }

      const data = await response.json();
      console.log('Message sent successfully:', data);
      toast.success('Message sent!');
      
      // The backend will emit a Socket.io event, so we'll receive it via real-time listener
      // But we can optimistically add it to show immediately
      const sentMessage = data.data || data.message || data;
      setRealtimeMessages(prev => {
        const exists = prev.some(msg => msg.id === sentMessage._id || msg.id === sentMessage.id);
        if (exists) return prev;
        
        return [...prev, {
          id: sentMessage._id || sentMessage.id || Date.now().toString(),
          text: message,
          sender: 'agent',
          timestamp: sentMessage.timestamp || new Date().toISOString(),
          type: 'text' as const,
          attachments: sentMessage.attachments || []
        }];
      });
      
      // Also invalidate to get fresh data from server
      queryClient.invalidateQueries({ queryKey: ['conversation', conversation.id] });
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
    }
  };

  const handleFolderSelect = async (folderId: string | null) => {
    try {
      await conversationService.moveToFolder(conversation.id, folderId);
      toast.success(folderId ? 'Moved to folder' : 'Removed from folder');
      queryClient.invalidateQueries({ queryKey: ['conversation', conversation.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to move to folder');
    }
  };

  const handleBookmark = async () => {
    const currentBookmarkState = isBookmarked;
    const newBookmarkState = !currentBookmarkState;
    
    try {
      setIsBookmarking(true);
      console.log('[ConversationDetail] Toggling bookmark:', { 
        conversationId: conversation.id, 
        currentState: currentBookmarkState, 
        newState: newBookmarkState 
      });
      
      // Update local state immediately for instant feedback
      setIsBookmarked(newBookmarkState);
      
      await conversationService.toggleBookmark(conversation.id, newBookmarkState);
      
      toast.success(newBookmarkState ? 'Conversation bookmarked' : 'Bookmark removed');
      
      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['conversation', conversation.id] });
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
      
      console.log('[ConversationDetail] Bookmark toggled successfully:', newBookmarkState);
    } catch (error: any) {
      console.error('[ConversationDetail] Failed to toggle bookmark:', error);
      // Revert state on error
      setIsBookmarked(currentBookmarkState);
      toast.error(error.message || 'Failed to update bookmark');
    } finally {
      setIsBookmarking(false);
    }
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

  const handleChannelSelect = (channel: 'sms' | 'whatsapp') => {
    setSelectedChannel(channel);
    setSendMessageModalOpen(true);
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
      toast.success('Transcript loaded!');
      
      // Refresh conversation data without page reload
      queryClient.invalidateQueries({ queryKey: ['conversation', conversation.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      
      // Auto-expand transcript section
      setShowTranscript(true);
    } catch (error: any) {
      console.error('Error fetching transcript:', error);
      toast.error(error.message || 'Failed to fetch transcript');
    } finally {
      setIsFetchingTranscript(false);
    }
  };

  // Convert messages to the format expected by MessageThread and merge with real-time messages
  const messages = useMemo(() => {
    let formattedMessages: any[] = [];
    
      // @ts-ignore - messages may come from API with different structure
      if (conversation.messages && Array.isArray(conversation.messages) && conversation.messages.length > 0) {
        // @ts-ignore
        formattedMessages = conversation.messages.map((msg: any) => ({
          id: msg._id || msg.id,
          sender: (msg.sender === 'customer' || msg.sender === 'user' ? 'customer' : 'agent') as 'customer' | 'agent',
          content: msg.text || msg.content,
          timestamp: msg.timestamp || msg.createdAt || new Date().toISOString(),
          type: 'text' as const,
          attachments: msg.attachments || []
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
    if (formattedMessages.length === 0) {
      formattedMessages = conversation.messages || [];
    }
    
    // Merge with real-time messages (avoid duplicates)
    const existingIds = new Set(formattedMessages.map((msg: any) => msg.id));
    const newRealtimeMessages = mergedRealtimeMessages.filter(msg => !existingIds.has(msg.id));
    
    // Combine and sort by timestamp
    const allMessages = [...formattedMessages, ...newRealtimeMessages].sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeA - timeB;
    });
    
    return allMessages;
  }, [conversation, mergedRealtimeMessages]);

  // Format time helper
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

        {/* Right side - Actions and Close button */}
        <div className="flex items-center gap-2">
          {/* Bookmark Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleBookmark();
            }}
            disabled={isBookmarking}
            className={cn(
              "p-2 rounded-lg transition-all cursor-pointer",
              isBookmarked 
                ? "text-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20" 
                : "text-muted-foreground hover:text-foreground hover:bg-secondary",
              isBookmarking && "opacity-50 cursor-not-allowed"
            )}
            title={isBookmarked ? "Remove bookmark" : "Bookmark conversation"}
            type="button"
          >
            {isBookmarked ? (
              <BookmarkCheck className="w-5 h-5 text-yellow-500" fill="currentColor" />
            ) : (
              <Bookmark className="w-5 h-5" />
            )}
          </button>

          {/* Folder Button */}
          <button
            onClick={() => setFolderSelectModalOpen(true)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            title="Move to folder"
          >
            <Folder className="w-5 h-5" />
          </button>

          {/* Close Button */}
          <button
            onClick={handleCloseConversation}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            title="Close conversation"
          >
            <X className="w-5 h-5" />
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
              <div className="flex flex-col gap-3 pt-2 border-t border-blue-500/20">
                {/* @ts-ignore */}
                {conversation.metadata?.duration && (
                  <div className="flex items-center gap-2 text-xs text-foreground">
                    <Phone className="w-3 h-3" />
                    {/* @ts-ignore */}
                    <span>Call Duration: {conversation.metadata.duration}</span>
                  </div>
                )}
                
                {/* Recording Player */}
                {(() => {
                  // @ts-ignore - metadata may exist
                  const recordingUrl = conversation.metadata?.recording_url;
                  if (!recordingUrl) {
                    return (
                      <span className="text-muted-foreground text-xs">
                        No recording available
                      </span>
                    );
                  }

                  return (
                    <div className="bg-card border border-border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Volume2 className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium text-foreground">Call Recording</span>
                        </div>
                        <a
                          href={recordingUrl}
                          download
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title="Download recording"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                      
                      {/* Audio Player */}
                      <audio
                        ref={audioRef}
                        src={recordingUrl}
                        onLoadedMetadata={() => {
                          if (audioRef.current) {
                            setDuration(audioRef.current.duration);
                          }
                        }}
                        onTimeUpdate={() => {
                          if (audioRef.current) {
                            setCurrentTime(audioRef.current.currentTime);
                          }
                        }}
                        onEnded={() => {
                          setIsPlaying(false);
                          setCurrentTime(0);
                        }}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                      />
                      
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            if (audioRef.current) {
                              if (isPlaying) {
                                audioRef.current.pause();
                              } else {
                                audioRef.current.play();
                              }
                            }
                          }}
                          className="w-10 h-10 rounded-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center transition-colors"
                        >
                          {isPlaying ? (
                            <Pause className="w-5 h-5" />
                          ) : (
                            <Play className="w-5 h-5 ml-0.5" />
                          )}
                        </button>
                        
                        <div className="flex-1 space-y-1">
                          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-100"
                              style={{
                                width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%'
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>
                              {formatTime(currentTime)}
                            </span>
                            <span>
                              {formatTime(duration)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transcript Section - Show for calls and chats with transcripts */}
      {/* @ts-ignore */}
      {(conversation.transcript || conversation.channel === 'phone' || (conversation.messages && conversation.messages.length > 0)) && (
        <div className="border-b border-border bg-card/50">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {conversation.channel === 'phone' ? 'Call Transcript' : 'Chat Transcript'}
              </span>
              {/* @ts-ignore */}
              {conversation.transcript && (
                <span className="text-xs text-muted-foreground">
                  {/* @ts-ignore */}
                  ({Array.isArray(conversation.transcript) ? conversation.transcript.length : 
                    // @ts-ignore
                    conversation.transcript.items ? conversation.transcript.items.length : 
                    // @ts-ignore
                    Object.keys(conversation.transcript).length} messages)
                </span>
              )}
            </div>
            {showTranscript ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          
          {showTranscript && (
            <div className="px-4 pb-4 max-h-96 overflow-y-auto">
              {/* @ts-ignore */}
              {conversation.transcript ? (
                <div className="space-y-3">
                  {/* @ts-ignore */}
                  {(() => {
                    // @ts-ignore
                    const transcript = conversation.transcript;
                    const transcriptItems: any[] = [];
                    
                    // Parse transcript based on format
                    if (transcript.items && Array.isArray(transcript.items)) {
                      transcript.items.forEach((item: any) => {
                        if (item.type === 'message' && item.role && item.content) {
                          transcriptItems.push({
                            role: item.role,
                            content: Array.isArray(item.content) ? item.content.join(' ') : item.content,
                            timestamp: item.timestamp
                          });
                        }
                      });
                    } else if (Array.isArray(transcript)) {
                      transcript.forEach((item: any) => {
                        if (item && (item.role || item.sender) && (item.content || item.text || item.message)) {
                          transcriptItems.push({
                            role: item.role || item.sender,
                            content: item.content || item.text || item.message,
                            timestamp: item.timestamp
                          });
                        }
                      });
                    } else if (typeof transcript === 'object') {
                      Object.keys(transcript).sort((a, b) => {
                        const aNum = parseInt(a);
                        const bNum = parseInt(b);
                        return isNaN(aNum) || isNaN(bNum) ? 0 : aNum - bNum;
                      }).forEach((key) => {
                        const item = transcript[key];
                        if (item && (item.role || item.sender) && (item.content || item.text || item.message)) {
                          transcriptItems.push({
                            role: item.role || item.sender,
                            content: item.content || item.text || item.message,
                            timestamp: item.timestamp
                          });
                        }
                      });
                    }
                    
                    return transcriptItems.map((item, index) => {
                      const isCustomer = item.role === 'user' || item.role === 'customer';
                      return (
                        <div
                          key={index}
                          className={`p-3 rounded-lg ${
                            isCustomer
                              ? 'bg-primary/10 border-l-4 border-primary'
                              : 'bg-secondary border-l-4 border-muted-foreground'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-foreground">
                              {isCustomer ? 'Customer' : 'Agent'}
                            </span>
                            {item.timestamp && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(item.timestamp).toLocaleTimeString()}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-foreground whitespace-pre-wrap">
                            {item.content}
                          </p>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  {conversation.channel === 'phone' 
                    ? 'Transcript will appear here once the call is completed' 
                    : 'No transcript available for this conversation'}
                </div>
              )}
            </div>
          )}
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

