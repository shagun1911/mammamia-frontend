"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { TriggerBlock } from "./TriggerBlock";
import { ActionBlock } from "./ActionBlock";

interface AutomationBuilderProps {
  onSave: (data: { name: string; trigger: string; action: string }) => void;
  onCancel: () => void;
}

export function AutomationBuilder({ onSave, onCancel }: AutomationBuilderProps) {
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("");
  const [action, setAction] = useState("");

  const handleSave = () => {
    if (name && trigger && action) {
      onSave({ name, trigger, action });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-10">
      {/* Name input */}
      {/* Name input */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-white mb-3">
          Automation Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter automation name"
          className="w-full max-w-md bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Flow builder */}
      <div className="flex items-center justify-center gap-8">
        <TriggerBlock selectedTrigger={trigger} onTriggerChange={setTrigger} />
        
        {/* Connector */}
        <div className="flex items-center justify-center">
          <ArrowRight className="w-8 h-8 text-muted-foreground" />
        </div>
        
        <ActionBlock selectedAction={action} onActionChange={setAction} />
      </div>

      {/* Bottom actions */}
      <div className="flex justify-center gap-3 mt-8">
        <button
          onClick={onCancel}
          className="px-8 py-3 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-accent transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!name || !trigger || !action}
          className="px-8 py-3 bg-primary text-white rounded-lg text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Automation
        </button>
      </div>
    </div>
  );
}

