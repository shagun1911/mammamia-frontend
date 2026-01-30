"use client";

import { useState, useEffect } from "react";
import axios from "axios"; // Import axios directly
import { ArrowLeft, Copy, Check, ChevronDown, ChevronUp, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePhoneSettings } from "@/hooks/usePhoneSettings";
import { useAIBehavior } from "@/hooks/useAIBehavior";
import { useInboundAgentConfig } from "@/hooks/useInboundAgentConfig";
import { useOutboundAgentConfig } from "@/hooks/useOutboundAgentConfig";
import { useInboundNumbers } from "@/hooks/useInboundNumbers";
import { phoneSettingsService } from "@/services/phoneSettings.service";
import { inboundNumbersService } from "@/services/inboundNumbers.service";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";
import { useCreatePhoneNumber, usePhoneNumbersList } from "@/hooks/usePhoneNumber";
import { useQueryClient } from "@tanstack/react-query";
import { PhoneNumber } from "@/services/phoneNumber.service";

export default function PhoneSettingsDetailPage() {
  const router = useRouter();
  const { settings, isLoading, updateSettings, isUpdating } = usePhoneSettings();
  const { aiBehavior } = useAIBehavior();
  const { configs: inboundConfigs, syncConfig, updateConfig, deleteConfig } = useInboundAgentConfig();
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

  // Inbound setup state
  const [inboundStep, setInboundStep] = useState(1);
  const [inboundName, setInboundName] = useState("");
  const [inboundPhoneNumbers, setInboundPhoneNumbers] = useState("");
  const [inboundKrispEnabled, setInboundKrispEnabled] = useState(true);
  const [inboundTrunkId, setInboundTrunkId] = useState("");
  const [inboundTrunkName, setInboundTrunkName] = useState("");
  const [inboundConnectedNumbers, setInboundConnectedNumbers] = useState<string[]>([]);
  const [isCreatingInbound, setIsCreatingInbound] = useState(false);


  // Edit mode for inbound configs
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Get available outbound numbers
  const getAvailableOutboundNumbers = (): string[] => {
    const numbers = new Set<string>();
    
    // Add phone numbers from the new phone-numbers endpoint
    console.log('📞 [getAvailableOutboundNumbers] phoneNumbersList:', phoneNumbersList);
    if (phoneNumbersList && phoneNumbersList.length > 0) {
      phoneNumbersList.forEach((phoneNumber: PhoneNumber) => {
        console.log('📞 [getAvailableOutboundNumbers] Processing phone number:', phoneNumber);
        if (phoneNumber.phone_number) {
          numbers.add(phoneNumber.phone_number);
        }
      });
    } else {
      console.log('⚠️ [getAvailableOutboundNumbers] No phone numbers found in list');
    }
    
    // Legacy: Add from phone settings (for backward compatibility)
    if (settings?.twilioPhoneNumber) {
      numbers.add(settings.twilioPhoneNumber);
    }
    
    // Legacy: Add from outbound configs (for backward compatibility)
    if (outboundConfigs && outboundConfigs.length > 0) {
      outboundConfigs.forEach(config => {
        if (config.outboundNumber) {
          numbers.add(config.outboundNumber);
        }
      });
    }
    
    return Array.from(numbers).sort();
  };

  const availableOutboundNumbers = getAvailableOutboundNumbers();

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

      console.log('📞 [Create Inbound Trunk] Request:', {
        name: inboundName,
        phone_numbers: phoneNumbersArray,
        allowed_numbers: phoneNumbersArray, // Set allowed_numbers to match phone_numbers to avoid conflicts
        krisp_enabled: inboundKrispEnabled
      });

      const API_URL = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'https://keplerov1-python-2.onrender.com';
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
        try {
          const err = await response.json();
          console.error('❌ [Create Inbound Trunk] Error response:', err);
          errorMessage = err.detail || err.message || err.error?.message || errorMessage;
          
          // Provide more helpful error messages
          if (response.status === 500) {
            // Check if it's a trunk conflict error
            if (errorMessage.includes('Conflicting inbound SIP Trunks') || errorMessage.includes('without AllowedNumbers set')) {
              errorMessage = `Phone number conflict: ${errorMessage}. This number may already be registered. Please delete existing trunks or use a different number.`;
            } else {
              errorMessage = `Server error: ${errorMessage}. Please check if the Python API is running and accessible.`;
            }
          } else if (response.status === 400) {
            if (errorMessage.includes('Conflicting inbound SIP Trunks') || errorMessage.includes('without AllowedNumbers set')) {
              errorMessage = `Phone number conflict: ${errorMessage}. This number may already be registered. Please delete existing trunks or use a different number.`;
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

  // Inbound Setup - Step 2
  const handleCreateDispatchRule = async () => {
    if (!inboundTrunkId) {
      toast.error("Trunk ID missing");
      return;
    }

    setIsCreatingInbound(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'https://keplerov1-python-2.onrender.com';

      const params = new URLSearchParams({
        sip_trunk_id: inboundTrunkId,
        name: inboundTrunkName,
        agent_name: "inbound-agent",
      });

      const response = await fetch(`${API_URL}/calls/create-dispatch-rule?${params}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to create dispatch rule");
      }

      const data = await response.json();

      const existingNumbers = settings?.inboundPhoneNumbers || [];
      const newNumbers = inboundConnectedNumbers.filter(n => !existingNumbers.includes(n));
      const allNumbers = [...existingNumbers, ...newNumbers];

      // Persist inbound numbers to database
      if (allNumbers.length > 0 && inboundTrunkId) {
        try {
          await addInboundNumbersMutation.mutateAsync({
            phoneNumbers: allNumbers,
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
        inboundDispatchRuleId: data.dispatch_rule_id,
        inboundDispatchRuleName: data.dispatch_rule_name,
        inboundPhoneNumbers: allNumbers,
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
    if (
      !genericSetupLabel ||
      !genericSetupPhone ||
      !genericSetupProvider ||
      !genericSetupSipAddress ||
      !genericSetupUsername ||
      !genericSetupPassword
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSettingUp(true);
    try {
      console.log('📞 [SIP Trunk Import] Importing SIP trunk phone number...');
      console.log('📋 [SIP Trunk Import] Request data:', {
        label: genericSetupLabel,
        phone_number: genericSetupPhone,
        sip_address: genericSetupSipAddress,
        username: genericSetupUsername,
        password: '***hidden***',
        transport: genericSetupTransport
      });

      // 🔴 ONLY CALL THIS ENDPOINT - NO OTHER CALLS
      // REQUIRED FIELDS (as per Amar Sir's spec):
      // - label
      // - phone_number
      // - provider (user-selected)
      // - supports_outbound: true (auto-set)
      // - outbound_trunk_config (address, credentials.username, credentials.password, media_encryption, transport)
      const requestPayload = {
        label: genericSetupLabel,
        phone_number: genericSetupPhone,
        provider: genericSetupProvider, // REQUIRED - User-selected
        supports_outbound: true, // REQUIRED - Auto-set
        outbound_trunk_config: {
          address: genericSetupSipAddress,
          credentials: {
            username: genericSetupUsername,
            password: genericSetupPassword
          },
          media_encryption: genericSetupMediaEncryption,
          transport: genericSetupTransport
        }
      };

      console.log('📤 [SIP Trunk Import] Full request payload:', {
        ...requestPayload,
        outbound_trunk_config: {
          ...requestPayload.outbound_trunk_config,
          credentials: {
            ...requestPayload.outbound_trunk_config.credentials,
            password: '***hidden***'
          }
        }
      });

      const result = await apiClient.post<{ phone_number_id: string }>('/phone-numbers/sip-trunk', requestPayload);

      console.log('✅ [SIP Trunk Import] Phone number imported:', result);
      console.log('📞 [SIP Trunk Import] Phone Number ID:', result.phone_number_id);

      // 🔴 STOP HERE - Just show success, don't call agent config or phone settings
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
      setShowSetupMethods(false);
      setActiveSetupMethod(null);

      // 🔴 NO AGENT CONFIG, NO PHONE SETTINGS UPDATE
    } catch (error: any) {
      console.error('❌ [SIP Trunk Import] Error:', error);
      toast.error(error.message || "Failed to import SIP trunk phone number");
    } finally {
      setIsSettingUp(false);
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

      {/* Connected Numbers Display - Removed as requested */}

      {/* Outbound Number Selector */}
      {activeTab === "outbound" && (
        <div className="mb-6 max-w-2xl">
          <div className="bg-gradient-to-br from-card to-card/80 border border-border rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-5">
              <div>
                <label className="block text-base font-bold text-foreground mb-1">
                  Select Outbound Number <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-muted-foreground">
                  Choose which number to configure. Each number has independent settings.
                </p>
              </div>
              {availableOutboundNumbers.length > 0 && (
                <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                  {availableOutboundNumbers.length} {availableOutboundNumbers.length === 1 ? 'Number' : 'Numbers'}
                </div>
              )}
            </div>
            {availableOutboundNumbers.length === 0 ? (
              <div className="p-6 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-2 border-yellow-500/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-yellow-400 text-xl">📞</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-yellow-400 mb-1">
                      No outbound numbers configured yet
                    </p>
                    <p className="text-xs text-yellow-300/80 leading-relaxed">
                      Configure a phone number using the setup methods below. Once added, it will appear here for per-number configuration.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {availableOutboundNumbers.map((number, index) => (
                  <label
                    key={number}
                    className={`group flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      selectedOutboundNumber === number
                        ? 'border-primary bg-gradient-to-r from-primary/20 to-primary/10 shadow-lg shadow-primary/20'
                        : 'border-border bg-background hover:border-primary/50 hover:bg-secondary/50 hover:shadow-md'
                    }`}
                  >
                    <div className={`flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all ${
                      selectedOutboundNumber === number
                        ? 'border-primary bg-primary'
                        : 'border-border group-hover:border-primary/50'
                    }`}>
                      {selectedOutboundNumber === number && (
                        <div className="w-2 h-2 rounded-full bg-foreground"></div>
                      )}
                    </div>
                    <input
                      type="radio"
                      name="outboundNumber"
                      value={number}
                      checked={selectedOutboundNumber === number}
                      onChange={() => setSelectedOutboundNumber(number)}
                      className="sr-only"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`text-base font-semibold font-mono ${
                          selectedOutboundNumber === number ? 'text-primary' : 'text-foreground'
                        }`}>
                          {number}
                        </span>
                        {selectedOutboundNumber === number && (
                          <span className="px-2.5 py-1 bg-primary text-foreground rounded-full text-xs font-bold shadow-sm">
                            ACTIVE
                          </span>
                        )}
                      </div>
                    </div>
                    {selectedOutboundNumber === number && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                      </div>
                    )}
                  </label>
                ))}
                {selectedOutboundNumber && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <p className="text-sm font-semibold text-primary">
                        Configuring settings for <span className="font-mono font-bold">{selectedOutboundNumber}</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-lg p-1 mb-6 max-w-2xl">
        <button
          onClick={() => setActiveTab("outbound")}
          className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all cursor-pointer ${
            activeTab === "outbound"
              ? "bg-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Outbound Setup
        </button>
        <button
          onClick={() => setActiveTab("inbound")}
          className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all cursor-pointer ${
            activeTab === "inbound"
              ? "bg-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Inbound Numbers
        </button>
      </div>

      {/* Outbound Setup Tab */}
      {activeTab === "outbound" && (
        <div className="space-y-6 max-w-2xl">
          {/* Info Banner */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="text-blue-400 mt-0.5">ℹ️</div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-400 mb-1">Voice, Language & Greeting Configuration</h4>
                <p className="text-xs text-muted-foreground">
                  Voice, language, greeting message, and escalation rules are now configured per Agent. 
                  Please configure these settings in <strong>AI → Agents</strong> when creating or editing an agent.
                </p>
              </div>
            </div>
          </div>
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
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-2">
                      <p className="text-xs text-blue-400">
                        ℹ️ Supports Outbound: <strong>true</strong> (automatically configured)
                      </p>
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
                        Username <span className="text-red-500">*</span>
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
                        Password <span className="text-red-500">*</span>
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
                    <button
                      onClick={handleGenericSetup}
                      disabled={isSettingUp || !genericSetupLabel || !genericSetupPhone || !genericSetupProvider || !genericSetupSipAddress || !genericSetupUsername || !genericSetupPassword}
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
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inbound Tab */}
      {activeTab === "inbound" && (
        <div className="space-y-6 max-w-5xl">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border-2 border-border rounded-2xl p-6 md:p-8 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Inbound Phone Numbers</h2>
                <p className="text-sm md:text-base text-muted-foreground">
                  Manage your inbound call routing and agent configurations
                </p>
              </div>
              {inboundConfigs && inboundConfigs.length > 0 && (
                <button
                  onClick={() => syncConfig.mutate()}
                  disabled={syncConfig.isPending}
                  className="h-10 md:h-11 px-5 bg-primary text-foreground rounded-lg text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md w-full md:w-auto"
                >
                  {syncConfig.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Sync All Configs
                    </>
                  )}
                </button>
              )}
            </div>
            {persistedInboundNumbers && persistedInboundNumbers.length > 0 && (
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Active Numbers:</span>
                <div className="flex flex-wrap gap-2">
                  {persistedInboundNumbers.map((num, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-primary/20 text-primary rounded-lg text-xs font-mono font-semibold border border-primary/30 shadow-sm">
                      {num}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Current Inbound Agent Configs */}
          {inboundConfigs && inboundConfigs.length > 0 ? (
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h3 className="text-xl md:text-2xl font-bold text-foreground">
                  Configured Numbers <span className="text-muted-foreground">({inboundConfigs.length})</span>
                </h3>
                <button
                  onClick={async () => {
                    if (!confirm('⚠️ WARNING: This will delete ALL inbound numbers, configurations, and trunk settings. This action cannot be undone. Are you sure?')) {
                      return;
                    }
                    try {
                      await clearAllInboundMutation.mutateAsync();
                      if (typeof syncConfig.mutateAsync === 'function') {
                        await syncConfig.mutateAsync();
                      }
                    } catch (error: any) {
                      console.error('Failed to clear all inbound data:', error);
                    }
                  }}
                  disabled={clearAllInboundMutation.isPending}
                  className="h-10 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
                >
                  {clearAllInboundMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Clearing...
                    </>
                  ) : (
                    <>
                      🗑️ Clear All Inbound Data
                    </>
                  )}
                </button>
              </div>
              <div className="grid gap-4 md:gap-6">
                {inboundConfigs.map((config, index) => (
                  <div key={config._id} className="bg-gradient-to-br from-card via-card/95 to-card/80 border-2 border-border rounded-2xl p-5 md:p-7 shadow-lg hover:shadow-2xl transition-all duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border-2 border-primary/40 shadow-md flex-shrink-0">
                          <span className="text-2xl md:text-3xl font-bold text-primary">{index + 1}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xl md:text-2xl font-bold text-foreground font-mono mb-1 break-all">
                            {config.calledNumber}
                          </h4>
                          <p className="text-xs md:text-sm text-muted-foreground">Inbound Call Configuration</p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        {editingConfigId === config._id ? (
                          <>
                            <button
                              onClick={() => handleSaveConfig(config)}
                              disabled={isSavingConfig}
                              className="h-10 md:h-11 px-5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
                            >
                              {isSavingConfig ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Check className="w-4 h-4" />
                                  Save Changes
                                </>
                              )}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              disabled={isSavingConfig}
                              className="h-10 md:h-11 px-5 bg-secondary text-foreground rounded-lg text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditConfig(config)}
                              className="h-10 md:h-11 px-5 bg-primary text-foreground rounded-lg text-sm font-bold hover:brightness-110 transition-all cursor-pointer shadow-md"
                            >
                              Edit Configuration
                            </button>
                            <button
                              onClick={() => handleDeleteInboundNumber(config.calledNumber)}
                              disabled={isDeletingInbound === config.calledNumber}
                              className="h-10 md:h-11 px-5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-sm font-bold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 border-2 border-red-500/20"
                            >
                              {isDeletingInbound === config.calledNumber ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                                  Deleting...
                                </>
                              ) : (
                                'Delete'
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {editingConfigId === config._id ? (
                      <div className="pt-5 border-t-2 border-border">
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                          <div className="flex gap-3">
                            <div className="text-blue-400 mt-0.5">ℹ️</div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-blue-400 mb-1">Voice & Language Configuration</h4>
                              <p className="text-xs text-muted-foreground">
                                Voice, language, greeting message, and escalation rules are now configured per Agent. 
                                Please configure these settings in <strong>AI → Agents</strong> when creating or editing an agent.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-5 border-t-2 border-border">
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
                          <div className="flex gap-3">
                            <div className="text-blue-400 mt-0.5">ℹ️</div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-blue-400 mb-1">Voice & Language Configuration</h4>
                              <p className="text-xs text-muted-foreground">
                                Voice, language, greeting message, and escalation rules are now configured per Agent. 
                                Please configure these settings in <strong>AI → Agents</strong> when creating or editing an agent.
                              </p>
                            </div>
                          </div>
                        </div>
                        {config.collections && config.collections.length > 0 && (
                          <div className="p-4 md:p-5 bg-background/60 rounded-xl border-2 border-border hover:border-primary/30 transition-colors">
                            <div className="text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Knowledge Base Collections</div>
                            <div className="flex flex-wrap gap-2">
                              {config.collections.map((col, idx) => (
                                <span key={idx} className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs md:text-sm font-semibold border border-primary/20">
                                  {col}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-card border-2 border-dashed border-border rounded-2xl p-12 md:p-16 text-center">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl md:text-5xl">📞</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">No Inbound Configurations</h3>
              <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto">
                Add inbound phone numbers below and configurations will be created automatically.
              </p>
            </div>
          )}
          
          {/* Setup Inbound Trunk */}
          <div className="bg-gradient-to-br from-card to-card/80 border-2 border-border rounded-2xl p-6 md:p-8 lg:p-10 shadow-xl">
            {/* Step Indicator */}
            <div className="flex items-center justify-center mb-8 md:mb-10 overflow-x-auto">
              <div className="flex items-center gap-3 md:gap-6 min-w-max">
                <div className="flex flex-col items-center">
                  <div className={`flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full font-bold text-lg md:text-xl shadow-lg transition-all ${
                    inboundStep >= 1 ? 'bg-primary text-foreground scale-110 ring-4 ring-primary/20' : 'bg-secondary text-muted-foreground'
                  }`}>
                    {inboundStep > 1 ? <Check className="w-7 h-7 md:w-8 md:h-8" /> : '1'}
                  </div>
                  <span className={`text-xs md:text-sm font-bold mt-3 ${inboundStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                    Create Trunk
                  </span>
                </div>
                <div className={`w-16 md:w-24 h-1.5 rounded-full transition-all ${inboundStep >= 2 ? 'bg-primary' : 'bg-secondary'}`}></div>
                <div className="flex flex-col items-center">
                  <div className={`flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full font-bold text-lg md:text-xl shadow-lg transition-all ${
                    inboundStep >= 2 ? 'bg-primary text-foreground scale-110 ring-4 ring-primary/20' : 'bg-secondary text-muted-foreground'
                  }`}>
                    {inboundStep > 2 ? <Check className="w-7 h-7 md:w-8 md:h-8" /> : '2'}
                  </div>
                  <span className={`text-xs md:text-sm font-bold mt-3 ${inboundStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                    Dispatch Rule
                  </span>
                </div>
                <div className={`w-16 md:w-24 h-1.5 rounded-full transition-all ${inboundStep >= 3 ? 'bg-primary' : 'bg-secondary'}`}></div>
                <div className="flex flex-col items-center">
                  <div className={`flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full font-bold text-lg md:text-xl shadow-lg transition-all ${
                    inboundStep >= 3 ? 'bg-primary text-foreground scale-110 ring-4 ring-primary/20' : 'bg-secondary text-muted-foreground'
                  }`}>
                    <Check className="w-7 h-7 md:w-8 md:h-8" />
                  </div>
                  <span className={`text-xs md:text-sm font-bold mt-3 ${inboundStep >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                    Complete
                  </span>
                </div>
              </div>
            </div>

          {/* Step 1: Create Inbound Trunk */}
          {inboundStep === 1 && (
            <div className="space-y-6 md:space-y-8">
              <div className="text-center mb-6 md:mb-8">
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Setup Inbound Trunk</h3>
                <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
                  Create an inbound SIP trunk to receive calls from your phone numbers
                </p>
              </div>

              {/* Warning if numbers already exist */}
              {(inboundConfigs && inboundConfigs.length > 0) && (
                <div className="p-5 md:p-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/30 rounded-xl md:rounded-2xl mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-yellow-400 text-2xl md:text-3xl">⚠️</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm md:text-base font-bold text-yellow-400 mb-2">Inbound Numbers Already Configured</h4>
                      <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                        You have {inboundConfigs.length} inbound number(s) configured. Please delete existing numbers above before adding new ones.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {(inboundConfigs && inboundConfigs.length > 0) ? (
                <div className="p-8 md:p-12 bg-secondary/30 rounded-xl md:rounded-2xl text-center border-2 border-dashed border-border">
                  <p className="text-sm md:text-base font-semibold text-muted-foreground">
                    Please delete existing inbound numbers before adding new ones.
                  </p>
                </div>
              ) : (
                <div className="space-y-6 md:space-y-8">
                  <div>
                    <label className="block text-sm md:text-base font-bold text-foreground mb-3 md:mb-4">
                      Trunk Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={inboundName}
                      onChange={(e) => setInboundName(e.target.value)}
                      placeholder="e.g., My Inbound Trunk"
                      className="w-full h-12 md:h-14 bg-secondary border-2 border-border rounded-xl px-4 md:px-5 text-sm md:text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm md:text-base font-bold text-foreground mb-3 md:mb-4">
                      Phone Numbers <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={inboundPhoneNumbers || ''}
                      onChange={(e) => setInboundPhoneNumbers(e.target.value)}
                      placeholder="+1234567890, +0987654321"
                      className="w-full h-12 md:h-14 bg-secondary border-2 border-border rounded-xl px-4 md:px-5 text-sm md:text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                    {/* Show persisted inbound numbers */}
                    {persistedInboundNumbers && persistedInboundNumbers.length > 0 && (
                      <div className="mt-4 p-4 md:p-5 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/20 rounded-xl md:rounded-2xl">
                        <p className="text-xs md:text-sm font-bold text-blue-400 uppercase tracking-wide mb-3">Saved Inbound Numbers</p>
                        <div className="flex flex-wrap gap-2 md:gap-3">
                          {persistedInboundNumbers.map((num, idx) => (
                            <span key={idx} className="px-3 md:px-4 py-1.5 md:py-2 bg-background/80 text-blue-300 font-mono text-xs md:text-sm font-semibold rounded-lg border border-blue-500/30">
                              {num}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-xs md:text-sm text-muted-foreground mt-3">
                      Enter phone numbers in E.164 format, separated by commas
                    </p>
                  </div>

                  <div className="flex items-center gap-3 md:gap-4 p-4 md:p-5 bg-background/50 rounded-xl border-2 border-border">
                    <input
                      type="checkbox"
                      id="krispEnabled"
                      checked={inboundKrispEnabled}
                      onChange={(e) => setInboundKrispEnabled(e.target.checked)}
                      className="w-5 h-5 md:w-6 md:h-6 rounded border-border text-primary focus:ring-primary cursor-pointer"
                    />
                    <label htmlFor="krispEnabled" className="text-sm md:text-base font-bold text-foreground cursor-pointer flex-1">
                      Enable Krisp noise cancellation
                    </label>
                  </div>

                  <button
                    onClick={handleCreateInboundTrunk}
                    disabled={isCreatingInbound || !inboundName || !inboundPhoneNumbers || (inboundConfigs && inboundConfigs.length > 0)}
                    className="w-full h-12 md:h-14 bg-primary text-foreground rounded-xl md:rounded-2xl text-sm md:text-base font-bold hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl"
                  >
                    {isCreatingInbound ? (
                      <>
                        <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />
                        Creating Trunk...
                      </>
                    ) : (
                      <>
                        <span>Continue to Next Step</span>
                        <ChevronDown className="w-4 h-4 md:w-5 md:h-5" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Create Dispatch Rule */}
          {inboundStep === 2 && (
            <div className="space-y-6 md:space-y-8">
              <div className="text-center mb-6 md:mb-8">
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Create Dispatch Rule</h3>
                <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
                  Configure routing for incoming calls to your AI agent
                </p>
              </div>

              <div className="p-6 md:p-8 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-2 border-green-500/30 rounded-xl md:rounded-2xl">
                <div className="flex flex-col sm:flex-row items-start gap-4 md:gap-6">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-7 h-7 md:w-8 md:h-8 text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base md:text-lg font-bold text-green-400 mb-4">Trunk Created Successfully!</h4>
                    <div className="space-y-3 md:space-y-4 text-sm md:text-base">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className="font-bold text-muted-foreground min-w-[120px]">Trunk ID:</span>
                        <span className="font-mono text-foreground font-semibold break-all">{inboundTrunkId}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className="font-bold text-muted-foreground min-w-[120px]">Trunk Name:</span>
                        <span className="text-foreground font-semibold">{inboundTrunkName}</span>
                      </div>
                      <div className="mt-4">
                        <span className="font-bold text-muted-foreground block mb-3">Phone Numbers:</span>
                        <div className="flex flex-wrap gap-2 md:gap-3">
                          {inboundConnectedNumbers.map((num, idx) => (
                            <span key={idx} className="px-3 md:px-4 py-1.5 md:py-2 bg-background/80 text-green-300 font-mono text-xs md:text-sm font-semibold rounded-lg border border-green-500/30">
                              {num}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 md:p-6 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/20 rounded-xl md:rounded-2xl">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-400 text-xl md:text-2xl">ℹ️</span>
                  </div>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                    The dispatch rule will route incoming calls to the <span className="font-mono font-bold text-primary">inbound-agent</span> automatically.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-2">
                <button
                  onClick={() => setInboundStep(1)}
                  className="flex-1 h-12 md:h-14 bg-secondary text-foreground rounded-xl md:rounded-2xl text-sm md:text-base font-bold hover:brightness-110 transition-all cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  onClick={handleCreateDispatchRule}
                  disabled={isCreatingInbound}
                  className="flex-1 h-12 md:h-14 bg-primary text-foreground rounded-xl md:rounded-2xl text-sm md:text-base font-bold hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl"
                >
                  {isCreatingInbound ? (
                    <>
                      <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />
                      Creating Rule...
                    </>
                  ) : (
                    <>
                      <span>Complete Setup</span>
                      <Check className="w-4 h-4 md:w-5 md:h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {inboundStep === 3 && (
            <div className="space-y-6 md:space-y-8">
              <div className="text-center">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8 border-4 border-green-500/30 shadow-xl">
                  <Check className="w-12 h-12 md:w-16 md:h-16 text-green-500" />
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Setup Complete! 🎉</h3>
                <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                  Your inbound trunk and dispatch rule have been configured successfully
                </p>
              </div>

              <div className="p-6 md:p-8 bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-green-500/5 border-2 border-green-500/30 rounded-xl md:rounded-2xl space-y-6">
                <div>
                  <h4 className="text-sm md:text-base font-bold text-green-400 uppercase tracking-wide mb-5 flex items-center gap-2">
                    <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-500 animate-pulse"></div>
                    Connected Phone Numbers
                  </h4>
                  <div className="grid gap-3 md:gap-4">
                    {inboundConnectedNumbers.map((num, idx) => (
                      <div key={idx} className="flex items-center gap-3 md:gap-4 p-4 md:p-5 bg-background/80 rounded-xl border-2 border-green-500/20 shadow-md">
                        <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-green-500"></div>
                        <span className="font-mono text-base md:text-lg text-foreground font-bold flex-1 break-all">{num}</span>
                        <Check className="w-5 h-5 md:w-6 md:h-6 text-green-500 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-5 md:pt-6 border-t-2 border-green-500/20">
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                    ✨ All incoming calls to these numbers will be automatically routed to your <span className="font-bold text-foreground">inbound agent</span>.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setInboundStep(1);
                  setInboundName("");
                  setInboundPhoneNumbers("");
                  setInboundTrunkId("");
                  setInboundTrunkName("");
                  setInboundConnectedNumbers([]);
                }}
                className="w-full h-12 md:h-14 bg-primary text-foreground rounded-xl md:rounded-2xl text-sm md:text-base font-bold hover:brightness-110 transition-all cursor-pointer shadow-xl flex items-center justify-center gap-2"
              >
                <span>Setup Another Inbound Trunk</span>
                <ChevronUp className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  </div>
);
}

