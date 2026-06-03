import type {
  BridgeFetch,
  BridgeLogger,
  KicadExportRequest,
  SearchPartsRequest,
} from "../ultra-librarian-bridge-client/index.ts";

export interface TiPartsEngineOptions {
  partnerToken: string;
  baseUrl?: string;
  fetch?: BridgeFetch;
  logger?: BridgeLogger;
}

export interface SearchPartsParams extends SearchPartsRequest {}

export interface DownloadKicadArchiveParams extends KicadExportRequest {}

export interface TiPartsEngineSourceComponent {
  manufacturer_part_number?: string;
  name?: string;
}

export interface FindTiPartParams {
  sourceComponent: TiPartsEngineSourceComponent;
  footprinterString?: string;
}

export type TiSupplierPartNumbers = Record<string, string[]>;
