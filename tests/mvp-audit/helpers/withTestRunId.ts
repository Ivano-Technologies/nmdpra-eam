import {
  request as playwrightRequest,
  type APIRequestContext,
  type TestInfo
} from "@playwright/test";

export async function withTestRunId(
  request: APIRequestContext,
  testInfo: TestInfo
): Promise<APIRequestContext> {
  const storageState = await request.storageState();
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
  return playwrightRequest.newContext({
    baseURL,
    storageState,
    extraHTTPHeaders: {
      "x-test-run-id": testInfo.testId
    }
  });
}
