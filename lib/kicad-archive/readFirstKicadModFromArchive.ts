import JSZip from "jszip";

import { getKicadArchiveEntryKind } from "./getKicadArchiveEntryKind.ts";
import { getSafeArchivePath } from "./path-utils.ts";
import type { KicadArchiveBytes } from "./types.ts";

export async function readFirstKicadModFromArchive(
  archiveBuffer: KicadArchiveBytes,
): Promise<string> {
  const zipFile = await JSZip.loadAsync(archiveBuffer);

  for (const zipEntry of Object.values(zipFile.files)) {
    if (zipEntry.dir) continue;

    const archivePath = getSafeArchivePath(zipEntry);
    if (getKicadArchiveEntryKind(archivePath) !== "footprint") continue;

    return await zipEntry.async("text");
  }

  throw new Error("No .kicad_mod file found in KiCad archive.");
}
