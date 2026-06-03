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
  partnerToken: string;
  logger?: BridgeLogger;
}): Promise<DownloadKicadArchiveResponse> {
  const url = buildRequestUrl(options.baseUrl, options.path);
  logRequest(options.logger, url);

  const response = await options.fetchImpl(url, {
    headers: createBridgeHeaders(options.partnerToken, "application/zip"),
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(
      `KiCad export failed with ${response.status} ${response.statusText}: ${await readErrorBody(response)}`,
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
