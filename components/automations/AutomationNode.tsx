import { MoreVertical } from "lucide-react";
import { AutomationNode as NodeType } from "@/data/mockAutomations";
import { nodeServices } from "@/data/mockAutomations";

interface AutomationNodeProps {
  node: NodeType;
  isSelected: boolean;
  isIncomplete: boolean;
  onClick: () => void;
  onDelete: () => void;
}

export function AutomationNode({
  node,
  isSelected,
  isIncomplete,
  onClick,
  onDelete,
}: AutomationNodeProps) {
  const getServiceInfo = () => {
    if (node.service === "delay") {
      return { name: "Delay", icon: "⏱️", color: "#6b7280" };
    }

    const allServices = [
      ...nodeServices.triggers,
      ...nodeServices.actions,
    ];
    return allServices.find((s) => s.id === node.service) || {
      name: node.service,
      icon: "⚙️",
      color: "#6366f1",
    };
  };

  const serviceInfo = getServiceInfo();

  const getStepText = () => {
    if (node.service === "delay") {
      if (node.config.delay && node.config.delayUnit) {
        return `Wait ${node.config.delay} ${node.config.delayUnit}`;
      }
      return `${node.position + 1}. Select delay`;
    }

    if (node.type === "trigger") {
      return node.config.event
        ? `Trigger: ${node.config.event}`
        : `${node.position + 1}. Select event`;
    }

    return node.config.template || node.config.subject
      ? "Configured"
      : `${node.position + 1}. Configure action`;
  };

  return (
    <div
      onClick={onClick}
      className={`w-[480px] bg-card rounded-xl p-5 cursor-pointer transition-all ${isSelected || isIncomplete
          ? "border-2 border-[#6366f1]"
          : "border border-border hover:border-[#404040]"
        }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{serviceInfo.icon}</span>
          <span className="text-base font-medium text-foreground">
            {serviceInfo.name}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{getStepText()}</p>
      {node.service.startsWith("aistein_google_") && (
        <div className="flex flex-col gap-1 pt-3 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-blue-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            Uses your connected Google account
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"></span>
            Runs as you
          </div>
        </div>
      )}
    </div>
  );
}

