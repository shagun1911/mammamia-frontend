"use client";

import { useState, useRef } from 'react';
import { X, Loader2, Upload, Link as LinkIcon, FileText, FileSpreadsheet } from 'lucide-react';
import { useKnowledgeBase } from '@/contexts/KnowledgeBaseContext';
import { toast } from '@/lib/toast';

interface IngestDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionId: string; // This is the ID of the existing KB to ingest into (as parent folder)
}

export function IngestDataModal({ isOpen, onClose, collectionId }: IngestDataModalProps) {
  const [urlInput, setUrlInput] = useState('');
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [excelFiles, setExcelFiles] = useState<File[]>([]);
  const [isIngesting, setIsIngesting] = useState(false);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  const { loadCollections } = useKnowledgeBase();

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPdfFiles(Array.from(e.target.files));
    }
  };

  const handleExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setExcelFiles(Array.from(e.target.files));
    }
  };

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();

    const urlLinks = urlInput.split(',').map(url => url.trim()).filter(Boolean);

    if (urlLinks.length === 0 && pdfFiles.length === 0 && excelFiles.length === 0) {
      toast.error('Please provide at least one data source (URLs, PDFs, or Excel files)');
      return;
    }

    setIsIngesting(true);
    let successCount = 0;
    let failCount = 0;

    try {
      const token = localStorage.getItem('accessToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

      const ingestSingleDocument = async (sourceType: 'text' | 'url' | 'file', name: string, content: string | File) => {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('source_type', sourceType);
        formData.append('parent_folder_id', collectionId);

        if (sourceType === 'text') {
          formData.append('text', content as string);
        } else if (sourceType === 'url') {
          formData.append('url', content as string);
        } else if (sourceType === 'file') {
          formData.append('file', content as File);
        }

        const response = await fetch(`${API_URL}/knowledge-base/ingest`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || errorData.message || `Failed to ingest ${name}`);
        }
        successCount++;
      };

      // Ingest URLs
      for (const url of urlLinks) {
        try {
          await ingestSingleDocument('url', `Document from ${new URL(url).hostname}`, url);
        } catch (error: any) {
          console.error(`Failed to ingest URL ${url}:`, error);
          toast.error(error.message || `Failed to ingest URL: ${url}`);
          failCount++;
        }
      }

      // Ingest PDFs
      for (const file of pdfFiles) {
        try {
          await ingestSingleDocument('file', file.name, file);
        } catch (error: any) {
          console.error(`Failed to ingest PDF ${file.name}:`, error);
          toast.error(error.message || `Failed to ingest PDF: ${file.name}`);
          failCount++;
        }
      }

      // Ingest Excel files
      for (const file of excelFiles) {
        try {
          await ingestSingleDocument('file', file.name, file);
        } catch (error: any) {
          console.error(`Failed to ingest Excel ${file.name}:`, error);
          toast.error(error.message || `Failed to ingest Excel: ${file.name}`);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully ingested ${successCount} document(s).`);
      }
      if (failCount > 0) {
        toast.error(`Failed to ingest ${failCount} document(s). See console for details.`);
      }

      if (successCount > 0) {
        await loadCollections(); // Reload collections to show newly added documents
      }

      // Reset form
      setUrlInput('');
      setPdfFiles([]);
      setExcelFiles([]);
      if (pdfInputRef.current) pdfInputRef.current.value = '';
      if (excelInputRef.current) excelInputRef.current.value = '';
      onClose();

    } catch (error: any) {
      console.error('Failed to start ingestion process:', error);
      toast.error(error.message || 'Failed to start ingestion process. Please check backend.');
    } finally {
      setIsIngesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl p-6 m-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Ingest Data into Knowledge Base</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Parent Knowledge Base: <span className="text-primary font-medium">{collectionId}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
            disabled={isIngesting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleIngest}>
          <div className="space-y-6">
            {/* URL Links */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <LinkIcon className="w-4 h-4 text-blue-500" />
                Website URLs
              </label>
              <textarea
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Enter URLs separated by commas\nExample: https://example.com, https://example.com/about"
                rows={3}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                disabled={isIngesting}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Comma-separated URLs to scrape and ingest as new documents.
              </p>
            </div>

            {/* PDF Files */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <FileText className="w-4 h-4 text-red-500" />
                PDF Files
              </label>
              <input
                ref={pdfInputRef}
                type="file"
                accept=".pdf"
                multiple
                onChange={handlePdfChange}
                className="hidden"
                disabled={isIngesting}
              />
              <button
                type="button"
                onClick={() => pdfInputRef.current?.click()}
                disabled={isIngesting}
                className="w-full bg-secondary border-2 border-dashed border-border hover:border-primary rounded-lg px-4 py-6 text-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  Click to upload PDF files
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Each PDF will be ingested as a new document.
                </p>
              </button>
              {pdfFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  {pdfFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-foreground bg-secondary rounded px-3 py-2">
                      <FileText className="w-4 h-4 text-red-500" />
                      <span className="flex-1 truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Excel Files */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <FileSpreadsheet className="w-4 h-4 text-green-500" />
                Excel Files
              </label>
              <input
                ref={excelInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                multiple
                onChange={handleExcelChange}
                className="hidden"
                disabled={isIngesting}
              />
              <button
                type="button"
                onClick={() => excelInputRef.current?.click()}
                disabled={isIngesting}
                className="w-full bg-secondary border-2 border-dashed border-border hover:border-primary rounded-lg px-4 py-6 text-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  Click to upload Excel files
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Each Excel/CSV will be ingested as a new document.
                </p>
              </button>
              {excelFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  {excelFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-foreground bg-secondary rounded px-3 py-2">
                      <FileSpreadsheet className="w-4 h-4 text-green-500" />
                      <span className="flex-1 truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              disabled={isIngesting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isIngesting || (urlInput.length === 0 && pdfFiles.length === 0 && excelFiles.length === 0)}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isIngesting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isIngesting ? 'Ingesting...' : 'Ingest Documents'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
