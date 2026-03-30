export interface ChatbotSettings {
  general: {
    enableWebsiteWidget: boolean;
    emailRequired: boolean;
    phoneRequired: boolean;
    bubbleMessages: boolean;
  };
  customization: {
    logo: string | null;
    chatbotName: string;
    widgetColor: string;
    personality: "neutral" | "casual" | "formal";
    character: "adventurous" | "confident" | "convincing" | "energetic" | "friendly" | "funny" | "professional";
  };
  quickButtons: Array<{ id: string; text: string }>;
  welcomeMessages: {
    [language: string]: string;
  };
  notifications: {
    newConversation: boolean;
    contactFormSubmitted: boolean;
    supportRequest: boolean;
    operatorMentioned: boolean;
  };
}

export const mockChatbotSettings: ChatbotSettings = {
  general: {
    enableWebsiteWidget: true,
    emailRequired: false,
    phoneRequired: false,
    bubbleMessages: true,
  },
  customization: {
    logo: null,
    chatbotName: "Support Assistant",
    widgetColor: "#6366f1",
    personality: "neutral",
    character: "friendly",
  },
  quickButtons: [
    { id: "1", text: "Contact Support" },
    { id: "2", text: "View Pricing" },
    { id: "3", text: "Track Order" },
  ],
  welcomeMessages: {
    en: "Hello! How can I help you today?",
    es: "¡Hola! ¿Cómo puedo ayudarte hoy?",
    fr: "Bonjour! Comment puis-je vous aider aujourd'hui?",
    de: "Hallo! Wie kann ich Ihnen heute helfen?",
    it: "Ciao! Come posso aiutarti oggi?",
    pt: "Olá! Como posso ajudar você hoje?",
    ar: "مرحباً! كيف يمكنني مساعدتك اليوم؟",
    tr: "Merhaba! Bugün size nasıl yardımcı olabilirim?",
    zh: "你好！今天我能为你做些什么？",
    ja: "こんにちは！今日はどのようなお手伝いができますか？",
    ko: "안녕하세요! 오늘 어떻게 도와드릴까요?",
  },
  notifications: {
    newConversation: true,
    contactFormSubmitted: true,
    supportRequest: true,
    operatorMentioned: true,
  },
};

export const presetColors = [
  "#6366f1", // Indigo
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#f59e0b", // Amber
  "#10b981", // Green
  "#3b82f6", // Blue
  "#ef4444", // Red
  "#6b7280", // Gray
];

export const widgetTranslations: Record<
  string,
  { online: string; placeholder: string; ready: string; askName: string; afterName: string }
> = {
  en: {
    online: "Online",
    placeholder: "Type your message...",
    ready: "Ready to help",
    askName: "👋 Hello! Before we start, may I know your name?",
    afterName: "Nice to meet you, {name}! How can I help you today?",
  },
  es: {
    online: "En línea",
    placeholder: "Escribe tu mensaje...",
    ready: "Listo para ayudar",
    askName: "👋 ¡Hola! Antes de empezar, ¿puedo saber tu nombre?",
    afterName: "¡Encantado de conocerte, {name}! ¿En qué puedo ayudarte hoy?",
  },
  fr: {
    online: "En ligne",
    placeholder: "Tapez votre message...",
    ready: "Prêt à aider",
    askName: "👋 Bonjour! Avant de commencer, puis-je connaître votre nom?",
    afterName: "Ravi de vous rencontrer, {name} ! Comment puis-je vous aider aujourd'hui ?",
  },
  de: {
    online: "Online",
    placeholder: "Nachricht eingeben...",
    ready: "Bereit zu helfen",
    askName: "👋 Hallo! Bevor wir beginnen, darf ich Ihren Namen erfahren?",
    afterName: "Schön, dich kennenzulernen, {name}! Wie kann ich dir heute helfen?",
  },
  it: {
    online: "Online",
    placeholder: "Scrivi il tuo messaggio...",
    ready: "Pronto ad aiutare",
    askName: "👋 Ciao! Prima di iniziare, posso sapere come ti chiami?",
    afterName: "Piacere di conoscerti, {name}! Come posso aiutarti oggi?",
  },
  pt: {
    online: "Online",
    placeholder: "Digite sua mensagem...",
    ready: "Pronto para ajudar",
    askName: "👋 Olá! Antes de começarmos, posso saber seu nome?",
    afterName: "Prazer em conhecer você, {name}! Como posso ajudar hoje?",
  },
  ar: {
    online: "متصل",
    placeholder: "اكتب رسالتك...",
    ready: "جاهز للمساعدة",
    askName: "👋 مرحباً! قبل أن نبدأ، هل يمكنني معرفة اسمك؟",
    afterName: "تشرفنا بمعرفتك، {name}! كيف يمكنني مساعدتك اليوم؟",
  },
  tr: {
    online: "Çevrimiçi",
    placeholder: "Mesajınızı yazın...",
    ready: "Yardıma hazır",
    askName: "👋 Merhaba! Başlamadan önce isminizi öğrenebilir miyim?",
    afterName: "Tanıştığımıza memnun oldum, {name}! Bugün size nasıl yardımcı olabilirim?",
  },
  zh: {
    online: "在线",
    placeholder: "输入您的消息...",
    ready: "随时为您服务",
    askName: "👋 你好！在开始之前，我可以知道你的名字吗？",
    afterName: "很高兴认识你，{name}！今天我能帮你什么？",
  },
  ja: {
    online: "オンライン",
    placeholder: "メッセージを入力...",
    ready: "ご支援します",
    askName: "👋 こんにちは！始める前に、お名前を教えていただけますか？",
    afterName: "はじめまして、{name}さん！本日はどのようなご用件でしょうか？",
  },
  ko: {
    online: "온라인",
    placeholder: "메시지를 입력하세요...",
    ready: "도와드릴 준비가 되었습니다",
    askName: "👋 안녕하세요! 시작하기 전에 성함을 알려주시겠습니까?",
    afterName: "만나서 반가워요, {name}님! 오늘 무엇을 도와드릴까요?",
  },
};

