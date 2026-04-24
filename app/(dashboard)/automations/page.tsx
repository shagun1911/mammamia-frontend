"use client";

import { NodeBasedBuilder } from "@/components/automations/NodeBasedBuilder";
import { PrebuiltTemplatesModal } from "@/components/automations/PrebuiltTemplatesModal";
import { useState, useEffect, useRef } from "react";
import { apiClient } from "@/lib/api";
import { Automation } from "@/data/mockAutomations";
import { useSidebar } from "@/contexts/SidebarContext";
import { Zap, Activity, Plus, Sparkles } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";
import { LoadingLogo } from "@/components/LoadingLogo";
import { mergeAutomationsWithDraft, readAutomationsSession } from "@/lib/automationsSessionStorage";

export default function AutomationsPage() {
  const { getSidebarWidth } = useSidebar();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPrebuiltModal, setShowPrebuiltModal] = useState(false);
  const nodeBuilderRef = useRef<{ handleNewAutomation: () => void }>(null);
  // Set CSS variable for sidebar width so modal can use it
  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', `${getSidebarWidth()}px`);
  }, [getSidebarWidth]);

  useEffect(() => {
    loadAutomations();
  }, []);

  const loadAutomations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/automations');
      
      let automationsList: any[] = [];
      
      if (response.data?.success && response.data?.data) {
        automationsList = Array.isArray(response.data.data) ? response.data.data : [];
      } else if (Array.isArray(response.data)) {
        automationsList = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        automationsList = response.data.data;
      }
      
      if (automationsList.length > 0) {
        const transformedAutomations: Automation[] = automationsList.map((auto: any) => ({
          id: auto._id,
          name: auto.name,
          status: auto.isActive ? "enabled" : "disabled",
          nodes: auto.nodes || [],
          lastExecuted: auto.lastExecutedAt || null,
          executionCount: auto.executionCount || 0,
          createdAt: auto.createdAt,
        }));
        
        const session = readAutomationsSession();
        setAutomations(mergeAutomationsWithDraft(transformedAutomations, session));
      } else {
        setAutomations([]);
      }
    } catch (error: any) {
      console.error('Error loading automations:', error);
      setAutomations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = async (templateAutomation: Automation) => {
    // Reload automations to get the newly created one from backend
    await loadAutomations();
  };

  const handleNewAutomation = () => {
    // Trigger the new automation creation in NodeBasedBuilder
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
          onAutomationsChange={setAutomations} 
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
