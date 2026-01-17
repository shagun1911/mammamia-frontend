'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/lib/toast';
import { apiClient } from '@/lib/api';
import { 
  MessageSquare, 
  Facebook, 
  Instagram, 
  CheckCircle2,
  XCircle,
  Loader2,
  Settings,
  ExternalLink
} from 'lucide-react';

interface Integration {
  _id: string;
  platform: 'whatsapp' | 'instagram' | 'facebook';
  status: 'connected' | 'disconnected' | 'error';
  credentials: {
    apiKey: string;
    clientId?: string;
    phoneNumberId?: string;
    wabaId?: string;
    instagramAccountId?: string;
    facebookPageId?: string;
  };
  webhookVerified: boolean;
  errorMessage?: string;
  lastSyncedAt?: string;
}

interface IntegrationConfig {
  apiKey: string;
  phoneNumberId?: string;
  wabaId?: string;
}

// Platform configuration - centralized to avoid UI logic leakage
const PLATFORMS = {
  whatsapp: {
    name: 'WhatsApp Business',
    description: 'Connect your WhatsApp Business account via Meta OAuth',
    icon: MessageSquare,
    color: 'green',
    oauthEnabled: true
  },
  instagram: {
    name: 'Instagram Direct',
    description: 'Connect your Instagram Business account via Meta OAuth',
    icon: Instagram,
    color: 'pink',
    oauthEnabled: true
  },
  facebook: {
    name: 'Facebook Messenger',
    description: 'Connect your Facebook Page via Meta OAuth',
    icon: Facebook,
    color: 'blue',
    oauthEnabled: true
  }
} as const;

export default function SocialIntegrations() {
  const [integrations, setIntegrations] = useState<Record<string, Integration | null>>({
    whatsapp: null,
    instagram: null,
    facebook: null
  });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showManualForm, setShowManualForm] = useState<string | null>(null);
  const [manualForm, setManualForm] = useState<IntegrationConfig>({
    apiKey: '',
    phoneNumberId: '',
    wabaId: ''
  });

  useEffect(() => {
    fetchIntegrations();
    
    // Handle OAuth callback success/error
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');
    const platform = params.get('platform');
    
    if (success === 'true' && platform) {
      toast.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} connected successfully!`);
      window.history.replaceState({}, '', '/settings/socials');
      fetchIntegrations();
    } else if (error && platform) {
      toast.error(`Failed to connect ${platform}: ${decodeURIComponent(error)}`);
      window.history.replaceState({}, '', '/settings/socials');
    }
  }, []);

  const fetchIntegrations = async () => {
    try {
      const response = await apiClient.get('/social-integrations');
      
      if (response.success && response.data) {
        const updated: Record<string, Integration | null> = {
          whatsapp: null,
          instagram: null,
          facebook: null
        };
        
        response.data.forEach((integration: Integration) => {
          if (integration.platform in updated) {
            updated[integration.platform] = integration;
          }
        });
        
        setIntegrations(updated);
      }
    } catch (error: any) {
      console.error('Error fetching integrations:', error);
      if (error.response?.status !== 401) {
        toast.error(error.message || 'Failed to load integrations');
      }
    } finally {
      setLoading(false);
    }
  };

  const initiateOAuth = async (platform: 'whatsapp' | 'instagram' | 'facebook') => {
    setConnecting(platform);
    try {
      const response = await apiClient.post(`/social-integrations/${platform}/oauth/initiate`);
      
      // Log raw response for debugging
      console.log('OAuth initiate raw response:', response);
      console.log('Response check:', {
        success: response.success,
        hasData: !!response.data,
        hasAuthUrl: !!response.data?.authUrl,
        authUrl: response.data?.authUrl?.substring(0, 100)
      });
      
      // Backend returns: { success: true, data: { authUrl } }
      // Handle both possible response shapes (flat or nested)
      const authUrl = response.data?.authUrl || response.data?.data?.authUrl;
      
      if (response.success && authUrl) {
        // Redirect to Meta OAuth - full page redirect (not popup)
        console.log('Redirecting to OAuth URL:', authUrl.substring(0, 100) + '...');
        window.location.href = authUrl;
      } else {
        console.error('Invalid response format:', {
          success: response.success,
          hasAuthUrl: !!authUrl,
          responseKeys: Object.keys(response),
          dataKeys: response.data ? Object.keys(response.data) : null
        });
        throw new Error('Failed to get OAuth URL from server');
      }
    } catch (error: any) {
      // Log full error structure for debugging
      console.error('OAuth initiation error (full):', error);
      console.error('Error structure breakdown:', {
        'error.message': error.message,
        'error.status': error.status,
        'error.data': error.data,
        'error.response': error.response,
        'error.response?.status': error.response?.status,
        'error.response?.data': error.response?.data,
        'error.data?.error': error.data?.error,
        'error.data?.error?.message': error.data?.error?.message,
        'error.response?.data?.error': error.response?.data?.error,
        'error.response?.data?.error?.message': error.response?.data?.error?.message,
      });
      
      // Extract error message from various possible locations
      // Priority order:
      // 1. error.data.error.message (from formatError interceptor)
      // 2. error.response.data.error.message (direct axios error)
      // 3. error.data.message (fallback)
      // 4. error.response.data.message (fallback)
      // 5. error.message (already formatted message)
      const errorMessage = error.data?.error?.message || 
                          error.response?.data?.error?.message ||
                          error.data?.message ||
                          error.response?.data?.message ||
                          (error.message !== 'An error occurred' ? error.message : null) ||
                          'Failed to initiate OAuth flow';
      
      const statusCode = error.status || error.response?.status;
      
      console.log('Extracted error message:', errorMessage, 'Status:', statusCode);
      
      if (statusCode === 401) {
        toast.error('Authentication failed. Please log in again.');
      } else if (statusCode === 500) {
        // Show detailed error message from backend
        if (errorMessage.includes('META_APP') || errorMessage.includes('Missing required environment variables')) {
          toast.error(`Configuration Error: ${errorMessage}`);
        } else if (errorMessage.includes('configured')) {
          toast.error('Meta OAuth is not configured. Please contact your administrator.');
        } else {
          toast.error(`Error: ${errorMessage}`);
        }
      } else {
        toast.error(errorMessage);
      }
      setConnecting(null);
    }
  };

  const disconnectPlatform = async (platform: 'whatsapp' | 'instagram' | 'facebook') => {
    if (!confirm(`Are you sure you want to disconnect ${platform}?`)) return;

    try {
      const response = await apiClient.delete(`/social-integrations/${platform}/disconnect`);
      
      if (response.success) {
        toast.success(`${PLATFORMS[platform].name} disconnected`);
        await fetchIntegrations();
      }
    } catch (error: any) {
      console.error('Error disconnecting platform:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to disconnect';
      toast.error(errorMessage);
    }
  };

  const connectManual = async (platform: 'whatsapp') => {
    // Manual connection only for WhatsApp (360dialog)
    if (platform !== 'whatsapp') return;
    
    setConnecting(platform);
    try {
      const response = await apiClient.post(`/social-integrations/${platform}/connect`, {
        apiKey: manualForm.apiKey,
        phoneNumberId: manualForm.phoneNumberId,
        wabaId: manualForm.wabaId
      });

      if (response.success) {
        toast.success('WhatsApp connected successfully!');
        setShowManualForm(null);
        setManualForm({ apiKey: '', phoneNumberId: '', wabaId: '' });
        await fetchIntegrations();
      }
    } catch (error: any) {
      console.error('Error connecting platform:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to connect';
      toast.error(errorMessage);
    } finally {
      setConnecting(null);
    }
  };

  const getStatusBadge = (integration: Integration | null) => {
    if (!integration) {
      return <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800">Disconnected</Badge>;
    }
    
    switch (integration.status) {
      case 'connected':
        return <Badge className="bg-green-500 hover:bg-green-600">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Disconnected</Badge>;
    }
  };

  const renderPlatformCard = (platform: 'whatsapp' | 'instagram' | 'facebook') => {
    const config = PLATFORMS[platform];
    const integration = integrations[platform];
    const Icon = config.icon;
    const isConnected = integration?.status === 'connected';
    const hasError = integration?.status === 'error';
    const isConnecting = connecting === platform;
    const showForm = showManualForm === platform;

    return (
      <Card className="p-6 border-border hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4 flex-1">
            <div className={`p-3 rounded-lg ${
              platform === 'whatsapp' ? 'bg-green-50 dark:bg-green-900/20' :
              platform === 'instagram' ? 'bg-pink-50 dark:bg-pink-900/20' :
              'bg-blue-50 dark:bg-blue-900/20'
            }`}>
              <Icon className={`h-6 w-6 ${
                platform === 'whatsapp' ? 'text-green-600' :
                platform === 'instagram' ? 'text-pink-600' :
                'text-blue-600'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-semibold text-lg text-foreground">{config.name}</h3>
                {getStatusBadge(integration)}
              </div>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>
          </div>
        </div>

        {/* Error message */}
        {hasError && integration?.errorMessage && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              <XCircle className="inline h-4 w-4 mr-1" />
              {integration.errorMessage}
            </p>
          </div>
        )}

        {/* Success message */}
        {isConnected && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              <CheckCircle2 className="inline h-4 w-4 mr-1" />
              Connected and active
              {integration?.lastSyncedAt && (
                <span className="ml-2 text-xs opacity-75">
                  Last synced: {new Date(integration.lastSyncedAt).toLocaleString()}
                </span>
              )}
            </p>
          </div>
        )}

        {/* OAuth Button (Primary CTA) */}
        {!showForm && (
          <div className="space-y-3">
            {!isConnected ? (
              <Button
                onClick={() => initiateOAuth(platform)}
                disabled={isConnecting}
                className={`w-full h-11 text-base font-medium ${
                  platform === 'whatsapp'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : platform === 'instagram'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Icon className="mr-2 h-5 w-5" />
                    Login with {config.name.split(' ')[0]}
                  </>
                )}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={() => disconnectPlatform(platform)}
                  variant="destructive"
                  className="flex-1"
                >
                  Disconnect
                </Button>
                <Button
                  onClick={() => initiateOAuth(platform)}
                  variant="outline"
                  className="flex-1"
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Reconnecting...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Reconnect
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Manual form is only shown in Advanced section, not in card */}
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Social Integrations</h1>
          <p className="text-muted-foreground">
            Connect your social media accounts to manage conversations in one place
          </p>
        </div>

        {/* Platform Cards */}
        <div className="grid gap-6 md:grid-cols-1">
          {renderPlatformCard('whatsapp')}
          {renderPlatformCard('instagram')}
          {renderPlatformCard('facebook')}
        </div>

        {/* Advanced Section */}
        <Card className="p-6 border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Advanced</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Hide' : 'Show'}
            </Button>
          </div>
          
          {showAdvanced && (
            <div className="space-y-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-4">
                Manual setup is available for WhatsApp (360dialog API). Instagram and Facebook require OAuth.
              </p>
              
              {!showManualForm && (
                <Button
                  variant="outline"
                  onClick={() => setShowManualForm('whatsapp')}
                  className="w-full"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Manual WhatsApp Setup (360dialog)
                </Button>
              )}
              
              {showManualForm === 'whatsapp' && (
                <Card className="p-6 border-border">
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        ℹ️ <strong>360dialog Integration:</strong> Use this for 360dialog API. For Meta WhatsApp Business API, use OAuth above.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="manual-api-key">360dialog API Key *</Label>
                      <Input
                        id="manual-api-key"
                        type="password"
                        placeholder="Enter your 360dialog API key"
                        value={manualForm.apiKey}
                        onChange={(e) => setManualForm({ ...manualForm, apiKey: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="manual-phone-number-id">Phone Number ID *</Label>
                      <Input
                        id="manual-phone-number-id"
                        placeholder="Enter 360dialog Phone Number ID"
                        value={manualForm.phoneNumberId || ''}
                        onChange={(e) => setManualForm({ ...manualForm, phoneNumberId: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="manual-waba-id">WABA ID (Optional)</Label>
                      <Input
                        id="manual-waba-id"
                        placeholder="Enter WhatsApp Business Account ID"
                        value={manualForm.wabaId || ''}
                        onChange={(e) => setManualForm({ ...manualForm, wabaId: e.target.value })}
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => connectManual('whatsapp')}
                        disabled={connecting === 'whatsapp' || !manualForm.apiKey || !manualForm.phoneNumberId}
                        className="flex-1"
                      >
                        {connecting === 'whatsapp' ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          'Connect'
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          setShowManualForm(null);
                          setManualForm({ apiKey: '', phoneNumberId: '', wabaId: '' });
                        }}
                        variant="outline"
                        disabled={connecting === 'whatsapp'}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
