import { expect, test } from "bun:test";
import JSZip from "jszip";

import {
  DEFAULT_KICAD_VERSION,
  createTiFootprintLibrary,
} from "../footprint-library";

test("footprint-library entrypoint exposes a working TI footprint loader", async () => {
  expect(DEFAULT_KICAD_VERSION).toBe(6);

  const archive = new JSZip();
  archive.file(
    "KiCADv6/footprints.pretty/MSP430_Test.kicad_mod",
    `(footprint "MSP430_Test"
  (layer "F.Cu")
  (attr smd)
  (pad "1" smd rect (at -0.65 0 0) (size 0.5 1.1) (layers "F.Cu" "F.Paste" "F.Mask"))
)`,
  );
  const archiveBuffer = await archive.generateAsync({ type: "uint8array" });

  const footprintLibraryMap = createTiFootprintLibrary({
    partnerToken: "secret-token",
    fetch: async () =>
      new Response(toArrayBuffer(archiveBuffer), {
        status: 200,
        headers: { "content-type": "application/zip" },
      }),
  });

  expect(typeof footprintLibraryMap.ti).toBe("function");
  expect(
    (await footprintLibraryMap.ti("MSP430")).footprintCircuitJson.some(
      (element: { type?: string }) => element.type === "pcb_smtpad",
    ),
  ).toBe(true);
});

const toArrayBuffer = (archiveBytes: Uint8Array) =>
  Uint8Array.from(archiveBytes).buffer;
