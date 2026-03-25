export type WorkerEnvConfig = {
  databaseUrl: string;
  resendApiKey: string | null;
  fcmServerKey: string | null;
  convexToken: string | null;
};

const normalizeOptional = (value: string | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
};

export const getWorkerEnvConfig = (): WorkerEnvConfig => {
  return {
    databaseUrl: process.env.DATABASE_URL ?? "",
    resendApiKey: normalizeOptional(process.env.RESEND_API_KEY),
    fcmServerKey: normalizeOptional(process.env.FCM_SERVER_KEY),
    convexToken: normalizeOptional(process.env.CONVEX_TOKEN)
  };
};

export const getRequiredConvexToken = (): string => {
  const token = normalizeOptional(process.env.CONVEX_TOKEN);
  if (!token) {
    throw new Error("Missing CONVEX_TOKEN. Set it in your local .env.local file.");
  }
  return token;
};
