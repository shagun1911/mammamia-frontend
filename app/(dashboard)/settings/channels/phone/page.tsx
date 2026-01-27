"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Copy, Check, ChevronDown, ChevronUp, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePhoneSettings } from "@/hooks/usePhoneSettings";
import { useAIBehavior } from "@/hooks/useAIBehavior";
import { useInboundAgentConfig } from "@/hooks/useInboundAgentConfig";
import { useOutboundAgentConfig } from "@/hooks/useOutboundAgentConfig";
import { useInboundNumbers } from "@/hooks/useInboundNumbers";
import { VOICE_OPTIONS, phoneSettingsService } from "@/services/phoneSettings.service";
import { toast } from "sonner";
import { VoicePlayground } from "@/components/settings/VoicePlayground";

export default function PhoneSettingsDetailPage() {
  const router = useRouter();
  const { settings, isLoading, updateSettings, isUpdating } = usePhoneSettings();
  const { aiBehavior, updateVoiceAgentHumanOperator } = useAIBehavior();
  const { configs: inboundConfigs, syncConfig, updateConfig } = useInboundAgentConfig();
  const { configs: outboundConfigs, getConfigByNumber, createOrUpdateConfig } = useOutboundAgentConfig();
  const { inboundNumbers: persistedInboundNumbers, isLoading: isLoadingInboundNumbers, addNumbers: addInboundNumbersMutation } = useInboundNumbers();

  const [activeTab, setActiveTab] = useState<"settings" | "voice" | "endOfCall" | "inbound" | "greeting">("settings");
  const [copied, setCopied] = useState(false);

  // Form state
  const [selectedVoice, setSelectedVoice] = useState(settings?.selectedVoice || "adam");
  const [customVoiceId, setCustomVoiceId] = useState(settings?.customVoiceId || "");
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState(settings?.twilioPhoneNumber || "");
  const [livekitSipTrunkId, setLivekitSipTrunkId] = useState(settings?.livekitSipTrunkId || "");
  const [twilioTrunkSid, setTwilioTrunkSid] = useState(settings?.twilioTrunkSid || "");
  const [terminationUri, setTerminationUri] = useState(settings?.terminationUri || "");
  const [originationUri, setOriginationUri] = useState(settings?.originationUri || "");
  const [humanOperatorPhone, setHumanOperatorPhone] = useState(settings?.humanOperatorPhone || "");
  const [escalationRules, setEscalationRules] = useState<string[]>(
    aiBehavior?.voiceAgent?.humanOperator?.escalationRules || []
  );

  // Setup methods state
  const [showSetupMethods, setShowSetupMethods] = useState(false);
  const [activeSetupMethod, setActiveSetupMethod] = useState<"full" | "generic" | null>(null);
  const [isSettingUp, setIsSettingUp] = useState(false);

  // Full Setup (Method 1) form state
  const [fullSetupLabel, setFullSetupLabel] = useState("");
  const [fullSetupPhone, setFullSetupPhone] = useState("");
  const [fullSetupTwilioSid, setFullSetupTwilioSid] = useState("");
  const [fullSetupTwilioToken, setFullSetupTwilioToken] = useState("");

  // Generic SIP Trunk (Method 2) form state
  const [genericSetupLabel, setGenericSetupLabel] = useState("");
  const [genericSetupPhone, setGenericSetupPhone] = useState("");
  const [genericSetupSipAddress, setGenericSetupSipAddress] = useState("");
  const [genericSetupUsername, setGenericSetupUsername] = useState("");
  const [genericSetupPassword, setGenericSetupPassword] = useState("");
  const [genericSetupTransport, setGenericSetupTransport] = useState("udp");

  // Inbound setup state
  const [inboundStep, setInboundStep] = useState(1);
  const [inboundName, setInboundName] = useState("");
  const [inboundPhoneNumbers, setInboundPhoneNumbers] = useState("");
  const [inboundKrispEnabled, setInboundKrispEnabled] = useState(true);
  const [inboundTrunkId, setInboundTrunkId] = useState("");
  const [inboundTrunkName, setInboundTrunkName] = useState("");
  const [inboundConnectedNumbers, setInboundConnectedNumbers] = useState<string[]>([]);
  const [isCreatingInbound, setIsCreatingInbound] = useState(false);

  // Greeting message and language settings (for Settings tab)
  const [greetingMessage, setGreetingMessage] = useState("");
  const [language, setLanguage] = useState("en");

  // Edit mode for inbound configs
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const [editGreetingMessage, setEditGreetingMessage] = useState("");
  const [editLanguage, setEditLanguage] = useState("en");
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Outbound number selector state
  const [selectedOutboundNumber, setSelectedOutboundNumber] = useState<string | null>(null);


  // Update form state when settings load
  useEffect(() => {
    if (settings) {
      setSelectedVoice(settings.selectedVoice);
      setCustomVoiceId(settings.customVoiceId || "");
      setTwilioPhoneNumber(settings.twilioPhoneNumber);
      setLivekitSipTrunkId(settings.livekitSipTrunkId);
      setTwilioTrunkSid(settings.twilioTrunkSid || "");
      setTerminationUri(settings.terminationUri || "");
      setOriginationUri(settings.originationUri || "");
      setHumanOperatorPhone(settings.humanOperatorPhone);
    }
  }, [settings]);

  useEffect(() => {
    if (aiBehavior?.voiceAgent?.humanOperator?.escalationRules) {
      setEscalationRules(aiBehavior.voiceAgent.humanOperator.escalationRules);
    }
  }, [aiBehavior]);

  // Load greeting message and language from first inbound config
  useEffect(() => {
    if (inboundConfigs && inboundConfigs.length > 0) {
      const firstConfig = inboundConfigs[0];
      setGreetingMessage(firstConfig.greeting_message || "Hello! How can I help you today?");
      setLanguage(firstConfig.language || "en");
      console.log('📝 [Phone Settings] Loaded greeting message and language from first inbound config:', {
        greeting_message: firstConfig.greeting_message,
        language: firstConfig.language
      });
    }
  }, [inboundConfigs]);

  // Hydrate inbound form fields from GET /inbound-numbers API (SOURCE OF TRUTH)
  useEffect(() => {
    console.log('🔄 [Phone Settings] Hydration effect triggered:', {
      isLoadingInboundNumbers,
      persistedInboundNumbersLength: persistedInboundNumbers?.length || 0,
      persistedInboundNumbers,
      settingsInboundPhoneNumbersLength: settings?.inboundPhoneNumbers?.length || 0
    });

    // ALWAYS fetch from GET /inbound-numbers API (SOURCE OF TRUTH)
    // Never rely on local state or settings alone
    if (isLoadingInboundNumbers) {
      console.log('⏳ [Phone Settings] Still loading inbound numbers from API (SOURCE OF TRUTH), waiting...');
      return; // Still loading, wait
    }

    // Load from persisted inbound numbers API (SOURCE OF TRUTH)
    if (persistedInboundNumbers && persistedInboundNumbers.length > 0) {
      console.log('✅ [Phone Settings] Loaded inbound numbers from API (SOURCE OF TRUTH):', persistedInboundNumbers);
      setInboundConnectedNumbers(persistedInboundNumbers);
      setInboundPhoneNumbers(persistedInboundNumbers.join(', '));
    } else {
      console.log('ℹ️ [Phone Settings] No inbound numbers found in API (empty array)');
      // Clear state if API returns empty
      setInboundConnectedNumbers([]);
      setInboundPhoneNumbers('');
    }
    
    // Then, hydrate from settings (for trunk/dispatch rule info)
    if (settings) {
      // If inbound trunk data exists, populate the form fields
      if (settings.inboundTrunkId && settings.inboundTrunkName) {
        setInboundTrunkId(settings.inboundTrunkId);
        setInboundTrunkName(settings.inboundTrunkName);
        setInboundName(settings.inboundTrunkName);

        // If dispatch rule exists, setup is complete (step 3)
        if (settings.inboundDispatchRuleId) {
          setInboundStep(3);
        } else if (settings.inboundTrunkId) {
          // Trunk exists but no dispatch rule (step 2)
          setInboundStep(2);
        }

        console.log('📝 [Phone Settings] Hydrated inbound trunk info from saved settings:', {
          trunkId: settings.inboundTrunkId,
          trunkName: settings.inboundTrunkName,
          step: settings.inboundDispatchRuleId ? 3 : 2
        });
      }
    }
  }, [settings, persistedInboundNumbers, isLoadingInboundNumbers]);

  // Get list of available outbound numbers
  // Include both saved settings AND current input value (for immediate UI feedback)
  const getAvailableOutboundNumbers = (): string[] => {
    const numbers = new Set<string>();
    
    // Add number from current input if valid (for immediate feedback)
    if (twilioPhoneNumber && twilioPhoneNumber.trim()) {
      const phoneNumberRegex = /^\+[1-9]\d{1,14}$/;
      if (phoneNumberRegex.test(twilioPhoneNumber.trim())) {
        console.log('📞 [Outbound] Adding number from current input:', twilioPhoneNumber);
        numbers.add(twilioPhoneNumber.trim());
      }
    }
    
    // Add number from settings if exists
    if (settings?.twilioPhoneNumber) {
      console.log('📞 [Outbound] Adding number from settings:', settings.twilioPhoneNumber);
      numbers.add(settings.twilioPhoneNumber);
    }
    
    // Add numbers from outbound configs
    if (outboundConfigs && outboundConfigs.length > 0) {
      console.log('📞 [Outbound] Found outbound configs:', outboundConfigs.length);
      outboundConfigs.forEach(config => {
        if (config.outboundNumber) {
          console.log('📞 [Outbound] Adding number from config:', config.outboundNumber);
          numbers.add(config.outboundNumber);
        }
      });
    } else {
      console.log('📞 [Outbound] No outbound configs found');
    }
    
    const result = Array.from(numbers).sort();
    console.log('📞 [Outbound] Available outbound numbers:', result);
    return result;
  };

  const availableOutboundNumbers = getAvailableOutboundNumbers();

  // Update selected outbound number when twilioPhoneNumber changes and it's available
  useEffect(() => {
    console.log('🔄 [Outbound Selector] Effect triggered:', {
      twilioPhoneNumber: settings?.twilioPhoneNumber,
      selectedOutboundNumber,
      availableOutboundNumbersLength: availableOutboundNumbers.length,
      availableOutboundNumbers
    });
    
    if (settings?.twilioPhoneNumber && !selectedOutboundNumber && availableOutboundNumbers.length > 0) {
      if (availableOutboundNumbers.includes(settings.twilioPhoneNumber)) {
        console.log('✅ [Outbound Selector] Auto-selecting from settings:', settings.twilioPhoneNumber);
        setSelectedOutboundNumber(settings.twilioPhoneNumber);
      } else if (availableOutboundNumbers.length > 0) {
        // Select first available number if current twilioPhoneNumber not in list
        console.log('✅ [Outbound Selector] Auto-selecting first available:', availableOutboundNumbers[0]);
        setSelectedOutboundNumber(availableOutboundNumbers[0]);
      }
    }
  }, [settings?.twilioPhoneNumber, selectedOutboundNumber, availableOutboundNumbers]);

  // Auto-select first outbound number if none selected
  useEffect(() => {
    if (!selectedOutboundNumber && availableOutboundNumbers.length > 0) {
      console.log('✅ [Outbound Selector] Auto-selecting first available number:', availableOutboundNumbers[0]);
      setSelectedOutboundNumber(availableOutboundNumbers[0]);
    }
  }, [selectedOutboundNumber, availableOutboundNumbers]);

  // Load config when outbound number is selected
  useEffect(() => {
    if (selectedOutboundNumber && outboundConfigs) {
      const config = outboundConfigs.find(c => c.outboundNumber === selectedOutboundNumber);
      
      if (config) {
        // Load config values
        setSelectedVoice(config.selectedVoice || 'adam');
        setCustomVoiceId(config.customVoiceId || '');
        setHumanOperatorPhone(config.humanOperatorPhone || '');
        setEscalationRules(config.escalationRules || []);
        setGreetingMessage(config.greetingMessage || 'Hello! How can I help you today?');
        setLanguage(config.language || 'en');
      } else {
        // No config exists, use defaults or settings
        setSelectedVoice(settings?.selectedVoice || 'adam');
        setCustomVoiceId(settings?.customVoiceId || '');
        setHumanOperatorPhone(settings?.humanOperatorPhone || '');
        setEscalationRules(aiBehavior?.voiceAgent?.humanOperator?.escalationRules || []);
        setGreetingMessage(settings?.greetingMessage || 'Hello! How can I help you today?');
        setLanguage(settings?.language || 'en');
      }
    } else if (selectedOutboundNumber && !outboundConfigs) {
      // Configs are still loading, use defaults
      setSelectedVoice(settings?.selectedVoice || 'adam');
      setCustomVoiceId(settings?.customVoiceId || '');
      setHumanOperatorPhone(settings?.humanOperatorPhone || '');
      setEscalationRules(aiBehavior?.voiceAgent?.humanOperator?.escalationRules || []);
      setGreetingMessage(settings?.greetingMessage || 'Hello! How can I help you today?');
      setLanguage(settings?.language || 'en');
    }
  }, [selectedOutboundNumber, outboundConfigs, settings, aiBehavior]);

  const handleSaveSettings = async () => {
    console.log('💾 [Phone Settings] ==========================================');
    console.log('💾 [Phone Settings] SAVE SETTINGS CALLED');
    console.log('📝 [Phone Settings] Greeting message:', greetingMessage);
    console.log('🌍 [Phone Settings] Language:', language);
    console.log('🎤 [Phone Settings] Selected voice:', selectedVoice);
    console.log('📞 [Phone Settings] Selected outbound number:', selectedOutboundNumber);
    console.log('📞 [Phone Settings] Available outbound numbers:', availableOutboundNumbers);
    console.log('💾 [Phone Settings] ==========================================');
    
    try {
      // Save infrastructure phone settings (not per-number)
      console.log('📞 [Phone Settings] Step 1: Saving infrastructure phone settings...');
      const updatedSettings = await updateSettings({
        twilioPhoneNumber,
        livekitSipTrunkId,
        twilioTrunkSid,
        terminationUri,
        originationUri,
      });
      console.log('✅ [Phone Settings] Infrastructure settings saved');
      console.log('✅ [Phone Settings] Updated settings:', updatedSettings);
      
      // After saving, the availableOutboundNumbers should update automatically
      // because it reads from settings.twilioPhoneNumber

      // Determine which outbound number to use for per-number config
      let outboundNumberToSave = selectedOutboundNumber;
      
      // If no number selected but twilioPhoneNumber exists, use it
      if (!outboundNumberToSave && twilioPhoneNumber && twilioPhoneNumber.trim()) {
        const phoneNumberRegex = /^\+[1-9]\d{1,14}$/;
        if (phoneNumberRegex.test(twilioPhoneNumber.trim())) {
          outboundNumberToSave = twilioPhoneNumber.trim();
          setSelectedOutboundNumber(outboundNumberToSave);
          console.log('📞 [Phone Settings] Auto-selected outbound number:', outboundNumberToSave);
        }
      }

      // Save per-outbound-number configuration
      if (outboundNumberToSave) {
        console.log('📞 [Phone Settings] Step 2: Saving outbound agent config for', outboundNumberToSave);
        try {
          await createOrUpdateConfig.mutateAsync({
            outboundNumber: outboundNumberToSave,
            data: {
              selectedVoice,
              customVoiceId,
              humanOperatorPhone,
              greetingMessage,
              language,
            }
          });
          console.log('✅ [Phone Settings] Outbound agent config saved for', outboundNumberToSave);
          
          // Refresh available numbers after save
          console.log('🔄 [Phone Settings] Refreshing available outbound numbers...');
        } catch (error: any) {
          console.error('❌ [Phone Settings] Failed to save outbound config:', error);
          console.error('❌ [Phone Settings] Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
          });
          // Don't throw - infrastructure settings were saved successfully
          toast.error(`Failed to save outbound config: ${error.response?.data?.error?.message || error.message || 'Unknown error'}`);
        }
      } else {
        console.warn('⚠️ [Phone Settings] No outbound number available, skipping per-number config save');
        if (twilioPhoneNumber) {
          toast.warning('Please enter a valid phone number in E.164 format (e.g., +1234567890)');
        } else {
          toast.warning('Infrastructure settings saved, but no outbound number configured for per-number settings');
        }
      }

      // Update greeting message and language for all inbound configs
      if (inboundConfigs && inboundConfigs.length > 0) {
        console.log(`📞 [Phone Settings] Step 2: Updating ${inboundConfigs.length} inbound configs`);
        
        const updatePromises = inboundConfigs.map(async (config) => {
          console.log(`🔄 [Phone Settings] Updating config for ${config.calledNumber}`);
          console.log(`📦 [Phone Settings] Update data:`, {
            calledNumber: config.calledNumber,
            greeting_message: greetingMessage,
            language: language,
          });
          
          try {
            const result = await updateConfig.mutateAsync({
              calledNumber: config.calledNumber,
              greeting_message: greetingMessage,
              language: language,
            });
            console.log(`✅ [Phone Settings] Successfully updated ${config.calledNumber}`, result);
            return { success: true, calledNumber: config.calledNumber };
          } catch (error: any) {
            console.error(`❌ [Phone Settings] Failed to update ${config.calledNumber}:`, error);
            console.error(`📊 [Phone Settings] Error details:`, {
              message: error.message,
              response: error.response?.data
            });
            return { success: false, calledNumber: config.calledNumber, error: error.message };
          }
        });
        
        const results = await Promise.all(updatePromises);
        
        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;
        
        console.log('📊 [Phone Settings] Update results:', {
          total: results.length,
          success: successCount,
          failed: failCount,
          details: results
        });
        
        if (successCount > 0) {
          toast.success(`Greeting message saved! Updated in both outbound-call-config and ${successCount} inbound-agent-config(s)`);
        }
        
        if (failCount > 0) {
          toast.error(`Failed to update ${failCount} inbound config(s). Check console for details.`);
        }
        
        // Refresh the configs to show updated values
        console.log('🔄 [Phone Settings] Refreshing configs...');
        await syncConfig.mutateAsync();
        console.log('✅ [Phone Settings] Configs refreshed');
        
      } else {
        console.warn('⚠️  [Phone Settings] No inbound configs found to update');
      }
      
      toast.success('Settings saved successfully!');
    } catch (error: any) {
      console.error('❌ [Phone Settings] Save failed:', error);
      toast.error(error.message || 'Failed to save settings');
    }
  };

  const handleSaveEscalationRules = async () => {
    // Determine which outbound number to use
    let outboundNumberToSave = selectedOutboundNumber;
    
    // If no number selected but twilioPhoneNumber exists, use it
    if (!outboundNumberToSave && twilioPhoneNumber) {
      outboundNumberToSave = twilioPhoneNumber;
      setSelectedOutboundNumber(twilioPhoneNumber);
    }
    
    if (!outboundNumberToSave) {
      toast.error('Please select an outbound number to configure');
      return;
    }

    try {
      // Save escalation rules to per-outbound config
      console.log('💾 [Escalation Rules] Saving for outbound number:', outboundNumberToSave);
      await createOrUpdateConfig.mutateAsync({
        outboundNumber: outboundNumberToSave,
        data: {
          escalationRules,
        }
      });
      toast.success('Escalation rules saved successfully!');
    } catch (error: any) {
      console.error('❌ [Phone Settings] Failed to save escalation rules:', error);
      console.error('❌ [Phone Settings] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error(error.response?.data?.error?.message || error.message || 'Failed to save escalation rules');
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

  const addEscalationRule = () => {
    setEscalationRules([...escalationRules, ""]);
  };

  const updateEscalationRule = (index: number, value: string) => {
    const updated = [...escalationRules];
    updated[index] = value;
    setEscalationRules(updated);
  };

  const removeEscalationRule = (index: number) => {
    setEscalationRules(escalationRules.filter((_, i) => i !== index));
  };

  // Full SIP Trunk Setup (Method 1)
  const handleFullSetup = async () => {
    if (!fullSetupLabel || !fullSetupPhone || !fullSetupTwilioSid || !fullSetupTwilioToken) {
      toast.error("Please fill in all required fields");
      return;
    }

    console.log('🚀 [SIP Trunk Setup] Starting full setup...');
    console.log('📋 [SIP Trunk Setup] Request data:', {
      label: fullSetupLabel,
      phone_number: fullSetupPhone,
      twilio_sid: fullSetupTwilioSid,
      twilio_auth_token: '***hidden***'
    });

    setIsSettingUp(true);
    try {
      const result = await phoneSettingsService.setupSipTrunk({
        label: fullSetupLabel,
        phone_number: fullSetupPhone,
        twilio_sid: fullSetupTwilioSid,
        twilio_auth_token: fullSetupTwilioToken,
      });

      console.log('✅ [SIP Trunk Setup] Full response received:');
      console.log(JSON.stringify(result, null, 2));
      console.log('📊 [SIP Trunk Setup] Response fields:', {
        status: result.status,
        message: result.message,
        livekit_trunk_id: result.livekit_trunk_id,
        twilio_trunk_sid: result.twilio_trunk_sid,
        termination_uri: result.termination_uri,
        origination_uri: result.origination_uri,
        credential_list_sid: result.credential_list_sid,
        ip_acl_sid: result.ip_acl_sid,
        username: result.username,
        origination_uri_sid: result.origination_uri_sid
      });

      // Auto-fill the form with returned values
      console.log('💾 [SIP Trunk Setup] Setting form values...');
      setTwilioPhoneNumber(fullSetupPhone);
      setLivekitSipTrunkId(result.livekit_trunk_id);
      setTwilioTrunkSid(result.twilio_trunk_sid);
      setTerminationUri(result.termination_uri);
      setOriginationUri(result.origination_uri);
      console.log('✅ [SIP Trunk Setup] Form values set:', {
        twilioPhoneNumber: fullSetupPhone,
        livekitSipTrunkId: result.livekit_trunk_id,
        twilioTrunkSid: result.twilio_trunk_sid,
        terminationUri: result.termination_uri,
        originationUri: result.origination_uri
      });

      // Save settings automatically
      console.log('💾 [SIP Trunk Setup] Saving settings to database...');
      await updateSettings({
        selectedVoice,
        twilioPhoneNumber: fullSetupPhone,
        livekitSipTrunkId: result.livekit_trunk_id,
        twilioTrunkSid: result.twilio_trunk_sid,
        terminationUri: result.termination_uri,
        originationUri: result.origination_uri,
        humanOperatorPhone,
      });
      console.log('✅ [SIP Trunk Setup] Settings saved successfully');

      toast.success("SIP Trunk setup completed successfully!");
      setShowSetupMethods(false);
      setActiveSetupMethod(null);
      
      // Clear form
      setFullSetupLabel("");
      setFullSetupPhone("");
      setFullSetupTwilioSid("");
      setFullSetupTwilioToken("");
      
      console.log('🎉 [SIP Trunk Setup] Setup process completed!');
    } catch (error: any) {
      console.error('❌ [SIP Trunk Setup] Setup failed:', error);
      console.error('📊 [SIP Trunk Setup] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error(error.message || "Failed to setup SIP trunk");
    } finally {
      setIsSettingUp(false);
    }
  };

  // Inbound Setup - Step 1: Create Inbound Trunk
  const handleCreateInboundTrunk = async () => {
    if (!inboundName || !inboundPhoneNumbers) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsCreatingInbound(true);
    try {
      const phoneNumbersArray = inboundPhoneNumbers.split(',').map(num => num.trim()).filter(Boolean);
      
      // Validate phone numbers format (E.164)
      const phoneNumberRegex = /^\+[1-9]\d{1,14}$/;
      const invalidNumbers = phoneNumbersArray.filter(num => !phoneNumberRegex.test(num));
      if (invalidNumbers.length > 0) {
        toast.error(`Invalid phone number format: ${invalidNumbers.join(', ')}. Please use E.164 format (e.g., +1234567890)`);
        setIsCreatingInbound(false);
        return;
      }

      if (phoneNumbersArray.length === 0) {
        toast.error("Please enter at least one valid phone number");
        setIsCreatingInbound(false);
        return;
      }
      
      const API_URL = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'https://keplerov1-python-2.onrender.com';
      const url = `${API_URL}/calls/create-inbound-trunk`;
      const requestBody = {
        name: inboundName.trim(),
        phone_numbers: phoneNumbersArray,
        krisp_enabled: inboundKrispEnabled,
      };

      console.log('\n🚀 [Inbound Trunk] Creating inbound trunk...');
      console.log('📍 [Inbound Trunk] URL:', url);
      console.log('📦 [Inbound Trunk] Request Body:', JSON.stringify(requestBody, null, 2));
      console.log('📋 [Inbound Trunk] Validation:', {
        nameLength: requestBody.name.length,
        phoneNumbersCount: requestBody.phone_numbers.length,
        phoneNumbers: requestBody.phone_numbers,
        krispEnabled: requestBody.krisp_enabled
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📊 [Inbound Trunk] Response Status:', response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = 'Failed to create inbound trunk';
        try {
          const errorData = await response.json();
          console.error('❌ [Inbound Trunk] Error Response:', JSON.stringify(errorData, null, 2));
          
          // Handle different error response formats
          if (errorData.detail) {
            // FastAPI format: {"detail": "error message"} or {"detail": [{"msg": "...", "loc": [...]}]}
            if (Array.isArray(errorData.detail)) {
              errorMessage = errorData.detail.map((err: any) => 
                `${err.loc?.join('.') || 'Field'}: ${err.msg || err.message || 'Invalid value'}`
              ).join(', ');
            } else if (typeof errorData.detail === 'string') {
              errorMessage = errorData.detail;
            } else {
              errorMessage = JSON.stringify(errorData.detail);
            }
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = typeof errorData.error === 'string' ? errorData.error : errorData.error.message || JSON.stringify(errorData.error);
          } else {
            errorMessage = `Server error (${response.status}): ${response.statusText}`;
          }
        } catch (parseError) {
          // If response is not JSON, try to get text
          try {
            const errorText = await response.text();
            console.error('❌ [Inbound Trunk] Non-JSON Error Response:', errorText);
            errorMessage = errorText || `Server error (${response.status}): ${response.statusText}`;
          } catch (textError) {
            console.error('❌ [Inbound Trunk] Could not parse error response');
            errorMessage = `Server error (${response.status}): ${response.statusText}`;
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ [Inbound Trunk] Response Body:', JSON.stringify(data, null, 2));
      
      // Store trunk info and move to step 2
      setInboundTrunkId(data.trunk_id);
      setInboundTrunkName(data.trunk_name);
      setInboundConnectedNumbers(data.phone_numbers);
      
      // Persist inbound numbers to new InboundNumber model (checks duplicates, reuses trunkId)
      if (data.phone_numbers && data.phone_numbers.length > 0 && data.trunk_id) {
        try {
          console.log('💾 [Inbound Trunk] Saving inbound numbers to database with trunkId:', data.trunk_id);
          
          // Use the new API that handles duplicates and trunk reuse
          const result = await addInboundNumbersMutation.mutateAsync({
            phoneNumbers: data.phone_numbers,
            trunkId: data.trunk_id,
            provider: 'livekit'
          });
          
          console.log('✅ [Inbound Trunk] Persisted inbound numbers:', {
            created: result.created || 0,
            reused: result.reused || 0,
            total: result.total || result.inboundNumbers?.length || 0,
            numbers: result.inboundNumbers || []
          });
          
          // Also update PhoneSettings for backward compatibility
          await updateSettings({
            inboundTrunkId: data.trunk_id,
            inboundTrunkName: data.trunk_name,
            inboundPhoneNumbers: result.inboundNumbers || data.phone_numbers,
          });
          console.log('✅ [Inbound Trunk] Updated PhoneSettings with inbound numbers');
        } catch (error: any) {
          console.error('⚠️ [Inbound Trunk] Failed to persist inbound numbers:', error);
          console.error('⚠️ [Inbound Trunk] Error details:', error.response?.data);
          // Don't block the flow, but show warning
          toast.warning('Trunk created but failed to save numbers. Please refresh and try again.');
        }
      }
      
      setInboundStep(2);
      
      toast.success('Inbound trunk created successfully!');
    } catch (error: any) {
      console.error('❌ [Inbound Trunk] Error:', error);
      console.error('❌ [Inbound Trunk] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Show user-friendly error message
      const errorMessage = error.message || 'Failed to create inbound trunk. Please check the console for details.';
      toast.error(errorMessage);
      
      // Log full error for debugging
      if (error.message?.includes('500') || error.message?.includes('Server error')) {
        console.error('⚠️ [Inbound Trunk] This appears to be a server-side error. Please check:');
        console.error('  1. Python API server is running and accessible');
        console.error('  2. Python API logs for detailed error information');
        console.error('  3. Network connectivity to:', process.env.NEXT_PUBLIC_PYTHON_API_URL || 'https://keplerov1-python-2.onrender.com');
      }
    } finally {
      setIsCreatingInbound(false);
    }
  };

  // Inbound Setup - Step 2: Create Dispatch Rule
  const handleCreateDispatchRule = async () => {
    if (!inboundTrunkId) {
      toast.error("Trunk ID is missing");
      return;
    }

    setIsCreatingInbound(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'https://keplerov1-python-2.onrender.com';
      
      // Build URL with query parameters
      const queryParams = new URLSearchParams({
        sip_trunk_id: inboundTrunkId,
        name: inboundTrunkName,
        agent_name: "inbound-agent",
      });
      const url = `${API_URL}/calls/create-dispatch-rule?${queryParams.toString()}`;

      console.log('\n🚀 [Dispatch Rule] Creating dispatch rule...');
      console.log('📍 [Dispatch Rule] URL:', url);
      console.log('📦 [Dispatch Rule] Query Parameters:', {
        sip_trunk_id: inboundTrunkId,
        name: inboundTrunkName,
        agent_name: "inbound-agent",
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📊 [Dispatch Rule] Response Status:', response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = 'Failed to create dispatch rule';
        try {
          const errorData = await response.json();
          console.error('❌ [Dispatch Rule] Error Response:', JSON.stringify(errorData, null, 2));
          
          // Handle different error response formats
          if (errorData.detail) {
            if (Array.isArray(errorData.detail)) {
              errorMessage = errorData.detail.map((err: any) => 
                `${err.loc?.join('.') || 'Field'}: ${err.msg || err.message || 'Invalid value'}`
              ).join(', ');
            } else if (typeof errorData.detail === 'string') {
              errorMessage = errorData.detail;
            } else {
              errorMessage = JSON.stringify(errorData.detail);
            }
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = typeof errorData.error === 'string' ? errorData.error : errorData.error.message || JSON.stringify(errorData.error);
          } else {
            errorMessage = `Server error (${response.status}): ${response.statusText}`;
          }
        } catch (parseError) {
          try {
            const errorText = await response.text();
            console.error('❌ [Dispatch Rule] Non-JSON Error Response:', errorText);
            errorMessage = errorText || `Server error (${response.status}): ${response.statusText}`;
          } catch (textError) {
            console.error('❌ [Dispatch Rule] Could not parse error response');
            errorMessage = `Server error (${response.status}): ${response.statusText}`;
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ [Dispatch Rule] Response Body:', JSON.stringify(data, null, 2));
      
      // Save to database
      console.log('💾 [Dispatch Rule] Saving to database...');
      
      // Merge with existing phone numbers instead of replacing
      const existingNumbers = settings?.inboundPhoneNumbers || [];
      const newNumbers = inboundConnectedNumbers.filter(num => !existingNumbers.includes(num));
      const allPhoneNumbers = [...existingNumbers, ...newNumbers];
      
      console.log('📞 [Dispatch Rule] Existing numbers:', existingNumbers);
      console.log('📞 [Dispatch Rule] New numbers from trunk:', inboundConnectedNumbers);
      console.log('📞 [Dispatch Rule] Numbers to add:', newNumbers);
      console.log('📞 [Dispatch Rule] Combined numbers:', allPhoneNumbers);
      
      // Persist inbound numbers to database using new API (handles duplicates, reuses trunkId)
      if (allPhoneNumbers.length > 0 && inboundTrunkId) {
        try {
          console.log('💾 [Dispatch Rule] Saving inbound numbers with trunkId:', inboundTrunkId);
          
          // Use the new API that handles duplicates and trunk reuse
          const result = await addInboundNumbersMutation.mutateAsync({
            phoneNumbers: allPhoneNumbers,
            trunkId: inboundTrunkId,
            provider: 'livekit'
          });
          
          console.log('✅ [Dispatch Rule] Persisted inbound numbers:', {
            created: result.created || 0,
            reused: result.reused || 0,
            total: result.total || result.inboundNumbers?.length || 0,
            numbers: result.inboundNumbers || []
          });
          
          // Also update PhoneSettings for backward compatibility
          await updateSettings({
            inboundPhoneNumbers: result.inboundNumbers || allPhoneNumbers,
          });
          console.log('✅ [Dispatch Rule] Updated PhoneSettings with inbound numbers');
        } catch (error: any) {
          console.error('⚠️ [Dispatch Rule] Failed to persist inbound numbers:', error);
          console.error('⚠️ [Dispatch Rule] Error details:', error.response?.data);
          // Continue with the flow even if persistence fails
        }
      }
      
      const updateData = {
        inboundTrunkId: inboundTrunkId,
        inboundTrunkName: inboundTrunkName,
        inboundDispatchRuleId: data.dispatch_rule_id,
        inboundDispatchRuleName: data.dispatch_rule_name,
        inboundPhoneNumbers: allPhoneNumbers,
      };
      console.log('💾 [Dispatch Rule] Update data:', JSON.stringify(updateData, null, 2));
      
      // Await the mutation to ensure it completes
      try {
        await updateSettings(updateData);
        console.log('✅ [Dispatch Rule] Saved to database successfully');
        console.log('ℹ️ [Dispatch Rule] Auto-sync will trigger from phoneSettings.service.ts');
        
        toast.success('Inbound setup completed successfully!');
        setInboundStep(3); // Success screen
        
        // Refresh configs to show the synced data
        setTimeout(() => {
          console.log('🔄 [Dispatch Rule] Refreshing inbound agent configs display...');
          syncConfig.mutate();
        }, 2000);
      } catch (dbError: any) {
        console.error('❌ [Dispatch Rule] Database save error:', dbError);
        toast.error('Dispatch rule created but failed to save settings: ' + (dbError.message || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('❌ [Dispatch Rule] Error:', error);
      console.error('❌ [Dispatch Rule] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      const errorMessage = error.message || 'Failed to create dispatch rule. Please check the console for details.';
      toast.error(errorMessage);
      
      if (error.message?.includes('500') || error.message?.includes('Server error')) {
        console.error('⚠️ [Dispatch Rule] This appears to be a server-side error. Please check:');
        console.error('  1. Python API server is running and accessible');
        console.error('  2. Python API logs for detailed error information');
        console.error('  3. Network connectivity to:', process.env.NEXT_PUBLIC_PYTHON_API_URL || 'https://keplerov1-python-2.onrender.com');
      }
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

  // Handle edit config
  const handleEditConfig = (config: any) => {
    console.log('🖊️ [Edit Config] Starting edit for config:', config._id);
    console.log('📋 [Edit Config] Current values:', {
      greeting_message: config.greeting_message,
      language: config.language
    });
    
    setEditingConfigId(config._id);
    setEditGreetingMessage(config.greeting_message || "Hello! How can I help you today?");
    setEditLanguage(config.language || "en");
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    console.log('❌ [Edit Config] Canceling edit');
    setEditingConfigId(null);
    setEditGreetingMessage("");
    setEditLanguage("en");
  };

  // Handle save config
  const handleSaveConfig = async (config: any) => {
    console.log('💾 [Save Config] ==========================================');
    console.log('💾 [Save Config] SAVE CONFIG CALLED');
    console.log('💾 [Save Config] Config ID:', config._id);
    console.log('💾 [Save Config] Called Number:', config.calledNumber);
    console.log('💾 [Save Config] New greeting message:', editGreetingMessage);
    console.log('💾 [Save Config] New language:', editLanguage);
    console.log('💾 [Save Config] ==========================================');
    
    setIsSavingConfig(true);
    try {
      const updateData = {
        calledNumber: config.calledNumber,
        greeting_message: editGreetingMessage,
        language: editLanguage,
      };
      
      console.log('📤 [Save Config] Sending update request with data:', JSON.stringify(updateData, null, 2));
      
      await updateConfig.mutateAsync(updateData);
      
      console.log('✅ [Save Config] Config updated successfully');
      
      toast.success('Configuration updated successfully');
      setEditingConfigId(null);
      setEditGreetingMessage("");
      setEditLanguage("en");
    } catch (error: any) {
      console.error('❌ [Save Config] Error updating config:', error);
      console.error('📊 [Save Config] Error details:', {
        message: error.message,
        response: error.response?.data
      });
      toast.error(error.message || 'Failed to update configuration');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Generic SIP Trunk Setup (Method 2)
  const handleGenericSetup = async () => {
    if (!genericSetupLabel || !genericSetupPhone || !genericSetupSipAddress || !genericSetupUsername || !genericSetupPassword) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSettingUp(true);
    try {
      const result = await phoneSettingsService.createGenericSipTrunk({
        label: genericSetupLabel,
        phone_number: genericSetupPhone,
        sip_address: genericSetupSipAddress,
        username: genericSetupUsername,
        password: genericSetupPassword,
        transport: genericSetupTransport,
      });

      // Auto-fill the form with returned values
      setTwilioPhoneNumber(result.phone_number);
      setLivekitSipTrunkId(result.livekit_trunk_id);

      // Save settings automatically
      await updateSettings({
        selectedVoice,
        twilioPhoneNumber: result.phone_number,
        livekitSipTrunkId: result.livekit_trunk_id,
        humanOperatorPhone,
      });

      toast.success("Generic SIP Trunk created successfully!");
      setShowSetupMethods(false);
      setActiveSetupMethod(null);
      
      // Clear form
      setGenericSetupLabel("");
      setGenericSetupPhone("");
      setGenericSetupSipAddress("");
      setGenericSetupUsername("");
      setGenericSetupPassword("");
      setGenericSetupTransport("udp");
    } catch (error: any) {
      toast.error(error.message || "Failed to create Generic SIP trunk");
      console.error("Setup error:", error);
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
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/settings/channels")}
            className="w-10 h-10 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Phone (Voice) Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure your voice agent and phone integration
            </p>
          </div>
        </div>

        {settings?.isConfigured && settings.twilioPhoneNumber && (
          <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2.5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <div>
              <div className="text-xs text-green-400 font-medium mb-0.5">Number Connected</div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-foreground">{settings.twilioPhoneNumber}</span>
                <button
                  onClick={handleCopyNumber}
                  className="p-1 hover:bg-green-500/10 rounded transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-lg p-1 mb-6 max-w-2xl">
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === "settings"
              ? "bg-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Settings
        </button>
        <button
          onClick={() => setActiveTab("voice")}
          className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === "voice"
              ? "bg-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Voice Playground
        </button>
        <button
          onClick={() => setActiveTab("endOfCall")}
          className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === "endOfCall"
              ? "bg-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          End of Call
        </button>
        <button
          onClick={() => setActiveTab("inbound")}
          className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === "inbound"
              ? "bg-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Inbound
        </button>
        <button
          onClick={() => setActiveTab("greeting")}
          className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === "greeting"
              ? "bg-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Greeting Message
        </button>
      </div>

      {/* Outbound Number Selector - Show for Settings and End of Call tabs */}
      {(activeTab === "settings" || activeTab === "endOfCall") && (
        <div className="mb-6 max-w-2xl">
          <div className="bg-card border border-border rounded-xl p-5">
            <label className="block text-sm font-semibold text-foreground mb-4">
              Select Outbound Number <span className="text-red-500">*</span>
            </label>
            {/* Debug info - remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-4 p-2 bg-gray-500/10 border border-gray-500/20 rounded text-xs font-mono">
                <div>Current Input: {twilioPhoneNumber || '(empty)'}</div>
                <div>Settings Number: {settings?.twilioPhoneNumber || '(none)'}</div>
                <div>Outbound Configs: {outboundConfigs?.length || 0}</div>
                <div>Available Numbers: {availableOutboundNumbers.length}</div>
                <div>Selected: {selectedOutboundNumber || '(none)'}</div>
              </div>
            )}
            {availableOutboundNumbers.length === 0 ? (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-sm text-yellow-400 mb-2">
                  No outbound numbers configured yet.
                </p>
                <p className="text-xs text-yellow-300 mb-3">
                  Enter a phone number in the "Phone Number" field below (in E.164 format, e.g., +1234567890) and click "Save Configuration" to add it here.
                </p>
                {twilioPhoneNumber && (
                  <div className="mt-3 p-2 bg-yellow-500/20 rounded border border-yellow-500/30">
                    <p className="text-xs text-yellow-200">
                      💡 You have entered: <span className="font-mono">{twilioPhoneNumber}</span>
                    </p>
                    <p className="text-xs text-yellow-300 mt-1">
                      {/^\+[1-9]\d{1,14}$/.test(twilioPhoneNumber.trim()) 
                        ? '✓ Valid format! Click "Save Configuration" to add it.'
                        : '⚠️ Invalid format. Use E.164 format (e.g., +1234567890)'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Radio Button Style Selector */}
                <div className="space-y-2 mb-4">
                  {availableOutboundNumbers.map((number) => (
                    <label
                      key={number}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedOutboundNumber === number
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-border bg-background hover:border-primary/50 hover:bg-secondary/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="outboundNumber"
                        value={number}
                        checked={selectedOutboundNumber === number}
                        onChange={() => setSelectedOutboundNumber(number)}
                        className="w-4 h-4 text-primary border-border focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${
                            selectedOutboundNumber === number ? 'text-primary' : 'text-foreground'
                          }`}>
                            {number}
                          </span>
                          {selectedOutboundNumber === number && (
                            <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full font-medium">
                              Active
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                
                {/* Active Configuration Indicator */}
                {selectedOutboundNumber ? (
                  <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                    <p className="text-sm text-primary font-medium">
                      ✓ You are configuring settings for <span className="font-semibold">{selectedOutboundNumber}</span>
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-sm text-yellow-400">
                      ⚠️ Please select an outbound number to configure its behavior
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="space-y-6 max-w-2xl">
          {!selectedOutboundNumber && availableOutboundNumbers.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <p className="text-sm text-yellow-400">
                Select an outbound number above to configure its behavior
              </p>
            </div>
          )}
          {/* Auto Setup Methods Section */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => setShowSetupMethods(!showSetupMethods)}
              className="w-full p-6 flex items-center justify-between hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-linear-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-foreground">Import Number</h3>
                  <p className="text-sm text-muted-foreground">Configure your number with automatic SIP trunk setup</p>
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
                          Complete setup from scratch with SIP provider credentials
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
                        placeholder="e.g., My Voice Agent"
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
                        placeholder="+1234567890"
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
                        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
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
                      className="w-full h-10 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSettingUp ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Setting up...
                        </>
                      ) : (
                        "Setup SIP Trunk"
                      )}
                    </button>
                  </div>
                )}

                {/* Generic SIP Trunk Form */}
                {activeSetupMethod === "generic" && (
                  <div className="mt-4 p-4 bg-secondary/50 rounded-lg space-y-4 border border-border">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Label <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={genericSetupLabel}
                        onChange={(e) => setGenericSetupLabel(e.target.value)}
                        placeholder="e.g., My SIP Provider"
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
                        placeholder="+1234567890"
                        className="w-full h-10 bg-background border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        SIP Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={genericSetupSipAddress}
                        onChange={(e) => setGenericSetupSipAddress(e.target.value)}
                        placeholder="sip.provider.com"
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
                        placeholder="your_username"
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
                        placeholder="••••••••••••••••"
                        className="w-full h-10 bg-background border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      />
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
                        <option value="udp">UDP</option>
                        <option value="tcp">TCP</option>
                        <option value="tls">TLS</option>
                      </select>
                    </div>
                    <button
                      onClick={handleGenericSetup}
                      disabled={isSettingUp || !genericSetupLabel || !genericSetupPhone || !genericSetupSipAddress || !genericSetupUsername || !genericSetupPassword}
                      className="w-full h-10 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

          {/* Manual Configuration */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground">Manual Configuration</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Or enter your settings manually if you prefer
              </p>
            </div>
            
          <div className={`space-y-6 ${!selectedOutboundNumber && availableOutboundNumbers.length > 0 ? 'opacity-60 pointer-events-none' : ''}`}>
            {/* Voice Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Voice <span className="text-red-500">*</span>
                {!selectedOutboundNumber && availableOutboundNumbers.length > 0 && (
                  <span className="text-xs text-yellow-400 ml-2">(Select outbound number first)</span>
                )}
              </label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                disabled={!selectedOutboundNumber}
                className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {VOICE_OPTIONS.map((voice) => (
                  <option key={voice.value} value={voice.value}>
                    {voice.flag} {voice.label} ({voice.language} • {voice.gender})
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-2">
                Select the voice for your AI agent for the selected outbound number. Go to the <button onClick={() => setActiveTab("voice")} className="text-primary hover:underline font-medium">Voice Playground</button> tab to preview all voices.
              </p>
            </div>

            {/* Custom Voice ID */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Custom Voice ID (Optional)
              </label>
              <input
                type="text"
                value={customVoiceId}
                onChange={(e) => setCustomVoiceId(e.target.value)}
                placeholder="Enter custom ElevenLabs voice ID"
                disabled={!selectedOutboundNumber}
                className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Override the selected voice by providing a custom ElevenLabs voice ID. If provided, this will be used instead of the selected voice above.
              </p>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={twilioPhoneNumber}
                onChange={(e) => {
                  setTwilioPhoneNumber(e.target.value);
                  // Auto-select if valid and no number selected
                  const value = e.target.value.trim();
                  if (value && /^\+[1-9]\d{1,14}$/.test(value) && !selectedOutboundNumber) {
                    setSelectedOutboundNumber(value);
                  }
                }}
                placeholder="+1234567890"
                className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Enter your phone number in E.164 format (e.g., +1234567890). This number will appear in the selector above after saving.
              </p>
              {twilioPhoneNumber && !/^\+[1-9]\d{1,14}$/.test(twilioPhoneNumber.trim()) && (
                <p className="text-xs text-red-400 mt-1">
                  ⚠️ Invalid format. Use E.164 format (e.g., +1234567890)
                </p>
              )}
            </div>

            {/* LiveKit SIP Trunk ID */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                LiveKit SIP Trunk ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={livekitSipTrunkId}
                onChange={(e) => setLivekitSipTrunkId(e.target.value)}
                placeholder="ST_xxxxxxxxxxxxxxxxxx"
                className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Your LiveKit SIP Trunk ID (automatically set from setup)
              </p>
            </div>

            {/* Trunk SID */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Trunk SID
              </label>
              <input
                type="text"
                value={twilioTrunkSid}
                onChange={(e) => setTwilioTrunkSid(e.target.value)}
                placeholder="TKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                readOnly
              />
              <p className="text-xs text-muted-foreground mt-2">
                SIP Trunk SID (automatically set from setup)
              </p>
            </div>

            {/* Termination URI */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Termination URI
              </label>
              <input
                type="text"
                value={terminationUri}
                onChange={(e) => setTerminationUri(e.target.value)}
                placeholder="sip.provider.com"
                className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                readOnly
              />
              <p className="text-xs text-muted-foreground mt-2">
                SIP termination URI (automatically set from setup)
              </p>
            </div>

            {/* Origination URI */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Origination URI
              </label>
              <input
                type="text"
                value={originationUri}
                onChange={(e) => setOriginationUri(e.target.value)}
                placeholder="sip:xxxxxx.sip.livekit.cloud"
                className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                readOnly
              />
              <p className="text-xs text-muted-foreground mt-2">
                LiveKit origination SIP URI (automatically set from setup)
              </p>
            </div>

            {/* Human Operator Phone Number */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Human Operator Phone Number (Transfer To)
              </label>
              <input
                type="text"
                value={humanOperatorPhone}
                onChange={(e) => setHumanOperatorPhone(e.target.value)}
                placeholder="+1234567890"
                disabled={!selectedOutboundNumber}
                className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Phone number to transfer calls to when escalation conditions are met for the selected outbound number (E.164 format)
              </p>
            </div>

            {/* Language Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Language <span className="text-red-500">*</span>
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={!selectedOutboundNumber}
                className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="it">Italian</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="pt">Portuguese</option>
                <option value="ar">Arabic</option>
                <option value="zh">Chinese</option>
                <option value="ja">Japanese</option>
                <option value="ko">Korean</option>
              </select>
              <p className="text-xs text-muted-foreground mt-2">
                Language for voice agent conversations for the selected outbound number.
              </p>
            </div>

            {/* Greeting Message */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Greeting Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={greetingMessage}
                onChange={(e) => setGreetingMessage(e.target.value)}
                placeholder="Hello! How can I help you today?"
                rows={3}
                disabled={!selectedOutboundNumber}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Greeting message for outbound calls from the selected outbound number.
              </p>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleSaveSettings}
                disabled={isUpdating || createOrUpdateConfig.isPending || !selectedVoice}
                className="h-11 px-6 bg-primary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(isUpdating || createOrUpdateConfig.isPending) ? "Saving..." : "Save Configuration"}
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voice Playground Tab */}
      {activeTab === "voice" && (
        <div className="bg-card border border-border rounded-xl p-6 max-w-4xl">
          {!selectedOutboundNumber && availableOutboundNumbers.length > 0 && (
            <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <p className="text-sm text-yellow-400">
                Select an outbound number in the Settings tab to configure its voice
              </p>
            </div>
          )}
          <VoicePlayground 
            selectedVoice={selectedVoice}
            onVoiceSelect={setSelectedVoice}
          />
          
          {/* Save Button */}
          <div className="flex justify-end pt-6 mt-6 border-t border-border">
            <button
              onClick={handleSaveSettings}
              disabled={isUpdating || createOrUpdateConfig.isPending || !selectedVoice}
              className="h-11 px-6 bg-primary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {(isUpdating || createOrUpdateConfig.isPending) ? "Saving..." : "Save Voice Selection"}
            </button>
          </div>
        </div>
      )}

      {/* End of Call Tab */}
      {activeTab === "endOfCall" && (
        <div className="bg-card border border-border rounded-xl p-6 max-w-2xl">
          {!selectedOutboundNumber && availableOutboundNumbers.length > 0 && (
            <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <p className="text-sm text-yellow-400">
                Select an outbound number above to configure its behavior
              </p>
            </div>
          )}
          <div className={`space-y-6 ${!selectedOutboundNumber && availableOutboundNumbers.length > 0 ? 'opacity-60 pointer-events-none' : ''}`}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Escalation Conditions
                    {!selectedOutboundNumber && availableOutboundNumbers.length > 0 && (
                      <span className="text-xs text-yellow-400 ml-2 font-normal">(Select outbound number first)</span>
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Define when calls from the selected outbound number should be escalated to a human operator
                  </p>
                </div>
                <button
                  onClick={addEscalationRule}
                  disabled={!selectedOutboundNumber}
                  className="h-9 px-4 bg-secondary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Rule
                </button>
              </div>

              <div className="space-y-3">
                {escalationRules.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No escalation rules defined. Click "Add Rule" to create one.
                  </div>
                ) : (
                  escalationRules.map((rule, index) => (
                    <div key={index} className="flex gap-3">
                      <input
                        type="text"
                        value={rule}
                        onChange={(e) => updateEscalationRule(index, e.target.value)}
                        placeholder="e.g., Customer requests to speak with human"
                        disabled={!selectedOutboundNumber}
                        className="flex-1 h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <button
                        onClick={() => removeEscalationRule(index)}
                        disabled={!selectedOutboundNumber}
                        className="h-11 px-4 bg-red-500/10 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <h4 className="text-sm font-medium text-blue-400 mb-2">Example Escalation Rules:</h4>
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li>• Customer explicitly requests to speak with a human operator</li>
                  <li>• Customer expresses frustration or anger</li>
                  <li>• Complex technical issue that requires human expertise</li>
                  <li>• Request for refund or account changes</li>
                  <li>• Multiple failed attempts to resolve the issue</li>
                </ul>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleSaveEscalationRules}
                disabled={createOrUpdateConfig.isPending || (!selectedOutboundNumber && !twilioPhoneNumber)}
                className="h-11 px-6 bg-primary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createOrUpdateConfig.isPending ? "Saving..." : "Save Escalation Rules"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inbound Tab */}
      {activeTab === "inbound" && (
        <div className="space-y-6 max-w-3xl">
          {/* Current Inbound Agent Configs */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Inbound Agent Configurations {inboundConfigs && inboundConfigs.length > 0 && `(${inboundConfigs.length})`}
              </h3>
              <button
                onClick={() => syncConfig.mutate()}
                disabled={syncConfig.isPending}
                className="h-9 px-4 bg-primary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {syncConfig.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  "Sync All Configs"
                )}
              </button>
            </div>
            
            {!inboundConfigs || inboundConfigs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm mb-4">
                  No inbound agent configurations found.
                </p>
                <p className="text-xs text-muted-foreground">
                  Add inbound phone numbers below and configurations will be created automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {inboundConfigs.map((config, index) => (
                  <div key={config._id} className="border border-border rounded-lg p-4 bg-secondary/20">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">
                          {index + 1}
                        </span>
                        {config.calledNumber}
                      </h4>
                      {editingConfigId === config._id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveConfig(config)}
                            disabled={isSavingConfig}
                            className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            {isSavingConfig ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Check className="w-3 h-3" />
                                Save
                              </>
                            )}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={isSavingConfig}
                            className="h-8 px-3 bg-secondary text-foreground rounded-lg text-xs font-medium hover:brightness-110 transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditConfig(config)}
                          className="h-8 px-3 bg-primary text-foreground rounded-lg text-xs font-medium hover:brightness-110 transition-colors"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {editingConfigId === config._id ? (
                        <>
                          {/* Editable Language */}
                          <div className="p-2 bg-background/50 rounded">
                            <label className="text-xs font-medium text-muted-foreground block mb-1">Language:</label>
                            <select
                              value={editLanguage}
                              onChange={(e) => setEditLanguage(e.target.value)}
                              className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                            >
                              <option value="en">English</option>
                              <option value="es">Spanish</option>
                              <option value="it">Italian</option>
                              <option value="fr">French</option>
                              <option value="de">German</option>
                              <option value="pt">Portuguese</option>
                              <option value="ar">Arabic</option>
                              <option value="zh">Chinese</option>
                              <option value="ja">Japanese</option>
                              <option value="ko">Korean</option>
                            </select>
                          </div>

                          {/* Editable Greeting Message */}
                          <div className="p-2 bg-background/50 rounded">
                            <label className="text-xs font-medium text-muted-foreground block mb-1">Greeting Message:</label>
                            <textarea
                              value={editGreetingMessage}
                              onChange={(e) => setEditGreetingMessage(e.target.value)}
                              placeholder="Enter greeting message..."
                              rows={3}
                              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Read-only Language */}
                          <div className="flex items-start gap-3 p-2 bg-background/50 rounded">
                            <div className="text-xs font-medium text-muted-foreground min-w-[120px]">Language:</div>
                            <div className="text-xs text-foreground">{config.language || 'en'}</div>
                          </div>

                          {/* Read-only Greeting Message */}
                          <div className="flex items-start gap-3 p-2 bg-background/50 rounded">
                            <div className="text-xs font-medium text-muted-foreground min-w-[120px]">Greeting Message:</div>
                            <div className="text-xs text-foreground">{config.greeting_message || 'Hello! How can I help you today?'}</div>
                          </div>
                        </>
                      )}
                      
                      <div className="flex items-start gap-3 p-2 bg-background/50 rounded">
                        <div className="text-xs font-medium text-muted-foreground min-w-[120px]">Voice ID:</div>
                        <div className="text-xs text-foreground font-mono">{config.voice_id || 'Not set'}</div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-2 bg-background/50 rounded">
                        <div className="text-xs font-medium text-muted-foreground min-w-[120px]">Collections:</div>
                        <div className="text-xs text-foreground">
                          {config.collections && config.collections.length > 0 
                            ? config.collections.join(', ') 
                            : 'No collections'}
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-2 bg-background/50 rounded">
                        <div className="text-xs font-medium text-muted-foreground min-w-[120px]">Agent Instruction:</div>
                        <div className="text-xs text-foreground line-clamp-2">
                          {config.agent_instruction || 'No instruction set'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Setup Inbound Trunk */}
          <div className="bg-card border border-border rounded-xl p-6">
            {/* Persisted Inbound Numbers Display */}
            {persistedInboundNumbers && persistedInboundNumbers.length > 0 && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-green-400">Saved Inbound Numbers</h4>
                  <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full font-medium">
                    {persistedInboundNumbers.length} number{persistedInboundNumbers.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-2">
                  {persistedInboundNumbers.map((number, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-background rounded-lg"
                    >
                      <span className="text-sm font-mono text-foreground">{number}</span>
                      <span className="text-xs text-green-400">✓ Persisted</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  These numbers are saved in the database and will persist after page refresh.
                </p>
              </div>
            )}
            
            {/* Step Indicator */}
            <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-4">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                inboundStep >= 1 ? 'bg-primary text-foreground' : 'bg-secondary text-muted-foreground'
              }`}>
                1
              </div>
              <div className={`w-16 h-0.5 ${inboundStep >= 2 ? 'bg-primary' : 'bg-secondary'}`}></div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                inboundStep >= 2 ? 'bg-primary text-foreground' : 'bg-secondary text-muted-foreground'
              }`}>
                2
              </div>
              <div className={`w-16 h-0.5 ${inboundStep >= 3 ? 'bg-primary' : 'bg-secondary'}`}></div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                inboundStep >= 3 ? 'bg-primary text-foreground' : 'bg-secondary text-muted-foreground'
              }`}>
                ✓
              </div>
            </div>
          </div>

          {/* Step 1: Create Inbound Trunk */}
          {inboundStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-foreground">Setup Inbound Trunk</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Create an inbound SIP trunk to receive calls
                </p>
              </div>

              {/* Show existing configured numbers from persisted API or settings */}
              {(() => {
                const numbersToShow = (persistedInboundNumbers && persistedInboundNumbers.length > 0) 
                  ? persistedInboundNumbers 
                  : (inboundConnectedNumbers && inboundConnectedNumbers.length > 0) 
                    ? inboundConnectedNumbers 
                    : null;
                
                return numbersToShow && numbersToShow.length > 0 ? (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <h4 className="text-sm font-medium text-green-400 mb-3">Previously Configured Numbers:</h4>
                    <div className="space-y-2">
                      {numbersToShow.map((num, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-background rounded-lg">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="font-mono text-foreground text-sm">{num}</span>
                          <Check className="w-4 h-4 text-green-500 ml-auto" />
                        </div>
                      ))}
                    </div>
                    {settings?.inboundTrunkName && (
                      <p className="text-xs text-muted-foreground mt-3">
                        Trunk: <span className="text-foreground">{settings.inboundTrunkName}</span>
                      </p>
                    )}
                  </div>
                ) : null;
              })()}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Trunk Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={inboundName}
                  onChange={(e) => setInboundName(e.target.value)}
                  placeholder="e.g., My Inbound Trunk"
                  className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Phone Numbers <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={inboundPhoneNumbers || ''}
                  onChange={(e) => setInboundPhoneNumbers(e.target.value)}
                  placeholder="+1234567890, +0987654321"
                  className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Enter phone numbers in E.164 format, separated by commas
                </p>
                {persistedInboundNumbers && persistedInboundNumbers.length > 0 && (
                  <p className="text-xs text-green-400 mt-1">
                    ✓ {persistedInboundNumbers.length} number(s) saved and will persist after refresh
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="krispEnabled"
                  checked={inboundKrispEnabled}
                  onChange={(e) => setInboundKrispEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="krispEnabled" className="text-sm text-foreground cursor-pointer">
                  Enable Krisp noise cancellation
                </label>
              </div>

              <button
                onClick={handleCreateInboundTrunk}
                disabled={isCreatingInbound || !inboundName || !inboundPhoneNumbers}
                className="w-full h-11 bg-primary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCreatingInbound ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Trunk...
                  </>
                ) : (
                  "Continue"
                )}
              </button>
            </div>
          )}

          {/* Step 2: Create Dispatch Rule */}
          {inboundStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-foreground">Create Dispatch Rule</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Configure routing for incoming calls
                </p>
              </div>

              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <h4 className="text-sm font-medium text-green-400 mb-2">Trunk Created Successfully!</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Trunk ID: <span className="font-mono text-foreground">{inboundTrunkId}</span></p>
                  <p>Trunk Name: <span className="text-foreground">{inboundTrunkName}</span></p>
                  <p>Phone Numbers:</p>
                  <ul className="ml-4 list-disc">
                    {inboundConnectedNumbers.map((num, idx) => (
                      <li key={idx} className="font-mono text-foreground">{num}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  The dispatch rule will route incoming calls to the <span className="font-mono text-primary">inbound-agent</span> automatically.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setInboundStep(1)}
                  className="flex-1 h-11 bg-secondary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleCreateDispatchRule}
                  disabled={isCreatingInbound}
                  className="flex-1 h-11 bg-primary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreatingInbound ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Rule...
                    </>
                  ) : (
                    "Complete Setup"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {inboundStep === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Inbound Setup Complete!</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Your inbound trunk and dispatch rule have been configured successfully
                </p>
              </div>

              <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-lg space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-green-400 mb-2">Connected Phone Numbers:</h4>
                  <div className="space-y-2">
                    {inboundConnectedNumbers.map((num, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-3 bg-background rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="font-mono text-foreground">{num}</span>
                        <Check className="w-4 h-4 text-green-500 ml-auto" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-green-500/20">
                  <p className="text-xs text-muted-foreground">
                    All incoming calls to these numbers will be automatically routed to your inbound agent.
                  </p>
                </div>
              </div>

              <button
                onClick={resetInboundSetup}
                className="w-full h-11 bg-secondary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all"
              >
                Setup Another Inbound Trunk
              </button>
            </div>
          )}
          </div>
        </div>
      )}

      {/* Greeting Message Tab */}
      {activeTab === "greeting" && (
        <div className="bg-card border border-border rounded-xl p-6 max-w-2xl">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground">Greeting Message Configuration</h3>
          </div>

          <div className="space-y-6">
            {/* Greeting Message */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Greeting Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={greetingMessage}
                onChange={(e) => setGreetingMessage(e.target.value)}
                placeholder="Hello! How can I help you today?"
                rows={4}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
              />
              <p className="text-xs text-muted-foreground mt-2">
                This greeting message will be saved to both <span className="font-semibold">outbound-call-config</span> and <span className="font-semibold">inbound-agent-config</span> collections in the database.
              </p>
            </div>

            {/* Language Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
                <option value="pt">Portuguese</option>
                <option value="ar">Arabic</option>
                <option value="tr">Turkish</option>
              </select>
              <p className="text-xs text-muted-foreground mt-2">
                Select the language for the greeting message
              </p>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleSaveSettings}
                disabled={isUpdating || !greetingMessage.trim()}
                className="h-11 px-6 bg-primary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? "Saving..." : "Save Greeting Message"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

