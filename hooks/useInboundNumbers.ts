import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inboundNumbersService } from '@/services/inboundNumbers.service';
import { toast } from 'sonner';

export function useInboundNumbers() {
  const queryClient = useQueryClient();

  // Get all inbound numbers (SOURCE OF TRUTH - always fetch from API)
  const { data: inboundNumbers = [], isLoading, error } = useQuery<string[]>({
    queryKey: ['inbound-numbers'],
    queryFn: () => {
      console.log('🔄 [useInboundNumbers] Fetching inbound numbers from API (SOURCE OF TRUTH)...');
      return inboundNumbersService.getAll();
    },
    retry: 2,
    refetchOnWindowFocus: true, // Refetch on window focus to ensure fresh data
    staleTime: 0, // Always consider data stale to ensure fresh fetch
  });

  // Add inbound numbers (handles duplicates, reuses trunkId)
  const addNumbers = useMutation({
    mutationFn: (data: { phoneNumbers: string[]; trunkId: string; provider?: string }) => 
      inboundNumbersService.add(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inbound-numbers'] });
      const message = data.created && data.created > 0 
        ? `Created ${data.created} new inbound number(s)${data.reused && data.reused > 0 ? `, reused ${data.reused} existing` : ''}`
        : `Reused ${data.reused} existing inbound number(s)`;
      toast.success(message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || error.message || 'Failed to add inbound numbers');
    },
  });

  // Replace all inbound numbers
  const replaceNumbers = useMutation({
    mutationFn: (phoneNumbers: string[]) => inboundNumbersService.replace(phoneNumbers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbound-numbers'] });
      toast.success('Inbound numbers updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || error.message || 'Failed to update inbound numbers');
    },
  });

  // Remove a specific inbound number
  const removeNumber = useMutation({
    mutationFn: (phoneNumber: string) => inboundNumbersService.remove(phoneNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbound-numbers'] });
      toast.success('Inbound number removed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || error.message || 'Failed to remove inbound number');
    },
  });

  // Clear all inbound data
  const clearAll = useMutation({
    mutationFn: () => inboundNumbersService.clearAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbound-numbers'] });
      queryClient.invalidateQueries({ queryKey: ['phone-settings'] });
      queryClient.invalidateQueries({ queryKey: ['inbound-agent-config'] });
      toast.success('All inbound data cleared successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || error.message || 'Failed to clear inbound data');
    },
  });

  return {
    inboundNumbers,
    isLoading,
    error,
    addNumbers,
    replaceNumbers,
    removeNumber,
    clearAll,
  };
}
