"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Upload, FileText, AlertCircle, CheckCircle, Loader2, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api";

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File) => Promise<{
    importId?: string;
    imported?: number;
    duplicates?: number;
    failed?: number;
    totalRows?: number;
  }>;
  listName?: string;
}
interface ImportStats {
  totalRows: number;
  processedRows: number;
  importedCount: number;
  duplicateCount: number;
  failedCount: number;
  status: 'processing' | 'completed' | 'failed';
}


export function CSVImportModal({ isOpen, onClose, onImport, listName }: CSVImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importId, setImportId] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);

  // Keep ref updated
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const processFile = async (file: File) => {
    const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

    // If it's already a CSV, just use it
    if (fileExtension === ".csv" || file.type === "text/csv") {
      setFile(file);
      setError(null);
      return;
    }

    // If it's an Excel file, convert to CSV
    if (fileExtension === ".xls" || fileExtension === ".xlsx") {
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const csvOutput = XLSX.utils.sheet_to_csv(worksheet);

            // Create a new CSV file
            const csvFile = new File([csvOutput], file.name.replace(/\.[^/.]+$/, "") + ".csv", {
              type: "text/csv",
            });

            setFile(csvFile);
            setError(null);
          } catch (err) {
            console.error("Error converting Excel to CSV:", err);
            setError("Failed to process Excel file. Please try saving as CSV.");
          }
        };
        reader.readAsArrayBuffer(file);
      } catch (err) {
        setError("Failed to read file");
      }
      return;
    }

    setError("Please select a valid CSV or Excel file");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const downloadTemplate = () => {
    const headers = ["name", "email", "phone_number", "customer_name", "customer_email", "customer_phone_number"];
    const sampleData =  [
      ["Shagun", "shagunyadav@gmail.com", "919896949999 ", "Shagun", "shagunyadav@gmail.com", "919896949999"],
      ["Vivek", "josh@gmail.com", "918979145999", "Vivek", "josh@gmail.com", "918979145999"]
    ];

    // Create Excel file using xlsx library
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contacts");

    // Generate Excel file
    XLSX.writeFile(workbook, "contacts_template.xlsx");
  };

  const handleImport = async () => {
    if (!file) {
      setError("Please provide a CSV file");
      return;
    }

    try {
      setImporting(true);
      setError(null);
      setProgress(0);
      setIsCompleted(false);
      const result = await onImport(file);

      // If importId is returned, start polling for progress
      if (result?.importId) {
        setImportId(result.importId);
        // Initialize stats immediately with totalRows from result if available
        // This will be updated by polling, but shows progress bar immediately
        setStats({
          totalRows: result.totalRows || 0,
          processedRows: 0,
          importedCount: 0,
          duplicateCount: 0,
          failedCount: 0,
          status: 'processing'
        });
        // Keep importing state true so polling continues
      } else {
        // Small import completed immediately - show success
        setStats({
          importedCount: result?.imported || 0,
          duplicateCount: result?.duplicates || 0,
          failedCount: result?.failed || 0,
          totalRows: result?.imported || 0,
          processedRows: result?.imported || 0,
          status: 'completed'
        });
        setProgress(100);
        setIsCompleted(true);
        setImporting(false);

        // Auto-close after 3 seconds
        setTimeout(() => {
          onCloseRef.current();
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to import contacts");
      setImporting(false);
    }
  };

  // Poll progress API when importId is available
  useEffect(() => {
    if (!importId) return;

    let isMounted = true;
    let closeTimeoutId: NodeJS.Timeout | null = null;
    let hasCompleted = false;
    let interval: NodeJS.Timeout | null = null;

    const pollProgress = async () => {
      if (!isMounted || hasCompleted) return;

      try {
        const response = await apiClient.get(`/contacts/imports/${importId}`);
        // Handle nested response structure: response.data.data or response.data
        const rawData = response.data?.data || response.data || response;

        if (!isMounted || hasCompleted) return;

        // Extract data with fallbacks - ensure we get numbers, not strings
        const totalRows = Number(rawData.totalRows) || 0;
        const processedRows = Number(rawData.processedRows) || Number(rawData.processed) || 0;
        const importedCount = Number(rawData.importedCount) || Number(rawData.imported) || 0;
        const duplicateCount = Number(rawData.duplicateCount) || Number(rawData.duplicates) || 0;
        const failedCount = Number(rawData.failedCount) || Number(rawData.failed) || 0;
        const status = rawData.status || 'processing';

        // Calculate percentage - ensure we have valid numbers
        const percent = totalRows > 0 && processedRows >= 0
          ? Math.min(100, Math.max(0, Math.round((processedRows / totalRows) * 100)))
          : 0;

        // Always update progress and stats - force update to ensure UI reflects current state
        setProgress(percent);
        setStats({
          totalRows,
          processedRows,
          importedCount,
          duplicateCount,
          failedCount,
          status
        });

        console.log('[CSV Import Modal] Progress update:', {
          percent,
          totalRows,
          processedRows,
          importedCount,
          duplicateCount,
          failedCount,
          status,
          rawData: JSON.stringify(rawData)
        });

        if (status === "completed" || status === "failed") {
          hasCompleted = true;
          setIsCompleted(status === "completed");
          setImporting(false);

          // Final update to ensure 100% is shown
          if (status === "completed") {
            setProgress(100);
            setStats((prev: ImportStats | null) => {
              if (!prev) {
                return {
                  totalRows,
                  processedRows: totalRows,
                  importedCount,
                  duplicateCount,
                  failedCount,
                  status: 'completed' as const
                };
              }
              return {
                ...prev,
                processedRows: totalRows,
                status: 'completed' as const
              };
            });
          }

          // Stop polling
          if (interval) {
            clearInterval(interval);
            interval = null;
          }

          // Auto-close after 3 seconds if completed
          if (status === "completed" && !closeTimeoutId) {
            closeTimeoutId = setTimeout(() => {
              if (isMounted) {
                onCloseRef.current();
              }
            }, 3000);
          }
        }
      } catch (err: any) {
        console.error('[CSV Import Modal] Failed to fetch import progress:', err);
        // Don't stop polling on error, might be temporary
      }
    };

    // Poll immediately, then every 1 second
    pollProgress();
    interval = setInterval(() => {
      pollProgress();
    }, 1000);

    return () => {
      isMounted = false;
      hasCompleted = true;
      if (interval) {
        clearInterval(interval);
      }
      if (closeTimeoutId) {
        clearTimeout(closeTimeoutId);
      }
    };
  }, [importId]);

  const handleClose = useCallback(() => {
    setFile(null);
    setError(null);
    setImporting(false);
    setImportId(null);
    setProgress(0);
    setStats(null);
    setIsCompleted(false);
    onCloseRef.current();
  }, []); // Empty deps - uses ref for onClose

  // Early return AFTER all hooks - this is safe
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-xl w-full max-w-lg mx-4 shadow-2xl border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Import Contacts</h2>
            {listName && (
              <p className="text-sm text-muted-foreground mt-1">Importing to: {listName}</p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={importing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-secondary-foreground mb-2">
              File (CSV or Excel) *
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                file ? "border-green-500 bg-green-500/5" : "border-border hover:border-primary"
              )}
            >
              {file ? (
                <div className="space-y-3">
                  {importing && !isCompleted ? (
                    <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
                  ) : isCompleted ? (
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                  ) : (
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                  )}
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-5 h-5 text-green-500" />
                    <span className="text-green-400 font-medium">{file.name}</span>
                  </div>
                  {!importing && (
                    <button
                      onClick={() => {
                        setFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      disabled={importing}
                    >
                      Change file
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                  <div>
                    <p className="text-foreground font-medium mb-1">
                      Drop your CSV or Excel file here, or{" "}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-primary hover:underline"
                        disabled={importing}
                      >
                        browse
                      </button>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      CSV or Excel file should contain: name, email, phone_number, etc.
                    </p>
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .xls, .xlsx"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Progress Bar - Show immediately when importing starts */}
          {importing && (
            <div className="space-y-4 p-5 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border-2 border-primary/20 shadow-lg">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">
                    Processing Contacts...
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {stats?.processedRows?.toLocaleString() || 0} / {stats?.totalRows?.toLocaleString() || 'Calculating...'} contacts
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-primary">{progress}%</span>
                  <div className="text-xs text-muted-foreground mt-1">
                    {stats?.totalRows && stats?.totalRows > 0 && stats?.processedRows !== undefined
                      ? `${Math.max(0, (stats.totalRows - (stats.processedRows || 0))).toLocaleString()} remaining`
                      : 'Calculating...'}
                  </div>
                </div>
              </div>

              {/* TV Volume Bar Style Progress Bar */}
              <div className="relative">
                <div className="w-full h-6 bg-secondary/80 rounded-full overflow-hidden shadow-inner border border-border/50">
                  <div
                    className="h-full bg-gradient-to-r from-primary via-primary/90 to-primary/80 rounded-full transition-all duration-300 ease-out relative flex items-center justify-end pr-2"
                    style={{ width: `${Math.max(progress, 2)}%`, minWidth: progress > 0 ? '2%' : '0%' }}
                  >
                    {progress > 5 && (
                      <span className="text-[10px] font-bold text-primary-foreground">
                        {progress}%
                      </span>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-60" />
                  </div>
                </div>
                {/* Volume bar style indicators */}
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground">0%</span>
                  <span className="text-[10px] text-muted-foreground">50%</span>
                  <span className="text-[10px] text-muted-foreground">100%</span>
                </div>
              </div>

              {/* Stats Grid */}
              {stats && (
                <div className="grid grid-cols-4 gap-3 pt-2 border-t border-border/50">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {stats.importedCount?.toLocaleString() || 0}
                    </div>
                    <div className="text-[10px] text-muted-foreground">✅ Imported</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground">
                      {stats.totalRows && stats.processedRows
                        ? (stats.totalRows - stats.processedRows).toLocaleString()
                        : '...'}
                    </div>
                    <div className="text-[10px] text-muted-foreground">⏳ Remaining</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                      {stats.duplicateCount?.toLocaleString() || 0}
                    </div>
                    <div className="text-[10px] text-muted-foreground">⚠️ Duplicates</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600 dark:text-red-400">
                      {stats.failedCount?.toLocaleString() || 0}
                    </div>
                    <div className="text-[10px] text-muted-foreground">❌ Failed</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Success Message */}
          {isCompleted && stats && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
              <p className="text-sm text-green-400">
                ✅ Successfully imported {stats.importedCount?.toLocaleString() || 0} contacts!
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* CSV Format Info */}
          <div className="p-4 bg-background rounded-lg border border-border">
            <h4 className="text-sm font-medium text-foreground mb-2">Expected Format:</h4>
            <p className="text-xs text-muted-foreground mb-2">
              Please use the following headers exactly as shown to ensure correct data mapping.
            </p>
            <div className="overflow-x-auto mb-3">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-secondary/50">
                    <th className="border border-border/50 px-2 py-1 text-left">name</th>
                    <th className="border border-border/50 px-2 py-1 text-left">email</th>
                    <th className="border border-border/50 px-2 py-1 text-left">phone_number</th>
                    <th className="border border-border/50 px-2 py-1 text-left">customer_name</th>
                    <th className="border border-border/50 px-2 py-1 text-left">customer_email</th>
                    <th className="border border-border/50 px-2 py-1 text-left">customer_phone_number</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border/50 px-2 py-1">Shagun</td>
                    <td className="border border-border/50 px-2 py-1">shagunyadav@gmail.com</td>
                    <td className="border border-border/50 px-2 py-1">91989694000</td>
                    <td className="border border-border/50 px-2 py-1">Shagun</td>
                    <td className="border border-border/50 px-2 py-1">shagunyadav@gmail.com</td>
                    <td className="border border-border/50 px-2 py-1">91989694000</td>
                  </tr>
                  <tr>
                    <td className="border border-border/50 px-2 py-1">Vivek</td>
                    <td className="border border-border/50 px-2 py-1">josh@gmail.com</td>
                    <td className="border border-border/50 px-2 py-1">91897914000</td>
                    <td className="border border-border/50 px-2 py-1">Vivek</td>
                    <td className="border border-border/50 px-2 py-1">joshspectr8@gmail.com</td>
                    <td className="border border-border/50 px-2 py-1">918979145000</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <button
              onClick={downloadTemplate}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Template
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={importing && !isCompleted}
          >
            {isCompleted ? "Close" : "Cancel"}
          </button>
          <button
            onClick={handleImport}
            disabled={!file || importing}
            className={cn(
              "px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2",
              !file || importing
                ? "bg-gray-700 text-muted-foreground cursor-not-allowed"
                : "bg-primary text-foreground hover:brightness-110"
            )}
          >
            {importing && !isCompleted && <Loader2 className="w-4 h-4 animate-spin" />}
            {importing && !isCompleted ? "Importing..." : isCompleted ? "Completed" : "Import Contacts"}
          </button>
        </div>
      </div>
    </div>
  );
}

