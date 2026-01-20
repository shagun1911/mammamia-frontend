import { Automation, AutomationNode } from "./mockAutomations";

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  nodes: AutomationNode[];
  requiredIntegrations?: string[]; // e.g., ['whatsapp', 'google', 'facebook', 'email']
}

export const automationTemplates: AutomationTemplate[] = [
  {
    id: "template_lead_generation",
    name: "Lead Generation Workflow",
    description: "Automatically capture leads from Facebook, create contacts, and send welcome messages via WhatsApp",
    icon: "🎯",
    color: "#6366f1",
    requiredIntegrations: ["facebook", "whatsapp"],
    nodes: [
      {
        id: "node_1",
        type: "trigger",
        service: "facebook_leads",
        config: { event: "lead_created" },
        position: 0,
      },
      {
        id: "node_2",
        type: "action",
        service: "keplero_create_contact",
        config: {
          name: "{{lead.name}}",
          email: "{{lead.email}}",
          phone: "{{lead.phone}}",
          tags: ["lead", "facebook"],
        },
        position: 1,
      },
      {
        id: "node_3",
        type: "delay",
        service: "delay",
        config: { delay: 5, delayUnit: "minutes" },
        position: 2,
      },
      {
        id: "node_4",
        type: "action",
        service: "whatsapp_template",
        config: {
          template: "welcome_message",
          variables: {
            name: "{{lead.name}}",
          },
        },
        position: 3,
      },
    ],
  },
  {
    id: "template_contact_form_whatsapp",
    name: "Contact Form Workflow (WhatsApp)",
    description: "When a contact form is submitted, create a contact and send a WhatsApp confirmation message",
    icon: "📝",
    color: "#25d366",
    requiredIntegrations: ["whatsapp"],
    nodes: [
      {
        id: "node_1",
        type: "trigger",
        service: "keplero_contact_created",
        config: {
          event: "contact_form_submitted",
          source: "website",
        },
        position: 0,
      },
      {
        id: "node_2",
        type: "action",
        service: "whatsapp_template",
        config: {
          template: "form_confirmation",
          variables: {
            name: "{{contact.name}}",
          },
        },
        position: 1,
      },
      {
        id: "node_3",
        type: "delay",
        service: "delay",
        config: { delay: 1, delayUnit: "hours" },
        position: 2,
      },
      {
        id: "node_4",
        type: "action",
        service: "whatsapp_template",
        config: {
          template: "follow_up",
          variables: {
            name: "{{contact.name}}",
          },
        },
        position: 3,
      },
    ],
  },
  {
    id: "template_outbound_batch_call",
    name: "Outbound Batch Call",
    description: "Make automated outbound calls to a list of contacts with personalized messages",
    icon: "📞",
    color: "#8b5cf6",
    requiredIntegrations: [],
    nodes: [
      {
        id: "node_1",
        type: "trigger",
        service: "keplero_mass_sending",
        config: {
          event: "batch_call",
          listId: "",
        },
        position: 0,
      },
      {
        id: "node_2",
        type: "action",
        service: "keplero_outbound_call",
        config: {
          dynamicInstruction: "Hello {{contact.name}}, this is a follow-up call regarding your inquiry.",
          language: "en",
          transferTo: "",
          escalationCondition: "If customer asks to speak with a human",
        },
        position: 1,
      },
    ],
  },
  {
    id: "template_contact_form_email",
    name: "Contact Form Workflow (Email)",
    description: "When a contact form is submitted, create a contact and send a welcome email",
    icon: "📧",
    color: "#3b82f6",
    requiredIntegrations: ["email"],
    nodes: [
      {
        id: "node_1",
        type: "trigger",
        service: "keplero_contact_created",
        config: {
          event: "contact_form_submitted",
          source: "website",
        },
        position: 0,
      },
      {
        id: "node_2",
        type: "action",
        service: "keplero_send_email",
        config: {
          subject: "Welcome {{contact.name}}!",
          body: "Thank you for contacting us. We'll get back to you soon.",
          is_html: false,
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
        service: "keplero_send_email",
        config: {
          subject: "Follow-up: How can we help?",
          body: "Hi {{contact.name}}, we wanted to check if you have any questions.",
          is_html: false,
        },
        position: 3,
      },
    ],
  },
  {
    id: "template_inbound_call",
    name: "Inbound Call Workflow",
    description: "Handle inbound calls with AI agent, create conversation records, and send follow-up messages",
    icon: "📱",
    color: "#10b981",
    requiredIntegrations: ["whatsapp"],
    nodes: [
      {
        id: "node_1",
        type: "trigger",
        service: "webhook",
        config: {
          event: "inbound_call_received",
          url: "",
        },
        position: 0,
      },
      {
        id: "node_2",
        type: "action",
        service: "keplero_create_contact",
        config: {
          name: "{{call.caller_name}}",
          phone: "{{call.caller_number}}",
          tags: ["inbound_call"],
        },
        position: 1,
      },
      {
        id: "node_3",
        type: "delay",
        service: "delay",
        config: { delay: 1, delayUnit: "hours" },
        position: 2,
      },
      {
        id: "node_4",
        type: "action",
        service: "whatsapp_template",
        config: {
          template: "call_follow_up",
          variables: {
            name: "{{contact.name}}",
          },
        },
        position: 3,
      },
    ],
  },
];
