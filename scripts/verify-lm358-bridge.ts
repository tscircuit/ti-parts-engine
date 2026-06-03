import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import {
  DEFAULT_KICAD_VERSION,
  TiPartsEngine,
  readKicadArchive,
} from "../index";
import { extractKicadArchiveFiles } from "../lib/kicad-archive/extractKicadArchiveFiles.ts";

const BASE_URL = "https://situations-build-tommy-integrate.trycloudflare.com";
const PART_MPN = "LM358";
const OUTPUT_ROOT = "imports";

await loadLocalEnvFiles([".env", ".env.local"]);

const partnerToken = getRequiredEnv("PARTNER_TOKEN");
const outputDirectory = await createOutputDirectory();
const zipPath = join(outputDirectory, `${PART_MPN}_KiCADv6.zip`);
const extractedDirectory = join(outputDirectory, "extracted");

const tiPartsEngine = new TiPartsEngine({
  partnerToken,
  baseUrl: BASE_URL,
});

console.log(`Writing imported artifacts to: ${outputDirectory}`);
console.log("GET /v1/parts/search?q=LM358&exact_only=true&limit=1");

const searchResponse = await tiPartsEngine.searchParts({
  query: PART_MPN,
  exactOnly: true,
  limit: 1,
});
const firstResult = searchResponse.results[0];

if (!firstResult) {
  throw new Error("LM358 search returned no results.");
}

console.log(`Search returned ${searchResponse.results.length} result(s).`);
console.log(
  `First result: ${firstResult.mpn ?? firstResult.manufacturer_part_number ?? firstResult.part_number ?? firstResult.name ?? "<unknown>"}`,
);
console.log("GET /v1/export/kicad?mpn=LM358&version=6");

const archiveResponse = await tiPartsEngine.downloadKicadArchive({
  mpn: PART_MPN,
  version: DEFAULT_KICAD_VERSION,
});

await mkdir(outputDirectory, { recursive: true });
await writeFile(zipPath, toUint8Array(archiveResponse.archiveBuffer));
console.log(`Saved zip to: ${zipPath}`);

const archiveSummary = await readKicadArchive(archiveResponse.archiveBuffer);

if (!archiveSummary.hasSymbols || !archiveSummary.hasFootprints) {
  throw new Error(
    `Expected at least one .kicad_sym and one .kicad_mod, found ${archiveSummary.symbolEntries.length} symbol(s) and ${archiveSummary.footprintEntries.length} footprint(s).`,
  );
}

const extraction = await extractKicadArchiveFiles({
  archiveBuffer: archiveResponse.archiveBuffer,
  outputDirectory: extractedDirectory,
});

console.log(`Found .kicad_sym entries: ${archiveSummary.symbolEntries.length}`);
console.log(
  `Found .kicad_mod entries: ${archiveSummary.footprintEntries.length}`,
);
console.log(`Example symbol: ${archiveSummary.symbolEntries[0]?.path}`);
console.log(`Example footprint: ${archiveSummary.footprintEntries[0]?.path}`);
console.log(
  `Extracted ${extraction.extractedFiles.length} matching KiCad file(s) under: ${extractedDirectory}`,
);

async function loadLocalEnvFiles(envFilePaths: string[]) {
  const existingEnvNames = new Set(Object.keys(Bun.env));

  for (const envFilePath of envFilePaths) {
    if (!existsSync(envFilePath)) continue;

    const envFile = Bun.file(envFilePath);
    const envText = await envFile.text();
    for (const line of envText.split(/\r?\n/)) {
      const parsedEntry = parseEnvLine(line);
      if (!parsedEntry) continue;

      const [name, value] = parsedEntry;
      if (existingEnvNames.has(name) && Bun.env[name]?.trim()) {
        continue;
      }

      Bun.env[name] = value;
    }
  }
}

function parseEnvLine(line: string): [string, string] | null {
  const trimmedLine = line.trim();
  if (!trimmedLine || trimmedLine.startsWith("#")) return null;

  const equalsIndex = trimmedLine.indexOf("=");
  if (equalsIndex === -1) return null;

  const name = trimmedLine.slice(0, equalsIndex).trim();
  const rawValue = trimmedLine.slice(equalsIndex + 1).trim();
  if (!name) return null;

  return [name, unwrapEnvValue(rawValue)];
}

function unwrapEnvValue(value: string) {
  const quote = value[0];
  if (
    quote &&
    (quote === "'" || quote === '"') &&
    value.endsWith(quote) &&
    value.length >= 2
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function getRequiredEnv(name: string) {
  const value = Bun.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}. Add it to .env.local before running.`);
  }
  return value;
}

async function createOutputDirectory() {
  const suffix = Math.random().toString(36).slice(2, 8);
  const outputDirectory = resolve(OUTPUT_ROOT, `lm358-${suffix}`);

  await mkdir(outputDirectory, { recursive: true });

  return outputDirectory;
}

function toUint8Array(archiveBytes: ArrayBuffer | Uint8Array) {
  return archiveBytes instanceof Uint8Array
    ? archiveBytes
    : new Uint8Array(archiveBytes);
}
