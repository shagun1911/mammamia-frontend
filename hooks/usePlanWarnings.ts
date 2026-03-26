import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface PlanWarning {
  type: 'callMinutes' | 'chatConversations' | 'automations';
  level: 'warning' | 'critical' | 'exceeded';
  message: string;
  current: number;
  limit: number;
  percentage: number;
}

export interface PlanLockStatus {
  locked: boolean;
  reason: string | null;
}

export function usePlanWarnings() {
  return useQuery<{ warnings: PlanWarning[], lockStatus: PlanLockStatus }>({
    queryKey: ['plan-warnings'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: { warnings: PlanWarning[], lockStatus: PlanLockStatus } }>('/plan-warnings');
      return response.data || { warnings: [], lockStatus: { locked: false, reason: null } };
    },
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  });
}

export async function checkPlanAction(action: 'call' | 'chat' | 'automation'): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  try {
    const response = await apiClient.post<{ data: { allowed: boolean; reason?: string } }>(
      '/plan-warnings/check',
      { action }
    );
    return response.data;
  } catch (error) {
    console.error('Error checking plan action:', error);
    return { allowed: true }; // Allow by default on error
  }
}
