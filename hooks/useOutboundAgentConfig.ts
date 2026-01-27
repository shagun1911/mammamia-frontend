import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { outboundAgentConfigService, OutboundAgentConfig, UpdateOutboundAgentConfigData } from '@/services/outboundAgentConfig.service';
import { toast } from 'sonner';

export function useOutboundAgentConfig() {
  const queryClient = useQueryClient();

  // Get all outbound agent configs
  const { data: configs, isLoading, error } = useQuery<OutboundAgentConfig[]>({
    queryKey: ['outbound-agent-config'],
    queryFn: () => outboundAgentConfigService.getAll(),
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // Get config by outbound number
  const getConfigByNumber = (outboundNumber: string) => {
    return configs?.find(config => config.outboundNumber === outboundNumber);
  };

  // Create or update config
  const createOrUpdateConfig = useMutation({
    mutationFn: ({ outboundNumber, data }: { outboundNumber: string; data: UpdateOutboundAgentConfigData }) =>
      outboundAgentConfigService.createOrUpdate(outboundNumber, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outbound-agent-config'] });
      toast.success('Outbound agent config saved successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save outbound agent config');
    },
  });

  // Delete config
  const deleteConfig = useMutation({
    mutationFn: (outboundNumber: string) => outboundAgentConfigService.delete(outboundNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outbound-agent-config'] });
      toast.success('Outbound agent config deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete outbound agent config');
    },
  });

  return {
    configs,
    isLoading,
    error,
    getConfigByNumber,
    createOrUpdateConfig,
    deleteConfig,
  };
}
