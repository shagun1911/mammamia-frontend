import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { phoneSettingsService, PhoneSettings, UpdatePhoneSettingsData } from '@/services/phoneSettings.service';
import { toast } from 'sonner';

export function usePhoneSettings() {
  const queryClient = useQueryClient();

  // Get phone settings
  const { data: settings, isLoading, error } = useQuery<PhoneSettings>({
    queryKey: ['phoneSettings'],
    queryFn: () => phoneSettingsService.getSettings(),
  });

  // Update phone settings
  const updateMutation = useMutation({
    mutationFn: (data: UpdatePhoneSettingsData) => phoneSettingsService.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phoneSettings'] });
      // Don't show toast here - let the caller handle success messages
    },
    onError: (error: any) => {
      console.error('[usePhoneSettings] Update error:', error);
      toast.error(error.response?.data?.error?.message || 'Failed to update phone settings');
      throw error; // Re-throw so caller can handle it
    },
  });

  return {
    settings,
    isLoading,
    error,
    updateSettings: updateMutation.mutateAsync, // Use mutateAsync to return a promise
    isUpdating: updateMutation.isPending,
  };
}

