"use client";

import { useState } from 'react';
import { X, Loader2, Link2, FileText, File } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useKnowledgeBase } from '@/contexts/KnowledgeBaseContext';
import { toast } from '@/lib/toast';

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateCollectionModal({ isOpen, onClose }: CreateCollectionModalProps) {
  const [name, setName] = useState('');
  const [sourceType, setSourceType] = useState<'text' | 'url' | 'file'>('text');
  const [textInput, setTextInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { loadCollections } = useKnowledgeBase();
  const queryClient = useQueryClient();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter a knowledge base name');
      return;
    }

    setIsCreating(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('source_type', sourceType);

      if (sourceType === 'text') {
        if (!textInput.trim()) {
          toast.error('Text content is required for text source type');
          setIsCreating(false);
          return;
        }
        formData.append('text', textInput);
      } else if (sourceType === 'url') {
        if (!urlInput.trim()) {
          toast.error('URL is required for URL source type');
          setIsCreating(false);
          return;
        }
        formData.append('url', urlInput);
      } else if (sourceType === 'file') {
        if (!fileInput) {
          toast.error('File is required for file source type');
          setIsCreating(false);
          return;
        }
        formData.append('file', fileInput);
      }

      const token = localStorage.getItem('accessToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
      const response = await fetch(`${API_URL}/knowledge-base/ingest`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || errorData.message || 'Failed to create knowledge base');
      }

      toast.success(`Knowledge base "${name}" created and ingestion started!`);

      // Invalidate React Query cache so useKnowledgeBases() refetches
      queryClient.invalidateQueries({ queryKey: ['knowledge-bases'] });
      
      await loadCollections();

      setName('');
      setTextInput('');
      setUrlInput('');
      setFileInput(null);
      setSourceType('text'); // Reset to default
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
          <h2 className="text-xl font-bold text-foreground">Ingest Knowledge Base Document</h2>
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
                Document Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Company FAQ, About Us Page, Product Catalog 2026"
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                disabled={isCreating}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Source Type *
              </label>
              <div className="flex gap-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-primary h-4 w-4"
                    name="sourceType"
                    value="text"
                    checked={sourceType === 'text'}
                    onChange={() => setSourceType('text')}
                    disabled={isCreating}
                  />
                  <span className="ml-2 text-foreground">Text</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-primary h-4 w-4"
                    name="sourceType"
                    value="url"
                    checked={sourceType === 'url'}
                    onChange={() => setSourceType('url')}
                    disabled={isCreating}
                  />
                  <span className="ml-2 text-foreground">URL</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-primary h-4 w-4"
                    name="sourceType"
                    value="file"
                    checked={sourceType === 'file'}
                    onChange={() => setSourceType('file')}
                    disabled={isCreating}
                  />
                  <span className="ml-2 text-foreground">File</span>
                </label>
              </div>
            </div>

            {sourceType === 'text' && (
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <FileText className="w-4 h-4" />
                  Text Content *
                </label>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Enter text content for the knowledge base"
                  rows={6}
                  className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                  disabled={isCreating}
                  required
                />
              </div>
            )}

            {sourceType === 'url' && (
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <Link2 className="w-4 h-4" />
                  Website URL *
                </label>
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="e.g., https://yourcompany.com/about-us"
                  className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  disabled={isCreating}
                  required
                />
              </div>
            )}

            {sourceType === 'file' && (
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <File className="w-4 h-4" />
                  File Upload *
                </label>
                <input
                  type="file"
                  accept=".pdf,.txt,.md,.docx,.xlsx,.xls" // Expanded accepted file types
                  onChange={(e) => setFileInput(e.target.files ? e.target.files[0] : null)}
                  className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-colors"
                  disabled={isCreating}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Supported formats: PDF, TXT, MD, DOCX, XLSX, XLS
                </p>
              </div>
            )}

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-sm text-blue-400">
                <strong>How it works:</strong> When you submit, the system will call the unified ingestion API to create the document and start the processing. You can always ingest more data into an existing knowledge base later.
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
              disabled={isCreating || !name.trim() || (sourceType === 'text' && !textInput.trim()) || (sourceType === 'url' && !urlInput.trim()) || (sourceType === 'file' && !fileInput)}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
              {isCreating ? 'Ingesting...' : 'Create Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
