"use client";

import { useState } from 'react';
import { X, Loader2, ChevronDown } from 'lucide-react';
import { useCreateAgent } from '@/hooks/useAgents';
import { useKnowledgeBases } from '@/hooks/useKnowledgeBase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateAgentModal({ isOpen, onClose }: CreateAgentModalProps) {
  const [name, setName] = useState('');
  const [firstMessage, setFirstMessage] = useState('Hello! How can I help you today?');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [language, setLanguage] = useState('en');
  const [voiceId, setVoiceId] = useState('');
  const [selectedKBIds, setSelectedKBIds] = useState<string[]>([]);
  const [showKBDropdown, setShowKBDropdown] = useState(false);

  const createAgent = useCreateAgent();
  const { data: knowledgeBases = [], isLoading: isLoadingKBs } = useKnowledgeBases();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Agent name is required');
      return;
    }

    if (!firstMessage.trim()) {
      toast.error('First message is required');
      return;
    }

    if (!systemPrompt.trim()) {
      toast.error('System prompt is required');
      return;
    }

    try {
      await createAgent.mutateAsync({
        name: name.trim(),
        first_message: firstMessage.trim(),
        system_prompt: systemPrompt.trim(),
        language: language.trim(),
        voice_id: voiceId.trim() || undefined,
        knowledge_base_ids: selectedKBIds,
        // tool_ids are automatically added from backend env variables
      });

      // Reset form
      setName('');
      setFirstMessage('Hello! How can I help you today?');
      setSystemPrompt('');
      setLanguage('en');
      setVoiceId('');
      setSelectedKBIds([]);
      onClose();
    } catch (error: any) {
      // Error is handled by the mutation
      console.error('Failed to create agent:', error);
    }
  };

  const toggleKB = (kbId: string) => {
    setSelectedKBIds(prev =>
      prev.includes(kbId) ? prev.filter(id => id !== kbId) : [...prev, kbId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Create New Agent</h2>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Agent Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Agent Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-primary"
              placeholder="Customer Support Bot"
              required
            />
          </div>

          {/* First Message */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              First Message <span className="text-destructive">*</span>
            </label>
            <textarea
              value={firstMessage}
              onChange={(e) => setFirstMessage(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-primary resize-none"
              rows={2}
              placeholder="Hello! How can I help you today?"
              required
            />
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              System Prompt <span className="text-destructive">*</span>
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-primary resize-none"
              rows={4}
              placeholder="You are a helpful customer support agent."
              required
            />
          </div>

          {/* Language and Voice ID */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Language <span className="text-destructive">*</span>
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-primary"
                required
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
                <option value="pt">Portuguese</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Voice ID (Optional)
              </label>
              <input
                type="text"
                value={voiceId}
                onChange={(e) => setVoiceId(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-primary"
                placeholder="21m00Tcm4TlvDq8ikWAM"
              />
            </div>
          </div>

          {/* Knowledge Bases */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Knowledge Bases
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowKBDropdown(!showKBDropdown)}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-left text-foreground focus:outline-none focus:border-primary transition-colors flex items-center justify-between"
              >
                <span className="truncate text-sm">
                  {selectedKBIds.length === 0
                    ? 'Select knowledge bases...'
                    : `${selectedKBIds.length} knowledge base${selectedKBIds.length > 1 ? 's' : ''} selected`
                  }
                </span>
                <ChevronDown className={cn("w-4 h-4 transition-transform", showKBDropdown && "rotate-180")} />
              </button>

              {showKBDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-secondary border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {isLoadingKBs ? (
                    <div className="px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading knowledge bases...
                    </div>
                  ) : knowledgeBases.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-muted-foreground">
                      No knowledge bases available
                    </div>
                  ) : (
                    knowledgeBases.map((kb: any) => (
                      <label
                        key={kb.id}
                        className="flex items-center px-4 py-2 hover:bg-accent cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedKBIds.includes(kb.id)}
                          onChange={() => toggleKB(kb.id)}
                          className="mr-3 h-4 w-4 text-primary focus:ring-primary border-border rounded"
                        />
                        <span className="text-sm text-foreground">{kb.name}</span>
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createAgent.isPending}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {createAgent.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Agent
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

