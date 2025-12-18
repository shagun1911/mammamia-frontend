"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  SiGooglesheets, 
  SiGoogledrive, 
  SiGooglecalendar,
  SiShopify,
  SiWoo,
  SiMagento,
  SiPrestashop
} from "react-icons/si";
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ExternalLink, 
  ShoppingCart,
  Hotel,
  Package,
  Settings
} from "lucide-react";
import { IntegrationCard } from "@/components/integrations/IntegrationCard";
import { SetupModal } from "@/components/integrations/SetupModal";
import { integrationService } from "@/services/integration.service";

interface GoogleIntegrationStatus {
  connected: boolean;
  services?: {
    sheets: boolean;
    drive: boolean;
    calendar: boolean;
  };
  googleProfile?: {
    email: string;
    name?: string;
    picture?: string;
  };
  lastSyncedAt?: string;
}

interface Integration {
  name: string;
  key: string;
  connected: boolean;
}

export default function IntegrationsPage() {
  const [googleStatus, setGoogleStatus] = useState<GoogleIntegrationStatus>({ connected: false });
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [uploadingToDrive, setUploadingToDrive] = useState(false);
  const [creatingCalendarEvent, setCreatingCalendarEvent] = useState(false);
  
  // Modal states
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [currentPlatform, setCurrentPlatform] = useState<string | null>(null);

  useEffect(() => {
    loadIntegrations();
    
    // Check for OAuth success in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'google') {
      toast.success('Google integration connected successfully!');
      window.history.replaceState({}, '', '/settings/integrations');
      fetchGoogleStatus();
    }
  }, []);

  const loadIntegrations = async () => {
    try {
      await Promise.all([
        fetchGoogleStatus(),
        fetchPythonIntegrations()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchGoogleStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1'}/integrations/google/status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setGoogleStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch Google status:', error);
    }
  };

  const fetchPythonIntegrations = async () => {
    try {
      const data = await integrationService.listInitializedIntegrations();
      if (data && Array.isArray(data)) {
        setIntegrations(data);
      }
    } catch (error) {
      console.error('Failed to fetch Python integrations:', error);
    }
  };

  const isConnected = (key: string) => {
    return integrations.some((i) => i.key === key && i.connected);
  };

  // ==================== GOOGLE INTEGRATION HANDLERS ====================

  const connectGoogle = async () => {
    try {
      setConnecting(true);
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1'}/integrations/google/connect`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            services: ['sheets', 'drive', 'calendar'],
          }),
        }
      );

      const data = await response.json();
      
      if (data.success && data.data.authUrl) {
        window.location.href = data.data.authUrl;
      } else {
        throw new Error('Failed to get authorization URL');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to connect to Google');
      setConnecting(false);
    }
  };

  const disconnectGoogle = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1'}/integrations/google/disconnect`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      
      if (data.success) {
        toast.success('Google integration disconnected');
        setGoogleStatus({ connected: false });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to disconnect');
    }
  };

  const exportContactsToSheets = async () => {
    try {
      setExporting(true);
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1'}/integrations/google/sheets/export-contacts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      
      if (data.success) {
        toast.success('Contacts exported successfully!');
        if (data.data.spreadsheetUrl) {
          window.open(data.data.spreadsheetUrl, '_blank');
        }
      } else {
        throw new Error(data.message || 'Export failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to export contacts');
    } finally {
      setExporting(false);
    }
  };

  const uploadSampleFileToDrive = async () => {
    try {
      setUploadingToDrive(true);
      const token = localStorage.getItem('accessToken');
      
      const sampleContent = `Aistein-It - Sample File\n\nThis is a test file uploaded from Aistein-It integrations.\nTimestamp: ${new Date().toISOString()}\n`;
      const blob = new Blob([sampleContent], { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', blob, 'kepleroai-test.txt');
      formData.append('name', `Aistein-It Test - ${new Date().toLocaleDateString()}`);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1'}/integrations/google/drive/upload`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();
      
      if (data.success) {
        toast.success('File uploaded to Google Drive!');
        if (data.data.webViewLink) {
          window.open(data.data.webViewLink, '_blank');
        }
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload file');
    } finally {
      setUploadingToDrive(false);
    }
  };

  const createSampleCalendarEvent = async () => {
    try {
      setCreatingCalendarEvent(true);
      const token = localStorage.getItem('accessToken');
      
      const startTime = new Date();
      startTime.setHours(startTime.getHours() + 1);
      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 1);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1'}/integrations/google/calendar/events`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            summary: 'KepleroAI Test Meeting',
            description: 'This is a test event created from KepleroAI integrations.',
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            attendees: [],
          }),
        }
      );

      const data = await response.json();
      
      if (data.success) {
        toast.success('Event created in Google Calendar!');
        if (data.data.htmlLink) {
          window.open(data.data.htmlLink, '_blank');
        }
      } else {
        throw new Error(data.message || 'Event creation failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create calendar event');
    } finally {
      setCreatingCalendarEvent(false);
    }
  };

  // ==================== PYTHON BACKEND INTEGRATION HANDLERS ====================

  const openSetupModal = (platform: string) => {
    setCurrentPlatform(platform);
    setSetupModalOpen(true);
  };

  const handleSetup = async (data: Record<string, string>) => {
    if (!currentPlatform) return;

    try {
      let result;
      switch (currentPlatform) {
        case 'shopify':
          result = await integrationService.setupShopify(data as any);
          break;
        case 'woocommerce':
          result = await integrationService.setupWooCommerce(data as any);
          break;
        case 'magento2':
          result = await integrationService.setupMagento2(data as any);
          break;
        case 'prestashop':
          result = await integrationService.setupPrestaShop(data as any);
          break;
        case 'qapla':
          result = await integrationService.setupQapla(data as any);
          break;
        case 'vertical-booking':
          result = await integrationService.setupVerticalBooking(data as any);
          break;
        case 'booking-expert':
          result = await integrationService.setupBookingExpert(data as any);
          break;
        case 'mcp':
          result = await integrationService.setupMCP(data as any);
          break;
        default:
          throw new Error('Unknown platform');
      }

      toast.success(`${currentPlatform} integration setup successfully!`);
      await fetchPythonIntegrations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Setup failed');
    }
  };

  const testConnection = async (platform: string) => {
    try {
      let result;
      switch (platform) {
        case 'shopify':
          result = await integrationService.testShopifyConnection();
          break;
        case 'woocommerce':
          result = await integrationService.testWooCommerceConnection();
          break;
        case 'magento2':
          result = await integrationService.testMagento2Connection();
          break;
        case 'prestashop':
          result = await integrationService.testPrestaShopConnection();
          break;
        case 'qapla':
          result = await integrationService.testQaplaConnection();
          break;
        case 'vertical-booking':
          result = await integrationService.testVerticalBookingConnection();
          break;
        case 'booking-expert':
          result = await integrationService.testBookingExpertConnection();
          break;
        default:
          throw new Error('Unknown platform');
      }

      toast.success(`${platform} connection test successful!`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Connection test failed');
    }
  };

  const disconnectIntegration = async (platform: string) => {
    try {
      await integrationService.removeIntegration(platform);
      toast.success(`${platform} integration removed`);
      await fetchPythonIntegrations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Failed to disconnect');
    }
  };

  // ==================== SETUP CONFIGURATIONS ====================

  const getSetupFields = (platform: string) => {
    switch (platform) {
      case 'shopify':
        return [
          { name: 'shop_url', label: 'Shop URL', placeholder: 'mystore.myshopify.com', required: true },
          { name: 'admin_api_key', label: 'Admin API Key', placeholder: 'shpat_xxxxx', required: true },
          { name: 'api_version', label: 'API Version', placeholder: '2024-10', defaultValue: '2024-10' },
        ];
      case 'woocommerce':
        return [
          { name: 'store_url', label: 'Store URL', placeholder: 'https://mystore.com', required: true },
          { name: 'consumer_key', label: 'Consumer Key', placeholder: 'ck_xxxxx', required: true },
          { name: 'consumer_secret', label: 'Consumer Secret', placeholder: 'cs_xxxxx', required: true },
          { name: 'api_version', label: 'API Version', placeholder: 'wc/v3', defaultValue: 'wc/v3' },
        ];
      case 'magento2':
        return [
          { name: 'store_url', label: 'Store URL', placeholder: 'https://magento-store.com', required: true },
          { name: 'consumer_key', label: 'Consumer Key', required: true },
          { name: 'consumer_secret', label: 'Consumer Secret', required: true },
          { name: 'access_token', label: 'Access Token', required: true },
          { name: 'access_token_secret', label: 'Access Token Secret', required: true },
          { name: 'api_version', label: 'API Version', defaultValue: 'V1' },
        ];
      case 'prestashop':
        return [
          { name: 'store_url', label: 'Store URL', placeholder: 'https://prestashop-store.com', required: true },
          { name: 'api_key', label: 'API Key', required: true },
          { name: 'api_version', label: 'API Version', defaultValue: 'api' },
        ];
      case 'qapla':
        return [
          { name: 'api_key', label: 'API Key', required: true },
          { name: 'base_url', label: 'Base URL', placeholder: 'https://api.qapla.it/v1', defaultValue: 'https://api.qapla.it/v1' },
        ];
      case 'vertical-booking':
        return [
          { name: 'hotel_id', label: 'Hotel ID', required: true },
          { name: 'style_id', label: 'Style ID', required: true },
          { name: 'dc', label: 'DC', required: true },
          { name: 'base_url', label: 'Base URL', placeholder: 'https://booking.verticalbooking.com', defaultValue: 'https://booking.verticalbooking.com' },
        ];
      case 'booking-expert':
        return [
          { name: 'engine_url', label: 'Engine URL', placeholder: 'https://engine.bookingexpert.com', required: true },
          { name: 'layout_id', label: 'Layout ID', required: true },
          { name: 'adult_type_id', label: 'Adult Type ID', defaultValue: '1' },
          { name: 'teen_type_id', label: 'Teen Type ID', defaultValue: '2' },
          { name: 'child_type_id', label: 'Child Type ID', defaultValue: '3' },
        ];
      case 'mcp':
        return [
          { name: 'name', label: 'Service Name', required: true },
          { name: 'url', label: 'Service URL', placeholder: 'https://api.myservice.com/endpoint', required: true },
        ];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Integrations</h1>
        <p className="text-muted-foreground mt-2">
          Connect external services to enhance your workflow
        </p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="ecommerce">E-commerce</TabsTrigger>
          <TabsTrigger value="booking">Booking</TabsTrigger>
          <TabsTrigger value="productivity">Productivity</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6 mt-6">
          {/* Google Workspace */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center">
                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </div>
              <div>
                <CardTitle className="text-xl">Google Workspace</CardTitle>
                <CardDescription>
                  Sheets, Drive, and Calendar integration
                </CardDescription>
              </div>
            </div>
            
            {googleStatus.connected ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">Not Connected</span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {googleStatus.connected && googleStatus.googleProfile && (
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              {googleStatus.googleProfile.picture && (
                <img
                  src={googleStatus.googleProfile.picture}
                  alt="Profile"
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div>
                <p className="font-medium text-foreground">
                  {googleStatus.googleProfile.name || googleStatus.googleProfile.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  {googleStatus.googleProfile.email}
                </p>
              </div>
            </div>
          )}

          {/* Services */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Google Sheets */}
            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <SiGooglesheets className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-foreground">Sheets</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Export/import contacts
              </p>
              {googleStatus.services?.sheets ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportContactsToSheets}
                  disabled={exporting}
                  className="w-full"
                >
                  {exporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Export Contacts
                    </>
                  )}
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground italic">Not enabled</p>
              )}
            </div>

            {/* Google Drive */}
            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <SiGoogledrive className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-foreground">Drive</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Store and share files
              </p>
              {googleStatus.services?.drive ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={uploadSampleFileToDrive}
                  disabled={uploadingToDrive}
                  className="w-full"
                >
                  {uploadingToDrive ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Test Upload
                    </>
                  )}
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground italic">Not enabled</p>
              )}
            </div>

            {/* Google Calendar */}
            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <SiGooglecalendar className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold text-foreground">Calendar</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Schedule meetings
              </p>
              {googleStatus.services?.calendar ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={createSampleCalendarEvent}
                  disabled={creatingCalendarEvent}
                  className="w-full"
                >
                  {creatingCalendarEvent ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Create Test Event
                    </>
                  )}
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground italic">Not enabled</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            {googleStatus.connected ? (
              <>
                <Button variant="outline" onClick={fetchGoogleStatus}>
                  Refresh Status
                </Button>
                <Button variant="destructive" onClick={disconnectGoogle}>
                  Disconnect Google
                </Button>
              </>
            ) : (
              <Button
                onClick={connectGoogle}
                disabled={connecting}
                className="bg-primary hover:bg-primary/90"
              >
                {connecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    Connect Google Workspace
                  </>
                )}
              </Button>
            )}
          </div>

          {googleStatus.lastSyncedAt && (
            <p className="text-xs text-muted-foreground">
              Last synced: {new Date(googleStatus.lastSyncedAt).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

          {/* E-commerce Integrations */}
          <div>
            <h2 className="text-xl font-semibold mb-4">E-commerce Platforms</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <IntegrationCard
                name="Shopify"
                description="Sync products, orders, and inventory"
                icon={<SiShopify className="h-7 w-7 text-green-600" />}
                category="E-commerce"
                connected={isConnected('shopify')}
                onSetup={() => openSetupModal('shopify')}
                onTest={() => testConnection('shopify')}
                onDisconnect={() => disconnectIntegration('shopify')}
              />

              <IntegrationCard
                name="WooCommerce"
                description="WordPress e-commerce integration"
                icon={<SiWoo className="h-7 w-7 text-purple-600" />}
                category="E-commerce"
                connected={isConnected('woocommerce')}
                onSetup={() => openSetupModal('woocommerce')}
                onTest={() => testConnection('woocommerce')}
                onDisconnect={() => disconnectIntegration('woocommerce')}
              />

              <IntegrationCard
                name="Magento 2"
                description="Adobe Commerce platform integration"
                icon={<SiMagento className="h-7 w-7 text-orange-600" />}
                category="E-commerce"
                connected={isConnected('magento2')}
                onSetup={() => openSetupModal('magento2')}
                onTest={() => testConnection('magento2')}
                onDisconnect={() => disconnectIntegration('magento2')}
              />

              <IntegrationCard
                name="PrestaShop"
                description="European e-commerce platform"
                icon={<SiPrestashop className="h-7 w-7 text-pink-600" />}
                category="E-commerce"
                connected={isConnected('prestashop')}
                onSetup={() => openSetupModal('prestashop')}
                onTest={() => testConnection('prestashop')}
                onDisconnect={() => disconnectIntegration('prestashop')}
              />

              <IntegrationCard
                name="Qapla"
                description="Shipping and logistics platform"
                icon={<Package className="h-7 w-7 text-blue-600" />}
                category="E-commerce"
                connected={isConnected('qapla')}
                onSetup={() => openSetupModal('qapla')}
                onTest={() => testConnection('qapla')}
                onDisconnect={() => disconnectIntegration('qapla')}
              />
            </div>
          </div>

          {/* Booking Platforms */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Booking Platforms</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <IntegrationCard
                name="Vertical Booking"
                description="Hotel booking engine integration"
                icon={<Hotel className="h-7 w-7 text-indigo-600" />}
                category="Booking"
                connected={isConnected('vertical-booking')}
                onSetup={() => openSetupModal('vertical-booking')}
                onTest={() => testConnection('vertical-booking')}
                onDisconnect={() => disconnectIntegration('vertical-booking')}
              />

              <IntegrationCard
                name="Booking Expert"
                description="Accommodation booking system"
                icon={<Hotel className="h-7 w-7 text-teal-600" />}
                category="Booking"
                connected={isConnected('booking-expert')}
                onSetup={() => openSetupModal('booking-expert')}
                onTest={() => testConnection('booking-expert')}
                onDisconnect={() => disconnectIntegration('booking-expert')}
              />
            </div>
          </div>

          {/* Custom Integration */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Custom Integration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <IntegrationCard
                name="MCP Microservice"
                description="Connect custom microservices"
                icon={<Settings className="h-7 w-7 text-gray-600" />}
                category="Custom"
                connected={isConnected('mcp')}
                onSetup={() => openSetupModal('mcp')}
                onDisconnect={() => disconnectIntegration('mcp')}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ecommerce" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <IntegrationCard
              name="Shopify"
              description="Sync products, orders, and inventory"
              icon={<SiShopify className="h-7 w-7 text-green-600" />}
              category="E-commerce"
              connected={isConnected('shopify')}
              onSetup={() => openSetupModal('shopify')}
              onTest={() => testConnection('shopify')}
              onDisconnect={() => disconnectIntegration('shopify')}
            />

            <IntegrationCard
              name="WooCommerce"
              description="WordPress e-commerce integration"
              icon={<SiWoo className="h-7 w-7 text-purple-600" />}
              category="E-commerce"
              connected={isConnected('woocommerce')}
              onSetup={() => openSetupModal('woocommerce')}
              onTest={() => testConnection('woocommerce')}
              onDisconnect={() => disconnectIntegration('woocommerce')}
            />

            <IntegrationCard
              name="Magento 2"
              description="Adobe Commerce platform integration"
              icon={<SiMagento className="h-7 w-7 text-orange-600" />}
              category="E-commerce"
              connected={isConnected('magento2')}
              onSetup={() => openSetupModal('magento2')}
              onTest={() => testConnection('magento2')}
              onDisconnect={() => disconnectIntegration('magento2')}
            />

            <IntegrationCard
              name="PrestaShop"
              description="European e-commerce platform"
              icon={<SiPrestashop className="h-7 w-7 text-pink-600" />}
              category="E-commerce"
              connected={isConnected('prestashop')}
              onSetup={() => openSetupModal('prestashop')}
              onTest={() => testConnection('prestashop')}
              onDisconnect={() => disconnectIntegration('prestashop')}
            />

            <IntegrationCard
              name="Qapla"
              description="Shipping and logistics platform"
              icon={<Package className="h-7 w-7 text-blue-600" />}
              category="E-commerce"
              connected={isConnected('qapla')}
              onSetup={() => openSetupModal('qapla')}
              onTest={() => testConnection('qapla')}
              onDisconnect={() => disconnectIntegration('qapla')}
            />
          </div>
        </TabsContent>

        <TabsContent value="booking" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <IntegrationCard
              name="Vertical Booking"
              description="Hotel booking engine integration"
              icon={<Hotel className="h-7 w-7 text-indigo-600" />}
              category="Booking"
              connected={isConnected('vertical-booking')}
              onSetup={() => openSetupModal('vertical-booking')}
              onTest={() => testConnection('vertical-booking')}
              onDisconnect={() => disconnectIntegration('vertical-booking')}
            />

            <IntegrationCard
              name="Booking Expert"
              description="Accommodation booking system"
              icon={<Hotel className="h-7 w-7 text-teal-600" />}
              category="Booking"
              connected={isConnected('booking-expert')}
              onSetup={() => openSetupModal('booking-expert')}
              onTest={() => testConnection('booking-expert')}
              onDisconnect={() => disconnectIntegration('booking-expert')}
            />
          </div>
        </TabsContent>

        <TabsContent value="productivity" className="space-y-4 mt-6">
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                    </svg>
                  </div>
                  <div>
                    <CardTitle className="text-xl">Google Workspace</CardTitle>
                    <CardDescription>
                      Sheets, Drive, and Calendar integration
                    </CardDescription>
                  </div>
                </div>
                
                {googleStatus.connected ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <XCircle className="h-5 w-5" />
                    <span className="font-medium">Not Connected</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!googleStatus.connected ? (
                <Button
                  onClick={connectGoogle}
                  disabled={connecting}
                  className="bg-primary hover:bg-primary/90"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      Connect Google Workspace
                    </>
                  )}
                </Button>
              ) : (
                <div className="flex gap-3">
                  <Button variant="outline" onClick={fetchGoogleStatus}>
                    Refresh Status
                  </Button>
                  <Button variant="destructive" onClick={disconnectGoogle}>
                    Disconnect
                  </Button>
                </div>
              )}
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>

      {/* Setup Modal */}
      {currentPlatform && (
        <SetupModal
          isOpen={setupModalOpen}
          onClose={() => {
            setSetupModalOpen(false);
            setCurrentPlatform(null);
          }}
          title={`Setup ${currentPlatform.charAt(0).toUpperCase() + currentPlatform.slice(1)}`}
          description={`Enter your ${currentPlatform} credentials to connect`}
          fields={getSetupFields(currentPlatform)}
          onSubmit={handleSetup}
        />
      )}
    </div>
  );
}
