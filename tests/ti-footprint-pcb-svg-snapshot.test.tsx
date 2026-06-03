import React from "react";
import { expect, test } from "bun:test";
import "bun-match-svg";
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg";
import JSZip from "jszip";
import { RootCircuit } from "tscircuit";

import { createTiPlatformConfig } from "../index";
import { getTestServer } from "./fixtures/get-test-server";

const LM358_TEST_FOOTPRINT = `(footprint "DIP8_300"
  (version 20240108)
  (generator "tscircuit-test")
  (layer "F.Cu")
  (attr through_hole)
  (fp_text reference "\${REFERENCE}" (at 3.81 -2.33 0) (layer "F.SilkS")
    (effects (font (size 1 1) (thickness 0.15))))
  (fp_text value "DIP8_300" (at 3.81 9.95 0) (layer "F.Fab")
    (effects (font (size 1 1) (thickness 0.15))))
  (fp_line (start 0.635 -1.27) (end 6.985 -1.27) (stroke (width 0.12) (type solid)) (layer "F.SilkS"))
  (fp_line (start 6.985 -1.27) (end 6.985 8.89) (stroke (width 0.12) (type solid)) (layer "F.SilkS"))
  (fp_line (start 6.985 8.89) (end 0.635 8.89) (stroke (width 0.12) (type solid)) (layer "F.SilkS"))
  (fp_line (start 0.635 8.89) (end 0.635 7.62) (stroke (width 0.12) (type solid)) (layer "F.SilkS"))
  (fp_line (start 0.635 6.35) (end 0.635 5.08) (stroke (width 0.12) (type solid)) (layer "F.SilkS"))
  (fp_line (start 0.635 3.81) (end 0.635 2.54) (stroke (width 0.12) (type solid)) (layer "F.SilkS"))
  (fp_line (start 0.635 1.27) (end 0.635 -1.27) (stroke (width 0.12) (type solid)) (layer "F.SilkS"))
  (pad "1" thru_hole rect (at 0 0 0) (size 1.52 1.52) (drill 0.81) (layers "*.Cu" "*.Mask"))
  (pad "2" thru_hole circle (at 0 2.54 0) (size 1.52 1.52) (drill 0.81) (layers "*.Cu" "*.Mask"))
  (pad "3" thru_hole circle (at 0 5.08 0) (size 1.52 1.52) (drill 0.81) (layers "*.Cu" "*.Mask"))
  (pad "4" thru_hole circle (at 0 7.62 0) (size 1.52 1.52) (drill 0.81) (layers "*.Cu" "*.Mask"))
  (pad "5" thru_hole circle (at 7.62 7.62 0) (size 1.52 1.52) (drill 0.81) (layers "*.Cu" "*.Mask"))
  (pad "6" thru_hole circle (at 7.62 5.08 0) (size 1.52 1.52) (drill 0.81) (layers "*.Cu" "*.Mask"))
  (pad "7" thru_hole circle (at 7.62 2.54 0) (size 1.52 1.52) (drill 0.81) (layers "*.Cu" "*.Mask"))
  (pad "8" thru_hole circle (at 7.62 0 0) (size 1.52 1.52) (drill 0.81) (layers "*.Cu" "*.Mask"))
)`;

test('circuit-to-svg snapshot for footprint="ti:LM358"', async () => {
  const archive = new JSZip();
  archive.file(
    "KiCADv6/footprints.pretty/LM358_Test.kicad_mod",
    LM358_TEST_FOOTPRINT,
  );
  const archiveBuffer = await archive.generateAsync({ type: "uint8array" });
  const { url, server } = await getTestServer({
    archiveResponseBody: archiveBuffer,
  });

  try {
    const circuit = new RootCircuit({
      platform: createTiPlatformConfig({
        partnerToken: "secret-token",
        baseUrl: url,
      }),
    });

    circuit.add(
      <board width="20mm" height="20mm">
        <chip name="U1" footprint="ti:LM358" />
      </board>,
    );

    await circuit.renderUntilSettled();

    const pcbSvg = convertCircuitJsonToPcbSvg(circuit.getCircuitJson());

    expect(pcbSvg).toContain("<svg");
    expect(pcbSvg).toContain("pcb_plated_hole");
    await expect(pcbSvg).toMatchSvgSnapshot(import.meta.path, "ti-LM358-pcb");
  } finally {
    await server.stop(true);
  }
});
