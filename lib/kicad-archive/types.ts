export type KicadArchiveEntryKind = "symbol" | "footprint";

export type KicadArchiveEntry = {
  path: string;
  fileName: string;
  kind: KicadArchiveEntryKind;
};

export type KicadArchiveSummary = {
  entries: KicadArchiveEntry[];
  symbolEntries: KicadArchiveEntry[];
  footprintEntries: KicadArchiveEntry[];
  hasSymbols: boolean;
  hasFootprints: boolean;
};

export type ExtractKicadArchiveFilesRequest = {
  archiveBuffer: Buffer;
  outputDirectory: string;
};

export type ExtractedKicadArchiveFile = KicadArchiveEntry & {
  outputPath: string;
};

export type ExtractKicadArchiveFilesResponse = KicadArchiveSummary & {
  extractedFiles: ExtractedKicadArchiveFile[];
};
