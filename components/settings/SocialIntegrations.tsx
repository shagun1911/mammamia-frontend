'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/lib/toast';
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
  }, []);

  const fetchIntegrations = async () => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
      const response = await fetch(`${API_URL}/social-integrations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch integrations');

      const data = await response.json();
      
      if (data.success && data.data) {
        data.data.forEach((integration: Integration) => {
          if (integration.platform === 'whatsapp') setWhatsapp(integration);
          if (integration.platform === 'instagram') setInstagram(integration);
          if (integration.platform === 'facebook') setFacebook(integration);
        });
      }
    } catch (error: any) {
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
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
      const response = await fetch(
        `${API_URL}/social-integrations/${platform}/connect`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(config)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to connect');
      }

      toast.success(`${platform} connected successfully!`);
      
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
      toast.error(error.message || `Failed to connect ${platform}`);
    } finally {
      setConnecting(null);
    }
  };

  const disconnectPlatform = async (platform: 'whatsapp' | 'instagram' | 'facebook') => {
    if (!confirm(`Are you sure you want to disconnect ${platform}?`)) return;

    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
      const response = await fetch(
        `${API_URL}/social-integrations/${platform}/disconnect`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to disconnect');

      toast.success(`${platform} disconnected`);
      await fetchIntegrations();
    } catch (error: any) {
      toast.error(error.message || `Failed to disconnect ${platform}`);
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
          <Button 
            onClick={() => setShowForm(true)} 
            className="w-full cursor-pointer mt-2"
          >
            Connect {title}
          </Button>
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

            {/* Instagram & Facebook use Meta Graph API */}
            {(platform === 'instagram' || platform === 'facebook') && (
              <>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                    📘 Need help getting these credentials?
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

                <div className="space-y-2 mt-1">
                  <Label htmlFor={`${platform}-access-token`} className="text-sm font-medium text-foreground">
                    Meta Access Token *
                  </Label>
                  <Input
                    id={`${platform}-access-token`}
                    type="password"
                    placeholder="Enter your Meta Graph API access token"
                    value={formData.accessToken || ''}
                    onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${platform}-app-id`} className="text-sm font-medium text-foreground">
                    Meta App ID *
                  </Label>
                  <Input
                    id={`${platform}-app-id`}
                    placeholder="Enter your Meta App ID"
                    value={formData.appId || ''}
                    onChange={(e) => setFormData({ ...formData, appId: e.target.value })}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${platform}-app-secret`} className="text-sm font-medium text-foreground">
                    Meta App Secret *
                  </Label>
                  <Input
                    id={`${platform}-app-secret`}
                    type="password"
                    placeholder="Enter your Meta App Secret"
                    value={formData.appSecret || ''}
                    onChange={(e) => setFormData({ ...formData, appSecret: e.target.value })}
                    className="w-full"
                  />
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
                  Found in Meta Business Suite → Instagram Accounts
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
                  Found in Page Settings → About
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

