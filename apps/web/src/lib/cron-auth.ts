/**
 * Vercel Cron should send: Authorization: Bearer ${CRON_SECRET}
 * @see https://vercel.com/docs/cron-jobs
 */
export function verifyCronRequest(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return false;
  }
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}
