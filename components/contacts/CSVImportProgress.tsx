"use client";

import { useEffect, useState, useRef } from "react";
import { X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";

interface CSVImportProgressProps {
  importId: string | null;
  onComplete?: () => void;
  onClose?: () => void;
}

export function CSVImportProgress({ importId, onComplete, onClose }: CSVImportProgressProps) {
  const [progress, setProgress] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const onCompleteRef = useRef(onComplete);
  
  // Keep ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!importId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchProgress = async () => {
      if (!isMounted) return;
      
      try {
        const response = await apiClient.get(`/contacts/imports/${importId}`);
        const data = response.data?.data || response.data || response;
        
        if (!isMounted) return;
        
        setProgress(data);
        setIsLoading(false);

        // If completed or failed, stop polling
        if (data.status === 'completed' || data.status === 'failed') {
          if (onCompleteRef.current) {
            setTimeout(() => {
              if (isMounted && onCompleteRef.current) {
                onCompleteRef.current();
              }
            }, 2000);
          }
          return;
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Failed to fetch import progress:', err);
        setError(err.message || 'Failed to fetch progress');
        setIsLoading(false);
      }
    };

    // Fetch immediately
    fetchProgress();

    // Poll every 2 seconds if still processing
    const interval = setInterval(() => {
      fetchProgress();
    }, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [importId]);
  
  // Early return AFTER all hooks
  if (!importId) {
    return null;
  }

  if (isLoading && !progress) {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-96 bg-card border border-border rounded-xl shadow-2xl p-6 animate-in slide-in-from-bottom-5">
        <div className="flex items-center gap-3 mb-4">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <h3 className="font-semibold text-foreground">Loading Import Status...</h3>
        </div>
      </div>
    );
  }

  if (error && !progress) {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-96 bg-card border border-border rounded-xl shadow-2xl p-6 animate-in slide-in-from-bottom-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-foreground">Import Error</h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-secondary rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!progress) {
    return null;
  }

  const { status, progress: progressPercent, totalRows, processedRows, importedCount, failedCount, duplicateCount } = progress;
  const remaining = totalRows - processedRows;

  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';
  const isProcessing = status === 'processing';

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 bg-card border border-border rounded-xl shadow-2xl p-6 animate-in slide-in-from-bottom-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {isProcessing && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
          {isCompleted && <CheckCircle2 className="w-5 h-5 text-green-500" />}
          {isFailed && <AlertCircle className="w-5 h-5 text-red-500" />}
          <h3 className="font-semibold text-foreground">
            {isProcessing ? 'Importing Contacts' : isCompleted ? 'Import Completed' : 'Import Failed'}
          </h3>
        </div>
        {(isCompleted || isFailed) && onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {isProcessing && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs font-medium mb-2">
            <span className="text-foreground">Processing...</span>
            <span className="text-primary font-semibold">{Math.round(progressPercent || 0)}%</span>
          </div>
          <div className="w-full h-3 bg-secondary rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-primary via-primary/90 to-primary/80 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
              style={{ width: `${progressPercent || 0}%` }}
            >
              {/* Subtle shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground text-center">
            {processedRows?.toLocaleString() || 0} of {totalRows?.toLocaleString() || 0} rows processed
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-secondary/50 rounded-lg p-3 border border-border">
          <div className="text-xs text-muted-foreground mb-1">Total Rows</div>
          <div className="text-lg font-bold text-foreground">{totalRows?.toLocaleString() || 0}</div>
        </div>

        {isProcessing && (
          <>
            <div className="bg-secondary/50 rounded-lg p-3 border border-border">
              <div className="text-xs text-muted-foreground mb-1">Processed</div>
              <div className="text-lg font-bold text-primary">{processedRows?.toLocaleString() || 0}</div>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 border border-border">
              <div className="text-xs text-muted-foreground mb-1">Remaining</div>
              <div className="text-lg font-bold text-foreground">{remaining?.toLocaleString() || 0}</div>
            </div>
          </>
        )}

        <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
          <div className="text-xs text-green-600 dark:text-green-400 mb-1">✅ Imported</div>
          <div className="text-lg font-bold text-green-600 dark:text-green-400">
            {importedCount?.toLocaleString() || 0}
          </div>
        </div>

        {duplicateCount > 0 && (
          <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
            <div className="text-xs text-yellow-600 dark:text-yellow-400 mb-1">⚠️ Duplicates</div>
            <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
              {duplicateCount?.toLocaleString() || 0}
            </div>
          </div>
        )}

        {failedCount > 0 && (
          <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
            <div className="text-xs text-red-600 dark:text-red-400 mb-1">❌ Failed</div>
            <div className="text-lg font-bold text-red-600 dark:text-red-400">
              {failedCount?.toLocaleString() || 0}
            </div>
          </div>
        )}
      </div>

      {/* Success Message */}
      {isCompleted && (
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-400">
            ✅ Successfully imported {importedCount?.toLocaleString() || 0} contacts!
          </p>
        </div>
      )}

      {/* Error Message */}
      {isFailed && progress.importErrors && progress.importErrors.length > 0 && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400 font-medium mb-1">Errors:</p>
          <ul className="text-xs text-red-600 dark:text-red-400 space-y-1 max-h-32 overflow-y-auto">
            {progress.importErrors.slice(0, 5).map((err: any, idx: number) => (
              <li key={idx}>Row {err.row}: {err.error}</li>
            ))}
            {progress.importErrors.length > 5 && (
              <li className="text-muted-foreground">...and {progress.importErrors.length - 5} more</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
