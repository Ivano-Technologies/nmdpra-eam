import { getResendFromEmail, sendValidatedEmail } from "@/lib/resend";

export type SendWeeklyEmailArgs = {
  to: string;
  subject?: string;
  html: string;
};

export async function sendWeeklyEmail({
  to,
  subject = "Your weekly compliance summary",
  html
}: SendWeeklyEmailArgs): Promise<{ id: string | null }> {
  const from = getResendFromEmail();
  const { data, error } = await sendValidatedEmail({
    from,
    to,
    subject,
    html
  });
  if (error) {
    throw new Error(typeof error === "string" ? error : JSON.stringify(error));
  }
  return { id: data?.id ?? null };
}
