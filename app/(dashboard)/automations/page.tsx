"use client";

import { NodeBasedBuilder } from "@/components/automations/NodeBasedBuilder";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { Automation } from "@/data/mockAutomations";
import { useSidebar } from "@/contexts/SidebarContext";
import { Zap, Activity, Sparkles } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";

export default function AutomationsPage() {
  const { getSidebarWidth } = useSidebar();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAutomations();
  }, []);

  const loadAutomations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/automations');
      
      console.log('Full response:', JSON.stringify(response, null, 2));
      console.log('Response data:', response.data);
      console.log('Response data.data:', response.data?.data);
      
      // Handle both response formats - the backend uses successResponse which wraps in data
      let automationsList: any[] = [];
      
      if (response.data?.success && response.data?.data) {
        // Standard format: { success: true, data: [...] }
        automationsList = Array.isArray(response.data.data) ? response.data.data : [];
      } else if (Array.isArray(response.data)) {
        // Direct array format
        automationsList = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        // Nested data format
        automationsList = response.data.data;
      }
      
      console.log('Automations list:', automationsList);
      
      if (automationsList.length > 0) {
        // Transform backend data to frontend format
        const transformedAutomations: Automation[] = automationsList.map((auto: any) => ({
          id: auto._id,
          name: auto.name,
          status: auto.isActive ? "enabled" : "disabled",
          nodes: auto.nodes || [],
          lastExecuted: auto.lastExecutedAt || null,
          executionCount: auto.executionCount || 0,
          createdAt: auto.createdAt,
        }));
        
        console.log('Transformed automations:', transformedAutomations);
        setAutomations(transformedAutomations);
      } else {
        console.log('No automations found, starting with empty array');
        setAutomations([]);
      }
    } catch (error: any) {
      console.error('Error loading automations:', error);
      console.error('Error details:', error.response?.data);
      // Start with empty array if error
      setAutomations([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col transition-all duration-300" style={{ left: `${getSidebarWidth()}px` }}>
        {/* Full Navbar Header */}
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
              <p className="text-sm text-muted-foreground mt-0.5">Create and manage workflow automations</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground font-medium">Loading automations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col transition-all duration-300" style={{ left: `${getSidebarWidth()}px` }}>
      {/* Full Navbar Header */}
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
            <p className="text-sm text-muted-foreground mt-0.5">Create and manage workflow automations</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <NodeBasedBuilder automations={automations} onAutomationsChange={setAutomations} />
      </div>
    </div>
  );
}
