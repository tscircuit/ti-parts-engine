import JSZip from "jszip";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { basename, isAbsolute, normalize } from "node:path/posix";

import { createKicadArchiveSummary } from "./createKicadArchiveSummary.ts";
import { getKicadArchiveEntryKind } from "./getKicadArchiveEntryKind.ts";
import type {
  ExtractKicadArchiveFilesRequest,
  ExtractKicadArchiveFilesResponse,
  ExtractedKicadArchiveFile,
  KicadArchiveEntry,
} from "./types.ts";

type ZipEntryWithUnsafeOriginalName = JSZip.JSZipObject & {
  unsafeOriginalName?: string;
};

export async function extractKicadArchiveFiles(
  request: ExtractKicadArchiveFilesRequest,
): Promise<ExtractKicadArchiveFilesResponse> {
  const zipFile = await JSZip.loadAsync(request.archiveBuffer);
  const outputDirectory = resolve(request.outputDirectory);
  const entries: KicadArchiveEntry[] = [];
  const extractedFiles: ExtractedKicadArchiveFile[] = [];

  for (const zipEntry of Object.values(zipFile.files)) {
    if (zipEntry.dir) continue;

    const kind = getKicadArchiveEntryKind(zipEntry.name);
    if (!kind) continue;

    const archivePath = getSafeArchivePath(zipEntry);
    const outputPath = getSafeOutputPath(outputDirectory, archivePath);
    const entry = {
      path: archivePath,
      fileName: basename(archivePath),
      kind,
    };

    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(
      outputPath,
      Buffer.from(await zipEntry.async("uint8array")),
    );

    entries.push(entry);
    extractedFiles.push({ ...entry, outputPath });
  }

  const summary = createKicadArchiveSummary(
    entries.sort((leftEntry, rightEntry) =>
      leftEntry.path.localeCompare(rightEntry.path),
    ),
  );

  return {
    ...summary,
    extractedFiles: extractedFiles.sort((leftFile, rightFile) =>
      leftFile.path.localeCompare(rightFile.path),
    ),
  };
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

function getSafeOutputPath(outputDirectory: string, archivePath: string) {
  const normalizedArchivePath = normalize(archivePath);

  assertSafeArchivePath(archivePath);

  const outputPath = resolve(
    outputDirectory,
    ...normalizedArchivePath.split("/"),
  );

  if (
    outputPath !== outputDirectory &&
    !outputPath.startsWith(`${outputDirectory}${sep}`)
  ) {
    throw new Error(`Unsafe KiCad archive path: ${archivePath}`);
  }

  return outputPath;
}
