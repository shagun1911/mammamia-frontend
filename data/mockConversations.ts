export interface Message {
  id: string;
  sender: "customer" | "agent";
  content: string;
  timestamp: string;
  type: "text" | "voice" | "image" | "file";
}

export interface Customer {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  color: string;
}

export interface Conversation {
  id: string;
  customer: Customer;
  channel: "whatsapp" | "website" | "email" | "social" | "phone";
  status: "open" | "unread" | "support_request" | "closed";
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  labels: string[];
  folder: string | null;
  messages: Message[];
}

const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b"];

export const mockConversations: Conversation[] = [
  {
    id: "1",
    customer: {
      name: "Sarah Johnson",
      email: "sarah.johnson@example.com",
      phone: "+1 555-0101",
      avatar: "SJ",
      color: colors[0],
    },
    channel: "whatsapp",
    status: "open",
    lastMessage: "That would be great, thank you!",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    unread: true,
    labels: ["urgent", "order"],
    folder: "Support",
    messages: [
      {
        id: "m1-1",
        sender: "customer",
        content: "Hi, I need help with my order #12345",
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        type: "text",
      },
      {
        id: "m1-2",
        sender: "agent",
        content: "Hello! I'd be happy to help you with your order. Let me check the status for you.",
        timestamp: new Date(Date.now() - 1000 * 60 * 58).toISOString(),
        type: "text",
      },
      {
        id: "m1-3",
        sender: "customer",
        content: "Thank you! It was supposed to arrive yesterday but I haven't received it yet.",
        timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
        type: "text",
      },
      {
        id: "m1-4",
        sender: "agent",
        content: "I can see your order is currently in transit. It appears there was a slight delay with the carrier. It should arrive tomorrow.",
        timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
        type: "text",
      },
      {
        id: "m1-5",
        sender: "customer",
        content: "I see. Is there a tracking number I can use?",
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        type: "text",
      },
      {
        id: "m1-6",
        sender: "agent",
        content: "Yes! Your tracking number is: TRK-123456789. I'll also send this to your email.",
        timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
        type: "text",
      },
      {
        id: "m1-7",
        sender: "customer",
        content: "That would be great, thank you!",
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        type: "text",
      },
    ],
  },
  {
    id: "2",
    customer: {
      name: "Michael Chen",
      email: "michael.chen@example.com",
      phone: "+1 555-0102",
      avatar: "MC",
      color: colors[1],
    },
    channel: "website",
    status: "unread",
    lastMessage: "Can you help me reset my password?",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    unread: true,
    labels: ["account"],
    folder: null,
    messages: [
      {
        id: "m2-1",
        sender: "customer",
        content: "Hi there!",
        timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
        type: "text",
      },
      {
        id: "m2-2",
        sender: "customer",
        content: "Can you help me reset my password?",
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        type: "text",
      },
    ],
  },
  {
    id: "3",
    customer: {
      name: "Emma Davis",
      email: "emma.davis@example.com",
      phone: "+1 555-0103",
      avatar: "ED",
      color: colors[2],
    },
    channel: "phone",
    status: "open",
    lastMessage: "Perfect, I'll wait for your call",
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    unread: false,
    labels: ["callback"],
    folder: "Sales",
    messages: [
      {
        id: "m3-1",
        sender: "customer",
        content: "Voice message received",
        timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        type: "voice",
      },
      {
        id: "m3-2",
        sender: "agent",
        content: "Thank you for your message! I'll call you back within the next hour to discuss your inquiry.",
        timestamp: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
        type: "text",
      },
      {
        id: "m3-3",
        sender: "customer",
        content: "Perfect, I'll wait for your call",
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        type: "text",
      },
    ],
  },
  {
    id: "4",
    customer: {
      name: "James Wilson",
      email: "james.wilson@example.com",
      phone: "+1 555-0104",
      avatar: "JW",
      color: colors[3],
    },
    channel: "email",
    status: "support_request",
    lastMessage: "Yes, I can send photos",
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    unread: true,
    labels: ["refund", "urgent"],
    folder: "Support",
    messages: [
      {
        id: "m4-1",
        sender: "customer",
        content: "I received a damaged product",
        timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
        type: "text",
      },
      {
        id: "m4-2",
        sender: "agent",
        content: "I'm sorry to hear that! Could you please provide photos of the damage?",
        timestamp: new Date(Date.now() - 1000 * 60 * 220).toISOString(),
        type: "text",
      },
      {
        id: "m4-3",
        sender: "customer",
        content: "The box was crushed and the item inside is broken",
        timestamp: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
        type: "text",
      },
      {
        id: "m4-4",
        sender: "agent",
        content: "I understand. We'll process a full refund or send a replacement. Which would you prefer?",
        timestamp: new Date(Date.now() - 1000 * 60 * 190).toISOString(),
        type: "text",
      },
      {
        id: "m4-5",
        sender: "customer",
        content: "Yes, I can send photos",
        timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        type: "text",
      },
    ],
  },
  {
    id: "5",
    customer: {
      name: "Sophia Martinez",
      email: "sophia.martinez@example.com",
      phone: "+1 555-0105",
      avatar: "SM",
      color: colors[0],
    },
    channel: "social",
    status: "open",
    lastMessage: "That sounds perfect for my needs",
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    unread: false,
    labels: ["sales"],
    folder: "Sales",
    messages: [
      {
        id: "m5-1",
        sender: "customer",
        content: "Interested in your premium plan",
        timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
        type: "text",
      },
      {
        id: "m5-2",
        sender: "agent",
        content: "Great! Our premium plan includes unlimited users, advanced analytics, and priority support.",
        timestamp: new Date(Date.now() - 1000 * 60 * 280).toISOString(),
        type: "text",
      },
      {
        id: "m5-3",
        sender: "customer",
        content: "What's the pricing structure?",
        timestamp: new Date(Date.now() - 1000 * 60 * 260).toISOString(),
        type: "text",
      },
      {
        id: "m5-4",
        sender: "agent",
        content: "The premium plan is €99/month, billed annually. We also offer a 14-day free trial.",
        timestamp: new Date(Date.now() - 1000 * 60 * 250).toISOString(),
        type: "text",
      },
      {
        id: "m5-5",
        sender: "customer",
        content: "That sounds perfect for my needs",
        timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
        type: "text",
      },
    ],
  },
  {
    id: "6",
    customer: {
      name: "Oliver Brown",
      email: "oliver.brown@example.com",
      phone: "+1 555-0106",
      avatar: "OB",
      color: colors[1],
    },
    channel: "whatsapp",
    status: "open",
    lastMessage: "Thank you for your help!",
    timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    unread: false,
    labels: [],
    folder: null,
    messages: [
      {
        id: "m6-1",
        sender: "customer",
        content: "Hi, I need some information about your services",
        timestamp: new Date(Date.now() - 1000 * 60 * 400).toISOString(),
        type: "text",
      },
      {
        id: "m6-2",
        sender: "agent",
        content: "Of course! What would you like to know?",
        timestamp: new Date(Date.now() - 1000 * 60 * 390).toISOString(),
        type: "text",
      },
      {
        id: "m6-3",
        sender: "customer",
        content: "Do you offer international shipping?",
        timestamp: new Date(Date.now() - 1000 * 60 * 380).toISOString(),
        type: "text",
      },
      {
        id: "m6-4",
        sender: "agent",
        content: "Yes, we ship to over 150 countries worldwide. Shipping times vary by location.",
        timestamp: new Date(Date.now() - 1000 * 60 * 370).toISOString(),
        type: "text",
      },
      {
        id: "m6-5",
        sender: "customer",
        content: "Great! What about customs fees?",
        timestamp: new Date(Date.now() - 1000 * 60 * 365).toISOString(),
        type: "text",
      },
      {
        id: "m6-6",
        sender: "agent",
        content: "Customs fees are the responsibility of the recipient and vary by country. We provide all necessary documentation.",
        timestamp: new Date(Date.now() - 1000 * 60 * 362).toISOString(),
        type: "text",
      },
      {
        id: "m6-7",
        sender: "customer",
        content: "Thank you for your help!",
        timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
        type: "text",
      },
    ],
  },
  {
    id: "7",
    customer: {
      name: "Ava Taylor",
      email: "ava.taylor@example.com",
      phone: "+1 555-0107",
      avatar: "AT",
      color: colors[2],
    },
    channel: "website",
    status: "closed",
    lastMessage: "Issue resolved, closing ticket",
    timestamp: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
    unread: false,
    labels: ["resolved"],
    folder: "Support",
    messages: [
      {
        id: "m7-1",
        sender: "customer",
        content: "My account is locked",
        timestamp: new Date(Date.now() - 1000 * 60 * 500).toISOString(),
        type: "text",
      },
      {
        id: "m7-2",
        sender: "agent",
        content: "I can help you unlock your account. Can you verify your email address?",
        timestamp: new Date(Date.now() - 1000 * 60 * 495).toISOString(),
        type: "text",
      },
      {
        id: "m7-3",
        sender: "customer",
        content: "ava.taylor@example.com",
        timestamp: new Date(Date.now() - 1000 * 60 * 490).toISOString(),
        type: "text",
      },
      {
        id: "m7-4",
        sender: "agent",
        content: "Thank you! I've unlocked your account. You should be able to log in now.",
        timestamp: new Date(Date.now() - 1000 * 60 * 485).toISOString(),
        type: "text",
      },
      {
        id: "m7-5",
        sender: "customer",
        content: "It works! Thank you so much!",
        timestamp: new Date(Date.now() - 1000 * 60 * 482).toISOString(),
        type: "text",
      },
      {
        id: "m7-6",
        sender: "agent",
        content: "Issue resolved, closing ticket",
        timestamp: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
        type: "text",
      },
    ],
  },
  {
    id: "8",
    customer: {
      name: "Liam Anderson",
      email: "liam.anderson@example.com",
      phone: "+1 555-0108",
      avatar: "LA",
      color: colors[3],
    },
    channel: "email",
    status: "open",
    lastMessage: "Okay, I'll keep an eye out for it",
    timestamp: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
    unread: false,
    labels: ["shipping"],
    folder: "Support",
    messages: [
      {
        id: "m8-1",
        sender: "customer",
        content: "When will my order ship?",
        timestamp: new Date(Date.now() - 1000 * 60 * 650).toISOString(),
        type: "text",
      },
      {
        id: "m8-2",
        sender: "agent",
        content: "Let me check your order status. Could you provide your order number?",
        timestamp: new Date(Date.now() - 1000 * 60 * 630).toISOString(),
        type: "text",
      },
      {
        id: "m8-3",
        sender: "customer",
        content: "Order #67890",
        timestamp: new Date(Date.now() - 1000 * 60 * 620).toISOString(),
        type: "text",
      },
      {
        id: "m8-4",
        sender: "agent",
        content: "Your order shipped yesterday! You should receive a tracking email soon.",
        timestamp: new Date(Date.now() - 1000 * 60 * 610).toISOString(),
        type: "text",
      },
      {
        id: "m8-5",
        sender: "customer",
        content: "Okay, I'll keep an eye out for it",
        timestamp: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
        type: "text",
      },
    ],
  },
  {
    id: "9",
    customer: {
      name: "Isabella Garcia",
      email: "isabella.garcia@example.com",
      phone: "+1 555-0109",
      avatar: "IG",
      color: colors[0],
    },
    channel: "phone",
    status: "support_request",
    lastMessage: "Thanks, I appreciate the quick response",
    timestamp: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
    unread: true,
    labels: ["callback", "urgent"],
    folder: "Sales",
    messages: [
      {
        id: "m9-1",
        sender: "customer",
        content: "Voice message received",
        timestamp: new Date(Date.now() - 1000 * 60 * 750).toISOString(),
        type: "voice",
      },
      {
        id: "m9-2",
        sender: "agent",
        content: "I received your voicemail about the enterprise plan. I'd be happy to schedule a call to discuss this further.",
        timestamp: new Date(Date.now() - 1000 * 60 * 730).toISOString(),
        type: "text",
      },
      {
        id: "m9-3",
        sender: "customer",
        content: "Thanks, I appreciate the quick response",
        timestamp: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
        type: "text",
      },
    ],
  },
  {
    id: "10",
    customer: {
      name: "Noah Thompson",
      email: "noah.thompson@example.com",
      phone: "+1 555-0110",
      avatar: "NT",
      color: colors[1],
    },
    channel: "whatsapp",
    status: "open",
    lastMessage: "Perfect, I'll check it out",
    timestamp: new Date(Date.now() - 1000 * 60 * 840).toISOString(),
    unread: false,
    labels: ["docs"],
    folder: null,
    messages: [
      {
        id: "m10-1",
        sender: "customer",
        content: "Looking for documentation",
        timestamp: new Date(Date.now() - 1000 * 60 * 900).toISOString(),
        type: "text",
      },
      {
        id: "m10-2",
        sender: "agent",
        content: "You can find our complete documentation at docs.example.com",
        timestamp: new Date(Date.now() - 1000 * 60 * 880).toISOString(),
        type: "text",
      },
      {
        id: "m10-3",
        sender: "customer",
        content: "Is there a getting started guide?",
        timestamp: new Date(Date.now() - 1000 * 60 * 860).toISOString(),
        type: "text",
      },
      {
        id: "m10-4",
        sender: "agent",
        content: "Yes! Check out docs.example.com/getting-started - it has step-by-step instructions.",
        timestamp: new Date(Date.now() - 1000 * 60 * 850).toISOString(),
        type: "text",
      },
      {
        id: "m10-5",
        sender: "customer",
        content: "Perfect, I'll check it out",
        timestamp: new Date(Date.now() - 1000 * 60 * 840).toISOString(),
        type: "text",
      },
    ],
  },
];
