import { useMutation } from '@tanstack/react-query';
import { sipTrunkService } from '@/services/sipTrunk.service';
import { toast } from 'sonner';

export interface OutboundCallRequest {
  agent_id: string;
  agent_phone_number_id: string;
  to_number: string;
  customer_info?: {
    email?: string;
    name?: string;
  };
  dynamic_variables?: {
    [key: string]: any;
  };
  sender_email?: string;
}

export interface OutboundCallResponse {
  success: boolean;
  message: string;
  conversation_id: string;
  sip_call_id?: string;
  callSid?: string;
  conversation_db_id?: string; // MongoDB conversation ID - used to navigate to conversation
  ecommerce_enabled?: boolean;
}

/**
 * Initiate outbound call mutation
 */
export function useOutboundCall() {
  return useMutation({
    mutationFn: (data: OutboundCallRequest) => sipTrunkService.outboundCall(data),
    onSuccess: (data: OutboundCallResponse) => {
      if (data.success) {
        toast.success(data.message || 'Outbound call initiated successfully');
      } else {
        toast.error(data.message || 'Outbound call failed');
      }
    },
    onError: (error: any) => {
      console.error('❌ [useOutboundCall] Error:', error);
      toast.error(error.message || 'Failed to initiate outbound call');
    },
  });
}
