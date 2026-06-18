import type {
  BridgeFetch,
  BridgeLogger,
  DownloadKicadArchiveResponse,
} from "./types.ts";
import { normalizeBaseUrl } from "./normalizeBaseUrl.ts";

export async function requestArchive(options: {
  fetchImpl: BridgeFetch;
  baseUrl: string;
  path: string;
  partnerToken?: string;
  logger?: BridgeLogger;
  method?: "GET" | "POST";
  body?: BodyInit;
  requestContentType?: string;
  errorLabel?: string;
}): Promise<DownloadKicadArchiveResponse> {
  const url = buildRequestUrl(options.baseUrl, options.path);
  const method = options.method ?? "GET";
  logRequest(options.logger, method, url);

  const response = await options.fetchImpl(url, {
    method,
    body: options.body,
    headers: createBridgeHeaders(
      options.partnerToken,
      "application/zip",
      options.requestContentType,
    ),
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(
      `${options.errorLabel ?? "KiCad export"} failed with ${response.status} ${response.statusText}: ${await readErrorBody(response)}`,
    );
  }

  const contentType = response.headers.get("content-type") ?? "unknown";

  if (
    !contentType.includes("application/zip") &&
    !contentType.includes("application/octet-stream")
  ) {
    throw new Error(`Expected application/zip but received ${contentType}.`);
  }

  return {
    archiveBuffer: await response.arrayBuffer(),
    contentType,
  };
}

function createBridgeHeaders(
  partnerToken: string | undefined,
  accept: string,
  requestContentType?: string,
) {
  const headers: Record<string, string> = {
    Accept: accept,
  };

  if (partnerToken) {
    headers.Authorization = `Bearer ${partnerToken}`;
  }

  if (requestContentType) {
    headers["Content-Type"] = requestContentType;
  }

  return headers;
}

function buildRequestUrl(baseUrl: string, path: string) {
  return `${normalizeBaseUrl(baseUrl)}${path}`;
}

function logRequest(
  logger: BridgeLogger | undefined,
  method: string,
  url: string,
) {
  if (!logger) return;
  const requestUrl = new URL(url);
  logger.log(`${method} ${requestUrl.pathname}${requestUrl.search}`);
}

async function readErrorBody(response: Response) {
  const bodyText = (await response.text()).trim();
  return bodyText.length > 0 ? bodyText : "<empty response body>";
}
