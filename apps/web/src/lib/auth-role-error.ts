/** Server/client-safe — no Clerk imports (used from client-safe modules like `tenant.ts`). */
export class AuthRoleError extends Error {
  constructor(
    message: string,
    public readonly status: 401 | 403
  ) {
    super(message);
    this.name = "AuthRoleError";
  }
}
