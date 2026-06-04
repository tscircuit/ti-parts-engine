import JSZip from "jszip";

import { getKicadArchiveEntryKind } from "./getKicadArchiveEntryKind.ts";
import { getSafeArchivePath } from "./path-utils.ts";
import type { KicadArchiveBytes } from "./types.ts";

export type KicadLibraryFiles = {
  kicadModText: string;
  kicadSymbolLibText?: string;
};

export async function readFirstKicadLibraryFilesFromArchive(
  archiveBuffer: KicadArchiveBytes,
): Promise<KicadLibraryFiles> {
  const zipFile = await JSZip.loadAsync(archiveBuffer);

  let kicadModText: string | undefined;
  let kicadSymbolLibText: string | undefined;

  for (const zipEntry of Object.values(zipFile.files)) {
    if (zipEntry.dir) continue;

    const archivePath = getSafeArchivePath(zipEntry);
    const kind = getKicadArchiveEntryKind(archivePath);

    if (kind === "footprint" && !kicadModText) {
      kicadModText = await zipEntry.async("text");
    }

    if (kind === "symbol" && !kicadSymbolLibText) {
      kicadSymbolLibText = await zipEntry.async("text");
    }

    if (kicadModText && kicadSymbolLibText) break;
  }

  if (!kicadModText) {
    throw new Error("No .kicad_mod file found in KiCad archive.");
  }

  return {
    kicadModText,
    kicadSymbolLibText,
  };
}
