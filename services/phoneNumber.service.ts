import { apiClient } from '@/lib/api';
import axios from 'axios';

export interface PhoneNumber {
  id: string; // phone_number_id
  label: string;
  phone_number: string; // E.164 format
  provider: 'twilio' | 'sip' | 'sip_trunk';
  supports_outbound?: boolean;
  supports_inbound?: boolean;
  elevenlabs_phone_number_id?: string; // ElevenLabs-generated phone_number_id - REQUIRED for outbound calls
  created_at_unix: number;
}

export interface CreatePhoneNumberData {
  label: string;
  phone_number: string;
  sid?: string;
  token?: string;
  provider?: 'twilio' | 'sip';
}

/**
 * Phone Number Service
 * Handles phone number management (organization-scoped)
 */
class PhoneNumberService {
  /**
   * Create a new phone number
   * POST /api/v1/phone-numbers
   */
  async create(data: CreatePhoneNumberData): Promise<{ phone_number_id: string }> {
    try {
      const response = await apiClient.post<{ phone_number_id: string }>('/phone-numbers', data);
      return response;
    } catch (error: any) {
      console.error('❌ [PhoneNumberService] create() error:', error);
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to create phone number');
    }
  }

  /**
   * Get all phone numbers for organization
   * GET /api/v1/phone-numbers
   */
  async getAll(cursor?: string, pageSize: number = 30): Promise<{ phone_numbers: PhoneNumber[]; cursor: string | null }> {
    try {
      const params = new URLSearchParams();
      if (cursor) params.append('cursor', cursor);
      params.append('page_size', pageSize.toString());
      
      const response = await apiClient.get<{ phone_numbers: any[]; cursor: string | null }>(`/phone-numbers?${params.toString()}`);
      
      // Map backend response to frontend format
      return {
        phone_numbers: (response.phone_numbers || []).map((pn: any) => ({
          id: pn.phone_number_id || pn.id,
          label: pn.label,
          phone_number: pn.phone_number,
          provider: pn.provider,
          supports_outbound: pn.supports_outbound,
          supports_inbound: pn.supports_inbound,
          elevenlabs_phone_number_id: pn.elevenlabs_phone_number_id,
          created_at_unix: pn.created_at_unix
        })),
        cursor: response.cursor || null
      };
    } catch (error: any) {
      console.error('❌ [PhoneNumberService] getAll() error:', error);
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to fetch phone numbers');
    }
  }

  /**
   * Get phone number by ID
   * GET /api/v1/phone-numbers/:phone_number_id
   */
  async getById(phoneNumberId: string): Promise<any> {
    try {
      const response = await apiClient.get<any>(`/phone-numbers/${phoneNumberId}`);
      // Map backend response to frontend format, including trunk configs
      return {
        id: response.phone_number_id || response.id,
        phone_number_id: response.phone_number_id || response.id,
        label: response.label,
        phone_number: response.phone_number,
        provider: response.provider,
        supports_outbound: response.supports_outbound,
        supports_inbound: response.supports_inbound,
        elevenlabs_phone_number_id: response.elevenlabs_phone_number_id,
        created_at_unix: response.created_at_unix,
        // Include trunk configs if present (needed for PATCH payload)
        inbound_trunk_config: response.inbound_trunk_config,
        outbound_trunk_config: response.outbound_trunk_config,
        agent_id: response.agent_id
      };
    } catch (error: any) {
      console.error('❌ [PhoneNumberService] getById() error:', error);
      if (error.response?.status === 404) {
        return null;
      }
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to fetch phone number');
    }
  }

  /**
   * Update phone number
   * PATCH /api/v1/phone-numbers/:phone_number_id
   */
  async update(
    phoneNumberId: string,
    data: {
      label?: string;
      agent_id?: string | null;
      supports_inbound?: boolean;
      supports_outbound?: boolean;
      inbound_trunk_config?: {
        address: string;
        credentials: {
          username: string;
          password: string;
        };
        media_encryption?: string;
        transport?: string;
      };
      outbound_trunk_config?: {
        address: string;
        credentials: {
          username: string;
          password: string;
        };
        media_encryption?: string;
        transport?: string;
      };
    }
  ): Promise<any> {
    try {
      // ============================================================================
      // STEP 4: ENFORCE CONTENT-TYPE AND METHOD
      // Ensure PATCH method, Content-Type header, and payload object (not string)
      // ============================================================================
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      
      // ============================================================================
      // STEP 5: PRE-SEND ASSERTIONS (Service Level)
      // Final validation before axios sends request
      // ============================================================================
      // Ensure data is an object, not a string
      if (typeof data === 'string') {
        throw new Error('Payload must be an object, not a JSON string. Use plain JS object.');
      }

      // Ensure data is not null or undefined
      if (data === null || data === undefined) {
        throw new Error('Payload cannot be null or undefined');
      }

      // Test JSON serialization one more time (axios will do this, but we validate first)
      try {
        JSON.stringify(data);
      } catch (stringifyError: any) {
        throw new Error(`Payload is not JSON-serializable: ${stringifyError.message}`);
      }

      // ============================================================================
      // STEP 4: Send PATCH request with proper headers
      // Axios automatically serializes the object to JSON
      // ============================================================================
      const response = await axios.patch<any>(
        `${API_URL}/phone-numbers/${phoneNumberId}`,
        data, // Plain JS object - axios will serialize to JSON
        {
          headers: {
            'Content-Type': 'application/json', // Explicit Content-Type
            ...(token && { Authorization: `Bearer ${token}` })
          },
          // Ensure axios uses PATCH method (not POST with method override)
          method: 'PATCH'
        }
      );
      
      // STEP 5: Ensure HTTP status is 200 before returning success
      if (response.status !== 200) {
        console.error('❌ [PhoneNumberService] update() - Non-200 status:', response.status);
        throw new Error(`Update failed with status ${response.status}`);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ [PhoneNumberService] update() error:', error);
      // STEP 5: Do NOT swallow errors - always throw
      throw new Error(error.response?.data?.error?.message || error.response?.data?.detail || error.message || 'Failed to update phone number');
    }
  }

  /**
   * Delete phone number
   * DELETE /api/v1/phone-numbers/:phone_number_id
   */
  async delete(phoneNumberId: string): Promise<void> {
    try {
      // ============================================================================
      // STEP 5: FRONTEND-BACKEND CONTRACT SAFETY
      // Use raw axios call to access response status (apiClient.delete returns only data)
      // ============================================================================
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      
      const response = await axios.delete(
        `${API_URL}/phone-numbers/${phoneNumberId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          }
        }
      );
      
      // STEP 5: Ensure HTTP status is 200 before returning success
      if (response.status !== 200) {
        console.error('❌ [PhoneNumberService] delete() - Non-200 status:', response.status);
        throw new Error(`Delete failed with status ${response.status}`);
      }
      
      // Verify response matches API spec
      if (!response.data || !response.data.success) {
        console.error('❌ [PhoneNumberService] delete() - Invalid response format:', response.data);
        throw new Error('Delete response does not match expected format');
      }
    } catch (error: any) {
      console.error('❌ [PhoneNumberService] delete() error:', error);
      // STEP 5: Do NOT swallow errors - always throw
      throw new Error(error.response?.data?.error?.message || error.response?.data?.detail || error.message || 'Failed to delete phone number');
    }
  }
}

export const phoneNumberService = new PhoneNumberService();
