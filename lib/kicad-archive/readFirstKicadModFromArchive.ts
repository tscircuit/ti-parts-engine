import JSZip from "jszip";
import { isAbsolute, normalize } from "node:path/posix";

import { getKicadArchiveEntryKind } from "./getKicadArchiveEntryKind";

type ZipEntryWithUnsafeOriginalName = JSZip.JSZipObject & {
  unsafeOriginalName?: string;
};

export async function readFirstKicadModFromArchive(
  archiveBuffer: Buffer,
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

function getSafeArchivePath(zipEntry: JSZip.JSZipObject) {
  const unsafeOriginalName = (zipEntry as ZipEntryWithUnsafeOriginalName)
    .unsafeOriginalName;

  if (unsafeOriginalName) {
    assertSafeArchivePath(unsafeOriginalName);
  }

  assertSafeArchivePath(zipEntry.name);
  return zipEntry.name;
}

function assertSafeArchivePath(archivePath: string) {
  const normalizedArchivePath = normalize(archivePath);

  if (
    archivePath.includes("\\") ||
    /^[a-zA-Z]:/.test(archivePath) ||
    isAbsolute(normalizedArchivePath) ||
    normalizedArchivePath === ".." ||
    normalizedArchivePath.startsWith("../")
  ) {
    throw new Error(`Unsafe KiCad archive path: ${archivePath}`);
  }
}
