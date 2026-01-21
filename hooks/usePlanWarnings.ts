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

export function usePlanWarnings() {
  return useQuery<PlanWarning[]>({
    queryKey: ['plan-warnings'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: PlanWarning[] }>('/plan-warnings');
      return response.data || [];
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
