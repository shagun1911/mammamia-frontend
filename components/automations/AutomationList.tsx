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
    <div className="w-[280px] bg-card border-r border-border h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">Automations</h2>
          <button
            onClick={() => {
              console.log('Add automation button clicked');
              onNew();
            }}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
            title="Create new automation"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full h-9 bg-secondary border border-border rounded-lg pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {automations.map((automation) => (
          <button
            key={automation.id}
            onClick={() => onSelect(automation.id)}
            className={`w-full px-4 py-3 border-b border-border text-left transition-colors ${
              selectedId === automation.id
                ? "bg-primary text-foreground"
                : "hover:bg-secondary"
            }`}
          >
            <div className={`font-medium text-sm mb-1 ${
              selectedId === automation.id ? "text-foreground" : "text-foreground"
            }`}>
              {automation.name}
            </div>
            <div className={`text-xs truncate ${
              selectedId === automation.id ? "text-indigo-100" : "text-muted-foreground"
            }`}>
              {getPreviewText(automation)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
