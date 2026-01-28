'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Sparkles } from 'lucide-react';
import { Tool, ToolProperty } from '@/services/tool.service';
import { INTEGRATION_TEMPLATES, IntegrationTemplate } from '@/lib/integrationTemplates';

interface IntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    tool_name: string;
    tool_type: string;
    description: string;
    properties: ToolProperty[];
  }) => void;
  editingTool?: Tool | null;
  isLoading?: boolean;
  onEmailTemplateRequest?: () => void; // Callback when send_email template is selected
}

const TOOL_TYPES = [
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'sms', label: 'SMS', icon: '💬' },
  { value: 'api_call', label: 'API Call', icon: '🔌' },
  { value: 'webhook', label: 'Webhook', icon: '🪝' },
  { value: 'database', label: 'Database', icon: '🗄️' },
  { value: 'notification', label: 'Notification', icon: '🔔' },
  { value: 'other', label: 'Other', icon: '⚙️' },
];

const PROPERTY_TYPES = [
  { value: 'string', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'email', label: 'Email' },
  { value: 'url', label: 'URL' },
  { value: 'textarea', label: 'Long Text' },
];

export function IntegrationModal({
  isOpen,
  onClose,
  onSubmit,
  editingTool,
  isLoading = false,
  onEmailTemplateRequest,
}: IntegrationModalProps) {
  const [showTemplates, setShowTemplates] = useState(true);
  const [toolName, setToolName] = useState('');
  const [toolType, setToolType] = useState('email');
  const [description, setDescription] = useState('');
  const [properties, setProperties] = useState<ToolProperty[]>([
    { name: '', type: 'string', description: '', required: false, value: '' },
  ]);

  // Load editing tool data
  useEffect(() => {
    if (editingTool) {
      setShowTemplates(false);
      setToolName(editingTool.tool_name);
      setToolType(editingTool.tool_type);
      setDescription(editingTool.description);
      setProperties(editingTool.properties.length > 0 
        ? editingTool.properties 
        : [{ name: '', type: 'string', description: '', required: false, value: '' }]
      );
    } else {
      // Reset form when creating new
      setShowTemplates(true);
      setToolName('');
      setToolType('email');
      setDescription('');
      setProperties([{ name: '', type: 'string', description: '', required: false, value: '' }]);
    }
  }, [editingTool, isOpen]);

  // Load template
  const loadTemplate = (template: IntegrationTemplate) => {
    // Special handling for send_email template - show email template modal instead
    if (template.tool_name === 'send_email' && onEmailTemplateRequest) {
      onEmailTemplateRequest();
      return;
    }
    
    setToolName(template.tool_name);
    setToolType(template.tool_type);
    setDescription(template.description);
    setProperties(template.properties);
    setShowTemplates(false);
  };

  const handleAddProperty = () => {
    setProperties([
      ...properties,
      { name: '', type: 'string', description: '', required: false, value: '' },
    ]);
  };

  const handleRemoveProperty = (index: number) => {
    if (properties.length > 1) {
      setProperties(properties.filter((_, i) => i !== index));
    }
  };

  const handlePropertyChange = (
    index: number,
    field: keyof ToolProperty,
    value: any
  ) => {
    const updated = [...properties];
    updated[index] = { ...updated[index], [field]: value };
    setProperties(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!toolName.trim()) {
      alert('Please enter a tool name');
      return;
    }
    if (!description.trim()) {
      alert('Please enter a description');
      return;
    }

    // Validate properties
    const validProperties = properties.filter(
      (prop) => prop.name.trim() !== ''
    );

    if (validProperties.length === 0) {
      alert('Please add at least one property');
      return;
    }

    onSubmit({
      tool_name: toolName,
      tool_type: toolType,
      description: description,
      properties: validProperties.map(prop => ({
        ...prop,
        value: prop.value || ''
      })),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold text-foreground">
            {editingTool ? 'Edit Integration' : 'New Integration'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={isLoading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Template Selection - Show only when creating new */}
            {!editingTool && showTemplates && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-foreground">
                    <Sparkles className="w-4 h-4 inline mr-1" />
                    Start from a template
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowTemplates(false)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Skip templates
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {INTEGRATION_TEMPLATES.map((template) => (
                    <button
                      key={template.tool_name}
                      type="button"
                      onClick={() => loadTemplate(template)}
                      className="p-4 bg-secondary border border-border rounded-xl hover:border-primary transition-all text-left group"
                    >
                      <div className="text-2xl mb-2">{template.icon}</div>
                      <h4 className="text-sm font-semibold text-foreground mb-1">
                        {template.tool_name}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {template.description}
                      </p>
                    </button>
                  ))}
                </div>
                <div className="border-t border-border pt-6">
                  <p className="text-xs text-muted-foreground text-center mb-4">
                    Or create from scratch
                  </p>
                </div>
              </div>
            )}
            {/* Tool Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Integration Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={toolName}
                onChange={(e) => setToolName(e.target.value)}
                placeholder="e.g., send_email, send_sms"
                className="w-full h-12 px-4 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use lowercase with underscores (e.g., send_email)
              </p>
            </div>

            {/* Tool Type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Integration Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-3">
                {TOOL_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setToolType(type.value)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      toolType === type.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-secondary hover:border-primary/50'
                    }`}
                    disabled={isLoading}
                  >
                    <div className="text-2xl mb-1">{type.icon}</div>
                    <div className="text-xs font-medium text-foreground">
                      {type.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this integration does..."
                rows={3}
                className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                disabled={isLoading}
              />
            </div>

            {/* Properties */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-foreground">
                  Properties <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddProperty}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all"
                  disabled={isLoading}
                >
                  <Plus className="w-4 h-4" />
                  Add Property
                </button>
              </div>

              <div className="space-y-4">
                {properties.map((property, index) => (
                  <div
                    key={index}
                    className="bg-secondary border border-border rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        {/* Property Name */}
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">
                            Property Name
                          </label>
                          <input
                            type="text"
                            value={property.name}
                            onChange={(e) =>
                              handlePropertyChange(index, 'name', e.target.value)
                            }
                            placeholder="e.g., to, subject"
                            className="w-full h-10 px-3 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            disabled={isLoading}
                          />
                        </div>

                        {/* Property Type */}
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">
                            Type
                          </label>
                          <select
                            value={property.type}
                            onChange={(e) =>
                              handlePropertyChange(index, 'type', e.target.value)
                            }
                            className="w-full h-10 px-3 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            disabled={isLoading}
                          >
                            {PROPERTY_TYPES.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Remove Button */}
                      {properties.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveProperty(index)}
                          className="mt-6 p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          disabled={isLoading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Property Description */}
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={property.description}
                        onChange={(e) =>
                          handlePropertyChange(index, 'description', e.target.value)
                        }
                        placeholder="Describe this property..."
                        className="w-full h-10 px-3 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        disabled={isLoading}
                      />
                    </div>

                    {/* Default Value */}
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Default Value (Optional)
                      </label>
                      <input
                        type="text"
                        value={property.value}
                        onChange={(e) =>
                          handlePropertyChange(index, 'value', e.target.value)
                        }
                        placeholder="Default value or template (e.g., {{name}})"
                        className="w-full h-10 px-3 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        disabled={isLoading}
                      />
                    </div>

                    {/* Required Checkbox */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`required-${index}`}
                        checked={property.required}
                        onChange={(e) =>
                          handlePropertyChange(index, 'required', e.target.checked)
                        }
                        className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
                        disabled={isLoading}
                      />
                      <label
                        htmlFor={`required-${index}`}
                        className="text-sm text-foreground"
                      >
                        Required field
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-secondary/50">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-border bg-card text-foreground font-medium hover:bg-secondary transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-primary text-foreground font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : editingTool ? 'Update Integration' : 'Create Integration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

