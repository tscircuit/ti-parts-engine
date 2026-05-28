import type {
  BridgeFetch,
  BridgeLogger,
  KicadExportRequest,
  SearchPartsRequest,
} from "../ultra-librarian-bridge-client";

export interface TiPartsEngineOptions {
  partnerToken: string;
  baseUrl?: string;
  fetch?: BridgeFetch;
  logger?: BridgeLogger;
}

export interface SearchPartsParams extends SearchPartsRequest {}

export interface DownloadKicadArchiveParams extends KicadExportRequest {}
