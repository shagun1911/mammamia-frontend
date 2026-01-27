import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

export interface SocialIntegration {
    _id: string;
    platform: 'whatsapp' | 'instagram' | 'facebook' | 'gmail';
    status: 'connected' | 'disconnected' | 'error';
    credentials?: {
        email?: string;
    };
}

export function useSocialIntegrationsStatus() {
    const [integrations, setIntegrations] = useState<Record<string, SocialIntegration | null>>({
        whatsapp: null,
        instagram: null,
        facebook: null,
        gmail: null
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchIntegrations = async () => {
            try {
                setIsLoading(true);
                const response = await apiClient.get('/social-integrations');

                if (response.success && response.data) {
                    const updated: Record<string, SocialIntegration | null> = {
                        whatsapp: null,
                        instagram: null,
                        facebook: null,
                        gmail: null
                    };

                    response.data.forEach((integration: SocialIntegration) => {
                        if (integration.platform in updated) {
                            updated[integration.platform] = integration;
                        }
                    });

                    setIntegrations(updated);
                }
            } catch (err: any) {
                console.error('Error fetching social integrations:', err);
                setError(err.message || 'Failed to load social integrations');
            } finally {
                setIsLoading(false);
            }
        };

        fetchIntegrations();
    }, []);

    return { integrations, isLoading, error };
}
