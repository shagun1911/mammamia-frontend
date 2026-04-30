"use client";

import { useState, useRef } from "react";
import { Upload, Download, Phone, FileText } from "lucide-react";
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

const BATCH_UPLOAD_MAX_RECIPIENTS = 10_000;

const FIRST_NAME_HEADERS = new Set(["first_name", "firstname", "fname", "given_name"]);
const LAST_NAME_HEADERS = new Set([
  "last_name",
  "lastname",
  "lname",
  "surname",
  "family_name",
  "cognome",
]);

function normalizeSpreadsheetHeader(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function headerColumnIndices(headersNorm: string[]) {
  const phoneNumberIndex = headersNorm.findIndex((h) => h === "phone_number" || h === "phone");
  let nameIndex = headersNorm.findIndex((h) => h === "name" || h === "full_name" || h === "fullname");
  let firstNameIndex = headersNorm.findIndex((h) => FIRST_NAME_HEADERS.has(h));
  let lastNameIndex = headersNorm.findIndex((h) => LAST_NAME_HEADERS.has(h));
  const nomeIdx = headersNorm.findIndex((h) => h === "nome");
  const cognomeIdx = headersNorm.findIndex((h) => h === "cognome");

  // Italian "Nome" + "Cognome" pair (only when English split columns are absent)
  if (firstNameIndex === -1 && lastNameIndex === -1 && nomeIdx !== -1 && cognomeIdx !== -1) {
    firstNameIndex = nomeIdx;
    lastNameIndex = cognomeIdx;
  } else if (nameIndex === -1 && nomeIdx !== -1 && cognomeIdx === -1) {
    // Single "Nome" column often holds the full display name
    nameIndex = nomeIdx;
  }

  const emailIndex = headersNorm.findIndex((h) => h === "email");
  return { phoneNumberIndex, nameIndex, firstNameIndex, lastNameIndex, emailIndex };
}

function displayNameFromRow(
  row: any[],
  nameIndex: number,
  firstNameIndex: number,
  lastNameIndex: number
): string {
  const hasSplit = firstNameIndex !== -1 || lastNameIndex !== -1;
  const first = firstNameIndex !== -1 ? String(row[firstNameIndex] ?? "").trim() : "";
  const last = lastNameIndex !== -1 ? String(row[lastNameIndex] ?? "").trim() : "";
  const combined = [first, last].filter(Boolean).join(" ").trim();
  if (hasSplit && combined) return combined;
  if (nameIndex !== -1) {
    const n = String(row[nameIndex] ?? "").trim();
    if (n) return n;
  }
  if (combined) return combined;
  return "";
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
    const headers = [
      "first_name",
      "last_name",
      "name",
      "email",
      "phone_number",
      "customer_name",
      "customer_email",
      "customer_phone_number",
    ];
    const sampleData = [
      ["John", "Doe", "John Doe", "john.doe@example.com", "15551234567", "John Doe", "john.doe@example.com", "15551234567"],
      ["Jane", "Smith", "Jane Smith", "jane.smith@example.com", "15559876543", "Jane Smith", "jane.smith@example.com", "15559876543"],
    ];

    // Create Excel file using xlsx library
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Recipients");

    // Generate Excel file
    XLSX.writeFile(workbook, "batch_call_template.xlsx");
    toast.success("Template downloaded (Excel format)");
  };

  // Ensure a phone number always starts with '+'.
  // Strips non-digit characters (except a leading +), then prepends '+' if missing.
  const normalizePhone = (raw: string): string => {
    const trimmed = raw.trim().replace(/^"|"$/g, "");
    if (!trimmed) return trimmed;
    // Keep only digits and a leading +
    const cleaned = trimmed.startsWith("+")
      ? "+" + trimmed.slice(1).replace(/\D/g, "")
      : trimmed.replace(/\D/g, "");
    if (!cleaned) return trimmed; // fallback: return original if nothing is left
    return cleaned.startsWith("+") ? cleaned : "+" + cleaned;
  };

  // Detect delimiter from the header line (comma, semicolon, or tab).
  // Italian/European Excel exports use semicolons because comma is the decimal separator.
  const detectDelimiter = (headerLine: string): string => {
    const commas    = (headerLine.match(/,/g)  || []).length;
    const semicolons = (headerLine.match(/;/g) || []).length;
    const tabs      = (headerLine.match(/\t/g) || []).length;
    if (semicolons > commas && semicolons >= tabs) return ";";
    if (tabs > commas && tabs > semicolons) return "\t";
    return ",";
  };

  // Parse a single CSV line handling quoted fields (e.g. "Smith, John", "+123").
  // Accepts an optional delimiter so semicolon/tab CSVs are handled correctly.
  const parseCSVLine = (line: string, delimiter: string = ","): string[] => {
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
        } else if (line.startsWith(delimiter, i)) {
          result.push(current.trim());
          current = "";
          i += delimiter.length - 1;
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

            const headersNorm = (jsonData[0] || []).map((h: any) => normalizeSpreadsheetHeader(h));
            const idx = headerColumnIndices(headersNorm);

            if (idx.phoneNumberIndex === -1) {
              reject(new Error("File must contain a 'phone_number' (or 'phone') column"));
              return;
            }
            const hasNameCol = idx.nameIndex !== -1;
            const hasSplitName = idx.firstNameIndex !== -1 || idx.lastNameIndex !== -1;
            if (!hasNameCol && !hasSplitName) {
              reject(
                new Error(
                  "File must include a 'name' column (or 'first_name' / 'last_name' columns) together with phone"
                )
              );
              return;
            }

            const parsedRecipients: Recipient[] = [];
            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i] || [];
              const phone = normalizePhone(String(row[idx.phoneNumberIndex] || ""));
              const name = displayNameFromRow(row, idx.nameIndex, idx.firstNameIndex, idx.lastNameIndex);

              if (phone && name) {
                const recipient: Recipient = {
                  phone_number: phone,
                  name,
                  ...(idx.emailIndex !== -1 &&
                    row[idx.emailIndex] && { email: String(row[idx.emailIndex]).trim() }),
                };

                headersNorm.forEach((header, index) => {
                  if (
                    index !== idx.phoneNumberIndex &&
                    index !== idx.nameIndex &&
                    index !== idx.firstNameIndex &&
                    index !== idx.lastNameIndex &&
                    index !== idx.emailIndex &&
                    row[index]
                  ) {
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

            // Auto-detect delimiter (handles Italian/European CSVs that use semicolons)
            const delimiter = detectDelimiter(lines[0]);

            const headersNorm = parseCSVLine(lines[0], delimiter).map((h) =>
              normalizeSpreadsheetHeader(h.replace(/^"|"$/g, ""))
            );
            const idx = headerColumnIndices(headersNorm);

            if (idx.phoneNumberIndex === -1) {
              reject(
                new Error(
                  `File must contain a 'phone_number' (or 'phone') column. Detected columns: ${headersNorm.join(", ") || "(none — check delimiter)"}`
                )
              );
              return;
            }
            const hasNameCol = idx.nameIndex !== -1;
            const hasSplitName = idx.firstNameIndex !== -1 || idx.lastNameIndex !== -1;
            if (!hasNameCol && !hasSplitName) {
              reject(
                new Error(
                  `File must include a 'name' column or 'first_name' / 'last_name' columns. Detected: ${headersNorm.join(", ") || "(none)"}`
                )
              );
              return;
            }

            const parsedRecipients: Recipient[] = [];
            for (let i = 1; i < lines.length; i++) {
              const values = parseCSVLine(lines[i], delimiter);
              const phone = normalizePhone(values[idx.phoneNumberIndex] ?? "");
              const rowAsArray = values.map((v) => v?.trim().replace(/^"|"$/g, "") ?? "");
              const name = displayNameFromRow(rowAsArray, idx.nameIndex, idx.firstNameIndex, idx.lastNameIndex);
              if (phone && name) {
                const recipient: Recipient = {
                  phone_number: phone,
                  name,
                  ...(idx.emailIndex !== -1 &&
                    values[idx.emailIndex]?.trim() && {
                      email: values[idx.emailIndex].trim().replace(/^"|"$/g, ""),
                    }),
                };
                headersNorm.forEach((header, index) => {
                  if (
                    index !== idx.phoneNumberIndex &&
                    index !== idx.nameIndex &&
                    index !== idx.firstNameIndex &&
                    index !== idx.lastNameIndex &&
                    index !== idx.emailIndex &&
                    values[index]?.trim()
                  ) {
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
      if (parsedRecipients.length > BATCH_UPLOAD_MAX_RECIPIENTS) {
        toast.error(
          `This file has ${parsedRecipients.length.toLocaleString()} recipients. The maximum allowed is ${BATCH_UPLOAD_MAX_RECIPIENTS.toLocaleString()}.`
        );
        setRecipients([]);
        return;
      }
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

  // Helper function to extract variables from text (e.g., {{name}}, {{email}})
  const extractVariables = (text: string): string[] => {
    if (!text) return [];
    const variablePattern = /\{\{(\w+)\}\}/g;
    const variables: string[] = [];
    let match;
    while ((match = variablePattern.exec(text)) !== null) {
      const varName = match[1].toLowerCase(); // Normalize to lowercase
      if (!variables.includes(varName)) {
        variables.push(varName);
      }
    }
    return variables;
  };

  // Helper function to extract variables from greeting message (e.g., {{name}}, {{email}})
  // Kept for backward compatibility
  const extractVariablesFromGreeting = (greetingMessage: string): string[] => {
    return extractVariables(greetingMessage);
  };

  // Extract all required variables from selected agent
  const getRequiredVariables = (): string[] => {
    if (!selectedAgentId) return [];
    const selectedAgent = agents.find(agent => agent._id === selectedAgentId);
    if (!selectedAgent) return [];
    
    const firstMessageVars = extractVariables(selectedAgent.first_message || '');
    const systemPromptVars = extractVariables(selectedAgent.system_prompt || '');
    
    // Combine and deduplicate
    const allVars = [...firstMessageVars, ...systemPromptVars];
    return Array.from(new Set(allVars)).sort();
  };

  // Helper function to map CSV/XLS columns to dynamic_variables
  // Includes ALL non-standard columns as dynamic_variables (not just those in first_message)
  // CRITICAL FIX: Always includes BOTH formats (e.g., "name" AND "customer_name") to support any variable format in agent greeting
  const mapColumnsToDynamicVariables = (recipient: Recipient, greetingVariables: string[]): Record<string, any> => {
    const dynamicVars: Record<string, any> = {};

    // Get all column names from the recipient (excluding standard fields)
    const recipientKeys = Object.keys(recipient).filter(
      key => key !== 'phone_number' && key !== 'name' && key !== 'email' && key !== 'dynamic_variables'
    );

    // First, map greeting variables to CSV/XLS columns (use variable name from first_message)
    greetingVariables.forEach(varName => {
      // Try exact match first (case-insensitive)
      const matchingKey = recipientKeys.find(
        key => key.toLowerCase() === varName.toLowerCase()
      );

      if (matchingKey && recipient[matchingKey] !== undefined && recipient[matchingKey] !== null && recipient[matchingKey] !== '') {
        // Use the variable name from first_message (e.g., "appointment") not the CSV column name
        dynamicVars[varName] = String(recipient[matchingKey]).trim();
      }
    });

    // Then, include ALL other columns that aren't standard fields
    // This ensures we capture all dynamic data from CSV/XLS, even if not in first_message
    recipientKeys.forEach(key => {
      const isAlreadyMapped = greetingVariables.some(
        varName => varName.toLowerCase() === key.toLowerCase()
      );
      // Include all non-standard columns, even if not in first_message
      if (!isAlreadyMapped && recipient[key] !== undefined && recipient[key] !== null && recipient[key] !== '') {
        dynamicVars[key] = String(recipient[key]).trim();
      }
    });

    // 🔥 CRITICAL FIX: Add BOTH variable formats to support ANY greeting variable format
    // This prevents calls from dropping when using {{name}} vs {{customer_name}}

    // If we have "name" from recipient, add standard aliases
    if (recipient.name && recipient.name !== '') {
      const trimmed = String(recipient.name).trim();
      dynamicVars.name = trimmed;
      dynamicVars.customer_name = trimmed;
      dynamicVars['contact.name'] = trimmed;
      dynamicVars.full_name = trimmed;
    }

    // If we have "email" from recipient, add standard aliases
    if (recipient.email && recipient.email !== '') {
      dynamicVars.email = String(recipient.email).trim();
      dynamicVars.customer_email = String(recipient.email).trim();
      dynamicVars['contact.email'] = String(recipient.email).trim();
    }

    // If we have "phone_number" from recipient, add standard aliases
    if (recipient.phone_number && recipient.phone_number !== '') {
      dynamicVars.phone = String(recipient.phone_number).trim();
      dynamicVars.phone_number = String(recipient.phone_number).trim();
      dynamicVars.customer_phone_number = String(recipient.phone_number).trim();
      dynamicVars['contact.phone_number'] = String(recipient.phone_number).trim();
    }

    // Also check if CSV has customer_* or contact.* columns and normalize them
    if (dynamicVars.customer_name && !dynamicVars.name) {
      dynamicVars.name = dynamicVars.customer_name;
      dynamicVars['contact.name'] = dynamicVars.customer_name;
      dynamicVars.full_name = dynamicVars.customer_name;
    }
    if (dynamicVars.customer_email && !dynamicVars.email) {
      dynamicVars.email = dynamicVars.customer_email;
      dynamicVars['contact.email'] = dynamicVars.customer_email;
    }
    if (dynamicVars.customer_phone_number && !dynamicVars.phone) {
      dynamicVars.phone = dynamicVars.customer_phone_number;
      dynamicVars.phone_number = dynamicVars.customer_phone_number;
      dynamicVars['contact.phone_number'] = dynamicVars.customer_phone_number;
    }

    console.log('[BatchCallBuilder] 🔥 Final dynamic_variables (with all formats):', dynamicVars);

    return dynamicVars;
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

    if (recipients.length > BATCH_UPLOAD_MAX_RECIPIENTS) {
      toast.error(
        `A batch can include at most ${BATCH_UPLOAD_MAX_RECIPIENTS.toLocaleString()} recipients. Reduce the list and try again.`
      );
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
      // Extract variables from agent's first_message
      const firstMessage = selectedAgent.first_message || '';
      const greetingVariables = extractVariablesFromGreeting(firstMessage);

      console.log('[BatchCallBuilder] Agent first message:', firstMessage);
      console.log('[BatchCallBuilder] Extracted variables from first message:', greetingVariables);

      const payload: any = {
        agent_id: selectedAgent.agent_id,
        call_name: batchName,
        recipients: recipients.map(r => {
          // Map CSV/XLS columns to dynamic_variables
          // This includes ALL non-standard columns, mapped to first_message variables if they match
          const dynamicVars = mapColumnsToDynamicVariables(r, greetingVariables);

          const recipient: any = {
            phone_number: r.phone_number,
            name: r.name
          };

          if (r.email) {
            recipient.email = r.email;
          }

          // ALWAYS add dynamic_variables if any exist (even if empty, but we check length > 0)
          // This ensures all CSV/XLS columns beyond name, phone_number, email are included
          if (Object.keys(dynamicVars).length > 0) {
            recipient.dynamic_variables = dynamicVars;
            console.log('[BatchCallBuilder] ✅ Mapped dynamic_variables for recipient:', {
              name: r.name,
              phone: r.phone_number,
              email: r.email,
              dynamic_variables: dynamicVars,
              greeting_variables: greetingVariables
            });
          } else {
            console.log('[BatchCallBuilder] ⚠️  No dynamic_variables found for recipient:', {
              name: r.name,
              phone: r.phone_number,
              recipient_keys: Object.keys(r),
              greeting_variables: greetingVariables
            });
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
        sender_email: payload.sender_email || 'not provided',
        greeting_variables: greetingVariables
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
              
              {/* Dynamic Variables Info */}
              {selectedAgentId && (() => {
                const requiredVars = getRequiredVariables();
                if (requiredVars.length === 0) return null;
                
                return (
                  <div className="mt-3 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">
                          Required CSV/XLS Columns
                        </h4>
                        <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mb-2">
                          Your CSV/XLS file must include these column names (exact match, case-insensitive) to populate the dynamic variables used in this agent's first message and system prompt:
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {requiredVars.map((varName) => (
                            <span
                              key={varName}
                              className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-500/20 border border-blue-500/40 text-xs font-mono text-blue-700 dark:text-blue-300"
                            >
                              {varName}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-2">
                          <strong>Note:</strong> Column names in your CSV/XLS should match these variable names exactly (e.g., if the agent uses <code className="bg-blue-500/20 px-1 rounded">{"{{name}}"}</code>, your CSV should have a column named <code className="bg-blue-500/20 px-1 rounded">name</code>).
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* File Upload Section */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Recipients <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Include a <strong>phone_number</strong> column (or <strong>phone</strong>). For each contact&apos;s display name in Conversations, use either a single <strong>name</strong> column or both <strong>first_name</strong> and <strong>last_name</strong> (they are joined into a full name). Optional: <strong>email</strong>, <strong>customer_name</strong>, <strong>customer_email</strong>, <strong>customer_phone_number</strong>.
              </p>
              <p className="text-xs text-amber-600/90 dark:text-amber-400/90 mb-3">
                Each file can include at most {BATCH_UPLOAD_MAX_RECIPIENTS.toLocaleString()} recipients. Larger lists must be split into multiple batches.
              </p>

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
                The <strong>phone_number</strong> column is required, plus either <strong>name</strong> or <strong>first_name</strong> / <strong>last_name</strong>. Use the same header spelling as below (case-insensitive).
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-background">
                      <th className="border border-border px-2 py-1 text-left text-foreground">first_name</th>
                      <th className="border border-border px-2 py-1 text-left text-foreground">last_name</th>
                      <th className="border border-border px-2 py-1 text-left text-foreground">name</th>
                      <th className="border border-border px-2 py-1 text-left text-foreground">email</th>
                      <th className="border border-border px-2 py-1 text-left text-foreground">phone_number</th>
                      <th className="border border-border px-2 py-1 text-left text-foreground">customer_name</th>
                      <th className="border border-border px-2 py-1 text-left text-foreground">customer_email</th>
                      <th className="border border-border px-2 py-1 text-left text-foreground">customer_phone_number</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-border px-2 py-1 text-foreground">John</td>
                      <td className="border border-border px-2 py-1 text-foreground">Doe</td>
                      <td className="border border-border px-2 py-1 text-foreground">John Doe</td>
                      <td className="border border-border px-2 py-1 text-foreground">john.doe@example.com</td>
                      <td className="border border-border px-2 py-1 text-foreground">15551234567</td>
                      <td className="border border-border px-2 py-1 text-foreground">John Doe</td>
                      <td className="border border-border px-2 py-1 text-foreground">john.doe@example.com</td>
                      <td className="border border-border px-2 py-1 text-foreground">15551234567</td>
                    </tr>
                    <tr>
                      <td className="border border-border px-2 py-1 text-foreground">Jane</td>
                      <td className="border border-border px-2 py-1 text-foreground">Smith</td>
                      <td className="border border-border px-2 py-1 text-foreground">Jane Smith</td>
                      <td className="border border-border px-2 py-1 text-foreground">jane.smith@example.com</td>
                      <td className="border border-border px-2 py-1 text-foreground">15559876543</td>
                      <td className="border border-border px-2 py-1 text-foreground">Jane Smith</td>
                      <td className="border border-border px-2 py-1 text-foreground">jane.smith@example.com</td>
                      <td className="border border-border px-2 py-1 text-foreground">15559876543</td>
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
