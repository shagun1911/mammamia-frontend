"use client";

import { useState, useEffect } from "react";
import { UserCircle, Plus, Trash2, Clock, Phone } from "lucide-react";
import { toast } from "sonner";

interface EscalationRule {
  id: string;
  condition: string;
}

export function VoiceHumanOperator() {
  const [escalationRules, setEscalationRules] = useState<EscalationRule[]>([
    { id: "1", condition: "" }
  ]);
  const [operatorPhone, setOperatorPhone] = useState("");
  const [alwaysAvailable, setAlwaysAvailable] = useState(false);
  const [schedule, setSchedule] = useState({
    monday: { enabled: true, from: "09:00", to: "17:00" },
    tuesday: { enabled: true, from: "09:00", to: "17:00" },
    wednesday: { enabled: true, from: "09:00", to: "17:00" },
    thursday: { enabled: true, from: "09:00", to: "17:00" },
    friday: { enabled: true, from: "09:00", to: "17:00" },
    saturday: { enabled: false, from: "09:00", to: "17:00" },
    sunday: { enabled: false, from: "09:00", to: "17:00" },
  });

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

  const toggleDay = (day: keyof typeof schedule) => {
    setSchedule({
      ...schedule,
      [day]: { ...schedule[day], enabled: !schedule[day].enabled }
    });
  };

  const updateTime = (day: keyof typeof schedule, field: 'from' | 'to', value: string) => {
    setSchedule({
      ...schedule,
      [day]: { ...schedule[day], [field]: value }
    });
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
          const voiceOperator = result.data?.voiceAgent?.humanOperator;

          if (voiceOperator) {
            if (voiceOperator.phoneNumber) {
              setOperatorPhone(voiceOperator.phoneNumber);
            }

            if (voiceOperator.escalationRules?.length > 0) {
              setEscalationRules(
                voiceOperator.escalationRules.map((rule: string, index: number) => ({
                  id: (index + 1).toString(),
                  condition: rule
                }))
              );
            }

            if (voiceOperator.availability) {
              setAlwaysAvailable(voiceOperator.availability.alwaysAvailable || false);
              if (voiceOperator.availability.schedule) {
                setSchedule(voiceOperator.availability.schedule);
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to load voice human operator settings:', error);
      }
    };

    loadSettings();
  }, []);

  return (
    <div className="space-y-6">
      {/* Operator Phone Number */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5 text-green-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Human Operator Phone Number
            </h3>
            <p className="text-sm text-muted-foreground">
              Phone number to transfer calls when escalation is needed
            </p>
          </div>
        </div>

        <input
          type="tel"
          value={operatorPhone}
          onChange={(e) => setOperatorPhone(e.target.value)}
          placeholder="+1 (555) 123-4567"
          className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
        />
      </div>

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
              Define when the voice AI should transfer calls to a human operator
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
                  placeholder={`E.g., Caller is angry or frustrated, Request for billing support, Technical issue beyond AI's knowledge...`}
                  className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              {escalationRules.length > 1 && (
                <button
                  onClick={() => removeEscalationRule(rule.id)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-border hover:border-red-500 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={addEscalationRule}
          className="mt-3 flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Another Condition
        </button>
      </div>

      {/* Schedule Configuration */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Availability Schedule
            </h3>
            <p className="text-sm text-muted-foreground">
              Configure when human operators are available to receive transferred calls
            </p>
          </div>
        </div>

        {/* Always Available Toggle */}
        <div className="flex items-center justify-between p-4 bg-secondary rounded-lg mb-4">
          <div>
            <div className="font-medium text-foreground text-sm">Always Available (24/7)</div>
            <div className="text-xs text-muted-foreground mt-1">
              Operators can receive call transfers at any time
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={alwaysAvailable}
              onChange={(e) => setAlwaysAvailable(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-secondary-foreground/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        {/* Day Schedule */}
        {!alwaysAvailable && (
          <div className="space-y-3">
            {Object.entries(schedule).map(([day, config]) => (
              <div key={day} className="flex items-center gap-4">
                <label className="flex items-center gap-3 min-w-[140px]">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={() => toggleDay(day as keyof typeof schedule)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0"
                  />
                  <span className="text-sm font-medium text-foreground capitalize">
                    {day}
                  </span>
                </label>

                {config.enabled && (
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="time"
                      value={config.from}
                      onChange={(e) => updateTime(day as keyof typeof schedule, 'from', e.target.value)}
                      className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                    <span className="text-muted-foreground text-sm">to</span>
                    <input
                      type="time"
                      value={config.to}
                      onChange={(e) => updateTime(day as keyof typeof schedule, 'to', e.target.value)}
                      className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border">
          <button 
            onClick={() => {
              setOperatorPhone("");
              setEscalationRules([{ id: "1", condition: "" }]);
              setAlwaysAvailable(false);
              setSchedule({
                monday: { enabled: true, from: "09:00", to: "17:00" },
                tuesday: { enabled: true, from: "09:00", to: "17:00" },
                wednesday: { enabled: true, from: "09:00", to: "17:00" },
                thursday: { enabled: true, from: "09:00", to: "17:00" },
                friday: { enabled: true, from: "09:00", to: "17:00" },
                saturday: { enabled: false, from: "09:00", to: "17:00" },
                sunday: { enabled: false, from: "09:00", to: "17:00" },
              });
            }}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Reset
          </button>
          <button 
            onClick={async () => {
              try {
                const response = await fetch('/api/v1/ai-behavior/voice-agent/human-operator', {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                  },
                  body: JSON.stringify({
                    phoneNumber: operatorPhone,
                    escalationRules: escalationRules.map(r => r.condition).filter(c => c.trim()),
                    availability: {
                      alwaysAvailable,
                      schedule: Object.fromEntries(
                        Object.entries(schedule).map(([day, config]) => [day, config])
                      )
                    }
                  })
                });
                
                if (response.ok) {
                  toast.success('Voice human operator settings saved to database!');
                } else {
                  toast.error('Failed to save settings');
                }
              } catch (error) {
                console.error('Error saving voice human operator settings:', error);
              }
            }}
            className="px-6 py-2 bg-primary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}

