import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001';

/**
 * WebSocket client for real-time updates using Socket.IO
 */
class SocketClient {
  private socket: Socket | null = null;
  private joinedRooms: Set<string> = new Set();

  /**
   * Connect to WebSocket server with authentication
   */
  connect(token: string): void {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.socket = io(WS_URL, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
      reconnection: true, // Enable auto-reconnection
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.setupEventListeners();
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.joinedRooms.clear();
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Setup connection event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      
      // Rejoin all previously joined rooms
      this.joinedRooms.forEach((room) => {
        this.socket?.emit('join:conversation', room);
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.warn('WebSocket not available (real-time features disabled)');
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 WebSocket reconnected');
    });

    this.socket.on('reconnect_error', () => {
      // Suppress reconnection errors
    });

    this.socket.on('reconnect_failed', () => {
      console.warn('WebSocket connection failed (continuing without real-time features)');
    });
  }

  // ============ Room Management ============

  /**
   * Join conversation room to receive updates
   */
  joinConversation(conversationId: string): void {
    if (!this.socket?.connected) {
      console.warn('Cannot join room: Socket not connected');
      return;
    }

    this.socket.emit('join-conversation', conversationId);
    this.joinedRooms.add(conversationId);
    console.log(`📥 Joined conversation room: ${conversationId}`);
  }

  /**
   * Leave conversation room
   */
  leaveConversation(conversationId: string): void {
    if (!this.socket?.connected) return;

    this.socket.emit('leave-conversation', conversationId);
    this.joinedRooms.delete(conversationId);
    console.log(`📤 Left conversation room: ${conversationId}`);
  }

  /**
   * Join organization room to receive updates
   */
  joinOrganization(organizationId: string): void {
    if (!this.socket?.connected) {
      console.warn('Cannot join organization room: Socket not connected');
      return;
    }

    this.socket.emit('join-organization', organizationId);
    console.log(`📥 Joined organization room: ${organizationId}`);
  }

  // ============ Event Listeners ============

  /**
   * Listen for new messages (legacy)
   */
  onNewMessage(callback: (message: any) => void): void {
    this.socket?.on('message:new', callback);
  }

  /**
   * Listen for message received (for WhatsApp/Social integrations)
   */
  onMessageReceived(callback: (data: any) => void): void {
    this.socket?.on('message-received', callback);
  }

  /**
   * Listen for new messages in organization
   */
  onNewMessageInOrg(callback: (data: any) => void): void {
    this.socket?.on('new-message', callback);
  }

  /**
   * Listen for conversation updates
   */
  onConversationUpdate(callback: (conversation: any) => void): void {
    this.socket?.on('conversation:updated', callback);
  }

  /**
   * Listen for new conversations
   */
  onNewConversation(callback: (conversation: any) => void): void {
    this.socket?.on('conversation:new', callback);
  }

  /**
   * Listen for transcript updates
   */
  onTranscriptUpdated(callback: (data: any) => void): void {
    this.socket?.on('conversation:transcript-updated', callback);
  }

  /**
   * Listen for typing indicators
   */
  onTyping(callback: (data: { conversationId: string; user: any }) => void): void {
    this.socket?.on('typing:start', callback);
  }

  /**
   * Listen for stop typing indicators
   */
  onStopTyping(callback: (data: { conversationId: string; user: any }) => void): void {
    this.socket?.on('typing:stop', callback);
  }

  /**
   * Listen for operator status changes
   */
  onOperatorStatusChange(callback: (data: { operatorId: string; status: string }) => void): void {
    this.socket?.on('operator:status-changed', callback);
  }

  /**
   * Listen for notifications
   */
  onNotification(callback: (notification: any) => void): void {
    this.socket?.on('notification:new', callback);
  }

  /**
   * Listen for conversation assignment
   */
  onConversationAssigned(callback: (data: any) => void): void {
    this.socket?.on('conversation:assigned', callback);
  }

  /**
   * Listen for manual control taken
   */
  onControlTaken(callback: (data: any) => void): void {
    this.socket?.on('control:taken', callback);
  }

  /**
   * Listen for manual control released
   */
  onControlReleased(callback: (data: any) => void): void {
    this.socket?.on('control:released', callback);
  }

  // ============ Event Emitters ============

  /**
   * Emit typing start event
   */
  startTyping(conversationId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('typing:start', { conversationId });
  }

  /**
   * Emit typing stop event
   */
  stopTyping(conversationId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('typing:stop', { conversationId });
  }

  /**
   * Update operator status
   */
  updateOperatorStatus(status: 'online' | 'offline' | 'busy'): void {
    if (!this.socket?.connected) return;
    this.socket.emit('operator:status', { status });
  }

  /**
   * Mark message as read
   */
  markAsRead(conversationId: string, messageId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('message:read', { conversationId, messageId });
  }

  // ============ Event Cleanup ============

  /**
   * Remove specific event listener
   */
  off(event: string, callback?: (...args: any[]) => void): void {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.socket?.removeAllListeners(event);
    } else {
      this.socket?.removeAllListeners();
    }
  }

  /**
   * Get current socket instance (for advanced usage)
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Export singleton instance
export const socketClient = new SocketClient();

