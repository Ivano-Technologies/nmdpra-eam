/**
 * Public REST API base (no trailing slash). Example: https://eam.techivano.com/api
 */
export function getPublicApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ?? "";
  const base = raw.replace(/\/$/, "");
  if (!base) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL is not set (e.g. https://eam.techivano.com/api)"
    );
  }
  return base;
}
