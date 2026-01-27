import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { IntegrationStatus } from '@/services/admin.service';

interface GoogleIntegrationState {
  status: IntegrationStatus['google'] | null;
  isLoading: boolean;
  error: string | null;
}

export const useGoogleIntegrationsStatus = (): GoogleIntegrationState => {
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus['google'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Use the user-level Google status endpoint instead of the admin one
        const response = await apiClient.get('/integrations/google/status');

        // The backend returns { success: true, data: { connected, services, ... } }
        // apiClient.get returns response.data directly, which is the successResponse object
        const data = response?.data || response;

        if (data && data.connected) {
          setIntegrationStatus({
            connected: true,
            services: data.services,
            tokenExpiry: data.tokenExpiry,
            lastSyncedAt: data.lastSyncedAt
          });
        } else {
          setIntegrationStatus(null);
        }
      } catch (err: any) {
        console.error('Error fetching Google integration status:', err);
        setError(err.message || 'Failed to fetch Google integration status');
        setIntegrationStatus(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, []);

  return { status: integrationStatus, isLoading, error };
};
