"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";
import { AutomationNode as NodeType } from "@/data/mockAutomations";
import { nodeServices } from "@/data/mockAutomations";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: MouseEvent | PointerEvent) => {
      const el = menuContainerRef.current;
      if (el && !el.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [menuOpen]);

  const getServiceInfo = () => {
    if (node.service === "delay") {
      return { name: "Delay", icon: "⏱️", color: "#6b7280" };
    }

    const allServices = [
      ...nodeServices.triggers,
      ...nodeServices.actions,
    ];
    
    // Special handling for inbound_chatbox_message since it's not in nodeServices.triggers yet
    if (node.service === "inbound_chatbox_message") {
      return { name: "Inbound Chatbox Message", icon: "💬", color: "#10b981" };
    }
    
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
    <>
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
          <div className="relative" ref={menuContainerRef}>
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="Step options"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((open) => !open);
              }}
              className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-lg border border-border bg-card py-1 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  role="menuitem"
                  className="w-full px-3 py-2 text-left text-sm text-destructive hover:bg-secondary transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    setConfirmOpen(true);
                  }}
                >
                  Delete step
                </button>
              </div>
            )}
          </div>
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

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={onDelete}
        title="Delete this step?"
        description="This removes the step from your automation. You can add a new step later if you change your mind."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
    </>
  );
}
