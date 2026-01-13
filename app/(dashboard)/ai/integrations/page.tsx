'use client';

import { useState, useEffect } from 'react';
import { TrainingSidebar } from "@/components/training/TrainingSidebar";
import { IntegrationModal } from "@/components/integrations/IntegrationModal";
import { IntegrationList } from "@/components/integrations/IntegrationList";
import { toolService, Tool } from "@/services/tool.service";
import { Plus, RefreshCw } from "lucide-react";

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Handle delete integration
  const handleDelete = async (toolId: string) => {
    try {
      setError(null);
      await toolService.delete(toolId);
      
      // Refresh the list
      await fetchIntegrations();
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

  return (
    <div className="fixed inset-0 flex" style={{ left: "240px" }}>
      <TrainingSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Integrations</h1>
            <p className="text-muted-foreground">
              Create and manage custom integrations and automation tools
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchIntegrations}
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-xl font-medium hover:bg-accent transition-colors cursor-pointer"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
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

        {/* Integration List */}
        <IntegrationList
          integrations={integrations}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isLoading={isLoading}
        />

        {/* Integration Modal */}
        <IntegrationModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSubmit={handleSubmit}
          editingTool={editingTool}
          isLoading={isSubmitting}
        />
        </div>
      </div>
    </div>
  );
}

