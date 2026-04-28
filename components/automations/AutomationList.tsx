import { Search, Plus, Zap } from "lucide-react";
import { Automation, nodeServices } from "@/data/mockAutomations";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

interface AutomationListProps {
  automations: Automation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}

function automationServiceLabel(serviceId: string) {
  if (serviceId === "delay") return "Delay";
  const all = [...nodeServices.triggers, ...nodeServices.actions];
  const found = all.find((s) => s.id === serviceId);
  if (found) return found.name;
  return serviceId
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function automationPreviewText(automation: Automation) {
  return automation.nodes.map((node) => automationServiceLabel(node.service)).join(" → ");
}

export function AutomationList({
  automations,
  selectedId,
  onSelect,
  onNew,
}: AutomationListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAutomations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return automations;
    return automations.filter((a) => {
      const preview = automationPreviewText(a);
      return (
        a.name.toLowerCase().includes(q) ||
        preview.toLowerCase().includes(q)
      );
    });
  }, [automations, searchQuery]);

  return (
    <div className="w-[360px] bg-card border-r border-border h-full flex flex-col shadow-xl">
      {/* Header - Simplified */}
      <div className="p-6 border-b border-border bg-gradient-to-br from-card to-card/50 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search automations..."
              className="w-full h-11 bg-background/80 border border-border rounded-xl pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
              aria-label="Search automations"
            />
          </div>
          <button
            type="button"
            onClick={onNew}
            className="shrink-0 h-11 px-3 rounded-xl border border-border bg-background/80 text-sm font-medium text-foreground hover:bg-accent hover:border-primary/30 transition-colors flex items-center gap-1.5"
            title="New automation"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New</span>
          </button>
        </div>
      </div>

      {/* Automation List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredAutomations.map((automation) => {
          const isSelected = selectedId === automation.id;
          const isEnabled = automation.status === "enabled";
          
          return (
            <button
              key={automation.id}
              onClick={() => onSelect(automation.id)}
              className={cn(
                "w-full text-left p-4 rounded-xl border transition-all duration-200 group",
                isSelected
                  ? "bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-primary/50 shadow-lg shadow-primary/10"
                  : "bg-card border-border hover:border-primary/30 hover:bg-accent/50 hover:shadow-md"
              )}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className={cn(
                    "font-semibold text-sm mb-1 truncate",
                    isSelected ? "text-primary" : "text-foreground"
                  )}>
                    {automation.name}
                  </h3>
                  <p className={cn(
                    "text-xs truncate",
                    isSelected ? "text-primary/70" : "text-muted-foreground"
                  )}>
                    {automationPreviewText(automation) || "No nodes configured"}
                  </p>
                </div>
                <div className={cn(
                  "flex-shrink-0 w-2 h-2 rounded-full",
                  isEnabled ? "bg-green-500" : "bg-gray-400"
                )} />
              </div>
              
              {/* Status and Stats */}
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/50">
                <span className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full",
                  isEnabled
                    ? "bg-green-500/10 text-green-600 dark:text-green-400"
                    : "bg-gray-500/10 text-gray-600 dark:text-gray-400"
                )}>
                  {isEnabled ? "Active" : "Inactive"}
                </span>
                {automation.executionCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {automation.executionCount} {automation.executionCount === 1 ? 'run' : 'runs'}
                  </span>
                )}
              </div>
            </button>
          );
        })}

        {automations.length > 0 && filteredAutomations.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8 px-2">
            No automations match &quot;{searchQuery.trim()}&quot;
          </p>
        )}
        
        {automations.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center py-12">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-4 border border-primary/20">
              <Zap className="w-10 h-10 text-primary/50" />
            </div>
            <p className="text-base font-semibold text-foreground mb-2">No automations yet</p>
            <p className="text-sm text-muted-foreground mb-6">
              Create your first automation or use a prebuilt template above
            </p>
            <button
              onClick={onNew}
              className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-all shadow-md hover:shadow-lg"
            >
              Create Automation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
