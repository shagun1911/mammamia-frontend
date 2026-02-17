"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Plus, List, Trash2, Check, Zap, X, ArrowLeft, Loader2 } from "lucide-react";
import { Automation, AutomationNode as NodeType, nodeServices } from "@/data/mockAutomations";
import { AutomationNode } from "./AutomationNode";
import { NodeConnector } from "./NodeConnector";
import { NodeConfigPanel } from "./NodeConfigPanel";
import { AutomationList } from "./AutomationList";
import { ExecutionsModal } from "./ExecutionsModal";
import { apiClient } from "@/lib/api";
import { toast } from "@/lib/toast";

interface NodeBasedBuilderProps {
  automations: Automation[];
  onAutomationsChange?: (automations: Automation[]) => void;
}

export interface NodeBasedBuilderRef {
  handleNewAutomation: () => void;
}

export const NodeBasedBuilder = forwardRef<NodeBasedBuilderRef, NodeBasedBuilderProps>(({ automations: initialAutomations, onAutomationsChange }, ref) => {
  const [automations, setAutomations] = useState(initialAutomations);
  const [selectedAutomationId, setSelectedAutomationId] = useState<string | null>(
    initialAutomations[0]?.id || null
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showNodeSelector, setShowNodeSelector] = useState(false);
  const [insertPosition, setInsertPosition] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showExecutions, setShowExecutions] = useState(false);
  const [runningBatch, setRunningBatch] = useState(false);

  // Update automations when prop changes
  useEffect(() => {
    setAutomations(initialAutomations);
    if (initialAutomations.length > 0 && !selectedAutomationId) {
      setSelectedAutomationId(initialAutomations[0].id);
    }
  }, [initialAutomations]);

  // Helper function to update automations and notify parent
  const updateAutomations = (newAutomations: Automation[]) => {
    setAutomations(newAutomations);
    if (onAutomationsChange) {
      onAutomationsChange(newAutomations);
    }
  };

  const selectedAutomation = automations.find(
    (a) => a.id === selectedAutomationId
  );

  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setShowNodeSelector(false);
  };

  const handleAddNode = (position: number) => {
    setInsertPosition(position);
    setShowNodeSelector(true);
    setSelectedNodeId(null);
  };

  const handleSelectNodeType = (
    type: "trigger" | "action",
    service: string
  ) => {
    if (!selectedAutomation || insertPosition === null) return;

    const newNode: NodeType = {
      id: `node_${Date.now()}`,
      type,
      service,
      config: {},
      position: insertPosition,
    };

    const updatedNodes = [...selectedAutomation.nodes];
    updatedNodes.splice(insertPosition, 0, newNode);

    // Update positions
    updatedNodes.forEach((node, index) => {
      node.position = index;
    });

    const updatedAutomations = automations.map((a) =>
      a.id === selectedAutomationId ? { ...a, nodes: updatedNodes } : a
    );
    updateAutomations(updatedAutomations);

    setShowNodeSelector(false);
    setInsertPosition(null);
    setSelectedNodeId(newNode.id);
  };

  const handleAddDelay = () => {
    if (!selectedAutomation || insertPosition === null) return;

    const newNode: NodeType = {
      id: `node_${Date.now()}`,
      type: "delay",
      service: "delay",
      config: { delay: 5, delayUnit: "minutes" },
      position: insertPosition,
    };

    const updatedNodes = [...selectedAutomation.nodes];
    updatedNodes.splice(insertPosition, 0, newNode);

    updatedNodes.forEach((node, index) => {
      node.position = index;
    });

    const updatedAutomations = automations.map((a) =>
      a.id === selectedAutomationId ? { ...a, nodes: updatedNodes } : a
    );
    updateAutomations(updatedAutomations);

    setShowNodeSelector(false);
    setInsertPosition(null);
    setSelectedNodeId(newNode.id);
  };

  const handleUpdateNode = (config: NodeType["config"]) => {
    if (!selectedAutomation || !selectedNodeId) return;

    // CRITICAL: Ensure Google Sheets config is properly formatted and persisted
    let finalConfig = { ...config };
    const node = selectedAutomation.nodes.find(n => n.id === selectedNodeId);

    if (node?.service === "aistein_google_sheet_append_row") {
      // Ensure values array is properly formatted
      if (finalConfig.values && Array.isArray(finalConfig.values)) {
        // Filter out empty values but preserve array structure
        finalConfig.values = finalConfig.values.filter((v: string) => v && typeof v === 'string' && v.trim() !== "");
      } else {
        // Ensure values is always an array
        finalConfig.values = [];
      }

      // Ensure sheetName is set
      if (!finalConfig.sheetName || (typeof finalConfig.sheetName === 'string' && finalConfig.sheetName.trim() === "")) {
        finalConfig.sheetName = "Sheet1";
      }

      // Ensure range is set
      if (!finalConfig.range || (typeof finalConfig.range === 'string' && finalConfig.range.trim() === "")) {
        const sheetName = finalConfig.sheetName || "Sheet1";
        finalConfig.range = `${sheetName}!A1`;
      }

      // CRITICAL: Log to verify config is being written
      console.log('[NodeBasedBuilder] Updating Google Sheets node config:', {
        nodeId: selectedNodeId,
        spreadsheetId: finalConfig.spreadsheetId,
        sheetName: finalConfig.sheetName,
        valuesLength: finalConfig.values?.length || 0,
        values: finalConfig.values
      });
    }

    // CRITICAL: Write config into automation graph state
    const updatedNodes = selectedAutomation.nodes.map((node) =>
      node.id === selectedNodeId ? { ...node, config: finalConfig } : node
    );

    const updatedAutomations = automations.map((a) =>
      a.id === selectedAutomationId ? { ...a, nodes: updatedNodes } : a
    );

    // Update automation state - this ensures config is in the graph
    updateAutomations(updatedAutomations);
  };

  // Validate automation completeness (non-breaking: only for Google Sheets)
  const isAutomationIncomplete = () => {
    if (!selectedAutomation) return true;

    // Check if any Google Sheets node is incomplete
    const incompleteNode = selectedAutomation.nodes.find(node => {
      if (node.service === "aistein_google_sheet_append_row") {
        const hasSpreadsheetId = !!(node.config.spreadsheetId && node.config.spreadsheetId.trim() !== "");
        const hasValues = !!(node.config.values && Array.isArray(node.config.values) && node.config.values.length > 0 && node.config.values.some((v: string) => v && v.trim() !== ""));
        return !hasSpreadsheetId || !hasValues;
      }
      return false;
    });

    return !!incompleteNode;
  };

  const handleDeleteNode = (nodeId: string) => {
    if (!selectedAutomation) return;

    const updatedNodes = selectedAutomation.nodes
      .filter((node) => node.id !== nodeId)
      .map((node, index) => ({ ...node, position: index }));

    const updatedAutomations = automations.map((a) =>
      a.id === selectedAutomationId ? { ...a, nodes: updatedNodes } : a
    );
    updateAutomations(updatedAutomations);

    setSelectedNodeId(null);
  };

  const handleToggleStatus = async () => {
    if (!selectedAutomation || !selectedAutomationId) return;

    const newStatus = selectedAutomation.status === "enabled" ? "disabled" : "enabled";
    const isActive = newStatus === "enabled";

    try {
      // Update in backend
      const response = await apiClient.patch(`/automations/${selectedAutomationId}/toggle`, {
        isActive
      });

      // Get updated automation from response
      const updatedAutomationData = response.data?.data || response.data;

      // Update local state
      const updatedAutomations = automations.map((a) =>
        a.id === selectedAutomationId
          ? {
            ...a,
            status: (updatedAutomationData?.isActive ? "enabled" : "disabled") as "enabled" | "disabled",
            isActive: updatedAutomationData?.isActive || false,
          }
          : a
      );
      updateAutomations(updatedAutomations);

      toast.success(`Automation ${isActive ? 'enabled' : 'disabled'} successfully`);
    } catch (error: any) {
      console.error('Toggle error:', error);
      const errorMessage = error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        'Failed to toggle automation';
      toast.error(errorMessage);
    }
  };

  const handleNewAutomation = async () => {
    try {
      console.log('Creating new automation...');
      const response = await apiClient.post('/automations', {
        name: `Automation ${automations.length + 1}`,
        nodes: [],
        isActive: false
      });

      console.log('Response:', response);

      // Handle both response formats
      const data = response.data?.data || response.data;

      if (data && data._id) {
        const newAutomation: Automation = {
          id: data._id,
          name: data.name,
          status: data.isActive ? "enabled" : "disabled",
          nodes: data.nodes || [],
          lastExecuted: data.lastExecutedAt || null,
          executionCount: data.executionCount || 0,
          createdAt: data.createdAt || new Date().toISOString(),
        };

        console.log('New automation:', newAutomation);

        const newAutomations = [...automations, newAutomation];
        setAutomations(newAutomations);
        if (onAutomationsChange) {
          onAutomationsChange(newAutomations);
        }
        setSelectedAutomationId(newAutomation.id);
        setSelectedNodeId(null);
        toast.success('New automation created');
      } else {
        console.error('Invalid response structure:', response);
        toast.error('Failed to create automation: Invalid response');
      }
    } catch (error: any) {
      console.error('Error creating automation:', error);
      toast.error('Failed to create automation: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSaveAutomation = async () => {
    if (!selectedAutomation || !selectedAutomationId) return;

    setSaving(true);
    try {
      const backendNodes = selectedAutomation.nodes.map(node => {
        let config = { ...node.config };

        if (node.service === "aistein_google_sheet_append_row") {
          if (config.values && Array.isArray(config.values)) {
            config.values = config.values.filter(
              (v: string) => v && typeof v === "string" && v.trim() !== ""
            );
          } else {
            config.values = [];
          }

          if (!config.sheetName || config.sheetName.trim() === "") {
            config.sheetName = "Sheet1";
          }

          if (!config.range || config.range.trim() === "") {
            config.range = `${config.sheetName}!A1`;
          }

          console.log("[NodeBasedBuilder] Sending Google Sheets config:", {
            nodeId: node.id,
            spreadsheetId: config.spreadsheetId,
            sheetName: config.sheetName,
            valuesLength: config.values.length,
            values: config.values,
          });
        }

        return {
          id: node.id,
          type: node.type,
          service: node.service,
          config,
          position: node.position,
        };
      });

      // Extract webhook URL from webhook trigger node if present
      const webhookNode = selectedAutomation.nodes.find(node => node.service === 'webhook');
      const webhookUrl = webhookNode?.config?.webhookUrl || null;

      const response = await apiClient.patch(
        `/automations/${selectedAutomationId}`,
        {
          name: selectedAutomation.name,
          nodes: backendNodes,
          isActive: selectedAutomation.status === "enabled",
          webhookUrl: webhookUrl, // Send webhook URL at automation level
        }
      );

      toast.success("Automation saved successfully");
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error("Failed to save automation");
    } finally {
      setSaving(false);
    }
  };


  const handleDeleteAutomation = async () => {
    if (!selectedAutomation || !selectedAutomationId) return;

    if (!confirm(`Are you sure you want to delete "${selectedAutomation.name}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      await apiClient.delete(`/automations/${selectedAutomationId}`);

      // Remove from local state
      const updatedAutomations = automations.filter(a => a.id !== selectedAutomationId);
      updateAutomations(updatedAutomations);
      setSelectedAutomationId(updatedAutomations[0]?.id || null);
      setSelectedNodeId(null);

      toast.success('Automation deleted successfully');
    } catch (error: any) {
      console.error('Delete error:', error);
      const errorMessage = error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        'Failed to delete automation';
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const handleRunBatch = async () => {
    if (!selectedAutomation || !selectedAutomationId) return;

    // Find batch call trigger node
    const batchNode = selectedAutomation.nodes.find(n => n.service === "batch_call" || n.service === "aistein_mass_sending");
    if (!batchNode || !batchNode.config.listId) {
      toast.error("Batch calling node not configured with a list");
      return;
    }

    setRunningBatch(true);
    try {
      const response = await apiClient.post('/automations/run-batch', {
        listId: batchNode.config.listId,
        automationId: selectedAutomationId
      });

      if (response.data?.success || response.success) {
        toast.success(`Batch automation started for ${response.data?.contactCount || response.contactCount || 'all'} contacts!`);
      } else {
        throw new Error(response.data?.message || response.message || 'Failed to start batch');
      }
    } catch (error: any) {
      console.error('Run batch error:', error);
      toast.error(error.response?.data?.message || error.message || "Failed to start batch automation");
    } finally {
      setRunningBatch(false);
    }
  };

  const selectedNode = selectedAutomation?.nodes.find(
    (n) => n.id === selectedNodeId
  );

  // Expose handleNewAutomation via ref
  useImperativeHandle(ref, () => ({
    handleNewAutomation,
  }));

  return (
    <div className="flex h-full bg-background">
      <AutomationList
        automations={automations}
        selectedId={selectedAutomationId}
        onSelect={setSelectedAutomationId}
        onNew={handleNewAutomation}
      />

      <div className="flex-1 flex flex-col bg-background">
        {/* Professional Top Bar */}
        {selectedAutomation ? (
          <div className="bg-gradient-to-r from-card via-card/95 to-background border-b border-border px-8 py-5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground mb-1">
                  {selectedAutomation.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedAutomation.nodes.length} {selectedAutomation.nodes.length === 1 ? 'step' : 'steps'} configured
                </p>
              </div>

              <button
                onClick={() => setShowExecutions(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-secondary border border-border text-foreground rounded-xl text-sm font-semibold hover:bg-accent hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group"
              >
                <List className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>View Executions</span>
                {selectedAutomation.executionCount > 0 && (
                  <span className="px-2.5 py-0.5 bg-primary text-primary-foreground rounded-full text-xs font-bold min-w-[20px] text-center">
                    {selectedAutomation.executionCount}
                  </span>
                )}
              </button>

              <div className="flex items-center gap-4 px-5 py-2.5 bg-secondary/50 rounded-xl border border-border/50">
                <span className={`text-sm font-semibold ${selectedAutomation.status === "enabled"
                  ? "text-green-600 dark:text-green-400"
                  : "text-muted-foreground"
                  }`}>
                  {selectedAutomation.status === "enabled" ? "Active" : "Inactive"}
                </span>
                <button
                  onClick={handleToggleStatus}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${selectedAutomation.status === "enabled"
                    ? "bg-primary"
                    : "bg-gray-400"
                    }`}
                  title={`${selectedAutomation.status === "enabled" ? "Disable" : "Enable"} automation`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-lg ${selectedAutomation.status === "enabled"
                      ? "translate-x-6"
                      : "translate-x-1"
                      }`}
                  />
                </button>
              </div>

              {selectedAutomation.status === "enabled" && selectedAutomation.nodes.some(n => n.service === "batch_call" || n.service === "aistein_mass_sending") && (
                <button
                  onClick={handleRunBatch}
                  disabled={runningBatch}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {runningBatch ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  <span>Run Batch Now</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-card via-card/95 to-background border-b border-border px-8 py-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Select an automation to edit
              </h3>
              <p className="text-sm text-muted-foreground">
                Choose an automation from the sidebar or create a new one
              </p>
            </div>
          </div>
        )}

        {/* Professional Canvas */}
        <div className="flex-1 overflow-y-auto p-12 bg-gradient-to-b from-background via-background to-background/95">
          {selectedAutomation ? (
            <div className="flex flex-col items-center gap-6 max-w-4xl mx-auto">
              {selectedAutomation.nodes.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 border-2 border-dashed border-border rounded-2xl flex items-center justify-center mx-auto mb-6 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all cursor-pointer group"
                    onClick={() => handleAddNode(0)}
                  >
                    <Plus className="w-10 h-10 group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No steps configured
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Click the button above to add your first automation step
                  </p>
                  <button
                    onClick={() => handleAddNode(0)}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-md hover:shadow-lg"
                  >
                    Add First Step
                  </button>
                </div>
              )}

              {selectedAutomation?.nodes.map((node, index) => (
                <div key={node.id} className="flex flex-col items-center">
                  <AutomationNode
                    node={node}
                    isSelected={node.id === selectedNodeId}
                    isIncomplete={
                      !node.config.event &&
                      !node.config.template &&
                      !node.config.subject &&
                      node.service !== "delay"
                    }
                    onClick={() => handleNodeClick(node.id)}
                    onDelete={() => handleDeleteNode(node.id)}
                  />

                  {index < selectedAutomation.nodes.length - 1 && (
                    <NodeConnector onAddNode={() => handleAddNode(index + 1)} />
                  )}
                </div>
              ))}

              {selectedAutomation.nodes.length > 0 && (
                <button
                  onClick={() => handleAddNode(selectedAutomation.nodes.length)}
                  className="w-16 h-16 border-2 border-dashed border-border rounded-2xl flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/10 transition-all cursor-pointer hover:scale-110 shadow-lg hover:shadow-xl group"
                >
                  <Plus className="w-8 h-8 group-hover:scale-110 transition-transform" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto mb-6 border border-primary/20">
                  <Zap className="w-12 h-12 text-primary/50" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Welcome to Automations
                </h3>
                <p className="text-muted-foreground mb-8 max-w-md">
                  Select an automation from the sidebar to start editing, or use one of the prebuilt templates above
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Executions Modal */}
        <ExecutionsModal
          isOpen={showExecutions}
          onClose={() => setShowExecutions(false)}
          automationId={selectedAutomationId}
          automationName={selectedAutomation?.name}
        />

        {/* Enhanced Bottom bar */}
        <div className="bg-gradient-to-r from-card via-card to-background border-t border-border px-6 py-4 flex items-center justify-end gap-3 shadow-lg">
          <button
            onClick={handleDeleteAutomation}
            disabled={deleting || !selectedAutomation}
            className="flex items-center gap-2 px-5 py-2.5 border-2 border-red-600 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-600/10 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>{deleting ? 'Deleting...' : 'Delete'}</span>
          </button>
          <button
            onClick={handleSaveAutomation}
            disabled={saving || !selectedAutomation || isAutomationIncomplete()}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-xl text-sm font-semibold hover:brightness-110 hover:shadow-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title={isAutomationIncomplete() ? "Please complete Google Sheets configuration (spreadsheet and column mapping required)" : ""}
          >
            <Check className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Node selector dropdown - Fixed UI with scrolling and back button */}
      {showNodeSelector && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Fixed Header with Back/Close Button */}
            <div className="p-4 border-b border-border shrink-0 bg-card/95 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setShowNodeSelector(false);
                    setInsertPosition(null);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors group"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  <span>Back</span>
                </button>
                <h3 className="text-lg font-semibold text-foreground">
                  Add Action
                </h3>
                <button
                  onClick={() => {
                    setShowNodeSelector(false);
                    setInsertPosition(null);
                  }}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {insertPosition === 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">
                      Triggers
                    </h4>
                    <div className="space-y-2">
                      {nodeServices.triggers.map((service) => (
                        <button
                          key={service.id}
                          onClick={() =>
                            handleSelectNodeType("trigger", service.id)
                          }
                          className="w-full flex items-center gap-3 px-3 py-2.5 bg-secondary border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left"
                        >
                          <span className="text-xl">{service.icon}</span>
                          <span className="text-sm font-medium text-foreground">
                            {service.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {insertPosition !== 0 && (
                  <>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">
                        Delay
                      </h4>
                      <button
                        onClick={handleAddDelay}
                        className="w-full flex items-center gap-3 px-3 py-2.5 bg-secondary border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left"
                      >
                        <span className="text-xl">⏱️</span>
                        <span className="text-sm font-medium text-foreground">
                          Delay
                        </span>
                      </button>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">
                        Actions
                      </h4>
                      <div className="space-y-2">
                        {nodeServices.actions.map((service) => (
                          <button
                            key={service.id}
                            onClick={() =>
                              handleSelectNodeType("action", service.id)
                            }
                            className="w-full flex items-center gap-3 px-3 py-2.5 bg-secondary border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left"
                          >
                            <span className="text-xl">{service.icon}</span>
                            <span className="text-sm font-medium text-foreground">
                              {service.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="p-4 border-t border-border shrink-0 bg-card/95 backdrop-blur-sm">
              <button
                onClick={() => {
                  setShowNodeSelector(false);
                  setInsertPosition(null);
                }}
                className="w-full px-4 py-2.5 bg-secondary border border-border text-foreground rounded-lg text-sm font-medium hover:bg-accent transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Config panel */}
      {selectedNode && (
        <NodeConfigPanel
          node={selectedNode}
          onClose={() => setSelectedNodeId(null)}
          onUpdate={handleUpdateNode}
          onDelete={() => handleDeleteNode(selectedNode.id)}
          allNodes={selectedAutomation?.nodes ?? []}
        />
      )}
    </div>
  );
});

