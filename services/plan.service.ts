import { apiClient } from '@/lib/api';

export interface Plan {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  features: {
    callMinutes: number;
    chatConversations: number;
    automations: number;
    users: number;
    customFeatures: string[];
  };
  isActive: boolean;
  isDefault: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanInput {
  name: string;
  slug: string;
  description?: string;
  price: number;
  currency?: string;
  features: {
    callMinutes: number;
    chatConversations: number;
    automations: number;
    users: number;
    customFeatures?: string[];
  };
  displayOrder?: number;
}

class PlanService {
  /**
   * Get all plans
   */
  async getAllPlans(): Promise<Plan[]> {
    const response = await apiClient.get<{ data: Plan[] }>('/plans');
    return response.data;
  }

  /**
   * Get plan by ID
   */
  async getPlanById(planId: string): Promise<Plan> {
    const response = await apiClient.get<{ data: Plan }>(`/plans/${planId}`);
    return response.data;
  }

  /**
   * Create new plan (Admin only)
   */
  async createPlan(planData: CreatePlanInput): Promise<Plan> {
    const response = await apiClient.post<{ data: Plan }>('/plans', planData);
    return response.data;
  }

  /**
   * Update plan (Admin only)
   */
  async updatePlan(planId: string, planData: Partial<CreatePlanInput>): Promise<Plan> {
    const response = await apiClient.put<{ data: Plan }>(`/plans/${planId}`, planData);
    return response.data;
  }

  /**
   * Delete plan (Admin only)
   */
  async deletePlan(planId: string): Promise<void> {
    await apiClient.delete(`/plans/${planId}`);
  }

  /**
   * Assign plan to organization (Admin only)
   */
  async assignPlanToOrganization(organizationId: string, planId: string): Promise<{
    message: string;
    organization: any;
    plan: Plan;
  }> {
    console.log('[PlanService] Assigning plan:', { organizationId, planId });
    console.log('[PlanService] Data types:', { 
      organizationIdType: typeof organizationId, 
      planIdType: typeof planId,
      organizationIdValue: organizationId,
      planIdValue: planId
    });
    
    const payload = {
      organizationId: String(organizationId),
      planId: String(planId)
    };
    
    console.log('[PlanService] Sending payload:', payload);
    
    const response = await apiClient.post('/plans/assign', payload);
    console.log('[PlanService] Response:', response);
    return response.data;
  }
}

export const planService = new PlanService();
