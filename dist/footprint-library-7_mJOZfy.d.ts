import { FootprintLibraryResult } from '@tscircuit/props';

declare const DEFAULT_BASE_URL = "https://situations-build-tommy-integrate.trycloudflare.com";
declare const DEFAULT_KICAD_VERSION = 6;
type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
type JsonObject = {
    [key: string]: JsonValue | undefined;
};
type BridgeFetch = (input: string | URL, init?: RequestInit) => Promise<Response>;
interface BridgeLogger {
    log(message: string): void;
}
interface SearchPartsRequest {
    query: string;
    exactOnly?: boolean;
    limit?: number;
}
interface SearchPartResult extends JsonObject {
    mpn?: string;
    manufacturer_part_number?: string;
    part_number?: string;
    gpn?: string;
    name?: string;
}
interface SearchPartsResponse {
    rawPayload: JsonValue;
    results: SearchPartResult[];
}
interface KicadExportRequest {
    mpn: string;
    version?: number;
}
type ArchiveBytes = ArrayBuffer | Uint8Array;
interface DownloadKicadArchiveResponse {
    archiveBuffer: ArchiveBytes;
    contentType: string;
}

interface TiPartsEngineOptions {
    partnerToken: string;
    baseUrl?: string;
    fetch?: BridgeFetch;
    logger?: BridgeLogger;
}
interface SearchPartsParams extends SearchPartsRequest {
}
interface DownloadKicadArchiveParams extends KicadExportRequest {
}
interface TiPartsEngineSourceComponent {
    manufacturer_part_number?: string;
    name?: string;
}
interface FindTiPartParams {
    sourceComponent: TiPartsEngineSourceComponent;
    footprinterString?: string;
}
type TiSupplierPartNumbers = Record<string, string[]>;

type TiFootprintLoader = (mpn: string) => Promise<FootprintLibraryResult>;
type TiFootprintLibraryMap = {
    ti: TiFootprintLoader;
};
declare const createTiFootprintLibrary: (options: TiPartsEngineOptions) => TiFootprintLibraryMap;

export { type DownloadKicadArchiveParams as D, type FindTiPartParams as F, type SearchPartsParams as S, type TiPartsEngineOptions as T, type SearchPartsResponse as a, type DownloadKicadArchiveResponse as b, DEFAULT_BASE_URL as c, DEFAULT_KICAD_VERSION as d, type TiPartsEngineSourceComponent as e, type TiSupplierPartNumbers as f, createTiFootprintLibrary as g };
