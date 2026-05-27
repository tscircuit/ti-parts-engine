import {
  DEFAULT_BASE_URL,
  DEFAULT_KICAD_VERSION,
  createUltraLibrarianBridgeClient,
  describeSearchResult,
} from "../lib/ultra-librarian-bridge-client";
import {
  DEFAULT_IMPORTS_ROOT,
  assertKicadArchiveSummary,
  createArchiveRunDirectory,
  extractArchiveEntries,
  loadKicadArchive,
  summarizeKicadArchive,
  writeArchiveToFile,
} from "../lib/kicad-archive";

const LM358_MPN = "LM358";
const partnerToken = process.env.PARTNER_TOKEN;
const baseUrl = process.env.BASE_URL ?? DEFAULT_BASE_URL;

if (!partnerToken) {
  throw new Error(
    "PARTNER_TOKEN is required. Add it to .env or .env.local before running this script.",
  );
}

const client = createUltraLibrarianBridgeClient({
  partnerToken,
  baseUrl,
  logger: console,
});

const runRoot = await createArchiveRunDirectory(
  DEFAULT_IMPORTS_ROOT,
  LM358_MPN,
);
console.log(`Writing imported artifacts to: ${runRoot}`);

const searchResponse = await client.searchParts({
  query: LM358_MPN,
  exactOnly: true,
  limit: 1,
});

if (searchResponse.results.length === 0) {
  throw new Error(`Search succeeded but returned no ${LM358_MPN} results.`);
}

console.log(
  `Search returned ${searchResponse.results.length} result(s); first result: ${describeSearchResult(searchResponse.results[0])}`,
);

const zipPath = `${runRoot}/${LM358_MPN}_KiCADv${DEFAULT_KICAD_VERSION}.zip`;
const archiveResponse = await client.downloadKicadArchive({
  mpn: LM358_MPN,
  version: DEFAULT_KICAD_VERSION,
});

await writeArchiveToFile(archiveResponse.archiveBuffer, zipPath);

const archive = await loadKicadArchive(archiveResponse.archiveBuffer);
const archiveSummary = summarizeKicadArchive(archive);
assertKicadArchiveSummary(archiveSummary);

const extractedRoot = `${runRoot}/extracted`;
await extractArchiveEntries(
  archive,
  archiveSummary.symbolEntries,
  extractedRoot,
);
await extractArchiveEntries(
  archive,
  archiveSummary.footprintEntries,
  extractedRoot,
);

console.log(`Saved zip to: ${zipPath}`);
console.log(`Found .kicad_sym entries: ${archiveSummary.symbolEntries.length}`);
console.log(
  `Found .kicad_mod entries: ${archiveSummary.footprintEntries.length}`,
);
console.log(`Example symbol: ${archiveSummary.symbolEntries[0]}`);
console.log(`Example footprint: ${archiveSummary.footprintEntries[0]}`);
console.log(`Extracted matching KiCad files under: ${extractedRoot}`);
