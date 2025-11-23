import { apiClient } from '@/lib/api';

export interface ApiKeys {
  _id: string;
  userId: string;
  llmProvider: 'openai' | 'gemini';
  apiKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateApiKeysData {
  llmProvider?: 'openai' | 'gemini';
  apiKey?: string;
}

export const apiKeysService = {
  /**
   * Get API keys
   */
  async getApiKeys(): Promise<ApiKeys | null> {
    try {
      const response = await apiClient.get('/api-keys');
      // Handle both wrapped and unwrapped responses
      if (response.data) {
        return response.data;
      }
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error: any) {
      console.error('Failed to fetch API keys:', error);
      // Return null instead of throwing to allow graceful handling
      return null;
    }
  },

  /**
   * Update API keys
   */
  async updateApiKeys(data: UpdateApiKeysData): Promise<ApiKeys> {
    const response = await apiClient.put('/api-keys', data);
    // Handle both wrapped and unwrapped responses
    return response.data || response;
  },

  /**
   * Delete API keys
   */
  async deleteApiKeys(): Promise<{ message: string }> {
    const response = await apiClient.delete('/api-keys');
    return response.data || response;
  },
};

