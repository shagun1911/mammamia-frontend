"use client";

import { useState } from "react";
import { Plus, Bot, Loader2, Trash2, Edit2, MessageSquare, Mic, Database, Wrench } from "lucide-react";
import { useAgents, useDeleteAgent } from "@/hooks/useAgents";
import { CreateAgentModal } from "./CreateAgentModal";
import { EditAgentModal } from "./EditAgentModal";
import { Agent } from "@/services/agent.service";
import { toast } from "sonner";

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
      console.error("Failed to delete agent:", error);
      toast.error(error.message || "Failed to delete agent");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 min-w-0">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 cursor-pointer"
        >
          <Plus className="w-4 h-4 shrink-0" />
          Create Agent
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 min-h-[280px]">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4 shrink-0" />
          <p className="text-sm text-muted-foreground">Loading agents...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24 min-h-[280px] border-2 border-dashed border-destructive/50 rounded-2xl bg-destructive/5">
          <p className="text-sm text-destructive font-medium">Failed to load agents.</p>
          <p className="text-xs text-muted-foreground mt-1">Please try again later.</p>
        </div>
      ) : agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 min-h-[280px] border-2 border-dashed border-border rounded-2xl bg-card/50">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 shrink-0">
            <Bot className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">No agents yet</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
            Create your first AI agent with custom knowledge bases, tools, and behavior.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4 shrink-0" />
            Create first agent
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
          {agents.map((agent) => (
            <div
              key={agent._id}
              className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 hover:shadow-md transition-all flex flex-col min-w-0"
            >
              {/* Card header */}
              <div className="p-4 lg:p-5 flex items-start gap-3 min-w-0 border-b border-border/60">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate" title={agent.name}>
                    {agent.name}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate mt-0.5" title={agent.agent_id}>
                    {agent.agent_id}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      setEditingAgent(agent);
                      setIsEditModalOpen(true);
                    }}
                    className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    title="Edit agent"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(agent)}
                    disabled={deletingId === agent._id}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
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

              {/* Card body */}
              <div className="p-4 lg:p-5 space-y-3 flex-1 flex flex-col min-w-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                    <span>First message</span>
                  </div>
                  <p className="text-sm text-foreground line-clamp-2 break-words" title={agent.first_message}>
                    {agent.first_message || "—"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="font-medium text-foreground/80">{agent.language?.toUpperCase() ?? "EN"}</span>
                  </span>
                  {agent.voice_id && (
                    <span className="flex items-center gap-1.5 truncate max-w-[140px]" title={agent.voice_id}>
                      <Mic className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{agent.voice_id}</span>
                    </span>
                  )}
                </div>

                <div className="pt-3 mt-auto border-t border-border/60 flex items-center justify-between gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5 shrink-0">
                    <Database className="w-3.5 h-3.5" />
                    {agent.knowledge_base_ids?.length ?? 0} KB
                  </span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    <Wrench className="w-3.5 h-3.5" />
                    {agent.tool_ids?.length ?? 0} tools
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateAgentModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
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
