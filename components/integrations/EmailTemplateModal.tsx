'use client';

import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useCreateEmailTemplate } from '@/hooks/useEmailTemplates';
import { EmailTemplateParameter } from '@/services/emailTemplate.service';

interface EmailTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EmailTemplateModal({
  isOpen,
  onClose,
  onSuccess,
}: EmailTemplateModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [subjectTemplate, setSubjectTemplate] = useState('');
  const [bodyTemplate, setBodyTemplate] = useState('');
  const [parameters, setParameters] = useState<EmailTemplateParameter[]>([
    { name: 'name', description: 'Customer name', required: true },
    { name: 'email', description: 'Customer email for confirmation', required: true },
  ]);

  const createEmailTemplate = useCreateEmailTemplate();

  const useBookingPreset = () => {
    setName('booking_confirmation');
    setDescription('Send booking confirmation email after collecting customer name and email');
    setSubjectTemplate('Your Appointment Has Been Booked - {{name}}');
    setBodyTemplate('Dear {{name}},\n\nThank you for booking your appointment with us!\n\nWe have successfully scheduled your appointment.\n\nConfirmation sent to: {{email}}\n\nBest regards,\nThe Booking Team');
    setParameters([
      { name: 'name', description: 'Customer name', required: true },
      { name: 'email', description: 'Customer email address', required: true },
    ]);
  };

  const handleAddParameter = () => {
    setParameters([
      ...parameters,
      { name: '', description: '', required: false },
    ]);
  };

  const handleRemoveParameter = (index: number) => {
    if (parameters.length > 1) {
      setParameters(parameters.filter((_, i) => i !== index));
    }
  };

  const handleParameterChange = (
    index: number,
    field: keyof EmailTemplateParameter,
    value: any
  ) => {
    const updated = [...parameters];
    updated[index] = { ...updated[index], [field]: value };
    setParameters(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      alert('Please enter a template name');
      return;
    }
    if (!description.trim()) {
      alert('Please enter a description');
      return;
    }
    if (!subjectTemplate.trim()) {
      alert('Please enter a subject template');
      return;
    }
    if (!bodyTemplate.trim()) {
      alert('Please enter a body template');
      return;
    }

    // Validate parameters
    const validParameters = parameters.filter(
      (param) => param.name.trim() !== '' && param.description.trim() !== ''
    );

    if (validParameters.length === 0) {
      alert('Please add at least one parameter');
      return;
    }

    try {
      await createEmailTemplate.mutateAsync({
        name: name.trim(),
        description: description.trim(),
        subject_template: subjectTemplate.trim(),
        body_template: bodyTemplate.trim(),
        parameters: validParameters.map(p => ({
          name: p.name.trim(),
          description: p.description.trim(),
          required: p.required || false,
        })),
        sender_email: senderEmail.trim() || undefined,
      });

      // Reset form
      setName('');
      setDescription('');
      setSenderEmail('');
      setSubjectTemplate('');
      setBodyTemplate('');
      setParameters([{ name: 'name', description: 'Customer name', required: true }, { name: 'email', description: 'Customer email for confirmation', required: true }]);

      onSuccess?.();
      onClose();
    } catch (error: any) {
      // Error is handled by the hook (toast notification)
      console.error('Failed to create email template:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Create Email Template
            </h2>
            <button
              type="button"
              onClick={useBookingPreset}
              className="mt-1 text-sm text-primary hover:underline"
            >
              Use booking confirmation preset
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={createEmailTemplate.isPending}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Template Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., confirm_appointment"
                className="w-full h-12 px-4 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={createEmailTemplate.isPending}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use lowercase with underscores (e.g., confirm_appointment)
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Use this when the customer confirms an appointment booking"
                rows={2}
                className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                disabled={createEmailTemplate.isPending}
                required
              />
            </div>

            {/* Sender Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Sender Email (Optional)
              </label>
              <input
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="e.g., support@yourdomain.com"
                className="w-full h-12 px-4 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={createEmailTemplate.isPending}
              />
              <p className="text-xs text-muted-foreground mt-1">
                The email address that will appear in the "From" field. Requires SMTP configuration.
              </p>
            </div>

            {/* Subject Template */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Subject Template <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={subjectTemplate}
                onChange={(e) => setSubjectTemplate(e.target.value)}
                placeholder="e.g., Appointment Confirmed for {{date}} at {{time}}"
                className="w-full h-12 px-4 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={createEmailTemplate.isPending}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use {'{{parameter_name}}'} for dynamic values
              </p>
            </div>

            {/* Body Template */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Body Template <span className="text-red-500">*</span>
              </label>
              <textarea
                value={bodyTemplate}
                onChange={(e) => setBodyTemplate(e.target.value)}
                placeholder="Dear {{customer_name}},\n\nYour appointment has been confirmed.\n\nDate: {{date}}\nTime: {{time}}\nNotes: {{notes}}\n\nBest regards,\nAistein Team"
                rows={8}
                className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
                disabled={createEmailTemplate.isPending}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use {'{{parameter_name}}'} for dynamic values. Use \n for new lines.
              </p>
            </div>

            {/* Parameters */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-foreground">
                  Parameters <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddParameter}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all"
                  disabled={createEmailTemplate.isPending}
                >
                  <Plus className="w-4 h-4" />
                  Add Parameter
                </button>
              </div>

              <div className="space-y-4">
                {parameters.map((parameter, index) => (
                  <div
                    key={index}
                    className="bg-secondary border border-border rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        {/* Parameter Name */}
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">
                            Parameter Name
                          </label>
                          <input
                            type="text"
                            value={parameter.name}
                            onChange={(e) =>
                              handleParameterChange(index, 'name', e.target.value)
                            }
                            placeholder="e.g., date, time, customer_name"
                            className="w-full h-10 px-3 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            disabled={createEmailTemplate.isPending}
                          />
                        </div>

                        {/* Parameter Description */}
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">
                            Description
                          </label>
                          <input
                            type="text"
                            value={parameter.description}
                            onChange={(e) =>
                              handleParameterChange(index, 'description', e.target.value)
                            }
                            placeholder="e.g., Appointment date"
                            className="w-full h-10 px-3 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            disabled={createEmailTemplate.isPending}
                          />
                        </div>
                      </div>

                      {/* Remove Button */}
                      {parameters.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveParameter(index)}
                          className="mt-6 p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          disabled={createEmailTemplate.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Required Checkbox */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`required-${index}`}
                        checked={parameter.required}
                        onChange={(e) =>
                          handleParameterChange(index, 'required', e.target.checked)
                        }
                        className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
                        disabled={createEmailTemplate.isPending}
                      />
                      <label
                        htmlFor={`required-${index}`}
                        className="text-sm text-foreground"
                      >
                        Required parameter
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
              disabled={createEmailTemplate.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-primary text-foreground font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={createEmailTemplate.isPending}
            >
              {createEmailTemplate.isPending ? 'Creating...' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

