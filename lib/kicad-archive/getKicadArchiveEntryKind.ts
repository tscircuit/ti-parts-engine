import type { KicadArchiveEntryKind } from "./types";

export function getKicadArchiveEntryKind(
  archivePath: string,
): KicadArchiveEntryKind | null {
  const lowerCasePath = archivePath.toLowerCase();

  if (lowerCasePath.endsWith(".kicad_sym")) {
    return "symbol";
  }

  if (lowerCasePath.endsWith(".kicad_mod")) {
    return "footprint";
  }

  return null;
}
