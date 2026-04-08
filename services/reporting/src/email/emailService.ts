import { getResendFromEmail, sendValidatedEmail } from "@rmlis/resend-client";

export type SendReportPdfParams = {
  to: string;
  pdf: Buffer;
  subject?: string;
  filename?: string;
};

export const sendReportPdf = async (params: SendReportPdfParams): Promise<{ id: string | null }> => {
  const from = getResendFromEmail();
  if (!process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_MODE !== "mock") {
    throw new Error("RESEND_API_KEY is required unless EMAIL_MODE=mock");
  }

  const { data, error } = await sendValidatedEmail({
    from,
    to: params.to,
    subject: params.subject ?? "NMDPRA license compliance report",
    html: "<p>Attached: NMDPRA licence compliance report (PDF).</p>",
    attachments: [
      {
        filename: params.filename ?? "nmdpra-license-report.pdf",
        content: params.pdf
      }
    ]
  });

  if (error) {
    throw new Error(error.message);
  }

  return { id: data?.id ?? null };
};
