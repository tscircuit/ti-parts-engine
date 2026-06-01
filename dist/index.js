import {
  DEFAULT_BASE_URL,
  DEFAULT_KICAD_VERSION,
  TiPartsEngine,
  createTiFootprintLibrary,
  getKicadArchiveEntryKind,
  readFirstKicadModFromArchive
} from "./chunk-YQYM63BV.js";

// lib/kicad-archive/extractKicadArchiveFiles.ts
import JSZip from "jszip";
import { mkdir, writeFile } from "fs/promises";
import { dirname, resolve, sep } from "path";
import { basename, isAbsolute, normalize } from "path/posix";

// lib/kicad-archive/createKicadArchiveSummary.ts
function createKicadArchiveSummary(entries) {
  const symbolEntries = entries.filter((entry) => entry.kind === "symbol");
  const footprintEntries = entries.filter(
    (entry) => entry.kind === "footprint"
  );
  return {
    entries,
    symbolEntries,
    footprintEntries,
    hasSymbols: symbolEntries.length > 0,
    hasFootprints: footprintEntries.length > 0
  };
}

// lib/kicad-archive/extractKicadArchiveFiles.ts
async function extractKicadArchiveFiles(request) {
  const zipFile = await JSZip.loadAsync(request.archiveBuffer);
  const outputDirectory = resolve(request.outputDirectory);
  const entries = [];
  const extractedFiles = [];
  for (const zipEntry of Object.values(zipFile.files)) {
    if (zipEntry.dir) continue;
    const kind = getKicadArchiveEntryKind(zipEntry.name);
    if (!kind) continue;
    const archivePath = getSafeArchivePath(zipEntry);
    const outputPath = getSafeOutputPath(outputDirectory, archivePath);
    const entry = {
      path: archivePath,
      fileName: basename(archivePath),
      kind
    };
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(
      outputPath,
      Buffer.from(await zipEntry.async("uint8array"))
    );
    entries.push(entry);
    extractedFiles.push({ ...entry, outputPath });
  }
  const summary = createKicadArchiveSummary(
    entries.sort(
      (leftEntry, rightEntry) => leftEntry.path.localeCompare(rightEntry.path)
    )
  );
  return {
    ...summary,
    extractedFiles: extractedFiles.sort(
      (leftFile, rightFile) => leftFile.path.localeCompare(rightFile.path)
    )
  };
}
function getSafeArchivePath(zipEntry) {
  const unsafeOriginalName = zipEntry.unsafeOriginalName;
  if (unsafeOriginalName) {
    assertSafeArchivePath(unsafeOriginalName);
  }
  assertSafeArchivePath(zipEntry.name);
  return zipEntry.name;
}
function assertSafeArchivePath(archivePath) {
  const normalizedArchivePath = normalize(archivePath);
  if (archivePath.includes("\\") || /^[a-zA-Z]:/.test(archivePath) || isAbsolute(normalizedArchivePath) || normalizedArchivePath === ".." || normalizedArchivePath.startsWith("../")) {
    throw new Error(`Unsafe KiCad archive path: ${archivePath}`);
  }
}
function getSafeOutputPath(outputDirectory, archivePath) {
  const normalizedArchivePath = normalize(archivePath);
  assertSafeArchivePath(archivePath);
  const outputPath = resolve(
    outputDirectory,
    ...normalizedArchivePath.split("/")
  );
  if (outputPath !== outputDirectory && !outputPath.startsWith(`${outputDirectory}${sep}`)) {
    throw new Error(`Unsafe KiCad archive path: ${archivePath}`);
  }
  return outputPath;
}

// lib/kicad-archive/readKicadArchive.ts
import JSZip2 from "jszip";
import { basename as basename2 } from "path/posix";
async function readKicadArchive(archiveBuffer) {
  const zipFile = await JSZip2.loadAsync(archiveBuffer);
  const entries = Object.values(zipFile.files).filter((zipEntry) => !zipEntry.dir).flatMap((zipEntry) => {
    const kind = getKicadArchiveEntryKind(zipEntry.name);
    if (!kind) return [];
    return [
      {
        path: zipEntry.name,
        fileName: basename2(zipEntry.name),
        kind
      }
    ];
  }).sort(
    (leftEntry, rightEntry) => leftEntry.path.localeCompare(rightEntry.path)
  );
  return createKicadArchiveSummary(entries);
}

// lib/ti-parts-engine/createTiPlatformPartsEngine.ts
var createTiPlatformPartsEngine = (options) => new TiPartsEngine(options);

// lib/ti-parts-engine/createTiPlatformConfig.ts
var createTiPlatformConfig = (options) => ({
  partsEngine: createTiPlatformPartsEngine(options),
  footprintLibraryMap: createTiFootprintLibrary(options)
});

// lib/ti-parts-engine/index.ts
var createTiPartsEngine = (options) => new TiPartsEngine(options);
export {
  DEFAULT_BASE_URL,
  DEFAULT_KICAD_VERSION,
  TiPartsEngine,
  createTiFootprintLibrary,
  createTiPartsEngine,
  createTiPlatformConfig,
  createTiPlatformPartsEngine,
  extractKicadArchiveFiles,
  getKicadArchiveEntryKind,
  readFirstKicadModFromArchive,
  readKicadArchive
};
//# sourceMappingURL=index.js.map