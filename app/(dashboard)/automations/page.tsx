"use client";

import { NodeBasedBuilder } from "@/components/automations/NodeBasedBuilder";
import type { AutomationBuilderSelection } from "@/components/automations/NodeBasedBuilder";
import { PrebuiltTemplatesModal } from "@/components/automations/PrebuiltTemplatesModal";
import { useState, useEffect, useRef, useCallback } from "react";
import { apiClient } from "@/lib/api";
import { Automation } from "@/data/mockAutomations";
import {
  readAutomationsSession,
  writeAutomationsSession,
  mergeAutomationsWithDraft,
} from "@/lib/automationsSessionStorage";
import { useSidebar } from "@/contexts/SidebarContext";
import { Zap, Activity, Plus, Sparkles } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";
import { LoadingLogo } from "@/components/LoadingLogo";

export default function AutomationsPage() {
  const { getSidebarWidth } = useSidebar();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPrebuiltModal, setShowPrebuiltModal] = useState(false);
  const [draftDirty, setDraftDirty] = useState(false);
  const [defaultSelection, setDefaultSelection] = useState<AutomationBuilderSelection | null>(null);
  const [sessionDataRevision, setSessionDataRevision] = useState(0);
  const nodeBuilderRef = useRef<{ handleNewAutomation: () => void }>(null);

  const automationsRef = useRef<Automation[]>([]);
  const draftDirtyRef = useRef(false);
  const selectionRef = useRef<AutomationBuilderSelection>({
    selectedAutomationId: null,
    selectedNodeId: null,
  });
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    automationsRef.current = automations;
  }, [automations]);
  useEffect(() => {
    draftDirtyRef.current = draftDirty;
  }, [draftDirty]);

  const persistToSession = useCallback(() => {
    writeAutomationsSession({
      version: 1,
      automations: automationsRef.current,
      selectedAutomationId: selectionRef.current.selectedAutomationId,
      selectedNodeId: selectionRef.current.selectedNodeId,
      dirty: draftDirtyRef.current,
      updatedAt: Date.now(),
    });
  }, []);

  const schedulePersist = useCallback(() => {
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      persistToSession();
    }, 280);
  }, [persistToSession]);

  const handleAutomationsChange = useCallback(
    (next: Automation[]) => {
      setAutomations(next);
      setDraftDirty(true);
      automationsRef.current = next;
      draftDirtyRef.current = true;
      schedulePersist();
    },
    [schedulePersist]
  );

  const handleSelectionChange = useCallback(
    (sel: AutomationBuilderSelection) => {
      selectionRef.current = sel;
      schedulePersist();
    },
    [schedulePersist]
  );

  const handleSaved = useCallback(() => {
    setDraftDirty(false);
    draftDirtyRef.current = false;
    schedulePersist();
  }, [schedulePersist]);

  // Set CSS variable for sidebar width so modal can use it
  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-width", `${getSidebarWidth()}px`);
  }, [getSidebarWidth]);

  const loadAutomations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/automations");

      let automationsList: any[] = [];

      if (response.data?.success && response.data?.data) {
        automationsList = Array.isArray(response.data.data) ? response.data.data : [];
      } else if (Array.isArray(response.data)) {
        automationsList = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        automationsList = response.data.data;
      }

      let transformedAutomations: Automation[] = [];
      if (automationsList.length > 0) {
        transformedAutomations = automationsList.map((auto: any) => ({
          id: auto._id,
          name: auto.name,
          status: auto.isActive ? "enabled" : "disabled",
          nodes: auto.nodes || [],
          lastExecuted: auto.lastExecutedAt || null,
          executionCount: auto.executionCount || 0,
          createdAt: auto.createdAt,
        }));
      }

      const persisted = readAutomationsSession();
      let merged = transformedAutomations;
      let nextDirty = false;

      if (persisted?.dirty && persisted.automations) {
        merged = mergeAutomationsWithDraft(transformedAutomations, persisted.automations);
        nextDirty = true;
      }

      setAutomations(merged);
      automationsRef.current = merged;
      setDraftDirty(nextDirty);
      draftDirtyRef.current = nextDirty;

      if (persisted) {
        selectionRef.current = {
          selectedAutomationId: persisted.selectedAutomationId,
          selectedNodeId: persisted.selectedNodeId,
        };
        setDefaultSelection({
          selectedAutomationId: persisted.selectedAutomationId,
          selectedNodeId: persisted.selectedNodeId,
        });
      } else {
        setDefaultSelection(null);
      }

      persistToSession();
      setSessionDataRevision((r) => r + 1);
    } catch (error: any) {
      console.error("Error loading automations:", error);
      setAutomations([]);
      automationsRef.current = [];
      setDraftDirty(false);
      draftDirtyRef.current = false;
      setDefaultSelection(null);
    } finally {
      setLoading(false);
    }
  }, [persistToSession]);

  useEffect(() => {
    loadAutomations();
  }, [loadAutomations]);

  const handleUseTemplate = async (_templateAutomation: Automation) => {
    await loadAutomations();
  };

  const handleNewAutomation = () => {
    if (nodeBuilderRef.current?.handleNewAutomation) {
      nodeBuilderRef.current.handleNewAutomation();
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col transition-all duration-300" style={{ left: `${getSidebarWidth()}px` }}>
        <div className="h-20 px-8 flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/5 via-primary/3 to-transparent backdrop-blur-sm shadow-sm flex-shrink-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                Automations
                <Activity className="w-5 h-5 text-primary" />
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">Create, manage, and launch workflow automations</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <LoadingLogo size="md" text="Loading automations..." />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col transition-all duration-300" style={{ left: `${getSidebarWidth()}px` }}>
      {/* Premium Page Header */}
      <div className="h-20 px-8 flex items-center justify-between border-b border-border/60 bg-gradient-to-br from-background via-background to-primary/[0.02] backdrop-blur-xl shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset] flex-shrink-0 z-10">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center shadow-[0_8px_24px_rgba(99,102,241,0.25)] ring-1 ring-primary/20">
              <Zap className="w-7 h-7 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
              Automations
              <Activity className="w-5 h-5 text-primary/80" />
            </h1>
            <p className="text-sm text-muted-foreground/80 mt-1 font-medium">Create, manage, and launch workflow automations</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPrebuiltModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-card/80 backdrop-blur-sm border border-border/50 text-foreground rounded-xl text-sm font-bold hover:bg-accent/50 hover:shadow-md hover:border-primary/20 transition-all duration-200"
          >
            <Sparkles className="w-4 h-4" />
            <span>Prebuilt Templates</span>
          </button>
          <button
            onClick={handleNewAutomation}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl text-sm font-bold hover:from-primary/90 hover:to-primary/80 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Automation</span>
          </button>
          <LanguageSwitcher />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>

      {/* Main Content Area - Full Space for Automation Builder */}
      <div className="flex-1 overflow-hidden bg-background">
        <NodeBasedBuilder
          ref={nodeBuilderRef}
          automations={automations}
          onAutomationsChange={handleAutomationsChange}
          onSelectionChange={handleSelectionChange}
          onSaved={handleSaved}
          defaultSelection={defaultSelection}
          selectionRevision={sessionDataRevision}
        />
      </div>

      {/* Prebuilt Templates Modal */}
      <PrebuiltTemplatesModal
        isOpen={showPrebuiltModal}
        onClose={() => setShowPrebuiltModal(false)}
        onUseTemplate={handleUseTemplate}
      />
    </div>
  );
}
