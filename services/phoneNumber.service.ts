import { apiClient } from '@/lib/api';

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
  async getById(phoneNumberId: string): Promise<PhoneNumber | null> {
    try {
      const response = await apiClient.get<any>(`/phone-numbers/${phoneNumberId}`);
      // Map backend response to frontend format
      return {
        id: response.phone_number_id || response.id,
        label: response.label,
        phone_number: response.phone_number,
        provider: response.provider,
        supports_outbound: response.supports_outbound,
        supports_inbound: response.supports_inbound,
        elevenlabs_phone_number_id: response.elevenlabs_phone_number_id,
        created_at_unix: response.created_at_unix
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
   * Delete phone number
   * DELETE /api/v1/phone-numbers/:phone_number_id
   */
  async delete(phoneNumberId: string): Promise<void> {
    try {
      await apiClient.delete(`/phone-numbers/${phoneNumberId}`);
    } catch (error: any) {
      console.error('❌ [PhoneNumberService] delete() error:', error);
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to delete phone number');
    }
  }
}

export const phoneNumberService = new PhoneNumberService();
