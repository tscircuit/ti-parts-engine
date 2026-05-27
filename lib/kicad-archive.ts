import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve, sep } from "node:path";

import JSZip from "jszip";

export const DEFAULT_IMPORTS_ROOT = resolve(process.cwd(), "imports");

export interface KicadArchiveSummary {
  entryNames: string[];
  symbolEntries: string[];
  footprintEntries: string[];
}

export async function createArchiveRunDirectory(
  tempRoot: string,
  runLabel: string,
) {
  const sanitizedRunLabel = sanitizeRunLabel(runLabel);
  await mkdir(tempRoot, { recursive: true });
  return await mkdtemp(join(tempRoot, `${sanitizedRunLabel}-`));
}

export async function writeArchiveToFile(
  archiveBuffer: Buffer,
  destinationPath: string,
) {
  await mkdir(dirname(destinationPath), { recursive: true });
  await writeFile(destinationPath, archiveBuffer);
}

export async function loadKicadArchive(
  archiveBuffer: Buffer | Uint8Array | ArrayBuffer,
) {
  return await JSZip.loadAsync(archiveBuffer);
}

export function summarizeKicadArchive(archive: JSZip): KicadArchiveSummary {
  const entryNames = Object.values(archive.files)
    .filter((entry) => !entry.dir)
    .map((entry) => entry.name);

  return {
    entryNames,
    symbolEntries: entryNames.filter((name) => name.endsWith(".kicad_sym")),
    footprintEntries: entryNames.filter((name) => name.endsWith(".kicad_mod")),
  };
}

export function assertKicadArchiveSummary(summary: KicadArchiveSummary) {
  if (summary.symbolEntries.length > 0 && summary.footprintEntries.length > 0) {
    return;
  }

  throw new Error(
    [
      "The KiCad zip did not contain the expected symbol and footprint files.",
      `Found .kicad_sym entries: ${summary.symbolEntries.length}`,
      `Found .kicad_mod entries: ${summary.footprintEntries.length}`,
    ].join("\n"),
  );
}

export async function extractArchiveEntries(
  archive: JSZip,
  entryNames: string[],
  extractionRoot: string,
) {
  for (const entryName of entryNames) {
    const zipEntry = archive.file(entryName);
    if (!zipEntry) {
      continue;
    }

    const destinationPath = resolveZipEntryPath(extractionRoot, entryName);
    await mkdir(dirname(destinationPath), { recursive: true });
    const content = await zipEntry.async("uint8array");
    await writeFile(destinationPath, content);
  }
}

export function resolveZipEntryPath(rootDir: string, entryName: string) {
  const safeRelativePath = entryName
    .split(/[\\/]+/)
    .filter(
      (segment) => segment.length > 0 && segment !== "." && segment !== "..",
    )
    .join(sep);
  const targetPath = resolve(rootDir, safeRelativePath);
  const resolvedRoot = resolve(rootDir);

  if (
    targetPath !== resolvedRoot &&
    !targetPath.startsWith(`${resolvedRoot}${sep}`)
  ) {
    throw new Error(
      `Refusing to extract entry outside temp directory: ${basename(entryName)}`,
    );
  }

  return targetPath;
}

export function sanitizeRunLabel(runLabel: string) {
  const normalizedLabel = runLabel
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (normalizedLabel.length === 0) {
    throw new Error(
      "runLabel must include at least one alphanumeric character.",
    );
  }

  return normalizedLabel;
}
