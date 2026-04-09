/**
 * Optional public API base (no trailing slash), for legacy absolute URLs.
 * Prefer relative `/api/...` paths; leave unset so this returns "".
 */
export function getPublicApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ?? "";
  return raw.replace(/\/$/, "");
}
