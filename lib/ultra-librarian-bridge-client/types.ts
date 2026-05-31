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

export type ArchiveBytes = ArrayBuffer | Uint8Array;

export interface DownloadKicadArchiveResponse {
  archiveBuffer: ArchiveBytes;
  contentType: string;
}

export interface UltraLibrarianBridgeClient {
  readonly baseUrl: string;
  searchParts(request: SearchPartsRequest): Promise<SearchPartsResponse>;
  downloadKicadArchive(
    request: KicadExportRequest,
  ): Promise<DownloadKicadArchiveResponse>;
}
