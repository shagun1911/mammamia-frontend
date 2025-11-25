"use client";

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { pythonRagService } from '@/services/pythonRag.service';
import { useKnowledgeBase } from '@/contexts/KnowledgeBaseContext';
import { toast } from '@/lib/toast';

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateCollectionModal({ isOpen, onClose }: CreateCollectionModalProps) {
  const [collectionName, setCollectionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { addCollection } = useKnowledgeBase();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!collectionName.trim()) {
      toast.error('Please enter a collection name');
      return;
    }

    setIsCreating(true);
    try {
      // Call Node.js backend which will:
      // 1. Create collection in Python RAG
      // 2. Save knowledge base to MongoDB
      const token = localStorage.getItem('accessToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
      const response = await fetch(`${API_URL}/knowledge-bases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: collectionName })
      });

      if (!response.ok) {
        throw new Error('Failed to create knowledge base');
      }

      const data = await response.json();
      const kb = data.data;
      
      toast.success(`Knowledge base "${collectionName}" created and saved to database!`);
      addCollection(kb.collectionName, kb);
      setCollectionName('');
      onClose();
    } catch (error: any) {
      console.error('Failed to create knowledge base:', error);
      toast.error(error.message || 'Failed to create knowledge base. Please check if backend is running.');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Create Knowledge Base</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
            disabled={isCreating}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleCreate}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Collection Name *
              </label>
              <input
                type="text"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                placeholder="e.g., customer_support_kb"
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                disabled={isCreating}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Name will be converted to lowercase with underscores
              </p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-sm text-blue-400">
                <strong>Note:</strong> This creates a collection in your Python RAG service (https://keplerov1-python-production.up.railway.app). 
                Make sure the service is running before proceeding.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !collectionName.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
              {isCreating ? 'Creating...' : 'Create Collection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

