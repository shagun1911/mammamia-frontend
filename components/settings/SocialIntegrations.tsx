'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/lib/toast';
import { apiClient } from '@/lib/api';
import { 
  MessageSquare, 
  Facebook, 
  Instagram, 
  CheckCircle2,
  XCircle,
  Loader2 
} from 'lucide-react';

interface IntegrationConfig {
  apiKey: string;
  clientId?: string;
  phoneNumberId?: string;
  wabaId?: string;
  instagramAccountId?: string;
  facebookPageId?: string;
  accessToken?: string; // For Meta Graph API (Instagram/Facebook)
  appId?: string; // For Meta Graph API
  appSecret?: string; // For Meta Graph API
}

interface Integration {
  _id: string;
  platform: 'whatsapp' | 'instagram' | 'facebook';
  status: 'connected' | 'disconnected' | 'error';
  credentials: IntegrationConfig;
  webhookVerified: boolean;
  errorMessage?: string;
  lastSyncedAt?: string;
}

export default function SocialIntegrations() {
  const [whatsapp, setWhatsapp] = useState<Integration | null>(null);
  const [instagram, setInstagram] = useState<Integration | null>(null);
  const [facebook, setFacebook] = useState<Integration | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  // Form states
  const [showWhatsAppForm, setShowWhatsAppForm] = useState(false);
  const [showInstagramForm, setShowInstagramForm] = useState(false);
  const [showFacebookForm, setShowFacebookForm] = useState(false);

  const [whatsappForm, setWhatsappForm] = useState<IntegrationConfig>({
    apiKey: '',
    phoneNumberId: '',
    wabaId: ''
  });

  const [instagramForm, setInstagramForm] = useState<IntegrationConfig>({
    apiKey: '',
    instagramAccountId: '',
    accessToken: '',
    appId: '',
    appSecret: ''
  });

  const [facebookForm, setFacebookForm] = useState<IntegrationConfig>({
    apiKey: '',
    facebookPageId: '',
    accessToken: '',
    appId: '',
    appSecret: ''
  });

  useEffect(() => {
    fetchIntegrations();
    
    // Check for OAuth success/error in URL
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');
    const platform = params.get('platform');
    
    if (success === 'true' && platform) {
      toast.success(`${platform} connected successfully via OAuth!`);
      // Clean URL
      window.history.replaceState({}, '', '/settings/socials');
      fetchIntegrations();
    } else if (error && platform) {
      toast.error(`Failed to connect ${platform}: ${decodeURIComponent(error)}`);
      // Clean URL
      window.history.replaceState({}, '', '/settings/socials');
    }
  }, []);

  const fetchIntegrations = async () => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
      const response = await fetch(`${API_URL}/social-integrations`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Authentication failed. Please log in again.');
        } else {
          throw new Error(`Failed to fetch integrations (${response.status})`);
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        // Reset integrations first
        setWhatsapp(null);
        setInstagram(null);
        setFacebook(null);
        
        // Set integrations
        data.data.forEach((integration: Integration) => {
          if (integration.platform === 'whatsapp') setWhatsapp(integration);
          if (integration.platform === 'instagram') setInstagram(integration);
          if (integration.platform === 'facebook') setFacebook(integration);
        });
      }
    } catch (error: any) {
      console.error('Error fetching integrations:', error);
      toast.error(error.message || 'Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  const connectPlatform = async (
    platform: 'whatsapp' | 'instagram' | 'facebook',
    config: IntegrationConfig
  ) => {
    setConnecting(platform);
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      
      if (!token) {
        toast.error('Please log in to connect social integrations');
        setConnecting(null);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
      
      // Prepare request body according to backend expectations
      const requestBody: any = {
        apiKey: config.apiKey || config.accessToken, // Backend expects apiKey
      };

      // Add platform-specific fields
      if (platform === 'whatsapp') {
        if (config.phoneNumberId) requestBody.phoneNumberId = config.phoneNumberId;
        if (config.wabaId) requestBody.wabaId = config.wabaId;
      } else if (platform === 'instagram') {
        if (config.instagramAccountId) requestBody.instagramAccountId = config.instagramAccountId;
        if (config.clientId) requestBody.clientId = config.clientId;
      } else if (platform === 'facebook') {
        if (config.facebookPageId) requestBody.facebookPageId = config.facebookPageId;
        if (config.clientId) requestBody.clientId = config.clientId;
      }

      const response = await fetch(
        `${API_URL}/social-integrations/${platform}/connect`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Authentication failed. Please log in again.');
        } else {
          throw new Error(data.message || data.error?.message || `Failed to connect (${response.status})`);
        }
        setConnecting(null);
        return;
      }

      toast.success(data.message || `${platform} connected successfully!`);
      
      // Reset form and close
      if (platform === 'whatsapp') {
        setShowWhatsAppForm(false);
        setWhatsappForm({ apiKey: '', phoneNumberId: '', wabaId: '' });
      } else if (platform === 'instagram') {
        setShowInstagramForm(false);
        setInstagramForm({ apiKey: '', instagramAccountId: '' });
      } else if (platform === 'facebook') {
        setShowFacebookForm(false);
        setFacebookForm({ apiKey: '', facebookPageId: '' });
      }

      // Refresh integrations
      await fetchIntegrations();
    } catch (error: any) {
      console.error('Error connecting platform:', error);
      toast.error(error.message || `Failed to connect ${platform}`);
    } finally {
      setConnecting(null);
    }
  };

  const disconnectPlatform = async (platform: 'whatsapp' | 'instagram' | 'facebook') => {
    if (!confirm(`Are you sure you want to disconnect ${platform}?`)) return;

    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      
      if (!token) {
        toast.error('Please log in to disconnect integrations');
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
      const response = await fetch(
        `${API_URL}/social-integrations/${platform}/disconnect`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Authentication failed. Please log in again.');
        } else {
          throw new Error(data.message || data.error?.message || `Failed to disconnect (${response.status})`);
        }
        return;
      }

      toast.success(data.message || `${platform} disconnected`);
      await fetchIntegrations();
    } catch (error: any) {
      console.error('Error disconnecting platform:', error);
      toast.error(error.message || `Failed to disconnect ${platform}`);
    }
  };

  const initiateOAuth = async (platform: 'whatsapp' | 'instagram' | 'facebook') => {
    setConnecting(platform);
    try {
      const response = await apiClient.post(`/social-integrations/${platform}/oauth/initiate`);
      const data = response.data;

      if (data.success && data.data?.authUrl) {
        // Redirect to OAuth URL
        window.location.href = data.data.authUrl;
      } else {
        throw new Error('Failed to get OAuth URL from server');
      }
    } catch (error: any) {
      console.error('OAuth initiation error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error?.message || error.message || 'Failed to initiate OAuth flow';
      
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 500 && errorMessage.includes('META_APP')) {
        toast.error('Meta OAuth is not configured. Please set META_APP_ID and META_APP_SECRET environment variables.');
      } else {
        toast.error(errorMessage);
      }
      setConnecting(null);
    }
  };

  const renderIntegrationCard = (
    platform: 'whatsapp' | 'instagram' | 'facebook',
    icon: React.ReactNode,
    title: string,
    description: string,
    integration: Integration | null,
    showForm: boolean,
    setShowForm: (show: boolean) => void,
    formData: IntegrationConfig,
    setFormData: (data: IntegrationConfig) => void
  ) => {
    const isConnected = integration?.status === 'connected';
    const hasError = integration?.status === 'error';

    return (
      <Card className="p-6 border-border">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0">
              {icon}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-lg text-foreground mb-1.5">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            {isConnected && (
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
            )}
            {hasError && (
              <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            )}
          </div>
        </div>

        {hasError && integration?.errorMessage && (
          <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              Error: {integration.errorMessage}
            </p>
          </div>
        )}

        {isConnected && (
          <div className="mb-6 p-3.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✓ Connected and active
              {integration?.lastSyncedAt && (
                <span className="ml-2 text-xs">
                  (Last synced: {new Date(integration.lastSyncedAt).toLocaleString()})
                </span>
              )}
            </p>
          </div>
        )}

        {!showForm && !isConnected && (
          <div className="space-y-2 mt-2">
            {/* Show OAuth button for Meta platforms (WhatsApp, Instagram, Facebook) */}
            {(platform === 'whatsapp' || platform === 'instagram' || platform === 'facebook') && (
              <Button 
                onClick={() => initiateOAuth(platform)} 
                disabled={connecting === platform}
                className={`w-full cursor-pointer flex items-center justify-center gap-2 ${
                  platform === 'whatsapp' 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : platform === 'instagram'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {connecting === platform ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    {platform === 'whatsapp' && (
                      <>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                        Login with Whatsapp
                      </>
                    )}
                    {platform === 'instagram' && (
                      <>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                        Login with Instagram
                      </>
                    )}
                    {platform === 'facebook' && (
                      <>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        Login with Facebook
                      </>
                    )}
                  </>
                )}
              </Button>
            )}
            {/* Manual connection button (always available) */}
            <Button 
              onClick={() => setShowForm(true)} 
              variant={platform === 'instagram' || platform === 'facebook' || platform === 'whatsapp' ? 'outline' : 'default'}
              className="w-full cursor-pointer"
            >
              {platform === 'instagram' || platform === 'facebook' || platform === 'whatsapp'
                ? 'Or Connect Manually' 
                : `Connect ${title}`}
            </Button>
          </div>
        )}

        {!showForm && isConnected && (
          <div className="flex gap-3 mt-2">
            <Button 
              onClick={() => setShowForm(true)} 
              variant="outline" 
              className="flex-1 cursor-pointer"
            >
              Update Credentials
            </Button>
            <Button 
              onClick={() => disconnectPlatform(platform)} 
              variant="destructive"
              className="cursor-pointer"
            >
              Disconnect
            </Button>
          </div>
        )}

        {showForm && (
          <div className="space-y-5 mt-6 pt-6 border-t border-border">
            {/* WhatsApp uses 360dialog */}
            {platform === 'whatsapp' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor={`${platform}-api-key`} className="text-sm font-medium text-foreground">
                    360dialog API Key *
                  </Label>
                  <Input
                    id={`${platform}-api-key`}
                    type="password"
                    placeholder="Enter your 360dialog API key"
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Get this from your 360dialog dashboard
                  </p>
                </div>
              </>
            )}

            {/* Instagram & Facebook use Meta Graph API - Manual Connection */}
            {(platform === 'instagram' || platform === 'facebook') && (
              <>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                    💡 <strong>Recommended:</strong> Use OAuth connection above for easier setup. Manual connection is for advanced users.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/docs/connect-${platform}`, '_blank')}
                    className="cursor-pointer"
                  >
                    View Setup Guide →
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${platform}-api-key`} className="text-sm font-medium text-foreground">
                    Meta Access Token (API Key) *
                  </Label>
                  <Input
                    id={`${platform}-api-key`}
                    type="password"
                    placeholder="Enter your Meta Graph API access token"
                    value={formData.apiKey || ''}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    This is your Meta Graph API access token (long-lived token recommended)
                  </p>
                </div>
              </>
            )}

            {platform === 'whatsapp' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="phone-number-id" className="text-sm font-medium text-foreground">
                    Phone Number ID *
                  </Label>
                  <Input
                    id="phone-number-id"
                    placeholder="Enter WhatsApp Phone Number ID"
                    value={formData.phoneNumberId || ''}
                    onChange={(e) => setFormData({ ...formData, phoneNumberId: e.target.value })}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="waba-id" className="text-sm font-medium text-foreground">
                    WhatsApp Business Account ID (Optional)
                  </Label>
                  <Input
                    id="waba-id"
                    placeholder="Enter WABA ID"
                    value={formData.wabaId || ''}
                    onChange={(e) => setFormData({ ...formData, wabaId: e.target.value })}
                    className="w-full"
                  />
                </div>
              </>
            )}

            {platform === 'instagram' && (
              <div className="space-y-2">
                <Label htmlFor="instagram-account-id" className="text-sm font-medium text-foreground">
                  Instagram Business Account ID *
                </Label>
                <Input
                  id="instagram-account-id"
                  placeholder="Enter Instagram Business Account ID"
                  value={formData.instagramAccountId || ''}
                  onChange={(e) => setFormData({ ...formData, instagramAccountId: e.target.value })}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Found in Meta Business Suite → Instagram Accounts. Required for manual connection.
                </p>
              </div>
            )}

            {platform === 'facebook' && (
              <div className="space-y-2">
                <Label htmlFor="facebook-page-id" className="text-sm font-medium text-foreground">
                  Facebook Page ID *
                </Label>
                <Input
                  id="facebook-page-id"
                  placeholder="Enter Facebook Page ID"
                  value={formData.facebookPageId || ''}
                  onChange={(e) => setFormData({ ...formData, facebookPageId: e.target.value })}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Found in Page Settings → About. Required for manual connection.
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4 mt-2">
              <Button
                onClick={() => connectPlatform(platform, formData)}
                disabled={connecting === platform}
                className="flex-1 cursor-pointer"
              >
                {connecting === platform ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Save & Connect'
                )}
              </Button>
              <Button
                onClick={() => setShowForm(false)}
                variant="outline"
                disabled={connecting === platform}
                className="cursor-pointer"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
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
      <div className="max-w-7xl mx-auto p-6">

        {/* Integration Cards */}
        <div className="space-y-6 mb-8">
        {renderIntegrationCard(
          'whatsapp',
          <MessageSquare className="h-6 w-6 text-green-600" />,
          'WhatsApp Business',
          'Manage WhatsApp conversations via 360dialog',
          whatsapp,
          showWhatsAppForm,
          setShowWhatsAppForm,
          whatsappForm,
          setWhatsappForm
        )}

        {renderIntegrationCard(
          'instagram',
          <Instagram className="h-6 w-6 text-pink-600" />,
          'Instagram Direct',
          'Handle Instagram DMs via 360dialog',
          instagram,
          showInstagramForm,
          setShowInstagramForm,
          instagramForm,
          setInstagramForm
        )}

        {renderIntegrationCard(
          'facebook',
          <Facebook className="h-6 w-6 text-blue-600" />,
          'Facebook Messenger',
          'Manage Facebook Messenger conversations via 360dialog',
          facebook,
          showFacebookForm,
          setShowFacebookForm,
          facebookForm,
          setFacebookForm
        )}
      </div>

        {/* Quick Setup Guide */}
        <Card className="p-6 bg-muted/50 border-border">
          <h3 className="font-semibold text-lg text-foreground mb-5">📚 Quick Setup Guide</h3>
          
          <div className="space-y-6 text-sm">
            <div>
              <h4 className="font-semibold text-green-600 mb-3">WhatsApp (via 360dialog):</h4>
              <ol className="text-muted-foreground space-y-2 list-decimal list-inside ml-2">
                <li>Sign up at <a href="https://hub.360dialog.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline cursor-pointer">360dialog</a></li>
                <li>Get your API Key and Phone Number ID from dashboard</li>
                <li>Enter credentials above → Click "Save & Connect"</li>
              </ol>
            </div>

            <div>
              <h4 className="font-semibold text-pink-600 mb-3">Instagram (via Meta Graph API):</h4>
              <p className="text-muted-foreground">
                Click the <strong>"View Setup Guide"</strong> button in the Instagram connection form above for detailed instructions.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-blue-600 mb-3">Facebook Messenger (via Meta Graph API):</h4>
              <p className="text-muted-foreground">
                Click the <strong>"View Setup Guide"</strong> button in the Facebook connection form above for detailed instructions.
              </p>
            </div>

            <div className="pt-5 mt-5 border-t border-border">
              <p className="text-xs text-muted-foreground">
                <strong>Webhook URL:</strong> <code className="bg-background px-2 py-1 rounded text-xs ml-2">{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1'}/webhooks/360dialog</code>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

