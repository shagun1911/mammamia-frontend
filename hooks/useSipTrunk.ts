import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

export interface OutboundCallRequest {
  agent_id: string;
  agent_phone_number_id: string;
  to_number: string;
  customer_info?: { name?: string; email?: string; [key: string]: any };
  sender_email?: string;
  provider?: 'sip' | 'twilio'; // Optional provider parameter
}

export interface OutboundCallResponse {
  success?: boolean;
  message?: string;
  [key: string]: any;
}

/**
 * Mutation to initiate a single outbound call (test call or one-off).
 * Calls POST /api/v1/sip-trunk/outbound-call (for SIP) or POST /api/v1/phone-numbers/twilio/outbound-call (for Twilio).
 * Provider defaults to 'sip' if not specified.
 */
export function useOutboundCall() {
  return useMutation({
    mutationFn: async (data: OutboundCallRequest) => {
      // Extract provider and remove it from the request body
      const { provider = 'sip', ...requestData } = data;
      
      // Choose endpoint based on provider
      let endpoint: string;
      if (provider === 'twilio') {
        endpoint = '/phone-numbers/twilio/outbound-call';
        console.log('📞 [useOutboundCall] Using Twilio endpoint:', endpoint);
      } else {
        endpoint = '/sip-trunk/outbound-call';
        console.log('📞 [useOutboundCall] Using SIP endpoint:', endpoint);
      }
      
      const response = await apiClient.post<OutboundCallResponse>(endpoint, requestData);
      return response;
    },
    onError: (error: any) => {
      console.error('❌ [useOutboundCall] Error:', error);
      toast.error(error.response?.data?.error?.message || error.message || 'Failed to initiate outbound call');
    },
  });
}
