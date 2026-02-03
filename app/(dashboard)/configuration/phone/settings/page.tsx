"use client";

import { useState, useEffect } from "react";
import axios from "axios"; // Import axios directly
import { ArrowLeft, Copy, Check, ChevronDown, ChevronUp, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePhoneSettings } from "@/hooks/usePhoneSettings";
import { useAIBehavior } from "@/hooks/useAIBehavior";
import { useInboundAgentConfig } from "@/hooks/useInboundAgentConfig";
import { useOutboundAgentConfig } from "@/hooks/useOutboundAgentConfig";
import { useAgents } from "@/hooks/useAgents";
import { useInboundNumbers } from "@/hooks/useInboundNumbers";
import { phoneSettingsService } from "@/services/phoneSettings.service";
import { inboundNumbersService } from "@/services/inboundNumbers.service";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";
import { useCreatePhoneNumber, usePhoneNumbersList } from "@/hooks/usePhoneNumber";
import { useQueryClient } from "@tanstack/react-query";
import { PhoneNumber, phoneNumberService } from "@/services/phoneNumber.service";

export default function PhoneSettingsDetailPage() {
  const router = useRouter();
  const { settings, isLoading, updateSettings, isUpdating } = usePhoneSettings();
  const { aiBehavior } = useAIBehavior();
  const { configs: inboundConfigs, syncConfig, updateConfig, deleteConfig } = useInboundAgentConfig();
  
  // Filter out chatbot configs (empty calledNumber) - these are not real inbound phone numbers
  const realInboundConfigs = inboundConfigs?.filter(config => config.calledNumber && config.calledNumber.trim() !== '') || [];
  const { configs: outboundConfigs, getConfigByNumber, createOrUpdateConfig } = useOutboundAgentConfig();
  const { inboundNumbers: persistedInboundNumbers, isLoading: isLoadingInboundNumbers, addNumbers: addInboundNumbersMutation, removeNumber: removeInboundNumberMutation, clearAll: clearAllInboundMutation } = useInboundNumbers();
  const { data: phoneNumbersList, refetch: refetchPhoneNumbers } = usePhoneNumbersList();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"outbound" | "inbound">("outbound");
  const [isDeletingInbound, setIsDeletingInbound] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedOutboundNumber, setSelectedOutboundNumber] = useState<string | null>(null);

  // Form state
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState(settings?.twilioPhoneNumber || "");
  const [livekitSipTrunkId, setLivekitSipTrunkId] = useState(settings?.livekitSipTrunkId || "");
  const [twilioTrunkSid, setTwilioTrunkSid] = useState(settings?.twilioTrunkSid || "");
  const [terminationUri, setTerminationUri] = useState(settings?.terminationUri || "");
  const [originationUri, setOriginationUri] = useState(settings?.originationUri || "");

  // Setup methods state
  const [showSetupMethods, setShowSetupMethods] = useState(false);
  const [activeSetupMethod, setActiveSetupMethod] = useState<"full" | "generic" | null>(null);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const createPhoneNumber = useCreatePhoneNumber();

  // Full Setup (Method 1) form state
  const [fullSetupLabel, setFullSetupLabel] = useState("");
  const [fullSetupPhone, setFullSetupPhone] = useState("");
  const [fullSetupTwilioSid, setFullSetupTwilioSid] = useState("");
  const [fullSetupTwilioToken, setFullSetupTwilioToken] = useState("");

  // Generic SIP Trunk (Method 2) form state
  const [genericSetupLabel, setGenericSetupLabel] = useState("");
  const [genericSetupPhone, setGenericSetupPhone] = useState("");
  const [genericSetupProvider, setGenericSetupProvider] = useState("sip_trunk");
  const [genericSetupSipAddress, setGenericSetupSipAddress] = useState("");
  const [genericSetupUsername, setGenericSetupUsername] = useState("");
  const [genericSetupPassword, setGenericSetupPassword] = useState("");
  const [genericSetupTransport, setGenericSetupTransport] = useState("auto");
  const [genericSetupMediaEncryption, setGenericSetupMediaEncryption] = useState("allowed");
  const [genericSetupSupportsInbound, setGenericSetupSupportsInbound] = useState(false);
  const [genericSetupSupportsOutbound, setGenericSetupSupportsOutbound] = useState(true);
  const [genericSetupInboundAddress, setGenericSetupInboundAddress] = useState("sip.rtc.elevenlabs.io:5060");
  const [genericSetupInboundUsername, setGenericSetupInboundUsername] = useState("");
  const [genericSetupInboundPassword, setGenericSetupInboundPassword] = useState("");
  
  // Agent selection state for inbound setup
  const [newlyCreatedPhoneNumberId, setNewlyCreatedPhoneNumberId] = useState<string | null>(null);
  const [showAgentSelection, setShowAgentSelection] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [isAssigningAgent, setIsAssigningAgent] = useState(false);

  // Inbound setup state
  const [inboundStep, setInboundStep] = useState(1);
  const [inboundName, setInboundName] = useState("");
  const [inboundPhoneNumbers, setInboundPhoneNumbers] = useState("");
  const [inboundKrispEnabled, setInboundKrispEnabled] = useState(true);
  const [inboundTrunkId, setInboundTrunkId] = useState("");
  const [inboundTrunkName, setInboundTrunkName] = useState("");
  const [inboundConnectedNumbers, setInboundConnectedNumbers] = useState<string[]>([]);
  const [inboundSelectedAgentId, setInboundSelectedAgentId] = useState<string>("");
  const [isCreatingInbound, setIsCreatingInbound] = useState(false);
  
  // Get agents for selection
  const { data: agents = [], isLoading: isLoadingAgents } = useAgents();


  // Edit mode for inbound configs
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Get all phone numbers with their capabilities
  const getPhoneNumbersWithCapabilities = (): PhoneNumber[] => {
    console.log('📞 [getPhoneNumbersWithCapabilities] phoneNumbersList:', phoneNumbersList);
    if (phoneNumbersList && phoneNumbersList.length > 0) {
      return phoneNumbersList;
    }
    
    // Legacy: Add from phone settings and outbound configs (for backward compatibility)
    const legacyNumbers: PhoneNumber[] = [];
    
    if (settings?.twilioPhoneNumber) {
      legacyNumbers.push({
        id: 'legacy-' + settings.twilioPhoneNumber,
        label: 'Legacy Number',
        phone_number: settings.twilioPhoneNumber,
        provider: 'twilio',
        supports_outbound: true,
        supports_inbound: false,
        created_at_unix: Date.now()
      });
    }
    
    if (outboundConfigs && outboundConfigs.length > 0) {
      outboundConfigs.forEach(config => {
        if (config.outboundNumber && !legacyNumbers.find(n => n.phone_number === config.outboundNumber)) {
          legacyNumbers.push({
            id: 'legacy-' + config.outboundNumber,
            label: 'Legacy Number',
            phone_number: config.outboundNumber,
            provider: 'sip',
            supports_outbound: true,
            supports_inbound: false,
            created_at_unix: Date.now()
          });
        }
      });
    }
    
    return legacyNumbers;
  };

  const phoneNumbers = getPhoneNumbersWithCapabilities();
  const availableOutboundNumbers = phoneNumbers
    .filter(pn => pn.supports_outbound)
    .map(pn => pn.phone_number)
    .sort();

  // Auto-select first outbound number
  useEffect(() => {
    if (!selectedOutboundNumber && availableOutboundNumbers.length > 0) {
      setSelectedOutboundNumber(availableOutboundNumbers[0]);
    }
  }, [selectedOutboundNumber, availableOutboundNumbers]);

  // Load config when outbound number is selected
  useEffect(() => {
    console.log('🔄 [Outbound Config] Loading config for:', selectedOutboundNumber);
    console.log('🔄 [Outbound Config] Available configs:', outboundConfigs);
    
    if (selectedOutboundNumber && outboundConfigs) {
      const config = outboundConfigs.find(c => c.outboundNumber === selectedOutboundNumber);
      console.log('🔄 [Outbound Config] Found config:', config);
      
      if (config) {
        // Load config values for THIS specific number
        console.log('✅ [Outbound Config] Loading config values:', {
          voice: config.selectedVoice,
          greeting: config.greetingMessage,
          language: config.language
        });
        // Voice, language, greeting, and escalation are now configured per Agent
        // No need to load these from outbound config
      } else {
        // No config exists for this number
        console.log('ℹ️ [Outbound Config] No config found');
      }
    }
  }, [selectedOutboundNumber, outboundConfigs, settings, aiBehavior]);

  // Hydrate inbound numbers from API (source of truth)
  useEffect(() => {
    if (isLoadingInboundNumbers) return;
    
    if (persistedInboundNumbers && persistedInboundNumbers.length > 0) {
      console.log('✅ [Inbound] Loaded inbound numbers from API:', persistedInboundNumbers);
      setInboundConnectedNumbers(persistedInboundNumbers);
      setInboundPhoneNumbers(persistedInboundNumbers.join(', '));
    } else {
      setInboundConnectedNumbers([]);
      setInboundPhoneNumbers('');
    }
  }, [persistedInboundNumbers, isLoadingInboundNumbers]);

  // Update form state when settings load
  useEffect(() => {
    if (settings) {
      setTwilioPhoneNumber(settings.twilioPhoneNumber || "");
      setLivekitSipTrunkId(settings.livekitSipTrunkId || "");
      setTwilioTrunkSid(settings.twilioTrunkSid || "");
      setTerminationUri(settings.terminationUri || "");
      setOriginationUri(settings.originationUri || "");
    }
  }, [settings]);


  // Note: Voice, language, greeting, and escalation are now configured per Agent
  // This handler is kept for backward compatibility but only saves infrastructure settings
  const handleSaveSettings = async () => {
    try {
      // Save infrastructure settings only (SIP trunk, phone number routing)
      if (twilioPhoneNumber) {
        await updateSettings({
          twilioPhoneNumber,
          livekitSipTrunkId,
          twilioTrunkSid,
          terminationUri,
          originationUri,
        });
        toast.success('Infrastructure settings saved');
      } else {
        toast.info('No phone number configured. Use "Import Number" to add a phone number.');
      }
    } catch (error: any) {
      console.error('❌ [Save Settings] Error:', error);
      toast.error(error.message || 'Failed to save settings');
    }
  };

  const handleDeleteOutboundNumber = async () => {
    if (!confirm("Are you sure you want to delete the outbound number? This will remove all associated configurations.")) {
      return;
    }
    try {
      await updateSettings({
        twilioPhoneNumber: "",
        livekitSipTrunkId: "",
        twilioTrunkSid: "",
        terminationUri: "",
        originationUri: "",
      });
     
    } catch (error: any) {
      toast.error(error.message || "Failed to delete outbound number");
    }
  };

  const handleDeleteInboundNumber = async (phoneNumber: string) => {
    // Prevent double-clicks
    if (isDeletingInbound === phoneNumber) {
      console.warn('⚠️ [Delete Inbound] Delete already in progress for', phoneNumber);
      return;
    }

    if (!confirm(`Are you sure you want to delete ${phoneNumber}? This will permanently remove the inbound configuration and number from the database.`)) {
      return;
    }

    setIsDeletingInbound(phoneNumber);
    try {
      console.log('🗑️ [Delete Inbound] Deleting:', phoneNumber);
      
      let deletedFromNumbers = false;
      let deletedFromConfig = false;
      
      // Try to delete from inbound numbers database (source of truth)
      // If it doesn't exist (404), that's okay - it might have been created before InboundNumber model existed
      try {
        await removeInboundNumberMutation.mutateAsync(phoneNumber);
        deletedFromNumbers = true;
        console.log('✅ [Delete Inbound] Deleted from inbound numbers database');
      } catch (numberError: any) {
        const status = numberError.response?.status || numberError.status;
        if (status === 404) {
          console.warn('⚠️ [Delete Inbound] Number not found in InboundNumber collection (may have been created before model existed), continuing...');
          // Continue - this is okay, the number might only exist in InboundAgentConfig
        } else {
          console.error('❌ [Delete Inbound] Failed to delete from database:', numberError);
          // For non-404 errors, we still want to try deleting from config
        }
      }
      
      // Delete from inbound agent config (this is what shows in UI)
      try {
        await deleteConfig.mutateAsync(phoneNumber);
        deletedFromConfig = true;
        console.log('✅ [Delete Inbound] Deleted from agent config');
      } catch (configError: any) {
        console.error('❌ [Delete Inbound] Failed to delete from agent config:', configError);
        // If we couldn't delete from config, show error
        if (!deletedFromNumbers) {
          const errorMessage = configError.response?.data?.error?.message || configError.response?.data?.message || configError.message || "Failed to delete inbound configuration";
          toast.error(errorMessage);
          setIsDeletingInbound(null);
          return;
        }
      }
      
      // 🔑 CRITICAL: Remove number from PhoneSettings.inboundPhoneNumbers to prevent sync from re-creating it
      if (deletedFromConfig || deletedFromNumbers) {
        try {
          const currentInboundNumbers = settings?.inboundPhoneNumbers || [];
          const updatedInboundNumbers = currentInboundNumbers.filter(num => num !== phoneNumber);
          
          if (updatedInboundNumbers.length !== currentInboundNumbers.length) {
            console.log('🗑️ [Delete Inbound] Removing from PhoneSettings.inboundPhoneNumbers');
            await updateSettings({
              inboundPhoneNumbers: updatedInboundNumbers
            });
            console.log('✅ [Delete Inbound] Removed from PhoneSettings');
          }
        } catch (settingsError: any) {
          console.warn('⚠️ [Delete Inbound] Failed to update PhoneSettings:', settingsError);
          // Continue even if this fails - the config is already deleted
        }
        
        // Sync configs to refresh UI (this will now not re-create the deleted number)
        if (typeof syncConfig.mutateAsync === 'function') {
          try {
            await syncConfig.mutateAsync();
            console.log('✅ [Delete Inbound] Synced configs');
          } catch (syncError: any) {
            console.warn('⚠️ [Delete Inbound] Sync failed:', syncError);
            // Continue even if sync fails
          }
        }
        
        toast.success(`Inbound number ${phoneNumber} deleted successfully`);
      } else {
        toast.error(`Failed to delete inbound number ${phoneNumber}`);
      }
    } catch (error: any) {
      console.error('❌ [Delete Inbound] Unexpected error:', error);
      const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || error.message || "Failed to delete inbound number";
      toast.error(errorMessage);
    } finally {
      setIsDeletingInbound(null);
    }
  };

  const handleCopyNumber = () => {
    if (settings?.twilioPhoneNumber) {
      navigator.clipboard.writeText(settings.twilioPhoneNumber);
      setCopied(true);
      toast.success("Phone number copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };


  // Full Setup - ONLY imports phone number, returns phone_number_id
  // NO SIP setup, NO agent config, NO phone settings update
  const handleFullSetup = async () => {
    if (!fullSetupLabel || !fullSetupPhone || !fullSetupTwilioSid || !fullSetupTwilioToken) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSettingUp(true);
    try {
      console.log('📞 [Phone Import] Importing phone number only...');
      console.log('📋 [Phone Import] Request data:', {
        label: fullSetupLabel,
        phone_number: fullSetupPhone,
        sid: fullSetupTwilioSid,
        token: '***hidden***'
      });

      // 🔴 ONLY CALL THIS ENDPOINT - NO OTHER CALLS
      const result = await createPhoneNumber.mutateAsync({
        label: fullSetupLabel,
        phone_number: fullSetupPhone,
        sid: fullSetupTwilioSid,
        token: fullSetupTwilioToken
      });

      console.log('✅ [Phone Import] Phone number imported:', result);
      console.log('📞 [Phone Import] Phone Number ID:', result.phone_number_id);

      // 🔴 STOP HERE - Just show success, don't call SIP or agent config
      toast.success(`Phone number imported successfully! ID: ${result.phone_number_id}`);

      // Refresh phone numbers list to show the newly imported number
      await refetchPhoneNumbers();

      // Clear form
      setFullSetupLabel("");
      setFullSetupPhone("");
      setFullSetupTwilioSid("");
      setFullSetupTwilioToken("");
      setShowSetupMethods(false);
      setActiveSetupMethod(null);

      // 🔴 NO SIP SETUP, NO AGENT CONFIG, NO PHONE SETTINGS UPDATE
    } catch (error: any) {
      console.error('❌ [Phone Import] Error:', error);
      toast.error(error.message || "Failed to import phone number");
    } finally {
      setIsSettingUp(false);
    }
  };

  // Inbound Setup - Step 1
  const handleCreateInboundTrunk = async () => {
    if (!inboundName || !inboundPhoneNumbers) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsCreatingInbound(true);
    try {
      const phoneNumbersArray = inboundPhoneNumbers.split(',').map(n => n.trim()).filter(Boolean);

      // Validate phone numbers format (E.164)
      const phoneNumberRegex = /^\+[1-9]\d{1,14}$/;
      const invalidNumbers = phoneNumbersArray.filter(num => !phoneNumberRegex.test(num));
      if (invalidNumbers.length > 0) {
        toast.error(`Invalid phone number format: ${invalidNumbers.join(', ')}. Must be in E.164 format (e.g., +1234567890)`);
        setIsCreatingInbound(false);
        return;
      }

      // Check if user has existing inbound setup in their database
      const hasExistingInbound = (settings?.inboundTrunkId && settings.inboundTrunkId.trim() !== '') ||
                                  (persistedInboundNumbers && persistedInboundNumbers.length > 0) ||
                                  (realInboundConfigs && realInboundConfigs.length > 0);
      
      if (hasExistingInbound) {
        toast.error("You already have an inbound setup. Please delete your existing inbound configuration first before creating a new one.");
        setIsCreatingInbound(false);
        return;
      }

      console.log('📞 [Create Inbound Trunk] Request:', {
        name: inboundName,
        phone_numbers: phoneNumbersArray,
        allowed_numbers: phoneNumbersArray, // Set allowed_numbers to match phone_numbers to avoid conflicts
        krisp_enabled: inboundKrispEnabled
      });

      const API_URL = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'https://elvenlabs-voiceagent.onrender.com';
      const response = await fetch(`${API_URL}/calls/create-inbound-trunk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: inboundName,
          phone_numbers: phoneNumbersArray,
          allowed_numbers: phoneNumbersArray, // 🔑 CRITICAL: Set allowed_numbers to avoid trunk conflicts
          krisp_enabled: inboundKrispEnabled,
        }),
      });

      if (!response.ok) {
        let errorMessage = `Failed to create inbound trunk (${response.status})`;
        let existingTrunkIdFromError: string | null = null;
        
        try {
          const err = await response.json();
          console.error('❌ [Create Inbound Trunk] Error response:', err);
          errorMessage = err.detail || err.message || err.error?.message || errorMessage;
          
          // Extract existing trunk ID from conflict error
          // Error format: "Conflicting inbound SIP Trunks: "<new>" and "ST_CckAMki2TTgK", using the same number(s)..."
          if (errorMessage.includes('Conflicting inbound SIP Trunks')) {
            // Try to extract trunk ID after "and "
            const andMatch = errorMessage.match(/and\s+"([A-Za-z0-9_]+)"/);
            if (andMatch && andMatch[1]) {
              existingTrunkIdFromError = andMatch[1];
              console.log('🔍 [Create Inbound Trunk] Found existing trunk ID in error:', existingTrunkIdFromError);
            } else {
              // Fallback: try to find any trunk ID pattern
              const trunkIdMatch = errorMessage.match(/"([A-Za-z0-9_]+)"/g);
              if (trunkIdMatch && trunkIdMatch.length >= 2) {
                // Skip "<new>" and get the actual trunk ID
                for (const match of trunkIdMatch) {
                  const trunkId = match.replace(/"/g, '');
                  if (trunkId !== '<new>') {
                    existingTrunkIdFromError = trunkId;
                    console.log('🔍 [Create Inbound Trunk] Found existing trunk ID in error (fallback):', existingTrunkIdFromError);
                    break;
                  }
                }
              }
            }
          }
          
          // Provide more helpful error messages
          if (response.status === 500) {
            // Check if it's a trunk conflict error
            if (errorMessage.includes('Conflicting inbound SIP Trunks') || errorMessage.includes('without AllowedNumbers set')) {
              // Don't offer to reuse - this trunk belongs to another user or system
              // User should use a different phone number or contact support
              errorMessage = `Phone number conflict: This number "${phoneNumbersArray.join(', ')}" is already registered to another trunk. Please use a different phone number or contact support if you believe this is an error.`;
            } else {
              errorMessage = `Server error: ${errorMessage}. Please check if the Python API is running and accessible.`;
            }
          } else if (response.status === 400) {
            if (errorMessage.includes('Conflicting inbound SIP Trunks') || errorMessage.includes('without AllowedNumbers set')) {
              // Don't offer to reuse - this trunk belongs to another user or system
              errorMessage = `Phone number conflict: This number "${phoneNumbersArray.join(', ')}" is already registered to another trunk. Please use a different phone number or contact support if you believe this is an error.`;
            } else {
              errorMessage = `Invalid request: ${errorMessage}. Please check your input data.`;
            }
          } else if (response.status === 401 || response.status === 403) {
            errorMessage = `Authentication error: ${errorMessage}. Please check your API credentials.`;
          }
        } catch (parseError) {
          console.error('❌ [Create Inbound Trunk] Failed to parse error response:', parseError);
          const text = await response.text();
          console.error('❌ [Create Inbound Trunk] Raw error response:', text);
          errorMessage = `Server returned ${response.status}: ${text.substring(0, 200)}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ [Create Inbound Trunk] Success:', data);
      
      setInboundTrunkId(data.trunk_id);
      setInboundTrunkName(data.trunk_name);
      setInboundConnectedNumbers(data.phone_numbers);
      setInboundStep(2);

      // Persist inbound numbers to database
      if (data.phone_numbers && data.phone_numbers.length > 0 && data.trunk_id) {
        try {
          await addInboundNumbersMutation.mutateAsync({
            phoneNumbers: data.phone_numbers,
            trunkId: data.trunk_id,
            provider: 'livekit'
          });
          await updateSettings({
            inboundTrunkId: data.trunk_id,
            inboundTrunkName: data.trunk_name,
            inboundPhoneNumbers: data.phone_numbers,
          });
        } catch (error: any) {
          console.error('❌ [Create Inbound Trunk] Failed to persist inbound numbers:', error);
          toast.warning('Trunk created but failed to save to database. Please refresh and try again.');
        }
      }

      toast.success("Inbound trunk created successfully!");
    } catch (error: any) {
      console.error('❌ [Create Inbound Trunk] Error:', error);
      toast.error(error.message || "Failed to create inbound trunk");
    } finally {
      setIsCreatingInbound(false);
    }
  };

  // Inbound Setup - Step 2: Assign agent to phone numbers
  const handleAssignAgentToPhoneNumbers = async () => {
    if (!inboundTrunkId) {
      toast.error("Trunk ID missing");
      return;
    }

    if (!inboundSelectedAgentId) {
      toast.error("Please select an agent");
      return;
    }

    setIsCreatingInbound(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'https://elvenlabs-voiceagent.onrender.com';
      
      // Get phone_number_id for each phone number from ElevenLabs API
      const phoneNumberIds: Array<{ phone_number: string; phone_number_id: string | null }> = [];
      
      for (const phone_number of inboundConnectedNumbers) {
        try {
          // Fetch phone numbers from ElevenLabs to get phone_number_id
          const listResponse = await fetch(`${API_URL}/api/v1/phone-numbers`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });

          if (listResponse.ok) {
            const listData = await listResponse.json();
            const phoneNumbers = listData?.phone_numbers || [];
            const matchingNumber = phoneNumbers.find((pn: any) => pn.phone_number === phone_number);
            
            if (matchingNumber?.phone_number_id) {
              phoneNumberIds.push({
                phone_number,
                phone_number_id: matchingNumber.phone_number_id
              });
            } else {
              console.warn(`⚠️ Phone number ${phone_number} not found in ElevenLabs`);
              phoneNumberIds.push({
                phone_number,
                phone_number_id: null
              });
            }
          }
        } catch (error: any) {
          console.error(`❌ Failed to fetch phone number ID for ${phone_number}:`, error);
          phoneNumberIds.push({
            phone_number,
            phone_number_id: null
          });
        }
      }

      // Assign agent to each phone number using PATCH endpoint
      const assignmentResults = [];
      for (const { phone_number, phone_number_id } of phoneNumberIds) {
        if (!phone_number_id) {
          assignmentResults.push({
            phone_number,
            success: false,
            error: 'Phone number ID not found'
          });
          continue;
        }

        try {
          const response = await fetch(`${API_URL}/api/v1/phone-numbers/${encodeURIComponent(phone_number_id)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              agent_id: inboundSelectedAgentId
            }),
          });

          if (response.ok) {
            assignmentResults.push({
              phone_number,
              success: true
            });
          } else {
            const err = await response.json();
            assignmentResults.push({
              phone_number,
              success: false,
              error: err.detail || err.message || 'Failed to assign agent'
            });
          }
        } catch (error: any) {
          assignmentResults.push({
            phone_number,
            success: false,
            error: error.message || 'Failed to assign agent'
          });
        }
      }

      const successful = assignmentResults.filter(r => r.success);
      const failed = assignmentResults.filter(r => !r.success);

      if (failed.length > 0) {
        toast.warning(`Agent assigned to ${successful.length} phone number(s). ${failed.length} failed.`);
      } else {
        toast.success(`Agent assigned to ${successful.length} phone number(s) successfully!`);
      }

      // Persist inbound numbers to database
      if (inboundConnectedNumbers.length > 0 && inboundTrunkId) {
        try {
          await addInboundNumbersMutation.mutateAsync({
            phoneNumbers: inboundConnectedNumbers,
            trunkId: inboundTrunkId,
            provider: 'livekit'
          });
        } catch (error: any) {
          console.error('Failed to persist inbound numbers:', error);
        }
      }

      await updateSettings({
        inboundTrunkId,
        inboundTrunkName,
        inboundPhoneNumbers: inboundConnectedNumbers,
      });

      // ✅ IMPORTANT FIX
      await syncConfig.mutateAsync();

      toast.success("Inbound setup completed successfully!");
      setInboundStep(3);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsCreatingInbound(false);
    }
  };
// Reset inbound setup
const resetInboundSetup = () => {
  setInboundStep(1);
  setInboundName("");
  setInboundPhoneNumbers("");
  setInboundSelectedAgentId("");
  setInboundKrispEnabled(true);
  setInboundTrunkId("");
  setInboundTrunkName("");
  setInboundConnectedNumbers([]);
};

// Handle edit config - Note: Voice, language, greeting are now configured per Agent
const handleEditConfig = (config: any) => {
  console.log('🖊️ [Edit Config] Starting edit for config:', config._id);
  setEditingConfigId(config._id);
};

// Handle cancel edit
const handleCancelEdit = () => {
  console.log('❌ [Edit Config] Canceling edit');
  setEditingConfigId(null);
};

// Handle save config - Note: Voice, language, greeting are now configured per Agent
// Inbound configs only store routing information
const handleSaveConfig = async (config: any) => {
  console.log('💾 [Save Config] Saving config for:', config.calledNumber);
  setIsSavingConfig(true);
  try {
    // Only save infrastructure-related configs
    // Voice, language, greeting are configured per Agent
    const updateData = {
      calledNumber: config.calledNumber,
    };

    await updateConfig.mutateAsync(updateData);
    toast.success('Configuration updated successfully');
    setEditingConfigId(null);
  } catch (error: any) {
    console.error('❌ [Save Config] Error updating config:', error);
    toast.error(error.message || 'Failed to update configuration');
  } finally {
    setIsSavingConfig(false);
  }
};

  // Generic SIP Trunk Setup (Method 2) - ONLY imports phone number, returns phone_number_id
  // NO agent config, NO phone settings update
  const handleGenericSetup = async () => {
    if (!genericSetupLabel || !genericSetupPhone || !genericSetupProvider) {
      toast.error("Please fill in all required fields");
      return;
    }

    // At least one support option must be selected
    if (!genericSetupSupportsInbound && !genericSetupSupportsOutbound) {
      toast.error("Please select at least one support option (Inbound or Outbound)");
      return;
    }

    // Validate outbound config if supports_outbound is true
    if (genericSetupSupportsOutbound && (!genericSetupSipAddress || !genericSetupUsername || !genericSetupPassword)) {
      toast.error("Please fill in all outbound trunk configuration fields when outbound support is enabled");
      return;
    }

    // Validate inbound config if supports_inbound is true
    if (genericSetupSupportsInbound && (!genericSetupInboundAddress || !genericSetupInboundUsername || !genericSetupInboundPassword)) {
      toast.error("Please fill in all inbound trunk configuration fields when inbound support is enabled");
      return;
    }

    setIsSettingUp(true);
    try {
      console.log('📞 [SIP Trunk Import] Importing SIP trunk phone number...');
      console.log('📋 [SIP Trunk Import] Request data:', {
        label: genericSetupLabel,
        phone_number: genericSetupPhone,
        provider: genericSetupProvider,
        supports_inbound: genericSetupSupportsInbound,
        supports_outbound: genericSetupSupportsOutbound,
        outbound_sip_address: genericSetupSipAddress,
        username: genericSetupUsername,
        password: '***hidden***',
        transport: genericSetupTransport,
        media_encryption: genericSetupMediaEncryption,
        inbound_address: genericSetupInboundAddress,
        inbound_username: genericSetupInboundUsername,
        inbound_password: '***hidden***'
      });

      // Build request payload with all fields
      const requestPayload: any = {
        label: genericSetupLabel,
        phone_number: genericSetupPhone,
        provider: genericSetupProvider,
        supports_inbound: genericSetupSupportsInbound,
        supports_outbound: genericSetupSupportsOutbound
      };

      // Add outbound_trunk_config only if supports_outbound is true
      if (genericSetupSupportsOutbound) {
        requestPayload.outbound_trunk_config = {
          address: genericSetupSipAddress,
          credentials: {
            username: genericSetupUsername,
            password: genericSetupPassword
          },
          media_encryption: genericSetupMediaEncryption,
          transport: genericSetupTransport
        };
      }

      // Add inbound_trunk_config only if supports_inbound is true
      // Use default address if not provided
      if (genericSetupSupportsInbound) {
        requestPayload.inbound_trunk_config = {
          address: genericSetupInboundAddress || "sip.rtc.elevenlabs.io:5060",
          transport: "auto",
          media_encryption: "allowed",
          credentials: {
            username: genericSetupInboundUsername,
            password: genericSetupInboundPassword
          }
        };
      }

      console.log('📤 [SIP Trunk Import] Full request payload:', {
        ...requestPayload,
        ...(requestPayload.outbound_trunk_config && {
          outbound_trunk_config: {
            ...requestPayload.outbound_trunk_config,
            credentials: {
              ...requestPayload.outbound_trunk_config.credentials,
              password: '***hidden***'
            }
          }
        }),
        ...(requestPayload.inbound_trunk_config && {
          inbound_trunk_config: {
            ...requestPayload.inbound_trunk_config,
            credentials: {
              ...requestPayload.inbound_trunk_config.credentials,
              password: '***hidden***'
            }
          }
        })
      });

      const result = await apiClient.post<{ phone_number_id: string }>('/phone-numbers/sip-trunk', requestPayload);

      console.log('✅ [SIP Trunk Import] Phone number imported:', result);
      console.log('📞 [SIP Trunk Import] Phone Number ID:', result.phone_number_id);

      // If supports_inbound is true, show agent selection step
      if (genericSetupSupportsInbound) {
        setNewlyCreatedPhoneNumberId(result.phone_number_id);
        setShowAgentSelection(true);
        toast.success(`SIP trunk phone number imported successfully! Please select an agent for inbound calls.`);
      } else {
        // If no inbound support, just show success and clear form
        toast.success(`SIP trunk phone number imported successfully! ID: ${result.phone_number_id}`);
        
        // Refresh phone numbers list to show the newly imported number
        queryClient.invalidateQueries({ queryKey: ['phone-numbers'] });
        await refetchPhoneNumbers();

        // Clear form
        setGenericSetupLabel("");
        setGenericSetupPhone("");
        setGenericSetupProvider("sip_trunk");
        setGenericSetupSipAddress("");
        setGenericSetupUsername("");
        setGenericSetupPassword("");
        setGenericSetupTransport("auto");
        setGenericSetupMediaEncryption("allowed");
        setGenericSetupSupportsInbound(false);
        setGenericSetupSupportsOutbound(true);
        setGenericSetupInboundAddress("sip.rtc.elevenlabs.io:5060");
        setGenericSetupInboundUsername("");
        setGenericSetupInboundPassword("");
      setShowSetupMethods(false);
      setActiveSetupMethod(null);
      }

      // 🔴 NO AGENT CONFIG, NO PHONE SETTINGS UPDATE (unless user selects agent)
    } catch (error: any) {
      console.error('❌ [SIP Trunk Import] Error:', error);
      toast.error(error.message || "Failed to import SIP trunk phone number");
    } finally {
      setIsSettingUp(false);
    }
  };

  // Handle agent assignment for inbound phone number
  const handleAssignAgentToInbound = async () => {
    if (!selectedAgentId || !newlyCreatedPhoneNumberId) {
      toast.error("Please select an agent");
      return;
    }

    setIsAssigningAgent(true);
    try {
      console.log('📞 [Agent Assignment] Assigning agent to inbound phone number...');
      console.log('📋 [Agent Assignment] Phone Number ID:', newlyCreatedPhoneNumberId);
      console.log('📋 [Agent Assignment] Agent ID:', selectedAgentId);

      // Build update payload with ONLY agent_id (as per user requirements)
      const updatePayload: any = {
        agent_id: selectedAgentId
      };

      console.log('📤 [Agent Assignment] Update payload:', updatePayload);

      const result = await phoneNumberService.update(newlyCreatedPhoneNumberId, updatePayload);

      console.log('✅ [Agent Assignment] Agent assigned successfully:', result);
      toast.success(`Agent assigned to phone number successfully!`);

      // Refresh phone numbers list
      queryClient.invalidateQueries({ queryKey: ['phone-numbers'] });
      await refetchPhoneNumbers();

      // Clear form and reset state
      setGenericSetupLabel("");
      setGenericSetupPhone("");
      setGenericSetupProvider("sip_trunk");
      setGenericSetupSipAddress("");
      setGenericSetupUsername("");
      setGenericSetupPassword("");
      setGenericSetupTransport("auto");
      setGenericSetupMediaEncryption("allowed");
      setGenericSetupSupportsInbound(false);
      setGenericSetupSupportsOutbound(true);
      setGenericSetupInboundAddress("");
      setGenericSetupInboundUsername("");
      setGenericSetupInboundPassword("");
      setNewlyCreatedPhoneNumberId(null);
      setShowAgentSelection(false);
      setSelectedAgentId("");
      setShowSetupMethods(false);
      setActiveSetupMethod(null);
    } catch (error: any) {
      console.error('❌ [Agent Assignment] Error:', error);
      toast.error(error.message || "Failed to assign agent to phone number");
    } finally {
      setIsAssigningAgent(false);
    }
  };



  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-secondary rounded mb-6"></div>
          <div className="h-64 bg-card rounded-xl"></div>
        </div>
      </div>
    );
  }

return (
  <div className="h-full overflow-auto">
    <div className="max-w-7xl mx-auto p-6">
      {/* Small Header */}
      <div className="mb-6 pb-4 border-b border-border">
        <h2 className="text-xl font-semibold text-foreground">
          Phone Settings
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure AI-powered voice conversations with SIP providers and LiveKit
        </p>
      </div>

      {/* Back Header */}
      <div className="mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.push("/configuration/phone")}
            className="w-10 h-10 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Phone Settings
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Configure your voice agent and phone integration
            </p>
          </div>
        </div>
      </div>

      {/* Active Phone Numbers */}
      <div className="mb-8 space-y-6 max-w-4xl">
        {/* Outbound Numbers Card */}
        <div className="bg-gradient-to-br from-blue-500/5 via-card to-card border-2 border-blue-500/20 rounded-2xl overflow-hidden shadow-lg">
          <div className="bg-gradient-to-r from-blue-500/10 to-blue-500/5 border-b border-blue-500/20 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3l5 5m0 0l-5 5m5-5H9" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                    Outbound Phone Numbers
                    <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-bold">
                      {phoneNumbers.filter(pn => pn.supports_outbound).length}
                    </span>
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Numbers configured for making outbound calls
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6">
            {phoneNumbers.filter(pn => pn.supports_outbound).length === 0 ? (
              <div className="p-8 text-center bg-blue-500/5 border-2 border-dashed border-blue-500/20 rounded-xl">
                <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📞</span>
                </div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">
                  No outbound numbers configured
                </p>
                <p className="text-xs text-muted-foreground">
                  Configure a phone number with "Supports Outbound" enabled below
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {phoneNumbers
                  .filter(pn => pn.supports_outbound)
                  .map((phoneNumber) => (
                    <div
                      key={phoneNumber.id}
                      className="group flex items-center gap-4 p-4 rounded-xl border-2 border-blue-500/20 bg-gradient-to-r from-blue-500/5 to-transparent hover:border-blue-500/40 hover:shadow-md transition-all"
                    >
                      <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-lg font-bold font-mono text-foreground">
                            {phoneNumber.phone_number}
                          </span>
                          {phoneNumber.supports_outbound && (
                            <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-bold shadow-sm">
                              OUTBOUND
                            </span>
                          )}
                          {phoneNumber.supports_inbound && (
                            <span className="px-2.5 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-xs font-bold shadow-sm">
                              INBOUND
                            </span>
                          )}
                          <span className="px-2.5 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-xs font-bold shadow-sm">
                            ✓ ACTIVE
                          </span>
                        </div>
                        {phoneNumber.label && (
                          <p className="text-sm text-muted-foreground">{phoneNumber.label}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 capitalize">
                          Provider: {phoneNumber.provider}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Inbound Numbers Card */}
        <div className="bg-gradient-to-br from-green-500/5 via-card to-card border-2 border-green-500/20 rounded-2xl overflow-hidden shadow-lg">
          <div className="bg-gradient-to-r from-green-500/10 to-green-500/5 border-b border-green-500/20 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-green-500/20 flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                    Inbound Phone Numbers
                    <span className="px-2.5 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-xs font-bold">
                      {phoneNumbers.filter(pn => pn.supports_inbound).length}
                    </span>
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Numbers configured for receiving inbound calls
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6">
            {phoneNumbers.filter(pn => pn.supports_inbound).length === 0 ? (
              <div className="p-8 text-center bg-green-500/5 border-2 border-dashed border-green-500/20 rounded-xl">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📱</span>
                </div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">
                  No inbound numbers configured
                </p>
                <p className="text-xs text-muted-foreground">
                  Configure a phone number with "Supports Inbound" enabled below
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {phoneNumbers
                  .filter(pn => pn.supports_inbound)
                  .map((phoneNumber) => (
                    <div
                      key={phoneNumber.id}
                      className="group flex items-center gap-4 p-4 rounded-xl border-2 border-green-500/20 bg-gradient-to-r from-green-500/5 to-transparent hover:border-green-500/40 hover:shadow-md transition-all"
                    >
                      <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-lg font-bold font-mono text-foreground">
                            {phoneNumber.phone_number}
                          </span>
                          {phoneNumber.supports_outbound && (
                            <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-bold shadow-sm">
                              OUTBOUND
                            </span>
                          )}
                          {phoneNumber.supports_inbound && (
                            <span className="px-2.5 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-xs font-bold shadow-sm">
                              INBOUND
                            </span>
                          )}
                          <span className="px-2.5 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-xs font-bold shadow-sm">
                            ✓ ACTIVE
                          </span>
                        </div>
                        {phoneNumber.label && (
                          <p className="text-sm text-muted-foreground">{phoneNumber.label}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 capitalize">
                          Provider: {phoneNumber.provider}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add New Phone Numbers Section */}
      <div className="mb-8 max-w-4xl">
        <div className="border-t border-border pt-8">
          <h3 className="text-xl font-bold text-foreground mb-2">Add New Phone Numbers</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Use the setup methods below to configure new phone numbers for your system
          </p>
        </div>
        <div className="space-y-6">
          {/* Auto Setup Methods Section */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => setShowSetupMethods(!showSetupMethods)}
              className="w-full p-6 flex items-center justify-between hover:bg-secondary/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-linear-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-foreground">Import Number</h3>
                  <p className="text-sm text-muted-foreground">Import phone number with Twilio credentials</p>
                </div>
              </div>
              {showSetupMethods ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>

            {showSetupMethods && (
              <div className="p-6 pt-0 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Method 1: Full Setup */}
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      activeSetupMethod === "full"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setActiveSetupMethod(activeSetupMethod === "full" ? null : "full")}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-lg">🚀</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground mb-1">Full Setup</h4>
                        <p className="text-xs text-muted-foreground">
                          Import phone number with Twilio credentials
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Method 2: Generic SIP Trunk */}
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      activeSetupMethod === "generic"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setActiveSetupMethod(activeSetupMethod === "generic" ? null : "generic")}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-lg">🔧</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground mb-1">Generic SIP Trunk</h4>
                        <p className="text-xs text-muted-foreground">
                          Universal setup for any SIP provider
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Full Setup Form */}
                {activeSetupMethod === "full" && (
                  <div className="mt-4 p-4 bg-secondary/50 rounded-lg space-y-4 border border-border">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Label <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={fullSetupLabel}
                        onChange={(e) => setFullSetupLabel(e.target.value)}
                        placeholder="e.g., Customer Support Line"
                        className="w-full h-10 bg-background border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={fullSetupPhone}
                        onChange={(e) => setFullSetupPhone(e.target.value)}
                        placeholder="+12625925656"
                        className="w-full h-10 bg-background border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Provider Account SID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={fullSetupTwilioSid}
                        onChange={(e) => setFullSetupTwilioSid(e.target.value)}
                        placeholder="TWILIO_ACCOUNT_SID"
                        className="w-full h-10 bg-background border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Provider Auth Token <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={fullSetupTwilioToken}
                        onChange={(e) => setFullSetupTwilioToken(e.target.value)}
                        placeholder="••••••••••••••••••••••••••••••••"
                        className="w-full h-10 bg-background border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <button
                      onClick={handleFullSetup}
                      disabled={isSettingUp || !fullSetupLabel || !fullSetupPhone || !fullSetupTwilioSid || !fullSetupTwilioToken}
                      className="w-full h-10 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSettingUp ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        "Import Phone Number"
                      )}
                    </button>
                  </div>
                )}

                {/* Generic SIP Trunk Form */}
                {activeSetupMethod === "generic" && (
                  <div className="mt-4 p-4 bg-secondary/50 rounded-lg space-y-4 border border-border">
                    {/* Supports Inbound/Outbound Toggles */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border">
                        <input
                          type="checkbox"
                          id="supports-inbound"
                          checked={genericSetupSupportsInbound}
                          onChange={(e) => setGenericSetupSupportsInbound(e.target.checked)}
                          className="w-4 h-4 text-primary rounded focus:ring-primary"
                        />
                        <label htmlFor="supports-inbound" className="text-sm font-medium text-foreground cursor-pointer">
                          Supports Inbound
                        </label>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border">
                        <input
                          type="checkbox"
                          id="supports-outbound"
                          checked={genericSetupSupportsOutbound}
                          onChange={(e) => setGenericSetupSupportsOutbound(e.target.checked)}
                          className="w-4 h-4 text-primary rounded focus:ring-primary"
                        />
                        <label htmlFor="supports-outbound" className="text-sm font-medium text-foreground cursor-pointer">
                          Supports Outbound
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Label <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={genericSetupLabel}
                        onChange={(e) => setGenericSetupLabel(e.target.value)}
                        placeholder="e.g., Italy SIP Line"
                        className="w-full h-10 bg-background border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={genericSetupPhone}
                        onChange={(e) => setGenericSetupPhone(e.target.value)}
                        placeholder="+390620199287"
                        className="w-full h-10 bg-background border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Provider <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={genericSetupProvider}
                        onChange={(e) => setGenericSetupProvider(e.target.value)}
                        className="w-full h-10 bg-background border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                      >
                        <option value="sip_trunk">SIP Trunk</option>
                      </select>
                    </div>

                    {/* Outbound Trunk Config - Only shown when supports_outbound is true */}
                    {genericSetupSupportsOutbound && (
                      <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg space-y-4">
                        <h3 className="text-sm font-semibold text-purple-400 mb-2">Outbound Trunk Configuration</h3>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Outbound SIP Address <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={genericSetupSipAddress}
                            onChange={(e) => setGenericSetupSipAddress(e.target.value)}
                            placeholder="voiceagent.fibrapro.it"
                            className="w-full h-10 bg-background border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Outbound Username <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={genericSetupUsername}
                            onChange={(e) => setGenericSetupUsername(e.target.value)}
                            placeholder="+390620199287"
                            className="w-full h-10 bg-background border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Outbound Password <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="password"
                            value={genericSetupPassword}
                            onChange={(e) => setGenericSetupPassword(e.target.value)}
                            placeholder="your_password"
                            className="w-full h-10 bg-background border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Media Encryption <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={genericSetupMediaEncryption}
                            onChange={(e) => setGenericSetupMediaEncryption(e.target.value)}
                            className="w-full h-10 bg-background border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                          >
                            <option value="allowed">Allowed</option>
                            <option value="required">Required</option>
                            <option value="disabled">Disabled</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Transport <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={genericSetupTransport}
                            onChange={(e) => setGenericSetupTransport(e.target.value)}
                            className="w-full h-10 bg-background border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                          >
                            <option value="auto">Auto</option>
                            <option value="udp">UDP</option>
                            <option value="tcp">TCP</option>
                            <option value="tls">TLS</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Inbound Trunk Config - Only shown when supports_inbound is true */}
                    {genericSetupSupportsInbound && (
                      <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg space-y-4">
                        <h3 className="text-sm font-semibold text-blue-400 mb-2">Inbound Trunk Configuration</h3>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Inbound SIP Address <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={genericSetupInboundAddress}
                            onChange={(e) => setGenericSetupInboundAddress(e.target.value)}
                            placeholder="sip.rtc.elevenlabs.io:5060"
                            className="w-full h-10 bg-background border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Default: sip.rtc.elevenlabs.io:5060
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Inbound Username <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={genericSetupInboundUsername}
                            onChange={(e) => setGenericSetupInboundUsername(e.target.value)}
                            placeholder="+390620199287"
                            className="w-full h-10 bg-background border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Inbound Password <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="password"
                            value={genericSetupInboundPassword}
                            onChange={(e) => setGenericSetupInboundPassword(e.target.value)}
                            placeholder="your_password"
                            className="w-full h-10 bg-background border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                          />
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleGenericSetup}
                      disabled={
                        isSettingUp || 
                        !genericSetupLabel || 
                        !genericSetupPhone || 
                        !genericSetupProvider ||
                        (!genericSetupSupportsInbound && !genericSetupSupportsOutbound) ||
                        (genericSetupSupportsOutbound && (!genericSetupSipAddress || !genericSetupUsername || !genericSetupPassword)) ||
                        (genericSetupSupportsInbound && (!genericSetupInboundAddress || !genericSetupInboundUsername || !genericSetupInboundPassword))
                      }
                      className="w-full h-10 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSettingUp ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Generic SIP Trunk"
                      )}
                    </button>
                  </div>
                )}

                {/* Agent Selection Step - Shown after successful inbound phone number creation */}
                {showAgentSelection && newlyCreatedPhoneNumberId && (
                  <div className="mt-6 p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-2 border-blue-500/20 rounded-xl">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-400 text-xl">🤖</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-1">
                          Select Agent for Inbound Calls
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Choose an agent to handle inbound calls for this phone number
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Agent <span className="text-red-500">*</span>
                        </label>
                        {isLoadingAgents ? (
                          <div className="w-full h-10 bg-background border border-border rounded-lg flex items-center justify-center">
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          </div>
                        ) : agents.length === 0 ? (
                          <div className="w-full p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                            <p className="text-sm text-yellow-400">
                              No agents found. Please create an agent first.
                            </p>
                          </div>
                        ) : (
                          <select
                            value={selectedAgentId}
                            onChange={(e) => setSelectedAgentId(e.target.value)}
                            className="w-full h-10 bg-background border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                          >
                            <option value="">Select an agent...</option>
                            {agents.map((agent) => (
                              <option key={agent._id} value={agent.agent_id}>
                                {agent.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={handleAssignAgentToInbound}
                          disabled={isAssigningAgent || !selectedAgentId || isLoadingAgents}
                          className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isAssigningAgent ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Assigning...
                            </>
                          ) : (
                            "Assign Agent"
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setShowAgentSelection(false);
                            setNewlyCreatedPhoneNumberId(null);
                            setSelectedAgentId("");
                            // Clear form
                            setGenericSetupLabel("");
                            setGenericSetupPhone("");
                            setGenericSetupProvider("sip_trunk");
                            setGenericSetupSipAddress("");
                            setGenericSetupUsername("");
                            setGenericSetupPassword("");
                            setGenericSetupTransport("auto");
                            setGenericSetupMediaEncryption("allowed");
                            setGenericSetupSupportsInbound(false);
                            setGenericSetupSupportsOutbound(true);
                            setGenericSetupInboundAddress("sip.rtc.elevenlabs.io:5060");
                            setGenericSetupInboundUsername("");
                            setGenericSetupInboundPassword("");
                            setShowSetupMethods(false);
                            setActiveSetupMethod(null);
                          }}
                          disabled={isAssigningAgent}
                          className="h-10 px-4 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                        >
                          Skip
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inbound Numbers - Configured in Generic Setup */}
      <div className="space-y-6 max-w-5xl">
          <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-foreground mb-2">Inbound Phone Numbers</h3>
            <p className="text-sm text-muted-foreground">
              Inbound phone numbers are configured through the Generic SIP Trunk setup above. Use the "Supports Inbound" option when creating a phone number.
            </p>
          </div>
        </div>
    </div>
  </div>
);
}
