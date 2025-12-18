export interface AutomationNode {
  id: string;
  type: "trigger" | "delay" | "action";
  service: string;
  config: {
    // Trigger config
    event?: string;
    listId?: string;
    source?: string;
    
    // Delay config
    delay?: number;
    delayUnit?: "minutes" | "hours" | "days";
    
    // Communication config
    template?: string;
    subject?: string;
    message?: string;
    body?: string;
    
    // Contact config
    name?: string;
    email?: string;
    phone?: string;
    tags?: string[];
    lists?: string[];
    
    // Call config
    dynamicInstruction?: string;
    language?: string;
    transferTo?: string;
    escalationCondition?: string;
    
    // API config
    url?: string;
    method?: string;
    headers?: any;
    params?: any;
    
    // WhatsApp config
    variables?: Record<string, string>;
    
    // Generic
    [key: string]: any;
  };
  position: number;
}

export interface Automation {
  id: string;
  name: string;
  status: "enabled" | "disabled";
  nodes: AutomationNode[];
  lastExecuted: string | null;
  executionCount: number;
  createdAt: string;
}

export const nodeServices = {
  triggers: [
    { id: "keplero_contact_created", name: "Aistein-It - Contact Created", icon: "👤", color: "#6366f1" },
    { id: "keplero_contact_deleted", name: "Aistein-It - Contact Deleted", icon: "🗑️", color: "#ef4444" },
    { id: "keplero_contact_moved", name: "Aistein-It - Contact Moved", icon: "📋", color: "#8b5cf6" },
    { id: "keplero_mass_sending", name: "Aistein-It - Mass Sending", icon: "📤", color: "#f59e0b" },
    { id: "facebook_leads", name: "Facebook Leads", icon: "📘", color: "#1877f2" },
    { id: "shopify_order", name: "Shopify Order", icon: "🛍️", color: "#96bf48" },
    { id: "cart_abandoned", name: "Cart Abandoned", icon: "🛒", color: "#f59e0b" },
    { id: "webhook", name: "Webhook", icon: "🔗", color: "#a855f7" },
  ],
  actions: [
    { id: "keplero_outbound_call", name: "Aistein-It - Outbound Call", icon: "📞", color: "#8b5cf6" },
    { id: "keplero_send_sms", name: "Aistein-It - Send SMS", icon: "💬", color: "#10b981" },
    { id: "keplero_send_email", name: "Aistein-It - Send Email", icon: "📧", color: "#3b82f6" },
    { id: "keplero_create_contact", name: "Aistein-It - Create Contact", icon: "➕", color: "#6366f1" },
    { id: "keplero_api_call", name: "Aistein-It - API Call", icon: "🔗", color: "#a855f7" },
    { id: "whatsapp_template", name: "WhatsApp Template", icon: "💬", color: "#25d366" },
    { id: "send_email", name: "Send Email", icon: "📧", color: "#3b82f6" },
    { id: "save_to_crm", name: "Save to CRM", icon: "💾", color: "#8b5cf6" },
  ],
};

export const mockAutomations: Automation[] = [
  {
    id: "auto_1",
    name: "Automation n. 3",
    status: "disabled",
    nodes: [
      {
        id: "node_1",
        type: "trigger",
        service: "facebook_leads",
        config: { event: "" },
        position: 0,
      },
      {
        id: "node_2",
        type: "delay",
        service: "delay",
        config: { delay: 5, delayUnit: "minutes" },
        position: 1,
      },
      {
        id: "node_3",
        type: "action",
        service: "whatsapp_template",
        config: { template: "" },
        position: 2,
      },
    ],
    lastExecuted: null,
    executionCount: 0,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "auto_2",
    name: "Welcome New Customers",
    status: "enabled",
    nodes: [
      {
        id: "node_1",
        type: "trigger",
        service: "shopify_order",
        config: { event: "order_created" },
        position: 0,
      },
      {
        id: "node_2",
        type: "action",
        service: "send_email",
        config: {
          subject: "Welcome to our store!",
          template: "welcome_email",
        },
        position: 1,
      },
      {
        id: "node_3",
        type: "delay",
        service: "delay",
        config: { delay: 24, delayUnit: "hours" },
        position: 2,
      },
      {
        id: "node_4",
        type: "action",
        service: "whatsapp_template",
        config: { template: "follow_up" },
        position: 3,
      },
    ],
    lastExecuted: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    executionCount: 142,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "auto_3",
    name: "Cart Recovery Flow",
    status: "enabled",
    nodes: [
      {
        id: "node_1",
        type: "trigger",
        service: "cart_abandoned",
        config: { event: "cart_abandoned" },
        position: 0,
      },
      {
        id: "node_2",
        type: "delay",
        service: "delay",
        config: { delay: 1, delayUnit: "hours" },
        position: 1,
      },
      {
        id: "node_3",
        type: "action",
        service: "whatsapp_template",
        config: { template: "cart_reminder" },
        position: 2,
      },
      {
        id: "node_4",
        type: "delay",
        service: "delay",
        config: { delay: 24, delayUnit: "hours" },
        position: 3,
      },
      {
        id: "node_5",
        type: "action",
        service: "send_email",
        config: {
          subject: "Don't forget your items!",
          template: "cart_reminder_email",
        },
        position: 4,
      },
    ],
    lastExecuted: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    executionCount: 87,
    createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "auto_4",
    name: "Lead Qualification",
    status: "disabled",
    nodes: [
      {
        id: "node_1",
        type: "trigger",
        service: "form_submitted",
        config: { event: "contact_form" },
        position: 0,
      },
      {
        id: "node_2",
        type: "action",
        service: "save_to_crm",
        config: {},
        position: 1,
      },
      {
        id: "node_3",
        type: "action",
        service: "create_task",
        config: { message: "Follow up with lead" },
        position: 2,
      },
    ],
    lastExecuted: null,
    executionCount: 0,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];
