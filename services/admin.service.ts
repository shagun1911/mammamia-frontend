import { apiClient } from '@/lib/api';

export interface DashboardMetrics {
  totalOrganizations: number;
  activeOrganizations: number;
  totalUsers: number;
  totalAutomations: number;
  activeAutomations: number;
  totalExecutions: number;
  failedExecutions: number;
  googleIntegrations: number;
  whatsappIntegrations: number;
  instagramIntegrations: number;
  facebookIntegrations: number;
  ecommerceIntegrations: number;
  totalCallMinutes: number;
  totalChatConversations: number;
}

export interface AutomationListItem {
  _id: string;
  name: string;
  description?: string;
  organizationId?: {
    _id: string;
    name: string;
    slug: string;
  };
  userId?: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  isActive: boolean;
  nodeCount: number;
  executionCount: number;
  lastExecutedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionLog {
  _id: string;
  automationId: {
    _id: string;
    name: string;
    organizationId?: {
      _id: string;
      name: string;
      slug: string;
    };
  };
  status: 'success' | 'failed' | 'pending';
  triggerData: any;
  actionData: any;
  errorMessage?: string;
  executedAt: string;
}

export interface IntegrationStatus {
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  google: {
    connected: boolean;
    tokenExpiry?: string;
    services?: {
      gmail: boolean;
      sheets: boolean;
      calendar: boolean;
      drive: boolean;
    };
    lastSyncedAt?: string;
  };
  whatsapp: {
    connected: boolean;
    webhookVerified?: boolean;
    lastSyncedAt?: string;
  };
  instagram: {
    connected: boolean;
    webhookVerified?: boolean;
    lastSyncedAt?: string;
  };
  facebook: {
    connected: boolean;
    webhookVerified?: boolean;
    lastSyncedAt?: string;
  };
  ecommerce: {
    connected: boolean;
    platform?: 'shopify' | 'woocommerce' | 'magento2' | 'prestashop' | 'qapla' | null;
    lastSyncedAt?: string;
    enabledTriggers?: number;
  };
}

export interface OrganizationUsage {
  organizationId: string;
  organizationName: string;
  callMinutes: number;
  chatConversations: number;
  automations: number;
}

export interface OrganizationWithUsage {
  _id: string;
  name: string;
  slug: string;
  plan: string; // Original plan field from Organization model
  status: string;
  createdAt: string;
  updatedAt: string;
  ownerId?: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  usage: {
    callMinutes: number;
    chatConversations: number;
    automations: number;
  };
  integrations: {
    google: boolean;
    whatsapp: boolean;
    instagram: boolean;
    facebook: boolean;
    ecommerce: {
      connected: boolean;
      platform: string | null;
    };
  };
  integrationCount: {
    google: number;
    whatsapp: number;
    instagram: number;
    facebook: number;
    ecommerce: number;
  };
  planDetails: {
    name: string;
    status: string;
    package: string | null;
    billingActive: boolean;
  };
}

class AdminService {
  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const response = await apiClient.get('/admin/dashboard/metrics');
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch dashboard metrics');
    }
  }

  /**
   * Get all automations
   */
  async getAllAutomations(filters?: {
    organizationId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const response = await apiClient.get('/admin/automations', {
        params: filters
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch automations');
    }
  }

  /**
   * Get automation by ID
   */
  async getAutomationById(automationId: string) {
    try {
      const response = await apiClient.get(`/admin/automations/${automationId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch automation');
    }
  }

  /**
   * Toggle automation status
   */
  async toggleAutomation(automationId: string, isActive: boolean) {
    try {
      const response = await apiClient.patch(`/admin/automations/${automationId}/toggle`, {
        isActive
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to toggle automation');
    }
  }

  /**
   * Get execution logs
   */
  async getExecutionLogs(filters?: {
    organizationId?: string;
    automationId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const response = await apiClient.get('/admin/executions', {
        params: filters
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch execution logs');
    }
  }

  /**
   * Get execution by ID
   */
  async getExecutionById(executionId: string) {
    try {
      const response = await apiClient.get(`/admin/executions/${executionId}`);
      return response.data || response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch execution');
    }
  }

  /**
   * Re-run execution
   */
  async rerunExecution(executionId: string) {
    try {
      const response = await apiClient.post(`/admin/executions/${executionId}/rerun`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to rerun execution');
    }
  }

  /**
   * Get integrations status
   */
  async getIntegrationsStatus(): Promise<IntegrationStatus[]> {
    try {
      const response = await apiClient.get('/admin/integrations/status');
      return response.data || response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch integrations status');
    }
  }

  /**
   * Get all organizations with usage analytics
   */
  async getOrganizations(filters?: {
    plan?: string;
    status?: string;
  }) {
    try {
      const response = await apiClient.get('/admin/organizations', {
        params: filters
      });
      return response.data || response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch organizations');
    }
  }

  /**
   * Get organization usage analytics
   */
  async getOrganizationUsage(filters?: {
    organizationId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    try {
      const response = await apiClient.get('/admin/organizations/usage', {
        params: filters
      });
      return response.data || response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch organization usage');
    }
  }

  /**
   * Get all users with profile and usage information
   */
  async getAllUsers(filters?: {
    role?: string;
    status?: string;
    search?: string;
  }) {
    try {
      const response = await apiClient.get('/admin/users', {
        params: filters
      });
      return response.data || response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch users');
    }
  }

  /**
   * Get user details
   */
  async getUserDetails(userId: string) {
    try {
      const response = await apiClient.get(`/admin/users/${userId}`);
      return response.data || response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch user details');
    }
  }

  /**
   * Upgrade user billing plan
   */
  async upgradeUserPlan(userId: string, profileType: 'mileva' | 'nobel' | 'aistein', organizationPlan?: string) {
    try {
      const response = await apiClient.patch(`/admin/users/${userId}/upgrade-plan`, {
        profileType,
        organizationPlan
      });
      return response.data || response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to upgrade user plan');
    }
  }

  /**
   * Get usage reports
   */
  async getUsageReports(filters?: {
    dateFrom?: string;
    dateTo?: string;
  }) {
    try {
      const response = await apiClient.get('/admin/analytics/usage-reports', {
        params: filters
      });
      return response.data || response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch usage reports');
    }
  }

  /**
   * Get billing overview
   */
  async getBillingOverview() {
    try {
      const response = await apiClient.get('/admin/billing/overview');
      return response.data || response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch billing overview');
    }
  }

  /**
   * Get system settings
   */
  async getSystemSettings() {
    try {
      const response = await apiClient.get('/admin/settings');
      return response.data || response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch system settings');
    }
  }

  /**
   * Update system settings
   */
  async updateSystemSettings(settings: any) {
    try {
      const response = await apiClient.put('/admin/settings', settings);
      return response.data || response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update system settings');
    }
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(filters?: {
    action?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const response = await apiClient.get('/admin/audit/logs', {
        params: filters
      });
      return response.data || response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch audit logs');
    }
  }

  /**
   * Get system alerts
   */
  async getSystemAlerts() {
    try {
      const response = await apiClient.get('/admin/alerts');
      return response.data || response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch system alerts');
    }
  }
}

export interface UserWithProfile {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  selectedProfile?: string;
  organization?: {
    _id: string;
    name: string;
    slug: string;
    plan: string;
    status: string;
  } | null;
  profile?: {
    profileType: string;
    chatConversationsLimit: number;
    voiceMinutesLimit: number;
    chatConversationsUsed: number;
    voiceMinutesUsed: number;
    billingCycleStart: string;
    billingCycleEnd: string;
    isActive: boolean;
    usagePercentage?: {
      chat: number;
      voice: number;
    };
  } | null;
}

export const adminService = new AdminService();
