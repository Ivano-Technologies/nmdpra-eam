import { existsSync } from "fs";
import { join } from "path";

/** Resolves static `public/` when running from `src/` (tsx) or `dist/` (node). */
export const resolvePublicDir = (): string => {
  const distPublic = join(__dirname, "public");
  if (existsSync(distPublic)) {
    return distPublic;
  }
  return join(__dirname, "..", "public");
};
