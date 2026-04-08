import { Resend } from "resend";

/** When set, Resend HTTP is not called; payloads are recorded for E2E assertions. */
export function isMockResendEnabled(): boolean {
  return (
    process.env.MOCK_RESEND === "1" || process.env.E2E_MAIL_MOCK === "1"
  );
}

export type MockResendPayload = {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{ filename?: string; content?: unknown }>;
};

let lastPayload: MockResendPayload | null = null;
const history: MockResendPayload[] = [];

export function getLastMockResendPayload(): MockResendPayload | null {
  return lastPayload;
}

export function getMockResendHistory(): MockResendPayload[] {
  return [...history];
}

export function clearMockResendHistory(): void {
  lastPayload = null;
  history.length = 0;
}

function recordPayload(payload: MockResendPayload): void {
  lastPayload = payload;
  history.push(payload);
  if (history.length > 40) {
    history.shift();
  }
}

function createMockResend(): Resend {
  const send = async (raw: Record<string, unknown>) => {
    const payload: MockResendPayload = {
      from: String(raw.from ?? ""),
      to: raw.to as string | string[],
      subject: String(raw.subject ?? ""),
      html: raw.html as string | undefined,
      text: raw.text as string | undefined,
      attachments: raw.attachments as MockResendPayload["attachments"]
    };
    recordPayload(payload);
    return { data: { id: "mock-resend-id" }, error: null };
  };
  return { emails: { send } } as unknown as Resend;
}

let cachedClient: Resend | null = null;

/**
 * Singleton Resend client — real API or mock (captures payloads).
 */
export function getResendClient(): Resend {
  if (cachedClient) {
    return cachedClient;
  }
  if (isMockResendEnabled()) {
    cachedClient = createMockResend();
    return cachedClient;
  }
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    throw new Error("RESEND_API_KEY is not set");
  }
  cachedClient = new Resend(key);
  return cachedClient;
}

export function getResendFromEmail(): string {
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (isMockResendEnabled()) {
    return from || "mock@notifications.ivano-iq.local";
  }
  if (!from) {
    throw new Error("RESEND_FROM_EMAIL is not set");
  }
  return from;
}

/** True when real keys exist, or mock mode is on (dev/E2E without secrets). */
export function isResendConfigured(): boolean {
  if (isMockResendEnabled()) {
    return true;
  }
  return Boolean(
    process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM_EMAIL?.trim()
  );
}
