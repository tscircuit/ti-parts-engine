import JSZip from "jszip";
import { basename } from "node:path/posix";

import { createKicadArchiveSummary } from "./createKicadArchiveSummary";
import { getKicadArchiveEntryKind } from "./getKicadArchiveEntryKind";
import type { KicadArchiveEntry, KicadArchiveSummary } from "./types";

export async function readKicadArchive(
  archiveBuffer: Buffer,
): Promise<KicadArchiveSummary> {
  const zipFile = await JSZip.loadAsync(archiveBuffer);
  const entries = Object.values(zipFile.files)
    .filter((zipEntry) => !zipEntry.dir)
    .flatMap((zipEntry): KicadArchiveEntry[] => {
      const kind = getKicadArchiveEntryKind(zipEntry.name);
      if (!kind) return [];

      return [
        {
          path: zipEntry.name,
          fileName: basename(zipEntry.name),
          kind,
        },
      ];
    })
    .sort((leftEntry, rightEntry) =>
      leftEntry.path.localeCompare(rightEntry.path),
    );

  return createKicadArchiveSummary(entries);
}
