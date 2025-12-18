import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inboundAgentConfigService, InboundAgentConfig, UpdateInboundAgentConfigData } from '@/services/inboundAgentConfig.service';
import { toast } from 'sonner';

export function useInboundAgentConfig() {
  const queryClient = useQueryClient();

  // Get all inbound agent configs
  const { data: configs, isLoading, error } = useQuery<InboundAgentConfig[]>({
    queryKey: ['inbound-agent-config'],
    queryFn: () => inboundAgentConfigService.getAll(),
  });

  // Sync config from various settings
  const syncConfig = useMutation({
    mutationFn: () => inboundAgentConfigService.sync(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbound-agent-config'] });
      toast.success('Inbound agent config synced successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to sync inbound agent config');
    },
  });

  // Update config
  const updateConfig = useMutation({
    mutationFn: (data: UpdateInboundAgentConfigData) => inboundAgentConfigService.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbound-agent-config'] });
      toast.success('Inbound agent config updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update inbound agent config');
    },
  });

  // Delete config by phone number
  const deleteConfig = useMutation({
    mutationFn: (phoneNumber: string) => inboundAgentConfigService.delete(phoneNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbound-agent-config'] });
      toast.success('Inbound agent config deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete inbound agent config');
    },
  });

  // Delete all configs
  const deleteAllConfigs = useMutation({
    mutationFn: () => inboundAgentConfigService.deleteAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbound-agent-config'] });
      toast.success('All inbound agent configs deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete inbound agent configs');
    },
  });

  return {
    configs,
    isLoading,
    error,
    syncConfig,
    updateConfig,
    deleteConfig,
    deleteAllConfigs,
  };
}

