import React from "react";
import { expect, test } from "bun:test";
import type { PlatformConfig } from "@tscircuit/props";
import { RootCircuit } from "tscircuit";

import { createTiFootprintLibrary } from "../index";
import { getTestServer } from "./fixtures/get-test-server";

test('platformConfig.footprintLibraryMap loads footprint="ti:LM358"', async () => {
  const { fakeUlProxyUrl, server, capturedRequests } = await getTestServer();

  try {
    const platformConfig: PlatformConfig = {
      footprintLibraryMap: createTiFootprintLibrary({
        partnerToken: "secret-token",
        baseUrl: fakeUlProxyUrl,
      }),
    };
    const circuit = new RootCircuit({
      platform: platformConfig,
    });

    circuit.add(
      <board width="20mm" height="20mm">
        <chip name="U1" footprint="ti:LM358" />
      </board>,
    );

    await circuit.renderUntilSettled();

    const smtPads = circuit
      .getCircuitJson()
      .filter((element) => element.type === "pcb_smtpad");
    const platedHoles = circuit
      .getCircuitJson()
      .filter((element) => element.type === "pcb_plated_hole");

    expect(smtPads.length + platedHoles.length).toBeGreaterThan(0);
    expect(capturedRequests).toHaveLength(1);
    expect(capturedRequests[0]?.pathname).toBe("/v1/export/kicad");
    expect(capturedRequests[0]?.search).toBe("?mpn=LM358&version=6");
  } finally {
    await server.stop(true);
  }
});
