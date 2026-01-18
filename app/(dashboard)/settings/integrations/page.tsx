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
  Settings,
  Phone,
  PhoneOutgoing,
  MessageSquare
} from "lucide-react";
import { IntegrationCard } from "@/components/integrations/IntegrationCard";
import { SetupModal } from "@/components/integrations/SetupModal";
import { integrationService } from "@/services/integration.service";
import { apiClient } from "@/lib/api";

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
    
    // Refresh integrations when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchPythonIntegrations();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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
      const data = await apiClient.get('/integrations/google/status');
      if (data.success) {
        setGoogleStatus(data.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch Google status:', error);
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please log in again.');
      }
    }
  };

  const fetchPythonIntegrations = async () => {
    try {
      const data = await integrationService.listInitializedIntegrations();
      console.log('[Integrations] Python backend response:', data);
      
      if (data && Array.isArray(data)) {
        // Normalize the integration data to ensure consistent format
        const normalizedIntegrations = data.map((integration: any) => {
          // Handle different possible response formats
          let key = integration.key || integration.name?.toLowerCase() || integration.integration?.toLowerCase() || '';
          const name = integration.name || integration.integration || key;
          
          // Map common variations to standard keys
          const keyMap: Record<string, string> = {
            'woocommerce': 'woocommerce',
            'woo': 'woocommerce',
            'shopify': 'shopify',
            'magento': 'magento2',
            'magento2': 'magento2',
            'prestashop': 'prestashop',
            'qapla': 'qapla',
            'vertical-booking': 'vertical-booking',
            'verticalbooking': 'vertical-booking',
            'booking-expert': 'booking-expert',
            'bookingexpert': 'booking-expert',
            'mcp': 'mcp'
          };
          
          // Normalize the key
          const normalizedKey = keyMap[key.toLowerCase()] || key.toLowerCase();
          
          // Determine connected status from various possible fields
          let connected = false;
          if (integration.connected !== undefined) {
            connected = Boolean(integration.connected);
          } else if (integration.status) {
            connected = ['connected', 'active', 'initialized'].includes(integration.status.toLowerCase());
          } else if (integration.initialized !== undefined) {
            connected = Boolean(integration.initialized);
          } else {
            // If integration exists in the list, assume it's connected
            connected = true;
          }
          
          return {
            name,
            key: normalizedKey,
            connected
          };
        });
        
        console.log('[Integrations] Normalized integrations:', normalizedIntegrations);
        setIntegrations(normalizedIntegrations);
      } else if (data && typeof data === 'object') {
        // Handle case where response is an object with integrations array
        // Python backend returns: { status: "success", initialized_clients: ["woocommerce", ...] }
        const integrationsArray = data.initialized_clients || data.integrations || data.data || [];
        if (Array.isArray(integrationsArray)) {
          // Process array of integration names/keys
          const normalizedIntegrations = integrationsArray.map((integration: any) => {
            // If it's just a string (like "woocommerce"), use it as the key
            let key = typeof integration === 'string' 
              ? integration.toLowerCase() 
              : (integration.key || integration.name?.toLowerCase() || integration.integration?.toLowerCase() || '');
            
            const name = typeof integration === 'string' 
              ? integration.charAt(0).toUpperCase() + integration.slice(1).replace(/-/g, ' ')
              : (integration.name || integration.integration || key);
            
            // Map common variations to standard keys
            const keyMap: Record<string, string> = {
              'woocommerce': 'woocommerce',
              'woo': 'woocommerce',
              'shopify': 'shopify',
              'magento': 'magento2',
              'magento2': 'magento2',
              'prestashop': 'prestashop',
              'qapla': 'qapla',
              'vertical-booking': 'vertical-booking',
              'verticalbooking': 'vertical-booking',
              'booking-expert': 'booking-expert',
              'bookingexpert': 'booking-expert',
              'mcp': 'mcp'
            };
            
            const normalizedKey = keyMap[key.toLowerCase()] || key.toLowerCase();
            
            // If integration exists in initialized_clients, it's connected
            const connected = true; // If it's in the list, it's initialized/connected
            
            return {
              name,
              key: normalizedKey,
              connected
            };
          });
          console.log('[Integrations] Normalized integrations (from object):', normalizedIntegrations);
          setIntegrations(normalizedIntegrations);
        } else {
          console.warn('[Integrations] Unexpected response format:', data);
          setIntegrations([]);
        }
      } else {
        console.warn('[Integrations] Unexpected response format:', data);
        setIntegrations([]);
      }
    } catch (error) {
      console.error('Failed to fetch Python integrations:', error);
      setIntegrations([]);
    }
  };

  const isConnected = (key: string) => {
    const normalizedKey = key.toLowerCase();
    const found = integrations.some((i) => {
      const integrationKey = (i.key || '').toLowerCase();
      return integrationKey === normalizedKey && i.connected;
    });
    console.log(`[Integrations] Checking connection for "${key}":`, found, 'Available integrations:', integrations);
    return found;
  };

  // ==================== GOOGLE INTEGRATION HANDLERS ====================

  const connectGoogle = async () => {
    try {
      setConnecting(true);
      
      const data = await apiClient.post('/integrations/google/connect', {
        services: ['sheets', 'drive', 'calendar'],
      });
      
      if (data.success && data.data.authUrl) {
        window.location.href = data.data.authUrl;
      } else {
        throw new Error('Failed to get authorization URL');
      }
    } catch (error: any) {
      console.error('Google connect error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to connect to Google';
      toast.error(errorMessage);
      setConnecting(false);
    }
  };

  const disconnectGoogle = async () => {
    try {
      const data = await apiClient.delete('/integrations/google/disconnect');
      
      if (data.success) {
        toast.success('Google integration disconnected');
        setGoogleStatus({ connected: false });
      }
    } catch (error: any) {
      console.error('Disconnect error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to disconnect';
      toast.error(errorMessage);
    }
  };

  const exportContactsToSheets = async () => {
    try {
      setExporting(true);
      
      const data = await apiClient.post('/integrations/google/sheets/export-contacts');
      
      if (data.success) {
        toast.success('Contacts exported successfully!');
        if (data.data.spreadsheetUrl) {
          window.open(data.data.spreadsheetUrl, '_blank');
        }
      } else {
        throw new Error(data.message || 'Export failed');
      }
    } catch (error: any) {
      console.error('Export error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to export contacts';
      toast.error(errorMessage);
    } finally {
      setExporting(false);
    }
  };

  const uploadSampleFileToDrive = async () => {
    try {
      setUploadingToDrive(true);
      
      const sampleContent = `Aistein-It - Sample File\n\nThis is a test file uploaded from Aistein-It integrations.\nTimestamp: ${new Date().toISOString()}\n`;
      const blob = new Blob([sampleContent], { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', blob, 'kepleroai-test.txt');
      formData.append('name', `Aistein-It Test - ${new Date().toLocaleDateString()}`);
      
      const data = await apiClient.uploadFile('/integrations/google/drive/upload', formData);
      
      if (data.success) {
        toast.success('File uploaded to Google Drive!');
        if (data.data.webViewLink) {
          window.open(data.data.webViewLink, '_blank');
        }
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload file';
      toast.error(errorMessage);
    } finally {
      setUploadingToDrive(false);
    }
  };

  const createSampleCalendarEvent = async () => {
    try {
      setCreatingCalendarEvent(true);
      
      const startTime = new Date();
      startTime.setHours(startTime.getHours() + 1);
      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 1);
      
      const data = await apiClient.post('/integrations/google/calendar/events', {
        summary: 'KepleroAI Test Meeting',
        description: 'This is a test event created from KepleroAI integrations.',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        attendees: [],
      });
      
      if (data.success) {
        toast.success('Event created in Google Calendar!');
        if (data.data.htmlLink) {
          window.open(data.data.htmlLink, '_blank');
        }
      } else {
        throw new Error(data.message || 'Event creation failed');
      }
    } catch (error: any) {
      console.error('Calendar event error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create calendar event';
      toast.error(errorMessage);
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
          // Save to backend Settings
          await apiClient.post('/settings/ecommerce-credentials', {
            platform: 'shopify',
            base_url: data.shop_url?.startsWith('http') ? data.shop_url : `https://${data.shop_url}`,
            api_key: data.admin_api_key,
            access_token: data.admin_api_key // Shopify uses admin_api_key as access token
          });
          break;
        case 'woocommerce':
          console.log('[WooCommerce Setup] Starting setup with data:', {
            store_url: data.store_url,
            has_consumer_key: !!data.consumer_key,
            has_consumer_secret: !!data.consumer_secret
          });
          
          result = await integrationService.setupWooCommerce(data as any);
          console.log('[WooCommerce Setup] Python backend setup result:', result);
          
          // Normalize store_url before saving to backend
          let normalizedStoreUrl = data.store_url?.trim() || '';
          if (normalizedStoreUrl) {
            // Remove trailing slashes
            normalizedStoreUrl = normalizedStoreUrl.replace(/\/+$/, '');
            
            // Ensure https:// prefix
            if (!normalizedStoreUrl.startsWith('http://') && !normalizedStoreUrl.startsWith('https://')) {
              normalizedStoreUrl = `https://${normalizedStoreUrl}`;
            }
            
            // Remove WooCommerce API paths if user accidentally included them
            const apiPathPatterns = ['/wp-json/wc/v3', '/wp-json/wc/v2', '/wp-json/wc/v1', '/wp-json'];
            for (const pattern of apiPathPatterns) {
              if (normalizedStoreUrl.includes(pattern)) {
                normalizedStoreUrl = normalizedStoreUrl.split(pattern)[0];
                break; // Only remove the first match
              }
            }
          }
          
          // Append /wp-json/wc/v3 to the normalized URL before storing in DB
          const urlForDb = normalizedStoreUrl ? `${normalizedStoreUrl}/wp-json/wc/v3` : '';
          
          console.log('[WooCommerce Setup] Normalized URL (sent to Python):', normalizedStoreUrl);
          console.log('[WooCommerce Setup] URL for DB (with /wp-json/wc/v3):', urlForDb);
          
          // Save to backend Settings and InboundAgentConfig
          const saveResponse = await apiClient.post('/settings/ecommerce-credentials', {
            platform: 'woocommerce',
            base_url: urlForDb,
            api_key: data.consumer_key,
            api_secret: data.consumer_secret
          });
          console.log('[WooCommerce Setup] ✅ Credentials saved to backend:', saveResponse);
          break;
        case 'magento2':
          result = await integrationService.setupMagento2(data as any);
          // Save to backend Settings
          await apiClient.post('/settings/ecommerce-credentials', {
            platform: 'magento2',
            base_url: data.store_url,
            api_key: data.consumer_key,
            api_secret: data.consumer_secret,
            access_token: data.access_token
          });
          break;
        case 'prestashop':
          result = await integrationService.setupPrestaShop(data as any);
          // Save to backend Settings
          await apiClient.post('/settings/ecommerce-credentials', {
            platform: 'prestashop',
            base_url: data.store_url,
            api_key: data.api_key
          });
          break;
        case 'qapla':
          result = await integrationService.setupQapla(data as any);
          // Save to backend Settings
          await apiClient.post('/settings/ecommerce-credentials', {
            platform: 'qapla',
            base_url: data.base_url,
            api_key: data.api_key
          });
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
      
      // Close modal and refresh integrations
      setSetupModalOpen(false);
      setCurrentPlatform(null);
      
      // Wait a bit for Python backend to process, then fetch
      setTimeout(async () => {
        await fetchPythonIntegrations();
      }, 500);
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

  const testInboundCall = async () => {
    try {
      // Get the first inbound phone number from settings
      const phoneSettings = await apiClient.get('/phone-settings');
      const inboundNumbers = phoneSettings.data?.inboundPhoneNumbers || [];
      
      if (inboundNumbers.length === 0) {
        toast.error('No inbound phone numbers configured. Please configure phone numbers in Settings → Phone Settings → Inbound tab.');
        return;
      }
      
      const calledNumber = inboundNumbers[0];
      
      console.log('[Test Inbound Call] Testing with phone number:', calledNumber);
      
      const result = await apiClient.post('/inbound-agent-config/test-inbound-call', {
        calledNumber
      });
      
      if (result.success) {
        toast.success('Inbound call test initiated! Check backend logs for details.');
        console.log('[Test Inbound Call] Test result:', result);
      } else {
        toast.error(result.error?.message || 'Test failed');
      }
    } catch (error: any) {
      console.error('[Test Inbound Call] Error:', error);
      toast.error(error.response?.data?.error?.message || error.message || 'Failed to test inbound call');
    }
  };

  const testOutboundCall = async () => {
    const phoneNumber = prompt('Enter phone number to test (with country code, e.g., +1234567890):');
    if (!phoneNumber) return;
    
    if (!phoneNumber.startsWith('+')) {
      toast.error('Phone number must include country code (e.g., +1234567890)');
      return;
    }
    
    try {
      console.log('[Test Outbound Call] Testing with phone number:', phoneNumber);
      
      const result = await apiClient.post('/ai-behavior/voice-agent/test', {
        phoneNumber
      });
      
      if (result.success) {
        toast.success('Outbound call test initiated! You should receive a call shortly.');
        console.log('[Test Outbound Call] Test result:', result);
      } else {
        toast.error(result.error?.message || 'Test failed');
      }
    } catch (error: any) {
      console.error('[Test Outbound Call] Error:', error);
      toast.error(error.response?.data?.error?.message || error.message || 'Failed to test outbound call');
    }
  };

  const testChatbot = async () => {
    const query = prompt('Enter test query (or leave empty for default "I need only products name"):') || "I need only products name";
    
    if (!query.trim()) {
      toast.error('Query cannot be empty');
      return;
    }
    
    try {
      console.log('[Test Chatbot] Testing with query:', query);
      
      const result = await apiClient.post('/chatbot/test', {
        query,
        collection_names: [],
        top_k: 5,
        elaborate: false,
        skip_history: false
      });
      
      if (result.success) {
        toast.success('Chatbot test completed! Check console for response.');
        console.log('[Test Chatbot] Test result:', result);
        
        // Show the response in an alert
        const answer = result.data?.data?.answer || result.data?.answer || 'No answer received';
        const preview = answer.length > 200 ? answer.substring(0, 200) + '...' : answer;
        alert(`Chatbot Response:\n\n${preview}\n\nFull response logged in console.`);
      } else {
        toast.error(result.error?.message || 'Test failed');
      }
    } catch (error: any) {
      console.error('[Test Chatbot] Error:', error);
      const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to test chatbot';
      toast.error(errorMessage);
    }
  };

  const disconnectIntegration = async (platform: string) => {
    if (!confirm(`Are you sure you want to disconnect ${platform}?`)) {
      return;
    }
    
    try {
      // List of e-commerce platforms that store credentials in Node.js backend Settings
      const ecommercePlatforms = ['woocommerce', 'shopify', 'magento2', 'prestashop', 'qapla'];
      const isEcommercePlatform = ecommercePlatforms.includes(platform.toLowerCase());
      
      // For e-commerce platforms, also delete from Node.js backend Settings
      if (isEcommercePlatform) {
        try {
          console.log(`[Disconnect ${platform}] Deleting from Node.js backend Settings...`);
          await apiClient.delete('/settings/ecommerce-credentials');
          console.log(`[Disconnect ${platform}] ✅ Deleted from Node.js backend Settings`);
        } catch (nodeError: any) {
          console.warn(`[Disconnect ${platform}] ⚠️  Failed to delete from Node.js backend:`, nodeError.message);
          // Continue with Python backend deletion even if Node.js deletion fails
        }
      }
      
      // Remove from Python backend
      const possibleNames = [platform, platform.toLowerCase(), platform.charAt(0).toUpperCase() + platform.slice(1)];
      
      let removed = false;
      for (const name of possibleNames) {
        try {
          await integrationService.removeIntegration(name);
          removed = true;
          break;
        } catch (e) {
          // Try next name
          continue;
        }
      }
      
      if (!removed) {
        // Fallback: try with the platform name as-is
        await integrationService.removeIntegration(platform);
      }
      
      toast.success(`${platform} integration removed`);
      // Refresh the list after a short delay
      setTimeout(async () => {
        await fetchPythonIntegrations();
      }, 500);
    } catch (error: any) {
      console.error(`[Disconnect ${platform}] Error:`, error);
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
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Small Header */}
        <div className="mb-6 pb-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Integrations</h2>
          <p className="text-sm text-muted-foreground mt-1">Connect external services to enhance your workflow</p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="ecommerce">E-commerce</TabsTrigger>
            <TabsTrigger value="booking">Booking</TabsTrigger>
            <TabsTrigger value="productivity">Productivity</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6 mt-6">
            {/* Google Workspace */}
            <Card className="border-border p-6">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center flex-shrink-0">
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
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-xl mb-1.5">Google Workspace</CardTitle>
                      <CardDescription className="text-sm leading-relaxed">
                        Sheets, Drive, and Calendar integration
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    {googleStatus.connected ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                        <span className="font-medium">Connected</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <XCircle className="h-5 w-5 flex-shrink-0" />
                        <span className="font-medium">Not Connected</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {googleStatus.connected && googleStatus.googleProfile && (
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg mb-6">
                    {googleStatus.googleProfile.picture && (
                      <img
                        src={googleStatus.googleProfile.picture}
                        alt="Profile"
                        className="w-10 h-10 rounded-full flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* Google Sheets */}
                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <SiGooglesheets className="h-5 w-5 text-green-600 flex-shrink-0" />
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
                        className="w-full cursor-pointer"
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
                      <SiGoogledrive className="h-5 w-5 text-blue-600 flex-shrink-0" />
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
                        className="w-full cursor-pointer"
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
                      <SiGooglecalendar className="h-5 w-5 text-red-600 flex-shrink-0" />
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
                        className="w-full cursor-pointer"
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
                <div className="flex gap-3 pt-4 mt-2 border-t border-border">
                  {googleStatus.connected ? (
                    <>
                      <Button variant="outline" onClick={fetchGoogleStatus} className="cursor-pointer">
                        Refresh Status
                      </Button>
                      <Button variant="destructive" onClick={disconnectGoogle} className="cursor-pointer">
                        Disconnect Google
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={connectGoogle}
                      disabled={connecting}
                      className="bg-primary hover:bg-primary/90 cursor-pointer"
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
                  <p className="text-xs text-muted-foreground mt-2">
                    Last synced: {new Date(googleStatus.lastSyncedAt).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* E-commerce Integrations */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">E-commerce Platforms</h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={fetchPythonIntegrations}
                  disabled={loading}
                  className="cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      Refresh Status
                    </>
                  )}
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              {/* WooCommerce Test Section */}
              {isConnected('woocommerce') && (
                <Card className="col-span-full">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5 text-purple-600" />
                      Test WooCommerce Integration
                    </CardTitle>
                    <CardDescription>
                      Test inbound calls, outbound calls, and chatbot with WooCommerce credentials
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button
                        variant="outline"
                        onClick={testInboundCall}
                        className="cursor-pointer h-auto py-4 flex flex-col items-center gap-2"
                      >
                        <Phone className="h-5 w-5" />
                        <div className="text-center">
                          <div className="font-semibold">Test Inbound Call</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Test with your configured phone number
                          </div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={testOutboundCall}
                        className="cursor-pointer h-auto py-4 flex flex-col items-center gap-2"
                      >
                        <PhoneOutgoing className="h-5 w-5" />
                        <div className="text-center">
                          <div className="font-semibold">Test Outbound Call</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Enter a phone number to call
                          </div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={testChatbot}
                        className="cursor-pointer h-auto py-4 flex flex-col items-center gap-2"
                      >
                        <MessageSquare className="h-5 w-5" />
                        <div className="text-center">
                          <div className="font-semibold">Test Chatbot</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Test chatbot with WooCommerce products
                          </div>
                        </div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

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
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-6">Booking Platforms</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-6">Custom Integration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          <TabsContent value="ecommerce" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          <TabsContent value="booking" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          <TabsContent value="productivity" className="space-y-6 mt-6">
            <Card className="border-border p-6">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-7 h-7 text-white" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-xl mb-1.5">Google Workspace</CardTitle>
                      <CardDescription className="text-sm leading-relaxed">
                        Sheets, Drive, and Calendar integration
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    {googleStatus.connected ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                        <span className="font-medium">Connected</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <XCircle className="h-5 w-5 flex-shrink-0" />
                        <span className="font-medium">Not Connected</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!googleStatus.connected ? (
                  <Button
                    onClick={connectGoogle}
                    disabled={connecting}
                    className="bg-primary hover:bg-primary/90 cursor-pointer"
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
                    <Button variant="outline" onClick={fetchGoogleStatus} className="cursor-pointer">
                      Refresh Status
                    </Button>
                    <Button variant="destructive" onClick={disconnectGoogle} className="cursor-pointer">
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
    </div>
  );
}
