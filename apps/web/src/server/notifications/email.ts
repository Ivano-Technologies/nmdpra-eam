import { getResend, getResendFromEmail } from "@/lib/resend";

export type SendWeeklyEmailArgs = {
  to: string;
  subject?: string;
  html: string;
};

export async function sendWeeklyEmail({
  to,
  subject = "Your weekly compliance summary",
  html
}: SendWeeklyEmailArgs): Promise<{ id?: string }> {
  const resend = getResend();
  const from = getResendFromEmail();
  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    html
  });
  if (error) {
    throw new Error(typeof error === "string" ? error : JSON.stringify(error));
  }
  return { id: data?.id };
}
