import { apiClient } from '@/lib/api';

export interface EmailTemplateParameter {
  name: string;
  description: string;
  required: boolean;
}

export interface EmailTemplate {
  _id: string;
  template_id: string;
  name: string;
  description: string;
  subject_template: string;
  body_template: string;
  parameters: EmailTemplateParameter[];
  tool_id: string;
  webhook_base_url?: string;
  sender_email?: string;
  created_at?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmailTemplateData {
  name: string;
  description: string;
  subject_template: string;
  body_template: string;
  parameters: EmailTemplateParameter[];
  sender_email?: string;
}

class EmailTemplateService {
  async getAll(): Promise<EmailTemplate[]> {
    try {
      const response = await apiClient.get<{ success: boolean; message: string; data: EmailTemplate[] }>('/email-templates');
      // apiClient.get() returns response.data directly, so response is already { success, message, data }
      return response.data || [];
    } catch (error: any) {
      console.error('[EmailTemplateService] getAll() error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch email templates');
    }
  }

  async getById(templateId: string): Promise<EmailTemplate> {
    try {
      const response = await apiClient.get<{ success: boolean; message: string; data: EmailTemplate }>(`/email-templates/${templateId}`);
      return response.data;
    } catch (error: any) {
      console.error('[EmailTemplateService] getById() error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch email template');
    }
  }

  async create(data: CreateEmailTemplateData): Promise<EmailTemplate> {
    try {
      const response = await apiClient.post<{ success: boolean; message: string; data: EmailTemplate }>('/email-templates', data);
      return response.data;
    } catch (error: any) {
      console.error('[EmailTemplateService] create() error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to create email template');
    }
  }

  async delete(templateId: string): Promise<void> {
    try {
      await apiClient.delete(`/email-templates/${templateId}`);
    } catch (error: any) {
      console.error('[EmailTemplateService] delete() error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to delete email template');
    }
  }
}

export const emailTemplateService = new EmailTemplateService();

