import type { KicadArchiveEntry, KicadArchiveSummary } from "./types";

export function createKicadArchiveSummary(
  entries: KicadArchiveEntry[],
): KicadArchiveSummary {
  const symbolEntries = entries.filter((entry) => entry.kind === "symbol");
  const footprintEntries = entries.filter(
    (entry) => entry.kind === "footprint",
  );

  return {
    entries,
    symbolEntries,
    footprintEntries,
    hasSymbols: symbolEntries.length > 0,
    hasFootprints: footprintEntries.length > 0,
  };
}
