"use client";

import { useState, useEffect } from "react";
import { Sparkles, CheckCircle2, XCircle, AlertCircle, ArrowRight, ChevronRight } from "lucide-react";
import { automationTemplates, AutomationTemplate } from "@/data/automationTemplates";
import { Automation, AutomationNode } from "@/data/mockAutomations";
import { apiClient } from "@/lib/api";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface PrebuiltTemplatesProps {
  onUseTemplate: (template: Automation) => void;
}

interface IntegrationStatus {
  whatsapp: boolean;
  facebook: boolean;
  google: boolean;
  email: boolean;
}

export function PrebuiltTemplates({ onUseTemplate }: PrebuiltTemplatesProps) {
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus>({
    whatsapp: false,
    facebook: false,
    google: false,
    email: false,
  });
  const [loading, setLoading] = useState(true);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);

  useEffect(() => {
    checkIntegrations();
  }, []);

  const checkIntegrations = async () => {
    try {
      setLoading(true);
      
      // Check WhatsApp integration
      try {
        const whatsappRes = await apiClient.get('/social-integrations/whatsapp');
        const whatsappData = whatsappRes.data?.data || whatsappRes.data;
        // Integration is connected if it exists and status is 'connected'
        const isConnected = whatsappData && (
          whatsappData.status === 'connected' || 
          whatsappData.status === 'active' ||
          (whatsappData.platform === 'whatsapp' && whatsappData.credentials?.apiKey)
        );
        setIntegrationStatus(prev => ({
          ...prev,
          whatsapp: !!isConnected,
        }));
        console.log('[PrebuiltTemplates] WhatsApp status:', { isConnected, data: whatsappData });
      } catch (error: any) {
        console.log('[PrebuiltTemplates] WhatsApp check failed:', error.response?.status, error.message);
        setIntegrationStatus(prev => ({ ...prev, whatsapp: false }));
      }

      // Check Facebook integration
      try {
        const facebookRes = await apiClient.get('/social-integrations/facebook');
        const facebookData = facebookRes.data?.data || facebookRes.data;
        // Integration is connected if it exists and status is 'connected'
        const isConnected = facebookData && (
          facebookData.status === 'connected' || 
          facebookData.status === 'active' ||
          (facebookData.platform === 'facebook' && facebookData.credentials?.apiKey)
        );
        setIntegrationStatus(prev => ({
          ...prev,
          facebook: !!isConnected,
        }));
        console.log('[PrebuiltTemplates] Facebook status:', { isConnected, data: facebookData });
      } catch (error: any) {
        console.log('[PrebuiltTemplates] Facebook check failed:', error.response?.status, error.message);
        setIntegrationStatus(prev => ({ ...prev, facebook: false }));
      }

      // Check Google integration
      try {
        console.log('[PrebuiltTemplates] Checking Google integration...');
        // apiClient.get() returns response.data directly, which is { success: true, data: {...} }
        const googleRes = await apiClient.get('/integrations/google/status');
        console.log('[PrebuiltTemplates] Google API response:', googleRes);
        
        // Extract the actual data - backend returns { success: true, data: {...} }
        // apiClient.get() already returns response.data, so googleRes is { success: true, data: {...} }
        const googleData = googleRes?.data || googleRes;
        console.log('[PrebuiltTemplates] Google extracted data:', googleData);
        
        // Google is connected if:
        // 1. connected flag is explicitly true, OR
        // 2. Any service is enabled (gmail, sheets, calendar, drive)
        const hasServices = googleData?.services && (
          googleData.services.sheets === true ||
          googleData.services.calendar === true ||
          googleData.services.gmail === true ||
          googleData.services.drive === true
        );
        
        const googleConnected = googleData?.connected === true || hasServices;
        
        console.log('[PrebuiltTemplates] Google connection check:', {
          connected: googleData?.connected,
          hasServices,
          services: googleData?.services,
          finalResult: googleConnected
        });
        
        setIntegrationStatus(prev => ({
          ...prev,
          google: !!googleConnected,
        }));
      } catch (error: any) {
        console.error('[PrebuiltTemplates] Google check failed:', {
          status: error.status || error.response?.status,
          message: error.message,
          data: error.data || error.response?.data
        });
        setIntegrationStatus(prev => ({ ...prev, google: false }));
      }

      // Email is always available
      setIntegrationStatus(prev => ({ ...prev, email: true }));
    } catch (error) {
      console.error('[PrebuiltTemplates] Error checking integrations:', error);
      setIntegrationStatus({
        whatsapp: false,
        facebook: false,
        google: false,
        email: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const isIntegrationConnected = (integration: string): boolean => {
    switch (integration.toLowerCase()) {
      case 'whatsapp':
        return integrationStatus.whatsapp;
      case 'facebook':
        return integrationStatus.facebook;
      case 'google':
        return integrationStatus.google;
      case 'email':
        return integrationStatus.email;
      default:
        return true;
    }
  };

  const getNodeIcon = (service: string): string => {
    const serviceMap: Record<string, string> = {
      facebook_leads: "📘",
      keplero_contact_created: "👤",
      keplero_create_contact: "➕",
      whatsapp_template: "💬",
      keplero_send_email: "📧",
      keplero_outbound_call: "📞",
      keplero_mass_sending: "📤",
      webhook: "🔗",
      delay: "⏱️",
    };
    return serviceMap[service] || "⚙️";
  };

  const getNodeName = (service: string): string => {
    const nameMap: Record<string, string> = {
      facebook_leads: "Facebook Lead",
      keplero_contact_created: "Contact Created",
      keplero_create_contact: "Create Contact",
      whatsapp_template: "WhatsApp Message",
      keplero_send_email: "Send Email",
      keplero_outbound_call: "Outbound Call",
      keplero_mass_sending: "Mass Sending",
      webhook: "Webhook",
      delay: "Delay",
    };
    return nameMap[service] || service;
  };

  const handleUseTemplate = async (template: AutomationTemplate) => {
    try {
      const missingIntegrations = template.requiredIntegrations?.filter(
        (integration) => !isIntegrationConnected(integration)
      ) || [];

      if (missingIntegrations.length > 0) {
        toast.error(
          `Please connect the following integrations: ${missingIntegrations.join(', ')}`
        );
        return;
      }

      const timestamp = Date.now();
      const newAutomation: Automation = {
        id: `auto_${timestamp}`,
        name: `${template.name} (Copy)`,
        status: "disabled",
        nodes: template.nodes.map((node, index) => ({
          ...node,
          id: `node_${timestamp}_${index}`,
          position: index,
        })),
        lastExecuted: null,
        executionCount: 0,
        createdAt: new Date().toISOString(),
      };

      try {
        const response = await apiClient.post('/automations', {
          name: newAutomation.name,
          description: template.description,
          nodes: newAutomation.nodes.map(node => ({
            id: node.id,
            type: node.type,
            service: node.service,
            config: node.config,
            position: node.position,
          })),
          isActive: false,
        });

        const createdAutomation = response.data?.data || response.data;
        if (createdAutomation?._id) {
          newAutomation.id = createdAutomation._id;
        }
        if (createdAutomation?.name) {
          newAutomation.name = createdAutomation.name;
        }

        toast.success(`Template "${template.name}" created successfully!`);
        onUseTemplate(newAutomation);
      } catch (error: any) {
        console.error('Error creating automation:', error);
        const errorMessage = error.response?.data?.error?.message || 
                             error.response?.data?.message || 
                             'Failed to create automation';
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error using template:', error);
      toast.error('Failed to use template');
    }
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto px-4">
      {/* Header Section */}
      <div className="flex items-center justify-between max-w-[1200px] mx-auto px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Prebuilt Automations</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Start quickly with professionally designed workflows
            </p>
          </div>
        </div>
      </div>

      {/* Templates Grid - 2-3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 place-items-center">
        {automationTemplates.map((template) => {
          const missingIntegrations = template.requiredIntegrations?.filter(
            (integration) => !isIntegrationConnected(integration)
          ) || [];
          const canUse = missingIntegrations.length === 0;

          return (
            <div
              key={template.id}
              className={cn(
               "group relative bg-card border rounded-2xl p-6 transition-all duration-200 h-full flex flex-col w-full max-w-[360px]",
                canUse 
                  ? "border-border hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5" 
                  : "border-yellow-500/30 bg-yellow-500/5 opacity-75"
              )}
            >
              {/* Card Header */}
              <div className="flex items-start gap-4 mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm"
                  style={{ 
                    backgroundColor: `${template.color}15`, 
                    color: template.color,
                    border: `1px solid ${template.color}30`
                  }}
                >
                  {template.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-foreground mb-1.5 leading-tight">
                    {template.name}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {template.description}
                  </p>
                </div>
              </div>

              {/* Integration Status */}
              {template.requiredIntegrations && template.requiredIntegrations.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {template.requiredIntegrations.map((integration) => {
                    const isConnected = isIntegrationConnected(integration);
                    return (
                      <div
                        key={integration}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border",
                          isConnected
                            ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                            : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                        )}
                      >
                        {isConnected ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        <span>{integration}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Warning Banner - Only show if disabled */}
              {!canUse && (
                <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 leading-relaxed">
                    Connect required integrations to enable this template
                  </p>
                </div>
              )}

              {/* Steps Preview - Hidden by default, expandable */}
              <div className="mb-5 flex-1">
                <button
                  onClick={() =>
                    setExpandedTemplate(
                      expandedTemplate === template.id ? null : template.id
                    )
                  }
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-3 group"
                >
                  <span>View Steps</span>
                  <ChevronRight 
                    className={cn(
                      "w-4 h-4 transition-transform",
                      expandedTemplate === template.id && "rotate-90"
                    )} 
                  />
                  <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                    {template.nodes.length}
                  </span>
                </button>
                
                {expandedTemplate === template.id && (
                  <div className="space-y-2 pl-4 border-l-2 border-border max-w-[300px]">
                    {template.nodes.map((node, index) => {
                      const requiresIntegration =
                        node.service === "whatsapp_template" && !integrationStatus.whatsapp;
                      const isDisabled = requiresIntegration;

                      return (
                        <div
                          key={node.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg transition-colors",
                            isDisabled
                              ? "bg-muted/30 opacity-60"
                              : "bg-secondary/50 hover:bg-secondary"
                          )}
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-background flex items-center justify-center text-lg border border-border">
                            {getNodeIcon(node.service)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {getNodeName(node.service)}
                            </p>
                          </div>
                          {isDisabled && (
                            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleUseTemplate(template)}
                disabled={!canUse}
                className={cn(
                  "w-full max-w-[260px] mx-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 mt-auto",
                  canUse
                    ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg hover:scale-[1.02]"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {canUse ? (
                  <>
                    <span>Use Template</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    <span>Connect Integrations First</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
