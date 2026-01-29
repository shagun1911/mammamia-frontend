import { apiClient } from '@/lib/api';

export interface OutboundCallRequest {
  agent_id: string;
  agent_phone_number_id: string;
  to_number: string;
  customer_info?: {
    email?: string;
    name?: string;
  };
  sender_email?: string;
}

export interface OutboundCallResponse {
  success: boolean;
  message: string;
  conversation_id: string;
  sip_call_id: string;
}

/**
 * SIP Trunk Service
 * Handles outbound calls via SIP trunk
 */
class SipTrunkService {
  /**
   * Initiate outbound call via SIP trunk
   * POST /api/v1/sip-trunk/outbound-call
   */
  async outboundCall(data: OutboundCallRequest): Promise<OutboundCallResponse> {
    try {
      const response = await apiClient.post<OutboundCallResponse>('/sip-trunk/outbound-call', data);
      return response;
    } catch (error: any) {
      console.error('❌ [SipTrunkService] outboundCall() error:', error);
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to initiate outbound call');
    }
  }
}

export const sipTrunkService = new SipTrunkService();
