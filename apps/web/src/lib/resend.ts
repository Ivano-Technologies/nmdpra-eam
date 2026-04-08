import type { Resend } from "resend";

import {
  clearMockResendHistory,
  getLastMockResendPayload,
  getMockResendHistory,
  getResendClient,
  getResendFromEmail,
  isMockResendEnabled,
  isResendConfigured
} from "@rmlis/resend-client";

export {
  clearMockResendHistory,
  getLastMockResendPayload,
  getMockResendHistory,
  getResendClient,
  getResendFromEmail,
  isMockResendEnabled,
  isResendConfigured
};

/** @deprecated Prefer {@link getResendClient} — alias for existing imports. */
export function getResend(): Resend {
  return getResendClient();
}
