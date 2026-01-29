"use client";

import { useState, useEffect } from 'react';
import { X, Loader2, ChevronDown, Check } from 'lucide-react';
import { useUpdateAgentPrompt } from '@/hooks/useAgents';
import { useKnowledgeBases } from '@/hooks/useKnowledgeBase';
import { Agent } from '@/services/agent.service';
import { cn } from '@/lib/utils';

interface EditAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent | null;
}

export function EditAgentModal({ isOpen, onClose, agent }: EditAgentModalProps) {
  const [firstMessage, setFirstMessage] = useState('Hello! How can I help you today?');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [language, setLanguage] = useState('en');
  const [selectedKBIds, setSelectedKBIds] = useState<string[]>([]);
  const [showKBDropdown, setShowKBDropdown] = useState(false);

  const updateAgentPrompt = useUpdateAgentPrompt();
  const { data: knowledgeBases = [], isLoading: isLoadingKBs } = useKnowledgeBases();

  // Load agent data when modal opens
  useEffect(() => {
    if (agent && isOpen) {
      setFirstMessage(agent.first_message || 'Hello! How can I help you today?');
      setSystemPrompt(agent.system_prompt || '');
      setLanguage(agent.language || 'en');
      setSelectedKBIds(agent.knowledge_base_ids || []);
    }
  }, [agent, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agent) return;

    if (!firstMessage.trim()) {
      return;
    }

    if (!systemPrompt.trim()) {
      return;
    }

    try {
      await updateAgentPrompt.mutateAsync({
        agentId: agent.agent_id, // Use agent_id from Python API
        data: {
          first_message: firstMessage.trim(),
          system_prompt: systemPrompt.trim(),
          language: language.trim(),
          knowledge_base_ids: selectedKBIds,
          // tool_ids are automatically added from backend env variables
        },
      });

      onClose();
    } catch (error: any) {
      // Error is handled by the mutation
      console.error('Failed to update agent prompt:', error);
    }
  };

  const toggleKB = (kbId: string) => {
    setSelectedKBIds(prev =>
      prev.includes(kbId) ? prev.filter(id => id !== kbId) : [...prev, kbId]
    );
  };

  if (!isOpen || !agent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Edit Agent Prompt</h2>
            <p className="text-sm text-muted-foreground mt-1">{agent.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            disabled={updateAgentPrompt.isPending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* First Message */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              First Message <span className="text-destructive">*</span>
            </label>
            <textarea
              value={firstMessage}
              onChange={(e) => setFirstMessage(e.target.value)}
              placeholder="Hello! How can I help you today?"
              rows={3}
              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              disabled={updateAgentPrompt.isPending}
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
              placeholder="You are a helpful customer support agent..."
              rows={6}
              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              disabled={updateAgentPrompt.isPending}
              required
            />
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Language <span className="text-destructive">*</span>
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={updateAgentPrompt.isPending}
              required
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="pt">Portuguese</option>
              <option value="zh">Chinese</option>
              <option value="ja">Japanese</option>
              <option value="ko">Korean</option>
            </select>
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
                className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground flex items-center justify-between hover:bg-accent transition-colors"
                disabled={updateAgentPrompt.isPending || isLoadingKBs}
              >
                <span className="text-sm">
                  {selectedKBIds.length === 0
                    ? 'Select knowledge bases...'
                    : `${selectedKBIds.length} knowledge base${selectedKBIds.length === 1 ? '' : 's'} selected`}
                </span>
                <ChevronDown className={cn('w-4 h-4 transition-transform', showKBDropdown && 'rotate-180')} />
              </button>

              {showKBDropdown && (
                <div className="absolute z-10 w-full mt-2 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {isLoadingKBs ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Loading knowledge bases...
                    </div>
                  ) : knowledgeBases.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No knowledge bases available
                    </div>
                  ) : (
                    <div className="p-2">
                      {knowledgeBases.map((kb) => (
                        <button
                          key={kb.id}
                          type="button"
                          onClick={() => toggleKB(kb.id)}
                          className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-secondary rounded-md flex items-center gap-2 transition-colors"
                        >
                          <div
                            className={cn(
                              'w-4 h-4 border-2 rounded flex items-center justify-center',
                              selectedKBIds.includes(kb.id)
                                ? 'bg-primary border-primary'
                                : 'border-border'
                            )}
                          >
                            {selectedKBIds.includes(kb.id) && (
                              <Check className="w-3 h-3 text-primary-foreground" />
                            )}
                          </div>
                          <span className="flex-1 truncate">{kb.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            {selectedKBIds.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedKBIds.map((kbId) => {
                  const kb = knowledgeBases.find(k => k.id === kbId);
                  return (
                    <span
                      key={kbId}
                      className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md flex items-center gap-1"
                    >
                      {kb?.name || kbId}
                      <button
                        type="button"
                        onClick={() => toggleKB(kbId)}
                        className="hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-foreground bg-secondary rounded-lg hover:bg-accent transition-colors"
              disabled={updateAgentPrompt.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={updateAgentPrompt.isPending}
            >
              {updateAgentPrompt.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Update Agent
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

