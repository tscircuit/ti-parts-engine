import { describe, expect, test } from "bun:test";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import JSZip from "jszip";

import {
  assertKicadArchiveSummary,
  createKicadSymbolEntryPathResolver,
  extractArchiveEntries,
  loadKicadArchive,
  resolveZipEntryPath,
  sanitizeFileStem,
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

  test("createKicadSymbolEntryPathResolver replaces timestamp symbol names", () => {
    const resolveEntryPath = createKicadSymbolEntryPathResolver("LM358");

    expect(resolveEntryPath("KiCADv6/2026-05-27_18-09-37.kicad_sym", 0)).toBe(
      "KiCADv6/LM358.kicad_sym",
    );
    expect(resolveEntryPath("KiCADv6/2026-05-27_18-09-38.kicad_sym", 1)).toBe(
      "KiCADv6/LM358-2.kicad_sym",
    );
  });

  test("extractArchiveEntries can write a symbol with a stable filename", async () => {
    const zip = new JSZip();
    zip.file("KiCADv6/2026-05-27_18-09-37.kicad_sym", "symbol");

    const archive = await loadKicadArchive(
      await zip.generateAsync({ type: "nodebuffer" }),
    );
    const tempRoot = await mkdtemp(join(tmpdir(), "ti-parts-engine-"));
    const extractionRoot = join(tempRoot, "extracted");

    await extractArchiveEntries(
      archive,
      ["KiCADv6/2026-05-27_18-09-37.kicad_sym"],
      extractionRoot,
      {
        resolveEntryPath: createKicadSymbolEntryPathResolver("LM358"),
      },
    );

    const extractedContent = await readFile(
      join(extractionRoot, "KiCADv6", "LM358.kicad_sym"),
      "utf8",
    );
    expect(extractedContent).toBe("symbol");
  });

  test("sanitizeRunLabel normalizes mixed input into a safe prefix", () => {
    expect(sanitizeRunLabel(" LM358 Bridge Check ")).toBe("lm358-bridge-check");
  });

  test("sanitizeFileStem keeps a stable filename-safe symbol stem", () => {
    expect(sanitizeFileStem("LM358")).toBe("LM358");
    expect(sanitizeFileStem("LM358 / Symbol")).toBe("LM358_Symbol");
  });
});
