import { del, list } from "@vercel/blob";

/**
 * Deletes all blobs under `uploads/{orgId}/` (matches upload route pathname prefix).
 * Returns count deleted, or 0 if blob token is missing.
 */
export async function deleteBlobsForOrgPrefix(orgId: string): Promise<number> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    return 0;
  }
  const prefix = `uploads/${orgId}/`;
  let deleted = 0;
  let cursor: string | undefined;
  for (;;) {
    const res = await list({
      prefix,
      token,
      limit: 100,
      ...(cursor !== undefined ? { cursor } : {})
    });
    if (res.blobs.length > 0) {
      await del(
        res.blobs.map((b) => b.url),
        { token }
      );
      deleted += res.blobs.length;
    }
    if (!res.hasMore) {
      break;
    }
    cursor = res.cursor;
  }
  return deleted;
}
