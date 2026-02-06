'use client';

import { Tool } from '@/services/tool.service';
import { Edit2, Trash2, Mail, MessageSquare, Zap, Webhook, Database, Bell, Settings, Eye } from 'lucide-react';

interface IntegrationListProps {
  integrations: Tool[];
  onView: (tool: Tool) => void;
  onEdit: (tool: Tool) => void;
  onDelete: (toolId: string, integration?: Tool) => void;
  isLoading?: boolean;
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

export function IntegrationList({
  integrations,
  onView,
  onEdit,
  onDelete,
  isLoading = false,
}: IntegrationListProps) {
  const getToolIcon = (toolType: string) => {
    const config = TOOL_TYPE_ICONS[toolType] || TOOL_TYPE_ICONS.other;
    const IconComponent = config.icon;
    return { IconComponent, ...config };
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-xl p-6 animate-pulse"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-secondary rounded-lg" />
                <div className="space-y-2">
                  <div className="w-24 h-4 bg-secondary rounded" />
                  <div className="w-16 h-3 bg-secondary rounded" />
                </div>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="w-full h-3 bg-secondary rounded" />
              <div className="w-2/3 h-3 bg-secondary rounded" />
            </div>
            <div className="w-full h-9 bg-secondary rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (integrations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4">
          <Settings className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          No Integrations Yet
        </h3>
        <p className="text-muted-foreground max-w-md">
          Create your first integration to connect with external tools and automate workflows
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {integrations.map((tool) => {
        const { IconComponent, color, bg } = getToolIcon(tool.tool_type);
        
        return (
          <div
            key={tool.tool_id}
            className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all group flex flex-col"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={`w-12 h-12 ${bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <IconComponent className={`w-6 h-6 ${color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-foreground break-words">
                    {tool.tool_name}
                  </h3>
                  <span className="text-xs text-muted-foreground capitalize">
                    {(tool as any).isEmailTemplate ? 'Email Template' : tool.tool_type.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[40px] break-words">
              {tool.description}
            </p>

            {/* Properties Count */}
            <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground flex-wrap">
              <span className="px-2 py-1 bg-secondary rounded-md whitespace-nowrap">
                {tool.properties.length} {tool.properties.length === 1 ? 'property' : 'properties'}
              </span>
              {tool.properties.filter(p => p.required).length > 0 && (
                <span className="px-2 py-1 bg-red-500/10 text-red-500 rounded-md whitespace-nowrap">
                  {tool.properties.filter(p => p.required).length} required
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {!(tool as any).isEmailTemplate ? (
                <>
                  <button
                    onClick={() => onView(tool)}
                    className="flex-1 h-9 px-4 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-accent transition-colors flex items-center justify-center gap-2"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => onEdit(tool)}
                    className="h-9 w-9 flex items-center justify-center bg-secondary text-foreground rounded-lg hover:bg-accent transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span className="sr-only">Edit</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${tool.tool_name}"?`)) {
                        onDelete(tool.tool_id, tool);
                      }
                    }}
                    className="h-9 w-9 flex items-center justify-center bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="sr-only">Delete</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onView(tool)}
                    className="flex-1 h-9 px-4 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-accent transition-colors flex items-center justify-center gap-2"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${tool.tool_name}"?`)) {
                        onDelete(tool.tool_id, tool);
                      }
                    }}
                    className="h-9 w-9 flex items-center justify-center bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="sr-only">Delete</span>
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

