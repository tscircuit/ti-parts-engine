import React from "react";
import { expect, test } from "bun:test";
import JSZip from "jszip";
import { RootCircuit } from "tscircuit";

import { createTiPlatformConfig, createTiPlatformPartsEngine } from "../index";
import { getTestServer } from "./fixtures/get-test-server";

test("RootCircuit uses the TI parts engine from platform config", async () => {
  const { url, server, capturedRequests } = await getTestServer();
  const circuit = new RootCircuit({
    platform: {
      partsEngine: createTiPlatformPartsEngine({
        partnerToken: "secret-token",
        baseUrl: url,
      }),
    },
  });

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        manufacturerPartNumber="LM358"
        footprint="dip8"
        pinLabels={{
          pin1: "OUT1",
          pin2: "IN1_NEG",
          pin3: "IN1_POS",
          pin4: "VEE",
          pin5: "IN2_POS",
          pin6: "IN2_NEG",
          pin7: "OUT2",
          pin8: "VCC",
        }}
      />
    </board>,
  );

  await circuit.renderUntilSettled();
  await server.stop(true);

  const lm358SourceComponent = circuit
    .getCircuitJson()
    .find(
      (element) =>
        element.type === "source_component" &&
        element.manufacturer_part_number === "LM358",
    );

  expect(lm358SourceComponent).toMatchObject({
    supplier_part_numbers: {
      ti: ["LM358"],
    },
  });
  expect(capturedRequests).toHaveLength(1);
  expect(capturedRequests[0]?.pathname).toBe("/v1/parts/search");
  expect(capturedRequests[0]?.search).toBe("?q=LM358&exact_only=true&limit=1");
});

test('RootCircuit can load footprint="ti:MSP430" through the TI footprint library', async () => {
  const archive = new JSZip();
  archive.file(
    "KiCADv6/footprints.pretty/MSP430_Test.kicad_mod",
    `(footprint "MSP430_Test"
  (layer "F.Cu")
  (attr smd)
  (fp_text reference "REF**" (at 0 -1.5 0) (layer "F.SilkS")
    (effects (font (size 1 1) (thickness 0.15))))
  (fp_text value "MSP430_Test" (at 0 1.5 0) (layer "F.Fab")
    (effects (font (size 1 1) (thickness 0.15))))
  (pad "1" smd rect (at -0.65 0 0) (size 0.5 1.1) (layers "F.Cu" "F.Paste" "F.Mask"))
  (pad "2" smd rect (at 0.65 0 0) (size 0.5 1.1) (layers "F.Cu" "F.Paste" "F.Mask"))
)`,
  );
  const archiveBuffer = Buffer.from(
    await archive.generateAsync({ type: "uint8array" }),
  );
  const { url, server, capturedRequests } = await getTestServer({
    archiveResponseBody: archiveBuffer,
  });
  const circuit = new RootCircuit({
    platform: createTiPlatformConfig({
      partnerToken: "secret-token",
      baseUrl: url,
    }),
  });

  circuit.add(
    <board width="20mm" height="20mm">
      <chip name="U1" footprint="ti:MSP430" />
    </board>,
  );

  await circuit.renderUntilSettled();
  await server.stop(true);

  const smtPads = circuit
    .getCircuitJson()
    .filter((element) => element.type === "pcb_smtpad");

  expect(smtPads.length).toBeGreaterThan(0);
  expect(capturedRequests).toHaveLength(1);
  expect(capturedRequests[0]?.pathname).toBe("/v1/export/kicad");
  expect(capturedRequests[0]?.search).toBe("?mpn=MSP430&version=6");
});
