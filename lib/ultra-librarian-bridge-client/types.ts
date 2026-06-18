export const DEFAULT_BASE_URL = "https://ti-api-cors-proxy.seve.workers.dev/";
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
  partnerToken?: string;
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
  uid?: string;
  mpn?: string;
  manufacturer?: string;
  manufacturer_part_number?: string;
  part_number?: string;
  gpn?: string;
  name?: string;
  description?: string;
  symbol_available?: boolean;
  footprint_available?: boolean;
  threed_available?: boolean;
  package?: string;
  pin_count?: number;
}

export interface SearchPartsResponse {
  rawPayload: JsonValue;
  results: SearchPartResult[];
}

export interface GetExportFormatsRequest {
  uid: string;
}

export interface ExportFormatResult extends JsonObject {
  id?: string;
  name?: string;
  cad_tool?: string;
  version?: string;
  file_type?: string;
  requires_symbol?: boolean;
  requires_footprint?: boolean;
  requires_threed?: boolean;
}

export interface GetExportFormatsResponse {
  rawPayload: JsonValue;
  uid?: string;
  formats: ExportFormatResult[];
}

export interface KicadExportRequest {
  mpn: string;
  version?: number;
}

export interface StepExportRequest {
  uid?: string;
  mpn?: string;
}

export type ArchiveBytes = ArrayBuffer | Uint8Array;

export interface DownloadKicadArchiveResponse {
  archiveBuffer: ArchiveBytes;
  contentType: string;
}

export interface DownloadStepArchiveResponse {
  archiveBuffer: ArchiveBytes;
  contentType: string;
}

export interface UltraLibrarianBridgeClient {
  readonly baseUrl: string;
  searchParts(request: SearchPartsRequest): Promise<SearchPartsResponse>;
  getExportFormats(
    request: GetExportFormatsRequest,
  ): Promise<GetExportFormatsResponse>;
  downloadKicadArchive(
    request: KicadExportRequest,
  ): Promise<DownloadKicadArchiveResponse>;
  downloadStepArchive(
    request: StepExportRequest,
  ): Promise<DownloadStepArchiveResponse>;
}
