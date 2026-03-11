/**
 * Voice Utilities
 * Provides voice selection, language mapping, and default greetings/prompts
 */

export interface VoiceOption {
  value: string;
  label: string;
  voiceId: string;
  language: 'Italian' | 'Spanish' | 'English' | 'French' | 'German' | 'Portuguese' | 'Polish' | 'Hindi' | 'Japanese' | 'Chinese' | 'Korean' | 'Turkish' | 'Arabic' | 'Dutch' | 'Swedish' | 'Norwegian' | 'Danish' | 'Finnish' | 'Greek' | 'Czech' | 'Hungarian' | 'Romanian' | 'Russian' | 'Ukrainian';
  languageCode: string; // ISO 639-1 code
  gender: 'Male' | 'Female';
  flag: string;
}

export const VOICE_OPTIONS: VoiceOption[] = [
  // 🇮🇹 ITALIAN - MALE
  { value: 'domenico', label: 'Domenico', voiceId: 'QABTI1ryPrQsJUflbKB7', language: 'Italian', languageCode: 'it', gender: 'Male', flag: '🇮🇹' },
  { value: 'thomas', label: 'Thomas', voiceId: 'CITWdMEsnRduEUkNWXQv', language: 'Italian', languageCode: 'it', gender: 'Male', flag: '🇮🇹' },
  { value: 'mario', label: 'Mario', voiceId: 'irAl0cku0Hx4TEUJ8d1Q', language: 'Italian', languageCode: 'it', gender: 'Male', flag: '🇮🇹' },
  { value: 'gianp', label: 'Gianp', voiceId: 'SpoXt7BywHwFLisCTpQ3', language: 'Italian', languageCode: 'it', gender: 'Male', flag: '🇮🇹' },
  { value: 'vittorio', label: 'Vittorio', voiceId: 'nH7uLS5UdEnvKEOAXtlQ', language: 'Italian', languageCode: 'it', gender: 'Male', flag: '🇮🇹' },

  // 🇮🇹 ITALIAN - FEMALE
  { value: 'federica', label: 'Federica', voiceId: 'YoTg4iSbsCW96GVME4O6', language: 'Italian', languageCode: 'it', gender: 'Female', flag: '🇮🇹' },
  { value: 'ginevra', label: 'Ginevra', voiceId: 'QITiGyM4owEZrBEf0QV8', language: 'Italian', languageCode: 'it', gender: 'Female', flag: '🇮🇹' },
  { value: 'roberta', label: 'Roberta', voiceId: 'ZzFXkjuO1rPntDj6At5C', language: 'Italian', languageCode: 'it', gender: 'Female', flag: '🇮🇹' },
  { value: 'giusy', label: 'Giusy', voiceId: '8KInRSd4DtD5L5gK7itu', language: 'Italian', languageCode: 'it', gender: 'Female', flag: '🇮🇹' },
  { value: 'sami', label: 'Sami', voiceId: 'kAzI34nYjizE0zON6rXv', language: 'Italian', languageCode: 'it', gender: 'Female', flag: '🇮🇹' },

  // 🇪🇸 SPANISH - MALE
  { value: 'alejandro', label: 'Alejandro Ballesteros', voiceId: 'YKUjKbMlejgvkOZlnnvt', language: 'Spanish', languageCode: 'es', gender: 'Male', flag: '🇪🇸' },
  { value: 'antonio', label: 'Antonio', voiceId: 'htFfPSZGJwjBv1CL0aMD', language: 'Spanish', languageCode: 'es', gender: 'Male', flag: '🇪🇸' },
  { value: 'el_faraon', label: 'El Faraon', voiceId: '8mBRP99B2Ng2QwsJMFQl', language: 'Spanish', languageCode: 'es', gender: 'Male', flag: '🇪🇸' },
  { value: 'carlos', label: 'Carlos', voiceId: 'XB0fDUnXU5powFXDhCwa', language: 'Spanish', languageCode: 'es', gender: 'Male', flag: '🇪🇸' },
  { value: 'diego', label: 'Diego', voiceId: 'ThT5KcBeYPX3keUQyHlb', language: 'Spanish', languageCode: 'es', gender: 'Male', flag: '🇪🇸' },

  // 🇪🇸 SPANISH - FEMALE
  { value: 'lumina', label: 'Lumina (Colombia)', voiceId: 'x5IDPSl4ZUbhosMmVFTk', language: 'Spanish', languageCode: 'es', gender: 'Female', flag: '🇪🇸' },
  { value: 'elena', label: 'Elena', voiceId: 'tXgbXPnsMpKXkuTgvE3h', language: 'Spanish', languageCode: 'es', gender: 'Female', flag: '🇪🇸' },
  { value: 'sara', label: 'Sara Martin', voiceId: 'gD1IexrzCvsXPHUuT0s3', language: 'Spanish', languageCode: 'es', gender: 'Female', flag: '🇪🇸' },
  { value: 'isabella', label: 'Isabella', voiceId: 'XB0fDUnXU5powFXDhCwa', language: 'Spanish', languageCode: 'es', gender: 'Female', flag: '🇪🇸' },

  // 🇬🇧 ENGLISH - FEMALE
  { value: 'zara', label: 'Zara', voiceId: 'jqcCZkN6Knx8BJ5TBdYR', language: 'English', languageCode: 'en', gender: 'Female', flag: '🇬🇧' },
  { value: 'brittney', label: 'Brittney', voiceId: 'kPzsL2i3teMYv0FxEYQ6', language: 'English', languageCode: 'en', gender: 'Female', flag: '🇬🇧' },
  { value: 'julieanne', label: 'Julieanne', voiceId: '8WaMCGQzWsKvf7sGPqjE', language: 'English', languageCode: 'en', gender: 'Female', flag: '🇬🇧' },
  { value: 'allison', label: 'Allison', voiceId: 'xctasy8XvGp2cVO9HL9k', language: 'English', languageCode: 'en', gender: 'Female', flag: '🇬🇧' },
  { value: 'rachel', label: 'Rachel', voiceId: '21m00Tcm4TlvDq8ikWAM', language: 'English', languageCode: 'en', gender: 'Female', flag: '🇬🇧' },
  { value: 'domi', label: 'Domi', voiceId: 'AZnzlk1XvdvUeBnXmlld', language: 'English', languageCode: 'en', gender: 'Female', flag: '🇬🇧' },
  { value: 'bella', label: 'Bella', voiceId: 'EXAVITQu4vr4xnSDxMaL', language: 'English', languageCode: 'en', gender: 'Female', flag: '🇬🇧' },
  { value: 'antoni', label: 'Antoni', voiceId: 'ErXwobaYiN019PkySvjV', language: 'English', languageCode: 'en', gender: 'Male', flag: '🇬🇧' },
  { value: 'elli', label: 'Elli', voiceId: 'MF3mGyEYCl7XYWbV9V6O', language: 'English', languageCode: 'en', gender: 'Female', flag: '🇬🇧' },
  { value: 'josh', label: 'Josh', voiceId: 'TxGEqnHWrfWFTfGW9XjX', language: 'English', languageCode: 'en', gender: 'Male', flag: '🇬🇧' },
  { value: 'arnold', label: 'Arnold', voiceId: 'VR6AewLTigWG4xSOukaG', language: 'English', languageCode: 'en', gender: 'Male', flag: '🇬🇧' },
  { value: 'adam', label: 'Adam', voiceId: 'pNInz6obpgDQGcFmaJgB', language: 'English', languageCode: 'en', gender: 'Male', flag: '🇬🇧' },
  { value: 'sam', label: 'Sam', voiceId: 'yoZ06aMxZJJ28mfd3POQ', language: 'English', languageCode: 'en', gender: 'Male', flag: '🇬🇧' },

  // 🇬🇧 ENGLISH - MALE
  { value: 'jameson', label: 'Jameson', voiceId: 'Mu5jxyqZOLIGltFpfalg', language: 'English', languageCode: 'en', gender: 'Male', flag: '🇬🇧' },
  { value: 'mark', label: 'Mark', voiceId: 'UgBBYS2sOqTuMpoF3BR0', language: 'English', languageCode: 'en', gender: 'Male', flag: '🇬🇧' },
  { value: 'archie', label: 'Archie', voiceId: 'kmSVBPu7loj4ayNinwWM', language: 'English', languageCode: 'en', gender: 'Male', flag: '🇬🇧' },

  // 🇫🇷 FRENCH - MALE
  { value: 'arnold_fr', label: 'Arnold (French)', voiceId: 'VR6AewLTigWG4xSOukaG', language: 'French', languageCode: 'fr', gender: 'Male', flag: '🇫🇷' },
  { value: 'antoni_fr', label: 'Antoni (French)', voiceId: 'ErXwobaYiN019PkySvjV', language: 'French', languageCode: 'fr', gender: 'Male', flag: '🇫🇷' },

  // 🇫🇷 FRENCH - FEMALE
  { value: 'bella_fr', label: 'Bella (French)', voiceId: 'EXAVITQu4vr4xnSDxMaL', language: 'French', languageCode: 'fr', gender: 'Female', flag: '🇫🇷' },
  { value: 'elli_fr', label: 'Elli (French)', voiceId: 'MF3mGyEYCl7XYWbV9V6O', language: 'French', languageCode: 'fr', gender: 'Female', flag: '🇫🇷' },

  // 🇩🇪 GERMAN - MALE
  { value: 'antoni_de', label: 'Antoni (German)', voiceId: 'ErXwobaYiN019PkySvjV', language: 'German', languageCode: 'de', gender: 'Male', flag: '🇩🇪' },
  { value: 'arnold_de', label: 'Arnold (German)', voiceId: 'VR6AewLTigWG4xSOukaG', language: 'German', languageCode: 'de', gender: 'Male', flag: '🇩🇪' },

  // 🇩🇪 GERMAN - FEMALE
  { value: 'bella_de', label: 'Bella (German)', voiceId: 'EXAVITQu4vr4xnSDxMaL', language: 'German', languageCode: 'de', gender: 'Female', flag: '🇩🇪' },
  { value: 'elli_de', label: 'Elli (German)', voiceId: 'MF3mGyEYCl7XYWbV9V6O', language: 'German', languageCode: 'de', gender: 'Female', flag: '🇩🇪' },

  // 🇵🇹 PORTUGUESE - MALE
  { value: 'antoni_pt', label: 'Antoni (Portuguese)', voiceId: 'ErXwobaYiN019PkySvjV', language: 'Portuguese', languageCode: 'pt', gender: 'Male', flag: '🇵🇹' },
  { value: 'arnold_pt', label: 'Arnold (Portuguese)', voiceId: 'VR6AewLTigWG4xSOukaG', language: 'Portuguese', languageCode: 'pt', gender: 'Male', flag: '🇵🇹' },

  // 🇵🇹 PORTUGUESE - FEMALE
  { value: 'bella_pt', label: 'Bella (Portuguese)', voiceId: 'EXAVITQu4vr4xnSDxMaL', language: 'Portuguese', languageCode: 'pt', gender: 'Female', flag: '🇵🇹' },
  { value: 'elli_pt', label: 'Elli (Portuguese)', voiceId: 'MF3mGyEYCl7XYWbV9V6O', language: 'Portuguese', languageCode: 'pt', gender: 'Female', flag: '🇵🇹' },

  // 🇵🇱 POLISH - MALE
  { value: 'antoni_pl', label: 'Antoni (Polish)', voiceId: 'ErXwobaYiN019PkySvjV', language: 'Polish', languageCode: 'pl', gender: 'Male', flag: '🇵🇱' },
  { value: 'arnold_pl', label: 'Arnold (Polish)', voiceId: 'VR6AewLTigWG4xSOukaG', language: 'Polish', languageCode: 'pl', gender: 'Male', flag: '🇵🇱' },

  // 🇵🇱 POLISH - FEMALE
  { value: 'bella_pl', label: 'Bella (Polish)', voiceId: 'EXAVITQu4vr4xnSDxMaL', language: 'Polish', languageCode: 'pl', gender: 'Female', flag: '🇵🇱' },
  { value: 'elli_pl', label: 'Elli (Polish)', voiceId: 'MF3mGyEYCl7XYWbV9V6O', language: 'Polish', languageCode: 'pl', gender: 'Female', flag: '🇵🇱' },

  // 🇮🇳 HINDI - MALE
  { value: 'antoni_hi', label: 'Antoni (Hindi)', voiceId: 'ErXwobaYiN019PkySvjV', language: 'Hindi', languageCode: 'hi', gender: 'Male', flag: '🇮🇳' },
  { value: 'arnold_hi', label: 'Arnold (Hindi)', voiceId: 'VR6AewLTigWG4xSOukaG', language: 'Hindi', languageCode: 'hi', gender: 'Male', flag: '🇮🇳' },

  // 🇮🇳 HINDI - FEMALE
  { value: 'bella_hi', label: 'Bella (Hindi)', voiceId: 'EXAVITQu4vr4xnSDxMaL', language: 'Hindi', languageCode: 'hi', gender: 'Female', flag: '🇮🇳' },
  { value: 'elli_hi', label: 'Elli (Hindi)', voiceId: 'MF3mGyEYCl7XYWbV9V6O', language: 'Hindi', languageCode: 'hi', gender: 'Female', flag: '🇮🇳' },

  // 🇯🇵 JAPANESE - MALE
  { value: 'antoni_ja', label: 'Antoni (Japanese)', voiceId: 'ErXwobaYiN019PkySvjV', language: 'Japanese', languageCode: 'ja', gender: 'Male', flag: '🇯🇵' },
  { value: 'arnold_ja', label: 'Arnold (Japanese)', voiceId: 'VR6AewLTigWG4xSOukaG', language: 'Japanese', languageCode: 'ja', gender: 'Male', flag: '🇯🇵' },

  // 🇯🇵 JAPANESE - FEMALE
  { value: 'bella_ja', label: 'Bella (Japanese)', voiceId: 'EXAVITQu4vr4xnSDxMaL', language: 'Japanese', languageCode: 'ja', gender: 'Female', flag: '🇯🇵' },
  { value: 'elli_ja', label: 'Elli (Japanese)', voiceId: 'MF3mGyEYCl7XYWbV9V6O', language: 'Japanese', languageCode: 'ja', gender: 'Female', flag: '🇯🇵' },

  // 🇨🇳 CHINESE - MALE
  { value: 'antoni_zh', label: 'Antoni (Chinese)', voiceId: 'ErXwobaYiN019PkySvjV', language: 'Chinese', languageCode: 'zh', gender: 'Male', flag: '🇨🇳' },
  { value: 'arnold_zh', label: 'Arnold (Chinese)', voiceId: 'VR6AewLTigWG4xSOukaG', language: 'Chinese', languageCode: 'zh', gender: 'Male', flag: '🇨🇳' },

  // 🇨🇳 CHINESE - FEMALE
  { value: 'bella_zh', label: 'Bella (Chinese)', voiceId: 'EXAVITQu4vr4xnSDxMaL', language: 'Chinese', languageCode: 'zh', gender: 'Female', flag: '🇨🇳' },
  { value: 'elli_zh', label: 'Elli (Chinese)', voiceId: 'MF3mGyEYCl7XYWbV9V6O', language: 'Chinese', languageCode: 'zh', gender: 'Female', flag: '🇨🇳' },

  // 🇰🇷 KOREAN - MALE
  { value: 'antoni_ko', label: 'Antoni (Korean)', voiceId: 'ErXwobaYiN019PkySvjV', language: 'Korean', languageCode: 'ko', gender: 'Male', flag: '🇰🇷' },
  { value: 'arnold_ko', label: 'Arnold (Korean)', voiceId: 'VR6AewLTigWG4xSOukaG', language: 'Korean', languageCode: 'ko', gender: 'Male', flag: '🇰🇷' },

  // 🇰🇷 KOREAN - FEMALE
  { value: 'bella_ko', label: 'Bella (Korean)', voiceId: 'EXAVITQu4vr4xnSDxMaL', language: 'Korean', languageCode: 'ko', gender: 'Female', flag: '🇰🇷' },
  { value: 'elli_ko', label: 'Elli (Korean)', voiceId: 'MF3mGyEYCl7XYWbV9V6O', language: 'Korean', languageCode: 'ko', gender: 'Female', flag: '🇰🇷' },

  // 🇹🇷 TURKISH - MALE
  { value: 'antoni_tr', label: 'Antoni (Turkish)', voiceId: 'ErXwobaYiN019PkySvjV', language: 'Turkish', languageCode: 'tr', gender: 'Male', flag: '🇹🇷' },
  { value: 'arnold_tr', label: 'Arnold (Turkish)', voiceId: 'VR6AewLTigWG4xSOukaG', language: 'Turkish', languageCode: 'tr', gender: 'Male', flag: '🇹🇷' },

  // 🇹🇷 TURKISH - FEMALE
  { value: 'bella_tr', label: 'Bella (Turkish)', voiceId: 'EXAVITQu4vr4xnSDxMaL', language: 'Turkish', languageCode: 'tr', gender: 'Female', flag: '🇹🇷' },
  { value: 'elli_tr', label: 'Elli (Turkish)', voiceId: 'MF3mGyEYCl7XYWbV9V6O', language: 'Turkish', languageCode: 'tr', gender: 'Female', flag: '🇹🇷' },

  // 🇸🇦 ARABIC - MALE
  { value: 'antoni_ar', label: 'Antoni (Arabic)', voiceId: 'ErXwobaYiN019PkySvjV', language: 'Arabic', languageCode: 'ar', gender: 'Male', flag: '🇸🇦' },
  { value: 'arnold_ar', label: 'Arnold (Arabic)', voiceId: 'VR6AewLTigWG4xSOukaG', language: 'Arabic', languageCode: 'ar', gender: 'Male', flag: '🇸🇦' },

  // 🇸🇦 ARABIC - FEMALE
  { value: 'bella_ar', label: 'Bella (Arabic)', voiceId: 'EXAVITQu4vr4xnSDxMaL', language: 'Arabic', languageCode: 'ar', gender: 'Female', flag: '🇸🇦' },
  { value: 'elli_ar', label: 'Elli (Arabic)', voiceId: 'MF3mGyEYCl7XYWbV9V6O', language: 'Arabic', languageCode: 'ar', gender: 'Female', flag: '🇸🇦' },
];

/**
 * Get voice ID from voice value
 */
export function getVoiceIdFromValue(voiceValue: string): string | null {
  const voice = VOICE_OPTIONS.find(v => v.value === voiceValue);
  return voice?.voiceId || null;
}

/**
 * Get voice option by voice ID
 */
export function getVoiceByVoiceId(voiceId: string): VoiceOption | null {
  return VOICE_OPTIONS.find(v => v.voiceId === voiceId) || null;
}

/**
 * Get voices filtered by language code
 */
export function getVoicesByLanguage(languageCode: string): VoiceOption[] {
  return VOICE_OPTIONS.filter(v => v.languageCode === languageCode.toLowerCase());
}

/**
 * Get default greeting message for a language
 */
export function getDefaultGreeting(languageCode: string): string {
  const defaults: Record<string, string> = {
    en: 'Hello! How can I help you today?',
    it: 'Ciao! Come posso aiutarti oggi?',
    es: 'Hola, ¿en qué puedo ayudarte?',
    fr: 'Bonjour! Comment puis-je vous aider aujourd\'hui?',
    de: 'Hallo! Wie kann ich Ihnen heute helfen?',
    pt: 'Olá! Como posso ajudá-lo hoje?',
    pl: 'Cześć! Jak mogę Ci dzisiaj pomóc?',
    hi: 'नमस्ते! मैं आज आपकी कैसे मदद कर सकता हूं?',
    zh: '你好！今天我能为你做些什么？',
    ja: 'こんにちは！今日はどのようにお手伝いできますか？',
    ko: '안녕하세요! 오늘 어떻게 도와드릴까요?',
    tr: 'Merhaba! Bugün size nasıl yardımcı olabilirim?',
    ar: 'مرحبا! كيف يمكنني مساعدتك اليوم؟',
  };

  return defaults[languageCode.toLowerCase()] || defaults.en;
}

/**
 * Get default system prompt for a language
 */
export function getDefaultSystemPrompt(languageCode: string): string {
  const defaults: Record<string, string> = {
    en: 'You are a polite, empathetic AI voice agent. Speak clearly, be concise, and guide the user toward their goal.',
    it: 'Sei un assistente vocale AI educato ed empatico. Parla chiaramente, sii conciso e guida l\'utente verso il suo obiettivo.',
    es: 'Eres un agente de voz IA educado y empático. Habla claramente, sé conciso y guía al usuario hacia su objetivo.',
    fr: 'Vous êtes un agent vocal IA poli et empathique. Parlez clairement, soyez concis et guidez l\'utilisateur vers son objectif.',
    de: 'Sie sind ein höflicher, empathischer KI-Sprachassistent. Sprechen Sie klar, seien Sie prägnant und führen Sie den Benutzer zu seinem Ziel.',
    pt: 'Você é um agente de voz IA educado e empático. Fale claramente, seja conciso e guie o usuário em direção ao seu objetivo.',
    pl: 'Jesteś uprzejmym, empatycznym asystentem głosowym AI. Mów wyraźnie, bądź zwięzły i prowadź użytkownika do jego celu.',
    hi: 'आप एक विनम्र, सहानुभूतिपूर्ण AI आवाज एजेंट हैं। स्पष्ट रूप से बोलें, संक्षिप्त रहें और उपयोगकर्ता को उनके लक्ष्य की ओर मार्गदर्शन करें।',
    zh: '你是一个礼貌、有同理心的人工智能语音助手。说话清晰，简洁，引导用户实现目标。',
    ja: 'あなたは礼儀正しく、共感的なAI音声エージェントです。明確に話し、簡潔にし、ユーザーを目標に向けて導きます。',
    ko: '당신은 정중하고 공감적인 AI 음성 에이전트입니다. 명확하게 말하고, 간결하게 하며, 사용자를 목표로 안내합니다.',
    tr: 'Kibar, empatik bir AI ses asistanısınız. Açıkça konuşun, kısa ve öz olun ve kullanıcıyı hedefine yönlendirin.',
    ar: 'أنت مساعد صوتي ذكي مهذب ومتعاطف. تحدث بوضوح، كن مختصراً ووجه المستخدم نحو هدفه.',
  };

  return defaults[languageCode.toLowerCase()] || defaults.en;
}

/**
 * Get default escalation conditions for a language
 */
export function getDefaultEscalationConditions(languageCode: string): string[] {
  const defaults: Record<string, string[]> = {
    en: ['user says transfer', 'user requests human', 'sentiment negative'],
    it: ['utente dice trasferire', 'utente richiede umano', 'sentiment negativo'],
    es: ['usuario dice transferir', 'usuario solicita humano', 'sentimiento negativo'],
    fr: ['utilisateur dit transférer', 'utilisateur demande humain', 'sentiment négatif'],
    de: ['benutzer sagt übertragen', 'benutzer fordert mensch', 'stimmung negativ'],
    pt: ['usuário diz transferir', 'usuário solicita humano', 'sentimento negativo'],
    pl: ['użytkownik mówi przekazać', 'użytkownik prosi o człowieka', 'nastrój negatywny'],
    hi: ['उपयोगकर्ता स्थानांतरण कहता है', 'उपयोगकर्ता मानव का अनुरोध करता है', 'भावना नकारात्मक'],
    zh: ['用户说转接', '用户请求人工', '情绪负面'],
    ja: ['ユーザーが転送と言う', 'ユーザーが人間を要求', '感情がネガティブ'],
    ko: ['사용자가 전환을 말함', '사용자가 인간을 요청', '감정이 부정적'],
    tr: ['kullanıcı transfer diyor', 'kullanıcı insan istiyor', 'duygu negatif'],
    ar: ['المستخدم يقول النقل', 'المستخدم يطلب إنسان', 'المشاعر سلبية'],
  };

  return defaults[languageCode.toLowerCase()] || defaults.en;
}

/**
 * Render greeting message with contact data
 */
export interface ContactData {
  name?: string;
  email?: string;
  phone?: string;
}

export function renderGreeting(
  greetingTemplate: string,
  contact: ContactData,
  fallbackName: string = 'there'
): string {
  if (!greetingTemplate || typeof greetingTemplate !== 'string') {
    return '';
  }

  let rendered = greetingTemplate;

  // Replace {{name}} with contact name or fallback
  const name = contact.name?.trim() || fallbackName;
  rendered = rendered.replace(/\{\{name\}\}/gi, name);

  // Replace {{email}} with contact email or empty string
  const email = contact.email?.trim() || '';
  rendered = rendered.replace(/\{\{email\}\}/gi, email);

  // Replace {{phone}} with contact phone or empty string
  const phone = contact.phone?.trim() || '';
  rendered = rendered.replace(/\{\{phone\}\}/gi, phone);

  // Clean up any remaining undefined variables
  rendered = rendered.replace(/\{\{[^}]+\}\}/g, '');

  return rendered.trim();
}

// Audio cache for instant playback
const audioCache = new Map<string, { url: string; audio: HTMLAudioElement; blob: Blob }>();

// Track ongoing requests to prevent duplicates
const pendingRequests = new Map<string, Promise<void>>();

// Track active requests to limit concurrency
let activeRequestCount = 0;
const MAX_CONCURRENT_REQUESTS = 2;

// Debounce timer for preloading
let preloadTimer: NodeJS.Timeout | null = null;
let pendingPreload: { voiceId: string; language: string } | null = null;

/**
 * Preload voice preview audio (call on hover for instant playback)
 * Throttled to prevent rate limiting
 */
export async function preloadVoicePreview(voiceId: string, language: string): Promise<void> {
  const cacheKey = `${voiceId}-${language}`;

  // Already cached or already loading
  if (audioCache.has(cacheKey) || pendingRequests.has(cacheKey)) {
    return;
  }

  // Debounce rapid hover events
  if (preloadTimer) {
    clearTimeout(preloadTimer);
  }

  preloadTimer = setTimeout(async () => {
    if (activeRequestCount >= MAX_CONCURRENT_REQUESTS) {
      return; // Skip if too many concurrent requests
    }

    try {
      activeRequestCount++;
      const requestPromise = fetchVoiceAudio(voiceId, language, cacheKey);
      pendingRequests.set(cacheKey, requestPromise);

      await requestPromise;
    } catch (error: any) {
      // Silent fail for preload
      console.debug('Voice preload failed:', error);
    } finally {
      activeRequestCount--;
      pendingRequests.delete(cacheKey);
    }
  }, 300); // 300ms debounce
}



async function fetchVoiceAudio(
  voiceId: string,
  language: string,
  cacheKey: string,
  retries = 2
): Promise<void> {
  // Short sample text for faster generation
  const sampleTexts: Record<string, string> = {
    it: "Ciao!",
    es: "¡Hola!",
    en: "Hello!",
    fr: "Bonjour!",
    de: "Hallo!",
    pt: "Olá!",
    pl: "Cześć!",
    hi: "नमस्ते!",
    zh: "你好！",
    ja: "こんにちは！",
    ko: "안녕하세요!",
    tr: "Merhaba!",
    ar: "مرحبا!",
  };

  const sampleText = sampleTexts[language.toLowerCase()] || sampleTexts.en;
  const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || 'sk_3b1731773d047b2b8fd4612df9032faf9a8588c38454e1a4';
  const baseUrl = process.env.NEXT_PUBLIC_ELEVENLABS_API_URL || 'https://api.elevenlabs.io/v1';

  try {
    const response = await fetch(
      `${baseUrl}/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey
        },
        body: JSON.stringify({
          text: sampleText,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        })
      }
    );

    if (response.status === 409) {
      // Rate limit or conflict - wait and retry
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        return fetchVoiceAudio(voiceId, language, cacheKey, retries - 1);
      }
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    // Preload audio
    audio.preload = 'auto';

    audioCache.set(cacheKey, { url: audioUrl, audio, blob: audioBlob });
  } catch (error: any) {
    if (retries > 0 && !error?.message?.includes('Rate limit')) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return fetchVoiceAudio(voiceId, language, cacheKey, retries - 1);
    }
    throw error;
  }
}

/**
 * Play voice preview using Voice API with caching for instant playback
 */
export async function playVoicePreview(
  voiceId: string,
  language: string,
  onLoading?: () => void,
  onPlaying?: () => void,
  onError?: (error: string) => void
): Promise<HTMLAudioElement | null> {
  const cacheKey = `${voiceId}-${language}`;

  try {
    // Check cache first for instant playback
    const cached = audioCache.get(cacheKey);
    if (cached) {
      // Clone audio element for independent playback
      const audio = new Audio(cached.url);
      audio.onended = () => {
        // Don't revoke URL, keep in cache
      };
      audio.onerror = () => {
        onError?.("Failed to play voice sample");
      };

      // Play immediately
      onPlaying?.();
      await audio.play().catch((err) => {
        console.error('Audio play error:', err);
        onError?.("Failed to play audio");
      });
      return audio;
    }

    // Check if already loading
    const pendingRequest = pendingRequests.get(cacheKey);
    if (pendingRequest) {
      // Wait for pending request to complete
      await pendingRequest;
      const cachedAfterWait = audioCache.get(cacheKey);
      if (cachedAfterWait) {
        const audio = new Audio(cachedAfterWait.url);
        onPlaying?.();
        await audio.play().catch((err) => {
          console.error('Audio play error:', err);
          onError?.("Failed to play audio");
        });
        return audio;
      }
    }

    // Not cached, fetch and play
    onLoading?.();

    // Wait if too many concurrent requests
    while (activeRequestCount >= MAX_CONCURRENT_REQUESTS) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    try {
      activeRequestCount++;
      const requestPromise = fetchVoiceAudio(voiceId, language, cacheKey);
      pendingRequests.set(cacheKey, requestPromise);

      await requestPromise;

      // Get cached audio and play
      const cached = audioCache.get(cacheKey);
      if (cached) {
        const audio = new Audio(cached.url);

        audio.onended = () => {
          // Keep in cache
        };

        audio.onerror = () => {
          onError?.("Failed to play voice sample");
        };

        onPlaying?.();
        await audio.play().catch((err) => {
          console.error('Audio play error:', err);
          onError?.("Failed to play audio");
        });
        return audio;
      } else {
        throw new Error('Failed to cache audio');
      }
    } finally {
      activeRequestCount--;
      pendingRequests.delete(cacheKey);
    }

  } catch (error: any) {
    const errorMessage = error.message || "Failed to play voice sample";

    // Handle 409 specifically
    if (errorMessage.includes('409') || errorMessage.includes('Rate limit')) {
      onError?.("Too many requests. Please wait a moment and try again.");
    } else {
      onError?.(errorMessage);
    }

    return null;
  }
}
