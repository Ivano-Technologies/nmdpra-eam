import { Resend } from "resend";

export type SendReportPdfParams = {
  to: string;
  pdf: Buffer;
  subject?: string;
  filename?: string;
};

export const sendReportPdf = async (params: SendReportPdfParams): Promise<{ id: string | null }> => {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!apiKey || !from) {
    throw new Error("RESEND_API_KEY and RESEND_FROM_EMAIL are required to send email");
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to: params.to,
    subject: params.subject ?? "NMDPRA license compliance report",
    text: "Attached: NMDPRA licence compliance report (PDF).",
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
