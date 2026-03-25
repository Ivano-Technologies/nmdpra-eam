export type DbConnectionConfig = {
  databaseUrl: string;
};

export const getDbConfig = (): DbConnectionConfig => {
  return {
    databaseUrl: process.env.DATABASE_URL ?? ""
  };
};
