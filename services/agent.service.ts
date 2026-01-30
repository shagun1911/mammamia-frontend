import { apiClient } from '@/lib/api';

export interface Agent {
  _id: string;
  agent_id: string;
  name: string;
  first_message: string;
  system_prompt: string;
  greeting_message?: string;
  language: string;
  voice_id?: string;
  escalationRules?: string[];
  knowledge_base_ids: string[];
  tool_ids: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgentData {
  name: string;
  first_message: string;
  system_prompt: string;
  greeting_message?: string;
  language: string;
  voice_id?: string;
  escalationRules?: string[];
  knowledge_base_ids: string[];
  // tool_ids are automatically added from backend env variables (PRODUCTS_TOOL_ID and ORDERS_TOOL_ID)
}

export interface UpdateAgentPromptData {
  first_message: string;
  system_prompt: string;
  greeting_message?: string;
  language: string;
  voice_id?: string;
  escalationRules?: string[];
  knowledge_base_ids: string[];
  // tool_ids are automatically added from backend env variables (PRODUCTS_TOOL_ID and ORDERS_TOOL_ID)
}

class AgentService {
  /**
   * Get all agents for the current user
   */
  async getAll(): Promise<Agent[]> {
    try {
      const response = await apiClient.get<{ data: Agent[] }>('/agents');
      return response.data || [];
    } catch (error: any) {
      console.error('[AgentService] getAll() error:', error);
      throw new Error(error.message || 'Failed to fetch agents');
    }
  }

  /**
   * Get a single agent by ID
   */
  async getById(agentId: string): Promise<Agent> {
    try {
      const response = await apiClient.get<{ data: Agent }>(`/agents/${agentId}`);
      return response.data;
    } catch (error: any) {
      console.error('[AgentService] getById() error:', error);
      throw new Error(error.message || 'Failed to fetch agent');
    }
  }

  /**
   * Create a new agent
   */
  async create(data: CreateAgentData): Promise<Agent> {
    try {
      const response = await apiClient.post<{ data: Agent }>('/agents', data);
      return response.data;
    } catch (error: any) {
      console.error('[AgentService] create() error:', error);
      throw new Error(error.message || 'Failed to create agent');
    }
  }

  /**
   * Update agent prompt
   */
  async updatePrompt(agentId: string, data: UpdateAgentPromptData): Promise<Agent> {
    try {
      const response = await apiClient.patch<{ success: boolean; message: string; data: Agent }>(`/agents/${agentId}/prompt`, data);
      // apiClient.patch() returns response.data directly, so response is already { success, message, data }
      return response.data;
    } catch (error: any) {
      console.error('[AgentService] updatePrompt() error:', error);
      throw new Error(error.message || 'Failed to update agent prompt');
    }
  }

  /**
   * Delete an agent
   */
  async delete(agentId: string): Promise<void> {
    try {
      await apiClient.delete(`/agents/${agentId}`);
    } catch (error: any) {
      console.error('[AgentService] delete() error:', error);
      throw new Error(error.message || 'Failed to delete agent');
    }
  }
}

export const agentService = new AgentService();

