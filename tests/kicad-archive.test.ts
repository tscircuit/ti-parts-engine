import { describe, expect, test } from "bun:test";

import JSZip from "jszip";

import {
  assertKicadArchiveSummary,
  loadKicadArchive,
  resolveZipEntryPath,
  sanitizeRunLabel,
  summarizeKicadArchive,
} from "../lib/kicad-archive";

describe("kicad-archive", () => {
  test("summarizeKicadArchive finds symbol and footprint entries", async () => {
    const zip = new JSZip();
    zip.file("KiCADv6/LM358.kicad_sym", "symbol");
    zip.file("KiCADv6/footprints.pretty/LM358.kicad_mod", "footprint");

    const archive = await loadKicadArchive(
      await zip.generateAsync({ type: "nodebuffer" }),
    );
    const summary = summarizeKicadArchive(archive);

    expect(summary.symbolEntries).toEqual(["KiCADv6/LM358.kicad_sym"]);
    expect(summary.footprintEntries).toEqual([
      "KiCADv6/footprints.pretty/LM358.kicad_mod",
    ]);
    expect(() => assertKicadArchiveSummary(summary)).not.toThrow();
  });

  test("assertKicadArchiveSummary throws when required entries are missing", () => {
    expect(() =>
      assertKicadArchiveSummary({
        entryNames: ["KiCADv6/LM358.kicad_sym"],
        symbolEntries: ["KiCADv6/LM358.kicad_sym"],
        footprintEntries: [],
      }),
    ).toThrow("The KiCad zip did not contain the expected symbol");
  });

  test("resolveZipEntryPath strips traversal segments", () => {
    expect(resolveZipEntryPath("/tmp/out", "../KiCADv6/test.kicad_sym")).toBe(
      "/tmp/out/KiCADv6/test.kicad_sym",
    );
  });

  test("sanitizeRunLabel normalizes mixed input into a safe prefix", () => {
    expect(sanitizeRunLabel(" LM358 Bridge Check ")).toBe("lm358-bridge-check");
  });
});
