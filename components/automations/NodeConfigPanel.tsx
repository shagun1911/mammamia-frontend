"use client";

import { X, Trash2 } from "lucide-react";
import { AutomationNode } from "@/data/mockAutomations";
import { nodeServices } from "@/data/mockAutomations";
import { useState, useEffect } from "react";

interface NodeConfigPanelProps {
  node: AutomationNode;
  onClose: () => void;
  onUpdate: (config: AutomationNode["config"]) => void;
  onDelete: () => void;
}

export function NodeConfigPanel({
  node,
  onClose,
  onUpdate,
  onDelete,
}: NodeConfigPanelProps) {
  const [lists, setLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch lists for contact moved trigger
    if (node.service === "keplero_contact_moved" || node.service === "keplero_create_contact") {
      setLoading(true);
      fetch('/api/contacts/lists')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setLists(data.data);
          }
        })
        .catch(err => console.error('Error fetching lists:', err))
        .finally(() => setLoading(false));
    }
  }, [node.service]);

  const getServiceInfo = () => {
    if (node.service === "delay") {
      return { name: "Delay", icon: "⏱️" };
    }

    const allServices = [
      ...nodeServices.triggers,
      ...nodeServices.actions,
    ];
    return allServices.find((s) => s.id === node.service) || {
      name: node.service,
      icon: "⚙️",
    };
  };

  const serviceInfo = getServiceInfo();

  return (
    <div className="w-[400px] bg-card border-l border-border h-full flex flex-col overflow-hidden">
      <div className="p-6 border-b border-border shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{serviceInfo.icon}</span>
            <h3 className="text-lg font-semibold text-foreground">
              {serviceInfo.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {/* DELAY NODE */}
        {node.service === "delay" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Delay Duration
              </label>
              <input
                type="number"
                value={node.config.delay || ""}
                onChange={(e) =>
                  onUpdate({ ...node.config, delay: parseInt(e.target.value) })
                }
                className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                placeholder="5"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Unit
              </label>
              <select
                value={node.config.delayUnit || "minutes"}
                onChange={(e) =>
                  onUpdate({
                    ...node.config,
                    delayUnit: e.target.value as "minutes" | "hours" | "days",
                  })
                }
                className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>

            <p className="text-xs text-muted-foreground">
              The automation will wait for the specified duration before
              proceeding to the next step.
            </p>
          </div>
        )}

        {/* KEPLERO AI - CONTACT CREATED TRIGGER */}
        {node.service === "keplero_contact_created" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This automation will trigger whenever a new contact is created in your system.
            </p>
            <div className="bg-secondary/50 border border-border rounded-lg p-4">
              <h4 className="text-sm font-medium text-foreground mb-2">Available Data:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Contact ID</li>
                <li>• Name</li>
                <li>• Email</li>
                <li>• Phone</li>
                <li>• Tags</li>
              </ul>
            </div>
          </div>
        )}

        {/* KEPLERO AI - CONTACT DELETED TRIGGER */}
        {node.service === "keplero_contact_deleted" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This automation will trigger whenever a contact is deleted from your system.
            </p>
            <div className="bg-secondary/50 border border-border rounded-lg p-4">
              <h4 className="text-sm font-medium text-foreground mb-2">Available Data:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Contact ID</li>
                <li>• Name</li>
                <li>• Email</li>
                <li>• Phone</li>
              </ul>
            </div>
          </div>
        )}

        {/* KEPLERO AI - CONTACT MOVED TRIGGER */}
        {node.service === "keplero_contact_moved" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Target List (Optional)
              </label>
              <select
                value={node.config.listId || ""}
                onChange={(e) =>
                  onUpdate({ ...node.config, listId: e.target.value })
                }
                className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                disabled={loading}
              >
                <option value="">Any List</option>
                {lists.map((list) => (
                  <option key={list._id} value={list._id}>
                    {list.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-muted-foreground">
              Select a specific list to trigger only when contacts are moved to that list, or leave empty to trigger for any list.
            </p>
          </div>
        )}

        {/* KEPLERO AI - MASS SENDING TRIGGER */}
        {node.service === "keplero_mass_sending" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Source Type
              </label>
              <select
                value={node.config.source || ""}
                onChange={(e) =>
                  onUpdate({ ...node.config, source: e.target.value })
                }
                className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">Any Source</option>
                <option value="csv">CSV Import</option>
                <option value="list">List Selection</option>
              </select>
            </div>
            <p className="text-xs text-muted-foreground">
              This automation will trigger when a mass sending campaign is initiated.
            </p>
          </div>
        )}

        {/* KEPLERO AI - OUTBOUND CALL ACTION */}
        {node.service === "keplero_outbound_call" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Dynamic Instruction
              </label>
              <textarea
                value={node.config.dynamicInstruction || ""}
                onChange={(e) =>
                  onUpdate({ ...node.config, dynamicInstruction: e.target.value })
                }
                className="w-full h-24 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                placeholder="Provide instructions for the AI agent..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Language
              </label>
              <select
                value={node.config.language || "en"}
                onChange={(e) =>
                  onUpdate({ ...node.config, language: e.target.value })
                }
                className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Transfer Number (Optional)
              </label>
              <input
                type="tel"
                value={node.config.transferTo || ""}
                onChange={(e) =>
                  onUpdate({ ...node.config, transferTo: e.target.value })
                }
                className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                placeholder="+1234567890"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Make an automated outbound call to the contact using AI voice agent.
            </p>
          </div>
        )}

        {/* KEPLERO AI - SEND SMS ACTION */}
        {node.service === "keplero_send_sms" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Message
              </label>
              <textarea
                value={node.config.message || ""}
                onChange={(e) =>
                  onUpdate({ ...node.config, message: e.target.value })
                }
                className="w-full h-32 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                placeholder="Enter SMS message..."
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Send an SMS message to the contact. Use {"{{"} name {"}"} for personalization.
            </p>
          </div>
        )}

        {/* KEPLERO AI - SEND EMAIL ACTION */}
        {node.service === "keplero_send_email" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Subject
              </label>
              <input
                type="text"
                value={node.config.subject || ""}
                onChange={(e) =>
                  onUpdate({ ...node.config, subject: e.target.value })
                }
                className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                placeholder="Email subject..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Body
              </label>
              <textarea
                value={node.config.body || ""}
                onChange={(e) =>
                  onUpdate({ ...node.config, body: e.target.value })
                }
                className="w-full h-32 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                placeholder="Email body..."
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Send an email to the contact. Use {"{{"} name {"}"} for personalization.
            </p>
          </div>
        )}

        {/* KEPLERO AI - CREATE CONTACT ACTION */}
        {node.service === "keplero_create_contact" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Name
              </label>
              <input
                type="text"
                value={node.config.name || ""}
                onChange={(e) =>
                  onUpdate({ ...node.config, name: e.target.value })
                }
                className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                placeholder="Contact name..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <input
                type="email"
                value={node.config.email || ""}
                onChange={(e) =>
                  onUpdate({ ...node.config, email: e.target.value })
                }
                className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                placeholder="contact@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={node.config.phone || ""}
                onChange={(e) =>
                  onUpdate({ ...node.config, phone: e.target.value })
                }
                className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                placeholder="+1234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={node.config.tags?.join(', ') || ""}
                onChange={(e) =>
                  onUpdate({ 
                    ...node.config, 
                    tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                  })
                }
                className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                placeholder="tag1, tag2, tag3"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Create a new contact with the specified details.
            </p>
          </div>
        )}

        {/* KEPLERO AI - API CALL ACTION */}
        {node.service === "keplero_api_call" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                URL
              </label>
              <input
                type="url"
                value={node.config.url || ""}
                onChange={(e) =>
                  onUpdate({ ...node.config, url: e.target.value })
                }
                className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                placeholder="https://api.example.com/endpoint"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Method
              </label>
              <select
                value={node.config.method || "GET"}
                onChange={(e) =>
                  onUpdate({ ...node.config, method: e.target.value })
                }
                className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Headers (JSON)
              </label>
              <textarea
                value={typeof node.config.headers === 'string' ? node.config.headers : JSON.stringify(node.config.headers || {}, null, 2)}
                onChange={(e) =>
                  onUpdate({ ...node.config, headers: e.target.value })
                }
                className="w-full h-24 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none font-mono"
                placeholder='{"Authorization": "Bearer token"}'
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Body (JSON)
              </label>
              <textarea
                value={node.config.body || ""}
                onChange={(e) =>
                  onUpdate({ ...node.config, body: e.target.value })
                }
                className="w-full h-24 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none font-mono"
                placeholder='{"key": "value"}'
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Make an HTTP request to an external API.
            </p>
          </div>
        )}

        {/* LEGACY TRIGGERS */}
        {(node.type === "trigger" && !node.service.startsWith("keplero_")) && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Event
              </label>
              <select
                value={node.config.event || ""}
                onChange={(e) =>
                  onUpdate({ ...node.config, event: e.target.value })
                }
                className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">Select event...</option>
                <option value="lead_created">New Lead Created</option>
                <option value="order_created">Order Created</option>
                <option value="cart_abandoned">Cart Abandoned</option>
                <option value="form_submitted">Form Submitted</option>
              </select>
            </div>
            <p className="text-xs text-muted-foreground">
              Choose which event will trigger this automation.
            </p>
          </div>
        )}

        {/* WHATSAPP TEMPLATE ACTION */}
        {node.service === "whatsapp_template" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Template
              </label>
              <select
                value={node.config.template || ""}
                onChange={(e) =>
                  onUpdate({ ...node.config, template: e.target.value })
                }
                className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">Select template...</option>
                <option value="welcome">Welcome Message</option>
                <option value="follow_up">Follow Up</option>
                <option value="cart_reminder">Cart Reminder</option>
                <option value="order_confirmation">Order Confirmation</option>
              </select>
            </div>
            <p className="text-xs text-muted-foreground">
              Select the WhatsApp template message to send.
            </p>
          </div>
        )}

        {/* SEND EMAIL ACTION */}
        {node.service === "send_email" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Subject
              </label>
              <input
                type="text"
                value={node.config.subject || ""}
                onChange={(e) =>
                  onUpdate({ ...node.config, subject: e.target.value })
                }
                className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                placeholder="Email subject..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Template
              </label>
              <select
                value={node.config.template || ""}
                onChange={(e) =>
                  onUpdate({ ...node.config, template: e.target.value })
                }
                className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">Select template...</option>
                <option value="welcome_email">Welcome Email</option>
                <option value="cart_reminder_email">Cart Reminder</option>
                <option value="order_confirmation_email">
                  Order Confirmation
                </option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-border space-y-3 shrink-0">
        <button
          onClick={onDelete}
          className="w-full h-10 border border-red-600 text-red-600 rounded-lg text-sm font-medium hover:bg-red-600/10 transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete</span>
        </button>
        <button
          onClick={onClose}
          className="w-full h-10 bg-primary text-white rounded-lg text-sm font-medium hover:brightness-110 transition-all"
        >
          Save
        </button>
      </div>
    </div>
  );
}
