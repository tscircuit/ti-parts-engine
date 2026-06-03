import JSZip from "jszip";

import { getKicadArchiveEntryKind } from "./getKicadArchiveEntryKind.ts";
import type { KicadArchiveBytes } from "./types.ts";

type ZipEntryWithUnsafeOriginalName = JSZip.JSZipObject & {
  unsafeOriginalName?: string;
};

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
  if (
    archivePath.includes("\\") ||
    /^[a-zA-Z]:/.test(archivePath) ||
    archivePath.startsWith("/")
  ) {
    throw new Error(`Unsafe KiCad archive path: ${archivePath}`);
  }

  const normalizedArchiveSegments = archivePath
    .split("/")
    .filter((segment) => segment.length > 0 && segment !== ".");

  if (
    normalizedArchiveSegments.some((segment) => segment === "..") ||
    archivePath.endsWith("/..")
  ) {
    throw new Error(`Unsafe KiCad archive path: ${archivePath}`);
  }
}
