"use client";

import { useState } from 'react';
import { X, Loader2, Link2, FileText, File } from 'lucide-react';
import { pythonRagService } from '@/services/pythonRag.service';
import { useKnowledgeBase } from '@/contexts/KnowledgeBaseContext';
import { toast } from '@/lib/toast';

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateCollectionModal({ isOpen, onClose }: CreateCollectionModalProps) {
  const [collectionName, setCollectionName] = useState('');
  const [urlLinks, setUrlLinks] = useState('');
  const [pdfFiles, setPdfFiles] = useState<FileList | null>(null);
  const [excelFiles, setExcelFiles] = useState<FileList | null>(null);
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
      // Prepare FormData with all data sources
      const formData = new FormData();
      formData.append('name', collectionName);
      
      // Add URL links if provided (comma-separated)
      if (urlLinks.trim()) {
        formData.append('url_links', urlLinks.trim());
      }
      
      // Add PDF files if provided
      if (pdfFiles) {
        Array.from(pdfFiles).forEach((file) => {
          formData.append('pdf_files', file);
        });
      }
      
      // Add Excel files if provided
      if (excelFiles) {
        Array.from(excelFiles).forEach((file) => {
          formData.append('excel_files', file);
        });
      }

      // Call Node.js backend which will:
      // 1. Use data_ingestion endpoint to create collection and ingest data in one go
      // 2. Save knowledge base to MongoDB
      const token = localStorage.getItem('accessToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
      const response = await fetch(`${API_URL}/knowledge-bases`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create knowledge base');
      }

      const data = await response.json();
      const kb = data.data;
      
      toast.success(`Knowledge base "${collectionName}" created successfully!`);
      addCollection(kb.collectionName, kb);
      
      // Reset form
      setCollectionName('');
      setUrlLinks('');
      setPdfFiles(null);
      setExcelFiles(null);
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
                Knowledge Base Name *
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
                This will be used as the collection name in the RAG system
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <Link2 className="w-4 h-4" />
                Website URLs (Optional)
              </label>
              <textarea
                value={urlLinks}
                onChange={(e) => setUrlLinks(e.target.value)}
                placeholder="Enter comma-separated URLs for web scraping&#10;e.g., https://example.com, https://example.com/docs"
                rows={3}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                disabled={isCreating}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Separate multiple URLs with commas
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <FileText className="w-4 h-4" />
                PDF Files (Optional)
              </label>
              <input
                type="file"
                accept=".pdf,application/pdf"
                multiple
                onChange={(e) => setPdfFiles(e.target.files)}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-colors"
                disabled={isCreating}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Upload PDF documents to add to the knowledge base
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <File className="w-4 h-4" />
                Excel Files (Optional)
              </label>
              <input
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                multiple
                onChange={(e) => setExcelFiles(e.target.files)}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-colors"
                disabled={isCreating}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Upload Excel spreadsheets to add to the knowledge base
              </p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-sm text-blue-400">
                <strong>How it works:</strong> When you submit, the system will call the data ingestion API to create the collection and ingest any provided data. All data sources are optional - you can add them now or later.
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

