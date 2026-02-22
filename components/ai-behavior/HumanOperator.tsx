"use client";

import { useState, useEffect } from "react";
import { UserCircle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface EscalationRule {
  id: string;
  condition: string;
}

export function HumanOperator() {
  const [escalationRules, setEscalationRules] = useState<EscalationRule[]>([
    { id: "1", condition: "" }
  ]);

  const addEscalationRule = () => {
    setEscalationRules([
      ...escalationRules,
      { id: Date.now().toString(), condition: "" }
    ]);
  };

  const removeEscalationRule = (id: string) => {
    if (escalationRules.length > 1) {
      setEscalationRules(escalationRules.filter(rule => rule.id !== id));
    }
  };

  const updateEscalationRule = (id: string, condition: string) => {
    setEscalationRules(
      escalationRules.map(rule => 
        rule.id === id ? { ...rule, condition } : rule
      )
    );
  };

  // Load saved settings from backend
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        const response = await fetch('/api/v1/ai-behavior', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const result = await response.json();
          const chatOperator = result.data?.chatAgent?.humanOperator;

          if (chatOperator) {
            if (chatOperator.escalationRules?.length > 0) {
              setEscalationRules(
                chatOperator.escalationRules.map((rule: string, index: number) => ({
                  id: (index + 1).toString(),
                  condition: rule
                }))
              );
            }
          }
        }
      } catch (error) {
        console.error('Failed to load human operator settings:', error);
      }
    };

    loadSettings();
  }, []);

  return (
    <div className="space-y-6">
      {/* Escalation Rules */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
            <UserCircle className="w-5 h-5 text-orange-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Escalation Conditions
            </h3>
            <p className="text-sm text-muted-foreground">
              Define when the AI should escalate conversations to a human operator
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {escalationRules.map((rule, index) => (
            <div key={rule.id} className="flex gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={rule.condition}
                  onChange={(e) => updateEscalationRule(rule.id, e.target.value)}
                  placeholder={`E.g., Customer requests to speak with a manager, Complex technical issue, Refund request over €500...`}
                  className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              {escalationRules.length > 1 && (
                <button
                  onClick={() => removeEscalationRule(rule.id)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-border hover:border-red-500 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={addEscalationRule}
          className="mt-3 flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Another Condition
        </button>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border">
          <button 
            onClick={() => {
              setEscalationRules([{ id: "1", condition: "" }]);
            }}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Reset
          </button>
          <button 
            onClick={async () => {
              try {
                const response = await fetch('/api/v1/ai-behavior/chat-agent/human-operator', {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                  },
                  body: JSON.stringify({
                    escalationRules: escalationRules.map(r => r.condition).filter(c => c.trim())
                  })
                });
                
                if (response.ok) {
                  toast.success('Human operator settings saved to database!');
                } else {
                  toast.error('Failed to save settings');
                }
              } catch (error) {
                console.error('Error saving human operator settings:', error);
              }
            }}
            className="px-6 py-2 bg-primary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all cursor-pointer"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}

