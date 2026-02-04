import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentService, Agent, CreateAgentData, UpdateAgentPromptData } from '@/services/agent.service';
import { toast } from 'sonner';

/**
 * Get all agents
 */
export function useAgents() {
  return useQuery<Agent[]>({
    queryKey: ['agents'],
    queryFn: async () => {
      try {
        const result = await agentService.getAll();
        return result || [];
      } catch (error: any) {
        console.error('[useAgents] Error fetching agents:', error);
        throw error;
      }
    },
    staleTime: 0,
    retry: 1,
    retryDelay: 1000,
  });
}

/**
 * Get single agent by ID
 */
export function useAgent(id: string | null) {
  return useQuery<Agent>({
    queryKey: ['agent', id],
    queryFn: () => agentService.getById(id!),
    enabled: !!id,
  });
}

/**
 * Create agent mutation
 */
export function useCreateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAgentData) => agentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success('Agent created successfully');
    },
    onError: (error: any) => {
      console.error('[useCreateAgent] Error:', error);
      toast.error(error.message || 'Failed to create agent');
    },
  });
}

/**
 * Update agent prompt mutation
 */
/**
 * Update agent prompt mutation
 *//**
 * Update agent prompt mutation
 */
/**
 * Update agent prompt mutation
 */
export function useUpdateAgentPrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ agentId, data }: { agentId: string; data: UpdateAgentPromptData }) => 
      agentService.updatePrompt(agentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success('Agent prompt updated successfully');
    },
    onError: (error: any) => {
      console.error('[useUpdateAgentPrompt] Error:', error);
      toast.error(error.message || 'Failed to update agent prompt');
    },
  });
}

/**
 * Delete agent mutation
 */
export function useDeleteAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (agentId: string) => agentService.delete(agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success('Agent deleted successfully');
    },
    onError: (error: any) => {
      console.error('[useDeleteAgent] Error:', error);
      toast.error(error.message || 'Failed to delete agent');
    },
  });
}

