import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

export interface OutboundCallRequest {
  agent_id: string;
  agent_phone_number_id: string;
  to_number: string;
  customer_info?: { name?: string; email?: string; [key: string]: any };
  sender_email?: string;
}

export interface OutboundCallResponse {
  success?: boolean;
  message?: string;
  [key: string]: any;
}

/**
 * Mutation to initiate a single outbound call (test call or one-off).
 * Calls POST /api/v1/sip-trunk/outbound-call.
 */
export function useOutboundCall() {
  return useMutation({
    mutationFn: async (data: OutboundCallRequest) => {
      const response = await apiClient.post<OutboundCallResponse>('/sip-trunk/outbound-call', data);
      return response;
    },
    onError: (error: any) => {
      console.error('❌ [useOutboundCall] Error:', error);
      toast.error(error.response?.data?.error?.message || error.message || 'Failed to initiate outbound call');
    },
  });
}
