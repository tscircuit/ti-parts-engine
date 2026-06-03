import { expect, test } from "bun:test";
import JSZip from "jszip";
import { mkdtemp, readFile, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

import {
  extractKicadArchiveFiles,
  readFirstKicadModFromArchive,
  readKicadArchive,
} from "../index";

test("kicad archive helper finds and extracts symbol and footprint files", async () => {
  const archive = new JSZip();
  archive.file("KiCADv6/device.kicad_sym", "(kicad_symbol_lib)");
  archive.file("KiCADv6/footprints.pretty/SOIC-8.kicad_mod", "(footprint)");
  archive.file("KiCADv6/readme.txt", "ignored");

  const archiveBuffer = Buffer.from(
    await archive.generateAsync({ type: "uint8array" }),
  );
  const outputDirectory = await mkdtemp(join(tmpdir(), "ti-kicad-archive-"));

  try {
    const summary = await readKicadArchive(archiveBuffer);

    expect(summary.hasSymbols).toBe(true);
    expect(summary.hasFootprints).toBe(true);
    expect(summary.symbolEntries.map((entry) => entry.path)).toEqual([
      "KiCADv6/device.kicad_sym",
    ]);
    expect(summary.footprintEntries.map((entry) => entry.path)).toEqual([
      "KiCADv6/footprints.pretty/SOIC-8.kicad_mod",
    ]);
    expect(await readFirstKicadModFromArchive(archiveBuffer)).toBe(
      "(footprint)",
    );

    const extraction = await extractKicadArchiveFiles({
      archiveBuffer,
      outputDirectory,
    });

    expect(extraction.extractedFiles.map((file) => file.path)).toEqual([
      "KiCADv6/device.kicad_sym",
      "KiCADv6/footprints.pretty/SOIC-8.kicad_mod",
    ]);
    expect(
      await readFile(join(outputDirectory, "KiCADv6/device.kicad_sym"), "utf8"),
    ).toBe("(kicad_symbol_lib)");
    expect(
      await readFile(
        join(outputDirectory, "KiCADv6/footprints.pretty/SOIC-8.kicad_mod"),
        "utf8",
      ),
    ).toBe("(footprint)");
  } finally {
    await rm(outputDirectory, { recursive: true, force: true });
  }
});
