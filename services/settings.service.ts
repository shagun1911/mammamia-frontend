import { apiClient } from '@/lib/api';

export interface UpdateSettingsData {
  // Chatbot Settings
  chatbotName?: string;
  chatbotAvatar?: string;
  primaryColor?: string;
  widgetPosition?: 'left' | 'right';
  autoReplyEnabled?: boolean;
  autoReplyMessage?: string;
  defaultKnowledgeBaseId?: string;
  defaultKnowledgeBaseName?: string;
  defaultKnowledgeBaseIds?: string[]; // Multiple knowledge bases support
  defaultKnowledgeBaseNames?: string[]; // Multiple collection names for RAG
  businessHours?: any;
  // Conversation Settings
  autoAssign?: boolean;
  roundRobinAssignment?: boolean;
  maxResponseTime?: number;
  autoCloseAfterDays?: number;
  // Contact Settings
  allowDuplicateContacts?: boolean;
  autoMergeContacts?: boolean;
  requireEmail?: boolean;
  requirePhone?: boolean;
  enableCustomFields?: boolean;
  // Analytics Settings
  enableAnalytics?: boolean;
  trackCustomerBehavior?: boolean;
  dataRetentionDays?: number;
  reportFrequency?: string;
  // Language & Privacy
  language?: string;
  timezone?: string;
  dataCollection?: boolean;
  shareAnalytics?: boolean;
  twoFactorEnabled?: boolean;
  // General
  webhookUrl?: string;
  emailNotifications?: boolean;
  soundNotifications?: boolean;
}

export interface CreateOperatorData {
  email: string;
  firstName: string;
  lastName?: string;
  name?: string; // Legacy field
  role: 'admin' | 'operator' | 'viewer';
  password?: string;
  permissions?: string[];
}

export interface ChannelConfig {
  type: 'whatsapp' | 'telegram' | 'facebook' | 'instagram' | 'sms';
  credentials: any;
  isActive: boolean;
}

/**
 * Settings Service
 * Handles organization settings, team management, and configurations
 */
class SettingsService {
  // ============ General Settings ============

  /**
   * Get all settings
   */
  async getSettings() {
    try {
      const response = await apiClient.get('/settings');
      return response.data.settings;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch settings');
    }
  }

  /**
   * Update settings
   */
  async updateSettings(data: UpdateSettingsData) {
    try {
      const response = await apiClient.patch('/settings', data);
      return response.data.settings;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update settings');
    }
  }

  // ============ Team/Operators Management ============

  /**
   * Get all operators
   */
  async getOperators() {
    try {
      const response = await apiClient.get('/settings/operators');
      return response.data.operators;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch operators');
    }
  }

  /**
   * Get operator by ID
   */
  async getOperatorById(id: string) {
    try {
      const response = await apiClient.get(`/settings/operators/${id}`);
      return response.data.operator;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch operator');
    }
  }

  /**
   * Create new operator
   */
  async createOperator(data: CreateOperatorData) {
    try {
      const response = await apiClient.post('/settings/operators', data);
      return response.data.operator;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create operator');
    }
  }

  /**
   * Update operator
   */
  async updateOperator(id: string, data: Partial<CreateOperatorData>) {
    try {
      const response = await apiClient.patch(`/settings/operators/${id}`, data);
      return response.data.operator;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update operator');
    }
  }

  /**
   * Delete operator
   */
  async deleteOperator(id: string) {
    try {
      const response = await apiClient.delete(`/settings/operators/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete operator');
    }
  }

  /**
   * Update operator status
   */
  async updateOperatorStatus(id: string, status: 'online' | 'offline' | 'busy') {
    try {
      const response = await apiClient.patch(`/operators/${id}/status`, {
        status,
      });
      return response.data.operator;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update operator status');
    }
  }

  // ============ Channels Management ============

  /**
   * Get all channels
   */
  async getChannels() {
    try {
      const response = await apiClient.get('/channels');
      return response.data.channels;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch channels');
    }
  }

  /**
   * Configure channel
   */
  async configureChannel(channelType: string, config: ChannelConfig) {
    try {
      const response = await apiClient.post(`/channels/${channelType}`, config);
      return response.data.channel;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to configure channel');
    }
  }

  /**
   * Update channel
   */
  async updateChannel(channelId: string, config: Partial<ChannelConfig>) {
    try {
      const response = await apiClient.patch(`/channels/${channelId}`, config);
      return response.data.channel;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update channel');
    }
  }

  /**
   * Delete channel
   */
  async deleteChannel(channelId: string) {
    try {
      const response = await apiClient.delete(`/channels/${channelId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete channel');
    }
  }

  /**
   * Test channel connection
   */
  async testChannel(channelId: string) {
    try {
      const response = await apiClient.post(`/channels/${channelId}/test`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to test channel');
    }
  }

  // ============ Webhooks Management ============

  /**
   * Get webhooks
   */
  async getWebhooks() {
    try {
      const response = await apiClient.get('/webhooks');
      return response.data.webhooks;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch webhooks');
    }
  }

  /**
   * Create webhook
   */
  async createWebhook(url: string, events: string[], secret?: string) {
    try {
      const response = await apiClient.post('/webhooks', {
        url,
        events,
        secret,
      });
      return response.data.webhook;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create webhook');
    }
  }

  /**
   * Update webhook
   */
  async updateWebhook(id: string, url?: string, events?: string[], secret?: string) {
    try {
      const response = await apiClient.patch(`/webhooks/${id}`, {
        url,
        events,
        secret,
      });
      return response.data.webhook;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update webhook');
    }
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(id: string) {
    try {
      const response = await apiClient.delete(`/webhooks/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete webhook');
    }
  }

  /**
   * Test webhook
   */
  async testWebhook(id: string) {
    try {
      const response = await apiClient.post(`/webhooks/${id}/test`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to test webhook');
    }
  }

  // ============ API Keys Management ============

  /**
   * Get API keys
   */
  async getApiKeys() {
    try {
      const response = await apiClient.get('/api-keys');
      return response.data.apiKeys;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch API keys');
    }
  }

  /**
   * Create API key
   */
  async createApiKey(name: string, permissions?: string[]) {
    try {
      const response = await apiClient.post('/api-keys', {
        name,
        permissions,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create API key');
    }
  }

  /**
   * Delete API key
   */
  async deleteApiKey(id: string) {
    try {
      const response = await apiClient.delete(`/api-keys/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete API key');
    }
  }

  // ============ Labels/Tags Management ============

  /**
   * Get all labels
   */
  async getLabels() {
    try {
      const response = await apiClient.get('/conversations/labels');
      return response.data.labels;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch labels');
    }
  }

  /**
   * Create label
   */
  async createLabel(name: string, color: string, description?: string) {
    try {
      const response = await apiClient.post('/conversations/labels', {
        name,
        color,
        description,
      });
      return response.data.label;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create label');
    }
  }

  /**
   * Update label
   */
  async updateLabel(id: string, name?: string, color?: string, description?: string) {
    try {
      const response = await apiClient.patch(`/conversations/labels/${id}`, {
        name,
        color,
        description,
      });
      return response.data.label;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update label');
    }
  }

  /**
   * Delete label
   */
  async deleteLabel(id: string) {
    try {
      const response = await apiClient.delete(`/conversations/labels/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete label');
    }
  }

  // ============ Folders Management ============

  /**
   * Get all folders
   */
  async getFolders() {
    try {
      const response = await apiClient.get('/conversations/folders');
      return response.data.folders;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch folders');
    }
  }

  /**
   * Create folder
   */
  async createFolder(name: string, description?: string) {
    try {
      const response = await apiClient.post('/conversations/folders', {
        name,
        description,
      });
      return response.data.folder;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create folder');
    }
  }

  /**
   * Update folder
   */
  async updateFolder(id: string, name?: string, description?: string) {
    try {
      const response = await apiClient.patch(`/conversations/folders/${id}`, {
        name,
        description,
      });
      return response.data.folder;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update folder');
    }
  }

  /**
   * Delete folder
   */
  async deleteFolder(id: string) {
    try {
      const response = await apiClient.delete(`/conversations/folders/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete folder');
    }
  }
}

// Export singleton instance
export const settingsService = new SettingsService();

