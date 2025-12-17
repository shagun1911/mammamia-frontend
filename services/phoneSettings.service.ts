import { apiClient } from '@/lib/api';

export interface PhoneSettings {
  _id: string;
  userId: string;
  selectedVoice: string;
  twilioPhoneNumber: string;
  livekitSipTrunkId: string;
  twilioTrunkSid?: string;
  terminationUri?: string;
  originationUri?: string;
  humanOperatorPhone: string;
  // Inbound Trunk fields
  inboundTrunkId?: string;
  inboundTrunkName?: string;
  inboundPhoneNumbers?: string[];
  inboundDispatchRuleId?: string;
  inboundDispatchRuleName?: string;
  isConfigured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePhoneSettingsData {
  selectedVoice?: string;
  twilioPhoneNumber?: string;
  livekitSipTrunkId?: string;
  twilioTrunkSid?: string;
  terminationUri?: string;
  originationUri?: string;
  humanOperatorPhone?: string;
  // Inbound Trunk fields
  inboundTrunkId?: string;
  inboundTrunkName?: string;
  inboundPhoneNumbers?: string[];
  inboundDispatchRuleId?: string;
  inboundDispatchRuleName?: string;
}

// SIP Trunk Setup Interfaces
export interface SetupSipTrunkRequest {
  label: string;
  phone_number: string;
  twilio_sid: string;
  twilio_auth_token: string;
}

export interface SetupSipTrunkResponse {
  status: string;
  message: string;
  twilio_trunk_sid: string;
  livekit_trunk_id: string;
  termination_uri: string;
  credential_list_sid: string;
  ip_acl_sid: string;
  username: string;
  origination_uri: string;
  origination_uri_sid: string;
}

export interface CreateLiveKitTrunkRequest {
  label: string;
  phone_number: string;
  sip_address: string;
  username?: string;
  password?: string;
  transport?: string;
}

export interface CreateLiveKitTrunkResponse {
  status: string;
  message: string;
  livekit_trunk_id: string;
  sip_address: string;
  phone_number: string;
}

export interface CreateGenericSipTrunkRequest {
  label: string;
  phone_number: string;
  sip_address: string;
  username: string;
  password: string;
  provider_name?: string;
  transport: string;
  port?: number;
}

export interface CreateGenericSipTrunkResponse {
  status: string;
  message: string;
  livekit_trunk_id: string;
  provider_name: string;
  sip_address: string;
  phone_number: string;
  transport: string;
}

export interface CreateInboundTrunkRequest {
  name: string;
  phone_numbers: string[];
  allowed_numbers?: string[];
  krisp_enabled?: boolean;
}

export interface CreateInboundTrunkResponse {
  trunk: {
    status: string;
    message: string;
    trunk_id: string;
    trunk_name: string;
    phone_numbers: string[];
  };
  dispatch_rule: {
    status: string;
    message: string;
    dispatch_rule_id: string;
    dispatch_rule_name: string;
  };
}

export const phoneSettingsService = {
  /**
   * Get phone settings
   */
  async getSettings(): Promise<PhoneSettings> {
    const response = await apiClient.get('/phone-settings');
    return response.data;
  },

  /**
   * Update phone settings
   */
  async updateSettings(data: UpdatePhoneSettingsData): Promise<PhoneSettings> {
    console.log('📡 [Phone Settings Service] Updating settings...');
    console.log('📦 [Phone Settings Service] Data:', JSON.stringify(data, null, 2));
    
    const response = await apiClient.put('/phone-settings', data);
    
    console.log('✅ [Phone Settings Service] Update successful');
    console.log('📊 [Phone Settings Service] Response:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  },

  /**
   * Setup SIP Trunk - Full setup from scratch with Twilio credentials
   */
  async setupSipTrunk(data: SetupSipTrunkRequest): Promise<SetupSipTrunkResponse> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
    const fullUrl = `${API_URL}/phone-settings/setup-sip-trunk`;
    
    console.log('🌐 [Phone Settings Service] Calling backend setup-sip-trunk...');
    console.log('🔗 [Phone Settings Service] Request URL:', fullUrl);
    console.log('📤 [Phone Settings Service] Request data:', {
      ...data,
      twilio_auth_token: '***hidden***'
    });
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error('❌ [Phone Settings Service] Request failed');
      console.error('Status:', response.status, response.statusText);
      const error = await response.json().catch(() => ({ message: 'Failed to setup SIP trunk' }));
      throw new Error(error.message || 'Failed to setup SIP trunk');
    }

    const result = await response.json();
    console.log('✅ [Phone Settings Service] Backend response received:');
    console.log(JSON.stringify(result, null, 2));
    
    return result;
  },

  // /**
  //  * Create LiveKit Trunk - Create LiveKit trunk from existing Twilio setup
  //  */
  // async createLiveKitTrunk(data: CreateLiveKitTrunkRequest): Promise<CreateLiveKitTrunkResponse> {
  //   const PYTHON_API = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'https://keplerov1-python-2.onrender.com';
  //   const response = await fetch(`${PYTHON_API}/calls/create-livekit-trunk`, {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({
  //       ...data,
  //       username: data.username || 'default_user',
  //       password: data.password || 'default_password',
  //       transport: data.transport || 'udp',
  //     }),
  //   });

  //   if (!response.ok) {
  //     const error = await response.json().catch(() => ({ message: 'Failed to create LiveKit trunk' }));
  //     throw new Error(error.message || 'Failed to create LiveKit trunk');
  //   }

  //   return response.json();
  // },

  /**
   * Create Generic SIP Trunk - Universal SIP trunk for any provider
   */
  async createGenericSipTrunk(data: CreateGenericSipTrunkRequest): Promise<CreateGenericSipTrunkResponse> {
    const response = await apiClient.post('/phone-settings/create-generic-sip-trunk', {
      ...data,
      provider_name: data.provider_name || 'generic',
      transport: data.transport,
      port: data.port || 5060
    });
    return response.data;
  },

  /**
   * Create Inbound Trunk - For receiving calls with dispatch rules
   */
  async createInboundTrunk(data: CreateInboundTrunkRequest): Promise<CreateInboundTrunkResponse> {
    const response = await apiClient.post('/phone-settings/create-inbound-trunk', {
      ...data,
      allowed_numbers: data.allowed_numbers || [],
      krisp_enabled: data.krisp_enabled !== undefined ? data.krisp_enabled : true
    });
    return response.data;
  },
};

// Available voice options organized by language and gender
export interface VoiceOption {
  value: string;
  label: string;
  voiceId: string;
  language: 'Italian' | 'Spanish' | 'English';
  gender: 'Male' | 'Female';
  flag: string;
}

export const VOICE_OPTIONS: VoiceOption[] = [
  // 🇮🇹 ITALIAN - MALE
  { value: 'domenico', label: 'Domenico', voiceId: 'QABTI1ryPrQsJUflbKB7', language: 'Italian', gender: 'Male', flag: '🇮🇹' },
  { value: 'thomas', label: 'Thomas', voiceId: 'CITWdMEsnRduEUkNWXQv', language: 'Italian', gender: 'Male', flag: '🇮🇹' },
  { value: 'mario', label: 'Mario', voiceId: 'irAl0cku0Hx4TEUJ8d1Q', language: 'Italian', gender: 'Male', flag: '🇮🇹' },
  { value: 'gianp', label: 'Gianp', voiceId: 'SpoXt7BywHwFLisCTpQ3', language: 'Italian', gender: 'Male', flag: '🇮🇹' },
  { value: 'vittorio', label: 'Vittorio', voiceId: 'nH7uLS5UdEnvKEOAXtlQ', language: 'Italian', gender: 'Male', flag: '🇮🇹' },
  
  // 🇮🇹 ITALIAN - FEMALE
  { value: 'ginevra', label: 'Ginevra', voiceId: 'QITiGyM4owEZrBEf0QV8', language: 'Italian', gender: 'Female', flag: '🇮🇹' },
  { value: 'roberta', label: 'Roberta', voiceId: 'ZzFXkjuO1rPntDj6At5C', language: 'Italian', gender: 'Female', flag: '🇮🇹' },
  { value: 'giusy', label: 'Giusy', voiceId: '8KInRSd4DtD5L5gK7itu', language: 'Italian', gender: 'Female', flag: '🇮🇹' },
  { value: 'roxy', label: 'Roxy', voiceId: 'mGiFn5Udfw93ewbgFHaP', language: 'Italian', gender: 'Female', flag: '🇮🇹' },
  { value: 'sami', label: 'Sami', voiceId: 'kAzI34nYjizE0zON6rXv', language: 'Italian', gender: 'Female', flag: '🇮🇹' },
  
  // 🇪🇸 SPANISH - MALE
  { value: 'alejandro', label: 'Alejandro Ballesteros', voiceId: 'YKUjKbMlejgvkOZlnnvt', language: 'Spanish', gender: 'Male', flag: '🇪🇸' },
  { value: 'antonio', label: 'Antonio', voiceId: 'htFfPSZGJwjBv1CL0aMD', language: 'Spanish', gender: 'Male', flag: '🇪🇸' },
  { value: 'el_faraon', label: 'El Faraon', voiceId: '8mBRP99B2Ng2QwsJMFQl', language: 'Spanish', gender: 'Male', flag: '🇪🇸' },
  
  // 🇪🇸 SPANISH - FEMALE
  { value: 'lumina', label: 'Lumina (Colombia)', voiceId: 'x5IDPSl4ZUbhosMmVFTk', language: 'Spanish', gender: 'Female', flag: '🇪🇸' },
  { value: 'elena', label: 'Elena', voiceId: 'tXgbXPnsMpKXkuTgvE3h', language: 'Spanish', gender: 'Female', flag: '🇪🇸' },
  { value: 'sara', label: 'Sara Martin', voiceId: 'gD1IexrzCvsXPHUuT0s3', language: 'Spanish', gender: 'Female', flag: '🇪🇸' },
  
  // 🇬🇧 ENGLISH - FEMALE
  { value: 'zara', label: 'Zara', voiceId: 'jqcCZkN6Knx8BJ5TBdYR', language: 'English', gender: 'Female', flag: '🇬🇧' },
  { value: 'brittney', label: 'Brittney', voiceId: 'kPzsL2i3teMYv0FxEYQ6', language: 'English', gender: 'Female', flag: '🇬🇧' },
  { value: 'julieanne', label: 'Julieanne', voiceId: '8WaMCGQzWsKvf7sGPqjE', language: 'English', gender: 'Female', flag: '🇬🇧' },
  { value: 'allison', label: 'Allison', voiceId: 'xctasy8XvGp2cVO9HL9k', language: 'English', gender: 'Female', flag: '🇬🇧' },
  
  // 🇬🇧 ENGLISH - MALE
  { value: 'jameson', label: 'Jameson', voiceId: 'Mu5jxyqZOLIGltFpfalg', language: 'English', gender: 'Male', flag: '🇬🇧' },
  { value: 'mark', label: 'Mark', voiceId: 'UgBBYS2sOqTuMpoF3BR0', language: 'English', gender: 'Male', flag: '🇬🇧' },
  { value: 'archie', label: 'Archie', voiceId: 'kmSVBPu7loj4ayNinwWM', language: 'English', gender: 'Male', flag: '🇬🇧' },
];

// Helper function to get voice ID from voice value
export const getVoiceIdFromValue = (voiceValue: string): string => {
  const voice = VOICE_OPTIONS.find(v => v.value === voiceValue);
  return voice?.voiceId || 'pNInz6obpgDQGcFmaJgB'; // Default to Adam
};

