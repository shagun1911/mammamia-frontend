import { apiClient } from '@/lib/api';

export interface OutboundAgentConfig {
  _id: string;
  userId: string;
  outboundNumber: string;
  selectedVoice: string;
  customVoiceId?: string;
  humanOperatorPhone: string;
  escalationRules: string[];
  greetingMessage?: string;
  language?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOutboundAgentConfigData {
  selectedVoice?: string;
  customVoiceId?: string;
  humanOperatorPhone?: string;
  escalationRules?: string[];
  greetingMessage?: string;
  language?: string;
}

export interface UpdateOutboundAgentConfigData extends CreateOutboundAgentConfigData {}

class OutboundAgentConfigService {
  /**
   * Get all outbound agent configs
   */
  async getAll(): Promise<OutboundAgentConfig[]> {
    try {
      console.log('[OutboundAgentConfig Service] Fetching all configs...');
      const response = await apiClient.get('/outbound-agent-config');
      console.log('[OutboundAgentConfig Service] Response:', response);
      
      // apiClient.get() already returns response.data, so response is the data itself
      if (!response) {
        console.warn('[OutboundAgentConfig Service] No response data');
        return [];
      }
      
      const configs = response.configs || [];
      console.log('[OutboundAgentConfig Service] Found configs:', configs.length);
      return configs;
    } catch (error: any) {
      console.error('[OutboundAgentConfig Service] Get error:', error);
      console.error('[OutboundAgentConfig Service] Error response:', error.response?.data);
      // Return empty array instead of throwing to prevent blocking UI
      return [];
    }
  }

  /**
   * Get config for a specific outbound number
   */
  async getByOutboundNumber(outboundNumber: string): Promise<OutboundAgentConfig | null> {
    try {
      const response = await apiClient.get(`/outbound-agent-config/${encodeURIComponent(outboundNumber)}`);
      if (!response) {
        return null;
      }
      return response.config || null;
    } catch (error: any) {
      console.error('[OutboundAgentConfig Service] Get by number error:', error);
      return null;
    }
  }

  /**
   * Create or update outbound agent config
   */
  async createOrUpdate(
    outboundNumber: string,
    data: CreateOutboundAgentConfigData
  ): Promise<OutboundAgentConfig> {
    try {
      console.log('[OutboundAgentConfig Service] Creating/updating config for:', outboundNumber);
      console.log('[OutboundAgentConfig Service] Data:', JSON.stringify(data, null, 2));
      
      const response = await apiClient.put(`/outbound-agent-config/${encodeURIComponent(outboundNumber)}`, data);
      
      console.log('[OutboundAgentConfig Service] Response:', response);
      
      if (!response) {
        throw new Error('Invalid response from server');
      }
      
      // apiClient.put() already returns response.data, so response is the data itself
      const config = response.config || response;
      return config;
    } catch (error: any) {
      console.error('[OutboundAgentConfig Service] Create/update error:', error);
      console.error('[OutboundAgentConfig Service] Error response:', error.response?.data);
      throw error;
    }
  }

  /**
   * Update outbound agent config
   */
  async update(
    outboundNumber: string,
    data: UpdateOutboundAgentConfigData
  ): Promise<OutboundAgentConfig> {
    return await this.createOrUpdate(outboundNumber, data);
  }

  /**
   * Delete outbound agent config
   */
  async delete(outboundNumber: string): Promise<void> {
    await apiClient.delete(`/outbound-agent-config/${encodeURIComponent(outboundNumber)}`);
  }
}

export const outboundAgentConfigService = new OutboundAgentConfigService();
