import type { ConsoleMessage, Page, Response } from "@playwright/test";

/**
 * Collect console errors and localhost /api failed HTTP responses for assertion at end of test.
 */
export function createPageStrictCollector(page: Page): {
  errors: string[];
  dispose: () => void;
} {
  const errors: string[] = [];

  const consoleHandler = (msg: ConsoleMessage) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (
        /favicon|ResizeObserver|hydration|Failed to load resource.*404/i.test(
          text
        )
      ) {
        return;
      }
      errors.push(`console: ${text}`);
    }
  };

  const pageErrorHandler = (err: Error) => {
    errors.push(`pageerror: ${err.message}`);
  };

  const responseHandler = (res: Response) => {
    const status = res.status();
    if (status < 400) {
      return;
    }
    const url = res.url();
    try {
      const u = new URL(url);
      if (u.hostname !== "localhost" && u.hostname !== "127.0.0.1") {
        return;
      }
      if (u.pathname.startsWith("/api/")) {
        errors.push(`HTTP ${status} ${url}`);
      }
    } catch {
      /* ignore */
    }
  };

  page.on("console", consoleHandler);
  page.on("pageerror", pageErrorHandler);
  page.on("response", responseHandler);

  return {
    errors,
    dispose: () => {
      page.off("console", consoleHandler);
      page.off("pageerror", pageErrorHandler);
      page.off("response", responseHandler);
    }
  };
}

export function assertStrictClean(errors: string[]): void {
  const filtered = errors.filter(
    (e) => !e.includes("clerk") && !e.includes("Clerk")
  );
  if (filtered.length > 0) {
    throw new Error(`Strict harness:\n${filtered.slice(0, 15).join("\n")}`);
  }
}
