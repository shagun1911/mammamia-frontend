import { useMutation } from '@tanstack/react-query';
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
