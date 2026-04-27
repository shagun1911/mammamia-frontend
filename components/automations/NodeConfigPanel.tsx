"use client";

import { X, Trash2, Loader2, FileSpreadsheet, CheckCircle2, AlertCircle, ArrowLeft, Check } from "lucide-react";
import { AutomationNode } from "@/data/mockAutomations";
import { nodeServices } from "@/data/mockAutomations";
import { useState, useEffect, useRef } from "react";
import { apiClient } from "@/lib/api";
import { toast } from "@/lib/toast";
import { useGoogleIntegrationsStatus } from "@/hooks/useGoogleIntegrationsStatus";
import { useSocialIntegrationsStatus } from "@/hooks/useSocialIntegrationsStatus";
import { useAgents } from "@/hooks/useAgents";
import { usePhoneNumbersList } from "@/hooks/usePhoneNumber";
import { automationService } from "@/services/automation.service";

interface NodeConfigPanelProps {
  node: AutomationNode;
  onClose: () => void;
  onUpdate: (config: AutomationNode["config"]) => void;
  onDelete: () => void;
  /** All nodes in the automation; used to suggest {{extracted.*}} from the extract node's JSON example */
  allNodes?: AutomationNode[];
}

export function NodeConfigPanel({
  node,
  onClose,
  onUpdate,
  onDelete,
  allNodes = [],
}: NodeConfigPanelProps) {
  const [lists, setLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [spreadsheets, setSpreadsheets] = useState<any[]>([]);
  const [loadingSpreadsheets, setLoadingSpreadsheets] = useState(false);
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState<string>(node.config.spreadsheetId || "");
  const [spreadsheetLink, setSpreadsheetLink] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);

  const { status: googleIntegrationStatus, isLoading: isLoadingGoogleStatus } = useGoogleIntegrationsStatus();
  const { integrations: socialIntegrations, isLoading: isLoadingSocialStatus } = useSocialIntegrationsStatus();
  const { data: agents = [], isLoading: isLoadingAgents } = useAgents();
  const { data: phoneNumbersList = [], isLoading: isLoadingPhoneNumbers } = usePhoneNumbersList();
  const outboundPhoneNumbers = (phoneNumbersList as { id: string; label?: string; phone_number?: string; supports_outbound?: boolean }[]).filter(
    (p) => p.supports_outbound === true
  );

  // WhatsApp template state
  const [whatsappTemplates, setWhatsappTemplates] = useState<any[]>([]);
  const [loadingWhatsappTemplates, setLoadingWhatsappTemplates] = useState(false);
  const [whatsappMode, setWhatsappMode] = useState<'automatic' | 'manual'>(
    (node.config.mode as 'automatic' | 'manual') || 'automatic'
  );
  const [showTemplateInfo, setShowTemplateInfo] = useState(false);
  const [selectedTemplateInfo, setSelectedTemplateInfo] = useState<any>(null);
  const [manualWhatsAppConfig, setManualWhatsAppConfig] = useState<{
    accessToken: string;
    phoneNumberId: string;
    wabaId: string;
  }>({
    accessToken: (node.config.accessToken as string) || '',
    phoneNumberId: (node.config.phoneNumberId as string) || '',
    wabaId: (node.config.wabaId as string) || ''
  });

  // JSON example raw text for extract node (so textarea does not revert while typing)
  const [jsonExampleRaw, setJsonExampleRaw] = useState<string>("");
  const jsonExampleKey = node.id + (node.service === "aistein_extract_data" || node.service === "aistein_extract_appointment" ? "_extract" : "");
  const [suggestingFromAgent, setSuggestingFromAgent] = useState(false);

  // Sync selectedSpreadsheetId with node.config.spreadsheetId when node changes
  // This ensures state persists when switching between nodes or reopening the panel
  useEffect(() => {
    const spreadsheetId = node.config.spreadsheetId || "";
    setSelectedSpreadsheetId(spreadsheetId);
    // Clear link input when node changes (will be populated if user pastes link)
    setSpreadsheetLink("");
  }, [node.id, node.config.spreadsheetId]);

  // Sync jsonExampleRaw from node.config when opening extract node
  useEffect(() => {
    if (node.service === "aistein_extract_data" || node.service === "aistein_extract_appointment") {
      const ex = node.config.json_example;
      if (typeof ex === "object" && ex !== null && !Array.isArray(ex)) {
        setJsonExampleRaw(JSON.stringify(ex, null, 2));
      } else if (typeof ex === "string") {
        setJsonExampleRaw(ex);
      } else {
        setJsonExampleRaw("");
      }
    }
  }, [jsonExampleKey, node.service, node.config.json_example]);

  useEffect(() => {
    // Fetch lists for contact moved trigger or batch call
    const fetchLists = async () => {
      if (node.service === "aistein_contact_moved" || node.service === "aistein_create_contact" || node.service === "batch_call" || node.service === "aistein_mass_sending") {
        setLoading(true);
        try {
          const response = await apiClient.get('/contacts/lists/all');
          const data = response?.data || response;
          if (data) {
            setLists(data);
          }
        } catch (err) {
          console.error('Error fetching lists:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchLists();

    // Fetch Google Sheets spreadsheets when configuring Google Sheets action
    if (node.service === "aistein_google_sheet_append_row") {
      loadSpreadsheets();
    }
  }, [node.service]);

  const loadSpreadsheets = async () => {
    try {
      setLoadingSpreadsheets(true);
      const response = await apiClient.get('/integrations/google/sheets/list');
      const data = response?.data || response;
      if (data?.spreadsheets) {
        // Backend already filters by mimeType and trashed=false, so we only need to validate id and name
        const validSpreadsheets = data.spreadsheets.filter((sheet: any) =>
          sheet &&
          sheet.id &&
          sheet.name
        );
        setSpreadsheets(validSpreadsheets);

        // Check if currently selected spreadsheet still exists
        if (selectedSpreadsheetId && !validSpreadsheets.find((s: any) => s.id === selectedSpreadsheetId)) {
          // Spreadsheet was deleted - show warning but don't auto-clear
          console.warn('Selected spreadsheet no longer exists:', selectedSpreadsheetId);
        }

        if (validSpreadsheets.length > 0) {
          toast.success(`Loaded ${validSpreadsheets.length} spreadsheet${validSpreadsheets.length > 1 ? 's' : ''}`);
        }
      } else {
        toast.info('No spreadsheets found. Create a Google Sheet to get started.');
      }
    } catch (error: any) {
      console.error('Error loading spreadsheets:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load spreadsheets';
      toast.error(`Failed to load spreadsheets: ${errorMessage}`);
    } finally {
      setLoadingSpreadsheets(false);
    }
  };

  const handleSpreadsheetSelect = (spreadsheetId: string) => {
    setSelectedSpreadsheetId(spreadsheetId);
    // Clear link input when selecting from dropdown
    setSpreadsheetLink("");
    // Ensure sheetName is set if not already present
    const sheetName = node.config.sheetName || "Sheet1";
    onUpdate({
      ...node.config,
      spreadsheetId,
      sheetName
    });
  };

  const fetchWhatsappTemplates = async (mode: 'automatic' | 'manual') => {
    try {
      setLoadingWhatsappTemplates(true);
      let response;

      if (mode === 'automatic') {
        response = await apiClient.get('/whatsapp/templates');
      } else {
        response = await apiClient.post('/whatsapp/templates', {
          accessToken: manualWhatsAppConfig.accessToken,
          wabaId: manualWhatsAppConfig.wabaId
        });
      }

      const data = (response as any)?.data || response;
      const templatesData = data?.data?.data || data?.data || [];

      // CRITICAL: Log template structure to debug language field
      if (templatesData.length > 0) {
        console.log('[WhatsApp Templates] Sample template structure:', templatesData[0]);
        console.log('[WhatsApp Templates] Total templates loaded:', templatesData.length);
      }

      setWhatsappTemplates(Array.isArray(templatesData) ? templatesData : []);

      if (templatesData.length > 0) {
        toast.success(`Loaded ${templatesData.length} WhatsApp template(s)`);
      }
    } catch (error: any) {
      console.error('Error fetching WhatsApp templates:', error);
      const message = error.response?.data?.error?.message || error.message || 'Failed to load WhatsApp templates';
      toast.error(message);
    } finally {
      setLoadingWhatsappTemplates(false);
    }
  };

  // Extract spreadsheetId from Google Sheets URL
  const extractSpreadsheetIdFromUrl = (url: string): string | null => {
    if (!url || typeof url !== 'string') return null;

    // Match pattern: /spreadsheets/d/[SPREADSHEET_ID]/
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  const handleSpreadsheetLinkChange = (link: string) => {
    setSpreadsheetLink(link);

    // Extract spreadsheetId from URL
    const extractedId = extractSpreadsheetIdFromUrl(link);

    if (extractedId) {
      setSelectedSpreadsheetId(extractedId);
      // Clear dropdown selection when using link
      const sheetName = node.config.sheetName || "Sheet1";
      onUpdate({
        ...node.config,
        spreadsheetId: extractedId,
        sheetName
      });
    } else if (link.trim() === "") {
      // Clear selection if link is empty
      setSelectedSpreadsheetId("");
      onUpdate({
        ...node.config,
        spreadsheetId: "",
        sheetName: node.config.sheetName || "Sheet1"
      });
    }
  };

  const addColumnMapping = () => {
    const currentValues = node.config.values || [];
    onUpdate({ ...node.config, values: [...currentValues, ""] });
  };

  const updateColumnMapping = (index: number, value: string) => {
    const currentValues = [...(node.config.values || [])];
    // Ensure array is large enough
    while (currentValues.length <= index) {
      currentValues.push("");
    }
    currentValues[index] = value;
    // Keep all values including empty ones while editing (filter only on save)
    onUpdate({ ...node.config, values: currentValues });
  };

  const removeColumnMapping = (index: number) => {
    const currentValues = [...(node.config.values || [])];
    currentValues.splice(index, 1);
    // Filter out empty values
    const filteredValues = currentValues.filter(v => v && v.trim() !== "");
    onUpdate({ ...node.config, values: filteredValues });
  };

  // Ensure Google Sheets config is properly formatted before save
  // CRITICAL: This function MUST use the current form state (selectedSpreadsheetId, spreadsheetLink, node.config.values)
  // to ensure all user inputs are captured, not just what's in node.config
  const ensureGoogleSheetsConfig = (): AutomationNode["config"] => {
    if (node.service === "aistein_google_sheet_append_row") {
      // Start with current node.config as base
      const config = { ...node.config };

      // CRITICAL FIX: Use selectedSpreadsheetId from form state (source of truth)
      // This ensures the dropdown selection or link extraction is captured even if node.config wasn't updated yet
      // Priority: extracted from link > selectedSpreadsheetId > existing config
      let formSpreadsheetId = "";

      // First, try to extract from link if present
      if (spreadsheetLink && spreadsheetLink.trim() !== "") {
        const extractedId = extractSpreadsheetIdFromUrl(spreadsheetLink);
        if (extractedId) {
          formSpreadsheetId = extractedId;
        }
      }

      // Fallback to selectedSpreadsheetId if no link or extraction failed
      if (!formSpreadsheetId && selectedSpreadsheetId && selectedSpreadsheetId.trim() !== "") {
        formSpreadsheetId = selectedSpreadsheetId;
      }

      // Final fallback to existing config
      if (!formSpreadsheetId) {
        formSpreadsheetId = config.spreadsheetId || "";
      }

      // Ensure spreadsheetId is set from form state
      if (formSpreadsheetId && formSpreadsheetId.trim() !== "") {
        config.spreadsheetId = formSpreadsheetId;
      }

      // Ensure sheetName is set (default to "Sheet1")
      const sheetNameStr = typeof config.sheetName === 'string' ? config.sheetName : String(config.sheetName || '');
      if (!sheetNameStr || sheetNameStr.trim() === "") {
        config.sheetName = "Sheet1";
      }

      // CRITICAL FIX: Use current values from node.config (which is updated by updateColumnMapping)
      // Filter out empty values but preserve the array structure
      let valuesArray: string[] = [];
      if (config.values && Array.isArray(config.values)) {
        // Filter empty values but keep the structure
        valuesArray = config.values.filter((v: string) => v && typeof v === 'string' && v.trim() !== "");
      }
      config.values = valuesArray;

      // DO NOT modify range - keep it exactly as it was in the original config
      // Range logic is handled elsewhere and should not be changed here

      // Return properly typed config with ALL required fields
      return {
        ...config,
        spreadsheetId: config.spreadsheetId as string,
        sheetName: config.sheetName as string,
        // DO NOT set range here - keep original range from config
        values: config.values as string[]
      };
    }
    return node.config;
  };

  // Validate Google Sheets config before save
  const validateGoogleSheetsConfig = (config: AutomationNode["config"]): { valid: boolean; error?: string } => {
    if (node.service === "aistein_google_sheet_append_row") {
      // Check if spreadsheetId is set (either from link or dropdown)
      const hasSpreadsheetId = config.spreadsheetId &&
        (typeof config.spreadsheetId === 'string' && config.spreadsheetId.trim() !== "");

      // Also check if link is being used (even if extraction hasn't happened yet)
      const hasValidLink = spreadsheetLink && extractSpreadsheetIdFromUrl(spreadsheetLink);

      if (!hasSpreadsheetId && !hasValidLink) {
        return { valid: false, error: "Please paste a Google Sheet link or select a spreadsheet from the list" };
      }
      if (!config.values || !Array.isArray(config.values) || config.values.length === 0) {
        return { valid: false, error: "At least one column mapping is required" };
      }
    }
    return { valid: true };
  };

  const getServiceInfo = () => {
    if (node.service === "delay") {
      return { name: "Delay", icon: "⏱️" };
    }

    const allServices = [
      ...nodeServices.triggers,
      ...nodeServices.actions,
    ];
    return allServices.find((s) => s.id === node.service) || {
      name: node.service,
      icon: "⚙️",
    };
  };

  const serviceInfo = getServiceInfo();

  return (
    <div ref={panelRef} className="w-[420px] bg-card border-l border-border h-full flex flex-col overflow-hidden">
      {/* Header - Sticky */}
      <div className="p-4 border-b border-border shrink-0 bg-card/95 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors group"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-secondary/50">
            <span className="text-xl">{serviceInfo.icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-foreground truncate">
              {serviceInfo.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Configure action settings</p>
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* DELAY NODE */}
          {node.service === "delay" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Delay Duration
                </label>
                <input
                  type="number"
                  value={node.config.delay || ""}
                  onChange={(e) =>
                    onUpdate({ ...node.config, delay: parseInt(e.target.value) })
                  }
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="5"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Unit
                </label>
                <select
                  value={node.config.delayUnit || "minutes"}
                  onChange={(e) =>
                    onUpdate({
                      ...node.config,
                      delayUnit: e.target.value as "seconds" | "minutes" | "hours" | "days",
                    })
                  }
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="seconds">Seconds</option>
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>

              <p className="text-xs text-muted-foreground">
                The automation will wait for the specified duration before
                proceeding to the next step.
              </p>
            </div>
          )}

          {/* CONDITION NODE - dynamic field from Extract node json_example */}
          {(node.type === "condition" && node.service === "condition") && (() => {
            const extractNodes = (allNodes || []).filter(
              (n) => n.service === "aistein_extract_data" || n.service === "aistein_extract_appointment"
            );
            const legacyFields: { value: string; label: string }[] = [
              { value: "appointment.booked", label: "appointment.booked (legacy)" },
            ];
            const extractedFields: { value: string; label: string }[] = [];
            extractNodes.forEach((extractNode) => {
              const ex = extractNode.config?.json_example;
              if (typeof ex === "object" && ex !== null && !Array.isArray(ex)) {
                Object.keys(ex).forEach((key) => {
                  const fieldValue = `extracted.${key}`;
                  if (!extractedFields.some((f) => f.value === fieldValue)) {
                    extractedFields.push({ value: fieldValue, label: fieldValue });
                  }
                });
              }
            });
            const allFieldOptions = [...legacyFields, ...extractedFields];
            const currentField = (node.config.field as string) || "";
            const hasExtractKeys = extractedFields.length > 0;
            return (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Field to check
                  </label>
                  <select
                    value={currentField}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (hasExtractKeys && v.startsWith("extracted.")) {
                        const key = v.replace("extracted.", "");
                        const sample = extractNodes.map((n) => (n.config?.json_example as Record<string, unknown>)?.[key]).find((val) => val !== undefined);
                        if (typeof sample === "boolean" && !node.config.operator) {
                          onUpdate({ ...node.config, field: v, operator: "equals", value: true });
                          return;
                        }
                      }
                      onUpdate({ ...node.config, field: v });
                    }}
                    className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="">Select field...</option>
                    {allFieldOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {hasExtractKeys
                      ? "Use a field from your Extract node (e.g. extracted.interested_in_loan) or the legacy appointment.booked."
                      : "Add an Extract node with a JSON example to see extracted.* options here."}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Operator
                  </label>
                  <select
                    value={(node.config.operator as string) || "equals"}
                    onChange={(e) =>
                      onUpdate({ ...node.config, operator: e.target.value })
                    }
                    className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="equals">equals</option>
                    <option value="not_equals">not equals</option>
                    <option value="contains">contains</option>
                    <option value="not_contains">not contains</option>
                    <option value="greater_than">greater than</option>
                    <option value="less_than">less than</option>
                    <option value="is_true">is true</option>
                    <option value="is_false">is false</option>
                    <option value="exists">exists</option>
                    <option value="not_exists">not exists</option>
                  </select>
                </div>
                {!["is_true", "is_false", "exists", "not_exists"].includes((node.config.operator as string) || "") && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Value
                    </label>
                    <input
                      type="text"
                      value={node.config.value !== undefined && node.config.value !== null ? String(node.config.value) : ""}
                      onChange={(e) => {
                        const raw = e.target.value;
                        let value: unknown = raw;
                        if (raw === "true") value = true;
                        else if (raw === "false") value = false;
                        else if (!isNaN(Number(raw)) && raw.trim() !== "") value = Number(raw);
                        onUpdate({ ...node.config, value });
                      }}
                      className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      placeholder="e.g. true, false, or text"
                    />
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  When this condition is true, the &quot;Yes&quot; branch runs; otherwise the &quot;No&quot; branch. Use extracted fields from your Extract node (e.g. interested_in_loan) so the flow triggers on the right outcome.
                </p>
              </div>
            );
          })()}

          {/* AISTEIN-IT - CONTACT CREATED TRIGGER */}
          {node.service === "aistein_contact_created" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This automation will trigger whenever a new contact is created in your system.
              </p>
              <div className="bg-secondary/50 border border-border rounded-lg p-4">
                <h4 className="text-sm font-medium text-foreground mb-2">Available Data:</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Contact ID</li>
                  <li>• Name</li>
                  <li>• Email</li>
                  <li>• Phone</li>
                  <li>• Tags</li>
                </ul>
              </div>
            </div>
          )}

          {/* AISTEIN-IT - CONTACT DELETED TRIGGER */}
          {node.service === "aistein_contact_deleted" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This automation will trigger whenever a contact is deleted from your system.
              </p>
              <div className="bg-secondary/50 border border-border rounded-lg p-4">
                <h4 className="text-sm font-medium text-foreground mb-2">Available Data:</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Contact ID</li>
                  <li>• Name</li>
                  <li>• Email</li>
                  <li>• Phone</li>
                </ul>
              </div>
            </div>
          )}

          {/* AISTEIN-IT - CONTACT MOVED TRIGGER */}
          {node.service === "aistein_contact_moved" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Target List (Optional)
                </label>
                <select
                  value={node.config.listId || ""}
                  onChange={(e) =>
                    onUpdate({ ...node.config, listId: e.target.value })
                  }
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  disabled={loading}
                >
                  <option value="">Any List</option>
                  {lists.map((list) => (
                    <option key={list._id} value={list._id}>
                      {list.name}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-muted-foreground">
                Select a specific list to trigger only when contacts are moved to that list, or leave empty to trigger for any list.
              </p>
            </div>
          )}

          {/* WEBHOOK TRIGGER */}
          {node.service === "webhook" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Webhook URL <span className="text-destructive">*</span>
                </label>
                <input
                  type="url"
                  value={node.config.webhookUrl || ""}
                  onChange={(e) =>
                    onUpdate({ ...node.config, webhookUrl: e.target.value })
                  }
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="https://your-webhook-url.com/webhook"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Enter the external webhook URL (e.g., n8n, Zapier, Make.com) where batch call data will be sent
                </p>
              </div>

              <div className="bg-secondary/50 border border-border rounded-lg p-4">
                <h4 className="text-sm font-medium text-foreground mb-2">Webhook Payload Structure:</h4>
                <pre className="text-xs text-muted-foreground overflow-x-auto">
                  {`{
  "event": "batch_call_completed",
  "timestamp": "2026-02-14T...",
  "organizationId": "...",
  "batch_id": "...",
  "contactId": "...",
  "freshContactData": {
    "name": "...",
    "email": "...",
    "phone": "..."
  },
  "conversation": {
    "conversation_id": "...",
    "agent_id": "...",
    "transcript": "...",
    "summary": "...",
    "status": "..."
  }
}`}
                </pre>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-xs text-blue-400">
                  ℹ️ This webhook will only trigger after batch calls complete. Make sure your webhook URL is publicly accessible and can handle POST requests.
                </p>
              </div>
            </div>
          )}

          {/* AISTEIN-IT - BATCH CALL TRIGGER */}
          {(node.service === "batch_call" || node.service === "aistein_mass_sending") && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Source Type
                </label>
                <select
                  value={node.config.source || ""}
                  onChange={(e) =>
                    onUpdate({ ...node.config, source: e.target.value })
                  }
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="">Any Source</option>
                  <option value="csv">CSV Import</option>
                  <option value="list">List Selection</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Agent *
                </label>
                <select
                  value={node.config.agent_id || ""}
                  onChange={(e) =>
                    onUpdate({ ...node.config, agent_id: e.target.value })
                  }
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  disabled={isLoadingAgents}
                >
                  <option value="">Select agent</option>
                  {(agents as { _id: string; name?: string; agent_id?: string }[]).map((agent) => (
                    <option key={agent._id} value={agent.agent_id || agent._id}>
                      {agent.name || agent.agent_id || agent._id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Phone Number *
                </label>
                <select
                  value={node.config.phone_number_id || ""}
                  onChange={(e) =>
                    onUpdate({ ...node.config, phone_number_id: e.target.value })
                  }
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  disabled={isLoadingPhoneNumbers}
                >
                  <option value="">Select phone number</option>
                  {outboundPhoneNumbers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label || p.phone_number || p.id}
                    </option>
                  ))}
                </select>
              </div>

              {node.config.source === "list" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Target List
                    </label>
                    <select
                      value={node.config.listId || ""}
                      onChange={(e) =>
                        onUpdate({ ...node.config, listId: e.target.value })
                      }
                      className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                      disabled={loading}
                    >
                      <option value="">Select a list...</option>
                      {lists.map((list) => (
                        <option key={list._id} value={list._id}>
                          {list.name}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>
              )}

              <p className="text-xs text-muted-foreground mt-2">
                This automation will trigger when bulk contacts are ready (CSV import) or specifically triggered for a list.
              </p>
            </div>
          )}

          {/* AISTEIN-IT - BATCH CALLING ACTION */}
          {node.service === "aistein_batch_calling" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Agent *
                </label>
                <select
                  value={node.config.agent_id || ""}
                  onChange={(e) =>
                    onUpdate({ ...node.config, agent_id: e.target.value })
                  }
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  disabled={isLoadingAgents}
                >
                  <option value="">Select agent</option>
                  {(agents as { _id: string; name?: string; agent_id?: string }[]).map((agent) => (
                    <option key={agent._id} value={agent.agent_id || agent._id}>
                      {agent.name || agent.agent_id || agent._id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Phone Number *
                </label>
                <select
                  value={node.config.phone_number_id || ""}
                  onChange={(e) =>
                    onUpdate({ ...node.config, phone_number_id: e.target.value })
                  }
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  disabled={isLoadingPhoneNumbers}
                >
                  <option value="">Select phone number</option>
                  {outboundPhoneNumbers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label || p.phone_number || p.id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Target List (Optional)
                </label>
                <select
                  value={node.config.listId || ""}
                  onChange={(e) =>
                    onUpdate({ ...node.config, listId: e.target.value })
                  }
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  disabled={loading}
                >
                  <option value="">Select a list...</option>
                  {lists.map((list) => (
                    <option key={list._id} value={list._id}>
                      {list.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  If provided, calls will be made to all contacts in this list. If not, it will use contacts from the previous node.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Call Batch Name
                </label>
                <input
                  type="text"
                  value={node.config.call_name || ""}
                  onChange={(e) =>
                    onUpdate({ ...node.config, call_name: e.target.value })
                  }
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="e.g. Follow-up Batch"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                This will initiate a batch of outbound calls. Ensure you have configured the agent and phone number correctly.
              </p>
            </div>
          )}

          {/* AISTEIN-IT - EXTRACT DATA / EXTRACT APPOINTMENT (dynamic extraction_prompt + json_example or legacy type) */}
          {(node.service === "aistein_extract_data" || node.service === "aistein_extract_appointment") && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Extraction source
                </label>
                <select
                  value={(node.config.extraction_source as string) || "custom"}
                  onChange={(e) => {
                    const v = e.target.value as "custom" | "from_agent";
                    onUpdate({
                      ...node.config,
                      extraction_source: v,
                      ...(v === "custom" ? { extraction_agent_id: undefined } : {}),
                    });
                  }}
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="custom">Custom (enter prompt + JSON manually)</option>
                  <option value="from_agent">From agent (auto-fill from agent&apos;s system prompt)</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose &quot;From agent&quot; and select the same agent used in the batch call (e.g. HR, loan, booking) to auto-generate extraction prompt and JSON from that agent&apos;s system prompt.
                </p>
              </div>

              {(node.config.extraction_source as string) === "from_agent" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Agent
                  </label>
                  <select
                    value={node.config.extraction_agent_id as string || ""}
                    disabled={suggestingFromAgent}
                    onChange={async (e) => {
                      const agentId = e.target.value;
                      onUpdate({ ...node.config, extraction_agent_id: agentId });
                      if (!agentId) return;
                      setSuggestingFromAgent(true);
                      try {
                        const result = await automationService.suggestExtractionSchema({ agent_id: agentId });
                        const prompt = result?.extraction_prompt ?? "";
                        const example = result?.json_example ?? {};
                        setJsonExampleRaw(JSON.stringify(example, null, 2));
                        onUpdate({
                          ...node.config,
                          extraction_agent_id: agentId,
                          extraction_prompt: prompt,
                          json_example: example,
                        });
                        toast.success("Extraction prompt and JSON filled from agent.");
                      } catch (err: unknown) {
                        toast.error(err instanceof Error ? err.message : "Failed to suggest schema from agent");
                      } finally {
                        setSuggestingFromAgent(false);
                      }
                    }}
                    className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-60"
                  >
                    <option value="">Select agent...</option>
                    {(agents as { _id: string; name?: string; agent_id?: string }[]).map((agent) => (
                      <option key={agent._id} value={agent._id}>
                        {agent.name || agent.agent_id || agent._id}
                      </option>
                    ))}
                  </select>
                  {suggestingFromAgent && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Generating prompt and JSON from agent...
                    </p>
                  )}
                  {!suggestingFromAgent && (node.config.extraction_agent_id as string) && (
                    <button
                      type="button"
                      disabled={suggestingFromAgent}
                      onClick={async () => {
                        const agentId = node.config.extraction_agent_id as string;
                        if (!agentId) return;
                        setSuggestingFromAgent(true);
                        try {
                          const result = await automationService.suggestExtractionSchema({ agent_id: agentId });
                          const prompt = result?.extraction_prompt ?? "";
                          const example = result?.json_example ?? {};
                          setJsonExampleRaw(JSON.stringify(example, null, 2));
                          onUpdate({
                            ...node.config,
                            extraction_agent_id: agentId,
                            extraction_prompt: prompt,
                            json_example: example,
                          });
                          toast.success("Extraction prompt and JSON regenerated from agent.");
                        } catch (err: unknown) {
                          toast.error(err instanceof Error ? err.message : "Failed to regenerate schema from agent");
                        } finally {
                          setSuggestingFromAgent(false);
                        }
                      }}
                      className="mt-2 w-full h-9 text-sm font-medium bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg transition-colors"
                    >
                      Regenerate prompt &amp; JSON from agent
                    </button>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Same agent used in batch/outbound call. Prompt and JSON below will be filled automatically from the agent&apos;s system prompt. Click &quot;Regenerate&quot; to re-fetch if values look outdated.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Extraction prompt
                </label>
                <textarea
                  value={typeof node.config.extraction_prompt === "string" ? node.config.extraction_prompt : ""}
                  onChange={(e) =>
                    onUpdate({ ...node.config, extraction_prompt: e.target.value })
                  }
                  className="w-full min-h-[80px] bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-y"
                  placeholder="e.g. Extract the data points the agent was instructed to collect (names, dates, choices, amounts, etc.). Filled automatically when you select an agent above."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Instruct the AI what to extract from the call. Filled automatically when you choose &quot;From agent&quot; and select an agent.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  JSON example (schema for extracted data)
                </label>
                <textarea
                  value={jsonExampleRaw}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setJsonExampleRaw(raw);
                    const trimmed = raw.trim();
                    if (!trimmed) {
                      onUpdate({ ...node.config, json_example: undefined });
                      return;
                    }
                    try {
                      const parsed = JSON.parse(trimmed);
                      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
                        onUpdate({ ...node.config, json_example: parsed });
                      }
                    } catch {
                      // Keep previous valid object until they type valid JSON
                    }
                  }}
                  className="w-full min-h-[120px] font-mono text-sm bg-secondary border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-y"
                  placeholder='{"interested_in_loan": true, "product": "Home insurance", "amount_eur": 250, "customer_name": "", "city": "", "country": ""}'
                />
                <p className="text-xs text-muted-foreground mt-1">
                  One JSON object. Keys become available as &#123;&#123;extracted.key&#125;&#125; in Sheets, Gmail, and conditions. Column mapping and nodes use this + CSV variables.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Conversation ID (Optional)
                </label>
                <input
                  type="text"
                  value={node.config.conversation_id || ""}
                  onChange={(e) =>
                    onUpdate({ ...node.config, conversation_id: e.target.value })
                  }
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="{{conversation_id}}"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  If empty, uses the conversation from the trigger.
                </p>
              </div>

              <p className="text-xs text-muted-foreground">
                After the call ends, extraction runs with this prompt and JSON. If the user gave the data (success), remaining nodes run; Sheets column mapping uses contact + extracted keys.
              </p>
            </div>
          )}

          {/* AISTEIN-IT - OUTBOUND CALL ACTION */}
          {node.service === "aistein_outbound_call" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Agent *
                </label>
                <select
                  value={node.config.agent_id || ""}
                  onChange={(e) =>
                    onUpdate({ ...node.config, agent_id: e.target.value })
                  }
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  disabled={isLoadingAgents}
                >
                  <option value="">Select agent</option>
                  {(agents as { _id: string; name?: string; agent_id?: string }[]).map((agent) => (
                    <option key={agent._id} value={agent.agent_id || agent._id}>
                      {agent.name || agent.agent_id || agent._id}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Required. Same as test call / batch call.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Phone Number *
                </label>
                <select
                  value={node.config.phone_number_id || ""}
                  onChange={(e) =>
                    onUpdate({ ...node.config, phone_number_id: e.target.value })
                  }
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  disabled={isLoadingPhoneNumbers}
                >
                  <option value="">Select phone number</option>
                  {outboundPhoneNumbers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label || p.phone_number || p.id}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Required. Use an outbound-capable number.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Dynamic Instruction
                </label>
                <textarea
                  value={node.config.dynamicInstruction || ""}
                  onChange={(e) =>
                    onUpdate({ ...node.config, dynamicInstruction: e.target.value })
                  }
                  className="w-full h-24 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                  placeholder="Provide instructions for the AI agent..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Language
                </label>
                <select
                  value={node.config.language || "en"}
                  onChange={(e) =>
                    onUpdate({ ...node.config, language: e.target.value })
                  }
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Transfer Number (Optional)
                </label>
                <input
                  type="tel"
                  value={node.config.transferTo || ""}
                  onChange={(e) =>
                    onUpdate({ ...node.config, transferTo: e.target.value })
                  }
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="+1234567890"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Make an automated outbound call to the contact using AI voice agent.
              </p>
            </div>
          )}

          {/* AISTEIN-IT - SEND SMS ACTION */}
          {node.service === "aistein_send_sms" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Message
                </label>
                <textarea
                  value={node.config.message || ""}
                  onChange={(e) =>
                    onUpdate({ ...node.config, message: e.target.value })
                  }
                  className="w-full h-32 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                  placeholder="Enter SMS message..."
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Send an SMS message to the contact. Use {"{{"} name {"}"} for personalization.
              </p>
            </div>
          )}

          {/* AISTEIN-IT - SEND EMAIL ACTION */}
          {node.service === "aistein_send_email" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">Email content</p>
                {(() => {
                  const extractNode = allNodes.find((n) => n.service === "aistein_extract_data" || n.service === "aistein_extract_appointment");
                  const ex = extractNode?.config?.json_example;
                  const keys = typeof ex === "object" && ex !== null && !Array.isArray(ex) ? Object.keys(ex) : [];
                  if (keys.length === 0) return null;
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        const to = keys.includes("email") ? "{{extracted.email}}" : "{{contact.email}}";
                        const subject = keys.includes("customer_name") ? "Follow-up: {{extracted.customer_name}}" : "Hello {{contact.name}}";
                        const bodyLines = ["Hi {{contact.name}},", "", "Based on our conversation:"];
                        keys.forEach((k) => bodyLines.push(`- ${k.replace(/_/g, " ")}: {{extracted.${k}}}`));
                        bodyLines.push("", "Best regards");
                        onUpdate({
                          ...node.config,
                          to,
                          subject,
                          body: bodyLines.join("\n"),
                          template: bodyLines.join("\n"),
                        });
                      }}
                      className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      Fill from Extract node
                    </button>
                  );
                })()}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  To Email (optional - uses contact email if not provided)
                </label>
                <input
                  type="text"
                  value={node.config.to || ""}
                  onChange={(e) =>
                    onUpdate({ ...node.config, to: e.target.value })
                  }
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="{{contact.email}}"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty to use contact's email, or use {'{'}{'{'}contact.email{'}'}{'}'} / {'{'}{'{'}extracted.email{'}'}{'}'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  value={node.config.subject || ""}
                  onChange={(e) =>
                    onUpdate({ ...node.config, subject: e.target.value })
                  }
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="Email subject..."
                />
                {!node.config.subject && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Subject is required
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Body *
                </label>
                <textarea
                  value={node.config.body || node.config.template || ""}
                  onChange={(e) =>
                    onUpdate({ ...node.config, body: e.target.value, template: e.target.value })
                  }
                  className="w-full h-32 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                  placeholder="Email body..."
                />
                {(!node.config.body && !node.config.template) && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Body is required
                  </p>
                )}
              </div>

              <div className="p-2 bg-secondary/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1 font-medium">Available Variables (click to insert into body):</p>
                <div className="flex flex-wrap gap-1.5">
                  {['{{contact.name}}', '{{contact.email}}', '{{contact.phone}}', '{{now}}'].map((varName) => (
                    <button
                      type="button"
                      key={varName}
                      onClick={() => onUpdate({ ...node.config, body: (node.config.body || node.config.template || "") + varName, template: (node.config.body || node.config.template || "") + varName })}
                      className="text-xs px-2 py-0.5 bg-background border border-border rounded text-foreground hover:bg-accent transition-colors"
                    >
                      {varName}
                    </button>
                  ))}
                  {(() => {
                    const extractNode = allNodes.find((n) => n.service === "aistein_extract_data" || n.service === "aistein_extract_appointment");
                    const ex = extractNode?.config?.json_example;
                    const keys = typeof ex === "object" && ex !== null && !Array.isArray(ex) ? Object.keys(ex) : [];
                    return keys.map((key) => {
                      const varName = `{{extracted.${key}}}`;
                      return (
                        <button
                          type="button"
                          key={varName}
                          onClick={() => onUpdate({ ...node.config, body: (node.config.body || node.config.template || "") + varName, template: (node.config.body || node.config.template || "") + varName })}
                          className="text-xs px-2 py-0.5 bg-background border border-border rounded text-foreground hover:bg-accent transition-colors"
                        >
                          {varName}
                        </button>
                      );
                    });
                  })()}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Use &#123;&#123;extracted.key&#125;&#125; for keys from your Extract node JSON (e.g. customer_name, loan_amount_eur).
                </p>
              </div>
            </div>
          )}

          {/* AISTEIN-IT - CREATE CONTACT ACTION */}
          {node.service === "aistein_create_contact" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={node.config.name || ""}
                  onChange={(e) =>
                    onUpdate({ ...node.config, name: e.target.value })
                  }
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="Contact name..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={node.config.email || ""}
                  onChange={(e) =>
                    onUpdate({ ...node.config, email: e.target.value })
                  }
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="contact@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={node.config.phone || ""}
                  onChange={(e) =>
                    onUpdate({ ...node.config, phone: e.target.value })
                  }
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="+1234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={node.config.tags?.join(', ') || ""}
                  onChange={(e) =>
                    onUpdate({
                      ...node.config,
                      tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                    })
                  }
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Create a new contact with the specified details.
              </p>
            </div>
          )}

          {/* AISTEIN-IT - API CALL ACTION */}
          {node.service === "aistein_api_call" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  URL
                </label>
                <input
                  type="url"
                  value={node.config.url || ""}
                  onChange={(e) =>
                    onUpdate({ ...node.config, url: e.target.value })
                  }
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="https://api.example.com/endpoint"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Method
                </label>
                <select
                  value={node.config.method || "GET"}
                  onChange={(e) =>
                    onUpdate({ ...node.config, method: e.target.value })
                  }
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Headers (JSON)
                </label>
                <textarea
                  value={typeof node.config.headers === 'string' ? node.config.headers : JSON.stringify(node.config.headers || {}, null, 2)}
                  onChange={(e) =>
                    onUpdate({ ...node.config, headers: e.target.value })
                  }
                  className="w-full h-24 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none font-mono"
                  placeholder='{"Authorization": "Bearer token"}'
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Body (JSON)
                </label>
                <textarea
                  value={node.config.body || ""}
                  onChange={(e) =>
                    onUpdate({ ...node.config, body: e.target.value })
                  }
                  className="w-full h-24 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none font-mono"
                  placeholder='{"key": "value"}'
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Make an HTTP request to an external API.
              </p>
            </div>
          )}

          {/* LEGACY TRIGGERS */}
          {(node.type === "trigger" &&
            !node.service.startsWith("aistein_") &&
            node.service !== "batch_call_completed" &&
            node.service !== "inbound_call_completed" &&
            node.service !== "conversation_created" &&
            node.service !== "batch_call" &&
            node.service !== "webhook") && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Event
                  </label>
                  <select
                    value={node.config.event || ""}
                    onChange={(e) =>
                      onUpdate({ ...node.config, event: e.target.value })
                    }
                    className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="">Select event...</option>
                    <option value="order_created">Order Created</option>
                    <option value="cart_abandoned">Cart Abandoned</option>
                    <option value="form_submitted">Form Submitted</option>
                  </select>
                </div>
                <p className="text-xs text-muted-foreground">
                  Choose which event will trigger this automation.
                </p>
              </div>
            )}

          {/* WHATSAPP TEMPLATE ACTION */}
          {node.service === "whatsapp_template" && (
            <div className="space-y-4">
              {/* Mode selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Mode
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setWhatsappMode('automatic');
                      onUpdate({ ...node.config, mode: 'automatic' });
                      fetchWhatsappTemplates('automatic');
                    }}
                    className={`flex-1 h-10 rounded-lg border text-sm flex items-center justify-center gap-2 transition-colors ${whatsappMode === 'automatic'
                        ? 'bg-primary text-white border-primary'
                        : 'bg-secondary border-border text-foreground'
                      }`}
                  >
                    <span>Automatic</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWhatsappMode('manual');
                      onUpdate({ ...node.config, mode: 'manual' });
                    }}
                    className={`flex-1 h-10 rounded-lg border text-sm flex items-center justify-center gap-2 transition-colors ${whatsappMode === 'manual'
                        ? 'bg-primary text-white border-primary'
                        : 'bg-secondary border-border text-foreground'
                      }`}
                  >
                    <span>Manual</span>
                  </button>
                </div>
              </div>

              {/* Automatic mode info */}
              {whatsappMode === 'automatic' && !isLoadingSocialStatus && (
                <>
                  {!socialIntegrations.whatsapp || socialIntegrations.whatsapp.status !== 'connected' ? (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-2">
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>
                          WhatsApp integration required. Connect WhatsApp in Settings &gt; Socials to use automatic templates.
                        </span>
                      </p>
                    </div>
                  ) : (
                    <div className="mt-1 p-2 bg-secondary/50 rounded-lg">
                      <p className="text-xs text-blue-400 mb-0.5 font-medium flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-blue-400"></span>
                        Uses your connected WhatsApp Business account
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Manual mode credentials */}
              {whatsappMode === 'manual' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Access Token
                    </label>
                    <input
                      type="password"
                      value={manualWhatsAppConfig.accessToken}
                      onChange={(e) => {
                        const value = e.target.value;
                        setManualWhatsAppConfig((prev) => ({ ...prev, accessToken: value }));
                        onUpdate({ ...node.config, accessToken: value });
                      }}
                      className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      placeholder="Meta access token"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Phone Number ID
                    </label>
                    <input
                      type="text"
                      value={manualWhatsAppConfig.phoneNumberId}
                      onChange={(e) => {
                        const value = e.target.value;
                        setManualWhatsAppConfig((prev) => ({ ...prev, phoneNumberId: value }));
                        onUpdate({ ...node.config, phoneNumberId: value });
                      }}
                      className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      placeholder="WhatsApp Phone Number ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      WABA ID
                    </label>
                    <input
                      type="text"
                      value={manualWhatsAppConfig.wabaId}
                      onChange={(e) => {
                        const value = e.target.value;
                        setManualWhatsAppConfig((prev) => ({ ...prev, wabaId: value }));
                        onUpdate({ ...node.config, wabaId: value });
                      }}
                      className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      placeholder="WhatsApp Business Account ID"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => fetchWhatsappTemplates('manual')}
                    disabled={
                      loadingWhatsappTemplates ||
                      !manualWhatsAppConfig.accessToken ||
                      !manualWhatsAppConfig.wabaId
                    }
                    className="w-full h-9 bg-secondary border border-border rounded-lg text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
                  >
                    {loadingWhatsappTemplates ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Load templates</span>
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="w-3 h-3" />
                        <span>Load templates</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Template
                </label>
                <select
                  value={node.config.templateName || node.config.template || ""}
                  onChange={(e) => {
                    const selectedTemplateName = e.target.value;

                    if (!selectedTemplateName) {
                      // Clear selection
                      onUpdate({
                        ...node.config,
                        templateName: '',
                        template: '',
                        languageCode: ''
                      });
                      return;
                    }

                    // Find the selected template to get its language
                    const selectedTemplate = whatsappTemplates.find((tpl: any) => tpl.name === selectedTemplateName);

                    if (!selectedTemplate) {
                      console.warn('[WhatsApp Template] Template not found in list:', selectedTemplateName);
                      toast.error('Template not found. Please refresh the template list.');
                      return;
                    }

                    // CRITICAL: Extract language code from template
                    // Meta API can return language as string OR object
                    let languageCode = '';
                    if (typeof selectedTemplate.language === 'string') {
                      languageCode = selectedTemplate.language;
                    } else if (selectedTemplate.language?.code) {
                      languageCode = selectedTemplate.language.code;
                    }

                    console.log('[WhatsApp Template] Selected template:', selectedTemplate);
                    console.log('[WhatsApp Template] Extracted language:', languageCode);

                    if (!languageCode) {
                      console.error('[WhatsApp Template] Template missing language property:', selectedTemplate);
                      toast.error(`Template "${selectedTemplateName}" is missing language information. Cannot proceed.`);
                      return;
                    }

                    console.log(`[WhatsApp Template] ✅ Selected: ${selectedTemplateName} (${languageCode})`);
                    toast.success(`Template selected: ${selectedTemplateName} (${languageCode})`);


                    onUpdate({
                      ...node.config,
                      templateName: selectedTemplateName,
                      template: selectedTemplateName,
                      languageCode: languageCode
                    });

                    // Show template info modal if enriched metadata is available
                    if (selectedTemplate.enrichedMetadata) {
                      setSelectedTemplateInfo({
                        ...selectedTemplate,
                        enrichedMetadata: selectedTemplate.enrichedMetadata
                      });
                      setShowTemplateInfo(true);
                    }
                  }}
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="">Select template...</option>
                  {whatsappTemplates.length > 0 ? (
                    whatsappTemplates.map((tpl: any) => {
                      // Extract language for display - handle both string and object
                      const langDisplay = typeof tpl.language === 'string'
                        ? tpl.language
                        : tpl.language?.code || '';
                      return (
                        <option key={tpl.id || tpl.name} value={tpl.name}>
                          {tpl.name} {langDisplay ? `(${langDisplay})` : ''}
                        </option>
                      );
                    })
                  ) : (
                    <>
                      <option value="hello_world">hello_world (en_US)</option>
                    </>
                  )}
                </select>
                {node.config.templateName && node.config.languageCode && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Language: <span className="font-medium">{node.config.languageCode}</span>
                  </p>
                )}
                {node.config.templateName && !node.config.languageCode && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Please re-select the template to capture the language
                  </p>
                )}
                {node.config.templateName && (() => {
                  const currentTemplate = whatsappTemplates.find((tpl: any) => tpl.name === node.config.templateName);
                  if (currentTemplate?.enrichedMetadata) {
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTemplateInfo(currentTemplate);
                          setShowTemplateInfo(true);
                        }}
                        className="text-xs text-primary hover:text-primary/80 mt-2 flex items-center gap-1"
                      >
                        <AlertCircle className="w-3 h-3" />
                        View template details ({currentTemplate.enrichedMetadata.totalParamCount} param{currentTemplate.enrichedMetadata.totalParamCount !== 1 ? 's' : ''})
                      </button>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Template Info Modal */}
              {showTemplateInfo && selectedTemplateInfo && selectedTemplateInfo.enrichedMetadata && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                  <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl mx-4">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
                      <div>
                        <h2 className="text-xl font-semibold text-foreground">
                          Template: {selectedTemplateInfo.name}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          Language: {typeof selectedTemplateInfo.language === 'string'
                            ? selectedTemplateInfo.language
                            : selectedTemplateInfo.language?.code || 'N/A'} •
                          Status: {selectedTemplateInfo.status || 'N/A'} •
                          Category: {selectedTemplateInfo.category || 'N/A'}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowTemplateInfo(false);
                          setSelectedTemplateInfo(null);
                        }}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="overflow-y-auto max-h-[calc(85vh-140px)] p-6 space-y-6">
                      {/* Parameter Counts */}
                      <div className="bg-secondary/50 rounded-lg p-4 border border-border">
                        <h3 className="text-sm font-semibold text-foreground mb-3">Parameter Requirements</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Total Parameters</p>
                            <p className="text-2xl font-bold text-foreground mt-1">
                              {selectedTemplateInfo.enrichedMetadata.totalParamCount || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Body Parameters</p>
                            <p className="text-2xl font-bold text-primary mt-1">
                              {selectedTemplateInfo.enrichedMetadata.bodyParamCount || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Header Parameters</p>
                            <p className="text-2xl font-bold text-primary mt-1">
                              {selectedTemplateInfo.enrichedMetadata.headerParamCount || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Button Parameters</p>
                            <p className="text-2xl font-bold text-primary mt-1">
                              {selectedTemplateInfo.enrichedMetadata.buttonParamCount || 0}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Header Preview */}
                      {selectedTemplateInfo.enrichedMetadata.headerPreview && (
                        <div>
                          <h3 className="text-sm font-semibold text-foreground mb-2">Header Preview</h3>
                          <div className="bg-secondary border border-border rounded-lg p-3 text-sm text-foreground whitespace-pre-wrap">
                            {selectedTemplateInfo.enrichedMetadata.headerPreview}
                          </div>
                          {selectedTemplateInfo.enrichedMetadata.headerParamCount > 0 && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              This template requires {selectedTemplateInfo.enrichedMetadata.headerParamCount} header parameter(s).
                              Use the advanced "Components (JSON)" field to provide header parameters.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Body Preview */}
                      {selectedTemplateInfo.enrichedMetadata.bodyPreview && (
                        <div>
                          <h3 className="text-sm font-semibold text-foreground mb-2">Body Preview</h3>
                          <div className="bg-secondary border border-border rounded-lg p-3 text-sm text-foreground whitespace-pre-wrap">
                            {selectedTemplateInfo.enrichedMetadata.bodyPreview}
                          </div>
                          {selectedTemplateInfo.enrichedMetadata.bodyParamCount > 0 && (
                            <p className="text-xs text-muted-foreground mt-2">
                              This template requires {selectedTemplateInfo.enrichedMetadata.bodyParamCount} body parameter(s).
                              Enter them in the "Template Parameters" fields below.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Info Message */}
                      {selectedTemplateInfo.enrichedMetadata.totalParamCount === 0 && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                          <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            This template requires no parameters. You can use it directly without filling parameter fields.
                          </p>
                        </div>
                      )}

                      {selectedTemplateInfo.enrichedMetadata.totalParamCount > 0 && (
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                          <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Make sure to provide exactly {selectedTemplateInfo.enrichedMetadata.totalParamCount} parameter(s)
                            when using this template, or the automation will fail.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-border p-4 flex justify-end">
                      <button
                        onClick={() => {
                          setShowTemplateInfo(false);
                          setSelectedTemplateInfo(null);
                        }}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                      >
                        Got it
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Template Parameters - Simple Input Fields */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Template Parameters
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  Enter the parameter values for your template. Each field corresponds to a parameter in your template (e.g., order number, customer name, etc.).
                </p>
                <div className="space-y-2">
                  {(() => {
                    // Get current parameters or default to 3 empty fields
                    const currentParams = node.config.templateParams || [];
                    const paramCount = Math.max(3, currentParams.length || 3);
                    const params = Array.from({ length: paramCount }, (_, i) =>
                      currentParams[i] || ''
                    );

                    return (
                      <>
                        {params.map((param, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-8 shrink-0">
                              #{index + 1}
                            </span>
                            <input
                              type="text"
                              value={param}
                              onChange={(e) => {
                                const newParams = [...params];
                                newParams[index] = e.target.value;
                                // Keep all params (including empty ones) to maintain field positions
                                // Backend will filter out empty params when generating components
                                onUpdate({
                                  ...node.config,
                                  templateParams: newParams
                                });
                              }}
                              className="flex-1 h-9 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                              placeholder={`Parameter ${index + 1} value`}
                            />
                            {index >= 3 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newParams = params.filter((_, i) => i !== index);
                                  onUpdate({
                                    ...node.config,
                                    templateParams: newParams
                                  });
                                }}
                                className="text-destructive hover:text-destructive/80 text-xs px-2"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            onUpdate({
                              ...node.config,
                              templateParams: [...params, '']
                            });
                          }}
                          className="text-xs text-primary hover:text-primary/80 mt-2"
                        >
                          + Add Parameter
                        </button>
                      </>
                    );
                  })()}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  These parameters will be automatically formatted and sent to WhatsApp. Leave empty if your template doesn't require parameters.
                </p>
              </div>

              {/* Advanced: Components JSON (for backward compatibility and advanced use cases) */}
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-foreground mb-2 list-none">
                  <div className="flex items-center gap-2">
                    <span>Advanced: Components JSON (optional)</span>
                    <span className="text-xs text-muted-foreground">(Click to expand)</span>
                  </div>
                </summary>
                <div className="mt-2">
                  <textarea
                    value={
                      typeof node.config.components === 'string'
                        ? node.config.components
                        : node.config.components
                          ? JSON.stringify(node.config.components, null, 2)
                          : ''
                    }
                    onChange={(e) =>
                      onUpdate({
                        ...node.config,
                        components: e.target.value
                      })
                    }
                    className="w-full h-28 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-mono resize-none"
                    placeholder='[{"type": "header", "parameters": [{"type": "text", "text": "Header value"}]}]'
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    For advanced use cases only. If you fill this, it will override the simple parameters above. Use this for header components or complex parameter structures.
                  </p>
                </div>
              </details>

              <p className="text-xs text-muted-foreground">
                Select the WhatsApp template message to send. Templates are loaded from your Meta account. Enter the required parameters above.
              </p>
            </div>
          )}

          {/* SEND EMAIL ACTION */}
          {node.service === "send_email" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={node.config.subject || ""}
                  onChange={(e) =>
                    onUpdate({ ...node.config, subject: e.target.value })
                  }
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="Email subject..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Template
                </label>
                <select
                  value={node.config.template || ""}
                  onChange={(e) =>
                    onUpdate({ ...node.config, template: e.target.value })
                  }
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="">Select template...</option>
                  <option value="welcome_email">Welcome Email</option>
                  <option value="cart_reminder_email">Cart Reminder</option>
                  <option value="order_confirmation_email">
                    Order Confirmation
                  </option>
                </select>
              </div>
            </div>
          )}

          {/* GOOGLE CALENDAR - CHECK AVAILABILITY */}
          {node.service === "aistein_google_calendar_check_availability" && (
            <div className="space-y-4">
              {!isLoadingGoogleStatus && (!googleIntegrationStatus || !googleIntegrationStatus.services?.calendar) && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Google Calendar integration required. Connect your Google account in Settings &gt; Integrations &gt; Google.</span>
                  </p>
                </div>
              )}
              {!isLoadingGoogleStatus && googleIntegrationStatus && googleIntegrationStatus.services?.calendar && (
                <div className="mt-2 p-2 bg-secondary/50 rounded-lg">
                  <p className="text-xs text-blue-400 mb-0.5 font-medium flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-blue-400"></span>
                    Uses your connected Google account
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
                    Runs as you
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Start Time (ISO 8601)
                </label>
                <input
                  type="text"
                  value={node.config.timeMin || ""}
                  onChange={(e) => onUpdate({ ...node.config, timeMin: e.target.value })}
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="2024-01-20T10:00:00Z"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  End Time (ISO 8601)
                </label>
                <input
                  type="text"
                  value={node.config.timeMax || ""}
                  onChange={(e) => onUpdate({ ...node.config, timeMax: e.target.value })}
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="2024-01-20T18:00:00Z"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Calendar IDs (comma-separated, optional)
                </label>
                <input
                  type="text"
                  value={node.config.calendarIds?.join(",") || ""}
                  onChange={(e) => onUpdate({ ...node.config, calendarIds: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="primary"
                />
              </div>
            </div>
          )}

          {/* GOOGLE CALENDAR - CREATE EVENT */}
          {node.service === "aistein_google_calendar_create_event" && (
            <div className="space-y-4">
              {!isLoadingGoogleStatus && (!googleIntegrationStatus || !googleIntegrationStatus.services?.calendar) && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Google Calendar integration required. Connect your Google account in Settings &gt; Integrations &gt; Google.</span>
                  </p>
                </div>
              )}
              {!isLoadingGoogleStatus && googleIntegrationStatus && googleIntegrationStatus.services?.calendar && (
                <div className="mt-2 p-2 bg-secondary/50 rounded-lg">
                  <p className="text-xs text-blue-400 mb-0.5 font-medium flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-blue-400"></span>
                    Uses your connected Google account
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
                    Runs as you
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={node.config.summary || ""}
                  onChange={(e) => onUpdate({ ...node.config, summary: e.target.value })}
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="Meeting with {{contact.name}}"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  value={node.config.description || ""}
                  onChange={(e) => onUpdate({ ...node.config, description: e.target.value })}
                  className="w-full h-20 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                  placeholder="Event description..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Start DateTime (ISO 8601) *
                </label>
                <input
                  type="text"
                  value={node.config.startDateTime || ""}
                  onChange={(e) => onUpdate({ ...node.config, startDateTime: e.target.value })}
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="2024-01-20T10:00:00Z"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  End DateTime (ISO 8601) *
                </label>
                <input
                  type="text"
                  value={node.config.endDateTime || ""}
                  onChange={(e) => onUpdate({ ...node.config, endDateTime: e.target.value })}
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="2024-01-20T11:00:00Z"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Time Zone
                </label>
                <input
                  type="text"
                  value={node.config.timeZone || "UTC"}
                  onChange={(e) => onUpdate({ ...node.config, timeZone: e.target.value })}
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="UTC"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={node.config.location || ""}
                  onChange={(e) => onUpdate({ ...node.config, location: e.target.value })}
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="Conference Room A"
                />
              </div>
            </div>
          )}

          {/* GOOGLE SHEETS - APPEND ROW */}
          {(node.service === "aistein_google_sheet_append_row" || node.service === "aistein_user_google_sheet_append_row") && (
            <div className="space-y-4">
              {!isLoadingGoogleStatus && (!googleIntegrationStatus || !googleIntegrationStatus.services?.sheets) && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Google Sheets integration required. Connect your Google account in Settings &gt; Integrations &gt; Google.</span>
                  </p>
                </div>
              )}
              {!isLoadingGoogleStatus && googleIntegrationStatus && googleIntegrationStatus.services?.sheets && (
                <div className="mt-2 p-2 bg-secondary/50 rounded-lg">
                  <p className="text-xs text-blue-400 mb-0.5 font-medium flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-blue-400"></span>
                    Uses your connected Google account
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
                    Runs as you
                  </p>
                </div>
              )}

              {/* Spreadsheet Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Select Spreadsheet *
                </label>

                {/* Option 1: Paste Google Sheet Link */}
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">
                    Option 1: Paste Google Sheet Link
                  </label>
                  <input
                    type="text"
                    value={spreadsheetLink}
                    onChange={(e) => handleSpreadsheetLinkChange(e.target.value)}
                    className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                  />
                  {spreadsheetLink && !extractSpreadsheetIdFromUrl(spreadsheetLink) && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Invalid Google Sheets URL format
                    </p>
                  )}
                  {spreadsheetLink && extractSpreadsheetIdFromUrl(spreadsheetLink) && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Spreadsheet ID extracted successfully
                    </p>
                  )}
                </div>

                {/* Option 2: Select from List */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs text-muted-foreground">
                      Option 2: Select from My Spreadsheets
                    </label>
                    <button
                      type="button"
                      onClick={loadSpreadsheets}
                      disabled={loadingSpreadsheets}
                      className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                      {loadingSpreadsheets ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Loading...</span>
                        </>
                      ) : (
                        <>
                          <FileSpreadsheet className="w-3 h-3" />
                          <span>{spreadsheets.length > 0 ? 'Refresh list' : 'Load my spreadsheets'}</span>
                        </>
                      )}
                    </button>
                  </div>
                  {loadingSpreadsheets ? (
                    <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Loading spreadsheets...</span>
                    </div>
                  ) : spreadsheets.length > 0 ? (
                    <select
                      value={selectedSpreadsheetId && !spreadsheetLink ? selectedSpreadsheetId : ""}
                      onChange={(e) => handleSpreadsheetSelect(e.target.value)}
                      className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                    >
                      <option value="">Select a spreadsheet...</option>
                      {spreadsheets.map((sheet: any) => (
                        <option key={sheet.id} value={sheet.id}>
                          {sheet.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 bg-secondary/50 rounded-lg border border-border">
                      <p className="text-xs text-muted-foreground text-center">
                        {googleIntegrationStatus?.connected
                          ? 'Click "Load my spreadsheets" to see your Google Sheets'
                          : 'Connect Google Workspace to load your spreadsheets'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Validation Messages */}
                {!selectedSpreadsheetId && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Please paste a Google Sheet link or select a spreadsheet from the list
                  </p>
                )}
                {selectedSpreadsheetId && spreadsheets.length > 0 && !spreadsheets.find((s: any) => s.id === selectedSpreadsheetId) && !spreadsheetLink && (
                  <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-xs text-yellow-700 dark:text-yellow-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>Spreadsheet may not be accessible. Please verify the link or select from the list.</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Sheet Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Sheet Name (optional)
                </label>
                <input
                  type="text"
                  value={node.config.sheetName || "Sheet1"}
                  onChange={(e) => onUpdate({ ...node.config, sheetName: e.target.value })}
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="Sheet1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Name of the sheet/tab within the spreadsheet (default: Sheet1)
                </p>
              </div>

              {/* Column Mapping */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground">
                    Column Mapping *
                  </label>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const extractNode = allNodes.find((n) => n.service === "aistein_extract_data" || n.service === "aistein_extract_appointment");
                      const ex = extractNode?.config?.json_example;
                      const keys = typeof ex === "object" && ex !== null && !Array.isArray(ex) ? Object.keys(ex) : [];
                      if (keys.length === 0) return null;
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            const base = ["{{contact.name}}", "{{contact.email}}", "{{contact.phone}}"];
                            const extracted = keys.map((k) => `{{extracted.${k}}}`);
                            const values = [...base, ...extracted, "{{now}}"];
                            onUpdate({ ...node.config, values });
                          }}
                          className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                        >
                          Fill from Extract node
                        </button>
                      );
                    })()}
                    <button
                      type="button"
                      onClick={addColumnMapping}
                      className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      + Add Column
                    </button>
                  </div>
                </div>

                {(!node.config.values || node.config.values.length === 0) && (
                  <div className="p-3 bg-secondary/50 border border-border rounded-lg mb-2">
                    <p className="text-xs text-muted-foreground text-center">
                      No columns mapped. Click "Add Column" to start mapping.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  {(node.config.values || []).map((value: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => updateColumnMapping(index, e.target.value)}
                        className="flex-1 h-9 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                        placeholder={`Column ${index + 1} (e.g., {{contact.name}})`}
                      />
                      <button
                        type="button"
                        onClick={() => removeColumnMapping(index)}
                        className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Remove column"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {(!node.config.values || node.config.values.length === 0) && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    At least one column mapping is required
                  </p>
                )}

                <div className="mt-3 p-2 bg-secondary/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1 font-medium">Available Variables:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['{{contact.name}}', '{{contact.email}}', '{{contact.phone}}', '{{appointment.date}}', '{{appointment.time}}', '{{now}}'].map((varName) => (
                      <button
                        type="button"
                        key={varName}
                        onClick={() => {
                          const currentValues = node.config.values || [];
                          updateColumnMapping(currentValues.length, varName);
                        }}
                        className="text-xs px-2 py-0.5 bg-background border border-border rounded text-foreground hover:bg-accent transition-colors"
                      >
                        {varName}
                      </button>
                    ))}
                    {(() => {
                      const extractNode = allNodes.find((n) => n.service === "aistein_extract_data" || n.service === "aistein_extract_appointment");
                      const ex = extractNode?.config?.json_example;
                      const keys = typeof ex === "object" && ex !== null && !Array.isArray(ex) ? Object.keys(ex) : [];
                      return keys.map((key) => {
                        const varName = `{{extracted.${key}}}`;
                        return (
                          <button
                            type="button"
                            key={varName}
                            onClick={() => {
                              const currentValues = node.config.values || [];
                              updateColumnMapping(currentValues.length, varName);
                            }}
                            className="text-xs px-2 py-0.5 bg-background border border-border rounded text-foreground hover:bg-accent transition-colors"
                          >
                            {varName}
                          </button>
                        );
                      });
                    })()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    💡 Contact/appointment from CSV and trigger; use &#123;&#123;extracted.key&#125;&#125; for keys from your Extract node JSON.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* GOOGLE GMAIL - SEND EMAIL */}
          {node.service === "aistein_google_gmail_send" && (
            <div className="space-y-4">
              {!isLoadingSocialStatus && (!socialIntegrations || !socialIntegrations.gmail || socialIntegrations.gmail.status !== 'connected') && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Google Social integration required. Connect Gmail in Settings &gt; Socials.</span>
                  </p>
                </div>
              )}
              {!isLoadingSocialStatus && socialIntegrations && socialIntegrations.gmail && socialIntegrations.gmail.status === 'connected' && (
                <div className="mt-2 p-2 bg-secondary/50 rounded-lg">
                  <p className="text-xs text-blue-400 mb-0.5 font-medium flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-blue-400"></span>
                    Uses your connected Gmail account ({socialIntegrations.gmail.credentials?.email || 'Social'})
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
                    Runs as you
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">Email content</p>
                {(() => {
                  const extractNode = allNodes.find((n) => n.service === "aistein_extract_data" || n.service === "aistein_extract_appointment");
                  const ex = extractNode?.config?.json_example;
                  const keys = typeof ex === "object" && ex !== null && !Array.isArray(ex) ? Object.keys(ex) : [];
                  if (keys.length === 0) return null;
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        const to = keys.includes("email") ? "{{extracted.email}}" : "{{contact.email}}";
                        const subject = keys.includes("customer_name") ? "Follow-up: {{extracted.customer_name}}" : "Hello {{contact.name}}";
                        const bodyLines = ["Hi {{contact.name}},", "", "Based on our conversation:"];
                        keys.forEach((k) => bodyLines.push(`- ${k.replace(/_/g, " ")}: {{extracted.${k}}}`));
                        bodyLines.push("", "Best regards");
                        onUpdate({ ...node.config, to, subject, body: bodyLines.join("\n") });
                      }}
                      className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      Fill from Extract node
                    </button>
                  );
                })()}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  To Email (optional - uses contact email if not provided)
                </label>
                <input
                  type="text"
                  value={node.config.to || ""}
                  onChange={(e) => onUpdate({ ...node.config, to: e.target.value })}
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="{{contact.email}}"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty to use contact's email, or use {'{'}{'{'}contact.email{'}'}{'}'} / {'{'}{'{'}extracted.email{'}'}{'}'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  value={node.config.subject || ""}
                  onChange={(e) => onUpdate({ ...node.config, subject: e.target.value })}
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="Hello {{contact.name}}"
                />
                {!node.config.subject && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Subject is required
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Body *
                </label>
                <textarea
                  value={node.config.body || ""}
                  onChange={(e) => onUpdate({ ...node.config, body: e.target.value })}
                  className="w-full h-32 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                  placeholder="Email body content..."
                />
                {!node.config.body && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Body is required
                  </p>
                )}
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <input
                    type="checkbox"
                    checked={node.config.isHtml || false}
                    onChange={(e) => onUpdate({ ...node.config, isHtml: e.target.checked })}
                    className="w-4 h-4 rounded border-border"
                  />
                  HTML Email
                </label>
              </div>
              <div className="p-2 bg-secondary/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1 font-medium">Available Variables (click to insert into body):</p>
                <div className="flex flex-wrap gap-1.5">
                  {['{{contact.name}}', '{{contact.email}}', '{{contact.phone}}', '{{appointment.date}}', '{{appointment.time}}', '{{now}}'].map((varName) => (
                    <button
                      type="button"
                      key={varName}
                      onClick={() => onUpdate({ ...node.config, body: (node.config.body || "") + varName })}
                      className="text-xs px-2 py-0.5 bg-background border border-border rounded text-foreground hover:bg-accent transition-colors"
                    >
                      {varName}
                    </button>
                  ))}
                  {(() => {
                    const extractNode = allNodes.find((n) => n.service === "aistein_extract_data" || n.service === "aistein_extract_appointment");
                    const ex = extractNode?.config?.json_example;
                    const keys = typeof ex === "object" && ex !== null && !Array.isArray(ex) ? Object.keys(ex) : [];
                    return keys.map((key) => {
                      const varName = `{{extracted.${key}}}`;
                      return (
                        <button
                          type="button"
                          key={varName}
                          onClick={() => onUpdate({ ...node.config, body: (node.config.body || "") + varName })}
                          className="text-xs px-2 py-0.5 bg-background border border-border rounded text-foreground hover:bg-accent transition-colors"
                        >
                          {varName}
                        </button>
                      );
                    });
                  })()}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Use &#123;&#123;extracted.key&#125;&#125; for keys from your Extract node JSON. Click a variable to insert into body.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer - Sticky with proper spacing */}
      <div className="p-4 border-t border-border shrink-0 bg-card/95 backdrop-blur-sm space-y-2.5">
        <button
          type="button"
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (saving) return;

            try {
              setSaving(true);

              // Save scroll position to prevent UI jump
              if (panelRef.current) {
                scrollPositionRef.current = panelRef.current.scrollTop;
              }

              // Ensure Google Sheets config is properly formatted before saving
              if (node.service === "aistein_google_sheet_append_row") {
                // CRITICAL: Build final config from current form state
                const finalConfig = ensureGoogleSheetsConfig();

                // Validate config before saving
                const validation = validateGoogleSheetsConfig(finalConfig);
                if (!validation.valid) {
                  toast.error(validation.error || "Configuration is incomplete");
                  setSaving(false);
                  return;
                }

                // CRITICAL FIX: Ensure all required fields are explicitly set
                // This guarantees the config is written to the automation graph
                const configToSave: AutomationNode["config"] = {
                  ...finalConfig,
                  spreadsheetId: finalConfig.spreadsheetId as string,
                  sheetName: finalConfig.sheetName as string || "Sheet1",
                  // DO NOT modify range - keep original range from finalConfig
                  // Range is handled by backend/defaults and should not be overridden here
                  values: Array.isArray(finalConfig.values) ? finalConfig.values : []
                };

                // Log for debugging
                console.log('[NodeConfigPanel] Saving Google Sheets config:', {
                  spreadsheetId: configToSave.spreadsheetId,
                  sheetName: configToSave.sheetName,
                  valuesLength: configToSave.values?.length || 0,
                  values: configToSave.values
                });

                // CRITICAL: Update node config - this writes to automation graph state
                onUpdate(configToSave);

                // Show success toast
                toast.success("Action saved successfully");

                // Small delay to ensure state updates before closing
                setTimeout(() => {
                  // Restore scroll position
                  if (panelRef.current) {
                    panelRef.current.scrollTop = scrollPositionRef.current;
                  }
                  onClose();
                }, 100);
              } else {
                // For non-Google Sheets nodes, update and close
                onUpdate(node.config);
                toast.success("Action saved successfully");
                setTimeout(() => {
                  onClose();
                }, 100);
              }
            } catch (error: any) {
              console.error('Save error:', error);
              const errorMessage = error?.message || "Failed to save configuration";
              toast.error(errorMessage);
            } finally {
              setSaving(false);
            }
          }}
          disabled={saving}
          className="w-full h-11 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="w-full h-10 border border-red-500/50 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/10 hover:border-red-500 transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Action</span>
        </button>
      </div>
    </div >
  );
}
