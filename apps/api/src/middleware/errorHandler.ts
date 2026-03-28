import type { NextFunction, Request, Response } from "express";

/**
 * Last-resort JSON error handler. Avoids leaking stack traces unless EXPOSE_ERROR_DETAILS=1.
 */
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (res.headersSent) {
    return;
  }
  const expose = process.env.EXPOSE_ERROR_DETAILS === "1";
  const status =
    typeof (err as { status?: number }).status === "number"
      ? (err as { status: number }).status
      : 500;
  const raw =
    err instanceof Error ? err.message : typeof err === "string" ? err : "Internal server error";

  const body: { error: string; code: string; details?: string } = {
    error: status >= 500 ? "Internal server error" : raw,
    code: status >= 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR"
  };
  if (status < 500) {
    body.error = raw;
  }
  if (expose && err instanceof Error && err.stack) {
    body.details = err.stack;
  }
  res.status(status).json(body);
};
