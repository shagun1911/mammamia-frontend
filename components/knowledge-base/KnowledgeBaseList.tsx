"use client";

import { useState, useEffect } from 'react';
import { Plus, Database, Upload, Loader2, Trash2 } from 'lucide-react';
import { useKnowledgeBase } from '@/contexts/KnowledgeBaseContext';
import { CreateCollectionModal } from './CreateCollectionModal';
import { IngestDataModal } from './IngestDataModal';
import { toast } from '@/lib/toast';

export function KnowledgeBaseList() {
  const { collections, loadCollections, deleteCollection } = useKnowledgeBase();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [selectedCollectionForIngest, setSelectedCollectionForIngest] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load collections on mount
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await loadCollections();
      setIsLoading(false);
    };
    load();
  }, [loadCollections]);

  const handleIngestClick = (collectionId: string, collectionName: string) => {
    setSelectedCollectionForIngest(collectionId);
    setIsIngestModalOpen(true);
  };

  const handleDeleteClick = async (kbId: string, collectionName: string) => {
    if (!kbId) {
      toast.error('Invalid knowledge base ID');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${collectionName}"? This action cannot be undone and will delete all associated data.`)) {
      return;
    }

    setDeletingId(kbId);
    try {
      await deleteCollection(kbId);
      toast.success('Knowledge base deleted successfully');
      await loadCollections();
    } catch (error: any) {
      console.error('Failed to delete knowledge base:', error);
      toast.error(error.message || 'Failed to delete knowledge base');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-end">
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Knowledge Base
        </button>
      </div>

      {/* Collections List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">Loading knowledge bases...</p>
        </div>
      ) : collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-xl bg-card/50">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Database className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No Knowledge Bases Yet
          </h3>
          <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
            Create your first knowledge base collection to start ingesting data and chatting with your AI
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all cursor-pointer shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            Create First Knowledge Base
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <div
              key={collection.id}
              className="bg-card border border-border rounded-xl p-6 hover:border-primary hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0 ring-2 ring-primary/10">
                  <Database className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-base font-semibold text-foreground truncate">
                      {collection.name}
                    </h4>
                    {collection.status && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase ${
                        collection.status === 'ready' ? 'bg-green-500/10 text-green-500' :
                        collection.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                        'bg-yellow-500/10 text-yellow-500 animate-pulse'
                      }`}>
                        {collection.status}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground uppercase">
                      {collection.type}
                    </p>
                    <span className="text-muted-foreground/30">•</span>
                    <p className="text-xs text-muted-foreground">
                      {new Date(collection.created_at_unix * 1000).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleIngestClick(collection.id, collection.name)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-secondary hover:bg-accent text-foreground rounded-lg text-sm font-medium transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  Ingest Data
                </button>
                <button
                  onClick={() => handleDeleteClick(collection.id, collection.name)}
                  disabled={deletingId === collection.id}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  title="Delete Knowledge Base"
                >
                  {deletingId === collection.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateCollectionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {selectedCollectionForIngest && (
        <IngestDataModal
          isOpen={isIngestModalOpen}
          onClose={() => {
            setIsIngestModalOpen(false);
            setSelectedCollectionForIngest(null);
          }}
          collectionId={selectedCollectionForIngest}
        />
      )}
    </div>
  );
}

