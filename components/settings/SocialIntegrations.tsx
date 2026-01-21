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
  Mail,
  CheckCircle2,
  XCircle,
  Loader2,
  Settings,
  ExternalLink,
  Sparkles,
  Shield,
  Zap,
  ArrowRight,
  Link2
} from 'lucide-react';

interface Integration {
  _id: string;
  platform: 'whatsapp' | 'instagram' | 'facebook' | 'gmail';
  status: 'connected' | 'disconnected' | 'error';
  credentials: {
    apiKey: string;
    clientId?: string;
    phoneNumberId?: string;
    wabaId?: string;
    instagramAccountId?: string;
    facebookPageId?: string;
    email?: string;
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
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg',
    color: 'green',
    oauthEnabled: true
  },
  instagram: {
    name: 'Instagram Direct',
    description: 'Connect your Instagram Business account via Meta OAuth',
    icon: Instagram,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png',
    color: 'pink',
    oauthEnabled: true
  },
  facebook: {
    name: 'Facebook Messenger',
    description: 'Connect your Facebook Page via Meta OAuth',
    icon: Facebook,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg',
    color: 'blue',
    oauthEnabled: true
  },
  gmail: {
    name: 'Gmail',
    description: 'Connect your Gmail account to send and receive emails',
    icon: Mail,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg',
    color: 'red',
    oauthEnabled: true
  }
} as const;

export default function SocialIntegrations() {
  const [integrations, setIntegrations] = useState<Record<string, Integration | null>>({
    whatsapp: null,
    instagram: null,
    facebook: null,
    gmail: null
  });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showManualForm, setShowManualForm] = useState<string | null>(null);
  const [logoErrors, setLogoErrors] = useState<Record<string, boolean>>({});
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
          facebook: null,
          gmail: null
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

  const initiateOAuth = async (platform: 'whatsapp' | 'instagram' | 'facebook' | 'gmail') => {
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

  const disconnectPlatform = async (platform: 'whatsapp' | 'instagram' | 'facebook' | 'gmail') => {
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
      return (
        <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700">
          <div className="w-2 h-2 rounded-full bg-gray-400 mr-1.5"></div>
          Not Connected
        </Badge>
      );
    }
    
    switch (integration.status) {
      case 'connected':
        return (
          <Badge className="bg-green-500 hover:bg-green-600 text-white border-0 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-white mr-1.5 animate-pulse"></div>
            Connected
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="shadow-sm">
            <XCircle className="w-3 h-3 mr-1.5" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700">
            <div className="w-2 h-2 rounded-full bg-gray-400 mr-1.5"></div>
            Disconnected
          </Badge>
        );
    }
  };

  const renderPlatformCard = (platform: 'whatsapp' | 'instagram' | 'facebook' | 'gmail') => {
    const config = PLATFORMS[platform];
    const integration = integrations[platform];
    const Icon = config.icon;
    const isConnected = integration?.status === 'connected';
    const hasError = integration?.status === 'error';
    const isConnecting = connecting === platform;
    const showForm = showManualForm === platform;
    const logoError = logoErrors[platform] || false;

    const platformGradients = {
      whatsapp: 'from-green-500/10 via-emerald-500/5 to-green-500/10',
      instagram: 'from-pink-500/10 via-purple-500/10 to-pink-500/10',
      facebook: 'from-blue-500/10 via-blue-600/5 to-blue-500/10',
      gmail: 'from-red-500/10 via-red-600/5 to-red-500/10'
    };

    const platformColors = {
      whatsapp: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        icon: 'text-green-600 dark:text-green-400',
        button: 'bg-green-600 hover:bg-green-700 text-white shadow-green-500/20',
        border: 'border-green-200 dark:border-green-800',
        glow: 'shadow-green-500/20'
      },
      instagram: {
        bg: 'bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50 dark:from-pink-900/20 dark:via-purple-900/20 dark:to-pink-900/20',
        icon: 'text-pink-600 dark:text-pink-400',
        button: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-pink-500/20',
        border: 'border-pink-200 dark:border-pink-800',
        glow: 'shadow-pink-500/20'
      },
      facebook: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        icon: 'text-blue-600 dark:text-blue-400',
        button: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20',
        border: 'border-blue-200 dark:border-blue-800',
        glow: 'shadow-blue-500/20'
      },
      gmail: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        icon: 'text-red-600 dark:text-red-400',
        button: 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20',
        border: 'border-red-200 dark:border-red-800',
        glow: 'shadow-red-500/20'
      }
    };

    const colors = platformColors[platform];

    return (
      <Card className={`group relative overflow-hidden border-2 transition-all duration-300 h-full flex flex-col ${
        isConnected 
          ? `${colors.border} ${colors.glow} shadow-lg` 
          : 'border-border hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg'
      }`}>
        {/* Background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${platformGradients[platform]} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
        
        <div className="relative p-6 flex flex-col flex-1">
          {/* Header Section */}
          <div className="flex items-start gap-4 mb-6">
            {/* Logo/Icon Container */}
            <div className={`relative flex-shrink-0 p-4 rounded-xl ${colors.bg} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
              {config.logoUrl && !logoError ? (
                <img 
                  src={config.logoUrl} 
                  alt={config.name}
                  className="h-8 w-8 object-contain"
                  onError={() => setLogoErrors(prev => ({ ...prev, [platform]: true }))}
                />
              ) : (
                <Icon className={`h-8 w-8 ${colors.icon}`} />
              )}
              {isConnected && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center shadow-sm">
                  <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                </div>
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-bold text-lg sm:text-xl text-foreground leading-tight">{config.name}</h3>
                <div className="flex-shrink-0">
                  {getStatusBadge(integration)}
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">{config.description}</p>
              
              {/* Features list for connected platforms */}
              {isConnected && (
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs bg-background/50 border-border">
                    <Shield className="w-3 h-3 mr-1" />
                    Secure
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-background/50 border-border">
                    <Zap className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                  {integration?.webhookVerified && (
                    <Badge variant="outline" className="text-xs bg-background/50 border-border">
                      <Link2 className="w-3 h-3 mr-1" />
                      Webhook Verified
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Status Messages */}
          <div className="mb-4 space-y-3 flex-1">
            {/* Error message */}
            {hasError && integration?.errorMessage && (
              <div className="p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg backdrop-blur-sm">
                <div className="flex items-start gap-2.5">
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-0.5">Connection Error</p>
                    <p className="text-xs text-red-700 dark:text-red-300 break-words">{integration.errorMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Success message */}
            {isConnected && !hasError && (
              <div className="p-3.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg backdrop-blur-sm">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-0.5">
                      Connected and Active
                    </p>
                    {integration?.lastSyncedAt && (
                      <p className="text-xs text-green-700 dark:text-green-300">
                        Last synced: {new Date(integration.lastSyncedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons - Fixed at bottom */}
          {!showForm && (
            <div className="mt-auto pt-4 border-t border-border">
              {!isConnected ? (
                <Button
                  onClick={() => initiateOAuth(platform)}
                  disabled={isConnecting}
                  className={`w-full h-11 text-sm sm:text-base font-semibold ${colors.button} shadow-lg hover:shadow-xl transition-all duration-300 group/btn`}
                  size="lg"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <Icon className="mr-2 h-4 w-4 sm:h-5 sm:w-5 group-hover/btn:scale-110 transition-transform" />
                      <span className="truncate">Connect {config.name.split(' ')[0]}</span>
                      <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform flex-shrink-0" />
                    </>
                  )}
                </Button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <Button
                    onClick={() => disconnectPlatform(platform)}
                    variant="destructive"
                    className="flex-1 h-10 sm:h-11 text-sm font-medium shadow-sm hover:shadow-md transition-all"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    <span>Disconnect</span>
                  </Button>
                  <Button
                    onClick={() => initiateOAuth(platform)}
                    variant="outline"
                    className="flex-1 h-10 sm:h-11 text-sm font-medium border-2 hover:bg-accent transition-all"
                    disabled={isConnecting}
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Reconnecting...</span>
                      </>
                    ) : (
                      <>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        <span>Reconnect</span>
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading integrations...</p>
        </div>
      </div>
    );
  }

  const connectedCount = Object.values(integrations).filter(i => i?.status === 'connected').length;
  const totalCount = Object.keys(integrations).length;

  return (
    <div className="h-full overflow-auto bg-gradient-to-b from-background via-background to-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-8">
        {/* Hero Header */}
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-tight">
                  Social Integrations
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1.5">
                  Connect your social media accounts and manage all conversations in one unified platform
                </p>
              </div>
            </div>
          </div>
          
          {/* Stats Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 p-4 sm:p-5 bg-card/50 backdrop-blur-sm border border-border rounded-xl">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 rounded-lg bg-green-500/10 flex-shrink-0">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{connectedCount} Connected</p>
                <p className="text-xs text-muted-foreground">of {totalCount} platforms</p>
              </div>
            </div>
            <div className="hidden sm:block h-10 w-px bg-border flex-shrink-0"></div>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 rounded-lg bg-blue-500/10 flex-shrink-0">
                <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">Secure OAuth</p>
                <p className="text-xs text-muted-foreground">Enterprise-grade security</p>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderPlatformCard('whatsapp')}
          {renderPlatformCard('instagram')}
          {renderPlatformCard('facebook')}
          {renderPlatformCard('gmail')}
        </div>

        {/* Advanced Section */}
        <Card className="border-2 border-border hover:shadow-lg transition-shadow duration-300">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-muted flex-shrink-0">
                  <Settings className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">Advanced Settings</h3>
                  <p className="text-sm text-muted-foreground">Manual API configuration</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="font-medium self-start sm:self-auto"
              >
                {showAdvanced ? (
                  <>
                    Hide
                    <span className="ml-1">↑</span>
                  </>
                ) : (
                  <>
                    Show
                    <span className="ml-1">↓</span>
                  </>
                )}
              </Button>
            </div>
            
            {showAdvanced && (
              <div className="space-y-6 pt-6 border-t border-border animate-in slide-in-from-top-2 duration-300">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-md bg-blue-500/10 mt-0.5">
                      <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                        Manual API Setup
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        Manual setup is available for WhatsApp (360dialog API). Instagram, Facebook, and Gmail require OAuth authentication for security.
                      </p>
                    </div>
                  </div>
                </div>
                
                {!showManualForm && (
                  <Button
                    variant="outline"
                    onClick={() => setShowManualForm('whatsapp')}
                    className="w-full h-12 text-base font-medium border-2 hover:bg-accent transition-all"
                  >
                    <Settings className="mr-2 h-5 w-5" />
                    Configure WhatsApp via 360dialog API
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
                
                {showManualForm === 'whatsapp' && (
                  <Card className="p-6 border-2 border-border bg-card/50 backdrop-blur-sm">
                    <div className="space-y-5">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-foreground">360dialog Configuration</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowManualForm(null);
                            setManualForm({ apiKey: '', phoneNumberId: '', wabaId: '' });
                          }}
                          disabled={connecting === 'whatsapp'}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="manual-api-key" className="text-sm font-medium">
                            360dialog API Key <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="manual-api-key"
                            type="password"
                            placeholder="Enter your 360dialog API key"
                            value={manualForm.apiKey}
                            onChange={(e) => setManualForm({ ...manualForm, apiKey: e.target.value })}
                            className="h-11"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="manual-phone-number-id" className="text-sm font-medium">
                            Phone Number ID <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="manual-phone-number-id"
                            placeholder="Enter 360dialog Phone Number ID"
                            value={manualForm.phoneNumberId || ''}
                            onChange={(e) => setManualForm({ ...manualForm, phoneNumberId: e.target.value })}
                            className="h-11"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="manual-waba-id" className="text-sm font-medium">
                            WABA ID <span className="text-muted-foreground text-xs">(Optional)</span>
                          </Label>
                          <Input
                            id="manual-waba-id"
                            placeholder="Enter WhatsApp Business Account ID"
                            value={manualForm.wabaId || ''}
                            onChange={(e) => setManualForm({ ...manualForm, wabaId: e.target.value })}
                            className="h-11"
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-3 pt-2">
                        <Button
                          onClick={() => connectManual('whatsapp')}
                          disabled={connecting === 'whatsapp' || !manualForm.apiKey || !manualForm.phoneNumberId}
                          className="flex-1 h-11 font-medium shadow-sm hover:shadow-md transition-all"
                        >
                          {connecting === 'whatsapp' ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              <Link2 className="mr-2 h-4 w-4" />
                              Connect
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => {
                            setShowManualForm(null);
                            setManualForm({ apiKey: '', phoneNumberId: '', wabaId: '' });
                          }}
                          variant="outline"
                          disabled={connecting === 'whatsapp'}
                          className="h-11 font-medium"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
