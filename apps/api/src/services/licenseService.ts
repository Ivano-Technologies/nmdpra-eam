type LicenseOverviewSnapshot = {
  message: string;
  generatedAt: string;
};

export const getOverviewSnapshot = async (): Promise<LicenseOverviewSnapshot> => {
  return {
    message: "License overview placeholder",
    generatedAt: new Date().toISOString()
  };
};
