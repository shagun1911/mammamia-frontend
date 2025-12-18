import { apiClient } from '@/lib/api';

export interface InboundAgentConfig {
  _id: string;
  userId: string;
  voice_id: string;
  collections: string[];
  language: string;
  calledNumber: string;
  agent_instruction: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateInboundAgentConfigData {
  calledNumber: string; // Required for update
  voice_id?: string;
  collections?: string[];
  language?: string;
  agent_instruction?: string;
}

class InboundAgentConfigService {
  /**
   * Get all inbound agent configs
   */
  async getAll(): Promise<InboundAgentConfig[]> {
    try {
      const response = await apiClient.get('/inbound-agent-config');
      if (!response || !response.data) {
        return [];
      }
      return response.data.configs || [];
    } catch (error: any) {
      console.error('[InboundAgentConfig Service] Get error:', error);
      return [];
    }
  }
  
  /**
   * Get inbound agent config by phone number
   */
  async getByPhoneNumber(phoneNumber: string): Promise<InboundAgentConfig | null> {
    try {
      const response = await apiClient.get(`/inbound-agent-config/${encodeURIComponent(phoneNumber)}`);
      if (!response || !response.data) {
        return null;
      }
      return response.data.config;
    } catch (error: any) {
      console.error('[InboundAgentConfig Service] Get by phone error:', error);
      return null;
    }
  }

  /**
   * Sync inbound agent configs from various settings
   */
  async sync(): Promise<InboundAgentConfig[]> {
    try {
      const response = await apiClient.post('/inbound-agent-config/sync');
      console.log('[InboundAgentConfig Service] Sync response:', response);
      
      if (!response || !response.data) {
        console.error('[InboundAgentConfig Service] No response data');
        return [];
      }
      
      // Return configs array or empty array if not present
      return response.data.configs || [];
    } catch (error: any) {
      console.error('[InboundAgentConfig Service] Sync error:', error);
      console.error('[InboundAgentConfig Service] Error response:', error.response?.data);
      // Return empty array instead of throwing to prevent blocking UI
      return [];
    }
  }

  /**
   * Update inbound agent config
   */
  async update(data: UpdateInboundAgentConfigData): Promise<InboundAgentConfig> {
    try {
      const response = await apiClient.put('/inbound-agent-config', data);
      if (!response || !response.data || !response.data.config) {
        throw new Error('Invalid response from server');
      }
      return response.data.config;
    } catch (error: any) {
      console.error('[InboundAgentConfig Service] Update error:', error);
      throw error;
    }
  }

  /**
   * Delete inbound agent config by phone number
   */
  async delete(phoneNumber: string): Promise<void> {
    await apiClient.delete(`/inbound-agent-config/${encodeURIComponent(phoneNumber)}`);
  }
  
  /**
   * Delete all inbound agent configs
   */
  async deleteAll(): Promise<void> {
    await apiClient.delete('/inbound-agent-config/all');
  }
}

export const inboundAgentConfigService = new InboundAgentConfigService();

