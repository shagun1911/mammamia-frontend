"use client";

import { useState, useRef } from "react";
import { Upload, Download, X, Phone, FileText } from "lucide-react";
import { usePhoneNumbersList } from "@/hooks/usePhoneNumber";
import { useAgents } from "@/hooks/useAgents";
import { useSubmitBatchCall } from "@/hooks/useBatchCalling";
import { useSocialIntegrationsStatus } from "@/hooks/useSocialIntegrationsStatus";
import { useOutboundCall } from "@/hooks/useSipTrunk";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

interface BatchCallBuilderProps {
  onClose: () => void;
  onSuccess?: () => void;
}

interface Recipient {
  phone_number: string;
  name: string;
  email?: string;
  [key: string]: any; // For dynamic variables
}

export function BatchCallBuilder({ onClose, onSuccess }: BatchCallBuilderProps) {
  const { data: phoneNumbers } = usePhoneNumbersList();
  const outboundPhoneNumbers = phoneNumbers?.filter(phone => phone.supports_outbound === true) || [];
  const { data: agents = [], isLoading: isLoadingAgents } = useAgents();
  const { integrations } = useSocialIntegrationsStatus();
  const submitBatchCallMutation = useSubmitBatchCall();
  const outboundCallMutation = useOutboundCall();

  const [batchName, setBatchName] = useState("");
  const [selectedPhoneNumberId, setSelectedPhoneNumberId] = useState<string>("");
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isTestingCall, setIsTestingCall] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState("");
  const [testCustomerName, setTestCustomerName] = useState("");
  const [testCustomerEmail, setTestCustomerEmail] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate CSV template (works for both CSV and Excel)
  const downloadTemplate = () => {
    const headers = ["name", "phone_number", "email", "language"];
    const sampleData = [
      ["Nev", "+3838310429", "nev@example.com", "en"],
      ["Antoni", "+3838310429", "antoni@example.com", "pl"],
      ["Thor", "+3838310429", "thor@example.com", "de"]
    ];

    // Create Excel file using xlsx library
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Recipients");
    
    // Generate Excel file
    XLSX.writeFile(workbook, "batch_call_template.xlsx");
    toast.success("Template downloaded (Excel format)");
  };

  // Parse a single CSV line handling quoted fields (e.g. "Smith, John", "+123")
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQuotes) {
        if (c === '"') {
          if (line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += c;
        }
      } else {
        if (c === '"') {
          inQuotes = true;
        } else if (c === ",") {
          result.push(current.trim());
          current = "";
        } else {
          current += c;
        }
      }
    }
    result.push(current.trim());
    return result;
  };

  // Parse CSV/Excel file (handles BOM, CRLF/LF, quoted fields, and Excel formats)
  const parseFile = async (file: File): Promise<Recipient[]> => {
    return new Promise((resolve, reject) => {
      const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      const isExcel = fileExtension === ".xls" || fileExtension === ".xlsx";

      if (isExcel) {
        // Parse Excel file
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: "array" });
            
            // Get the first sheet
            const firstSheetName = workbook.SheetNames[0];
            if (!firstSheetName) {
              reject(new Error("Excel file must contain at least one sheet"));
              return;
            }
            
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }) as any[][];
            
            if (jsonData.length < 2) {
              reject(new Error("File must contain at least a header row and one data row"));
              return;
            }

            // Parse header
            const headers = (jsonData[0] || []).map((h: any) => String(h).trim().toLowerCase());
            const phoneNumberIndex = headers.findIndex((h: string) => h === "phone_number" || h === "phone");
            const nameIndex = headers.findIndex((h: string) => h === "name");
            const emailIndex = headers.findIndex((h: string) => h === "email");

            if (phoneNumberIndex === -1 || nameIndex === -1) {
              reject(new Error("File must contain 'phone_number' (or 'phone') and 'name' columns"));
              return;
            }

            const parsedRecipients: Recipient[] = [];
            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i] || [];
              const phone = String(row[phoneNumberIndex] || "").trim();
              const name = String(row[nameIndex] || "").trim();
              
              if (phone && name) {
                const recipient: Recipient = {
                  phone_number: phone,
                  name,
                  ...(emailIndex !== -1 && row[emailIndex] && { email: String(row[emailIndex]).trim() })
                };
                
                // Add any other columns as dynamic variables
                headers.forEach((header, index) => {
                  if (index !== phoneNumberIndex && index !== nameIndex && index !== emailIndex && row[index]) {
                    recipient[header] = String(row[index]).trim();
                  }
                });
                
                parsedRecipients.push(recipient);
              }
            }

            if (parsedRecipients.length === 0) {
              reject(new Error("No valid recipients found in file"));
              return;
            }

            resolve(parsedRecipients);
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Parse failed";
            reject(new Error(`Failed to parse Excel file: ${message}`));
          }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsArrayBuffer(file);
      } else {
        // Parse CSV file
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            let text = (e.target?.result as string) ?? "";
            // Strip BOM (Excel and some editors add UTF-8 BOM)
            text = text.replace(/^\uFEFF/, "");
            // Normalize line endings to \n
            text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
            const lines = text.split("\n").filter((line) => line.trim());
            if (lines.length < 2) {
              reject(new Error("File must contain at least a header row and one data row"));
              return;
            }

            // Parse header with quoted-field support
            const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ""));
            const phoneNumberIndex = headers.findIndex((h) => h === "phone_number" || h === "phone");
            const nameIndex = headers.findIndex((h) => h === "name");
            const emailIndex = headers.findIndex((h) => h === "email");

            if (phoneNumberIndex === -1 || nameIndex === -1) {
              reject(new Error("File must contain 'phone_number' (or 'phone') and 'name' columns"));
              return;
            }

            const parsedRecipients: Recipient[] = [];
            for (let i = 1; i < lines.length; i++) {
              const values = parseCSVLine(lines[i]);
              const phone = values[phoneNumberIndex]?.trim().replace(/^"|"$/g, "") ?? "";
              const name = values[nameIndex]?.trim().replace(/^"|"$/g, "") ?? "";
              if (phone && name) {
                const recipient: Recipient = {
                  phone_number: phone,
                  name,
                  ...(emailIndex !== -1 && values[emailIndex]?.trim() && { email: values[emailIndex].trim().replace(/^"|"$/g, "") })
                };
                headers.forEach((header, index) => {
                  if (index !== phoneNumberIndex && index !== nameIndex && index !== emailIndex && values[index]?.trim()) {
                    recipient[header] = values[index].trim().replace(/^"|"$/g, "");
                  }
                });
                parsedRecipients.push(recipient);
              }
            }

            if (parsedRecipients.length === 0) {
              reject(new Error("No valid recipients found in file"));
              return;
            }

            resolve(parsedRecipients);
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Parse failed";
            reject(new Error(`Failed to parse CSV file: ${message}`));
          }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsText(file, "UTF-8");
      }
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type - accept both CSV and Excel files
    const validExtensions = [".csv", ".xls", ".xlsx"];
    const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(fileExtension)) {
      toast.error("Please upload a CSV or Excel file (.csv, .xls, or .xlsx)");
      return;
    }

    // Validate file size (25MB max)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      toast.error("File size must be less than 25MB");
      return;
    }

    setIsUploading(true);
    try {
      const parsedRecipients = await parseFile(file);
      setRecipients(parsedRecipients);
      toast.success(`Successfully loaded ${parsedRecipients.length} recipient${parsedRecipients.length !== 1 ? 's' : ''}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to parse file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleTestCall = async () => {
    if (!testPhoneNumber.trim() || !testCustomerName.trim()) {
      toast.error("Please enter phone number and customer name");
      return;
    }

    if (!selectedAgentId || !selectedPhoneNumberId) {
      toast.error("Please select an agent and phone number");
      return;
    }

    const selectedAgent = agents.find(agent => agent._id === selectedAgentId);
    if (!selectedAgent || !selectedAgent.agent_id) {
      toast.error("Selected agent not found");
      return;
    }

    // Get sender email from Gmail integration
    let senderEmail = '';
    if (integrations.gmail?.status === 'connected') {
      senderEmail = integrations.gmail.credentials?.email || integrations.gmail.metadata?.email || '';
    }

    setIsTestingCall(true);
    try {
      await outboundCallMutation.mutateAsync({
        agent_id: selectedAgent.agent_id,
        agent_phone_number_id: selectedPhoneNumberId,
        to_number: testPhoneNumber,
        customer_info: {
          name: testCustomerName,
          ...(testCustomerEmail.trim() && { email: testCustomerEmail })
        },
        ...(senderEmail && { sender_email: senderEmail })
      });
      toast.success("Test call initiated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to initiate test call");
    } finally {
      setIsTestingCall(false);
    }
  };

  const handleSubmitBatchCall = async () => {
    if (!batchName.trim()) {
      toast.error("Please enter a batch name");
      return;
    }

    if (!selectedAgentId || !selectedPhoneNumberId) {
      toast.error("Please select an agent and phone number");
      return;
    }

    if (recipients.length === 0) {
      toast.error("Please upload a file with recipients");
      return;
    }

    // Validate recipients
    const invalidRecipients = recipients.filter(r => !r.phone_number || !r.name);
    if (invalidRecipients.length > 0) {
      toast.error(`${invalidRecipients.length} recipient(s) are missing required fields (phone_number or name)`);
      return;
    }

    const selectedAgent = agents.find(agent => agent._id === selectedAgentId);
    if (!selectedAgent || !selectedAgent.agent_id) {
      toast.error("Selected agent not found");
      return;
    }

    // Get sender email from Gmail integration
    let senderEmail = '';
    if (integrations.gmail?.status === 'connected') {
      senderEmail = integrations.gmail.credentials?.email || integrations.gmail.metadata?.email || '';
    }

    // Validate phone_number_id is set
    if (!selectedPhoneNumberId || selectedPhoneNumberId.trim() === '') {
      toast.error("Please select a phone number");
      return;
    }

    try {
      const payload: any = {
        agent_id: selectedAgent.agent_id,
        call_name: batchName,
        recipients: recipients.map(r => {
          // Extract dynamic_variables (any fields that aren't phone_number, name, or email)
          const dynamicVars: Record<string, any> = {};
          Object.keys(r).forEach(key => {
            if (key !== 'phone_number' && key !== 'name' && key !== 'email') {
              dynamicVars[key] = r[key];
            }
          });
          
          const recipient: any = {
            phone_number: r.phone_number,
            name: r.name
          };
          
          if (r.email) {
            recipient.email = r.email;
          }
          
          // Add dynamic_variables if any exist
          if (Object.keys(dynamicVars).length > 0) {
            recipient.dynamic_variables = dynamicVars;
          }
          
          return recipient;
        }),
        retry_count: 0,
        phone_number_id: selectedPhoneNumberId // Always include phone_number_id
      };
      
      // Only add sender_email if it exists
      if (senderEmail) {
        payload.sender_email = senderEmail;
      }
      
      console.log('[BatchCallBuilder] Submitting batch call with payload:', {
        agent_id: payload.agent_id,
        call_name: payload.call_name,
        phone_number_id: payload.phone_number_id,
        recipients_count: payload.recipients.length,
        retry_count: payload.retry_count,
        sender_email: payload.sender_email || 'not provided'
      });
      
      await submitBatchCallMutation.mutateAsync(payload);
      toast.success(`Batch call submitted successfully for ${recipients.length} recipient${recipients.length !== 1 ? 's' : ''}!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit batch call");
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-card border border-border rounded-xl p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Create a batch call</h2>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Batch Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Batch name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="Q1 Customer Outreach"
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Phone Number Selection - Single Select Only */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Source Phone Number <span className="text-red-500">*</span>
                <span className="text-xs text-muted-foreground ml-2">(Select one number for all calls)</span>
              </label>
              <select
                value={selectedPhoneNumberId}
                onChange={(e) => setSelectedPhoneNumberId(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">Select a phone number</option>
                {outboundPhoneNumbers.map((phone) => (
                  <option key={phone.id} value={phone.id}>
                    {phone.label} ({phone.phone_number})
                  </option>
                ))}
              </select>
              {outboundPhoneNumbers.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  No phone numbers with outbound support available. Please import a phone number with outbound capabilities first.
                </p>
              )}
            </div>

            {/* Agent Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Select Agent <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                disabled={isLoadingAgents}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select an agent</option>
                {agents.map((agent) => (
                  <option key={agent._id} value={agent._id}>
                    {agent.name} ({agent.agent_id})
                  </option>
                ))}
              </select>
              {!isLoadingAgents && agents.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  No agents available. Please create an agent first.
                </p>
              )}
            </div>

            {/* File Upload Section */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Recipients <span className="text-red-500">*</span>
              </label>
              
              {/* Upload Area - Accepts both CSV and Excel */}
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleFileUpload}
                  className="hidden"
                  aria-label="Upload recipients file (CSV or Excel)"
                />
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-foreground mb-1">
                  Upload CSV or Excel file (.csv, .xls, or .xlsx)
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  Maximum file size: 25.0 MB
                </p>
                <button
                  type="button"
                  onClick={() => { fileInputRef.current?.click(); }}
                  disabled={isUploading}
                  className="mt-3 px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? "Uploading..." : "Upload File"}
                </button>
              </div>

              {recipients.length > 0 && (
                <div className="mt-3 bg-secondary rounded-lg p-3">
                  <p className="text-sm text-foreground">
                    {recipients.length} recipient{recipients.length !== 1 ? 's' : ''} loaded
                  </p>
                </div>
              )}
            </div>

            {/* Formatting Instructions */}
            <div className="bg-secondary/50 border border-border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-sm font-semibold text-foreground">Formatting</h4>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-3 py-1.5 bg-secondary border border-border rounded-lg text-xs text-foreground hover:bg-secondary/80 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  Template
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                The <strong>phone_number</strong> column is required. You can also pass certain <strong>overrides</strong>. Any other columns will be passed as dynamic variables.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-background">
                      <th className="border border-border px-2 py-1 text-left text-foreground">name</th>
                      <th className="border border-border px-2 py-1 text-left text-foreground">phone_number</th>
                      <th className="border border-border px-2 py-1 text-left text-foreground">language</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-border px-2 py-1 text-foreground">Nev</td>
                      <td className="border border-border px-2 py-1 text-foreground">+3838310429</td>
                      <td className="border border-border px-2 py-1 text-foreground">en</td>
                    </tr>
                    <tr>
                      <td className="border border-border px-2 py-1 text-foreground">Antoni</td>
                      <td className="border border-border px-2 py-1 text-foreground">+3838310429</td>
                      <td className="border border-border px-2 py-1 text-foreground">pl</td>
                    </tr>
                    <tr>
                      <td className="border border-border px-2 py-1 text-foreground">Thor</td>
                      <td className="border border-border px-2 py-1 text-foreground">+3838310429</td>
                      <td className="border border-border px-2 py-1 text-foreground">de</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Test Call Section */}
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold text-foreground mb-3">Test call</h4>
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="tel"
                  value={testPhoneNumber}
                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                  placeholder="Phone number"
                  className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
                <input
                  type="text"
                  value={testCustomerName}
                  onChange={(e) => setTestCustomerName(e.target.value)}
                  placeholder="Customer name"
                  className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
                <input
                  type="email"
                  value={testCustomerEmail}
                  onChange={(e) => setTestCustomerEmail(e.target.value)}
                  placeholder="Email (optional)"
                  className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <button
                onClick={handleTestCall}
                disabled={isTestingCall || !testPhoneNumber.trim() || !testCustomerName.trim() || !selectedAgentId || !selectedPhoneNumberId}
                className="mt-3 px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTestingCall ? "Calling..." : "Test call"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex-shrink-0 border-t border-border bg-background">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitBatchCall}
              disabled={submitBatchCallMutation.isPending || !batchName.trim() || !selectedAgentId || !selectedPhoneNumberId || recipients.length === 0}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitBatchCallMutation.isPending ? "Submitting..." : "Submit a Batch Call"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
