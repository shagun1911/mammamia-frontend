"use client";

import { useState } from 'react';
import { Plus, Bot, Loader2, Trash2, Edit2, MessageSquare, Settings, Globe } from 'lucide-react';
import { useAgents, useDeleteAgent } from '@/hooks/useAgents';
import { CreateAgentModal } from './CreateAgentModal';
import { EditAgentModal } from './EditAgentModal';
import { Agent } from '@/services/agent.service';
import { toast } from 'sonner';

export function AgentList() {
  const { data: agents = [], isLoading, error } = useAgents();
  const deleteAgent = useDeleteAgent();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (agent: Agent) => {
    if (!confirm(`Are you sure you want to delete "${agent.name}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(agent._id);
    try {
      await deleteAgent.mutateAsync(agent._id);
    } catch (error: any) {
      console.error('Failed to delete agent:', error);
      toast.error(error.message || 'Failed to delete agent');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Agents</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage AI agents with custom configurations
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Agent
        </button>
      </div>

      {/* Agents List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">Loading agents...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-destructive rounded-xl bg-card/50">
          <p className="text-sm text-destructive">Failed to load agents. Please try again.</p>
        </div>
      ) : agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-xl bg-card/50">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Bot className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No Agents Yet
          </h3>
          <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
            Create your first AI agent with custom knowledge bases, tools, and behavior settings
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all cursor-pointer shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            Create First Agent
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <div
              key={agent._id}
              className="bg-card border border-border rounded-xl p-6 hover:border-primary hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{agent.name}</h3>
                    <p className="text-xs text-muted-foreground">ID: {agent.agent_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingAgent(agent);
                      setIsEditModalOpen(true);
                    }}
                    className="p-2 text-muted-foreground hover:text-primary transition-colors"
                    title="Edit agent"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(agent)}
                    disabled={deletingId === agent._id}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                    title="Delete agent"
                  >
                    {deletingId === agent._id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">First Message</p>
                    <p className="text-sm text-foreground truncate">{agent.first_message}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    <span>{agent.language.toUpperCase()}</span>
                  </div>
                  {agent.voice_id && (
                    <div className="flex items-center gap-1">
                      <Settings className="w-3 h-3" />
                      <span>Voice: {agent.voice_id}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Knowledge Bases: {agent.knowledge_base_ids.length}</span>
                    <span>Tools: {agent.tool_ids.length}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateAgentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <EditAgentModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingAgent(null);
        }}
        agent={editingAgent}
      />
    </div>
  );
}

