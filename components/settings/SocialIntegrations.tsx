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
  Link2,
  Copy,
  Check
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
    description: 'Connect your WhatsApp Business account using Access Token, Phone Number ID, and WABA ID',
    icon: MessageSquare,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg',
    color: 'green',
    oauthEnabled: false // Changed to manual connection
  },
  instagram: {
    name: 'Instagram Direct',
    description: 'Connect your Instagram Business account using Access Token, Instagram Account ID, and Page ID',
    icon: Instagram,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png',
    color: 'pink',
    oauthEnabled: false // Changed to manual connection
  },
  facebook: {
    name: 'Facebook Messenger',
    description: 'Connect your Facebook Page using Page Access Token and Page ID',
    icon: Facebook,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg',
    color: 'blue',
    oauthEnabled: false // Changed to manual connection
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
  const [showWhatsAppForm, setShowWhatsAppForm] = useState(false);
  const [whatsAppCredentials, setWhatsAppCredentials] = useState({
    accessToken: '',
    phoneNumberId: '',
    wabaId: ''
  });
  const [showInstagramForm, setShowInstagramForm] = useState(false);
  const [instagramCredentials, setInstagramCredentials] = useState({
    accessToken: '',
    instagramAccountId: '',
    facebookPageId: ''
  });
  const [showFacebookForm, setShowFacebookForm] = useState(false);
  const [facebookCredentials, setFacebookCredentials] = useState({
    pageAccessToken: '',
    facebookPageId: '',
    appId: ''
  });
  const [webhookConfig, setWebhookConfig] = useState<{
    url: string;
    verifyToken: string;
    subscribed: boolean;
    show: boolean;
    platform: 'whatsapp' | 'instagram' | 'facebook';
  } | null>(null);

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
    console.log('[initiateOAuth] Called with platform:', platform);
    
    // For WhatsApp, show manual form instead of OAuth
    if (platform === 'whatsapp') {
      console.log('[initiateOAuth] WhatsApp detected, showing manual form');
      setShowWhatsAppForm(true);
      console.log('[initiateOAuth] showWhatsAppForm set to true');
      return;
    }
    
    // For Instagram, show manual form instead of OAuth
    if (platform === 'instagram') {
      console.log('[initiateOAuth] Instagram detected, showing manual form');
      setShowInstagramForm(true);
      return;
    }
    
    // For Facebook, show manual form instead of OAuth
    if (platform === 'facebook') {
      console.log('[initiateOAuth] Facebook detected, showing manual form');
      setShowFacebookForm(true);
      return;
    }
    
    console.log('[initiateOAuth] Not WhatsApp/Instagram/Facebook, proceeding with OAuth for:', platform);
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
        // Reset WhatsApp form if disconnecting WhatsApp
        if (platform === 'whatsapp') {
          setShowWhatsAppForm(false);
          setWhatsAppCredentials({ accessToken: '', phoneNumberId: '', wabaId: '' });
        }
        // Reset Instagram form if disconnecting Instagram
        if (platform === 'instagram') {
          setShowInstagramForm(false);
          setInstagramCredentials({ accessToken: '', instagramAccountId: '', facebookPageId: '' });
        }
        // Reset Facebook form if disconnecting Facebook
        if (platform === 'facebook') {
          setShowFacebookForm(false);
          setFacebookCredentials({ pageAccessToken: '', facebookPageId: '', appId: '' });
        }
        await fetchIntegrations();
      }
    } catch (error: any) {
      console.error('Error disconnecting platform:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to disconnect';
      toast.error(errorMessage);
    }
  };

  const connectWhatsAppManual = async () => {
    const { accessToken, phoneNumberId, wabaId } = whatsAppCredentials;
    
    if (!accessToken || !phoneNumberId || !wabaId) {
      toast.error('All fields are required: Access Token, Phone Number ID, and WABA ID');
      return;
    }

    setConnecting('whatsapp');
    try {
      const response = await apiClient.post('/social-integrations/whatsapp/connect-manual', {
        accessToken,
        phoneNumberId,
        wabaId
      });
      
      if (response.success) {
        toast.success('WhatsApp connected successfully!');
        setShowWhatsAppForm(false);
        setWhatsAppCredentials({ accessToken: '', phoneNumberId: '', wabaId: '' });
        
        // Show webhook configuration if provided
        if (response.data?.webhookConfiguration) {
          setWebhookConfig({
            url: response.data.webhookConfiguration.url,
            verifyToken: response.data.webhookConfiguration.verifyToken,
            subscribed: response.data.webhookConfiguration.subscribed || false,
            show: true,
            platform: 'whatsapp'
          });
        }
        
        await fetchIntegrations();
      }
    } catch (error: any) {
      console.error('Error connecting WhatsApp manually:', error);
      const errorMessage = error.response?.data?.error?.message || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to connect WhatsApp';
      toast.error(errorMessage);
    } finally {
      setConnecting(null);
    }
  };

  const connectInstagramManual = async () => {
    const { accessToken, instagramAccountId, facebookPageId } = instagramCredentials;
    
    if (!accessToken || !instagramAccountId || !facebookPageId) {
      toast.error('All fields are required: Access Token, Instagram Account ID, and Facebook Page ID');
      return;
    }

    setConnecting('instagram');
    try {
      const response = await apiClient.post('/social-integrations/instagram/connect-manual', {
        accessToken,
        instagramAccountId,
        facebookPageId
      });
      
      if (response.success) {
        toast.success('Instagram connected successfully!');
        setShowInstagramForm(false);
        setInstagramCredentials({ accessToken: '', instagramAccountId: '', facebookPageId: '' });
        
        // Show webhook configuration if provided
        if (response.data?.webhookConfiguration) {
          setWebhookConfig({
            url: response.data.webhookConfiguration.url,
            verifyToken: response.data.webhookConfiguration.verifyToken,
            subscribed: response.data.webhookConfiguration.subscribed || false,
            show: true,
            platform: 'instagram'
          });
        }
        
        await fetchIntegrations();
      }
    } catch (error: any) {
      console.error('Error connecting Instagram manually:', error);
      const errorMessage = error.response?.data?.error?.message || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to connect Instagram';
      toast.error(errorMessage);
    } finally {
      setConnecting(null);
    }
  };

  const connectFacebookManual = async () => {
    const { pageAccessToken, facebookPageId } = facebookCredentials;
    
    if (!pageAccessToken || !facebookPageId) {
      toast.error('Page Access Token and Facebook Page ID are required');
      return;
    }

    setConnecting('facebook');
    try {
      const response = await apiClient.post('/social-integrations/facebook/connect-manual', {
        pageAccessToken,
        facebookPageId,
        appId: facebookCredentials.appId || undefined
      });
      
      if (response.success) {
        toast.success('Facebook connected successfully!');
        setShowFacebookForm(false);
        setFacebookCredentials({ pageAccessToken: '', facebookPageId: '', appId: '' });
        
        // Show webhook configuration if provided
        if (response.data?.webhookConfiguration) {
          setWebhookConfig({
            url: response.data.webhookConfiguration.url,
            verifyToken: response.data.webhookConfiguration.verifyToken,
            subscribed: response.data.webhookConfiguration.subscribed || false,
            show: true,
            platform: 'facebook'
          });
        }
        
        await fetchIntegrations();
      }
    } catch (error: any) {
      console.error('Error connecting Facebook manually:', error);
      const errorMessage = error.response?.data?.error?.message || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to connect Facebook';
      toast.error(errorMessage);
    } finally {
      setConnecting(null);
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
                <>
                  {(() => {
                    console.log('[Render] Platform:', platform, 'showWhatsAppForm:', showWhatsAppForm);
                    return null;
                  })()}
                  {platform === 'whatsapp' && showWhatsAppForm ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Access Token <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="password"
                          value={whatsAppCredentials.accessToken}
                          onChange={(e) => setWhatsAppCredentials(prev => ({ ...prev, accessToken: e.target.value }))}
                          className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                          placeholder="Enter Meta Access Token"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Phone Number ID <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          value={whatsAppCredentials.phoneNumberId}
                          onChange={(e) => setWhatsAppCredentials(prev => ({ ...prev, phoneNumberId: e.target.value }))}
                          className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                          placeholder="930062466863543"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          WABA ID <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          value={whatsAppCredentials.wabaId}
                          onChange={(e) => setWhatsAppCredentials(prev => ({ ...prev, wabaId: e.target.value }))}
                          className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                          placeholder="1559660438592434"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setShowWhatsAppForm(false);
                            setWhatsAppCredentials({ accessToken: '', phoneNumberId: '', wabaId: '' });
                          }}
                          variant="outline"
                          className="flex-1 h-10 text-sm"
                          disabled={connecting === 'whatsapp'}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={connectWhatsAppManual}
                          disabled={connecting === 'whatsapp'}
                          className="flex-1 h-10 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold"
                        >
                          {connecting === 'whatsapp' ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              <span>Connecting...</span>
                            </>
                          ) : (
                            <>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              <span>Connect</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : platform === 'instagram' && showInstagramForm ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Access Token <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="password"
                          value={instagramCredentials.accessToken}
                          onChange={(e) => setInstagramCredentials(prev => ({ ...prev, accessToken: e.target.value }))}
                          className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                          placeholder="Enter Meta Access Token"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Instagram Account ID <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          value={instagramCredentials.instagramAccountId}
                          onChange={(e) => setInstagramCredentials(prev => ({ ...prev, instagramAccountId: e.target.value }))}
                          className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                          placeholder="17841400123456789"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Facebook Page ID <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          value={instagramCredentials.facebookPageId}
                          onChange={(e) => setInstagramCredentials(prev => ({ ...prev, facebookPageId: e.target.value }))}
                          className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                          placeholder="123456789012345"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setShowInstagramForm(false);
                            setInstagramCredentials({ accessToken: '', instagramAccountId: '', facebookPageId: '' });
                          }}
                          variant="outline"
                          className="flex-1 h-10 text-sm"
                          disabled={connecting === 'instagram'}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={connectInstagramManual}
                          disabled={connecting === 'instagram'}
                          className="flex-1 h-10 bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold"
                        >
                          {connecting === 'instagram' ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              <span>Connecting...</span>
                            </>
                          ) : (
                            <>
                              <Instagram className="mr-2 h-4 w-4" />
                              <span>Connect</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : platform === 'facebook' && showFacebookForm ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Page Access Token <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="password"
                          value={facebookCredentials.pageAccessToken}
                          onChange={(e) => setFacebookCredentials(prev => ({ ...prev, pageAccessToken: e.target.value }))}
                          className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                          placeholder="Enter Facebook Page Access Token (EAAG...)"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Facebook Page ID <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          value={facebookCredentials.facebookPageId}
                          onChange={(e) => setFacebookCredentials(prev => ({ ...prev, facebookPageId: e.target.value }))}
                          className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                          placeholder="123456789012345"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          App ID (Optional)
                        </label>
                        <input
                          type="text"
                          value={facebookCredentials.appId}
                          onChange={(e) => setFacebookCredentials(prev => ({ ...prev, appId: e.target.value }))}
                          className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                          placeholder="1234567890123456"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setShowFacebookForm(false);
                            setFacebookCredentials({ pageAccessToken: '', facebookPageId: '', appId: '' });
                          }}
                          variant="outline"
                          className="flex-1 h-10 text-sm"
                          disabled={connecting === 'facebook'}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={connectFacebookManual}
                          disabled={connecting === 'facebook'}
                          className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
                        >
                          {connecting === 'facebook' ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              <span>Connecting...</span>
                            </>
                          ) : (
                            <>
                              <Facebook className="mr-2 h-4 w-4" />
                              <span>Connect</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
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
                  )}
                </>
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

      {/* Webhook Configuration Modal */}
      {webhookConfig && webhookConfig.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Link2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">
                      {webhookConfig.platform === 'whatsapp' && 'WhatsApp Webhook Configuration'}
                      {webhookConfig.platform === 'instagram' && 'Instagram Webhook Configuration'}
                      {webhookConfig.platform === 'facebook' && 'Facebook Webhook Configuration'}
                    </h3>
                    <p className="text-sm text-muted-foreground">Configure webhook in your Meta App Dashboard</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setWebhookConfig(null)}
                  className="h-8 w-8 p-0"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>

              {webhookConfig.subscribed ? (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg mb-6">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                        Webhook Automatically Subscribed!
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300">
                        Your webhook has been automatically configured. You can still verify it in Meta App Dashboard if needed.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-6">
                  <div className="flex items-start gap-2.5">
                    <Settings className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                        Manual Webhook Configuration Required
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300">
                        Please configure the webhook in your Meta App Dashboard to receive incoming messages.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-foreground mb-2 block">
                    Webhook URL
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={webhookConfig.url}
                      readOnly
                      className="flex-1 font-mono text-sm bg-secondary"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(webhookConfig.url);
                        toast.success('Webhook URL copied to clipboard!');
                      }}
                      className="h-10 px-3"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-foreground mb-2 block">
                    Verify Token
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={webhookConfig.verifyToken}
                      readOnly
                      type="password"
                      className="flex-1 font-mono text-sm bg-secondary"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(webhookConfig.verifyToken);
                        toast.success('Verify Token copied to clipboard!');
                      }}
                      className="h-10 px-3"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Setup Instructions:</h4>
                  <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                    <li>Go to <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Meta App Dashboard <ExternalLink className="h-3 w-3" /></a></li>
                    {webhookConfig.platform === 'whatsapp' && (
                      <>
                        <li>Select your <strong>WhatsApp Business App</strong></li>
                        <li>Navigate to <strong>WhatsApp → Configuration → Webhooks</strong></li>
                        <li>Click <strong>"Edit"</strong> or <strong>"Add Callback URL"</strong></li>
                        <li>Paste the <strong>Webhook URL</strong> from above</li>
                        <li>Paste the <strong>Verify Token</strong> from above</li>
                        <li>Click <strong>"Verify and Save"</strong></li>
                        <li>Subscribe to these webhook fields:
                          <ul className="ml-6 mt-1 space-y-1 list-disc">
                            <li><code className="bg-background px-1.5 py-0.5 rounded text-xs">messages</code></li>
                            <li><code className="bg-background px-1.5 py-0.5 rounded text-xs">message_status</code></li>
                          </ul>
                        </li>
                      </>
                    )}
                    {webhookConfig.platform === 'instagram' && (
                      <>
                        <li>Select your <strong>Instagram App</strong> (or the app with Instagram product)</li>
                        <li>Navigate to <strong>Instagram → Configuration → Webhooks</strong></li>
                        <li>Click <strong>"Edit"</strong> or <strong>"Add Callback URL"</strong></li>
                        <li>Paste the <strong>Webhook URL</strong> from above</li>
                        <li>Paste the <strong>Verify Token</strong> from above</li>
                        <li>Click <strong>"Verify and Save"</strong></li>
                        <li>Subscribe to these webhook fields:
                          <ul className="ml-6 mt-1 space-y-1 list-disc">
                            <li><code className="bg-background px-1.5 py-0.5 rounded text-xs">messages</code></li>
                            <li><code className="bg-background px-1.5 py-0.5 rounded text-xs">messaging_postbacks</code></li>
                            <li><code className="bg-background px-1.5 py-0.5 rounded text-xs">message_reactions</code></li>
                          </ul>
                        </li>
                      </>
                    )}
                    {webhookConfig.platform === 'facebook' && (
                      <>
                        <li>Select your <strong>Facebook App</strong> (with Messenger product)</li>
                        <li>Navigate to <strong>Messenger → Settings → Webhooks</strong></li>
                        <li>Click <strong>"Edit"</strong> or <strong>"Add Callback URL"</strong></li>
                        <li>Paste the <strong>Webhook URL</strong> from above</li>
                        <li>Paste the <strong>Verify Token</strong> from above</li>
                        <li>Click <strong>"Verify and Save"</strong></li>
                        <li>Subscribe your Facebook Page to the webhook</li>
                        <li>Subscribe to these webhook fields:
                          <ul className="ml-6 mt-1 space-y-1 list-disc">
                            <li><code className="bg-background px-1.5 py-0.5 rounded text-xs">messages</code></li>
                            <li><code className="bg-background px-1.5 py-0.5 rounded text-xs">messaging_postbacks</code></li>
                            <li><code className="bg-background px-1.5 py-0.5 rounded text-xs">message_reads</code></li>
                            <li><code className="bg-background px-1.5 py-0.5 rounded text-xs">message_deliveries</code></li>
                          </ul>
                        </li>
                      </>
                    )}
                  </ol>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => setWebhookConfig(null)}
                    className="flex-1 h-11 font-medium"
                  >
                    Got it, I'll configure it
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      window.open('https://developers.facebook.com/apps', '_blank');
                    }}
                    className="h-11"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Meta Dashboard
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
