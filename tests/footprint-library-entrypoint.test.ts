import { expect, test } from "bun:test";
import JSZip from "jszip";

import { DEFAULT_KICAD_VERSION, createTiFootprintLibrary } from "../index";

test("root entrypoint exposes a working TI footprint loader", async () => {
  expect(DEFAULT_KICAD_VERSION).toBe(6);

  const archive = new JSZip();
  archive.file(
    "KiCADv6/LM358_Test.kicad_sym",
    `(kicad_symbol_lib
  (version 20211014)
  (generator ti-parts-engine-test)
  (symbol "LM358_Test"
    (property "Reference" "U" (at 0 0 0)
      (effects (font (size 1.27 1.27))))
    (property "Value" "LM358" (at 0 -2.54 0)
      (effects (font (size 1.27 1.27))))
    (symbol "LM358_Test_0_1"
      (pin input line (at -5.08 0 0) (length 2.54)
        (name "IN+" (effects (font (size 1.27 1.27))))
        (number "1" (effects (font (size 1.27 1.27)))))
    )
  )
)`,
  );
  archive.file(
    "KiCADv6/footprints.pretty/LM358_Test.kicad_mod",
    `(footprint "LM358_Test"
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
  const result = await footprintLibraryMap.ti("LM358");

  expect(
    result.footprintCircuitJson.some(
      (element: { type?: string }) => element.type === "pcb_smtpad",
    ),
  ).toBe(true);
  expect(
    result.footprintCircuitJson.some(
      (element: { type?: string }) => element.type === "schematic_port",
    ),
  ).toBe(true);
});

const toArrayBuffer = (archiveBytes: Uint8Array) =>
  Uint8Array.from(archiveBytes).buffer;
