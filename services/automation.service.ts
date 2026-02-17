import { apiClient } from '@/lib/api';

export interface AutomationFilters {
  status?: 'active' | 'inactive';
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateAutomationData {
  name: string;
  description?: string;
  trigger: {
    type: string;
    conditions?: any;
  };
  actions: Array<{
    type: string;
    config: any;
  }>;
  isActive?: boolean;
}

/**
 * Automation Service
 * Handles all automation-related API calls
 */
class AutomationService {
  /**
   * Get all automations with optional filters
   */
  async getAll(filters?: AutomationFilters) {
    try {
      const response = await apiClient.get('/automations', {
        params: filters,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch automations');
    }
  }

  /**
   * Get automation by ID
   */
  async getById(id: string) {
    try {
      const response = await apiClient.get(`/automations/${id}`);
      return response.data.automation;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch automation');
    }
  }

  /**
   * Create new automation
   */
  async create(data: CreateAutomationData) {
    try {
      const response = await apiClient.post('/automations', data);
      return response.data.automation;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create automation');
    }
  }

  /**
   * Update automation
   */
  async update(id: string, data: Partial<CreateAutomationData>) {
    try {
      const response = await apiClient.patch(`/automations/${id}`, data);
      return response.data.automation;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update automation');
    }
  }

  /**
   * Delete automation
   */
  async delete(id: string) {
    try {
      const response = await apiClient.delete(`/automations/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete automation');
    }
  }

  /**
   * Toggle automation active/inactive
   */
  async toggleActive(id: string, isActive: boolean) {
    try {
      const response = await apiClient.patch(`/automations/${id}/toggle`, {
        isActive,
      });
      return response.data.automation;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to toggle automation');
    }
  }

  /**
   * Test automation with sample data
   */
  async test(id: string, testData?: any) {
    try {
      const response = await apiClient.post(`/automations/${id}/test`, testData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to test automation');
    }
  }

  /**
   * Get automation execution logs
   */
  async getLogs(id: string, page = 1, limit = 50) {
    try {
      const response = await apiClient.get(`/automations/${id}/logs`, {
        params: { page, limit },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch logs');
    }
  }

  /**
   * Get automation analytics
   */
  async getAnalytics(id: string, startDate?: string, endDate?: string) {
    try {
      const response = await apiClient.get(`/automations/${id}/analytics`, {
        params: { startDate, endDate },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch analytics');
    }
  }

  /**
   * Duplicate automation
   */
  async duplicate(id: string) {
    try {
      const response = await apiClient.post(`/automations/${id}/duplicate`);
      return response.data.automation;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to duplicate automation');
    }
  }

  /**
   * Suggest extraction_prompt and json_example from an agent's system prompt.
   * Pass agent_id (MongoDB _id) to use that agent's prompt; backend fetches agent and uses LLM to suggest schema.
   */
  async suggestExtractionSchema(params: { agent_id?: string; system_prompt?: string }): Promise<{ extraction_prompt: string; json_example: Record<string, unknown> }> {
    const response = await apiClient.post<{ data?: { extraction_prompt: string; json_example: Record<string, unknown> } }>(
      '/automations/suggest-extraction-schema',
      params
    );
    const envelope = response as { data?: { extraction_prompt: string; json_example: Record<string, unknown> }; extraction_prompt?: string; json_example?: Record<string, unknown> };
    return envelope.data ?? (envelope as { extraction_prompt: string; json_example: Record<string, unknown> });
  }
}

// Export singleton instance
export const automationService = new AutomationService();

