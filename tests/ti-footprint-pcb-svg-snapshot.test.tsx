import { expect, test } from "bun:test";
import "bun-match-svg";
import {
  convertCircuitJsonToPcbSvg,
  convertCircuitJsonToSchematicSvg,
} from "circuit-to-svg";
import { RootCircuit } from "tscircuit";

import { createTiPlatformConfig } from "../index";
import { getTestServer } from "./fixtures/get-test-server";

test('circuit-to-svg snapshot for footprint="ti:LM358"', async () => {
  const { fakeUlProxyUrl, server } = await getTestServer();

  try {
    const circuit = new RootCircuit({
      platform: createTiPlatformConfig({
        partnerToken: "secret-token",
        // Test against the cors proxy, comment this out
        baseUrl: fakeUlProxyUrl,
      }),
    });

    circuit.add(
      <board width="20mm" height="20mm">
        <chip name="U1" footprint="ti:LM358" />
      </board>,
    );

    await circuit.renderUntilSettled();

    const pcbSvg = convertCircuitJsonToPcbSvg(circuit.getCircuitJson());
    const schSvg = convertCircuitJsonToSchematicSvg(circuit.getCircuitJson());

    expect(pcbSvg).toContain("<svg");
    expect(pcbSvg).toContain("pcb_plated_hole");
    await expect(pcbSvg).toMatchSvgSnapshot(import.meta.path, "ti-LM358-pcb");
    await expect(schSvg).toMatchSvgSnapshot(import.meta.path, "ti-LM358-sch");
  } finally {
    await server.stop(true);
  }
});
