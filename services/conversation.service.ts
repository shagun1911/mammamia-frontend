
import { apiClient } from '@/lib/api';

export interface ConversationFilters {
  status?: string;
  channel?: string;
  operatorId?: string;
  labelIds?: string[];
  folderId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface SendMessageData {
  content: string;
  type?: 'text' | 'image' | 'file' | 'audio' | 'video';
  mediaUrl?: string;
  metadata?: any;
}

/**
 * Conversation Service
 * Handles all conversation-related API calls
 */
class ConversationService {
  /**
   * Get all conversations with optional filters
   */
  async getAll(filters?: ConversationFilters) {
    try {
      const response = await apiClient.get('/conversations', {
        params: filters,
      });
      
      // Backend returns paginatedResponse: { success: true, data: { items: [...], pagination: {...} } }
      // apiClient.get() returns the full response body
      const items = response.data?.items || [];
      
      // Transform backend conversations to frontend format
      const conversations = items.map((conv: any) => {
        // Handle null customerId
        const customer = conv.customerId || {};
        
        // Better fallback for name: use name, phone, email, or Unknown
        const customerName = customer.name || 
                            customer.phone || 
                            customer.email || 
                            'Unknown Customer';
        const avatar = customer.avatar || this.generateAvatar(customerName);
        const color = customer.color || this.generateColor(customerName);
        
        // Get last message text
        let lastMessageText = 'No messages yet';
        if (conv.lastMessage?.text) {
          lastMessageText = conv.lastMessage.text;
        } else if (typeof conv.lastMessage === 'string') {
          lastMessageText = conv.lastMessage;
        } else if (conv.transcript) {
          lastMessageText = 'Call transcript available';
        }
        
        return {
          id: conv._id || conv.id,
          customer: {
            name: customerName,
            email: customer.email || '',
            phone: customer.phone || '',
            avatar,
            color,
          },
          channel: conv.channel,
          status: conv.status,
          lastMessage: lastMessageText,
          timestamp: conv.updatedAt || conv.createdAt || new Date().toISOString(),
          unread: conv.unread || false,
          labels: conv.labels || [],
          folder: conv.folderId || null,
          messages: conv.messages || [],
          transcript: conv.transcript || null,
        };
      });
      
      const pagination = response.data?.pagination || {};
      
      return {
        conversations,
        pagination,
      };
    } catch (error: any) {
      // Check if it's an auth error
      if (error.status === 401) {
        throw new Error('Please log in to view conversations');
      }
      
      throw new Error(error.message || 'Failed to fetch conversations');
    }
  }
  
  /**
   * Generate avatar initials from name
   */
  private generateAvatar(name?: string): string {
    if (!name) return '??';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  
  /**
   * Generate consistent color from name
   */
  private generateColor(name?: string): string {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];
    if (!name) return colors[0];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }

  /**
   * Get conversation by ID
   */
  async getById(id: string) {
    try {
      const response = await apiClient.get(`/conversations/${id}`);
      // Backend returns { success: true, data: {...conversation, messages: [...]} }
      const conv = response.data.data || response.data.conversation || response.data;
      
      console.log('[ConversationService] Conversation detail:', {
        id: conv._id,
        hasMessages: !!conv.messages,
        messageCount: conv.messages?.length || 0,
        hasTranscript: !!conv.transcript,
      });
      
      // Transform backend conversation to frontend format
      // Better fallback for name: use name, phone, email, or Unknown
      const customerName = conv.customerId?.name || 
                          conv.customerId?.phone || 
                          conv.customerId?.email || 
                          'Unknown';
      const avatar = conv.customerId?.avatar || this.generateAvatar(customerName);
      const color = conv.customerId?.color || this.generateColor(customerName);
      
      return {
        id: conv._id || conv.id,
        customer: {
          name: customerName,
          email: conv.customerId?.email || '',
          phone: conv.customerId?.phone || '',
          avatar,
          color,
        },
        channel: conv.channel,
        status: conv.status,
        lastMessage: conv.messages?.[conv.messages.length - 1]?.text || 'No messages yet',
        timestamp: conv.updatedAt || conv.createdAt || new Date().toISOString(),
        unread: conv.unread || false,
        labels: conv.labels || [],
        folder: conv.folderId || null,
        messages: conv.messages || [],
        transcript: conv.transcript || null,
        metadata: conv.metadata || {}, // ADD METADATA!
      };
    } catch (error: any) {
      console.error('[ConversationService] Failed to fetch conversation:', error);
      throw new Error(error.message || 'Failed to fetch conversation');
    }
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string, page = 1, limit = 50) {
    try {
      const response = await apiClient.get(`/conversations/${conversationId}/messages`, {
        params: { page, limit },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch messages');
    }
  }

  /**
   * Send message in conversation
   */
  async sendMessage(conversationId: string, data: SendMessageData) {
    try {
      const response = await apiClient.post(
        `/conversations/${conversationId}/messages`,
        data
      );
      return response.data.message;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send message');
    }
  }

  /**
   * Take manual control of conversation
   */
  async takeControl(conversationId: string) {
    try {
      const response = await apiClient.post(
        `/conversations/${conversationId}/take-control`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to take control');
    }
  }

  /**
   * Release manual control of conversation
   */
  async releaseControl(conversationId: string) {
    try {
      const response = await apiClient.post(
        `/conversations/${conversationId}/release-control`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to release control');
    }
  }

  /**
   * Update conversation status
   */
  async updateStatus(conversationId: string, status: string) {
    try {
      const response = await apiClient.patch(
        `/conversations/${conversationId}/status`,
        { status }
      );
      return response.data.conversation;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update status');
    }
  }

  /**
   * Assign conversation to operator
   */
  async assignOperator(conversationId: string, operatorId: string) {
    try {
      const response = await apiClient.patch(
        `/conversations/${conversationId}/assign`,
        { operatorId }
      );
      return response.data.conversation;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to assign operator');
    }
  }

  /**
   * Update conversation labels
   */
  async updateLabels(
    conversationId: string,
    labelIdsToAdd: string[] = [],
    labelIdsToRemove: string[] = []
  ) {
    try {
      const response = await apiClient.patch(
        `/conversations/${conversationId}/labels`,
        {
          add: labelIdsToAdd,
          remove: labelIdsToRemove,
        }
      );
      return response.data.conversation;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update labels');
    }
  }

  /**
   * Move conversation to folder
   */
  async moveToFolder(conversationId: string, folderId: string | null) {
    try {
      const response = await apiClient.patch(
        `/conversations/${conversationId}/folder`,
        { folderId }
      );
      return response.data.conversation;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to move to folder');
    }
  }

  /**
   * Mark conversation as read
   */
  async markAsRead(conversationId: string) {
    try {
      const response = await apiClient.patch(
        `/conversations/${conversationId}/read`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to mark as read');
    }
  }

  /**
   * Mark conversation as unread
   */
  async markAsUnread(conversationId: string) {
    try {
      const response = await apiClient.patch(
        `/conversations/${conversationId}/unread`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to mark as unread');
    }
  }

  /**
   * Delete conversation
   */
  async delete(conversationId: string) {
    try {
      const response = await apiClient.delete(`/conversations/${conversationId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete conversation');
    }
  }

  /**
   * Bulk delete conversations
   */
  async bulkDelete(conversationIds: string[]) {
    try {
      const response = await apiClient.post('/conversations/bulk-delete', {
        conversationIds,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to bulk delete conversations');
    }
  }

  /**
   * Search messages across conversations
   */
  async searchMessages(query: string, filters?: ConversationFilters) {
    try {
      const response = await apiClient.get('/conversations/search-messages', {
        params: { query, ...filters },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to search messages');
    }
  }

  /**
   * Add internal note to conversation
   */
  async addNote(conversationId: string, note: string) {
    try {
      const response = await apiClient.post(
        `/conversations/${conversationId}/notes`,
        { note }
      );
      return response.data.note;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to add note');
    }
  }

  /**
   * Get conversation statistics
   */
  async getStats() {
    try {
      const response = await apiClient.get('/conversations/stats');
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch stats');
    }
  }
}

// Export singleton instance
export const conversationService = new ConversationService();

