import type { Resend } from "resend";

import {
  clearMockResendHistory,
  EmailSchema,
  getMockEmailsByTestRunId,
  getLastMockResendPayload,
  getMockResendHistory,
  getResendClient,
  getResendFromEmail,
  isMockResendEnabled,
  isResendConfigured,
  resolveTestRunId,
  runWithTestRunId,
  sendValidatedEmail,
  validateEmailPayload
} from "@rmlis/resend-client";

export {
  clearMockResendHistory,
  EmailSchema,
  getMockEmailsByTestRunId,
  getLastMockResendPayload,
  getMockResendHistory,
  getResendClient,
  getResendFromEmail,
  isMockResendEnabled,
  isResendConfigured,
  resolveTestRunId,
  runWithTestRunId,
  sendValidatedEmail,
  validateEmailPayload
};

/** @deprecated Prefer {@link getResendClient} — alias for existing imports. */
export function getResend(): Resend {
  return getResendClient();
}
