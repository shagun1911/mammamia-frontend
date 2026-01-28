'use client';

import { useState, useEffect, useMemo } from 'react';
import { TrainingSidebar } from "@/components/training/TrainingSidebar";
import { IntegrationModal } from "@/components/integrations/IntegrationModal";
import { IntegrationList } from "@/components/integrations/IntegrationList";
import { EmailTemplateModal } from "@/components/integrations/EmailTemplateModal";
import { toolService, Tool } from "@/services/tool.service";
import { useEmailTemplates, useDeleteEmailTemplate } from "@/hooks/useEmailTemplates";
import { Plus, RefreshCw, Brain, Activity } from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";

// Extended Tool interface to include email templates
interface UnifiedIntegration extends Tool {
  isEmailTemplate?: boolean;
  template_id?: string;
}

export default function IntegrationsPage() {
  const { getSidebarWidth } = useSidebar();
  const [integrations, setIntegrations] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEmailTemplateModalOpen, setIsEmailTemplateModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch email templates using React Query
  const { data: emailTemplates = [], isLoading: isLoadingEmailTemplates, refetch: refetchEmailTemplates } = useEmailTemplates();
  const deleteEmailTemplate = useDeleteEmailTemplate();

  // Merge integrations and email templates into a unified list
  const allIntegrations = useMemo<UnifiedIntegration[]>(() => {
    // Convert email templates to Tool-like format
    const emailTemplateIntegrations: UnifiedIntegration[] = emailTemplates.map(template => ({
      tool_id: template.tool_id,
      tool_name: template.name,
      tool_type: 'email_template',
      description: template.description,
      properties: template.parameters.map(param => ({
        name: param.name,
        type: 'string',
        description: param.description,
        required: param.required,
        value: '',
      })),
      isEmailTemplate: true,
      template_id: template.template_id,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    }));

    // Combine regular integrations and email templates
    return [...integrations, ...emailTemplateIntegrations];
  }, [integrations, emailTemplates]);

  // Fetch all integrations
  const fetchIntegrations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const tools = await toolService.getAll();
      setIntegrations(tools);
    } catch (err: any) {
      console.error('Error fetching integrations:', err);
      setError(err.message || 'Failed to load integrations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
    // Email templates are fetched automatically via React Query hook
  }, []);

  // Handle create/update integration
  const handleSubmit = async (data: {
    tool_name: string;
    tool_type: string;
    description: string;
    properties: any[];
  }) => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (editingTool) {
        // Update existing tool
        await toolService.update(editingTool.tool_id, data);
      } else {
        // Create new tool
        await toolService.register(data);
      }

      // Refresh the list
      await fetchIntegrations();

      // Close modal and reset
      setIsModalOpen(false);
      setEditingTool(null);
    } catch (err: any) {
      console.error('Error saving integration:', err);
      setError(err.message || 'Failed to save integration');
      alert(err.message || 'Failed to save integration');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete integration (works for both regular tools and email templates)
  const handleDelete = async (toolId: string, isEmailTemplate?: boolean, templateId?: string) => {
    try {
      setError(null);
      
      if (isEmailTemplate && templateId) {
        // Delete email template
        await deleteEmailTemplate.mutateAsync(templateId);
        refetchEmailTemplates();
      } else {
        // Delete regular tool
        await toolService.delete(toolId);
        await fetchIntegrations();
      }
    } catch (err: any) {
      console.error('Error deleting integration:', err);
      setError(err.message || 'Failed to delete integration');
      alert(err.message || 'Failed to delete integration');
    }
  };

  // Handle edit integration
  const handleEdit = (tool: Tool) => {
    setEditingTool(tool);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTool(null);
  };

  // Handle email template modal
  const handleEmailTemplateRequest = () => {
    setIsModalOpen(false);
    setIsEmailTemplateModalOpen(true);
  };

  const handleEmailTemplateSuccess = () => {
    // Refresh email templates after creation
    refetchEmailTemplates();
  };

  return (
    <div className="fixed inset-0 flex flex-col transition-all duration-300" style={{ left: `${getSidebarWidth()}px` }}>
      {/* Full Navbar Header */}
      <div className="h-20 px-8 flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/5 via-primary/3 to-transparent backdrop-blur-sm shadow-sm flex-shrink-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              AI Dashboard
              <Activity className="w-5 h-5 text-primary" />
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Configure and manage your AI agents</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        <TrainingSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Integrations</h2>
                <p className="text-muted-foreground">
                  Create and manage custom integrations and automation tools
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    fetchIntegrations();
                    refetchEmailTemplates();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-xl font-medium hover:bg-accent transition-colors cursor-pointer"
                  disabled={isLoading || isLoadingEmailTemplates}
                >
                  <RefreshCw className={`w-4 h-4 ${(isLoading || isLoadingEmailTemplates) ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-2 bg-primary text-foreground rounded-xl font-medium hover:brightness-110 transition-all cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  New Integration
                </button>
              </div>
            </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {/* Integration List (includes both regular integrations and email templates) */}
        <IntegrationList
          integrations={allIntegrations}
          onEdit={handleEdit}
          onDelete={(toolId, integration) => {
            const unifiedIntegration = integration as UnifiedIntegration;
            handleDelete(toolId, unifiedIntegration.isEmailTemplate, unifiedIntegration.template_id);
          }}
          isLoading={isLoading || isLoadingEmailTemplates}
        />

        {/* Integration Modal */}
        <IntegrationModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSubmit={handleSubmit}
          editingTool={editingTool}
          isLoading={isSubmitting}
          onEmailTemplateRequest={handleEmailTemplateRequest}
        />

        {/* Email Template Modal */}
        <EmailTemplateModal
          isOpen={isEmailTemplateModalOpen}
          onClose={() => setIsEmailTemplateModalOpen(false)}
          onSuccess={handleEmailTemplateSuccess}
        />
          </div>
        </div>
      </div>
    </div>
  );
}
