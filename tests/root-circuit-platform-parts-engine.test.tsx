import React from "react";
import { expect, test } from "bun:test";
import { RootCircuit } from "tscircuit";

import { createTiPlatformPartsEngine } from "../index";
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
