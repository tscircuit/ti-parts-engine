export const DEFAULT_BASE_URL =
  "https://situations-build-tommy-integrate.trycloudflare.com";
export const DEFAULT_KICAD_VERSION = 6;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue | undefined };
export type BridgeFetch = (
  input: string | URL,
  init?: RequestInit,
) => Promise<Response>;

export interface BridgeLogger {
  log(message: string): void;
}

export interface UltraLibrarianBridgeClientOptions {
  partnerToken: string;
  baseUrl?: string;
  fetch?: BridgeFetch;
  logger?: BridgeLogger;
}

export interface SearchPartsRequest {
  query: string;
  exactOnly?: boolean;
  limit?: number;
}

export interface SearchPartResult extends JsonObject {
  mpn?: string;
  manufacturer_part_number?: string;
  part_number?: string;
  gpn?: string;
  name?: string;
}

export interface SearchPartsResponse {
  rawPayload: JsonValue;
  results: SearchPartResult[];
}

export interface KicadExportRequest {
  mpn: string;
  version?: number;
}

export interface DownloadKicadArchiveResponse {
  archiveBuffer: Buffer;
  contentType: string;
}

export interface UltraLibrarianBridgeClient {
  readonly baseUrl: string;
  searchParts(request: SearchPartsRequest): Promise<SearchPartsResponse>;
  downloadKicadArchive(
    request: KicadExportRequest,
  ): Promise<DownloadKicadArchiveResponse>;
}

export function createUltraLibrarianBridgeClient(
  options: UltraLibrarianBridgeClientOptions,
): UltraLibrarianBridgeClient {
  const partnerToken = requireNonEmptyString(
    "partnerToken",
    options.partnerToken,
  );
  const baseUrl = normalizeBaseUrl(options.baseUrl ?? DEFAULT_BASE_URL);
  const fetchImpl = options.fetch ?? fetch;
  const logger = options.logger;

  return {
    baseUrl,
    async searchParts(request) {
      const path = buildSearchPath(request);
      const rawPayload = await requestJson({
        fetchImpl,
        baseUrl,
        path,
        partnerToken,
        logger,
      });

      return {
        rawPayload,
        results: extractSearchResults(rawPayload),
      };
    },
    async downloadKicadArchive(request) {
      const path = buildKicadExportPath(request);
      return await requestArchive({
        fetchImpl,
        baseUrl,
        path,
        partnerToken,
        logger,
      });
    },
  };
}

export function buildSearchPath(request: SearchPartsRequest) {
  const query = requireNonEmptyString("query", request.query);
  const exactOnly = request.exactOnly ?? true;
  const limit = request.limit ?? 1;
  assertPositiveInteger("limit", limit);

  const params = new URLSearchParams({
    q: query,
    exact_only: String(exactOnly),
    limit: String(limit),
  });

  return `/v1/parts/search?${params.toString()}`;
}

export function buildKicadExportPath(request: KicadExportRequest) {
  const mpn = requireNonEmptyString("mpn", request.mpn);
  const version = request.version ?? DEFAULT_KICAD_VERSION;
  assertPositiveInteger("version", version);

  const params = new URLSearchParams({
    mpn,
    version: String(version),
  });

  return `/v1/export/kicad?${params.toString()}`;
}

export function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

export function createBridgeHeaders(partnerToken: string, accept: string) {
  return {
    Authorization: `Bearer ${partnerToken}`,
    Accept: accept,
  };
}

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

export async function requestArchive(options: {
  fetchImpl: BridgeFetch;
  baseUrl: string;
  path: string;
  partnerToken: string;
  logger?: BridgeLogger;
}) {
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
    archiveBuffer: Buffer.from(await response.arrayBuffer()),
    contentType,
  };
}

export async function readErrorBody(response: Response) {
  const bodyText = (await response.text()).trim();
  return bodyText.length > 0 ? bodyText : "<empty response body>";
}

export function extractSearchResults(payload: JsonValue) {
  if (Array.isArray(payload)) {
    return payload.filter(isSearchPartResult);
  }

  if (!isJsonObject(payload)) {
    return [];
  }

  for (const key of ["results", "items", "parts", "data"]) {
    const value = payload[key];
    if (Array.isArray(value)) {
      return value.filter(isSearchPartResult);
    }
  }

  return [];
}

export function describeSearchResult(result: SearchPartResult) {
  for (const key of [
    "mpn",
    "manufacturer_part_number",
    "part_number",
    "gpn",
    "name",
  ]) {
    const value = result[key];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }

  return "result present but no recognized identifier field";
}

export function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isSearchPartResult(
  value: JsonValue,
): value is SearchPartResult {
  return isJsonObject(value);
}

function buildRequestUrl(baseUrl: string, path: string) {
  return `${normalizeBaseUrl(baseUrl)}${path}`;
}

function logRequest(logger: BridgeLogger | undefined, url: string) {
  if (!logger) {
    return;
  }

  const requestUrl = new URL(url);
  logger.log(`GET ${requestUrl.pathname}${requestUrl.search}`);
}

function requireNonEmptyString(name: string, value: string) {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    throw new Error(`${name} is required.`);
  }

  return trimmedValue;
}

function assertPositiveInteger(name: string, value: number) {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer.`);
  }
}

function asJsonValue(value: unknown): JsonValue {
  return value as JsonValue;
}
