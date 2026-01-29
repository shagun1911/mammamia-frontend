import { useMutation, useQuery } from '@tanstack/react-query';
import { batchCallingService, BatchCallRequest, BatchCallResponse } from '@/services/batchCalling.service';
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
    refetchInterval: 30000, // Refetch every 30 seconds to get updated status
  });
}
