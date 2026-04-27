"use client";

import { ShoppingBag, ShoppingCart, Webhook, UserX, FileText } from "lucide-react";

interface TriggerBlockProps {
  selectedTrigger: string;
  onTriggerChange: (trigger: string) => void;
}

const triggers = [
  { value: "shopify_order", label: "Shopify Order", icon: ShoppingBag },
  { value: "cart_abandoned", label: "Cart Abandoned", icon: ShoppingCart },
  { value: "webhook", label: "Webhook", icon: Webhook },
  { value: "user_inactive", label: "User Inactive", icon: UserX },
  { value: "form_submitted", label: "Form Submitted", icon: FileText },
];

export function TriggerBlock({ selectedTrigger, onTriggerChange }: TriggerBlockProps) {
  return (
    <div className="w-[360px] bg-card border-2 border-border rounded-2xl p-6">
      <label className="block text-xs uppercase text-muted-foreground font-semibold mb-3">
        Trigger
      </label>
      
      <select
        value={selectedTrigger}
        onChange={(e) => onTriggerChange(e.target.value)}
        className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-white focus:outline-none focus:border-primary transition-colors appearance-none"
      >
        <option value="">Select a trigger</option>
        {triggers.map((trigger) => (
          <option key={trigger.value} value={trigger.value}>
            {trigger.label}
          </option>
        ))}
      </select>

      {selectedTrigger && (
        <div className="mt-4 space-y-3">
          <input
            placeholder="Configuration parameter"
            className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      )}
    </div>
  );
}

