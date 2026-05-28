import { expect, test } from "bun:test";
import JSZip from "jszip";

import { extractKicadArchiveFiles } from "../index";

test("kicad archive extraction rejects unsafe zip paths", async () => {
  const archive = new JSZip();
  archive.file("/outside.kicad_sym", "(kicad_symbol_lib)");
  const archiveBuffer = Buffer.from(
    await archive.generateAsync({ type: "uint8array" }),
  );

  expect(
    extractKicadArchiveFiles({
      archiveBuffer,
      outputDirectory: "/tmp/ti-parts-engine-kicad-test",
    }),
  ).rejects.toThrow("Unsafe KiCad archive path");
});

test("kicad archive extraction rejects paths JSZip sanitizes", async () => {
  const archive = new JSZip();
  archive.file("../part.kicad_sym", "(kicad_symbol_lib)");
  const archiveBuffer = Buffer.from(
    await archive.generateAsync({ type: "uint8array" }),
  );

  expect(
    extractKicadArchiveFiles({
      archiveBuffer,
      outputDirectory: "/tmp/ti-parts-engine-kicad-test",
    }),
  ).rejects.toThrow("Unsafe KiCad archive path");
});
