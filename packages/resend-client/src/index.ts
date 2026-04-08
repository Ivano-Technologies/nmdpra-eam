import { AsyncLocalStorage } from "node:async_hooks";

import { Resend } from "resend";
import { z } from "zod";

export type EmailPayload = {
  to: string[];
  subject: string;
  html: string;
};

export const EmailSchema = z.object({
  to: z.array(z.string().email()),
  subject: z.string().min(1),
  html: z.string().min(1)
});

const LEGACY_TEST_RUN_ID = "__legacy__";
const MAX_CAPTURED_EMAILS_PER_RUN = 100;

/** Next.js may load this package in multiple bundles (App vs Pages); share one Map via globalThis. */
const EMAIL_STORE_KEY = "__rmlis_resend_email_store__" as const;

function getEmailStore(): Map<string, EmailPayload[]> {
  const g = globalThis as typeof globalThis & {
    [EMAIL_STORE_KEY]?: Map<string, EmailPayload[]>;
  };
  if (!g[EMAIL_STORE_KEY]) {
    g[EMAIL_STORE_KEY] = new Map<string, EmailPayload[]>();
  }
  return g[EMAIL_STORE_KEY];
}

const testRunContext = new AsyncLocalStorage<string>();

let cachedClient: Resend | null = null;

function getEmailMode(): "mock" | "live" {
  const raw = process.env.EMAIL_MODE?.trim().toLowerCase();
  if (raw === "mock" || raw === "live") {
    return raw;
  }
  // Backward-compat alias support.
  if (process.env.MOCK_RESEND === "1" || process.env.E2E_MAIL_MOCK === "1") {
    return "mock";
  }
  if (process.env.NODE_ENV === "test") {
    return "mock";
  }
  return "live";
}

/** Backward-compatible helper retained for existing call sites. */
export function isMockResendEnabled(): boolean {
  return getEmailMode() === "mock";
}

export function resolveTestRunId(value?: string | null): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : LEGACY_TEST_RUN_ID;
}

export function runWithTestRunId<T>(
  testRunId: string | undefined,
  fn: () => Promise<T>
): Promise<T> {
  return testRunContext.run(resolveTestRunId(testRunId), fn);
}

function getCurrentTestRunId(): string {
  return resolveTestRunId(testRunContext.getStore());
}

function normalizeRecipients(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.map((v) => String(v));
  }
  return [];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toEmailPayload(raw: Record<string, unknown>): EmailPayload {
  const payload: EmailPayload = {
    to: normalizeRecipients(raw.to),
    subject: String(raw.subject ?? ""),
    html:
      typeof raw.html === "string" && raw.html.trim().length > 0
        ? raw.html
        : typeof raw.text === "string"
          ? `<p>${escapeHtml(raw.text)}</p>`
          : ""
  };
  return validateEmailPayload(payload);
}

export function validateEmailPayload(payload: EmailPayload): EmailPayload {
  const parsed = EmailSchema.safeParse(payload);
  if (parsed.success) {
    return parsed.data;
  }
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".") || "payload"}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid EmailPayload: ${details}`);
}

function appendEmail(payload: EmailPayload, testRunId?: string): void {
  const store = getEmailStore();
  const key = resolveTestRunId(testRunId ?? getCurrentTestRunId());
  const next = [...(store.get(key) ?? []), payload];
  if (next.length > MAX_CAPTURED_EMAILS_PER_RUN) {
    next.splice(0, next.length - MAX_CAPTURED_EMAILS_PER_RUN);
  }
  store.set(key, next);
}

export function getMockEmailsByTestRunId(testRunId?: string | null): EmailPayload[] {
  return [...(getEmailStore().get(resolveTestRunId(testRunId)) ?? [])];
}

/** Legacy helper preserved for compatibility. */
export function getLastMockResendPayload(): EmailPayload | null {
  const legacy = getMockEmailsByTestRunId(LEGACY_TEST_RUN_ID);
  return legacy.length > 0 ? legacy[legacy.length - 1] : null;
}

/** Legacy helper preserved for compatibility. */
export function getMockResendHistory(): EmailPayload[] {
  return [...getEmailStore().values()].flat();
}

export function clearMockResendHistory(): void {
  getEmailStore().clear();
}

function createMockResend(): Resend {
  const send = async (raw: Record<string, unknown>) => {
    return sendValidatedEmail(
      {
        from: String(raw.from ?? ""),
        to:
          typeof raw.to === "string" || Array.isArray(raw.to)
            ? (raw.to as string | string[])
            : "",
        subject: String(raw.subject ?? ""),
        html: typeof raw.html === "string" ? raw.html : undefined,
        text: typeof raw.text === "string" ? raw.text : undefined,
        attachments: raw.attachments as SendValidatedEmailInput["attachments"]
      },
      { testRunId: getCurrentTestRunId() }
    );
  };
  return { emails: { send } } as unknown as Resend;
}

export type SendValidatedEmailInput = {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{ filename?: string; content?: string | Buffer }>;
};

export async function sendValidatedEmail(
  input: SendValidatedEmailInput,
  options?: { testRunId?: string }
): Promise<{ data: { id: string | null } | null; error: { message: string } | null }> {
  const payload = toEmailPayload(input as Record<string, unknown>);
  const scopedTestRunId = options?.testRunId;
  const forceMockForScopedRun =
    typeof scopedTestRunId === "string" && scopedTestRunId.trim().length > 0;

  if (isMockResendEnabled() || forceMockForScopedRun) {
    const runId = resolveTestRunId(scopedTestRunId ?? getCurrentTestRunId());
    appendEmail(payload, runId);
    const runCount = getMockEmailsByTestRunId(runId).length;
    return { data: { id: `mock-${runId}-${runCount}` }, error: null };
  }

  const resend = getResendClient();
  const { data, error } = await resend.emails.send({
    from: input.from,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    attachments: input.attachments
  });

  if (error) {
    return { data: null, error: { message: error.message } };
  }
  return { data: { id: data?.id ?? null }, error: null };
}

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
