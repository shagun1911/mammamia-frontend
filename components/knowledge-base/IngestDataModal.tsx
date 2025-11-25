"use client";

import { useState, useRef } from 'react';
import { X, Loader2, Upload, Link as LinkIcon, FileText, FileSpreadsheet } from 'lucide-react';
import { pythonRagService } from '@/services/pythonRag.service';
import { toast } from '@/lib/toast';

interface IngestDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionName: string;
}

export function IngestDataModal({ isOpen, onClose, collectionName }: IngestDataModalProps) {
  const [urlLinks, setUrlLinks] = useState('');
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [excelFiles, setExcelFiles] = useState<File[]>([]);
  const [isIngesting, setIsIngesting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

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

    // Validate at least one data source
    if (!urlLinks.trim() && pdfFiles.length === 0 && excelFiles.length === 0) {
      toast.error('Please provide at least one data source (URLs, PDFs, or Excel files)');
      return;
    }

    setIsIngesting(true);
    setUploadProgress(0);

    try {
      const response = await pythonRagService.ingestData(
        {
          collection_name: collectionName,
          url_links: urlLinks.trim() || undefined,
          pdf_files: pdfFiles.length > 0 ? pdfFiles : undefined,
          excel_files: excelFiles.length > 0 ? excelFiles : undefined
        },
        (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        }
      );

      if (response.status === 'success') {
        toast.success('Data ingested successfully!');
        
        // Reset form
        setUrlLinks('');
        setPdfFiles([]);
        setExcelFiles([]);
        if (pdfInputRef.current) pdfInputRef.current.value = '';
        if (excelInputRef.current) excelInputRef.current.value = '';
        
        onClose();
      } else {
        toast.error(response.message || 'Failed to ingest data');
      }
    } catch (error: any) {
      console.error('Failed to ingest data:', error);
      toast.error(error.message || 'Failed to connect to RAG service. Please check if the Python service is accessible at https://keplerov1-python-production.up.railway.app.');
    } finally {
      setIsIngesting(false);
      setUploadProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl p-6 m-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Ingest Data</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Collection: <span className="text-primary font-medium">{collectionName}</span>
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
                value={urlLinks}
                onChange={(e) => setUrlLinks(e.target.value)}
                placeholder="Enter URLs separated by commas&#10;Example: https://example.com, https://example.com/about"
                rows={3}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                disabled={isIngesting}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Comma-separated URLs to scrape and ingest
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
                  You can select multiple PDF files
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
                  Supports .xlsx, .xls, .csv files
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

            {/* Upload Progress */}
            {isIngesting && uploadProgress > 0 && (
              <div className="bg-secondary border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Uploading...</span>
                  <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-secondary-foreground/20 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
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
              disabled={isIngesting || (!urlLinks.trim() && pdfFiles.length === 0 && excelFiles.length === 0)}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isIngesting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isIngesting ? 'Ingesting...' : 'Ingest Data'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

