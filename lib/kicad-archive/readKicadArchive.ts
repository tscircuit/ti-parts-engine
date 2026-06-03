import JSZip from "jszip";
import { basename } from "path";

import { createKicadArchiveSummary } from "./createKicadArchiveSummary.ts";
import { getKicadArchiveEntryKind } from "./getKicadArchiveEntryKind.ts";
import type {
  KicadArchiveBytes,
  KicadArchiveEntry,
  KicadArchiveSummary,
} from "./types.ts";

export async function readKicadArchive(
  archiveBuffer: KicadArchiveBytes,
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
