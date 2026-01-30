import { useMutation, useQuery } from '@tanstack/react-query';
import { batchCallingService, BatchCallRequest, BatchCallResponse, BatchJobCallsResponse } from '@/services/batchCalling.service';
import { toast } from 'sonner';

/**
 * Submit batch calling job mutation
 */
export function useSubmitBatchCall() {
  return useMutation({
    mutationFn: (data: BatchCallRequest) => batchCallingService.submitBatchCall(data),
    onSuccess: (data: BatchCallResponse) => {
      toast.success(`Batch call "${data.name}" submitted successfully! ${data.total_calls_scheduled} calls scheduled.`);
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
 * Get all batch calls query
 */
export function useBatchCalls() {
  return useQuery({
    queryKey: ['batchCalls'],
    queryFn: () => batchCallingService.getAllBatchCalls(),
    refetchInterval: (query) => {
      // Auto-refetch every 15 seconds if there are any active batch calls
      const data = query.state.data as any[] | undefined;
      if (data && data.length > 0) {
        const hasActiveCalls = data.some((call: any) => 
          ['pending', 'running', 'scheduled', 'in_progress'].includes(call.status?.toLowerCase())
        );
        return hasActiveCalls ? 15000 : 30000; // 15 seconds for active, 30 seconds for inactive
      }
      return false; // Don't auto-refetch if no batch calls
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
