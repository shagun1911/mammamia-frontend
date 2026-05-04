import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService, UpdateSettingsData, CreateOperatorData } from '@/services/settings.service';
import { toast } from 'sonner';

/**
 * Fetch all settings
 */
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.getSettings(),
  });
}

/**
 * Fetch all operators
 */
export function useOperators() {
  return useQuery({
    queryKey: ['operators'],
    queryFn: () => settingsService.getOperators(),
  });
}

/**
 * Fetch all channels
 */
export function useChannels() {
  return useQuery({
    queryKey: ['channels'],
    queryFn: () => settingsService.getChannels(),
  });
}

/**
 * Fetch all labels
 */
export function useLabels() {
  return useQuery({
    queryKey: ['labels'],
    queryFn: () => settingsService.getLabels(),
  });
}

/**
 * Fetch all folders
 */
export function useFolders() {
  return useQuery({
    queryKey: ['folders'],
    queryFn: () => settingsService.getFolders(),
  });
}

/**
 * Fetch webhooks
 */
export function useWebhooks() {
  return useQuery({
    queryKey: ['webhooks'],
    queryFn: () => settingsService.getWebhooks(),
  });
}

/**
 * Update settings mutation
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateSettingsData) => settingsService.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update settings');
    },
  });
}

/**
 * Upload chatbot avatar/logo image
 */
export function useUploadChatbotAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => settingsService.uploadChatbotAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Logo uploaded');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload logo');
    },
  });
}

/**
 * Create operator mutation
 */
export function useCreateOperator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOperatorData) => settingsService.createOperator(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operators'] });
      toast.success('Operator created');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create operator');
    },
  });
}

/**
 * Update operator mutation
 */
export function useUpdateOperator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateOperatorData> }) =>
      settingsService.updateOperator(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operators'] });
      toast.success('Operator updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update operator');
    },
  });
}

/**
 * Delete operator mutation
 */
export function useDeleteOperator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => settingsService.deleteOperator(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operators'] });
      toast.success('Operator deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete operator');
    },
  });
}

/**
 * Create label mutation
 */
export function useCreateLabel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, color, description }: { name: string; color: string; description?: string }) =>
      settingsService.createLabel(name, color, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels'] });
      toast.success('Label created');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create label');
    },
  });
}

/**
 * Delete label mutation
 */
export function useDeleteLabel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => settingsService.deleteLabel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels'] });
      toast.success('Label deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete label');
    },
  });
}

/**
 * Create folder mutation
 */
export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      settingsService.createFolder(name, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast.success('Folder created');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create folder');
    },
  });
}

