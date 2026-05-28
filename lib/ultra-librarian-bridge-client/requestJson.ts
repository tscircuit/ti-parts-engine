import type { BridgeFetch, BridgeLogger, JsonValue } from "./types";
import { normalizeBaseUrl } from "./normalizeBaseUrl";

export async function requestJson(options: {
  fetchImpl: BridgeFetch;
  baseUrl: string;
  path: string;
  partnerToken: string;
  logger?: BridgeLogger;
}): Promise<JsonValue> {
  const url = buildRequestUrl(options.baseUrl, options.path);
  logRequest(options.logger, url);

  const response = await options.fetchImpl(url, {
    headers: createBridgeHeaders(options.partnerToken, "application/json"),
  });

  if (!response.ok) {
    throw new Error(
      `Search request failed with ${response.status} ${response.statusText}: ${await readErrorBody(response)}`,
    );
  }

  return asJsonValue(await response.json());
}

function createBridgeHeaders(partnerToken: string, accept: string) {
  return {
    Authorization: `Bearer ${partnerToken}`,
    Accept: accept,
  };
}

function buildRequestUrl(baseUrl: string, path: string) {
  return `${normalizeBaseUrl(baseUrl)}${path}`;
}

function logRequest(logger: BridgeLogger | undefined, url: string) {
  if (!logger) return;
  const requestUrl = new URL(url);
  logger.log(`GET ${requestUrl.pathname}${requestUrl.search}`);
}

async function readErrorBody(response: Response) {
  const bodyText = (await response.text()).trim();
  return bodyText.length > 0 ? bodyText : "<empty response body>";
}

function asJsonValue(value: unknown): JsonValue {
  return value as JsonValue;
}
