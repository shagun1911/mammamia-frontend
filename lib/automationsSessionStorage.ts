import { Automation } from "@/data/mockAutomations";

const STORAGE_KEY = "automations:session";

export type AutomationsSessionState = {
  automationsDraft: Automation[];
  selectedAutomationId: string | null;
  selectedNodeId: string | null;
  dirty: boolean;
};

export function readAutomationsSession(): AutomationsSessionState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AutomationsSessionState;
  } catch {
    return null;
  }
}

export function writeAutomationsSession(state: AutomationsSessionState): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function mergeAutomationsWithDraft(
  serverAutomations: Automation[],
  session: AutomationsSessionState | null
): Automation[] {
  if (!session?.dirty) return serverAutomations;
  return session.automationsDraft.length > 0 ? session.automationsDraft : serverAutomations;
}
