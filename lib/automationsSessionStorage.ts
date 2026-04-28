import type { Automation } from "@/data/mockAutomations";

const STORAGE_KEY = "aistein-automations-session";
const CURRENT_VERSION = 1 as const;

export type AutomationsSessionPayload = {
  version: typeof CURRENT_VERSION;
  automations: Automation[];
  selectedAutomationId: string | null;
  selectedNodeId: string | null;
  /** True when graph edits may not be saved to the server yet */
  dirty: boolean;
  updatedAt: number;
};

function safeParse(raw: string | null): AutomationsSessionPayload | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AutomationsSessionPayload;
    if (parsed.version !== CURRENT_VERSION || !Array.isArray(parsed.automations)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function readAutomationsSession(): AutomationsSessionPayload | null {
  if (typeof window === "undefined") return null;
  return safeParse(sessionStorage.getItem(STORAGE_KEY));
}

export function writeAutomationsSession(payload: AutomationsSessionPayload): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Quota or private mode — ignore
  }
}

export function clearAutomationsSession(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Merge server list with a draft from session: for each automation that exists on the server,
 * prefer the draft copy when present (same id). Draft-only entries are dropped if missing from API.
 */
export function mergeAutomationsWithDraft(
  fromApi: Automation[],
  draft: Automation[] | undefined
): Automation[] {
  if (!draft?.length) return fromApi;
  const draftById = new Map(draft.map((a) => [a.id, a]));
  return fromApi.map((a) => draftById.get(a.id) ?? a);
}
