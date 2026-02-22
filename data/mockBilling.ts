import { BillingPlan, UsageStat, Invoice } from "@/lib/types";

export const currentPlan: BillingPlan = {
  name: "Professional Plan",
  price: 99,
  currency: "EUR",
  interval: "month",
  features: [
    "Unlimited conversations",
    "Advanced AI features",
    "Priority support",
    "Custom branding",
    "Analytics & reporting",
    "API access",
  ],
};

export const usageStats: UsageStat[] = [
  {
    label: "Conversations",
    value: 3847,
    limit: 10000,
    unit: "conversations",
  },
  {
    label: "AI Responses",
    value: 12459,
    limit: 50000,
    unit: "responses",
  },
  {
    label: "Storage",
    value: 24,
    limit: 100,
    unit: "MB",
  },
];

export const invoices: Invoice[] = [
  {
    id: "INV-2024-001",
    date: "2024-10-01",
    amount: 99,
    status: "paid",
    downloadUrl: "#",
  },
  {
    id: "INV-2024-002",
    date: "2024-09-01",
    amount: 99,
    status: "paid",
    downloadUrl: "#",
  },
  {
    id: "INV-2024-003",
    date: "2024-08-01",
    amount: 99,
    status: "paid",
    downloadUrl: "#",
  },
  {
    id: "INV-2024-004",
    date: "2024-07-01",
    amount: 99,
    status: "paid",
    downloadUrl: "#",
  },
];

export const paymentMethod = {
  type: "card",
  last4: "4242",
  brand: "Visa",
  expiryMonth: 12,
  expiryYear: 2025,
};

