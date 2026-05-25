import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { batchCallingService, BatchCallRequest, BatchCallResponse, BatchJobCallsResponse, BatchJobDetailsResponse } from '@/services/batchCalling.service';
import { toast } from 'sonner';

/**
 * Submit batch calling job mutation
 */
export function useSubmitBatchCall() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BatchCallRequest) => batchCallingService.submitBatchCall(data),
    onSuccess: (data: unknown) => {
      const response = data as {
        total_batches_created?: number;
        total_requested_recipients?: number;
        name?: string;
        total_calls_scheduled?: number;
      };

      if (response.total_batches_created && response.total_requested_recipients) {
        toast.success(
          `Batch call submitted in ${response.total_batches_created} batches for ${response.total_requested_recipients} recipients.`
        );
      } else if (response.name && typeof response.total_calls_scheduled === 'number') {
        toast.success(`Batch call "${response.name}" submitted successfully! ${response.total_calls_scheduled} calls scheduled.`);
      } else {
        toast.success('Batch call submitted successfully.');
      }
      // Immediately invalidate so the list fetches fresh data when it mounts
      queryClient.invalidateQueries({ queryKey: ['batchCalls'] });
    },
    onError: (error: any) => {
      console.error('❌ [useSubmitBatchCall] Error:', error);
      toast.error(error.message || 'Failed to submit batch call');
    },
  });
}

/**
 * Get batch job status query
 */
export function useBatchJobStatus(jobId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ['batchJobStatus', jobId],
    queryFn: () => batchCallingService.getBatchJobStatus(jobId!),
    enabled: enabled && !!jobId,
    refetchInterval: (query) => {
      // Auto-refetch every 10 seconds if job is still running
      const data = query.state.data as BatchCallResponse | undefined;
      if (data && ['pending', 'running', 'scheduled'].includes(data.status)) {
        return 10000; // 10 seconds
      }
      return false; // Don't auto-refetch if completed/cancelled
    },
  });
}

/**
 * Cancel batch job mutation
 */
export function useCancelBatchJob() {
  return useMutation({
    mutationFn: (jobId: string) => batchCallingService.cancelBatchJob(jobId),
    onSuccess: (data, jobId) => {
      toast.success(data.message || 'Batch job cancelled successfully');
    },
    onError: (error: any) => {
      console.error('❌ [useCancelBatchJob] Error:', error);
      toast.error(error.message || 'Failed to cancel batch job');
    },
  });
}

/**
 * Resume batch job mutation
 */
export function useResumeBatchJob() {
  return useMutation({
    mutationFn: (jobId: string) => batchCallingService.resumeBatchJob(jobId),
    onSuccess: (data) => {
      toast.success(data.message || 'Batch job resumed successfully');
    },
    onError: (error: any) => {
      console.error('❌ [useResumeBatchJob] Error:', error);
      toast.error(error.message || 'Failed to resume batch job');
    },
  });
}

/**
 * Get all batch calls query
 */
const ACTIVE_BATCH_STATUSES = ['pending', 'running', 'scheduled', 'in_progress', 'queued', 'processing'];

export function useBatchCalls() {
  return useQuery({
    queryKey: ['batchCalls'],
    queryFn: () => batchCallingService.getAllBatchCalls(),
    staleTime: 20_000,
    refetchInterval: (query) => {
      const data = query.state.data as any[] | undefined;
      if (!data?.length) return false;
      const hasActive = data.some((call: any) =>
        ACTIVE_BATCH_STATUSES.includes(String(call.status || '').toLowerCase())
      );
      return hasActive ? 15_000 : false;
    },
  });
}

/**
 * Get batch job calls query
 */
export function useBatchJobCalls(
  jobId: string | null,
  options?: {
    status?: string;
    cursor?: string;
    page_size?: number;
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: ['batchJobCalls', jobId, options],
    queryFn: () => batchCallingService.getBatchJobCalls(jobId!, {
      status: options?.status,
      cursor: options?.cursor,
      page_size: options?.page_size
    }),
    enabled: (options?.enabled !== false) && !!jobId,
    refetchInterval: 20000, // Refetch every 20 seconds
  });
}

/**
 * Get paginated per-contact batch details
 */
export function useBatchJobDetails(
  jobId: string | null,
  options?: { page?: number; page_size?: number; enabled?: boolean }
) {
  const page = options?.page ?? 1;
  const pageSize = options?.page_size ?? 50;
  const enabled = options?.enabled !== false;

  return useQuery({
    queryKey: ['batchJobDetails', jobId, page, pageSize],
    queryFn: () => batchCallingService.getBatchJobDetails(jobId!, { page, page_size: pageSize }),
    enabled: enabled && !!jobId,
    refetchInterval: (query) => {
      const batch = (query.state.data as BatchJobDetailsResponse | undefined)?.batch;
      const status = String(batch?.live_status || batch?.status || '').toLowerCase();
      if (ACTIVE_BATCH_STATUSES.includes(status)) return 20_000;
      return false;
    },
  });
}

/**
 * On-demand transcript for one batch contact (Mongo, no full details reload)
 */
export function useBatchContactTranscript(
  jobId: string | null,
  conversationId: string | null,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['batchContactTranscript', jobId, conversationId],
    queryFn: () => batchCallingService.getBatchContactTranscript(jobId!, conversationId!),
    enabled: enabled && !!jobId && !!conversationId,
    staleTime: 60_000,
  });
}
