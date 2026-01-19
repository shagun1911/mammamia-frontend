import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignService, CampaignFilters, CreateCampaignData } from '@/services/campaign.service';
import { toast } from 'sonner';

/**
 * Fetch all campaigns with filters
 */
export function useCampaigns(filters?: CampaignFilters) {
  return useQuery({
    queryKey: ['campaigns', filters],
    queryFn: () => campaignService.getAll(filters),
  });
}

/**
 * Fetch single campaign by ID
 */
export function useCampaign(campaignId: string | null) {
  return useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => campaignService.getById(campaignId!),
    enabled: !!campaignId,
  });
}

/**
 * Fetch WhatsApp templates
 */
export function useWhatsAppTemplates() {
  return useQuery({
    queryKey: ['whatsapp-templates'],
    queryFn: () => campaignService.getWhatsAppTemplates(),
  });
}

/**
 * Fetch campaign analytics
 */
export function useCampaignAnalytics(campaignId: string) {
  return useQuery({
    queryKey: ['campaign', campaignId, 'analytics'],
    queryFn: () => campaignService.getAnalytics(campaignId),
    enabled: !!campaignId,
  });
}

/**
 * Create campaign mutation
 */
export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCampaignData) => campaignService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign created');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create campaign');
    },
  });
}

/**
 * Update campaign mutation
 */
export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCampaignData> }) =>
      campaignService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaign', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update campaign');
    },
  });
}

/**
 * Delete campaign mutation
 */
export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => campaignService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete campaign');
    },
  });
}

/**
 * Start campaign mutation
 */
export function useStartCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => campaignService.start(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign started');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to start campaign');
    },
  });
}

/**
 * Pause campaign mutation
 */
export function usePauseCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => campaignService.pause(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign paused');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to pause campaign');
    },
  });
}

/**
 * Resume campaign mutation
 */
export function useResumeCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => campaignService.resume(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign resumed');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to resume campaign');
    },
  });
}

/**
 * Retry failed recipients mutation
 */
export function useRetryFailedCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => campaignService.retryFailed(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Retrying failed recipients');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to retry failed recipients');
    },
  });
}

/**
 * Cancel campaign mutation
 */
export function useCancelCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => campaignService.cancel(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign cancelled');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to cancel campaign');
    },
  });
}

/**
 * Fetch campaign progress
 */
export function useCampaignProgress(campaignId: string | null, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: ['campaign', campaignId, 'progress'],
    queryFn: () => campaignService.getProgress(campaignId!),
    enabled: !!campaignId,
    refetchInterval: options?.refetchInterval || (options?.refetchInterval === undefined ? 2000 : false),
  });
}
