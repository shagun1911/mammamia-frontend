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
    name: "Lead Generation Workflow (Facebook Lead Form)",
    description: "Capture Facebook leads, make AI calls, check calendar availability, create appointments, and save to Google Sheets",
    icon: "🎯",
    color: "#6366f1",
    requiredIntegrations: ["facebook", "google"],
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
        type: "delay",
        service: "delay",
        config: { delay: 10, delayUnit: "seconds" },
        position: 1,
      },
      {
        id: "node_3",
        type: "action",
        service: "keplero_create_contact",
        config: {
          name: "{{lead.name}}",
          email: "{{lead.email}}",
          phone: "{{lead.phone}}",
          tags: ["lead", "facebook"],
        },
        position: 2,
      },
      {
        id: "node_4",
        type: "action",
        service: "keplero_outbound_call",
        config: {
          dynamicInstruction: "Hello {{contact.name}}, thank you for your interest. I'm calling to discuss your inquiry and see if we can schedule an appointment.",
          language: "en",
        },
        position: 3,
      },
      {
        id: "node_5",
        type: "action",
        service: "keplero_google_calendar_check_availability",
        config: {
          timeMin: "{{nextBusinessDay}}T09:00:00Z",
          timeMax: "{{nextBusinessDay}}T17:00:00Z",
          calendarIds: ["primary"],
        },
        position: 4,
      },
      {
        id: "node_6",
        type: "action",
        service: "keplero_google_calendar_create_event",
        config: {
          summary: "Appointment with {{contact.name}}",
          description: "Follow-up appointment for Facebook lead: {{contact.email}}",
          startDateTime: "{{availableSlot.start}}",
          endDateTime: "{{availableSlot.end}}",
          timeZone: "UTC",
          location: "Phone Call / Video Call",
        },
        position: 5,
      },
      {
        id: "node_7",
        type: "action",
        service: "keplero_google_sheet_append_row",
        config: {
          spreadsheetId: "",
          range: "Sheet1!A1",
          values: ["{{contact.name}}", "{{contact.email}}", "{{contact.phone}}", "{{contact.createdAt}}", "Appointment Scheduled"],
        },
        position: 6,
      },
      {
        id: "node_8",
        type: "action",
        service: "keplero_google_gmail_send",
        config: {
          to: "{{contact.email}}",
          subject: "Appointment Confirmed - {{contact.name}}",
          body: "Hi {{contact.name}},\n\nYour appointment has been scheduled. We'll contact you at the scheduled time.\n\nThank you!",
          isHtml: false,
        },
        position: 7,
      },
    ],
  },
  {
    id: "template_contact_form_whatsapp",
    name: "Contact Form Workflow (WhatsApp)",
    description: "When a contact form is submitted, wait 10 seconds, send WhatsApp message, and save lead to Google Sheets",
    icon: "📝",
    color: "#25d366",
    requiredIntegrations: ["whatsapp", "google"],
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
        type: "delay",
        service: "delay",
        config: { delay: 10, delayUnit: "seconds" },
        position: 1,
      },
      {
        id: "node_3",
        type: "action",
        service: "whatsapp_template",
        config: {
          template: "form_confirmation",
          variables: {
            name: "{{contact.name}}",
          },
        },
        position: 2,
      },
      {
        id: "node_4",
        type: "action",
        service: "keplero_google_sheet_append_row",
        config: {
          spreadsheetId: "",
          range: "Sheet1!A1",
          values: ["{{contact.name}}", "{{contact.email}}", "{{contact.phone}}", "{{contact.createdAt}}", "WhatsApp Sent"],
        },
        position: 3,
      },
    ],
  },
  {
    id: "template_outbound_batch_call",
    name: "Outbound Batch Call Workflow",
    description: "Make batch AI calls to contact list, check calendar availability, create appointments, save to Google Sheets, and send emails",
    icon: "📞",
    color: "#8b5cf6",
    requiredIntegrations: ["google"],
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
          dynamicInstruction: "Hello {{contact.name}}, this is a follow-up call. We'd like to schedule an appointment with you.",
          language: "en",
        },
        position: 1,
      },
      {
        id: "node_3",
        type: "action",
        service: "keplero_google_calendar_check_availability",
        config: {
          timeMin: "{{nextBusinessDay}}T09:00:00Z",
          timeMax: "{{nextBusinessDay}}T17:00:00Z",
          calendarIds: ["primary"],
        },
        position: 2,
      },
      {
        id: "node_4",
        type: "action",
        service: "keplero_google_calendar_create_event",
        config: {
          summary: "Appointment with {{contact.name}}",
          description: "Batch call follow-up appointment: {{contact.email}}",
          startDateTime: "{{availableSlot.start}}",
          endDateTime: "{{availableSlot.end}}",
          timeZone: "UTC",
          location: "Phone Call",
        },
        position: 3,
      },
      {
        id: "node_5",
        type: "action",
        service: "keplero_google_sheet_append_row",
        config: {
          spreadsheetId: "",
          range: "Sheet1!A1",
          values: ["{{contact.name}}", "{{contact.email}}", "{{contact.phone}}", "{{contact.createdAt}}", "Appointment Scheduled"],
        },
        position: 4,
      },
      {
        id: "node_6",
        type: "action",
        service: "keplero_google_gmail_send",
        config: {
          to: "{{contact.email}}",
          subject: "Appointment Confirmed - {{contact.name}}",
          body: "Hi {{contact.name}},\n\nYour appointment has been scheduled. We'll contact you at the scheduled time.\n\nThank you!",
          isHtml: false,
        },
        position: 5,
      },
    ],
  },
  {
    id: "template_contact_form_email",
    name: "Contact Form Workflow (Email)",
    description: "When a contact form is submitted, wait 10 seconds, send email, and save lead to Google Sheets",
    icon: "📧",
    color: "#3b82f6",
    requiredIntegrations: ["email", "google"],
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
        type: "delay",
        service: "delay",
        config: { delay: 10, delayUnit: "seconds" },
        position: 1,
      },
      {
        id: "node_3",
        type: "action",
        service: "keplero_send_email",
        config: {
          subject: "Welcome {{contact.name}}!",
          body: "Thank you for contacting us. We'll get back to you soon.",
          is_html: false,
        },
        position: 2,
      },
      {
        id: "node_4",
        type: "action",
        service: "keplero_google_sheet_append_row",
        config: {
          spreadsheetId: "",
          range: "Sheet1!A1",
          values: ["{{contact.name}}", "{{contact.email}}", "{{contact.phone}}", "{{contact.createdAt}}", "Email Sent"],
        },
        position: 3,
      },
    ],
  },
  {
    id: "template_inbound_call",
    name: "Inbound Call Workflow",
    description: "Handle inbound calls, create contacts, save to Google Sheets with conversation link, send WhatsApp, and schedule appointments",
    icon: "📱",
    color: "#10b981",
    requiredIntegrations: ["whatsapp", "google"],
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
          email: "{{call.caller_email}}",
          tags: ["inbound_call"],
        },
        position: 1,
      },
      {
        id: "node_3",
        type: "action",
        service: "keplero_google_sheet_append_row",
        config: {
          spreadsheetId: "",
          range: "Sheet1!A1",
          values: ["{{contact.name}}", "{{contact.email}}", "{{contact.phone}}", "{{contact.createdAt}}", "{{conversation.link}}"],
        },
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
      {
        id: "node_5",
        type: "action",
        service: "keplero_google_calendar_check_availability",
        config: {
          timeMin: "{{nextBusinessDay}}T09:00:00Z",
          timeMax: "{{nextBusinessDay}}T17:00:00Z",
          calendarIds: ["primary"],
        },
        position: 4,
      },
      {
        id: "node_6",
        type: "action",
        service: "keplero_google_calendar_create_event",
        config: {
          summary: "Follow-up Appointment - {{contact.name}}",
          description: "Inbound call follow-up: {{contact.email}}\nConversation: {{conversation.link}}",
          startDateTime: "{{availableSlot.start}}",
          endDateTime: "{{availableSlot.end}}",
          timeZone: "UTC",
          location: "Phone Call",
        },
        position: 5,
      },
      {
        id: "node_7",
        type: "action",
        service: "keplero_google_gmail_send",
        config: {
          to: "{{contact.email}}",
          subject: "Appointment Details - {{contact.name}}",
          body: "Hi {{contact.name}},\n\nThank you for your call. Your appointment has been scheduled.\n\nConversation Link: {{conversation.link}}\n\nWe'll contact you at the scheduled time.\n\nThank you!",
          isHtml: false,
        },
        position: 6,
      },
    ],
  },
];
