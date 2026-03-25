export type DbConnectionConfig = {
  databaseUrl: string;
  convexToken: string | null;
};

export const getDbConfig = (): DbConnectionConfig => {
  const rawConvexToken = process.env.CONVEX_TOKEN?.trim();

  return {
    databaseUrl: process.env.DATABASE_URL ?? "",
    convexToken: rawConvexToken && rawConvexToken.length > 0 ? rawConvexToken : null
  };
};

export const getRequiredConvexToken = (): string => {
  const token = process.env.CONVEX_TOKEN?.trim();
  if (!token) {
    throw new Error("Missing CONVEX_TOKEN. Set it in your local .env.local file.");
  }
  return token;
};
