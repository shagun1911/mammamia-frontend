import { apiClient } from '@/lib/api';

export interface BatchCallRecipient {
  phone_number: string;
  name: string;
  email?: string;
}

export interface BatchCallRequest {
  agent_id: string;
  call_name: string;
  recipients: BatchCallRecipient[];
  retry_count?: number;
  sender_email?: string;
  phone_number_id?: string; // Internal phone number ID - backend will resolve to ElevenLabs ID
  ecommerce_credentials?: {
    platform?: string;
    base_url?: string;
    api_key?: string;
    api_secret?: string;
    access_token?: string;
  };
}

export interface BatchCallResponse {
  id: string;
  name: string;
  agent_id: string;
  status: string;
  phone_number_id: string;
  phone_provider: string;
  created_at_unix: number;
  scheduled_time_unix: number;
  timezone: string;
  total_calls_dispatched: number;
  total_calls_scheduled: number;
  total_calls_finished: number;
  last_updated_at_unix: number;
  retry_count: number;
  agent_name: string;
}

/**
 * Batch Calling Service
 * Handles batch calling operations
 */
class BatchCallingService {
  /**
   * Submit batch calling job
   * POST /api/v1/batch-calling/submit
   */
  async submitBatchCall(data: BatchCallRequest): Promise<BatchCallResponse> {
    try {
      const response = await apiClient.post<BatchCallResponse>('/batch-calling/submit', data);
      return response;
    } catch (error: any) {
      console.error('❌ [BatchCallingService] submitBatchCall() error:', error);
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to submit batch call');
    }
  }
}

export const batchCallingService = new BatchCallingService();
