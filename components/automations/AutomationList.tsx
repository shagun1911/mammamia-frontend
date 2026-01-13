import { Search, Plus } from "lucide-react";
import { Automation } from "@/data/mockAutomations";

interface AutomationListProps {
  automations: Automation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export function AutomationList({
  automations,
  selectedId,
  onSelect,
  onNew,
}: AutomationListProps) {
  const getPreviewText = (automation: Automation) => {
    const nodeNames = automation.nodes.map((node) => {
      if (node.service === "delay") return "Delay";
      return node.service
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    });
    return nodeNames.join(" → ");
  };

  return (
    <div className="w-[300px] bg-card border-r border-border h-full flex flex-col shadow-lg">
      <div className="p-5 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm">
              <Plus className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Automations</h2>
          </div>
          <button
            onClick={() => {
              console.log('Add automation button clicked');
              onNew();
            }}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all cursor-pointer hover:scale-110 active:scale-95"
            title="Create new automation"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search automations..."
            className="w-full h-10 bg-background/80 border border-border rounded-xl pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {automations.map((automation) => (
          <button
            key={automation.id}
            onClick={() => onSelect(automation.id)}
            className={`w-full px-5 py-4 border-b border-border text-left transition-all cursor-pointer ${
              selectedId === automation.id
                ? "bg-gradient-to-r from-primary via-primary/95 to-primary/90 text-primary-foreground shadow-sm border-l-4 border-l-primary-foreground/40"
                : "hover:bg-accent/50 hover:shadow-sm"
            }`}
          >
            <div className={`font-semibold text-sm mb-1.5 ${
              selectedId === automation.id ? "text-primary-foreground" : "text-foreground"
            }`}>
              {automation.name}
            </div>
            <div className={`text-xs truncate ${
              selectedId === automation.id ? "text-primary-foreground/80" : "text-muted-foreground"
            }`}>
              {getPreviewText(automation) || "No nodes configured"}
            </div>
          </button>
        ))}
        {automations.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Plus className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No automations yet</p>
            <p className="text-xs text-muted-foreground">Create your first automation to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
