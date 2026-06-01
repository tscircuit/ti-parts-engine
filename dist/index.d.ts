import { PartsEngine, PlatformConfig } from '@tscircuit/props';
import { T as TiPartsEngineOptions, S as SearchPartsParams, a as SearchPartsResponse, D as DownloadKicadArchiveParams, b as DownloadKicadArchiveResponse } from './footprint-library-7_mJOZfy.js';
export { c as DEFAULT_BASE_URL, d as DEFAULT_KICAD_VERSION, F as FindTiPartParams, e as TiPartsEngineSourceComponent, f as TiSupplierPartNumbers, g as createTiFootprintLibrary } from './footprint-library-7_mJOZfy.js';

type KicadArchiveBytes = ArrayBuffer | Uint8Array;
type KicadArchiveEntryKind = "symbol" | "footprint";
type KicadArchiveEntry = {
    path: string;
    fileName: string;
    kind: KicadArchiveEntryKind;
};
type KicadArchiveSummary = {
    entries: KicadArchiveEntry[];
    symbolEntries: KicadArchiveEntry[];
    footprintEntries: KicadArchiveEntry[];
    hasSymbols: boolean;
    hasFootprints: boolean;
};
type ExtractKicadArchiveFilesRequest = {
    archiveBuffer: KicadArchiveBytes;
    outputDirectory: string;
};
type ExtractedKicadArchiveFile = KicadArchiveEntry & {
    outputPath: string;
};
type ExtractKicadArchiveFilesResponse = KicadArchiveSummary & {
    extractedFiles: ExtractedKicadArchiveFile[];
};

declare function extractKicadArchiveFiles(request: ExtractKicadArchiveFilesRequest): Promise<ExtractKicadArchiveFilesResponse>;

declare function getKicadArchiveEntryKind(archivePath: string): KicadArchiveEntryKind | null;

declare function readKicadArchive(archiveBuffer: KicadArchiveBytes): Promise<KicadArchiveSummary>;

declare function readFirstKicadModFromArchive(archiveBuffer: KicadArchiveBytes): Promise<string>;

type FindPartParams = Parameters<PartsEngine["findPart"]>[0];
type FindPartResult = Awaited<ReturnType<PartsEngine["findPart"]>>;
declare class TiPartsEngine implements PartsEngine {
    private readonly options;
    constructor(options: TiPartsEngineOptions);
    findPart({ sourceComponent }: FindPartParams): Promise<FindPartResult>;
    searchParts(request: SearchPartsParams): Promise<SearchPartsResponse>;
    downloadKicadArchive(request: DownloadKicadArchiveParams): Promise<DownloadKicadArchiveResponse>;
    private createClient;
}

declare const createTiPlatformConfig: (options: TiPartsEngineOptions) => Pick<PlatformConfig, "partsEngine" | "footprintLibraryMap">;

declare const createTiPlatformPartsEngine: (options: TiPartsEngineOptions) => PartsEngine;

declare const createTiPartsEngine: (options: ConstructorParameters<typeof TiPartsEngine>[0]) => TiPartsEngine;

export { DownloadKicadArchiveParams, type ExtractKicadArchiveFilesRequest, type ExtractKicadArchiveFilesResponse, type ExtractedKicadArchiveFile, type KicadArchiveEntry, type KicadArchiveEntryKind, type KicadArchiveSummary, SearchPartsParams, TiPartsEngine, TiPartsEngineOptions, createTiPartsEngine, createTiPlatformConfig, createTiPlatformPartsEngine, extractKicadArchiveFiles, getKicadArchiveEntryKind, readFirstKicadModFromArchive, readKicadArchive };
