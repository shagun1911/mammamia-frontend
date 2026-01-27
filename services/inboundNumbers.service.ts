import { apiClient } from '@/lib/api';

export interface InboundNumbersResponse {
  inboundNumbers: string[];
  count?: number;
  created?: number;
  reused?: number;
  total?: number;
  removed?: string;
}

class InboundNumbersService {
  /**
   * Get all inbound phone numbers
   * This is the SOURCE OF TRUTH - always fetch from this API
   */
  async getAll(): Promise<string[]> {
    try {
      console.log('[InboundNumbers Service] Fetching inbound numbers from API (SOURCE OF TRUTH)...');
      const response = await apiClient.get('/inbound-numbers');
      console.log('[InboundNumbers Service] Full response:', response);
      
      // apiClient.get() already returns response.data, so response is the data itself
      if (!response) {
        console.warn('[InboundNumbers Service] No response data');
        return [];
      }
      
      // Backend returns: { success: true, data: { inboundNumbers: [...], numbers: [...], count: N } }
      const numbers = response.data?.inboundNumbers || response.inboundNumbers || [];
      console.log(`[InboundNumbers Service] Loaded ${numbers.length} inbound number(s) from API:`, numbers);
      return numbers;
    } catch (error: any) {
      console.error('[InboundNumbers Service] Get error:', error);
      console.error('[InboundNumbers Service] Error details:', error.response?.data);
      return [];
    }
  }

  /**
   * Add inbound phone numbers (prevents duplicates, reuses trunkId if exists)
   */
  async add(data: { phoneNumbers: string[]; trunkId: string; provider?: string }): Promise<InboundNumbersResponse> {
    try {
      console.log('[InboundNumbers Service] Creating inbound numbers:', {
        phoneNumbers: data.phoneNumbers,
        trunkId: data.trunkId,
        provider: data.provider
      });
      
      const response = await apiClient.post('/inbound-numbers', {
        phoneNumbers: data.phoneNumbers,
        trunkId: data.trunkId,
        provider: data.provider || 'livekit'
      });
      
      console.log('[InboundNumbers Service] Full response:', response);
      
      if (!response) {
        throw new Error('Invalid response from server');
      }
      
      // apiClient.post() already returns response.data, so response is the data itself
      // Backend returns: { success: true, data: { inboundNumbers: [...], created: N, reused: N, total: N } }
      const result = response.data || response;
      
      // Ensure we have valid numbers (never undefined)
      const resultWithDefaults = {
        inboundNumbers: result.inboundNumbers || [],
        created: result.created ?? 0,
        reused: result.reused ?? 0,
        total: result.total ?? (result.inboundNumbers?.length || 0)
      };
      
      console.log('[InboundNumbers Service] Created inbound numbers:', {
        created: resultWithDefaults.created,
        reused: resultWithDefaults.reused,
        total: resultWithDefaults.total
      });
      
      return resultWithDefaults;
    } catch (error: any) {
      console.error('[InboundNumbers Service] Add error:', error);
      console.error('[InboundNumbers Service] Error details:', error.response?.data);
      throw error;
    }
  }

  /**
   * Replace all inbound phone numbers
   */
  async replace(phoneNumbers: string[]): Promise<InboundNumbersResponse> {
    try {
      const response = await apiClient.put('/inbound-numbers', { phoneNumbers });
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }
      return response.data.data || { inboundNumbers: [] };
    } catch (error: any) {
      console.error('[InboundNumbers Service] Replace error:', error);
      throw error;
    }
  }

  /**
   * Remove a specific inbound phone number
   */
  async remove(phoneNumber: string): Promise<InboundNumbersResponse> {
    try {
      console.log('[InboundNumbers Service] Removing inbound number:', phoneNumber);
      const response = await apiClient.delete(`/inbound-numbers/${encodeURIComponent(phoneNumber)}`);
      console.log('[InboundNumbers Service] Delete response:', response);
      
      // apiClient.delete() already returns response.data, so response is the data itself
      if (!response) {
        throw new Error('Invalid response from server');
      }
      
      // Backend returns: { success: true, data: { message: '...', phoneNumber: '...' } }
      const result = response.data || response;
      console.log('[InboundNumbers Service] Successfully removed:', phoneNumber);
      
      return { inboundNumbers: [], removed: phoneNumber };
    } catch (error: any) {
      console.error('[InboundNumbers Service] Remove error:', error);
      console.error('[InboundNumbers Service] Error details:', error.response?.data);
      throw error;
    }
  }

  /**
   * Clear ALL inbound data (numbers, configs, and phone settings)
   */
  async clearAll(): Promise<{ message: string; cleared: any }> {
    try {
      console.log('[InboundNumbers Service] Clearing all inbound data...');
      const response = await apiClient.delete('/inbound-numbers');
      console.log('[InboundNumbers Service] Clear all response:', response);
      
      if (!response) {
        throw new Error('Invalid response from server');
      }
      
      const result = response.data || response;
      console.log('[InboundNumbers Service] Successfully cleared all inbound data');
      
      return result;
    } catch (error: any) {
      console.error('[InboundNumbers Service] Clear all error:', error);
      console.error('[InboundNumbers Service] Error details:', error.response?.data);
      throw error;
    }
  }
}

export const inboundNumbersService = new InboundNumbersService();
