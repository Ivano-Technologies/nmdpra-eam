import { Resend } from "resend";

let client: Resend | null = null;

export function getResend(): Resend {
  if (client) {
    return client;
  }
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    throw new Error("RESEND_API_KEY is not set");
  }
  client = new Resend(key);
  return client;
}

export function getResendFromEmail(): string {
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!from) {
    throw new Error("RESEND_FROM_EMAIL is not set");
  }
  return from;
}
