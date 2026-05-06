import { apiClient } from '@/lib/api';

export interface BatchCallRecipient {
  phone_number: string;
  name: string;
  email?: string;
  dynamic_variables?: Record<string, any>;
}

export interface BatchCallRequest {
  agent_id: string;
  call_name: string;
  recipients: BatchCallRecipient[];
  retry_count?: number;
  scheduled_at?: string;
  timezone?: string;
  target_concurrency_limit?: number;
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

export interface BatchCallResult {
  [key: string]: any;
}

export interface BatchJobCallsResponse {
  calls: BatchCallResult[];
  cursor?: string;
}

export interface BatchContactDetail {
  phone_number: string;
  name: string;
  email?: string;
  status: string;
  conversation_id?: string | null;
  recipient_id?: string | null;
  duration_seconds?: number;
  end_reason?: string;
  failed_reason?: string;
  summary?: string;
  transcript?: any;
  metadata?: Record<string, any>;
  conversation?: {
    id: string;
    status: string;
    channel: string;
    createdAt: string;
    updatedAt: string;
    message_count: number;
  } | null;
}

export interface BatchJobDetailsResponse {
  batch: any;
  contacts: BatchContactDetail[];
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
      const backendMessage =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.response?.data?.detail;
      throw new Error(backendMessage || error.message || 'Failed to submit batch call');
    }
  }

  /**
   * Get batch job status
   * GET /api/v1/batch-calling/:jobId
   */
  async getBatchJobStatus(jobId: string): Promise<BatchCallResponse> {
    try {
      const response = await apiClient.get<BatchCallResponse>(`/batch-calling/${jobId}`);
      return response;
    } catch (error: any) {
      console.error('❌ [BatchCallingService] getBatchJobStatus() error:', error);
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to get batch job status');
    }
  }

  /**
   * Cancel batch job
   * POST /api/v1/batch-calling/:jobId/cancel
   */
  async cancelBatchJob(jobId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; message: string }>(`/batch-calling/${jobId}/cancel`, {});
      return response;
    } catch (error: any) {
      console.error('❌ [BatchCallingService] cancelBatchJob() error:', error);
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to cancel batch job');
    }
  }

  /**
   * Resume batch job
   * POST /api/v1/batch-calling/:jobId/resume
   */
  async resumeBatchJob(jobId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; message: string }>(`/batch-calling/${jobId}/resume`, {});
      return response;
    } catch (error: any) {
      console.error('❌ [BatchCallingService] resumeBatchJob() error:', error);
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to resume batch job');
    }
  }

  /**
   * Get all batch calls for the user
   * GET /api/v1/batch-calling
   * Backend returns { success: true, data: batchCalls[] }; apiClient.get returns the body.
   */
  async getAllBatchCalls(): Promise<any[]> {
    try {
      const response = await apiClient.get<{ success?: boolean; data?: any[] } | any[]>('/batch-calling');
      if (Array.isArray(response)) return response;
      const list = response?.data;
      return Array.isArray(list) ? list : [];
    } catch (error: any) {
      console.error('❌ [BatchCallingService] getAllBatchCalls() error:', error);
      console.error('❌ [BatchCallingService] Error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
        response: error.response
      });
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to get batch calls');
    }
  }

  /**
   * Get batch job calls (individual call results)
   * GET /api/v1/batch-calling/:jobId/calls
   */
  async getBatchJobCalls(
    jobId: string,
    options?: {
      status?: string;
      cursor?: string;
      page_size?: number;
    }
  ): Promise<BatchJobCallsResponse> {
    try {
      const params = new URLSearchParams();
      if (options?.status) params.append('status', options.status);
      if (options?.cursor) params.append('cursor', options.cursor);
      if (options?.page_size) params.append('page_size', options.page_size.toString());
      
      const queryString = params.toString();
      const url = `/batch-calling/${jobId}/calls${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get<{ success: boolean; data: BatchJobCallsResponse }>(url);
      
      // Backend returns { success: true, data: { calls: [], cursor: ... } }
      if (response && typeof response === 'object' && 'data' in response) {
        return (response as any).data;
      }
      
      return response as any;
    } catch (error: any) {
      console.error('❌ [BatchCallingService] getBatchJobCalls() error:', error);
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to get batch job calls');
    }
  }

  /**
   * Get complete per-contact details
   * GET /api/v1/batch-calling/:jobId/details
   */
  async getBatchJobDetails(jobId: string): Promise<BatchJobDetailsResponse> {
    try {
      const response = await apiClient.get<{ success: boolean; data: BatchJobDetailsResponse }>(`/batch-calling/${jobId}/details`);
      if (response && typeof response === 'object' && 'data' in response) {
        return (response as any).data;
      }
      return response as any;
    } catch (error: any) {
      console.error('❌ [BatchCallingService] getBatchJobDetails() error:', error);
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to get batch job details');
    }
  }
}

export const batchCallingService = new BatchCallingService();
