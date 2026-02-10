'use client';

import { X, Edit2, Mail, MessageSquare, Zap, Webhook, Database, Bell, Settings, CheckCircle2, XCircle } from 'lucide-react';
import { Tool } from '@/services/tool.service';

interface ViewIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  integration: Tool | null;
}

const TOOL_TYPE_ICONS: Record<string, { icon: any; color: string; bg: string }> = {
  email: { icon: Mail, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  email_template: { icon: Mail, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  sms: { icon: MessageSquare, color: 'text-green-500', bg: 'bg-green-500/10' },
  api_call: { icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  webhook: { icon: Webhook, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  database: { icon: Database, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  notification: { icon: Bell, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  other: { icon: Settings, color: 'text-gray-500', bg: 'bg-gray-500/10' },
};

export function ViewIntegrationModal({
  isOpen,
  onClose,
  onEdit,
  integration,
}: ViewIntegrationModalProps) {

  if (!isOpen || !integration) return null;

  const getToolIcon = (toolType: string) => {
    const config = TOOL_TYPE_ICONS[toolType] || TOOL_TYPE_ICONS.other;
    const IconComponent = config.icon;
    return { IconComponent, ...config };
  };

  const { IconComponent, color, bg } = getToolIcon(integration.tool_type);
  const isEmailTemplate = (integration as any).isEmailTemplate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 ${bg} rounded-xl flex items-center justify-center`}>
              <IconComponent className={`w-7 h-7 ${color}`} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {integration.tool_name}
              </h2>
              <p className="text-sm text-muted-foreground capitalize mt-1">
                {isEmailTemplate ? 'Email Template' : integration.tool_type.replace('_', ' ')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6 space-y-6">
          {/* Description Section */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Description
            </label>
            <div className="p-4 bg-secondary border border-border rounded-xl">
              <p className="text-foreground">{integration.description || 'No description provided'}</p>
            </div>
          </div>

          {/* Integration Type */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Integration Type
            </label>
            <div className="p-4 bg-secondary border border-border rounded-xl">
              <p className="text-foreground capitalize">
                {isEmailTemplate ? 'Email Template' : integration.tool_type.replace('_', ' ')}
              </p>
            </div>
          </div>

          {/* Sender Email (for Email Templates) */}
          {isEmailTemplate && (integration as any).sender_email && (
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Sender Email
              </label>
              <div className="p-4 bg-secondary border border-border rounded-xl">
                <p className="text-foreground">{(integration as any).sender_email}</p>
              </div>
            </div>
          )}

          {/* Email Template Specific Fields */}
          {isEmailTemplate && (
            <>
              {/* Subject Template */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Subject Template
                </label>
                <div className="p-4 bg-secondary border border-border rounded-xl">
                  <code className="text-foreground break-words">
                    {(integration as any).subject_template || 'No subject template'}
                  </code>
                </div>
              </div>

              {/* Body Template */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Body Template
                </label>
                <div className="p-4 bg-secondary border border-border rounded-xl max-h-96 overflow-y-auto">
                  <pre className="text-sm text-foreground whitespace-pre-wrap break-words font-mono">
                    {(integration as any).body_template || 'No body template'}
                  </pre>
                </div>
              </div>
            </>
          )}

          {/* Properties Section */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-3">
              Properties ({integration.properties.length})
            </label>
            {integration.properties.length === 0 ? (
              <div className="p-6 bg-secondary border border-border rounded-xl text-center">
                <p className="text-muted-foreground">No properties configured</p>
              </div>
            ) : (
              <div className="space-y-3">
                {integration.properties.map((property, index) => (
                  <div
                    key={index}
                    className="bg-secondary border border-border rounded-xl p-5 space-y-3"
                  >
                    {/* Property Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-base font-semibold text-foreground">
                            {property.name}
                          </h4>
                          {property.required && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-500 rounded-md text-xs font-medium">
                              <CheckCircle2 className="w-3 h-3" />
                              Required
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground capitalize">
                          Type: {property.type}
                        </p>
                      </div>
                    </div>

                    {/* Property Description */}
                    {property.description && (
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">
                          Description
                        </label>
                        <p className="text-sm text-foreground">
                          {property.description}
                        </p>
                      </div>
                    )}

                    {/* Default Value */}
                    {property.value && (
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">
                          Default Value
                        </label>
                        <div className="p-3 bg-card border border-border rounded-lg">
                          <code className="text-sm text-foreground break-all">
                            {property.value}
                          </code>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Metadata */}
          {integration.createdAt && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Created At
                </label>
                <p className="text-sm text-foreground">
                  {new Date(integration.createdAt).toLocaleString()}
                </p>
              </div>
              {integration.updatedAt && (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Last Updated
                  </label>
                  <p className="text-sm text-foreground">
                    {new Date(integration.updatedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-border bg-secondary/50">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-border bg-card text-foreground font-medium hover:bg-secondary transition-colors"
          >
            Close
          </button>
          <div className="flex items-center gap-3">
            {isEmailTemplate && (
              <p className="text-xs text-muted-foreground italic">
                Email templates cannot be edited. Delete and create a new one to make changes.
              </p>
            )}
            {!isEmailTemplate && onEdit && (
              <button
                onClick={onEdit}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-foreground font-medium hover:brightness-110 transition-all"
              >
                <Edit2 className="w-4 h-4" />
                Edit Integration
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
